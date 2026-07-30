import fs from 'node:fs';
import {
  MATCH_HAND_ENTRANCE_CACHE_IDENTITY,
  MATCH_HAND_ENTRANCE_DEFAULTS,
  MATCH_HAND_ENTRANCE_SCHEMA_VERSION,
  createMatchHandEntrancePlan,
  sampleMatchHandEntrance
} from '../../frontend/src/match-hand-entrance.js';

let assertions = 0;

function assert(condition, message) {
  assertions += 1;
  if (!condition) {
    throw new Error(message);
  }
}

function close(actual, expected, tolerance = 1e-9) {
  return Math.abs(actual - expected) <= tolerance;
}

function card(side, handIndex) {
  return {
    side,
    handIndex,
    x: side === 'player' ? 28 : 550,
    y: 18 + (handIndex * 55),
    width: 117,
    height: 146
  };
}

function hands(count = 5) {
  return {
    player: Array.from(
      {length: count},
      (_, index) => card('player', index)
    ),
    opponent: Array.from(
      {length: count},
      (_, index) => card('opponent', index)
    )
  };
}

try {
  const plan =
    createMatchHandEntrancePlan(hands());
  assert(
    plan.schemaVersion ===
      MATCH_HAND_ENTRANCE_SCHEMA_VERSION &&
      plan.subject === 'match-hands' &&
      plan.stackAnchor ===
        'last-current-card' &&
      plan.revealOrder ===
        'next-under-top-through-first' &&
      plan.easing === 'cubic-out',
    'the match-hand entrance plan metadata changed'
  );
  assert(
    plan.totalMs === 785 &&
      plan.cards.length === 10 &&
      Object.isFrozen(plan) &&
      Object.isFrozen(plan.cards) &&
      Object.isFrozen(plan.cards[0]) &&
      Object.isFrozen(plan.defaults) &&
      Object.isFrozen(
        plan.cards[0].source
      ) &&
      Object.isFrozen(
        plan.cards[0].destination
      ),
    'the full-hand plan is not exact and immutable'
  );

  for (const side of ['player', 'opponent']) {
    const sideCards = plan.cards.filter(
      (entry) => entry.side === side
    );
    const expectedX =
      side === 'player' ? 86.5 : 608.5;
    assert(
      sideCards.length === 5 &&
        sideCards.every((entry) =>
          close(entry.source.x, expectedX) &&
          close(entry.source.y, 311)
        ),
      `${side} does not stack on its bottom card anchor`
    );
    assert(
      sideCards[4].stationary === true &&
        sideCards[4].topmostInStack === true &&
        sideCards[4].durationMs === 0,
      `${side} bottommost card is not topmost and stationary`
    );
    assert(
      sideCards[3].delayMs === 0 &&
        sideCards[2].delayMs === 55 &&
        sideCards[1].delayMs === 110 &&
        sideCards[0].delayMs === 165,
      `${side} reveal order is not front-to-back`
    );
  }

  const initial =
    sampleMatchHandEntrance(plan, 0);
  assert(
    initial.complete === false &&
      initial.progress === 0 &&
      initial.cards.every((entry) =>
        close(entry.screenY, 311) &&
        close(entry.depth, 0) &&
        close(entry.rotationX, 0) &&
        close(entry.rotationY, 0) &&
        close(entry.rotationZ, 0)
      ),
    'elapsed zero is not two exact flat piles'
  );

  const midpoint =
    sampleMatchHandEntrance(plan, 310);
  for (let index = 0; index < 5; index += 1) {
    const player = midpoint.cards.find(
      (entry) =>
        entry.side === 'player' &&
        entry.handIndex === index
    );
    const opponent = midpoint.cards.find(
      (entry) =>
        entry.side === 'opponent' &&
        entry.handIndex === index
    );
    assert(
      close(
        player.screenX +
          opponent.screenX,
        695
      ) &&
        close(
          player.screenY,
          opponent.screenY
        ) &&
        close(
          player.depth,
          opponent.depth
        ) &&
        close(
          player.rotationY,
          -opponent.rotationY
        ) &&
        close(
          player.rotationZ,
          -opponent.rotationZ
        ),
      `the two hands are not mirrored at index ${index}`
    );
  }

  const firstCardApex =
    sampleMatchHandEntrance(
      plan,
      475
    );
  const apexPlayer =
    firstCardApex.cards.find(
      (entry) =>
        entry.side === 'player' &&
        entry.handIndex === 0
    );
  const apexOpponent =
    firstCardApex.cards.find(
      (entry) =>
        entry.side === 'opponent' &&
        entry.handIndex === 0
    );
  assert(
    close(apexPlayer.depth, 18) &&
      close(apexPlayer.screenX, 82.5) &&
      close(
        apexPlayer.rotationX,
        -4.5 * (Math.PI / 180)
      ) &&
      close(
        apexPlayer.rotationY,
        -2 * (Math.PI / 180)
      ) &&
      close(
        apexPlayer.rotationZ,
        -1.5 * (Math.PI / 180)
      ) &&
      close(apexOpponent.depth, 18) &&
      close(apexOpponent.screenX, 612.5) &&
      close(
        apexOpponent.rotationX,
        apexPlayer.rotationX
      ) &&
      close(
        apexOpponent.rotationY,
        -apexPlayer.rotationY
      ) &&
      close(
        apexOpponent.rotationZ,
        -apexPlayer.rotationZ
      ),
    'the reviewed maximum 3D fan pose changed'
  );

  let previous =
    sampleMatchHandEntrance(plan, 0);
  for (
    let elapsed = 1;
    elapsed <= plan.totalMs;
    elapsed += 1
  ) {
    const sample =
      sampleMatchHandEntrance(
        plan,
        elapsed
      );
    sample.cards.forEach((entry, index) => {
      const prior = previous.cards[index];
      [
        entry.screenX,
        entry.screenY,
        entry.depth,
        entry.rotationX,
        entry.rotationY,
        entry.rotationZ,
        entry.rawProgress,
        entry.easedProgress
      ].forEach((value) => {
        assert(
          Number.isFinite(value),
          'a dense entrance sample became non-finite'
        );
      });
      assert(
        entry.screenY <=
          prior.screenY + 1e-9 &&
          entry.rawProgress >=
          prior.rawProgress - 1e-9,
        'the vertical fan reversed direction'
      );
      assert(
        entry.depth >= -1e-9 &&
          entry.depth <=
            MATCH_HAND_ENTRANCE_DEFAULTS
              .liftDepth + 1e-9 &&
          Math.abs(entry.rotationX) <=
            (
              MATCH_HAND_ENTRANCE_DEFAULTS
                .tiltDegrees *
              (Math.PI / 180)
            ) + 1e-9 &&
          Math.abs(entry.rotationY) <=
            (
              MATCH_HAND_ENTRANCE_DEFAULTS
                .yawDegrees *
              (Math.PI / 180)
            ) + 1e-9 &&
          Math.abs(entry.rotationZ) <=
            (
              MATCH_HAND_ENTRANCE_DEFAULTS
                .rollDegrees *
              (Math.PI / 180)
            ) + 1e-9,
        'a dense entrance sample exceeded its 3D bounds'
      );
    });
    previous = sample;
  }

  const final =
    sampleMatchHandEntrance(
      plan,
      plan.totalMs
    );
  assert(
    final.complete === true &&
      final.progress === 1,
    'the full fan did not complete exactly'
  );
  final.cards.forEach((entry) => {
    const expectedX =
      entry.side === 'player'
        ? 86.5
        : 608.5;
    const expectedY =
      91 + (entry.handIndex * 55);
    assert(
      entry.screenX === expectedX &&
        entry.screenY === expectedY &&
        entry.depth === 0 &&
        entry.rotationX === 0 &&
        entry.rotationY === 0 &&
        entry.rotationZ === 0 &&
        entry.complete === true,
      'a final fan pose missed its canonical hand anchor'
    );
  });

  const repeated =
    sampleMatchHandEntrance(plan, 417.25);
  const irregular =
    sampleMatchHandEntrance(plan, 417.25);
  assert(
    JSON.stringify(repeated) ===
      JSON.stringify(irregular),
    'sampling depends on frame history'
  );

  const emptyPlan =
    createMatchHandEntrancePlan(hands(0));
  const onePlan =
    createMatchHandEntrancePlan(hands(1));
  const threePlan =
    createMatchHandEntrancePlan(hands(3));
  const asymmetricHands = {
    player: hands(3).player,
    opponent: hands(5).opponent
  };
  const asymmetricBefore =
    JSON.stringify(asymmetricHands);
  const asymmetricPlan =
    createMatchHandEntrancePlan(
      asymmetricHands
    );
  const opponentOnlyPlan =
    createMatchHandEntrancePlan({
      player: [],
      opponent: hands(4).opponent
    });
  assert(
    emptyPlan.totalMs === 0 &&
      sampleMatchHandEntrance(
        emptyPlan,
        0
      ).complete === true &&
      onePlan.totalMs === 0 &&
      onePlan.cards.every(
        (entry) =>
          entry.stationary &&
          entry.topmostInStack
      ) &&
      threePlan.totalMs === 675,
    'partial-hand timing or settlement changed'
  );
  assert(
    asymmetricPlan.cards.length === 8 &&
      asymmetricPlan.totalMs === 785 &&
      asymmetricPlan.cards
        .filter(entry =>
          entry.side === 'player'
        )
        .every(entry =>
          close(entry.source.y, 201)
        ) &&
      asymmetricPlan.cards
        .filter(entry =>
          entry.side === 'opponent'
        )
        .every(entry =>
          close(entry.source.y, 311)
        ) &&
      opponentOnlyPlan.cards.length ===
        4 &&
      opponentOnlyPlan.cards.every(
        entry =>
          entry.side === 'opponent' &&
          close(entry.source.y, 256)
      ) &&
      JSON.stringify(asymmetricHands) ===
        asymmetricBefore,
    'asymmetric hands did not anchor independently or input was mutated'
  );

  const source = fs.readFileSync(
    new URL(
      '../../frontend/src/match-hand-entrance.js',
      import.meta.url
    ),
    'utf8'
  );
  assert(
    !source.includes('Math.random') &&
      !source.includes('document.') &&
      !source.includes('window.') &&
      !source.includes('requestAnimationFrame') &&
      !source.includes('Raphael') &&
      !source.includes('jQuery'),
    'the pure entrance module acquired a runtime dependency'
  );

  const invalidCases = [
    () => createMatchHandEntrancePlan({
      player: Array.from(
        {length: 6},
        (_, index) =>
          card('player', index)
      ),
      opponent: []
    }),
    () => createMatchHandEntrancePlan({
      player: [
        {
          ...card('player', 0),
          x: Number.NaN
        }
      ],
      opponent: []
    }),
    () => createMatchHandEntrancePlan({
      player: [
        card('player', 1)
      ],
      opponent: []
    }),
    () => sampleMatchHandEntrance(
      plan,
      -1
    ),
    () => sampleMatchHandEntrance(
      null,
      0
    )
  ];
  invalidCases.forEach((invalid) => {
    let rejected = false;
    try {
      invalid();
    } catch (error) {
      rejected = true;
    }
    assert(
      rejected,
      'an invalid entrance input was accepted'
    );
  });

  assert(
    MATCH_HAND_ENTRANCE_CACHE_IDENTITY ===
      '0.185.1-match-hand-fan.1' &&
    MATCH_HAND_ENTRANCE_DEFAULTS
      .cardDurationMs === 620 &&
      MATCH_HAND_ENTRANCE_DEFAULTS
        .staggerMs === 55,
    'the reviewed default cadence changed'
  );

  console.log(
    'match-hand entrance contract passed ' +
    `(${assertions} assertions)`
  );
} catch (error) {
  console.error(
    'match-hand entrance contract failed: ' +
    error.message
  );
  process.exitCode = 1;
}
