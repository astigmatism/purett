import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  DEFAULT_TURN_MARKER_MOTION_PROFILE,
  TURN_MARKER_MATCH_CENTERS,
  TURN_MARKER_MOTION_LIMITS,
  TURN_MARKER_MOTION_SCHEMA_VERSION,
  createTurnMarkerMotionPlan,
  normalizeTurnMarkerMotionProfile,
  parseTurnMarkerMotionProfile,
  sampleTurnMarkerMotion,
  serializeTurnMarkerMotionProfile
} from '../../frontend/src/turn-marker-motion.js';

const directory = path.dirname(
  fileURLToPath(import.meta.url)
);
const source = fs.readFileSync(
  path.resolve(
    directory,
    '../../frontend/src/turn-marker-motion.js'
  ),
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

function assertNear(
  actual,
  expected,
  tolerance,
  message
) {
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
  assert(
    Object.isFrozen(value),
    `${pathName} is not frozen`
  );
  if (value && typeof value === 'object') {
    Object.keys(value).forEach((key) => {
      if (
        value[key] &&
        typeof value[key] === 'object'
      ) {
        assertDeepFrozen(
          value[key],
          `${pathName}.${key}`
        );
      }
    });
  }
}

function assertFinitePose(pose, context) {
  [
    pose.elapsedMs,
    pose.localElapsedMs,
    pose.progress,
    pose.flightProgress,
    pose.settleProgress,
    pose.screenX,
    pose.screenY,
    pose.height,
    pose.depth,
    pose.rotationX,
    pose.rotationY,
    pose.rotationZ,
    pose.shadowOpacity,
    pose.shadowScale
  ].forEach((value) => {
    assert(
      Number.isFinite(value),
      `${context} contains a non-finite value`
    );
  });
  assert(
    pose.height >= -epsilon,
    `${context} penetrates the table`
  );
  assert(
    pose.shadowOpacity >= -epsilon &&
      pose.shadowOpacity <= 1 + epsilon,
    `${context} has invalid shadow opacity`
  );
  assert(
    pose.shadowScale > 0,
    `${context} has invalid shadow scale`
  );
  assertDeepFrozen(pose, context);
}

try {
  assert(
    TURN_MARKER_MOTION_SCHEMA_VERSION === 1,
    'turn-marker schema version is not 1'
  );
  assert(
    !/\b(?:window|document|HTMLElement|WebGLRenderer|from ['"]three['"])\b/.test(
      source
    ),
    'turn-marker motion depends on DOM or Three.js'
  );
  assert(
    !source.includes('Math.random'),
    'turn-marker motion uses randomness'
  );
  assertDeepFrozen(
    TURN_MARKER_MATCH_CENTERS,
    'TURN_MARKER_MATCH_CENTERS'
  );
  assertDeepFrozen(
    TURN_MARKER_MOTION_LIMITS,
    'TURN_MARKER_MOTION_LIMITS'
  );
  assertDeepFrozen(
    DEFAULT_TURN_MARKER_MOTION_PROFILE,
    'DEFAULT_TURN_MARKER_MOTION_PROFILE'
  );

  assert(
    JSON.stringify(TURN_MARKER_MATCH_CENTERS) ===
      JSON.stringify({
        initial: {x: 347.5, y: 440.5},
        player: {x: 53.5, y: 440.5},
        opponent: {x: 641.5, y: 440.5}
      }),
    'match centers do not match Legacy'
  );
  assert(
    DEFAULT_TURN_MARKER_MOTION_PROFILE.path
      .flightMs +
      DEFAULT_TURN_MARKER_MOTION_PROFILE.landing
        .settleMs >= 600 &&
      DEFAULT_TURN_MARKER_MOTION_PROFILE.path
        .flightMs +
        DEFAULT_TURN_MARKER_MOTION_PROFILE.landing
          .settleMs <= 800,
    'default motion is not in the requested duration band'
  );
  assert(
    Math.abs(
      DEFAULT_TURN_MARKER_MOTION_PROFILE.rotation
        .flipTurns
    ) >= 1,
    'default motion does not visibly flip'
  );

  const partial = {
    id: '  Coin Physics! ',
    label: '  Coin Physics Study  ',
    path: {
      curvePx: -999,
      apexHeight: Infinity,
      flightMs: '720'
    },
    rotation: {
      flipTurns: 99
    },
    landing: {
      settleMs: -50
    },
    shadow: {
      strength: 5,
      spread: 0
    }
  };
  const partialBefore = clone(partial);
  const normalized =
    normalizeTurnMarkerMotionProfile(partial);
  assert(
    JSON.stringify(partial) ===
      JSON.stringify(partialBefore),
    'normalization mutates its source'
  );
  assert(
    normalized.id === 'coin-physics',
    'profile id was not normalized'
  );
  assert(
    normalized.label === 'Coin Physics Study',
    'profile label was not normalized'
  );
  assert(
    normalized.path.curvePx ===
      TURN_MARKER_MOTION_LIMITS.path.curvePx
        .minimum,
    'curve was not clamped'
  );
  assert(
    normalized.path.apexHeight ===
      DEFAULT_TURN_MARKER_MOTION_PROFILE.path
        .apexHeight,
    'non-finite apex did not use a finite default'
  );
  assert(
    normalized.path.flightMs === 720,
    'numeric input value was not accepted'
  );
  assert(
    normalized.rotation.flipTurns ===
      TURN_MARKER_MOTION_LIMITS.rotation
        .flipTurns.maximum,
    'flip turns were not clamped'
  );
  assert(
    normalized.landing.settleMs === 0,
    'settle duration was not clamped'
  );
  assert(
    normalized.shadow.strength === 1 &&
      normalized.shadow.spread ===
        TURN_MARKER_MOTION_LIMITS.shadow.spread
          .minimum,
    'shadow values were not clamped'
  );
  assertDeepFrozen(normalized, 'normalized profile');
  assertThrows(
    () => normalizeTurnMarkerMotionProfile({
      schemaVersion: 2
    }),
    /Unsupported turn-marker-motion schema version/,
    'normalization accepts a future schema'
  );

  const serialized =
    serializeTurnMarkerMotionProfile(
      DEFAULT_TURN_MARKER_MOTION_PROFILE
    );
  const parsed =
    parseTurnMarkerMotionProfile(serialized);
  assert(
    serializeTurnMarkerMotionProfile(parsed) ===
      serialized,
    'profile serialization is not stable'
  );
  assertDeepFrozen(parsed, 'parsed profile');
  assertThrows(
    () => parseTurnMarkerMotionProfile(
      JSON.stringify({
        ...clone(DEFAULT_TURN_MARKER_MOTION_PROFILE),
        unexpected: true
      })
    ),
    /must contain exactly/,
    'strict parsing accepts unknown fields'
  );
  assertThrows(
    () => parseTurnMarkerMotionProfile(
      JSON.stringify({
        ...clone(DEFAULT_TURN_MARKER_MOTION_PROFILE),
        path: {
          ...clone(
            DEFAULT_TURN_MARKER_MOTION_PROFILE.path
          ),
          flightMs: null
        }
      })
    ),
    /must be a finite number/,
    'strict parsing accepts a non-number'
  );

  const forwardInstance = {
    source: TURN_MARKER_MATCH_CENTERS.player,
    destination:
      TURN_MARKER_MATCH_CENTERS.opponent,
    delayMs: 80
  };
  const instanceBefore = clone(forwardInstance);
  const profileBefore = clone(
    DEFAULT_TURN_MARKER_MOTION_PROFILE
  );
  const forwardPlan =
    createTurnMarkerMotionPlan(
      DEFAULT_TURN_MARKER_MOTION_PROFILE,
      forwardInstance
    );
  assert(
    JSON.stringify(forwardInstance) ===
      JSON.stringify(instanceBefore),
    'planning mutates its instance'
  );
  assert(
    JSON.stringify(
      DEFAULT_TURN_MARKER_MOTION_PROFILE
    ) === JSON.stringify(profileBefore),
    'planning mutates its profile'
  );
  assertDeepFrozen(forwardPlan, 'forward plan');
  assert(
    forwardPlan.directionSign === 1,
    'forward plan has the wrong direction'
  );
  assert(
    forwardPlan.timing.totalMs ===
      80 +
      DEFAULT_TURN_MARKER_MOTION_PROFILE.path
        .flightMs +
      DEFAULT_TURN_MARKER_MOTION_PROFILE.landing
        .settleMs,
    'plan total duration is wrong'
  );

  const waiting = sampleTurnMarkerMotion(
    forwardPlan,
    40
  );
  assert(
    waiting.phase === 'waiting' &&
      waiting.complete === false,
    'delay does not produce a waiting pose'
  );
  assertNear(
    waiting.screenX,
    TURN_MARKER_MATCH_CENTERS.player.x,
    epsilon,
    'waiting x'
  );
  assertNear(waiting.height, 0, epsilon, 'waiting height');

  const reversePlan =
    createTurnMarkerMotionPlan(
      DEFAULT_TURN_MARKER_MOTION_PROFILE,
      {
        source:
          TURN_MARKER_MATCH_CENTERS.opponent,
        destination:
          TURN_MARKER_MATCH_CENTERS.player,
        delayMs: 80
      }
    );
  assert(
    reversePlan.directionSign === -1,
    'reverse plan has the wrong direction'
  );
  assertDeepFrozen(reversePlan, 'reverse plan');

  for (let step = 0; step <= 120; step += 1) {
    const progress = step / 120;
    const elapsed =
      forwardPlan.timing.delayMs +
      (
        forwardPlan.timing.flightMs *
        progress
      );
    const forward = sampleTurnMarkerMotion(
      forwardPlan,
      elapsed
    );
    const reverse = sampleTurnMarkerMotion(
      reversePlan,
      elapsed
    );
    sampledPoses += 2;
    assertFinitePose(
      forward,
      `forward pose ${step}`
    );
    assertFinitePose(
      reverse,
      `reverse pose ${step}`
    );
    assertNear(
      forward.screenX + reverse.screenX,
      TURN_MARKER_MATCH_CENTERS.player.x +
        TURN_MARKER_MATCH_CENTERS.opponent.x,
      epsilon,
      `mirrored x ${step}`
    );
    assertNear(
      forward.screenY,
      reverse.screenY,
      epsilon,
      `mirrored y ${step}`
    );
    assertNear(
      forward.height,
      reverse.height,
      epsilon,
      `mirrored height ${step}`
    );
    assertNear(
      forward.rotationX,
      -reverse.rotationX,
      epsilon,
      `mirrored tumble ${step}`
    );
    assertNear(
      forward.rotationY,
      -reverse.rotationY,
      epsilon,
      `mirrored flip ${step}`
    );
    assertNear(
      forward.rotationZ,
      -reverse.rotationZ,
      epsilon,
      `mirrored spin ${step}`
    );
  }

  const visibleFlip = sampleTurnMarkerMotion(
    forwardPlan,
    forwardPlan.timing.delayMs +
      (forwardPlan.timing.flightMs * 0.1)
  );
  assert(
    visibleFlip.height > 0,
    'default toss does not rise above the table'
  );
  assert(
    Math.abs(Math.sin(visibleFlip.rotationY)) >
      0.9,
    'default toss does not show a strong 3D edge'
  );
  assert(
    visibleFlip.shadowOpacity <
      DEFAULT_TURN_MARKER_MOTION_PROFILE.shadow
        .strength &&
      visibleFlip.shadowScale >
        DEFAULT_TURN_MARKER_MOTION_PROFILE.shadow
          .spread,
    'shadow does not react to coin height'
  );

  const contact = sampleTurnMarkerMotion(
    forwardPlan,
    forwardPlan.timing.delayMs +
      forwardPlan.timing.flightMs
  );
  assert(
    contact.phase === 'settling',
    'contact does not enter settling'
  );
  assertNear(
    contact.screenX,
    TURN_MARKER_MATCH_CENTERS.opponent.x,
    epsilon,
    'contact x'
  );
  assertNear(contact.height, 0, epsilon, 'contact height');

  const settled = sampleTurnMarkerMotion(
    forwardPlan,
    forwardPlan.timing.totalMs
  );
  const overdue = sampleTurnMarkerMotion(
    forwardPlan,
    forwardPlan.timing.totalMs + 10000
  );
  [settled, overdue].forEach((pose, index) => {
    assertFinitePose(pose, `settled pose ${index}`);
    assert(
      pose.phase === 'complete' &&
        pose.complete === true &&
        pose.progress === 1,
      `settled pose ${index} is incomplete`
    );
    assertNear(
      pose.screenX,
      TURN_MARKER_MATCH_CENTERS.opponent.x,
      epsilon,
      `settled pose ${index} x`
    );
    assertNear(
      pose.screenY,
      TURN_MARKER_MATCH_CENTERS.opponent.y,
      epsilon,
      `settled pose ${index} y`
    );
    assertNear(
      pose.height,
      0,
      epsilon,
      `settled pose ${index} height`
    );
    assertNear(
      Math.sin(pose.rotationX),
      0,
      epsilon,
      `settled pose ${index} pitch is not flat`
    );
    assertNear(
      Math.sin(pose.rotationY),
      0,
      epsilon,
      `settled pose ${index} yaw is not flat`
    );
  });

  const interruptedPose = {
    screenX: 312.25,
    screenY: 371.75,
    height: 64,
    rotationX: 1.1,
    rotationY: -2.2,
    rotationZ: 0.45,
    shadowOpacity: 0.12,
    shadowScale: 1.6
  };
  const interruptedPlan =
    createTurnMarkerMotionPlan(
      DEFAULT_TURN_MARKER_MOTION_PROFILE,
      {
        source:
          TURN_MARKER_MATCH_CENTERS.opponent,
        destination:
          TURN_MARKER_MATCH_CENTERS.player,
        sourcePose: interruptedPose
      }
    );
  const interruptedStart =
    sampleTurnMarkerMotion(
      interruptedPlan,
      0
    );
  [
    ['screenX', interruptedPose.screenX],
    ['screenY', interruptedPose.screenY],
    ['height', interruptedPose.height],
    ['rotationX', interruptedPose.rotationX],
    ['rotationY', interruptedPose.rotationY],
    ['rotationZ', interruptedPose.rotationZ],
    ['shadowOpacity', interruptedPose.shadowOpacity],
    ['shadowScale', interruptedPose.shadowScale]
  ].forEach(([key, expected]) => {
    assertNear(
      interruptedStart[key],
      expected,
      epsilon,
      `interrupted start ${key}`
    );
  });
  assertDeepFrozen(
    interruptedPlan,
    'interrupted plan'
  );

  assertThrows(
    () => createTurnMarkerMotionPlan(
      DEFAULT_TURN_MARKER_MOTION_PROFILE,
      {
        source: {x: NaN, y: 0},
        destination: {x: 1, y: 1}
      }
    ),
    /must be a finite number/,
    'planning accepts a non-finite source'
  );
  assertThrows(
    () => createTurnMarkerMotionPlan(
      DEFAULT_TURN_MARKER_MOTION_PROFILE,
      {
        source: {x: 0, y: 0},
        destination: {x: 1, y: 1},
        delayMs: -1
      }
    ),
    /must be between/,
    'planning accepts a negative delay'
  );
  assertThrows(
    () => sampleTurnMarkerMotion({}, 0),
    /requires a current/,
    'sampling accepts an invalid plan'
  );
  assertThrows(
    () => sampleTurnMarkerMotion(
      forwardPlan,
      Infinity
    ),
    /must be finite/,
    'sampling accepts non-finite elapsed time'
  );

  console.log(
    `turn-marker-motion contract passed ` +
    `(${assertions} assertions, ` +
    `${sampledPoses} sampled flight poses)`
  );
} catch (error) {
  console.error(error.stack || error.message);
  process.exitCode = 1;
}
