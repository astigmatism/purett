<?php

/**
 * Core match rules from docs/rules.md §§2–8 and its compact resolver.
 *
 * These tests deliberately exercise PureTripleTriad_Game rather than a second
 * reference implementation. Reflection only bypasses constructor persistence
 * so that capture resolution can be tested without MariaDB or Redis.
 */

function purettPlaceFixtureNeighbor($game, $position, $card)
{
    $card->position = (int) $position;
    $game->playboard[$position] = $card;
    return $card;
}

function purettAllFlipPositions($captureResult)
{
    $positions = array();
    foreach ($captureResult as $resolution) {
        foreach ($resolution as $ruleResult) {
            foreach ($ruleResult['flips'] as $flip) {
                $positions[] = (int) $flip['p'];
            }
        }
    }
    sort($positions);
    return array_values(array_unique($positions));
}

$test->test('rules §4.1: basic capture compares the correct rank in every direction', function () {
    $cases = array(
        array(1, array(6, 1, 1, 1), array(1, 1, 5, 1)),
        array(5, array(1, 6, 1, 1), array(1, 1, 1, 5)),
        array(7, array(1, 1, 6, 1), array(5, 1, 1, 1)),
        array(3, array(1, 1, 1, 6), array(1, 5, 1, 1))
    );

    foreach ($cases as $index => $case) {
        $game = purettNewEngineFixture(array());
        $enemyRanks = $case[2];
        $enemy = new PurettFixtureCard(
            100 + $index,
            1,
            $enemyRanks[0],
            $enemyRanks[1],
            $enemyRanks[2],
            $enemyRanks[3],
            false
        );
        purettPlaceFixtureNeighbor($game, $case[0], $enemy);
        $playedRanks = $case[1];
        $played = new PurettFixtureCard(
            200 + $index,
            42,
            $playedRanks[0],
            $playedRanks[1],
            $playedRanks[2],
            $playedRanks[3],
            false
        );

        purettInvokePrivate($game, 'capture', array($played, 4, array()));
        PurettTestHarness::assertSame(42, $enemy->captured, 'direction case ' . $index . ' did not capture');
    }
});

$test->test('rules §§2.3, 4.1: diagonal and row-wrapped cards are not adjacent', function () {
    $game = purettNewEngineFixture(array());
    $diagonal = new PurettFixtureCard(1, 1, 1, 1, 1, 1, false);
    $wrapped = new PurettFixtureCard(2, 1, 1, 1, 1, 1, false);
    purettPlaceFixtureNeighbor($game, 1, $diagonal);
    purettPlaceFixtureNeighbor($game, 2, $wrapped);
    $played = new PurettFixtureCard(3, 42, 10, 10, 10, 10, false);

    purettInvokePrivate($game, 'capture', array($played, 3, array()));

    PurettTestHarness::assertSame(1, $diagonal->captured, 'diagonal card was captured');
    PurettTestHarness::assertSame(1, $wrapped->captured, 'card across a row boundary was captured');
});

$test->test('rules §§2.2, 4.1–4.2: equality, lower ranks, and 1 versus A never capture', function () {
    $cases = array(
        array(5, 5, 'equal rank captured'),
        array(4, 5, 'lower rank captured'),
        array(1, 10, 'Fallen Ace behavior was introduced')
    );

    foreach ($cases as $index => $case) {
        $game = purettNewEngineFixture(array());
        $enemy = new PurettFixtureCard(10 + $index, 1, 1, 1, 1, $case[1], false);
        purettPlaceFixtureNeighbor($game, 5, $enemy);
        $played = new PurettFixtureCard(20 + $index, 42, 1, $case[0], 1, 1, false);
        purettInvokePrivate($game, 'capture', array($played, 4, array()));
        PurettTestHarness::assertSame(1, $enemy->captured, $case[2]);
        PurettTestHarness::assertSame(42, $played->captured, 'failed attacker was captured in retaliation');
    }
});

$test->test('rules §4.1: one placement can capture all four enemy neighbors', function () {
    $game = purettNewEngineFixture(array());
    $neighbors = array(
        1 => new PurettFixtureCard(1, 1, 1, 1, 2, 1, false),
        5 => new PurettFixtureCard(2, 1, 1, 1, 1, 2, false),
        7 => new PurettFixtureCard(3, 1, 2, 1, 1, 1, false),
        3 => new PurettFixtureCard(4, 1, 1, 2, 1, 1, false)
    );
    foreach ($neighbors as $position => $neighbor) {
        purettPlaceFixtureNeighbor($game, $position, $neighbor);
    }
    $played = new PurettFixtureCard(5, 42, 3, 3, 3, 3, false);

    purettInvokePrivate($game, 'capture', array($played, 4, array()));

    foreach ($neighbors as $neighbor) {
        PurettTestHarness::assertSame(42, $neighbor->captured, 'an adjacent lower card did not flip');
    }
});

$test->test('rules §§6.4, 13.2: Same accepts different equal ranks and a friendly witness', function () {
    $game = purettNewEngineFixture(array('same'));
    $friendlyNorth = new PurettFixtureCard(1, 42, 1, 1, 4, 1, false);
    $enemyWest = new PurettFixtureCard(2, 1, 1, 7, 1, 1, false);
    purettPlaceFixtureNeighbor($game, 1, $friendlyNorth);
    purettPlaceFixtureNeighbor($game, 3, $enemyWest);
    $played = new PurettFixtureCard(3, 42, 4, 1, 1, 7, false);

    purettInvokePrivate($game, 'capture', array($played, 4, array()));

    PurettTestHarness::assertSame(42, $friendlyNorth->captured, 'friendly Same witness changed control');
    PurettTestHarness::assertSame(42, $enemyWest->captured, 'friendly witness did not complete Same');
});

$test->test('rules §6.4: a single equal side is insufficient for Same', function () {
    $game = purettNewEngineFixture(array('same'));
    $north = new PurettFixtureCard(1, 1, 1, 1, 4, 1, false);
    $west = new PurettFixtureCard(2, 1, 1, 9, 1, 1, false);
    purettPlaceFixtureNeighbor($game, 1, $north);
    purettPlaceFixtureNeighbor($game, 3, $west);
    $played = new PurettFixtureCard(3, 42, 4, 1, 1, 2, false);

    purettInvokePrivate($game, 'capture', array($played, 4, array()));

    PurettTestHarness::assertSame(1, $north->captured, 'one equality incorrectly triggered Same');
    PurettTestHarness::assertSame(1, $west->captured, 'nonmatching card was captured');
});

$test->test('rules §§6.5, 13.3: Plus captures every participant in duplicate sum groups', function () {
    $game = purettNewEngineFixture(array('plus'));
    $neighbors = array(
        1 => new PurettFixtureCard(1, 1, 1, 1, 3, 1, false),
        5 => new PurettFixtureCard(2, 1, 1, 1, 1, 2, false),
        7 => new PurettFixtureCard(3, 1, 5, 1, 1, 1, false),
        3 => new PurettFixtureCard(4, 1, 1, 4, 1, 1, false)
    );
    foreach ($neighbors as $position => $neighbor) {
        purettPlaceFixtureNeighbor($game, $position, $neighbor);
    }
    // Sums clockwise from north are 5, 5, 9, 9.
    $played = new PurettFixtureCard(5, 42, 2, 3, 4, 5, false);

    purettInvokePrivate($game, 'capture', array($played, 4, array()));

    foreach ($neighbors as $neighbor) {
        PurettTestHarness::assertSame(42, $neighbor->captured, 'duplicate Plus group participant did not flip');
    }
});

$test->test('rules §6.5: a friendly card can witness Plus without flipping', function () {
    $game = purettNewEngineFixture(array('plus'));
    $friendlyNorth = new PurettFixtureCard(1, 42, 1, 1, 3, 1, false);
    $enemyWest = new PurettFixtureCard(2, 1, 1, 5, 1, 1, false);
    purettPlaceFixtureNeighbor($game, 1, $friendlyNorth);
    purettPlaceFixtureNeighbor($game, 3, $enemyWest);
    $played = new PurettFixtureCard(3, 42, 4, 1, 1, 2, false);

    purettInvokePrivate($game, 'capture', array($played, 4, array()));

    PurettTestHarness::assertSame(42, $friendlyNorth->captured, 'friendly Plus witness changed control');
    PurettTestHarness::assertSame(42, $enemyWest->captured, 'friendly witness did not complete Plus');
});

$test->test('rules §6.6: Same Wall requires Same and an A-facing boundary', function () {
    $inactive = purettNewEngineFixture(array('same wall'));
    $inactiveEast = new PurettFixtureCard(1, 1, 1, 1, 1, 6, false);
    purettPlaceFixtureNeighbor($inactive, 2, $inactiveEast);
    $inactivePlayed = new PurettFixtureCard(2, 42, 10, 6, 1, 1, false);
    purettInvokePrivate($inactive, 'capture', array($inactivePlayed, 1, array()));
    PurettTestHarness::assertSame(1, $inactiveEast->captured, 'Same Wall worked without Same');

    $active = purettNewEngineFixture(array('same', 'same wall'));
    $activeEast = new PurettFixtureCard(3, 1, 1, 1, 1, 6, false);
    purettPlaceFixtureNeighbor($active, 2, $activeEast);
    $activePlayed = new PurettFixtureCard(4, 42, 10, 6, 1, 1, false);
    purettInvokePrivate($active, 'capture', array($activePlayed, 1, array()));
    PurettTestHarness::assertSame(42, $activeEast->captured, 'A wall plus card equality did not trigger Same');

    $nonAce = purettNewEngineFixture(array('same', 'same wall'));
    $nonAceEast = new PurettFixtureCard(5, 1, 1, 1, 1, 6, false);
    purettPlaceFixtureNeighbor($nonAce, 2, $nonAceEast);
    $nonAcePlayed = new PurettFixtureCard(6, 42, 9, 6, 1, 1, false);
    purettInvokePrivate($nonAce, 'capture', array($nonAcePlayed, 1, array()));
    PurettTestHarness::assertSame(1, $nonAceEast->captured, 'a non-A rank matched the wall');
});

$test->test('rules §6.6: two A-facing corner walls do not capture or seed Combo', function () {
    $game = purettNewEngineFixture(array('same', 'same wall', 'combo'));
    $played = new PurettFixtureCard(1, 42, 10, 1, 1, 10, false);
    $result = purettInvokePrivate($game, 'capture', array($played, 0, array()));

    PurettTestHarness::assertCount(0, purettAllFlipPositions($result), 'walls produced a card capture');
    PurettTestHarness::assertCount(1, $result, 'wall-only Same incorrectly created Combo recursion');
});

$test->test('rules §§6.7, 13.6: Elemental modifiers affect both attacker and defender', function () {
    $attackerGame = purettNewEngineFixture(array('elemental'));
    $attackerEnemy = new PurettFixtureCard(1, 1, 1, 1, 1, 5, false);
    purettPlaceFixtureNeighbor($attackerGame, 5, $attackerEnemy);
    $boosted = new PurettFixtureCard(2, 42, 1, 5, 1, 1, false);
    $boosted->elementbonus = 1;
    purettInvokePrivate($attackerGame, 'capture', array($boosted, 4, array()));
    PurettTestHarness::assertSame(42, $attackerEnemy->captured, 'attacker +1 was ignored');

    $penaltyGame = purettNewEngineFixture(array('elemental'));
    $penaltyEnemy = new PurettFixtureCard(3, 1, 1, 1, 1, 5, false);
    purettPlaceFixtureNeighbor($penaltyGame, 5, $penaltyEnemy);
    $penalized = new PurettFixtureCard(4, 42, 1, 6, 1, 1, false);
    $penalized->elementbonus = -1;
    purettInvokePrivate($penaltyGame, 'capture', array($penalized, 4, array()));
    PurettTestHarness::assertSame(1, $penaltyEnemy->captured, 'attacker -1 was ignored');

    $defenderGame = purettNewEngineFixture(array('elemental'));
    $penalizedDefender = new PurettFixtureCard(5, 1, 1, 1, 1, 6, false);
    $penalizedDefender->elementbonus = -1;
    purettPlaceFixtureNeighbor($defenderGame, 5, $penalizedDefender);
    $plainAttacker = new PurettFixtureCard(6, 42, 1, 6, 1, 1, false);
    purettInvokePrivate($defenderGame, 'capture', array($plainAttacker, 4, array()));
    PurettTestHarness::assertSame(42, $penalizedDefender->captured, 'defender -1 was ignored');
});

$test->test('rules §6.7: Same and Plus use printed ranks despite Elemental penalties', function () {
    $sameGame = purettNewEngineFixture(array('same', 'elemental'));
    $sameNorth = new PurettFixtureCard(1, 1, 1, 1, 4, 1, false);
    $sameWest = new PurettFixtureCard(2, 1, 1, 7, 1, 1, false);
    purettPlaceFixtureNeighbor($sameGame, 1, $sameNorth);
    purettPlaceFixtureNeighbor($sameGame, 3, $sameWest);
    $samePlayed = new PurettFixtureCard(3, 42, 4, 1, 1, 7, false);
    $samePlayed->elementbonus = -1;
    purettInvokePrivate($sameGame, 'capture', array($samePlayed, 4, array()));
    PurettTestHarness::assertSame(42, $sameNorth->captured, 'Elemental modifier changed Same equality');
    PurettTestHarness::assertSame(42, $sameWest->captured, 'Elemental modifier changed Same equality');

    $plusGame = purettNewEngineFixture(array('plus', 'elemental'));
    $plusNorth = new PurettFixtureCard(4, 1, 1, 1, 3, 1, false);
    $plusWest = new PurettFixtureCard(5, 1, 1, 5, 1, 1, false);
    purettPlaceFixtureNeighbor($plusGame, 1, $plusNorth);
    purettPlaceFixtureNeighbor($plusGame, 3, $plusWest);
    $plusPlayed = new PurettFixtureCard(6, 42, 4, 1, 1, 2, false);
    $plusPlayed->elementbonus = -1;
    purettInvokePrivate($plusGame, 'capture', array($plusPlayed, 4, array()));
    PurettTestHarness::assertSame(42, $plusNorth->captured, 'Elemental modifier changed Plus sum');
    PurettTestHarness::assertSame(42, $plusWest->captured, 'Elemental modifier changed Plus sum');
});

$test->test('rules §§7.1, 13.5: Same seeds a recursive multi-link Combo', function () {
    $game = purettNewEngineFixture(array('same', 'combo'));
    $north = new PurettFixtureCard(2, 1, 1, 8, 4, 9, false);
    $west = new PurettFixtureCard(3, 1, 1, 7, 1, 1, false);
    $northEast = new PurettFixtureCard(4, 1, 1, 1, 9, 6, false);
    $east = new PurettFixtureCard(5, 1, 4, 1, 1, 1, false);
    purettPlaceFixtureNeighbor($game, 1, $north);
    purettPlaceFixtureNeighbor($game, 3, $west);
    purettPlaceFixtureNeighbor($game, 2, $northEast);
    purettPlaceFixtureNeighbor($game, 5, $east);
    $played = new PurettFixtureCard(6, 42, 4, 1, 1, 7, false);

    purettInvokePrivate($game, 'capture', array($played, 4, array()));

    PurettTestHarness::assertSame(42, $north->captured, 'Same did not capture north seed');
    PurettTestHarness::assertSame(42, $west->captured, 'Same did not capture west seed');
    PurettTestHarness::assertSame(42, $northEast->captured, 'first Combo link did not capture');
    PurettTestHarness::assertSame(42, $east->captured, 'second Combo link did not capture');
});

$test->test('rules §7.2: an ordinary capture never seeds Combo', function () {
    $game = purettNewEngineFixture(array('combo'));
    $north = new PurettFixtureCard(1, 1, 1, 9, 2, 1, false);
    $northEast = new PurettFixtureCard(2, 1, 1, 1, 1, 1, false);
    purettPlaceFixtureNeighbor($game, 1, $north);
    purettPlaceFixtureNeighbor($game, 2, $northEast);
    $played = new PurettFixtureCard(3, 42, 3, 1, 1, 1, false);

    purettInvokePrivate($game, 'capture', array($played, 4, array()));

    PurettTestHarness::assertSame(42, $north->captured, 'ordinary capture precondition failed');
    PurettTestHarness::assertSame(1, $northEast->captured, 'ordinary capture incorrectly seeded Combo');
});

$test->test('rules §§6.7, 7.1: persistent Elemental modifiers apply during Combo', function () {
    $game = purettNewEngineFixture(array('same', 'combo', 'elemental'));
    $north = new PurettFixtureCard(1, 1, 1, 5, 4, 1, false);
    $north->elementbonus = 1;
    $west = new PurettFixtureCard(2, 1, 1, 7, 1, 1, false);
    $northEast = new PurettFixtureCard(3, 1, 1, 1, 1, 5, false);
    purettPlaceFixtureNeighbor($game, 1, $north);
    purettPlaceFixtureNeighbor($game, 3, $west);
    purettPlaceFixtureNeighbor($game, 2, $northEast);
    $played = new PurettFixtureCard(4, 42, 4, 1, 1, 7, false);

    purettInvokePrivate($game, 'capture', array($played, 4, array()));

    PurettTestHarness::assertSame(42, $north->captured, 'Same did not create Elemental Combo seed');
    PurettTestHarness::assertSame(42, $northEast->captured, 'Combo ignored seed card Elemental bonus');
});

$test->test('rules §5.2: scoring counts all ten cards and transfers one point per capture', function () {
    $game = purettNewEngineFixture(array());
    $player = new PurettFixturePlayer();
    $player->wins = 1;
    $game->p1 = $player;
    $game->gameid = 77;
    $game->p1score = 5;
    $game->p2score = 5;
    purettReflectionSet($game, 'gamehistorylog', new PurettFixtureLog());

    $played = new PurettFixtureCard(1, 42, 1, 6, 1, 1, false);
    $cards = array($played);
    for ($index = 2; $index <= 5; $index++) {
        $cards[] = new PurettFixtureCard($index, 42, 1, 1, 1, 1, false);
    }
    $enemy = new PurettFixtureCard(6, 1, 1, 1, 1, 5, false);
    purettPlaceFixtureNeighbor($game, 5, $enemy);
    $cards[] = $enemy;
    for ($index = 7; $index <= 10; $index++) {
        $card = new PurettFixtureCard($index, 1, 1, 1, 1, 1, false);
        $card->position = -2;
        $cards[] = $card;
    }
    $game->gamecards = $cards;

    $result = $game->play($played->gamecardid, 4, 42);

    PurettTestHarness::assertSame(6, $game->p1score, 'capture did not raise player score from five to six');
    PurettTestHarness::assertSame(4, $game->p2score, 'capture did not lower opponent score from five to four');
    PurettTestHarness::assertSame(10, $result['p1s'] + $result['p2s'], 'score omitted unplayed cards');
});

$test->test('rules §6.3: Sudden Death repartitions all cards by control and clears round state', function () {
    $game = purettNewEngineFixture(array('sudden death'));
    $database = new PurettFixtureDatabase();
    purettReflectionSet($game, 'db', $database);
    $game->gameid = 88;
    $game->cardsplayed = 9;

    $humanOwnedButRed = new PurettFixtureCard(1, 42, 1, 1, 1, 1, false);
    $humanOwnedButRed->captured = 1;
    $humanOwnedButRed->elementbonus = 1;
    purettPlaceFixtureNeighbor($game, 3, $humanOwnedButRed);
    $computerOwnedButBlue = new PurettFixtureCard(2, 1, 1, 1, 1, 1, false);
    $computerOwnedButBlue->captured = 42;
    $computerOwnedButBlue->elementbonus = -1;
    purettPlaceFixtureNeighbor($game, 4, $computerOwnedButBlue);
    $game->gamecards = array($humanOwnedButRed, $computerOwnedButBlue);

    purettInvokePrivate($game, 'setSuddenDeath', array());

    PurettTestHarness::assertTrue($game->insuddendeath, 'Sudden Death continuation flag was not set');
    PurettTestHarness::assertSame(0, $game->cardsplayed, 'placement count was not reset');
    PurettTestHarness::assertSame(-2, $humanOwnedButRed->position, 'red-controlled card did not enter red hand');
    PurettTestHarness::assertSame(-1, $computerOwnedButBlue->position, 'blue-controlled card did not enter blue hand');
    PurettTestHarness::assertSame(0, $humanOwnedButRed->elementbonus, 'old Elemental bonus survived round reset');
    PurettTestHarness::assertSame(0, $computerOwnedButBlue->elementbonus, 'old Elemental penalty survived round reset');
    PurettTestHarness::assertCount(0, array_filter($game->playboard), 'board was not cleared');
    PurettTestHarness::assertCount(2, $database->cardUpdates, 'new hand positions were not persisted');
});

$test->test('rules §§5.2, 8.2: score difference helpers preserve decisive margins', function () {
    $expectations = array(
        array(5, 5, 0),
        array(4, 6, 0),
        array(6, 4, 2),
        array(7, 3, 4),
        array(8, 2, 6),
        array(9, 1, 8)
    );
    foreach ($expectations as $expectation) {
        PurettTestHarness::assertSame(
            $expectation[2],
            PureTripleTriad_Game::getCoinReward($expectation[0], $expectation[1]),
            'unexpected margin for ' . $expectation[0] . '-' . $expectation[1]
        );
    }
});
