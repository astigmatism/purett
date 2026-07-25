import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  DEFAULT_LOBBY_MOTION_PLAYBOOK,
  LOBBY_MOTION_PLAYBOOK_ID,
  LOBBY_MOTION_PLAYBOOK_METADATA,
  LOBBY_MOTION_PLAYBOOK_SCHEMA_VERSION,
  LOBBY_MOTION_TARGETS,
  LOBBY_WIND_EXIT_TARGET_ID,
  LOBBY_WIND_VARIATION,
  createLobbyMotionBatch,
  getLobbyMotionTarget,
  getLobbyMotionTargetForCard,
  normalizeLobbyMotionPlaybook,
  parseLobbyMotionPlaybook,
  sampleLobbyMotionPlan,
  serializeLobbyMotionPlaybook,
  updateLobbyMotionTarget,
  updateLobbyWindSeed
} from '../../frontend/src/lobby-motion-playbook.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(
  path.resolve(directory, '../../frontend/src/lobby-motion-playbook.js'),
  'utf8'
);
const epsilon = 0.000001;
let assertions = 0;
let sampledPoses = 0;

function assert(condition, message) {
  assertions += 1;
  if (!condition) {
    throw new Error(message);
  }
}

function assertNear(actual, expected, tolerance, message) {
  assert(
    Math.abs(actual - expected) <= tolerance,
    `${message}: expected ${expected}, received ${actual}`
  );
}

function assertThrows(callback, pattern, message) {
  let thrown = null;
  try {
    callback();
  } catch (error) {
    thrown = error;
  }
  assert(Boolean(thrown), `${message}: expected an error`);
  if (pattern) {
    assert(
      pattern.test(String(thrown.message)),
      `${message}: unexpected error "${thrown.message}"`
    );
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertDeepFrozen(value, pathName) {
  assert(Object.isFrozen(value), `${pathName} is not frozen`);
  if (value && typeof value === 'object') {
    Object.keys(value).forEach((key) => {
      if (value[key] && typeof value[key] === 'object') {
        assertDeepFrozen(value[key], `${pathName}.${key}`);
      }
    });
  }
}

function fixtureCards() {
  return [72, 197, 322, 447, 572].map((x, index) => ({
    index,
    width: 117,
    height: 146,
    rotationDegrees: 0,
    destination: {
      x: x + (117 / 2),
      y: 203 + (146 / 2),
      z: -1.7
    }
  }));
}

function assertFinitePose(pose, context) {
  [
    pose.elapsedMs,
    pose.localElapsedMs,
    pose.progress,
    pose.screenX,
    pose.screenY,
    pose.height,
    pose.depth,
    pose.z,
    pose.rotationDegrees.x,
    pose.rotationDegrees.y,
    pose.rotationDegrees.z,
    pose.scale,
    pose.shadow.strength,
    pose.shadow.spread
  ].forEach((value) => {
    assert(Number.isFinite(value), `${context} contains a non-finite value`);
  });
  assert(pose.height >= -epsilon, `${context} penetrates the table`);
  assert(pose.scale > 0, `${context} has non-positive scale`);
  assert(
    pose.shadow.strength >= -epsilon &&
      pose.shadow.strength <= 1 + epsilon,
    `${context} has invalid shadow strength`
  );
  assert(pose.shadow.spread > 0, `${context} has invalid shadow spread`);
}

try {
  assert(
    LOBBY_MOTION_PLAYBOOK_SCHEMA_VERSION === 1,
    'playbook schema version is not 1'
  );
  assert(
    LOBBY_MOTION_PLAYBOOK_ID === 'lobby-card-motion',
    'playbook id is unstable'
  );
  assert(
    !/\b(?:window|document|HTMLElement|WebGLRenderer)\b/.test(source) &&
      !/from ['"]three['"]/.test(source),
    'pure playbook module depends on the DOM or Three.js'
  );
  assert(
    !source.includes('Math.random'),
    'pure playbook module uses ambient randomness'
  );
  assert(
    LOBBY_MOTION_TARGETS.length === 6 &&
      LOBBY_MOTION_TARGETS.filter((target) => target.kind === 'intro')
        .length === 5 &&
      LOBBY_MOTION_TARGETS.filter((target) => target.kind === 'exit')
        .length === 1,
    'application target registry is not five intros plus one hand exit'
  );
  assert(
    new Set(LOBBY_MOTION_TARGETS.map((target) => target.id)).size === 6,
    'application target ids are not unique'
  );
  LOBBY_MOTION_TARGETS.slice(0, 5).forEach((target, index) => {
    assert(
      target.id === `lobby-card-${index + 1}-intro` &&
        target.slotIndex === index &&
        target.lockedAnchor === 'lobby-slot-destination',
      `intro target ${index + 1} is not bound to its application slot`
    );
    assert(
      getLobbyMotionTargetForCard('intro', index) === target,
      `intro target ${index + 1} lookup loses registry identity`
    );
  });
  const windTarget = LOBBY_MOTION_TARGETS.at(-1);
  assert(
    windTarget.id === LOBBY_WIND_EXIT_TARGET_ID &&
      windTarget.sequenceLevel === true &&
      windTarget.lockedAnchor === 'lobby-slot-origin' &&
      getLobbyMotionTargetForCard('exit', 3) === windTarget,
    'Gentle Wind is not one sequence-level exit target'
  );
  assert(
    LOBBY_MOTION_PLAYBOOK_METADATA.applicationTargetCount === 6 &&
      LOBBY_MOTION_PLAYBOOK_METADATA.introTargetCount === 5 &&
      LOBBY_MOTION_PLAYBOOK_METADATA.exitTargetCount === 1 &&
      LOBBY_MOTION_PLAYBOOK_METADATA.exitInstanceCount === 5 &&
      LOBBY_MOTION_PLAYBOOK_METADATA.anchorsSerialized === false,
    'playbook metadata does not describe the application boundary'
  );
  assertDeepFrozen(LOBBY_MOTION_TARGETS, 'LOBBY_MOTION_TARGETS');
  assertDeepFrozen(LOBBY_WIND_VARIATION, 'LOBBY_WIND_VARIATION');
  assertDeepFrozen(
    DEFAULT_LOBBY_MOTION_PLAYBOOK,
    'DEFAULT_LOBBY_MOTION_PLAYBOOK'
  );

  const normalizedDefault = normalizeLobbyMotionPlaybook(
    DEFAULT_LOBBY_MOTION_PLAYBOOK
  );
  assertDeepFrozen(normalizedDefault, 'normalized default playbook');
  assert(
    normalizedDefault.kind === 'purett-lobby-motion-playbook',
    'normalized playbook omits its runtime kind'
  );
  LOBBY_MOTION_TARGETS.forEach((target) => {
    const entry = getLobbyMotionTarget(normalizedDefault, target.id);
    assert(entry.targetId === target.id, `${target.id} entry is mismatched`);
    assert(
      entry.preset.path.landingXPx === 0 &&
        entry.preset.path.landingYPx === 0 &&
        entry.preset.scale.cardScale === 1 &&
        entry.preset.scale.end === 1,
      `${target.id} can move or resize its application anchor`
    );
  });

  const serializedDefault = serializeLobbyMotionPlaybook(normalizedDefault);
  const rawDefault = JSON.parse(serializedDefault);
  assert(
    JSON.stringify(Object.keys(rawDefault)) ===
      JSON.stringify(['schemaVersion', 'id', 'label', 'targets', 'wind']),
    'serialized playbook root is not stable'
  );
  assert(
    rawDefault.kind === undefined &&
      rawDefault.anchors === undefined &&
      Object.keys(rawDefault.targets).length === 6,
    'serialized playbook leaks runtime state or omits targets'
  );
  const parsedDefault = parseLobbyMotionPlaybook(serializedDefault);
  assert(
    serializeLobbyMotionPlaybook(parsedDefault) === serializedDefault,
    'whole-playbook serialization does not round-trip stably'
  );
  assertDeepFrozen(parsedDefault, 'parsed playbook');

  const changedPreset = clone(
    normalizedDefault.targets['lobby-card-3-intro'].preset
  );
  changedPreset.path.directionDeg += 13;
  changedPreset.path.landingXPx = 275;
  changedPreset.path.landingYPx = -190;
  changedPreset.scale.cardScale = 1.7;
  changedPreset.scale.end = 1.4;
  const changedPlaybook = updateLobbyMotionTarget(
    normalizedDefault,
    'lobby-card-3-intro',
    changedPreset,
    777
  );
  assert(
    changedPlaybook !== normalizedDefault &&
      changedPlaybook.targets['lobby-card-3-intro'].delayMs === 777 &&
      changedPlaybook.targets['lobby-card-3-intro'].preset.path
        .directionDeg === changedPreset.path.directionDeg,
    'target update does not create an independent authored entry'
  );
  assert(
    changedPlaybook.targets['lobby-card-3-intro'].preset.path
      .landingXPx === 0 &&
      changedPlaybook.targets['lobby-card-3-intro'].preset.path
        .landingYPx === 0 &&
      changedPlaybook.targets['lobby-card-3-intro'].preset.scale
        .cardScale === 1 &&
      changedPlaybook.targets['lobby-card-3-intro'].preset.scale.end === 1,
    'target update can override its locked destination or application scale'
  );
  assert(
    JSON.stringify(
      changedPlaybook.targets['lobby-card-1-intro']
    ) === JSON.stringify(
      normalizedDefault.targets['lobby-card-1-intro']
    ),
    'updating card 3 aliases card 1'
  );
  const changedSerialized = serializeLobbyMotionPlaybook(changedPlaybook);
  assert(
    Object.keys(JSON.parse(changedSerialized).targets).length === 6 &&
      parseLobbyMotionPlaybook(changedSerialized)
        .targets['lobby-card-3-intro'].delayMs === 777,
    'export does not contain the complete edited playbook'
  );

  const future = clone(rawDefault);
  future.schemaVersion += 1;
  assertThrows(
    () => parseLobbyMotionPlaybook(JSON.stringify(future)),
    /Unsupported lobby motion playbook schema version/,
    'future playbook schema is accepted'
  );
  const missingTarget = clone(rawDefault);
  delete missingTarget.targets['lobby-card-5-intro'];
  assertThrows(
    () => parseLobbyMotionPlaybook(JSON.stringify(missingTarget)),
    /targets do not match the application registry/,
    'partial playbook import is accepted'
  );
  const injectedAnchor = clone(rawDefault);
  injectedAnchor.anchors = fixtureCards();
  assertThrows(
    () => parseLobbyMotionPlaybook(JSON.stringify(injectedAnchor)),
    /must contain exactly/,
    'serialized application anchors are accepted'
  );
  assertThrows(
    () => parseLobbyMotionPlaybook('{"schemaVersion":'),
    /JSON is invalid/,
    'malformed playbook JSON is accepted'
  );

  const cards = fixtureCards();
  const hostilePlaybook = updateLobbyMotionTarget(
    normalizedDefault,
    'lobby-card-3-intro',
    changedPreset,
    0
  );
  const introBatch = createLobbyMotionBatch(
    hostilePlaybook,
    'intro',
    cards,
    {id: 'locked-intro', seed: 'intro-contract'}
  );
  assertDeepFrozen(introBatch, 'intro batch');
  assert(
    introBatch.plans.length === 5 &&
      introBatch.sequence === 'intro',
    'intro batch does not contain five application cards'
  );
  introBatch.plans.forEach((plan, index) => {
    const anchor = cards[index].destination;
    assert(
      plan.cardIndex === index &&
        plan.targetId === `lobby-card-${index + 1}-intro`,
      `intro plan ${index} is mapped to the wrong application target`
    );
    assertNear(plan.anchor.x, anchor.x, epsilon, `intro ${index} anchor x`);
    assertNear(plan.anchor.y, anchor.y, epsilon, `intro ${index} anchor y`);
    assertNear(plan.endpoint.x, anchor.x, epsilon, `intro ${index} endpoint x`);
    assertNear(plan.endpoint.y, anchor.y, epsilon, `intro ${index} endpoint y`);
    assertNear(plan.endpoint.z, anchor.z, epsilon, `intro ${index} endpoint z`);
    const settled = sampleLobbyMotionPlan(plan, plan.totalMs);
    assert(
      settled.complete && settled.phase === 'settled',
      `intro ${index} does not complete as settled`
    );
    assertNear(settled.screenX, anchor.x, epsilon, `intro ${index} settled x`);
    assertNear(settled.screenY, anchor.y, epsilon, `intro ${index} settled y`);
    assertNear(settled.z, anchor.z, epsilon, `intro ${index} settled z`);
    assertNear(
      settled.normalizedRotationDegrees.x,
      0,
      epsilon,
      `intro ${index} settled pitch`
    );
    assertNear(
      settled.normalizedRotationDegrees.y,
      0,
      epsilon,
      `intro ${index} settled yaw`
    );
  });

  const explicitSeed = 'gentle-wind-contract-seed';
  const firstExit = createLobbyMotionBatch(
    normalizedDefault,
    'exit',
    cards,
    {id: 'exit-a', seed: explicitSeed}
  );
  const repeatedExit = createLobbyMotionBatch(
    normalizedDefault,
    'exit',
    cards,
    {id: 'exit-a', seed: explicitSeed}
  );
  assert(
    JSON.stringify(firstExit) === JSON.stringify(repeatedExit),
    'same explicit wind seed does not reproduce the same batch'
  );
  const reorderedExit = createLobbyMotionBatch(
    normalizedDefault,
    'exit',
    cards.slice().reverse(),
    {id: 'exit-a', seed: explicitSeed}
  );
  const plansBySlot = batch => batch.plans.slice().sort(
    (left, right) => left.cardIndex - right.cardIndex
  );
  assert(
    JSON.stringify(plansBySlot(firstExit)) ===
      JSON.stringify(plansBySlot(reorderedExit)) &&
      JSON.stringify(firstExit.shared) ===
        JSON.stringify(reorderedExit.shared),
    'wind derivation changes when the same slots are traversed in another order'
  );
  const duplicateCards = fixtureCards();
  duplicateCards[4].index = 3;
  assertThrows(
    () => createLobbyMotionBatch(
      normalizedDefault,
      'exit',
      duplicateCards,
      {id: 'duplicate-slots', seed: explicitSeed}
    ),
    /distinct application slot indices/,
    'duplicate application slot indices are accepted'
  );
  const invalidCards = fixtureCards();
  invalidCards[0].index = 5;
  assertThrows(
    () => createLobbyMotionBatch(
      normalizedDefault,
      'intro',
      invalidCards,
      {id: 'invalid-slot', seed: explicitSeed}
    ),
    /slot index from 0 through 4/,
    'out-of-range application slot indices are accepted'
  );
  const nextExit = createLobbyMotionBatch(
    normalizedDefault,
    'exit',
    cards,
    {id: 'exit-b', seed: 'gentle-wind-contract-seed-2'}
  );
  assert(
    JSON.stringify(firstExit.plans) !== JSON.stringify(nextExit.plans),
    'new wind seed does not produce a new variation'
  );
  const storedWindA = updateLobbyWindSeed(
    normalizedDefault,
    'stored-wind-a',
    true
  );
  const storedWindB = updateLobbyWindSeed(
    normalizedDefault,
    'stored-wind-b',
    false
  );
  assert(
    storedWindA.wind.locked === true &&
      storedWindB.wind.locked === false &&
      createLobbyMotionBatch(storedWindA, 'exit', cards).seed ===
        'stored-wind-a' &&
      createLobbyMotionBatch(storedWindB, 'exit', cards).seed ===
        'stored-wind-b',
    'stored wind lock/seed state is not preserved by the pure API'
  );

  [firstExit, nextExit].forEach((batch, batchIndex) => {
    assertDeepFrozen(batch, `exit batch ${batchIndex}`);
    assert(
      batch.sequence === 'exit' &&
        batch.plans.length === 5 &&
        batch.deadlineMs === batch.totalDurationMs + 500,
      `exit batch ${batchIndex} has an invalid lifecycle bound`
    );
    const endpointKeys = new Set();
    const headings = new Set();
    batch.plans.forEach((plan, index) => {
      const anchor = cards[index].destination;
      const heading = plan.effectivePreset.path.directionDeg;
      headings.add(heading.toFixed(6));
      endpointKeys.add(
        `${plan.endpoint.x.toFixed(6)}:${plan.endpoint.y.toFixed(6)}`
      );
      assertNear(plan.anchor.x, anchor.x, epsilon, `exit ${index} anchor x`);
      assertNear(plan.anchor.y, anchor.y, epsilon, `exit ${index} anchor y`);
      assert(
        plan.endpoint.x + (cards[index].width / 2) <= -36 + epsilon,
        `exit ${index} endpoint is not fully offscreen left`
      );
      assert(
        plan.endpoint.y > anchor.y,
        `exit ${index} does not travel toward the lower-left region`
      );
      assert(
        heading >= LOBBY_WIND_VARIATION.headingDegrees.minimum - epsilon &&
          heading <=
            LOBBY_WIND_VARIATION.headingDegrees.maximum + epsilon,
        `exit ${index} leaves the shared wind heading envelope`
      );
      const waiting = sampleLobbyMotionPlan(plan, 0);
      assert(
        waiting.phase === 'exit-waiting' && !waiting.complete,
        `exit ${index} does not wait at its locked origin`
      );
      assertNear(waiting.screenX, anchor.x, epsilon, `exit ${index} origin x`);
      assertNear(waiting.screenY, anchor.y, epsilon, `exit ${index} origin y`);
      const exited = sampleLobbyMotionPlan(plan, plan.totalMs);
      assert(
        exited.complete && exited.phase === 'exited',
        `exit ${index} does not reach its terminal state`
      );
      assertNear(
        exited.screenX,
        plan.endpoint.x,
        epsilon,
        `exit ${index} terminal x`
      );
      assertNear(
        exited.screenY,
        plan.endpoint.y,
        epsilon,
        `exit ${index} terminal y`
      );
    });
    assert(
      endpointKeys.size === 5,
      `exit batch ${batchIndex} reuses one endpoint for multiple cards`
    );
    assert(
      headings.size > 1,
      `exit batch ${batchIndex} gives every card the same path heading`
    );
  });

  for (let seedIndex = 0; seedIndex < 40; seedIndex += 1) {
    const batch = createLobbyMotionBatch(
      normalizedDefault,
      'exit',
      cards,
      {
        id: `dense-${seedIndex}`,
        seed: `dense-gentle-wind-${seedIndex}`
      }
    );
    assert(
      Number.isFinite(batch.totalDurationMs) &&
        batch.totalDurationMs > 0 &&
        batch.deadlineMs <= 7000,
      `dense seed ${seedIndex} has an unbounded batch duration`
    );
    batch.plans.forEach((plan, cardIndex) => {
      for (let step = 0; step <= 80; step += 1) {
        const elapsed = plan.totalMs * step / 80;
        const pose = sampleLobbyMotionPlan(plan, elapsed);
        sampledPoses += 1;
        assertFinitePose(
          pose,
          `dense seed ${seedIndex} card ${cardIndex} step ${step}`
        );
      }
    });
  }

  console.log(
    `ok - lobby motion playbook contract ` +
    `(${assertions} assertions, ${sampledPoses} sampled poses)`
  );
} catch (error) {
  console.error(`not ok - lobby motion playbook contract: ${error.message}`);
  process.exitCode = 1;
}
