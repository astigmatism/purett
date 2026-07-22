<?php

/**
 * AI move scoring for the capture union specified by docs/rules.md §7.3.
 *
 * Each scenario leaves exactly one board position open and one CPU card in
 * hand. That makes compute() deterministic even though the legacy AI can
 * intentionally choose randomly between otherwise viable moves.
 */

function purettNewAiSingleMoveFixture($enabledRules, $position, $candidate, $neighbors)
{
    $game = purettNewEngineFixture($enabledRules);
    $game->p1score = 5;
    $game->p2score = 5;

    for ($index = 0; $index < 9; $index++) {
        if ($index === (int) $position) {
            continue;
        }
        $boardCard = new PurettFixtureCard(1000 + $index, 1, 9, 9, 9, 9, false);
        $boardCard->position = $index;
        $game->playboard[$index] = $boardCard;
    }

    foreach ($neighbors as $neighborPosition => $neighbor) {
        $neighbor->position = (int) $neighborPosition;
        $game->playboard[$neighborPosition] = $neighbor;
    }

    $candidate->position = -2;
    $game->gamecards = array($candidate);
    foreach ($game->playboard as $boardCard) {
        if ($boardCard) {
            $game->gamecards[] = $boardCard;
        }
    }

    return $game;
}

function purettComputeOnlyAiMove($game)
{
    $ai = new PureTripleTriad_AI(10);
    return $ai->compute($game);
}

$test->test('AI rules §6.6: an A-facing boundary witnesses Same only with Same Wall', function () {
    $inactiveCandidate = new PurettFixtureCard(1, 1, 10, 6, 1, 1, false);
    $inactiveEast = new PurettFixtureCard(2, 42, 1, 1, 1, 6, false);
    $inactiveGame = purettNewAiSingleMoveFixture(
        array('same'),
        1,
        $inactiveCandidate,
        array(2 => $inactiveEast)
    );

    $inactiveScore = purettComputeOnlyAiMove($inactiveGame);

    PurettTestHarness::assertSame(0, $inactiveScore['flips'], 'AI used a wall without Same Wall');
    PurettTestHarness::assertSame(1, $inactiveScore['gamecardid'], 'AI returned the wrong legal card');
    PurettTestHarness::assertSame(1, $inactiveScore['position'], 'AI returned the wrong legal position');

    $activeCandidate = new PurettFixtureCard(3, 1, 10, 6, 1, 1, false);
    $activeEast = new PurettFixtureCard(4, 42, 1, 1, 1, 6, false);
    $activeGame = purettNewAiSingleMoveFixture(
        array('same', 'same wall'),
        1,
        $activeCandidate,
        array(2 => $activeEast)
    );

    $activeScore = purettComputeOnlyAiMove($activeGame);

    PurettTestHarness::assertSame(1, $activeScore['flips'], 'AI ignored a valid Same Wall witness');
    PurettTestHarness::assertSame(42, $activeEast->captured, 'AI evaluation mutated board control');
});

$test->test('AI rules §6.5: an equal side remains eligible for Plus when Same does not activate', function () {
    $candidate = new PurettFixtureCard(10, 1, 4, 1, 2, 3, false);
    $north = new PurettFixtureCard(11, 42, 1, 1, 4, 1, false);
    $west = new PurettFixtureCard(12, 42, 1, 5, 1, 1, false);
    $east = new PurettFixtureCard(13, 1, 1, 1, 1, 9, false);
    $south = new PurettFixtureCard(14, 1, 9, 1, 1, 1, false);
    $game = purettNewAiSingleMoveFixture(
        array('same', 'plus'),
        4,
        $candidate,
        array(1 => $north, 3 => $west, 5 => $east, 7 => $south)
    );

    $score = purettComputeOnlyAiMove($game);

    PurettTestHarness::assertSame(2, $score['flips'], 'AI discarded the equal participant from the 8/8 Plus group');
    PurettTestHarness::assertSame(10, $score['gamecardid'], 'AI returned the wrong legal card');
    PurettTestHarness::assertSame(4, $score['position'], 'AI returned the wrong legal position');
    PurettTestHarness::assertSame(-2, $candidate->position, 'AI evaluation moved the hand card');
    PurettTestHarness::assertFalse(array_key_exists('_captures', $score), 'AI exposed internal capture bookkeeping');
});

$test->test('AI rules §7.3: Same and Plus score their overlapping captures once', function () {
    $candidate = new PurettFixtureCard(20, 1, 4, 2, 1, 3, false);
    $north = new PurettFixtureCard(21, 42, 1, 1, 4, 1, false);
    $west = new PurettFixtureCard(22, 42, 1, 5, 1, 1, false);
    $east = new PurettFixtureCard(23, 42, 1, 1, 1, 2, false);
    $south = new PurettFixtureCard(24, 1, 9, 1, 1, 1, false);
    $game = purettNewAiSingleMoveFixture(
        array('same', 'plus'),
        4,
        $candidate,
        array(1 => $north, 3 => $west, 5 => $east, 7 => $south)
    );

    $score = purettComputeOnlyAiMove($game);

    // Same captures north/east; Plus captures north/west. The union has three cards.
    PurettTestHarness::assertSame(3, $score['flips'], 'AI counted the shared north capture more than once');
});

$test->test('AI rules §7.3: basic and Plus captures are scored as one union', function () {
    $candidate = new PurettFixtureCard(30, 1, 5, 1, 1, 2, false);
    $north = new PurettFixtureCard(31, 42, 1, 1, 3, 1, false);
    $west = new PurettFixtureCard(32, 42, 1, 6, 1, 1, false);
    $east = new PurettFixtureCard(33, 1, 1, 1, 1, 9, false);
    $south = new PurettFixtureCard(34, 1, 8, 1, 1, 1, false);
    $game = purettNewAiSingleMoveFixture(
        array('plus'),
        4,
        $candidate,
        array(1 => $north, 3 => $west, 5 => $east, 7 => $south)
    );

    $score = purettComputeOnlyAiMove($game);

    // North is both a basic and Plus capture; west is Plus-only.
    PurettTestHarness::assertSame(2, $score['flips'], 'AI double-counted a basic/Plus overlap');
});

$test->test('AI rules §§6.7, 7.3: Elemental basic and Same overlaps are scored once', function () {
    $candidate = new PurettFixtureCard(40, 1, 4, 1, 1, 7, false);
    $candidate->element = 3;
    $north = new PurettFixtureCard(41, 42, 1, 1, 4, 1, false);
    $west = new PurettFixtureCard(42, 42, 1, 7, 1, 1, false);
    $east = new PurettFixtureCard(43, 1, 1, 1, 1, 9, false);
    $south = new PurettFixtureCard(44, 1, 9, 1, 1, 1, false);
    $game = purettNewAiSingleMoveFixture(
        array('same', 'elemental'),
        4,
        $candidate,
        array(1 => $north, 3 => $west, 5 => $east, 7 => $south)
    );
    $game->elements[4] = 3;

    $score = purettComputeOnlyAiMove($game);

    PurettTestHarness::assertSame(2, $score['flips'], 'AI double-counted Elemental basic/Same overlaps');
    PurettTestHarness::assertSame(0, $candidate->elementbonus, 'AI did not restore its temporary Elemental bonus');
});
