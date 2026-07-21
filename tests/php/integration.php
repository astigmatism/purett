<?php

require dirname(__FILE__) . '/TestHarness.php';

$projectRoot = getenv('PURETT_TEST_APP_ROOT');
if (!$projectRoot) {
    $projectRoot = realpath(dirname(__FILE__) . '/../..');
}
require $projectRoot . '/bin/bootstrap.php';
require dirname(__FILE__) . '/EngineFixtures.php';

$test = new PurettTestHarness();
$state = array(
    'database' => new PureTripleTriad_Database(),
    'userids' => array(),
    'username' => 'it_' . substr(sha1(uniqid('', true)), 0, 16),
    'password' => 'CorrectHorseBattery42!',
    'gameid' => null
);

register_shutdown_function(function () use (&$state) {
    foreach (array_reverse($state['userids']) as $userid) {
        try {
            if ($state['database']->getUser($userid)) {
                $state['database']->removeUser($userid);
            }
        } catch (Exception $ignored) {
        }
    }
});

$test->test('schema, catalog, rules, and reserved computer account are installed', function () use (&$state, $projectRoot) {
    $database = $state['database'];
    PurettTestHarness::assertSame('2026.07.20-standalone-1', $database->getSchemaVersion(), 'unexpected schema version');
    PurettTestHarness::assertSame(110, count($database->getCards()), 'the full 110-card catalog must be present');
    PurettTestHarness::assertSame(13, count($database->getRules()), 'all thirteen game rules must be present');
    $computer = $database->getUser(1);
    PurettTestHarness::assertTrue((bool) $computer, 'computer account is missing');
    PurettTestHarness::assertFalse((bool) $database->getLocalAccountByUserId(1), 'computer must not have a login account');
    PurettTestHarness::assertTrue(is_dir($projectRoot . '/var/gamehistory'), 'runtime game-history directory is missing');
    PurettTestHarness::assertTrue(is_writable($projectRoot . '/var/gamehistory'), 'runtime game-history directory is not writable');
});

$test->test('local registration hashes the password and grants exactly five starting cards', function () use (&$state) {
    $hash = password_hash($state['password'], PASSWORD_DEFAULT);
    PurettTestHarness::assertTrue($hash !== $state['password'], 'password hash unexpectedly equals plaintext');
    $account = $state['database']->createLocalAccount(
        $state['username'],
        'Integration Player',
        $hash,
        'integration@example.invalid',
        200
    );
    $userid = (int) $account['userid'];
    $state['userid'] = $userid;
    $state['userids'][] = $userid;

    PurettTestHarness::assertTrue($userid >= 2, 'human IDs must not overlap the computer account');
    PurettTestHarness::assertTrue(password_verify($state['password'], $account['password_hash']), 'stored password hash does not verify');
    PurettTestHarness::assertFalse(password_verify('incorrect password', $account['password_hash']), 'wrong password was accepted');
    $cards = $state['database']->getUserCards($userid);
    PurettTestHarness::assertCount(5, $cards, 'registration did not create five cards');
    foreach ($cards as $card) {
        PurettTestHarness::assertSame(1, (int) $card['inhand'], 'every starting card should be in hand');
    }
    PurettTestHarness::assertSame(200, $state['database']->getWalletBalance($userid), 'starting coin balance is wrong');
    PurettTestHarness::assertSame(30, $state['database']->getTurns($userid), 'starting turn balance is wrong');
});

$test->test('SQL-injection-shaped identity input is treated as data', function () use (&$state) {
    $account = $state['database']->getLocalAccountByUsername("demo' OR 1=1 --");
    PurettTestHarness::assertFalse((bool) $account, 'SQL-shaped username returned an account');
    $cards = $state['database']->db->fetchAll(
        'SELECT * FROM usercards WHERE userid = ?',
        array($state['userid'])
    );
    PurettTestHarness::assertCount(5, $cards, 'unrelated account data changed after SQL-shaped lookup');
});

$test->test('the active hand enforces five distinct cards owned by the current account', function () use (&$state) {
    $database = $state['database'];
    $rows = $database->getUserCards($state['userid']);
    $owned = array();
    foreach ($rows as $row) {
        $owned[] = (int) $row['idusercards'];
    }

    PurettTestHarness::assertThrows('InvalidArgumentException', function () use ($database, $owned, &$state) {
        $database->setExactHand($state['userid'], array_slice($owned, 0, 4));
    }, 'four-card hand was accepted');
    PurettTestHarness::assertThrows('InvalidArgumentException', function () use ($database, $owned, &$state) {
        $database->setExactHand($state['userid'], array($owned[0], $owned[1], $owned[2], $owned[3], $owned[3]));
    }, 'duplicate card instance was accepted');

    $foreign = (int) $database->db->fetchOne('SELECT idusercards FROM usercards WHERE userid = 2 LIMIT 1');
    PurettTestHarness::assertThrows('InvalidArgumentException', function () use ($database, $owned, $foreign, &$state) {
        $database->setExactHand($state['userid'], array($owned[0], $owned[1], $owned[2], $owned[3], $foreign));
    }, 'another account\'s card was accepted');

    $database->setExactHand($state['userid'], $owned);
    $count = (int) $database->db->fetchOne(
        'SELECT COUNT(*) FROM usercards WHERE userid = ? AND inhand = 1',
        array($state['userid'])
    );
    PurettTestHarness::assertSame(5, $count, 'valid five-card hand was not persisted atomically');

    $user = new PureTripleTriad_User($state['userid']);
    PurettTestHarness::assertThrows('InvalidArgumentException', function () use ($user) {
        $user->setHand('1,2,3,4');
    }, 'domain model accepted a four-card catalog list');
});

$test->test('turn decrement and deterministic regeneration obey the natural cap', function () use (&$state) {
    $database = $state['database'];
    $userid = $state['userid'];
    $now = time();
    $database->db->update('user_turns', array(
        'turns' => 3,
        'last_regenerated_at' => gmdate('Y-m-d H:i:s', $now)
    ), array('userid = ?' => $userid));
    PurettTestHarness::assertTrue($database->decrementTurn($userid), 'turn decrement failed');
    PurettTestHarness::assertSame(2, (int) $database->db->fetchOne('SELECT turns FROM user_turns WHERE userid = ?', array($userid)), 'turn was not decremented');

    $database->db->update('user_turns', array(
        'turns' => 2,
        'last_regenerated_at' => gmdate('Y-m-d H:i:s', $now - 610)
    ), array('userid = ?' => $userid));
    $database->regenerateTurns($userid, $now);
    PurettTestHarness::assertSame(4, (int) $database->db->fetchOne('SELECT turns FROM user_turns WHERE userid = ?', array($userid)), 'two elapsed intervals did not grant two turns');

    $database->db->update('user_turns', array(
        'turns' => 29,
        'last_regenerated_at' => gmdate('Y-m-d H:i:s', $now - 3600)
    ), array('userid = ?' => $userid));
    $database->regenerateTurns($userid, $now);
    PurettTestHarness::assertSame(30, (int) $database->db->fetchOne('SELECT turns FROM user_turns WHERE userid = ?', array($userid)), 'natural regeneration exceeded or missed the cap');

    $database->db->update('user_turns', array(
        'turns' => 35,
        'last_regenerated_at' => gmdate('Y-m-d H:i:s', $now - 3600)
    ), array('userid = ?' => $userid));
    $database->regenerateTurns($userid, $now);
    PurettTestHarness::assertSame(35, (int) $database->db->fetchOne('SELECT turns FROM user_turns WHERE userid = ?', array($userid)), 'purchased turns were incorrectly clamped');
});

$test->test('daily shop inventory is deterministic and bounded', function () use (&$state) {
    $user = new PureTripleTriad_User($state['userid']);
    $first = PureTripleTriad_User::getShopStock($user, 10);
    $second = PureTripleTriad_User::getShopStock($user, 10);
    PurettTestHarness::assertTrue(count($first) > 0 && count($first) <= 10, 'daily stock count is invalid');
    $firstIds = array();
    $secondIds = array();
    foreach ($first as $card) { $firstIds[] = (int) $card->cardid; }
    foreach ($second as $card) { $secondIds[] = (int) $card->cardid; }
    PurettTestHarness::assertSame($firstIds, $secondIds, 'shop inventory changed within the same UTC day');
    PurettTestHarness::assertSame(count($firstIds), count(array_unique($firstIds)), 'shop inventory contains duplicates');
});

$test->test('card purchase is server-priced, atomic, protected, and idempotent', function () use (&$state) {
    $database = $state['database'];
    $userid = $state['userid'];
    $stock = PureTripleTriad_User::getShopStock(new PureTripleTriad_User($userid), 10);
    PurettTestHarness::assertTrue(count($stock) > 0, 'daily shop has no purchasable card');
    $cardid = (int) $stock[0]->cardid;
    $expectedPrice = (int) $stock[0]->price;
    $beforeBalance = $database->getWalletBalance($userid);
    $beforeCards = (int) $database->db->fetchOne(
        'SELECT COUNT(*) FROM usercards WHERE userid = ? AND cardid = ?',
        array($userid, $cardid)
    );
    $order = 'test:card:' . sha1(uniqid('', true));
    $first = $database->purchaseCatalogItem($userid, 'card', $cardid, $order);
    PurettTestHarness::assertSame($expectedPrice, (int) $first['price'], 'card level did not determine its server-side price');
    PurettTestHarness::assertSame($beforeBalance - $expectedPrice, (int) $first['balance'], 'coin deduction is wrong');
    $second = $database->purchaseCatalogItem($userid, 'card', $cardid, $order);
    PurettTestHarness::assertTrue((bool) $second['idempotent'], 'repeat purchase was not marked idempotent');
    PurettTestHarness::assertSame($beforeBalance - $expectedPrice, $database->getWalletBalance($userid), 'repeat purchase deducted coins twice');
    $afterCards = (int) $database->db->fetchOne(
        'SELECT COUNT(*) FROM usercards WHERE userid = ? AND cardid = ?',
        array($userid, $cardid)
    );
    PurettTestHarness::assertSame($beforeCards + 1, $afterCards, 'repeat purchase granted the card more than once');
    $protected = (int) $database->db->fetchOne(
        'SELECT purchased FROM usercards WHERE userid = ? AND cardid = ? ORDER BY idusercards DESC LIMIT 1',
        array($userid, $cardid)
    );
    PurettTestHarness::assertSame(1, $protected, 'coin-acquired card is not protected');
    $ledgerCount = (int) $database->db->fetchOne(
        'SELECT COUNT(*) FROM coin_transactions WHERE userid = ? AND reference_key = ?',
        array($userid, 'purchase:' . $order)
    );
    PurettTestHarness::assertSame(1, $ledgerCount, 'purchase ledger was not idempotent');
});

$test->test('color and turn-bundle purchases grant the authoritative catalog item', function () use (&$state) {
    $database = $state['database'];
    $userid = $state['userid'];
    $balance = $database->getWalletBalance($userid);
    $color = $database->purchaseCatalogItem($userid, 'color', 1, 'test:color:' . sha1(uniqid('', true)));
    PurettTestHarness::assertSame(20, (int) $color['price'], 'color price did not come from the catalog');
    PurettTestHarness::assertSame($balance - 20, (int) $color['balance'], 'color purchase balance is wrong');
    $active = $database->getActiveUserOption($userid, 1);
    PurettTestHarness::assertCount(1, $active, 'color purchase did not select exactly one color');
    PurettTestHarness::assertSame('green', $active[0]['value'], 'wrong color was granted');

    $database->db->update('user_turns', array('turns' => 30), array('userid = ?' => $userid));
    $turn = $database->purchaseCatalogItem($userid, 'turn', 6, 'test:turn:' . sha1(uniqid('', true)));
    PurettTestHarness::assertSame(5, (int) $turn['grant'], 'turn bundle grant does not match catalog');
    PurettTestHarness::assertSame(35, (int) $database->db->fetchOne('SELECT turns FROM user_turns WHERE userid = ?', array($userid)), 'turn bundle was not granted');

    $user = new PureTripleTriad_User($userid);
    PurettTestHarness::assertTrue(in_array('green', $user->colors, true), 'purchased color is absent from the user model');
    PurettTestHarness::assertSame('green', $user->options['color'], 'purchased color is not active');
    $user->setUserOption(1, null);
    $freshUser = new PureTripleTriad_User($userid);
    PurettTestHarness::assertSame('blue', $freshUser->options['color'], 'built-in blue color could not be selected');
    PurettTestHarness::assertSame(count($freshUser->colors), count(array_unique($freshUser->colors)), 'color ownership contains duplicates');
});

$test->test('basic capture uses the four-direction ranks', function () {
    $game = purettNewEngineFixture(array());
    $enemy = new PurettFixtureCard(2, 1, 1, 1, 1, 5, false);
    $enemy->position = 5;
    $game->playboard[5] = $enemy;
    $played = new PurettFixtureCard(1, 42, 1, 6, 1, 1, false);
    purettInvokePrivate($game, 'capture', array($played, 4, array()));
    PurettTestHarness::assertSame(42, $enemy->captured, 'higher east rank did not capture adjacent west rank');
});

$test->test('Same captures two matching adjacent ranks', function () {
    $game = purettNewEngineFixture(array('same'));
    $north = new PurettFixtureCard(2, 1, 1, 1, 4, 1, false);
    $west = new PurettFixtureCard(3, 1, 1, 5, 1, 1, false);
    $north->position = 1;
    $west->position = 3;
    $game->playboard[1] = $north;
    $game->playboard[3] = $west;
    $played = new PurettFixtureCard(1, 42, 4, 1, 1, 5, false);
    purettInvokePrivate($game, 'capture', array($played, 4, array()));
    PurettTestHarness::assertSame(42, $north->captured, 'Same did not capture north card');
    PurettTestHarness::assertSame(42, $west->captured, 'Same did not capture west card');
});

$test->test('Plus captures adjacent pairs with equal sums', function () {
    $game = purettNewEngineFixture(array('plus'));
    $north = new PurettFixtureCard(2, 1, 1, 1, 5, 1, false);
    $west = new PurettFixtureCard(3, 1, 1, 4, 1, 1, false);
    $north->position = 1;
    $west->position = 3;
    $game->playboard[1] = $north;
    $game->playboard[3] = $west;
    $played = new PurettFixtureCard(1, 42, 3, 1, 1, 4, false);
    purettInvokePrivate($game, 'capture', array($played, 4, array()));
    PurettTestHarness::assertSame(42, $north->captured, 'Plus did not capture north card');
    PurettTestHarness::assertSame(42, $west->captured, 'Plus did not capture west card');
});

$test->test('Combo recursively applies basic capture after Same', function () {
    $game = purettNewEngineFixture(array('same', 'combo'));
    $northWest = new PurettFixtureCard(4, 1, 1, 1, 1, 1, false);
    $north = new PurettFixtureCard(2, 1, 1, 1, 4, 9, false);
    $west = new PurettFixtureCard(3, 1, 1, 5, 1, 1, false);
    $northWest->position = 0;
    $north->position = 1;
    $west->position = 3;
    $game->playboard[0] = $northWest;
    $game->playboard[1] = $north;
    $game->playboard[3] = $west;
    $played = new PurettFixtureCard(1, 42, 4, 1, 1, 5, false);
    purettInvokePrivate($game, 'capture', array($played, 4, array()));
    PurettTestHarness::assertSame(42, $north->captured, 'Same precondition did not capture north card');
    PurettTestHarness::assertSame(42, $northWest->captured, 'Combo did not propagate from the captured card');
});

$test->test('Same Wall treats a board edge as rank A', function () {
    $game = purettNewEngineFixture(array('same', 'same wall'));
    $east = new PurettFixtureCard(2, 1, 1, 1, 1, 4, false);
    $east->position = 2;
    $game->playboard[2] = $east;
    $played = new PurettFixtureCard(1, 42, 10, 4, 1, 1, false);
    purettInvokePrivate($game, 'capture', array($played, 1, array()));
    PurettTestHarness::assertSame(42, $east->captured, 'matching card plus rank-A north wall did not trigger Same');
});

$test->test('Elemental positive and negative modifiers affect captures symmetrically', function () {
    $positiveGame = purettNewEngineFixture(array('elemental'));
    $positiveEnemy = new PurettFixtureCard(2, 1, 1, 1, 1, 5, false);
    $positiveEnemy->position = 5;
    $positiveGame->playboard[5] = $positiveEnemy;
    $positive = new PurettFixtureCard(1, 42, 1, 5, 1, 1, false);
    $positive->elementbonus = 1;
    purettInvokePrivate($positiveGame, 'capture', array($positive, 4, array()));
    PurettTestHarness::assertSame(42, $positiveEnemy->captured, 'positive elemental bonus did not enable capture');

    $negativeGame = purettNewEngineFixture(array('elemental'));
    $negativeEnemy = new PurettFixtureCard(4, 1, 1, 1, 1, 5, false);
    $negativeEnemy->position = 5;
    $negativeGame->playboard[5] = $negativeEnemy;
    $negative = new PurettFixtureCard(3, 42, 1, 6, 1, 1, false);
    $negative->elementbonus = -1;
    purettInvokePrivate($negativeGame, 'capture', array($negative, 4, array()));
    PurettTestHarness::assertSame(1, $negativeEnemy->captured, 'negative elemental bonus was treated as positive');
});

$test->test('rule progression schedules Random, Sudden Death, and all take variants', function () {
    $namesAt = function ($played) {
        $rules = PureTripleTriad_Game::getNextRules($played, 0, 0);
        $names = array();
        foreach ($rules as $rule) { $names[] = strtolower($rule['name']); }
        return $names;
    };
    PurettTestHarness::assertCount(0, $namesAt(0), 'initial game should use the default open/basic behavior');
    PurettTestHarness::assertTrue(in_array('sudden death', $namesAt(6), true), 'Sudden Death is absent from progression');
    PurettTestHarness::assertTrue(in_array('take one', $namesAt(6), true), 'Take One is absent from progression');
    PurettTestHarness::assertTrue(in_array('random', $namesAt(60), true), 'Random is absent from progression');
    PurettTestHarness::assertTrue(in_array('take difference', $namesAt(58), true), 'Take Difference is absent from progression');
    PurettTestHarness::assertTrue(in_array('take direct', $namesAt(102), true), 'Take Direct is absent from progression');
    PurettTestHarness::assertTrue(in_array('take all', $namesAt(103), true), 'Take All is absent from progression');
});

$test->test('Sudden Death clears the board and returns captured cards to the correct hands', function () {
    $game = purettNewEngineFixture(array('sudden death'));
    $database = new PurettFixtureDatabase();
    purettReflectionSet($game, 'db', $database);
    $game->gameid = 88;
    $humanCard = new PurettFixtureCard(1, 42, 1, 1, 1, 1, false);
    $humanCard->captured = 42;
    $humanCard->position = 3;
    $computerCard = new PurettFixtureCard(2, 1, 1, 1, 1, 1, false);
    $computerCard->captured = 1;
    $computerCard->position = 4;
    $game->gamecards = array($humanCard, $computerCard);
    $game->playboard[3] = $humanCard;
    $game->playboard[4] = $computerCard;
    $game->cardsplayed = 2;
    purettInvokePrivate($game, 'setSuddenDeath', array());
    PurettTestHarness::assertTrue($game->insuddendeath, 'Sudden Death flag was not set');
    PurettTestHarness::assertSame(0, $game->cardsplayed, 'board play count was not reset');
    PurettTestHarness::assertSame(-1, $humanCard->position, 'human-captured card did not return to human hand');
    PurettTestHarness::assertSame(-2, $computerCard->position, 'computer-captured card did not return to computer hand');
    PurettTestHarness::assertSame(2, count($database->cardUpdates), 'Sudden Death hand reset was not persisted');
});

$test->test('Take One preserves protected cards on a loss and creates a claim on a win', function () {
    list($lossGame, $lossDatabase, $lossPlayer) = purettVictoryFixture('take one', 4, 6);
    purettInvokePrivate($lossGame, 'gameover', array());
    PurettTestHarness::assertCount(1, $lossPlayer->removed, 'Take One loss did not remove exactly one card');
    PurettTestHarness::assertFalse(in_array(1, $lossPlayer->removed, true), 'Take One removed the protected card');
    PurettTestHarness::assertTrue($lossDatabase->deleted, 'completed Take One loss did not close the game');

    list($winGame, $winDatabase, $winPlayer) = purettVictoryFixture('take one', 6, 4);
    purettInvokePrivate($winGame, 'gameover', array());
    PurettTestHarness::assertSame(1, $winDatabase->victoryClaim, 'Take One win did not persist a one-card claim');
    PurettTestHarness::assertFalse($winDatabase->deleted, 'claimable game was deleted before the claim');
});

$test->test('Take Direct transfers captured cards while preserving protected losses', function () {
    list($game, $database, $player) = purettVictoryFixture('take direct', 5, 5);
    purettInvokePrivate($game, 'gameover', array());
    sort($player->removed);
    PurettTestHarness::assertSame(array(2, 3, 4, 5), $player->removed, 'Take Direct removed the wrong player cards');
    PurettTestHarness::assertCount(5, $player->awarded, 'Take Direct did not grant captured opponent cards');
    PurettTestHarness::assertFalse(in_array(1, $player->removed, true), 'Take Direct removed a protected card');
    PurettTestHarness::assertTrue($database->deleted && $database->committed, 'Take Direct result was not finalized');
});

$test->test('Take Difference removes only the score difference and skips protected cards', function () {
    list($game, $database, $player) = purettVictoryFixture('take difference', 3, 7);
    purettInvokePrivate($game, 'gameover', array());
    sort($player->removed);
    PurettTestHarness::assertSame(array(2, 3, 4, 5), $player->removed, 'Take Difference did not remove four eligible cards');
    PurettTestHarness::assertFalse(in_array(1, $player->removed, true), 'Take Difference removed a protected card');
    PurettTestHarness::assertTrue($database->deleted, 'Take Difference loss did not close the game');
});

$test->test('Take All removes every eligible card but never a protected card', function () {
    list($game, $database, $player) = purettVictoryFixture('take all', 1, 9);
    purettInvokePrivate($game, 'gameover', array());
    sort($player->removed);
    PurettTestHarness::assertSame(array(2, 3, 4, 5), $player->removed, 'Take All did not remove all eligible cards');
    PurettTestHarness::assertFalse(in_array(1, $player->removed, true), 'Take All removed a protected card');
    PurettTestHarness::assertTrue($database->deleted, 'Take All result did not close the game');
});

$test->test('a complete game persists results, consumes turns, responds with AI moves, and creates an owned replay', function () use (&$state, $projectRoot) {
    $database = $state['database'];
    $userid = $state['userid'];
    $redis = new PureTripleTriad_Redis();
    $redis->setLeaderboard(array(array(
        'id' => 999999999,
        'display_name' => 'Stale Completion Sentinel'
    )));
    $database->db->update('user_turns', array(
        'turns' => 30,
        'last_regenerated_at' => gmdate('Y-m-d H:i:s')
    ), array('userid = ?' => $userid));
    $database->setUserRecord($userid, 0, 0, 0);

    $user = new PureTripleTriad_User($userid);
    PurettTestHarness::assertCount(5, $user->hand, 'test account no longer has a valid five-card hand');
    $game = new PureTripleTriad_Game($user);
    $state['gameid'] = (int) $game->gameid;
    $row = $database->getGame($userid);
    PurettTestHarness::assertTrue((int) $row['idgames'] >= 1000, 'game did not use an inserted ID');
    PurettTestHarness::assertSame(1, (int) $row['p2'], 'computer opponent is not user ID 1');
    PurettTestHarness::assertCount(10, $database->getGameCards($game->gameid), 'game did not persist ten cards');

    PurettTestHarness::assertThrows('Exception', function () use ($game, $userid) {
        $game->play(999999999, 0, $userid);
    }, 'unknown game card was accepted');
    PurettTestHarness::assertThrows('Exception', function () use ($game, $userid) {
        $game->play(999999999, 9, $userid);
    }, 'out-of-range board position was accepted');

    $aiMoves = 0;
    if ($game->firstturn) {
        $opening = $game->them();
        PurettTestHarness::assertSame(1, (int) $opening['u'], 'opening AI move has the wrong owner');
        $aiMoves++;
    }
    $humanMoves = 0;
    while ($game->cardsplayed < 9) {
        $card = null;
        foreach ($game->gamecards as $candidate) {
            if ((int) $candidate->captured === $userid && (int) $candidate->position < 0) {
                $card = $candidate;
                break;
            }
        }
        $position = null;
        foreach ($game->playboard as $index => $placed) {
            if (!$placed) {
                $position = $index;
                break;
            }
        }
        PurettTestHarness::assertTrue($card !== null && $position !== null, 'game reached an invalid turn state');
        $response = $game->me($card->gamecardid, $position, $userid, $game->key);
        $humanMoves++;
        PurettTestHarness::assertSame($userid, (int) $response['ppqoowoieoiqpoipieoicojqpojuu']['u'], 'human move response has wrong owner');
        if (!empty($response['ppqoowoieoiqpoipieoicojqpojow'])) {
            PurettTestHarness::assertSame(1, (int) $response['ppqoowoieoiqpoipieoicojqpojow']['u'], 'AI response has wrong owner');
            $aiMoves++;
        }
        PurettTestHarness::assertTrue($humanMoves <= 5, 'game did not terminate after the 3x3 board filled');
    }
    PurettTestHarness::assertTrue($aiMoves >= 4, 'AI did not answer human turns');
    PurettTestHarness::assertFalse((bool) $database->getGame($userid), 'completed basic game remained active');
    PurettTestHarness::assertSame(30 - $humanMoves, (int) $database->db->fetchOne('SELECT turns FROM user_turns WHERE userid = ?', array($userid)), 'human moves did not consume exactly one turn each');

    $history = $database->getGameHistory($state['gameid']);
    PurettTestHarness::assertTrue((bool) $history, 'game result was not written to history');
    PurettTestHarness::assertSame($userid, (int) $history['userid'], 'game history belongs to the wrong account');
    $log = $projectRoot . '/var/gamehistory/' . $history['log_path'];
    PurettTestHarness::assertTrue(is_file($log), 'owned replay log was not written');
    $logText = file_get_contents($log);
    PurettTestHarness::assertFalse(strpos($logText, $state['password']) !== false, 'replay contains a password');
    $review = PureTripleTriad_Game::reviewData((string) $state['gameid'], $userid);
    PurettTestHarness::assertTrue(count($review) >= 9, 'replay does not contain the initial state and moves');

    $updated = $database->getUser($userid);
    PurettTestHarness::assertSame(1, (int) $updated['wins'] + (int) $updated['losses'] + (int) $updated['draws'], 'game result did not update the player record');
    foreach ($redis->getLeaderboard() as $leader) {
        PurettTestHarness::assertFalse((int) $leader['id'] === 999999999, 'completed game left the cached leaderboard stale');
    }
});

$test->test('replay authorization rejects another account and traversal-shaped identifiers', function () use (&$state) {
    $database = $state['database'];
    $hash = password_hash('AnotherSafePassword42!', PASSWORD_DEFAULT);
    $other = $database->createLocalAccount(
        'other_' . substr(sha1(uniqid('', true)), 0, 12),
        'Other Player',
        $hash,
        '',
        200
    );
    $otherId = (int) $other['userid'];
    $state['userids'][] = $otherId;
    PurettTestHarness::assertFalse((bool) $database->getAuthorizedGameHistory($state['gameid'], $otherId), 'private replay was visible to another account');
    PurettTestHarness::assertThrows('RuntimeException', function () use (&$state, $otherId) {
        PureTripleTriad_Game::reviewData((string) $state['gameid'], $otherId);
    }, 'another account could read a private replay');
    PurettTestHarness::assertThrows('InvalidArgumentException', function () use (&$state) {
        PureTripleTriad_Game::reviewData('../../etc/passwd', $state['userid']);
    }, 'path traversal-shaped replay ID was accepted');
    PurettTestHarness::assertTrue((bool) $database->getAuthorizedGameHistory(1, $otherId), 'designated public tutorial is not authorized');
});

$test->test('three-day leaderboard uses local profile data and stable ranking fields', function () use (&$state) {
    $leaderboard = $state['database']->getLeaderboard(3);
    $row = null;
    foreach ($leaderboard as $candidate) {
        if ((int) $candidate['id'] === $state['userid']) {
            $row = $candidate;
            break;
        }
    }
    PurettTestHarness::assertTrue($row !== null, 'recent test player is absent from the leaderboard');
    PurettTestHarness::assertSame('Integration Player', $row['display_name'], 'leaderboard did not use local display name');
    foreach (array('wins', 'losses', 'draws', 'games_played', 'average_points', 'score', 'rank', 'avatar_initials') as $field) {
        PurettTestHarness::assertTrue(array_key_exists($field, $row), 'leaderboard field is missing: ' . $field);
    }
    PurettTestHarness::assertSame('IP', $row['avatar_initials'], 'local initials avatar is wrong');
});

$test->test('local account deletion cascades identity, wallet, cards, purchases, and history', function () use (&$state, $projectRoot) {
    $userid = $state['userid'];
    $user = new PureTripleTriad_User($userid);
    $activeGame = new PureTripleTriad_Game($user);
    PurettTestHarness::assertTrue((int) $activeGame->gameid > 0, 'active deletion fixture did not create a game');
    PurettTestHarness::assertTrue((bool) $state['database']->getGame($userid), 'active game missing before account deletion');
    $historyDirectory = $projectRoot . '/var/gamehistory/' . $userid;
    PurettTestHarness::assertTrue(is_dir($historyDirectory), 'expected owned replay directory before deletion');
    $redis = new PureTripleTriad_Redis();
    $redis->setLeaderboard(array(array(
        'id' => $userid,
        'display_name' => 'Deleted Account Sentinel'
    )));
    $user->deleteUser();
    PurettTestHarness::assertFalse((bool) $state['database']->getUser($userid), 'user row survived account deletion');
    PurettTestHarness::assertFalse((bool) $state['database']->getLocalAccountByUsername($state['username']), 'login row survived account deletion');
    PurettTestHarness::assertSame(0, (int) $state['database']->db->fetchOne('SELECT COUNT(*) FROM wallets WHERE userid = ?', array($userid)), 'wallet survived account deletion');
    PurettTestHarness::assertSame(0, (int) $state['database']->db->fetchOne('SELECT COUNT(*) FROM usercards WHERE userid = ?', array($userid)), 'cards survived account deletion');
    PurettTestHarness::assertSame(0, (int) $state['database']->db->fetchOne('SELECT COUNT(*) FROM games WHERE p1 = ?', array($userid)), 'active game survived account deletion');
    PurettTestHarness::assertSame(0, (int) $state['database']->db->fetchOne('SELECT COUNT(*) FROM gamehistory WHERE userid = ?', array($userid)), 'history row survived account deletion');
    PurettTestHarness::assertFalse(is_dir($historyDirectory), 'runtime replay files survived account deletion');
    foreach ($redis->getLeaderboard() as $leader) {
        PurettTestHarness::assertFalse((int) $leader['id'] === $userid, 'deleted account remained in the cached leaderboard');
    }
});

exit($test->run());
