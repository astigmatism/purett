import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  CARD_ARRIVAL_PROFILES,
  CASUAL_DROP_LEFT_PROFILE,
  createCardArrivalBatch,
  sampleCardArrival
} from '../../frontend/src/card-arrival-animations.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.resolve(
  directory,
  '../../frontend/src/card-arrival-animations.js'
);
const source = fs.readFileSync(sourcePath, 'utf8');
const lobbyCameraDistance =
  (562 / 2) / Math.tan((40 * Math.PI / 180) / 2);
let assertions = 0;

function assert(condition, message) {
  assertions += 1;
  if (!condition) {
    throw new Error(message);
  }
}

function fixtureCards(yOffset = 0) {
  return [72, 197, 322, 447, 572].map((x, index) => ({
    index,
    userCardId: `user-card-${index}`,
    cardId: `card-${index}`,
    textureUrl: `/images/cards/blue/${index}.png`,
    width: 117,
    height: 146,
    viewportHeight: 562,
    perspectiveDistance: lobbyCameraDistance,
    destination: {
      x: x + (117 / 2),
      y: 286 + yOffset,
      z: -1.7
    }
  }));
}

try {
  const request = {
    id: 'lobby-presentation-17',
    trigger: 'command-bar-reveal',
    profile: 'casual-drop-left',
    seed: 'repeatable-arrival-fixture'
  };
  const cards = fixtureCards();
  const first = createCardArrivalBatch(cards, request);
  const repeated = createCardArrivalBatch(cards, request);
  const changedSeed = createCardArrivalBatch(cards, {
    ...request,
    seed: 'a-different-arrival-fixture'
  });
  const alternateDestinations = createCardArrivalBatch(
    fixtureCards(84),
    request
  );

  assert(
    CASUAL_DROP_LEFT_PROFILE.name === 'casual-drop-left',
    'the reusable casual-left profile is missing'
  );
  assert(
    CARD_ARRIVAL_PROFILES['casual-drop-left'] ===
      CASUAL_DROP_LEFT_PROFILE,
    'the reusable profile registry does not resolve casual-drop-left'
  );
  assert(
    JSON.stringify(first) === JSON.stringify(repeated),
    'identical input does not reproduce the same arrival batch'
  );
  assert(
    first.totalDurationMs <= 2000 &&
      first.totalDurationMs <= first.maxBatchDurationMs,
    'the five-card arrival batch exceeds its two-second deadline'
  );
  assert(
    first.totalDurationMs === Math.max(
      ...first.plans.map((plan) => plan.totalDurationMs)
    ) &&
      first.plans.every((plan) => plan.totalDurationMs <= 2000),
    'the batch deadline does not bound every individual plan'
  );
  assert(
    new Set(first.plans.map((plan) => plan.orderIndex)).size === cards.length,
    'the deterministic stagger order is not a permutation'
  );
  assert(
    first.plans.every((plan, index) => (
      plan.launchHalfExtent > (cards[index].width / 2) &&
      plan.start.x + plan.launchHalfExtent < 0
    )),
    'one or more transformed launch footprints are not off-screen left'
  );
  assert(
    first.plans.some((plan, index) => (
      plan.start.x !== changedSeed.plans[index].start.x ||
      plan.start.y !== changedSeed.plans[index].start.y ||
      plan.delayMs !== changedSeed.plans[index].delayMs
    )),
    'changing the seed does not change transient choreography'
  );
  assert(
    changedSeed.plans.every((plan, index) => (
      JSON.stringify(plan.destination) ===
      JSON.stringify(first.plans[index].destination)
    )),
    'changing the seed changes an exact destination'
  );
  assert(
    alternateDestinations.plans.every((plan, index) => (
      plan.destination.y === cards[index].destination.y + 84
    )),
    'the planner does not honor caller-supplied destinations'
  );

  first.plans.forEach((plan, index) => {
    const waiting = sampleCardArrival(plan, 0);
    const flight = sampleCardArrival(
      plan,
      plan.delayMs + (plan.durationMs * 0.35)
    );
    const landing = sampleCardArrival(
      plan,
      plan.delayMs + (plan.durationMs * 0.9)
    );
    const settled = sampleCardArrival(plan, plan.totalDurationMs);

    assert(
      waiting.phase === 'waiting' &&
        waiting.screenX === plan.start.x &&
        waiting.depth === plan.start.depth &&
        waiting.z === plan.destination.z + plan.start.depth,
      `card ${index} does not retain its sampled launch pose while waiting`
    );
    assert(
      flight.phase === 'flight' &&
        flight.screenX > plan.start.x &&
        flight.depth > 0,
      `card ${index} does not advance through a raised flight`
    );
    assert(
      landing.phase === 'landing' && landing.depth >= 0,
      `card ${index} does not enter its bounded landing phase`
    );
    assert(
      settled.complete === true &&
        settled.phase === 'settled' &&
        settled.screenX === plan.destination.x &&
        settled.screenY === plan.destination.y &&
        settled.depth === 0 &&
        settled.z === plan.destination.z &&
        settled.rotationX === 0 &&
        settled.rotationY === 0 &&
        settled.rotationZ === 0,
      `card ${index} does not sample its exact canonical destination`
    );
  });

  assert(
    !source.includes('Math.random'),
    'arrival randomness is sampled from nondeterministic Math.random'
  );
  assert(
    (() => {
      try {
        createCardArrivalBatch(cards, {
          ...request,
          profile: 'not-a-real-profile'
        });
        return false;
      } catch (error) {
        return /Unknown card-arrival profile/.test(error.message);
      }
    })(),
    'the public planner silently accepts an unknown arrival profile'
  );
  assert(
    (() => {
      try {
        createCardArrivalBatch([
          {...cards[0], width: 0}
        ], request);
        return false;
      } catch (error) {
        return /invalid/.test(error.message);
      }
    })(),
    'the public planner does not fail fast on invalid card geometry'
  );
  assert(
    source.includes('createCardArrivalBatch') &&
      source.includes('sampleCardArrival') &&
      source.includes('destination: {'),
    'the reusable destination-driven planner/sampler contract is incomplete'
  );

  console.log(`ok - seeded card-arrival contract (${assertions} assertions)`);
} catch (error) {
  console.error(`not ok - seeded card-arrival contract: ${error.message}`);
  process.exitCode = 1;
}
