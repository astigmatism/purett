<?php

class PurettFixtureCard
{
    public $n;
    public $e;
    public $s;
    public $w;
    public $captured;
    public $owner;
    public $purchased;
    public $image;
    public $name;
    public $gamecardid;
    public $usercardid;
    public $cardid;
    public $position;
    public $elementbonus;
    public $element;
    public $level;
    public $strengthRank;

    public function __construct($id, $owner, $n, $e, $s, $w, $purchased)
    {
        $this->n = (int) $n;
        $this->e = (int) $e;
        $this->s = (int) $s;
        $this->w = (int) $w;
        $this->owner = (int) $owner;
        $this->captured = (int) $owner;
        $this->purchased = $purchased ? 1 : 0;
        $this->image = 'fixture';
        $this->name = 'Fixture card ' . (int) $id;
        $this->gamecardid = (int) $id;
        $this->usercardid = (int) $id;
        $this->cardid = (int) $id;
        $this->position = -1;
        $this->elementbonus = 0;
        $this->element = -1;
        $this->level = 1;
        $this->strengthRank = $n + $e + $s + $w;
    }

    public function getRank($direction)
    {
        return property_exists($this, $direction) ? $this->$direction : null;
    }
}

class PurettFixtureDatabase
{
    public $deleted = false;
    public $history = array();
    public $victoryClaim = null;
    public $suddenDeath = false;
    public $cardUpdates = array();
    public $committed = false;
    public $balance = 10;
    public $matchAwards = array();

    public function beginTransaction() {}
    public function rollBack() {}
    public function commit() { $this->committed = true; }
    public function setGameHistory($userid, $gameid, $p1score, $p2score)
    {
        $this->history = array($userid, $gameid, $p1score, $p2score);
    }
    public function setVictoryClaim($gameid, $value) { $this->victoryClaim = (int) $value; }
    public function deleteGame($gameid) { $this->deleted = true; }
    public function setSuddenDeath($gameid, $value) { $this->suddenDeath = (bool) $value; }
    public function setGameCard($gamecardid, $position, $captured)
    {
        $this->cardUpdates[] = array($gamecardid, $position, $captured);
    }
    public function getWalletBalance($userid) { return $this->balance; }
    public function awardMatchCoins($userid, $gameid, $amount, $details)
    {
        $reference = 'match:' . (int) $gameid;
        if (isset($this->matchAwards[$reference])) {
            return array('amount' => $this->matchAwards[$reference], 'balance' => $this->balance, 'idempotent' => true);
        }
        $this->matchAwards[$reference] = (int) $amount;
        $this->balance += (int) $amount;
        return array('amount' => (int) $amount, 'balance' => $this->balance, 'idempotent' => false);
    }
}

class PurettFixturePlayer
{
    public $userid = 42;
    public $wins = 0;
    public $losses = 0;
    public $draws = 0;
    public $hand = array();
    public $deck = array();
    public $removed = array();
    public $awarded = array();

    public function recordGameResult($result)
    {
        if ($result > 0) {
            $this->wins++;
        } elseif ($result < 0) {
            $this->losses++;
        } else {
            $this->draws++;
        }
    }
    public function removeUserCard($id) { $this->removed[] = (int) $id; }
    public function getNewCard($cardid, $notes, $inhand, $purchased = false)
    {
        $this->awarded[] = (int) $cardid;
        return $cardid;
    }
    public function tooFewCards() { return array(); }
    public function getOwnershipCount($cardid) { return 0; }
}

class PurettFixtureLog
{
    public $entries = array();

    public function info($entry)
    {
        $this->entries[] = $entry;
    }
}

function purettReflectionSet($object, $property, $value)
{
    $reflection = new ReflectionProperty('PureTripleTriad_Game', $property);
    $reflection->setAccessible(true);
    $reflection->setValue($object, $value);
}

function purettNewEngineFixture($enabledRules)
{
    $reflection = new ReflectionClass('PureTripleTriad_Game');
    $game = $reflection->newInstanceWithoutConstructor();
    $rules = array(
        'closed' => null, 'open' => null, 'same' => null, 'plus' => null,
        'combo' => null, 'same wall' => null, 'elemental' => null,
        'random' => null, 'sudden death' => null, 'take one' => null,
        'take direct' => null, 'take difference' => null, 'take all' => null
    );
    foreach ($enabledRules as $name) {
        $rules[$name] = array('ruleid' => 1, 'rule' => $name, 'description' => 'fixture');
    }
    $game->rules = $rules;
    $game->p1color = 'blue';
    $game->p2color = 'red';
    $game->playboard = array(null, null, null, null, null, null, null, null, null);
    $game->elements = array(-1, -1, -1, -1, -1, -1, -1, -1, -1);
    $game->elementbonus = 1;
    $game->debug = true;
    purettReflectionSet($game, 'db', new PurettFixtureDatabase());
    return $game;
}

function purettInvokePrivate($object, $methodName, $arguments)
{
    $method = new ReflectionMethod('PureTripleTriad_Game', $methodName);
    $method->setAccessible(true);
    return $method->invokeArgs($object, $arguments);
}

function purettVictoryFixture($ruleName, $p1score, $p2score)
{
    $game = purettNewEngineFixture(array($ruleName));
    $database = new PurettFixtureDatabase();
    $player = new PurettFixturePlayer();
    $game->p1 = $player;
    $game->gameid = 9001;
    $game->p1score = (int) $p1score;
    $game->p2score = (int) $p2score;
    $game->victoryclaim = 0;
    purettReflectionSet($game, 'db', $database);

    $cards = array();
    for ($index = 1; $index <= 5; $index++) {
        $card = new PurettFixtureCard($index, $player->userid, 5, 5, 5, 5, $index === 1);
        $card->captured = 1;
        $cards[] = $card;
    }
    for ($index = 6; $index <= 10; $index++) {
        $card = new PurettFixtureCard($index, 1, 5, 5, 5, 5, false);
        $card->usercardid = 0;
        $card->captured = $player->userid;
        $cards[] = $card;
    }
    $game->gamecards = $cards;
    return array($game, $database, $player);
}
