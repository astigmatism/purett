<?php

class PureTripleTriad_Database
{
    const NATURAL_TURN_CAP = 30;
    const TURN_INTERVAL_SECONDS = 300;

    public $db;
    private static $sharedDb;
    private static $transactionDepth = 0;
    private static $leaderboardDirty = false;

    public function __construct()
    {
        if (self::$sharedDb) {
            $this->db = self::$sharedDb;
            return;
        }

        $config = new Zend_Config_Ini(APPLICATION_PATH . '/configs/db.ini', 'mysql');
        $host = $this->environment('PURETT_DB_HOST', $config->host);
        $port = $this->environment('PURETT_DB_PORT', $config->port);
        $name = $this->environment('PURETT_DB_NAME', $config->schema);
        $user = $this->environment('PURETT_DB_USER', $config->username);
        $password = $this->environment('PURETT_DB_PASSWORD', $config->password);

        self::$sharedDb = Zend_Db::factory('PDO_MYSQL', array(
            'host' => $host,
            'port' => (int) $port,
            'username' => $user,
            'password' => $password,
            'dbname' => $name,
            'charset' => 'utf8mb4',
            'driver_options' => array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8mb4')
        ));
        $this->db = self::$sharedDb;
    }

    private function environment($name, $fallback)
    {
        $value = getenv($name);
        return ($value === false || $value === '') ? $fallback : $value;
    }

    public function beginTransaction()
    {
        if (self::$transactionDepth === 0) {
            $this->db->beginTransaction();
        }
        self::$transactionDepth++;
    }

    public function commit()
    {
        if (self::$transactionDepth < 1) {
            return;
        }
        self::$transactionDepth--;
        if (self::$transactionDepth === 0) {
            $this->db->commit();
            $this->flushLeaderboardInvalidation();
        }
    }

    public function rollBack()
    {
        if (self::$transactionDepth < 1) {
            return;
        }
        self::$transactionDepth = 0;
        self::$leaderboardDirty = false;
        $this->db->rollBack();
    }

    private function markLeaderboardDirty()
    {
        self::$leaderboardDirty = true;
        if (self::$transactionDepth === 0) {
            $this->flushLeaderboardInvalidation();
        }
    }

    private function flushLeaderboardInvalidation()
    {
        if (!self::$leaderboardDirty) {
            return;
        }

        self::$leaderboardDirty = false;
        try {
            $redis = new PureTripleTriad_Redis();
            $redis->invalidateLeaderboard();
        } catch (Exception $e) {
            // A cache outage must not turn a committed game or deletion into an apparent failure.
            error_log('Leaderboard cache invalidation failed: ' . $e->getMessage());
        }
    }

    public function ping()
    {
        return (int) $this->db->fetchOne('SELECT 1') === 1;
    }

    public function getSchemaVersion()
    {
        return $this->db->fetchOne('SELECT version FROM schema_migrations ORDER BY applied_at DESC LIMIT 1');
    }

    public function getUser($id)
    {
        return $this->db->fetchRow('SELECT * FROM users WHERE idusers = ?', array((int) $id));
    }

    public function getUsers()
    {
        return $this->db->fetchAll('SELECT * FROM users ORDER BY idusers');
    }

    public function getLocalAccountByUsername($username)
    {
        return $this->db->fetchRow(
            'SELECT a.*, u.email, u.wins, u.losses, u.draws, u.deleted_at
             FROM local_accounts a INNER JOIN users u ON u.idusers = a.userid
             WHERE a.username = ?',
            array($username)
        );
    }

    public function getLocalAccountByUserId($userid)
    {
        return $this->db->fetchRow(
            'SELECT a.*, u.email, u.wins, u.losses, u.draws, u.deleted_at
             FROM local_accounts a INNER JOIN users u ON u.idusers = a.userid
             WHERE a.userid = ?',
            array((int) $userid)
        );
    }

    public function createLocalAccount($username, $displayName, $passwordHash, $email, $startingCoins)
    {
        $this->beginTransaction();
        try {
            $this->db->insert('users', array(
                'joined' => new Zend_Db_Expr('UTC_TIMESTAMP()'),
                'email' => ($email === '') ? null : $email
            ));
            $userid = (int) $this->db->lastInsertId();
            if ($userid < 2) {
                throw new RuntimeException('Human account IDs must begin at 2.');
            }

            $this->db->insert('local_accounts', array(
                'userid' => $userid,
                'username' => $username,
                'display_name' => $displayName,
                'password_hash' => $passwordHash,
                'created_at' => new Zend_Db_Expr('UTC_TIMESTAMP()'),
                'updated_at' => new Zend_Db_Expr('UTC_TIMESTAMP()')
            ));
            $this->db->insert('wallets', array('userid' => $userid, 'balance' => (int) $startingCoins));
            $this->db->insert('coin_transactions', array(
                'userid' => $userid,
                'amount' => (int) $startingCoins,
                'balance_after' => (int) $startingCoins,
                'transaction_type' => 'initial_grant',
                'reference_key' => 'registration:' . $userid,
                'details' => 'Standalone starting balance'
            ));
            $this->db->insert('user_turns', array(
                'userid' => $userid,
                'turns' => self::NATURAL_TURN_CAP,
                'last_regenerated_at' => new Zend_Db_Expr('UTC_TIMESTAMP()')
            ));

            $levelSpread = array(1, 1, 2, 2, 3);
            $used = array();
            foreach ($levelSpread as $level) {
                $candidates = $this->db->fetchAll(
                    'SELECT idcards, strength FROM cards WHERE level = ? ORDER BY idcards',
                    array($level)
                );
                shuffle($candidates);
                $selected = null;
                foreach ($candidates as $candidate) {
                    if (!in_array((int) $candidate['idcards'], $used, true)) {
                        $selected = $candidate;
                        break;
                    }
                }
                if (!$selected) {
                    throw new RuntimeException('The card catalog cannot provide a starting hand.');
                }
                $used[] = (int) $selected['idcards'];
                $this->db->insert('usercards', array(
                    'userid' => $userid,
                    'cardid' => (int) $selected['idcards'],
                    'obtained' => new Zend_Db_Expr('UTC_TIMESTAMP()'),
                    'notes' => 'Standalone starting hand.',
                    'inhand' => 1,
                    'strengthrank' => (int) $selected['strength'],
                    'purchased' => 0
                ));
            }

            $this->commit();
            return $this->getLocalAccountByUserId($userid);
        } catch (Exception $e) {
            $this->rollBack();
            throw $e;
        }
    }

    public function createUser($id, $email)
    {
        $this->db->insert('users', array(
            'idusers' => (int) $id,
            'joined' => new Zend_Db_Expr('UTC_TIMESTAMP()'),
            'email' => $email
        ));
    }

    public function removeUser($id)
    {
        $this->beginTransaction();
        try {
            // gamecards also identifies the original card owner. On older
            // installed schemas that relationship used RESTRICT, so delete an
            // active game explicitly before cascading the account itself.
            $this->db->delete('games', array('p1 = ?' => (int) $id));
            $deleted = $this->db->delete('users', array('idusers = ?' => (int) $id));
            if ($deleted > 0) {
                $this->markLeaderboardDirty();
            }
            $this->commit();
            return $deleted;
        } catch (Exception $e) {
            $this->rollBack();
            throw $e;
        }
    }

    public function insertUserCard($userid, $cardid, $notes, $inhand, $strengthrank, $purchased = false)
    {
        $this->db->insert('usercards', array(
            'userid' => (int) $userid,
            'cardid' => (int) $cardid,
            'obtained' => new Zend_Db_Expr('UTC_TIMESTAMP()'),
            'notes' => substr((string) $notes, 0, 255),
            'inhand' => $inhand ? 1 : 0,
            'strengthrank' => (int) $strengthrank,
            'purchased' => $purchased ? 1 : 0
        ));
        return (int) $this->db->lastInsertId();
    }

    public function sendCardtoHand($userid, $usercardid)
    {
        return $this->db->update('usercards', array('inhand' => 1), array(
            'userid = ?' => (int) $userid,
            'idusercards = ?' => (int) $usercardid
        ));
    }

    public function flattenUserHand($userid)
    {
        return $this->db->update('usercards', array('inhand' => 0), array('userid = ?' => (int) $userid));
    }

    public function setExactHand($userid, $usercardids)
    {
        if (count($usercardids) !== 5 || count(array_unique($usercardids)) !== 5) {
            throw new InvalidArgumentException('Exactly five distinct owned cards are required.');
        }

        $placeholders = implode(',', array_fill(0, count($usercardids), '?'));
        $bind = array_merge(array((int) $userid), array_map('intval', $usercardids));
        $owned = (int) $this->db->fetchOne(
            'SELECT COUNT(*) FROM usercards WHERE userid = ? AND idusercards IN (' . $placeholders . ')',
            $bind
        );
        if ($owned !== 5) {
            throw new InvalidArgumentException('One or more selected cards are not owned by this account.');
        }

        $this->beginTransaction();
        try {
            $this->flattenUserHand($userid);
            $this->db->update('usercards', array('inhand' => 1), array(
                'userid = ?' => (int) $userid,
                'idusercards IN (?)' => array_map('intval', $usercardids)
            ));
            $this->commit();
        } catch (Exception $e) {
            $this->rollBack();
            throw $e;
        }
    }

    public function removeUserCard($userid, $usercardid)
    {
        return $this->db->delete('usercards', array(
            'userid = ?' => (int) $userid,
            'idusercards = ?' => (int) $usercardid
        ));
    }

    public function getUserCards($userid)
    {
        return $this->db->fetchAll(
            'SELECT uc.*, c.* FROM usercards uc INNER JOIN cards c ON uc.cardid = c.idcards
             WHERE uc.userid = ? ORDER BY uc.inhand DESC, uc.idusercards',
            array((int) $userid)
        );
    }

    public function insertCard($values)
    {
        $this->db->insert('cards', array(
            'idcards' => (int) $values[0],
            'level' => (int) $values[1],
            'n' => (int) $values[2],
            'e' => (int) $values[3],
            's' => (int) $values[4],
            'w' => (int) $values[5],
            'element' => ($values[6] === 'NULL') ? null : (int) $values[6],
            'image' => $values[7],
            'name' => $values[8],
            'iddeck' => (int) $values[9],
            'strength' => (int) $values[2] + (int) $values[3] + (int) $values[4] + (int) $values[5]
        ));
    }

    public function inGame($userid)
    {
        $game = $this->getGame($userid);
        return $game ? (int) $game['idgames'] : 0;
    }

    public function getGame($userid)
    {
        return $this->db->fetchRow('SELECT * FROM games WHERE p1 = ?', array((int) $userid));
    }

    public function getOwnedActiveGame($gameid, $userid)
    {
        return $this->db->fetchRow(
            'SELECT idgames, p1 FROM games WHERE idgames = ? AND p1 = ?',
            array((int) $gameid, (int) $userid)
        );
    }

    public function getCardsByLevel($level)
    {
        return $this->db->fetchAll('SELECT * FROM cards WHERE level = ? ORDER BY idcards', array((int) $level));
    }

    public function getCardsByStrength($strength)
    {
        return $this->db->fetchAll('SELECT * FROM cards WHERE strength = ? ORDER BY idcards', array((int) $strength));
    }

    public function getCardsUpToLevel($level)
    {
        return $this->db->fetchAll('SELECT * FROM cards WHERE level <= ? ORDER BY idcards', array((int) $level));
    }

    public function getDailyShopCards($userid, $returnCount)
    {
        $maxLevel = (int) $this->db->fetchOne(
            'SELECT COALESCE(MAX(c.level), 0)
             FROM usercards uc INNER JOIN cards c ON c.idcards = uc.cardid
             WHERE uc.userid = ?',
            array((int) $userid)
        );
        if ($maxLevel < 1) {
            return array();
        }

        $cards = $this->getCardsUpToLevel($maxLevel);
        $day = gmdate('Y-m-d');
        usort($cards, function ($a, $b) use ($day) {
            $aHash = sprintf('%u', crc32($day . ':' . $a['idcards']));
            $bHash = sprintf('%u', crc32($day . ':' . $b['idcards']));
            if ($aHash === $bHash) {
                return (int) $a['idcards'] - (int) $b['idcards'];
            }
            return ($aHash < $bHash) ? -1 : 1;
        });
        return array_slice($cards, 0, min(max(0, (int) $returnCount), count($cards)));
    }

    public function getCard($cardid)
    {
        return $this->db->fetchRow('SELECT * FROM cards WHERE idcards = ?', array((int) $cardid));
    }

    public function getCards()
    {
        return $this->db->fetchAll('SELECT * FROM cards ORDER BY idcards');
    }

    public function newGame($userid, $elements, $bonus, $key)
    {
        $this->db->insert('games', array(
            'p1' => (int) $userid,
            'p1score' => 5,
            'p2' => 1,
            'p2score' => 5,
            'elements' => (string) $elements,
            'elementbonus' => 1,
            'created' => new Zend_Db_Expr('UTC_TIMESTAMP()'),
            'victoryclaim' => (int) $bonus,
            'key' => $key,
            'insuddendeath' => 0
        ));
        return (int) $this->db->lastInsertId();
    }

    public function setGame($gameid, $p1score, $p2score, $key)
    {
        return $this->db->update('games', array(
            'p1score' => (int) $p1score,
            'p2score' => (int) $p2score,
            'key' => $key
        ), array('idgames = ?' => (int) $gameid));
    }

    public function setSuddenDeath($gameid, $bool)
    {
        return $this->db->update('games', array('insuddendeath' => $bool ? 1 : 0), array('idgames = ?' => (int) $gameid));
    }

    public function setGameRules($gameid, $rules)
    {
        foreach ($rules as $rule) {
            $this->db->insert('gamerules', array('ruleid' => (int) $rule['idrules'], 'gameid' => (int) $gameid));
        }
    }

    public function getGameRules($gameid)
    {
        return $this->db->fetchAll(
            'SELECT gr.*, r.* FROM gamerules gr INNER JOIN rules r ON gr.ruleid = r.idrules
             WHERE gr.gameid = ? ORDER BY gr.idgamerules',
            array((int) $gameid)
        );
    }

    public function getRules()
    {
        return $this->db->fetchAll('SELECT * FROM rules ORDER BY idrules');
    }

    public function setGameCards($gameid, $cards)
    {
        foreach ($cards as $card) {
            $this->db->insert('gamecards', array(
                'cardid' => (int) $card->cardid,
                'gameid' => (int) $gameid,
                'usercardid' => (int) $card->usercardid,
                'userid' => (int) $card->owner,
                'captured' => (int) $card->captured,
                'position' => ((int) $card->owner === 1) ? -2 : -1
            ));
        }
    }

    public function setGameCard($gamecardid, $position, $captured)
    {
        return $this->db->update('gamecards', array(
            'position' => (int) $position,
            'captured' => (int) $captured
        ), array('idgamecards = ?' => (int) $gamecardid));
    }

    public function setUserGameResult($userid, $win, $loss, $draw)
    {
        $sql = 'UPDATE users SET wins = wins + ?, losses = losses + ?, draws = draws + ? WHERE idusers = ?';
        return $this->db->query($sql, array((int) $win, (int) $loss, (int) $draw, (int) $userid));
    }

    public function setUserRecord($userid, $wins = 0, $losses = 0, $draws = 0)
    {
        return $this->db->update('users', array(
            'wins' => (int) $wins,
            'losses' => (int) $losses,
            'draws' => (int) $draws
        ), array('idusers = ?' => (int) $userid));
    }

    public function getGameCards($gameid)
    {
        return $this->db->fetchAll('SELECT * FROM gamecards WHERE gameid = ? ORDER BY idgamecards', array((int) $gameid));
    }

    public function getGameCard($gamecardid)
    {
        return $this->db->fetchRow('SELECT * FROM gamecards WHERE idgamecards = ?', array((int) $gamecardid));
    }

    public function removeGameCard($gameid, $gamecardid)
    {
        return $this->db->delete('gamecards', array(
            'gameid = ?' => (int) $gameid,
            'idgamecards = ?' => (int) $gamecardid
        ));
    }

    public function setVictoryClaim($gameid, $claim)
    {
        return $this->db->update('games', array('victoryclaim' => (int) $claim), array('idgames = ?' => (int) $gameid));
    }

    public function setGameHistory($userid, $gameid, $p1score, $p2score)
    {
        $path = (int) $userid . '/' . (int) $gameid . '.jsonl';
        $this->db->insert('gamehistory', array(
            'gameid' => (int) $gameid,
            'userid' => (int) $userid,
            'completed' => new Zend_Db_Expr('UTC_TIMESTAMP()'),
            'p1score' => (int) $p1score,
            'p2score' => (int) $p2score,
            'log_path' => $path,
            'is_public' => 0
        ));
        $this->markLeaderboardDirty();
    }

    public function getGameHistory($gameid)
    {
        return $this->db->fetchRow('SELECT * FROM gamehistory WHERE gameid = ?', array((int) $gameid));
    }

    public function getAuthorizedGameHistory($gameid, $userid)
    {
        return $this->db->fetchRow(
            'SELECT * FROM gamehistory WHERE gameid = ? AND (userid = ? OR is_public = 1)',
            array((int) $gameid, (int) $userid)
        );
    }

    public function getLatestGameHistoryForUser($userid)
    {
        return $this->db->fetchRow(
            'SELECT * FROM gamehistory WHERE userid = ? ORDER BY completed DESC, idgamehistory DESC LIMIT 1',
            array((int) $userid)
        );
    }

    public function deleteGame($gameid)
    {
        return $this->db->delete('games', array('idgames = ?' => (int) $gameid));
    }

    public function createPurchase($orderid, $userid, $type, $itemid, $price, $status)
    {
        $this->db->insert('purchases', array(
            'orderid' => $orderid,
            'userid' => (int) $userid,
            'date' => new Zend_Db_Expr('UTC_TIMESTAMP()'),
            'type' => $type,
            'itemid' => (int) $itemid,
            'price' => (int) $price,
            'status' => $status
        ));
    }

    public function getPurchase($orderid)
    {
        return $this->db->fetchRow('SELECT * FROM purchases WHERE orderid = ?', array($orderid));
    }

    public function updatePurchase($orderid, $status)
    {
        return $this->db->update('purchases', array('status' => $status), array('orderid = ?' => $orderid));
    }

    public function purchaseCatalogItem($userid, $type, $itemid, $orderid)
    {
        $userid = (int) $userid;
        $itemid = (int) $itemid;
        $freeEconomy = getenv('PURETT_FREE_ECONOMY') === '1';

        $this->beginTransaction();
        try {
            $existing = $this->db->fetchRow(
                'SELECT * FROM purchases WHERE orderid = ? AND userid = ? FOR UPDATE',
                array($orderid, $userid)
            );
            if ($existing) {
                $result = json_decode($existing['result_json'], true);
                $result['idempotent'] = true;
                $this->commit();
                return $result;
            }

            $wallet = $this->db->fetchRow('SELECT * FROM wallets WHERE userid = ? FOR UPDATE', array($userid));
            if (!$wallet) {
                throw new RuntimeException('Wallet not found.');
            }

            $price = 0;
            $name = '';
            $grantAmount = 0;
            $catalogValue = null;
            $card = null;
            $item = null;

            if ($type === 'card') {
                $card = $this->getCard($itemid);
                if (!$card) {
                    throw new InvalidArgumentException('Unknown card.');
                }
                $gameConfig = new Zend_Config_Ini(APPLICATION_PATH . '/configs/game.ini');
                $available = $this->getDailyShopCards($userid, (int) $gameConfig->shopCardCount);
                $availableIds = array_map(function ($row) {
                    return (int) $row['idcards'];
                }, $available);
                if (!in_array($itemid, $availableIds, true)) {
                    throw new InvalidArgumentException('That card is not in today\'s shop stock.');
                }
                $price = (int) $card['level'] * 2;
                $name = $card['name'];
            } elseif ($type === 'color' || $type === 'turn') {
                $item = $this->db->fetchRow(
                    'SELECT * FROM shopitems WHERE idshopitems = ? AND item_type = ? AND active = 1',
                    array($itemid, $type)
                );
                if (!$item) {
                    throw new InvalidArgumentException('Unknown catalog item.');
                }
                $price = (int) $item['price'];
                $name = $item['name'];
                $grantAmount = (int) $item['grant_amount'];
                $catalogValue = $item['catalog_value'];
            } else {
                throw new InvalidArgumentException('Unknown catalog type.');
            }

            $balance = (int) $wallet['balance'];
            if (!$freeEconomy && $balance < $price) {
                throw new DomainException('Not enough coins.');
            }
            $newBalance = $freeEconomy ? $balance : $balance - $price;

            if ($type === 'card') {
                $this->insertUserCard($userid, $itemid, 'Acquired with local coins.', false, (int) $card['strength'], true);
            } elseif ($type === 'color') {
                $this->db->query(
                    'INSERT IGNORE INTO useroptions (userid, optionid, value, active) VALUES (?, 1, ?, 0)',
                    array($userid, $catalogValue)
                );
                $this->setActiveUserOption($userid, 1, $catalogValue);
            } else {
                $turnRow = $this->db->fetchRow('SELECT * FROM user_turns WHERE userid = ? FOR UPDATE', array($userid));
                if (!$turnRow) {
                    throw new RuntimeException('Turn account not found.');
                }
                $this->db->update('user_turns', array(
                    'turns' => (int) $turnRow['turns'] + $grantAmount,
                    'last_regenerated_at' => new Zend_Db_Expr('UTC_TIMESTAMP()'),
                    'updated_at' => new Zend_Db_Expr('UTC_TIMESTAMP()')
                ), array('userid = ?' => $userid));
            }

            $this->db->update('wallets', array(
                'balance' => $newBalance,
                'updated_at' => new Zend_Db_Expr('UTC_TIMESTAMP()')
            ), array('userid = ?' => $userid));

            $result = array(
                'status' => 'settled',
                'orderid' => $orderid,
                'type' => $type,
                'itemid' => $itemid,
                'name' => $name,
                'price' => $price,
                'balance' => $newBalance,
                'grant' => $grantAmount,
                'color' => ($type === 'color') ? base64_encode($catalogValue) : null,
                'idempotent' => false
            );

            $this->db->insert('purchases', array(
                'orderid' => $orderid,
                'userid' => $userid,
                'date' => new Zend_Db_Expr('UTC_TIMESTAMP()'),
                'type' => $type,
                'itemid' => $itemid,
                'price' => $price,
                'status' => 'settled',
                'result_json' => json_encode($result)
            ));
            $this->db->insert('coin_transactions', array(
                'userid' => $userid,
                'amount' => $freeEconomy ? 0 : -$price,
                'balance_after' => $newBalance,
                'transaction_type' => 'purchase',
                'reference_key' => 'purchase:' . $orderid,
                'details' => $type . ':' . $itemid
            ));

            $this->commit();
            return $result;
        } catch (Exception $e) {
            $this->rollBack();
            throw $e;
        }
    }

    public function getWalletBalance($userid)
    {
        $balance = $this->db->fetchOne('SELECT balance FROM wallets WHERE userid = ?', array((int) $userid));
        return ($balance === false) ? 0 : (int) $balance;
    }

    public function awardMatchCoins($userid, $gameid, $amount, $details)
    {
        $userid = (int) $userid;
        $gameid = (int) $gameid;
        $amount = (int) $amount;
        if ($userid < 2 || $gameid < 1 || $amount < 1 || $amount > 5) {
            throw new InvalidArgumentException('Match coin award is invalid.');
        }

        $reference = 'match:' . $gameid;
        $this->beginTransaction();
        try {
            // Lock the wallet first so purchases and repeated completion work
            // serialize on one account balance.
            $wallet = $this->db->fetchRow('SELECT * FROM wallets WHERE userid = ? FOR UPDATE', array($userid));
            if (!$wallet) {
                throw new RuntimeException('Wallet not found.');
            }

            $existing = $this->db->fetchRow(
                'SELECT amount FROM coin_transactions WHERE userid = ? AND reference_key = ?',
                array($userid, $reference)
            );
            if ($existing) {
                $this->commit();
                return array(
                    'amount' => (int) $existing['amount'],
                    'balance' => (int) $wallet['balance'],
                    'idempotent' => true
                );
            }

            $balance = (int) $wallet['balance'] + $amount;
            $this->db->update('wallets', array(
                'balance' => $balance,
                'updated_at' => new Zend_Db_Expr('UTC_TIMESTAMP()')
            ), array('userid = ?' => $userid));
            $this->db->insert('coin_transactions', array(
                'userid' => $userid,
                'amount' => $amount,
                'balance_after' => $balance,
                'transaction_type' => 'match_reward',
                'reference_key' => $reference,
                'details' => substr((string) $details, 0, 255)
            ));

            $this->commit();
            return array(
                'amount' => $amount,
                'balance' => $balance,
                'idempotent' => false
            );
        } catch (Exception $e) {
            $this->rollBack();
            throw $e;
        }
    }

    public function grantCoins($userid, $amount, $reference)
    {
        $userid = (int) $userid;
        $amount = (int) $amount;
        if ($amount <= 0) {
            throw new InvalidArgumentException('Grant amount must be positive.');
        }
        $this->beginTransaction();
        try {
            $wallet = $this->db->fetchRow('SELECT * FROM wallets WHERE userid = ? FOR UPDATE', array($userid));
            if (!$wallet) {
                throw new InvalidArgumentException('Wallet not found.');
            }
            $balance = (int) $wallet['balance'] + $amount;
            $this->db->update('wallets', array(
                'balance' => $balance,
                'updated_at' => new Zend_Db_Expr('UTC_TIMESTAMP()')
            ), array('userid = ?' => $userid));
            $this->db->insert('coin_transactions', array(
                'userid' => $userid,
                'amount' => $amount,
                'balance_after' => $balance,
                'transaction_type' => 'test_grant',
                'reference_key' => $reference,
                'details' => 'Local CLI grant'
            ));
            $this->commit();
            return $balance;
        } catch (Exception $e) {
            $this->rollBack();
            throw $e;
        }
    }

    public function getUserOptions($userid)
    {
        return $this->db->fetchAll(
            'SELECT uo.*, o.name FROM useroptions uo INNER JOIN options o ON uo.optionid = o.idoptions
             WHERE uo.userid = ? ORDER BY uo.iduseroptions',
            array((int) $userid)
        );
    }

    public function getUserOption($userid, $optionid)
    {
        return $this->db->fetchAll('SELECT * FROM useroptions WHERE userid = ? AND optionid = ?', array((int) $userid, (int) $optionid));
    }

    public function getActiveUserOption($userid, $optionid)
    {
        return $this->db->fetchAll(
            'SELECT * FROM useroptions WHERE userid = ? AND optionid = ? AND active = 1',
            array((int) $userid, (int) $optionid)
        );
    }

    public function setActiveUserOption($userid, $optionid, $value = null)
    {
        $this->db->update('useroptions', array('active' => 0), array(
            'userid = ?' => (int) $userid,
            'optionid = ?' => (int) $optionid
        ));
        if ($value !== null) {
            $this->db->query(
                'INSERT IGNORE INTO useroptions (userid, optionid, value, active) VALUES (?, ?, ?, 0)',
                array((int) $userid, (int) $optionid, $value)
            );
            $this->db->update('useroptions', array('active' => 1), array(
                'userid = ?' => (int) $userid,
                'optionid = ?' => (int) $optionid,
                'value = ?' => $value
            ));
        }
    }

    public function getOptions()
    {
        return $this->db->fetchAll('SELECT * FROM options ORDER BY idoptions');
    }

    public function addUserOption($userid, $optionid, $value)
    {
        $this->db->query(
            'INSERT IGNORE INTO useroptions (optionid, userid, value, active) VALUES (?, ?, ?, 0)',
            array((int) $optionid, (int) $userid, $value)
        );
    }

    public function removeUserOption($userid, $optionid, $value)
    {
        return $this->db->delete('useroptions', array(
            'userid = ?' => (int) $userid,
            'optionid = ?' => (int) $optionid,
            'value = ?' => $value
        ));
    }

    public function getShopItem($shopitemid)
    {
        return $this->db->fetchRow('SELECT * FROM shopitems WHERE idshopitems = ?', array((int) $shopitemid));
    }

    public function getTurns($userid)
    {
        $this->regenerateTurns($userid);
        return (int) $this->db->fetchOne('SELECT turns FROM user_turns WHERE userid = ?', array((int) $userid));
    }

    public function decrementTurn($userid)
    {
        $userid = (int) $userid;
        $this->regenerateTurns($userid);
        $this->beginTransaction();
        try {
            $row = $this->db->fetchRow('SELECT * FROM user_turns WHERE userid = ? FOR UPDATE', array($userid));
            if (!$row || (int) $row['turns'] < 1) {
                $this->commit();
                return false;
            }
            $newTurns = (int) $row['turns'] - 1;
            $data = array('turns' => $newTurns, 'updated_at' => new Zend_Db_Expr('UTC_TIMESTAMP()'));
            if ((int) $row['turns'] >= self::NATURAL_TURN_CAP && $newTurns < self::NATURAL_TURN_CAP) {
                $data['last_regenerated_at'] = new Zend_Db_Expr('UTC_TIMESTAMP()');
            }
            $this->db->update('user_turns', $data, array('userid = ?' => $userid));
            $this->commit();
            return true;
        } catch (Exception $e) {
            $this->rollBack();
            throw $e;
        }
    }

    public function removeTurns($userid)
    {
        return $this->db->delete('user_turns', array('userid = ?' => (int) $userid));
    }

    public function incrementTurns($userid, $value)
    {
        return $this->db->query(
            'UPDATE user_turns SET turns = turns + ?, last_regenerated_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP() WHERE userid = ?',
            array(max(0, (int) $value), (int) $userid)
        );
    }

    public function regenerateTurns($userid, $nowTimestamp = null)
    {
        $userid = (int) $userid;
        $nowTimestamp = ($nowTimestamp === null) ? time() : (int) $nowTimestamp;
        $this->beginTransaction();
        try {
            $row = $this->db->fetchRow('SELECT * FROM user_turns WHERE userid = ? FOR UPDATE', array($userid));
            if (!$row) {
                throw new RuntimeException('Turn account not found.');
            }

            $turns = (int) $row['turns'];
            $last = strtotime($row['last_regenerated_at'] . ' UTC');
            if ($last === false) {
                $last = $nowTimestamp;
            }

            if ($turns >= self::NATURAL_TURN_CAP) {
                if ($nowTimestamp - $last >= self::TURN_INTERVAL_SECONDS) {
                    $this->db->update('user_turns', array(
                        'last_regenerated_at' => gmdate('Y-m-d H:i:s', $nowTimestamp),
                        'updated_at' => gmdate('Y-m-d H:i:s', $nowTimestamp)
                    ), array('userid = ?' => $userid));
                }
            } else {
                $elapsed = max(0, $nowTimestamp - $last);
                $earned = (int) floor($elapsed / self::TURN_INTERVAL_SECONDS);
                if ($earned > 0) {
                    $newTurns = min(self::NATURAL_TURN_CAP, $turns + $earned);
                    $usedIntervals = $newTurns - $turns;
                    $newLast = ($newTurns >= self::NATURAL_TURN_CAP)
                        ? $nowTimestamp
                        : $last + ($usedIntervals * self::TURN_INTERVAL_SECONDS);
                    $this->db->update('user_turns', array(
                        'turns' => $newTurns,
                        'last_regenerated_at' => gmdate('Y-m-d H:i:s', $newLast),
                        'updated_at' => gmdate('Y-m-d H:i:s', $nowTimestamp)
                    ), array('userid = ?' => $userid));
                }
            }
            $this->commit();
        } catch (Exception $e) {
            $this->rollBack();
            throw $e;
        }
    }

    public function regenerateAllTurns($limit = 500)
    {
        $limit = max(1, min(5000, (int) $limit));
        $userids = $this->db->fetchCol(
            'SELECT userid FROM user_turns WHERE turns < ' . self::NATURAL_TURN_CAP .
            ' AND last_regenerated_at <= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 5 MINUTE) ORDER BY userid LIMIT ' . $limit
        );
        foreach ($userids as $userid) {
            $this->regenerateTurns((int) $userid);
        }
        return count($userids);
    }

    public function getSecondsUntilNextTurn($userid)
    {
        $row = $this->db->fetchRow('SELECT turns, last_regenerated_at FROM user_turns WHERE userid = ?', array((int) $userid));
        if (!$row || (int) $row['turns'] >= self::NATURAL_TURN_CAP) {
            return self::TURN_INTERVAL_SECONDS;
        }
        $elapsed = max(0, time() - strtotime($row['last_regenerated_at'] . ' UTC'));
        $remaining = self::TURN_INTERVAL_SECONDS - ($elapsed % self::TURN_INTERVAL_SECONDS);
        return ($remaining <= 0) ? self::TURN_INTERVAL_SECONDS : $remaining;
    }

    public function getLeaderboard($days)
    {
        $days = max(1, min(30, (int) $days));
        $rows = $this->db->fetchAll(
            'SELECT gh.userid AS id, a.display_name,
                    SUM(CASE WHEN gh.p1score > gh.p2score THEN 1 ELSE 0 END) AS wins,
                    SUM(CASE WHEN gh.p1score < gh.p2score THEN 1 ELSE 0 END) AS losses,
                    SUM(CASE WHEN gh.p1score = gh.p2score THEN 1 ELSE 0 END) AS draws,
                    COUNT(*) AS games_played,
                    AVG(gh.p1score) AS average_points
             FROM gamehistory gh INNER JOIN local_accounts a ON a.userid = gh.userid
             WHERE gh.completed >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ' . $days . ' DAY)
               AND a.disabled = 0
             GROUP BY gh.userid, a.display_name'
        );

        foreach ($rows as &$row) {
            $row['id'] = (int) $row['id'];
            $row['wins'] = (int) $row['wins'];
            $row['losses'] = (int) $row['losses'];
            $row['draws'] = (int) $row['draws'];
            $row['games_played'] = (int) $row['games_played'];
            $row['average_points'] = round((float) $row['average_points'], 3);
            $row['score'] = round((($row['wins'] + ($row['draws'] * 0.5)) / max(1, $row['games_played'])) * 100 + $row['average_points'], 3);
            $words = preg_split('/\s+/', trim($row['display_name']));
            $initials = '';
            foreach (array_slice($words, 0, 2) as $word) {
                $initials .= strtoupper(substr($word, 0, 1));
            }
            $row['avatar_initials'] = $initials === '' ? '?' : $initials;
        }
        unset($row);

        usort($rows, array($this, 'sortLeaderboardRows'));
        $rows = array_slice($rows, 0, 5);
        foreach ($rows as $index => &$row) {
            $row['rank'] = $index + 1;
        }
        unset($row);
        return $rows;
    }

    public function sortLeaderboardRows($a, $b)
    {
        if ($a['score'] == $b['score']) {
            return $a['id'] - $b['id'];
        }
        return ($a['score'] < $b['score']) ? 1 : -1;
    }

    public function cacheThreeDayLeaderboard()
    {
        $redis = new PureTripleTriad_Redis();
        return $redis->setLeaderboard($this->getLeaderboard(3));
    }

    public function recordFeedback($userid, $gameid, $type, $message)
    {
        $this->db->insert('feedback_reports', array(
            'userid' => (int) $userid,
            'gameid' => $gameid ? (int) $gameid : null,
            'report_type' => $type,
            'message' => $message,
            'created_at' => new Zend_Db_Expr('UTC_TIMESTAMP()')
        ));
    }
}
