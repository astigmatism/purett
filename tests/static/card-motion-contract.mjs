import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  CARD_MOTION_AUTHORING_LIMITS,
  CARD_MOTION_CONTROLS,
  CARD_MOTION_LIMITS,
  CARD_MOTION_PRESETS,
  CARD_MOTION_SCHEMA_VERSION,
  CASUAL_TOSS_PRESET,
  ENERGETIC_SCATTER_PRESET,
  GENTLE_DROP_PRESET,
  createCardMotionPlan,
  normalizeCardMotionAuthoringPreset,
  normalizeCardMotionPreset,
  parseCardMotionPreset,
  sampleCardMotion,
  serializeCardMotionPreset
} from '../../frontend/src/card-motion.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(
  path.resolve(directory, '../../frontend/src/card-motion.js'),
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

function wrappedDegrees(value) {
  const wrapped = ((value + 180) % 360 + 360) % 360 - 180;
  return Object.is(wrapped, -0) ? 0 : wrapped;
}

function poseAtFlightProgress(plan, progress) {
  return sampleCardMotion(
    plan,
    plan.timing.delayMs + (plan.timing.flightMs * progress)
  );
}

function assertFinitePose(pose, context) {
  [
    pose.elapsedMs,
    pose.localElapsedMs,
    pose.progress,
    pose.flightProgress,
    pose.landingProgress,
    pose.screenX,
    pose.screenY,
    pose.height,
    pose.depth,
    pose.z,
    pose.rotationDegrees.x,
    pose.rotationDegrees.y,
    pose.rotationDegrees.z,
    pose.rotationRadians.x,
    pose.rotationRadians.y,
    pose.rotationRadians.z,
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
    CARD_MOTION_SCHEMA_VERSION === 1,
    'card-motion schema version is not 1'
  );
  assert(
    !/\b(?:window|document|HTMLElement|WebGLRenderer|from ['"]three['"])\b/.test(
      source
    ),
    'pure card-motion module depends on DOM or Three.js'
  );
  assert(
    !source.includes('Math.random'),
    'pure card-motion module uses per-frame randomness'
  );
  assert(
    CARD_MOTION_CONTROLS.scaleModes.join(',') ===
      'perspective,keyframed',
    'scale modes are not explicit'
  );
  assert(
    CARD_MOTION_LIMITS.path.apexHeight.maximum >=
      CARD_MOTION_LIMITS.path.releaseHeight.maximum,
    'height limits cannot represent a valid apex'
  );

  const expectedPresets = [
    ['gentleDrop', GENTLE_DROP_PRESET, 'gentle-drop'],
    ['casualToss', CASUAL_TOSS_PRESET, 'casual-toss'],
    ['energeticScatter', ENERGETIC_SCATTER_PRESET, 'energetic-scatter']
  ];
  expectedPresets.forEach(([key, preset, id]) => {
    assert(CARD_MOTION_PRESETS[key] === preset, `${id} registry entry differs`);
    assert(preset.id === id, `${id} has the wrong id`);
    assert(
      preset.schemaVersion === CARD_MOTION_SCHEMA_VERSION,
      `${id} has the wrong schema version`
    );
    assert(
      preset.path.apexHeight >= preset.path.releaseHeight,
      `${id} has an impossible apex`
    );
    assertDeepFrozen(preset, id);
  });
  assertDeepFrozen(CARD_MOTION_PRESETS, 'CARD_MOTION_PRESETS');
  assertDeepFrozen(CARD_MOTION_LIMITS, 'CARD_MOTION_LIMITS');
  assertDeepFrozen(CARD_MOTION_CONTROLS, 'CARD_MOTION_CONTROLS');

  const partial = {
    id: '  My Experimental Recipe! ',
    label: '  Experimental Drop  ',
    path: {
      directionDeg: '540',
      distancePx: -50,
      releaseHeight: 900,
      apexHeight: 20,
      flightMs: '450'
    },
    rotation: {
      xTurns: 99
    },
    scale: {
      mode: 'keyframed',
      start: 0
    },
    shadow: {
      strength: 8
    }
  };
  const partialBefore = clone(partial);
  const normalized = normalizeCardMotionPreset(partial);
  assert(
    JSON.stringify(partial) === JSON.stringify(partialBefore),
    'normalization mutates its source'
  );
  assert(normalized.id === 'my-experimental-recipe', 'id was not normalized');
  assert(normalized.label === 'Experimental Drop', 'label was not normalized');
  assert(normalized.path.directionDeg === -180, 'direction was not wrapped');
  assert(normalized.path.distancePx === 0, 'distance was not clamped');
  assert(
    normalized.path.releaseHeight === 800 &&
      normalized.path.apexHeight === 800,
    'height and apex were not made physically valid'
  );
  assert(normalized.path.flightMs === 450, 'numeric UI value was not accepted');
  assert(normalized.rotation.xTurns === 5, 'turn count was not clamped');
  assert(normalized.scale.start === 0.1, 'scale was not clamped');
  assert(normalized.shadow.strength === 1, 'shadow was not clamped');
  assertDeepFrozen(normalized, 'normalized preset');
  assertThrows(
    () => normalizeCardMotionPreset({schemaVersion: 2}),
    /Unsupported card-motion schema version/,
    'normalization accepts a future schema'
  );

  expectedPresets.forEach(([, preset, id]) => {
    const serialized = serializeCardMotionPreset(preset);
    const parsed = parseCardMotionPreset(serialized);
    assert(
      serializeCardMotionPreset(parsed) === serialized,
      `${id} serialization is not stable`
    );
    assert(
      JSON.stringify(parsed) === JSON.stringify(preset),
      `${id} import/export changes values`
    );
    assertDeepFrozen(parsed, `${id} parsed preset`);
  });

  const baseInstance = {
    destination: {x: 430, y: 285, z: -1.7},
    delayMs: 125,
    speed: 1,
    startOffset: {x: 12, y: -9, z: 18},
    rotationOffset: {x: 3, y: -2, z: 4}
  };
  const instanceBefore = clone(baseInstance);
  const presetBefore = clone(CASUAL_TOSS_PRESET);
  const basePlan = createCardMotionPlan(
    CASUAL_TOSS_PRESET,
    baseInstance
  );
  assert(
    JSON.stringify(baseInstance) === JSON.stringify(instanceBefore),
    'plan creation mutates instance data'
  );
  assert(
    JSON.stringify(CASUAL_TOSS_PRESET) === JSON.stringify(presetBefore),
    'plan creation mutates preset data'
  );
  assertDeepFrozen(basePlan, 'card-motion plan');
  assert(basePlan.instance.speed === 1, 'plan loses instance speed');
  assert(basePlan.timing.delayMs === 125, 'plan loses instance delay');
  assert(
    basePlan.path.destination.x === 430 &&
      basePlan.path.destination.y === 285 &&
      basePlan.path.destination.z === -1.7,
    'zero landing offset does not preserve destination'
  );
  assertNear(
    Math.hypot(
      basePlan.path.contact.x - basePlan.path.destination.x,
      basePlan.path.contact.y - basePlan.path.destination.y
    ),
    CASUAL_TOSS_PRESET.landing.skidDistancePx,
    epsilon,
    'contact-to-settlement distance differs from the skid recipe'
  );

  const waiting = sampleCardMotion(basePlan, 0);
  const release = sampleCardMotion(basePlan, basePlan.timing.delayMs);
  assert(waiting.phase === 'waiting', 'pre-delay pose is not waiting');
  assert(release.phase === 'waiting', 'release boundary is not stable');
  assertNear(waiting.screenX, basePlan.path.start.x, epsilon, 'waiting x');
  assertNear(waiting.screenY, basePlan.path.start.y, epsilon, 'waiting y');
  assertNear(
    waiting.height,
    basePlan.path.releaseHeight,
    epsilon,
    'waiting release height'
  );
  assertNear(
    release.rotationDegrees.x,
    basePlan.rotation.releaseDegrees.x,
    epsilon,
    'release pitch'
  );

  const apex = poseAtFlightProgress(
    basePlan,
    basePlan.path.apexProgress
  );
  assert(apex.phase === 'flight', 'apex is not in flight');
  assertNear(
    apex.height,
    basePlan.path.apexHeight,
    0.00001,
    'ballistic path misses its authored apex'
  );

  const beforeContact = sampleCardMotion(
    basePlan,
    basePlan.timing.delayMs + basePlan.timing.flightMs - 0.0001
  );
  const contact = sampleCardMotion(
    basePlan,
    basePlan.timing.delayMs + basePlan.timing.flightMs
  );
  assert(
    contact.phase === 'slap' || contact.phase === 'skid',
    'flight does not enter one landing translation'
  );
  assertNear(contact.height, 0, epsilon, 'contact is above the table');
  assertNear(contact.screenX, basePlan.path.contact.x, epsilon, 'contact x');
  assertNear(contact.screenY, basePlan.path.contact.y, epsilon, 'contact y');
  assertNear(
    beforeContact.screenX,
    contact.screenX,
    0.001,
    'x path is discontinuous at contact'
  );
  assertNear(
    beforeContact.screenY,
    contact.screenY,
    0.001,
    'y path is discontinuous at contact'
  );
  assertNear(
    beforeContact.height,
    contact.height,
    0.001,
    'height is discontinuous at contact'
  );
  assertNear(
    beforeContact.rotationDegrees.x,
    contact.rotationDegrees.x,
    0.001,
    'pitch is discontinuous at contact'
  );
  assertNear(
    beforeContact.rotationDegrees.y,
    contact.rotationDegrees.y,
    0.001,
    'yaw is discontinuous at contact'
  );
  assertNear(
    beforeContact.rotationDegrees.z,
    contact.rotationDegrees.z,
    0.001,
    'roll is discontinuous at contact'
  );
  assertNear(
    contact.rotationDegrees.x,
    basePlan.rotation.contactDegrees.x,
    epsilon,
    'x turns do not reach their contact winding'
  );
  assertNear(
    contact.rotationDegrees.y,
    basePlan.rotation.contactDegrees.y,
    epsilon,
    'y turns do not reach their contact winding'
  );
  assertNear(
    contact.rotationDegrees.z,
    basePlan.rotation.contactDegrees.z,
    epsilon,
    'z turns do not reach their contact winding'
  );

  const slapBoundaryTime =
    basePlan.timing.delayMs +
    basePlan.timing.flightMs +
    basePlan.timing.slapMs;
  const beforeSlapBoundary = sampleCardMotion(
    basePlan,
    slapBoundaryTime - 0.0001
  );
  const atSlapBoundary = sampleCardMotion(basePlan, slapBoundaryTime);
  assert(
    beforeSlapBoundary.phase === 'slap',
    'pre-boundary landing is not slap'
  );
  assert(
    atSlapBoundary.phase === 'skid',
    'post-boundary landing is not skid'
  );
  assertNear(
    beforeSlapBoundary.screenX,
    atSlapBoundary.screenX,
    0.001,
    'translation changes curve at slap/skid label boundary'
  );
  assertNear(
    beforeSlapBoundary.screenY,
    atSlapBoundary.screenY,
    0.001,
    'translation changes y curve at slap/skid label boundary'
  );
  assertNear(
    atSlapBoundary.normalizedRotationDegrees.x,
    0,
    epsilon,
    'card is not flat on x at the slap/skid boundary'
  );
  assertNear(
    atSlapBoundary.normalizedRotationDegrees.y,
    0,
    epsilon,
    'card is not flat on y at the slap/skid boundary'
  );

  const slapMidpoint = sampleCardMotion(
    basePlan,
    basePlan.timing.delayMs +
      basePlan.timing.flightMs +
      (basePlan.timing.slapMs / 2)
  );
  assert(
    Math.hypot(
      slapMidpoint.screenX - basePlan.path.destination.x,
      slapMidpoint.screenY - basePlan.path.destination.y
    ) <
      Math.hypot(
        basePlan.path.contact.x - basePlan.path.destination.x,
        basePlan.path.contact.y - basePlan.path.destination.y
      ),
    'post-contact translation stops during slap'
  );

  const landingDistances = [];
  for (let step = 0; step <= 120; step += 1) {
    const pose = sampleCardMotion(
      basePlan,
      basePlan.timing.delayMs +
        basePlan.timing.flightMs +
        (basePlan.timing.landingMs * step / 120)
    );
    landingDistances.push(
      Math.hypot(
        pose.screenX - basePlan.path.destination.x,
        pose.screenY - basePlan.path.destination.y
      )
    );
  }
  for (let index = 1; index < landingDistances.length; index += 1) {
    assert(
      landingDistances[index] <= landingDistances[index - 1] + epsilon,
      'post-contact translation moves away from settlement'
    );
  }
  const landingSteps = landingDistances
    .slice(0, -1)
    .map((distance, index) => distance - landingDistances[index + 1]);
  for (let index = 1; index < landingSteps.length; index += 1) {
    assert(
      landingSteps[index] <= landingSteps[index - 1] + epsilon,
      'post-contact translation stops, relaunches, or accelerates'
    );
  }

  const settled = sampleCardMotion(
    basePlan,
    basePlan.timing.totalMs
  );
  const overdue = sampleCardMotion(
    basePlan,
    basePlan.timing.totalMs + 10000
  );
  [settled, overdue].forEach((pose, index) => {
    assert(pose.complete, `settled pose ${index} is not complete`);
    assert(pose.phase === 'settled', `settled pose ${index} has wrong phase`);
    assertNear(
      pose.screenX,
      basePlan.path.destination.x,
      epsilon,
      `settled pose ${index} x`
    );
    assertNear(
      pose.screenY,
      basePlan.path.destination.y,
      epsilon,
      `settled pose ${index} y`
    );
    assertNear(pose.height, 0, epsilon, `settled pose ${index} height`);
    assertNear(
      pose.normalizedRotationDegrees.x,
      0,
      epsilon,
      `settled pose ${index} pitch`
    );
    assertNear(
      pose.normalizedRotationDegrees.y,
      0,
      epsilon,
      `settled pose ${index} yaw`
    );
    assertNear(
      pose.normalizedRotationDegrees.z,
      wrappedDegrees(
        CASUAL_TOSS_PRESET.rotation.finalRollDeg +
          baseInstance.rotationOffset.z
      ),
      epsilon,
      `settled pose ${index} roll`
    );
  });

  const translatedInstance = clone(baseInstance);
  translatedInstance.destination.x += 173;
  translatedInstance.destination.y -= 91;
  translatedInstance.destination.z += 7;
  const translatedPlan = createCardMotionPlan(
    CASUAL_TOSS_PRESET,
    translatedInstance
  );
  ['start', 'contact', 'destination'].forEach((key) => {
    assertNear(
      translatedPlan.path[key].x - basePlan.path[key].x,
      173,
      epsilon,
      `${key} does not translate with destination x`
    );
    assertNear(
      translatedPlan.path[key].y - basePlan.path[key].y,
      -91,
      epsilon,
      `${key} does not translate with destination y`
    );
  });
  for (let step = 0; step <= 100; step += 1) {
    const elapsed = basePlan.timing.totalMs * step / 100;
    const left = sampleCardMotion(basePlan, elapsed);
    const right = sampleCardMotion(translatedPlan, elapsed);
    assertNear(
      right.screenX - left.screenX,
      173,
      epsilon,
      `sample ${step} does not translate in x`
    );
    assertNear(
      right.screenY - left.screenY,
      -91,
      epsilon,
      `sample ${step} does not translate in y`
    );
    assertNear(
      right.z - left.z,
      7,
      epsilon,
      `sample ${step} does not translate in z`
    );
    assertNear(
      right.rotationDegrees.x,
      left.rotationDegrees.x,
      epsilon,
      `sample ${step} translation changes pitch`
    );
    assertNear(
      right.scale,
      left.scale,
      epsilon,
      `sample ${step} translation changes scale`
    );
  }

  const fastPlan = createCardMotionPlan(
    CASUAL_TOSS_PRESET,
    {...baseInstance, speed: 2}
  );
  assertNear(
    fastPlan.timing.flightMs,
    basePlan.timing.flightMs / 2,
    epsilon,
    'speed does not scale flight time'
  );
  assertNear(
    fastPlan.timing.landingMs,
    basePlan.timing.landingMs / 2,
    epsilon,
    'speed does not scale landing time'
  );
  for (let step = 0; step <= 20; step += 1) {
    const progress = step / 20;
    const normalPose = poseAtFlightProgress(basePlan, progress);
    const fastPose = poseAtFlightProgress(fastPlan, progress);
    assertNear(
      fastPose.screenX,
      normalPose.screenX,
      epsilon,
      `speed changes normalized x at ${progress}`
    );
    assertNear(
      fastPose.screenY,
      normalPose.screenY,
      epsilon,
      `speed changes normalized y at ${progress}`
    );
    assertNear(
      fastPose.height,
      normalPose.height,
      epsilon,
      `speed changes normalized height at ${progress}`
    );
  }

  const noOffsetPlan = createCardMotionPlan(
    CASUAL_TOSS_PRESET,
    {
      destination: baseInstance.destination,
      startOffset: {x: 0, y: 0, z: 0}
    }
  );
  const offsetPlan = createCardMotionPlan(
    CASUAL_TOSS_PRESET,
    {
      destination: baseInstance.destination,
      startOffset: {x: 60, y: -45, z: 25}
    }
  );
  assertNear(
    offsetPlan.path.start.x - noOffsetPlan.path.start.x,
    60,
    epsilon,
    'start offset x is not instance-local'
  );
  assertNear(
    offsetPlan.path.start.y - noOffsetPlan.path.start.y,
    -45,
    epsilon,
    'start offset y is not instance-local'
  );
  assertNear(
    offsetPlan.path.destination.x,
    noOffsetPlan.path.destination.x,
    epsilon,
    'start offset changes destination x'
  );
  assertNear(
    offsetPlan.path.destination.y,
    noOffsetPlan.path.destination.y,
    epsilon,
    'start offset changes destination y'
  );
  assertNear(
    offsetPlan.path.releaseHeight - noOffsetPlan.path.releaseHeight,
    25,
    epsilon,
    'start offset z does not change release height'
  );

  const rotationTestPreset = normalizeCardMotionPreset({
    id: 'turn-contract',
    label: 'Turn Contract',
    rotation: {
      releasePitchDeg: 11,
      releaseYawDeg: -7,
      releaseRollDeg: 5,
      contactPitchDeg: 3,
      contactYawDeg: 4,
      contactRollDeg: -6,
      xTurns: 2,
      yTurns: -1.5,
      zTurns: 0.75,
      finalRollDeg: 9
    }
  });
  const rotationPlan = createCardMotionPlan(rotationTestPreset);
  const rotationContact = sampleCardMotion(
    rotationPlan,
    rotationPlan.timing.flightMs
  );
  assertNear(
    rotationContact.rotationDegrees.x,
    3 + (2 * 360),
    epsilon,
    'x turn count is not preserved'
  );
  assertNear(
    rotationContact.rotationDegrees.y,
    4 + (-1.5 * 360),
    epsilon,
    'y turn count is not preserved'
  );
  assertNear(
    rotationContact.rotationDegrees.z,
    -6 + (0.75 * 360),
    epsilon,
    'z turn count is not preserved'
  );
  const rotationSettled = sampleCardMotion(
    rotationPlan,
    rotationPlan.timing.totalMs
  );
  assertNear(
    rotationSettled.normalizedRotationDegrees.x,
    0,
    epsilon,
    'x turn does not settle flat'
  );
  assertNear(
    rotationSettled.normalizedRotationDegrees.y,
    0,
    epsilon,
    'y turn does not settle flat'
  );
  assertNear(
    rotationSettled.normalizedRotationDegrees.z,
    9,
    epsilon,
    'z turn does not settle to final roll'
  );

  const keyframedPlan = createCardMotionPlan(
    ENERGETIC_SCATTER_PRESET
  );
  const scaleStart = sampleCardMotion(keyframedPlan, 0);
  const scaleApex = poseAtFlightProgress(
    keyframedPlan,
    keyframedPlan.path.apexProgress
  );
  const scaleContact = sampleCardMotion(
    keyframedPlan,
    keyframedPlan.timing.flightMs
  );
  const scaleEnd = sampleCardMotion(
    keyframedPlan,
    keyframedPlan.timing.totalMs
  );
  assertNear(
    scaleStart.scale,
    keyframedPlan.scale.cardScale * keyframedPlan.scale.start,
    epsilon,
    'keyframed start scale'
  );
  assertNear(
    scaleApex.scale,
    keyframedPlan.scale.cardScale * keyframedPlan.scale.apex,
    epsilon,
    'keyframed apex scale'
  );
  assertNear(
    scaleContact.scale,
    keyframedPlan.scale.cardScale * keyframedPlan.scale.contact,
    epsilon,
    'keyframed contact scale'
  );
  assertNear(
    scaleEnd.scale,
    keyframedPlan.scale.cardScale * keyframedPlan.scale.end,
    epsilon,
    'keyframed end scale'
  );

  const perspectivePlan = createCardMotionPlan(GENTLE_DROP_PRESET);
  for (let step = 0; step <= 100; step += 1) {
    const pose = sampleCardMotion(
      perspectivePlan,
      perspectivePlan.timing.totalMs * step / 100
    );
    assertNear(
      pose.scale,
      perspectivePlan.scale.cardScale,
      epsilon,
      'perspective mode introduces an authored scale tween'
    );
  }

  const denseInstances = [
    {
      destination: {x: 0, y: 0, z: 0},
      delayMs: 0,
      speed: 0.35,
      startOffset: {x: -80, y: 55, z: -30},
      rotationOffset: {x: -12, y: 8, z: -5}
    },
    {
      destination: {x: 377.5, y: 281, z: -1.7},
      delayMs: 233,
      speed: 1,
      startOffset: {x: 0, y: 0, z: 0},
      rotationOffset: {x: 0, y: 0, z: 0}
    },
    {
      destination: {x: 1200, y: -600, z: 18},
      delayMs: 900,
      speed: 3.7,
      startOffset: {x: 145, y: -110, z: 90},
      rotationOffset: {x: 90, y: -75, z: 180}
    }
  ];
  expectedPresets.forEach(([, preset, id]) => {
    denseInstances.forEach((instance, instanceIndex) => {
      const plan = createCardMotionPlan(preset, instance);
      for (let step = 0; step <= 1200; step += 1) {
        const elapsed = plan.timing.totalMs * step / 1200;
        const pose = sampleCardMotion(plan, elapsed);
        const repeated = sampleCardMotion(plan, elapsed);
        sampledPoses += 1;
        assertFinitePose(pose, `${id} instance ${instanceIndex} step ${step}`);
        assert(
          JSON.stringify(repeated) === JSON.stringify(pose),
          `${id} instance ${instanceIndex} step ${step} is nondeterministic`
        );
        if (elapsed >= plan.timing.delayMs &&
            elapsed <=
              plan.timing.delayMs + plan.timing.flightMs) {
          assert(
            pose.height <= plan.path.apexHeight + 0.00001,
            `${id} exceeds its authored apex`
          );
        }
      }
    });
  });

  const strictFixture = JSON.parse(
    serializeCardMotionPreset(CASUAL_TOSS_PRESET)
  );
  assertThrows(
    () => parseCardMotionPreset(null),
    /must be a string/,
    'parser accepts a non-string'
  );
  assertThrows(
    () => parseCardMotionPreset('{'),
    /JSON is invalid/,
    'parser accepts malformed JSON'
  );
  assertThrows(
    () => parseCardMotionPreset('[]'),
    /must be an object/,
    'parser accepts an array'
  );
  const withoutVersion = clone(strictFixture);
  delete withoutVersion.schemaVersion;
  assertThrows(
    () => parseCardMotionPreset(JSON.stringify(withoutVersion)),
    /must contain exactly/,
    'parser accepts a missing schema version'
  );
  const futureVersion = clone(strictFixture);
  futureVersion.schemaVersion = 2;
  assertThrows(
    () => parseCardMotionPreset(JSON.stringify(futureVersion)),
    /Unsupported card-motion schema version/,
    'parser accepts a future schema'
  );
  const unknownRoot = clone(strictFixture);
  unknownRoot.extra = true;
  assertThrows(
    () => parseCardMotionPreset(JSON.stringify(unknownRoot)),
    /must contain exactly/,
    'parser accepts an unknown root field'
  );
  const missingGroup = clone(strictFixture);
  delete missingGroup.shadow;
  assertThrows(
    () => parseCardMotionPreset(JSON.stringify(missingGroup)),
    /must contain exactly/,
    'parser accepts a missing group'
  );
  const unknownNested = clone(strictFixture);
  unknownNested.path.mystery = 4;
  assertThrows(
    () => parseCardMotionPreset(JSON.stringify(unknownNested)),
    /must contain exactly/,
    'parser accepts an unknown nested field'
  );
  const numericString = clone(strictFixture);
  numericString.path.flightMs = '820';
  assertThrows(
    () => parseCardMotionPreset(JSON.stringify(numericString)),
    /finite number/,
    'parser accepts a numeric string'
  );
  const badMode = clone(strictFixture);
  badMode.scale.mode = 'css';
  assertThrows(
    () => parseCardMotionPreset(JSON.stringify(badMode)),
    /perspective or keyframed/,
    'parser accepts an unknown scale mode'
  );
  const outOfRange = clone(strictFixture);
  outOfRange.rotation.xTurns = 999;
  assertThrows(
    () => parseCardMotionPreset(JSON.stringify(outOfRange)),
    /must be between/,
    'parser accepts an out-of-range value'
  );
  const outsideStudioEnvelope = clone(strictFixture);
  outsideStudioEnvelope.path.distancePx =
    CARD_MOTION_AUTHORING_LIMITS.path.distancePx.maximum + 1;
  const reusableOutsideStudioEnvelope = parseCardMotionPreset(
    JSON.stringify(outsideStudioEnvelope)
  );
  assertThrows(
    () => normalizeCardMotionAuthoringPreset(reusableOutsideStudioEnvelope),
    /Motion Studio path\.distancePx must be between 0 and 1000/,
    'Studio validator accepts a recipe outside its UI envelope'
  );
  const impossibleApex = clone(strictFixture);
  impossibleApex.path.apexHeight =
    impossibleApex.path.releaseHeight - 1;
  assertThrows(
    () => parseCardMotionPreset(JSON.stringify(impossibleApex)),
    /cannot be below releaseHeight/,
    'parser accepts an impossible apex'
  );
  const badId = clone(strictFixture);
  badId.id = 'Not Canonical';
  assertThrows(
    () => parseCardMotionPreset(JSON.stringify(badId)),
    /kebab-case/,
    'parser accepts a noncanonical id'
  );
  assertThrows(
    () => sampleCardMotion({}, 0),
    /requires a current card-motion plan/,
    'sampler accepts an arbitrary object'
  );
  assertThrows(
    () => sampleCardMotion(basePlan, Number.NaN),
    /elapsed time must be finite/,
    'sampler accepts NaN elapsed time'
  );
  assertThrows(
    () => sampleCardMotion(basePlan, Number.POSITIVE_INFINITY),
    /elapsed time must be finite/,
    'sampler accepts infinite elapsed time'
  );

  console.log(
    `ok - card motion recipe contract (${assertions} assertions, ${sampledPoses} dense deterministic poses)`
  );
} catch (error) {
  console.error(`not ok - card motion recipe contract: ${error.message}`);
  process.exitCode = 1;
}
