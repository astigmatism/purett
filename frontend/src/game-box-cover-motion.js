export const GAME_BOX_COVER_MOTION_SCHEMA_VERSION = 1;
export const GAME_BOX_COVER_CACHE_IDENTITY =
  '0.185.1-game-cover-hinge.1';

export const GAME_BOX_COVER_STAGE = Object.freeze({
  width: 755,
  height: 562
});

export const GAME_BOX_COVER_DOORS = Object.freeze({
  left: Object.freeze({
    x: 0,
    width: 377,
    hingeX: 0,
    textureUrl: '/images/left.png'
  }),
  right: Object.freeze({
    x: 376,
    width: 378,
    hingeX: 754,
    textureUrl: '/images/right.png'
  })
});

export const GAME_BOX_COVER_MOTION_DEFAULTS =
  Object.freeze({
    durationMs: 2000,
    openAngleDegrees: 112
  });

const PLAN_TYPE =
  'purett-game-box-cover-motion-plan';

function finiteNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new TypeError(`${label} must be finite.`);
  }
  return number;
}

function openness(value, label) {
  const number = finiteNumber(value, label);
  if (number < 0 || number > 1) {
    throw new RangeError(
      `${label} must be between 0 and 1.`
    );
  }
  return number;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function cubicIn(progress) {
  const value = clamp01(progress);
  return value * value * value;
}

function cubicOut(progress) {
  const value = clamp01(progress);
  return 1 - Math.pow(1 - value, 3);
}

export function createGameBoxCoverMotionPlan(
  options
) {
  const source = options || {};
  const fromOpenness = openness(
    source.fromOpenness,
    'fromOpenness'
  );
  const toOpenness = openness(
    source.toOpenness,
    'toOpenness'
  );
  const distance = Math.abs(
    toOpenness - fromOpenness
  );
  const direction =
    toOpenness > fromOpenness
      ? 'open'
      : (
          toOpenness < fromOpenness
            ? 'close'
            : 'settled'
        );
  const durationMs = distance === 0
    ? 0
    : GAME_BOX_COVER_MOTION_DEFAULTS
        .durationMs;

  return Object.freeze({
    type: PLAN_TYPE,
    schemaVersion:
      GAME_BOX_COVER_MOTION_SCHEMA_VERSION,
    direction,
    easing:
      direction === 'open'
        ? 'cubic-in'
        : (
            direction === 'close'
              ? 'cubic-out'
              : 'none'
          ),
    fromOpenness,
    toOpenness,
    distance,
    durationMs,
    openAngleRadians:
      GAME_BOX_COVER_MOTION_DEFAULTS
        .openAngleDegrees *
      (Math.PI / 180)
  });
}

function doorPose(
  side,
  rotationY,
  opennessValue
) {
  const definition =
    GAME_BOX_COVER_DOORS[side];
  const angle = Math.abs(rotationY);
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const projectedInnerEdgeX =
    side === 'left'
      ? definition.hingeX +
        (definition.width * cosine)
      : definition.hingeX -
        (definition.width * cosine);

  return Object.freeze({
    rotationY,
    openness: opennessValue,
    hingeX: definition.hingeX,
    projectedInnerEdgeX,
    innerEdgeDepth:
      definition.width * sine
  });
}

export function sampleGameBoxCoverMotion(
  plan,
  elapsedMs
) {
  if (
    !plan ||
    plan.type !== PLAN_TYPE ||
    plan.schemaVersion !==
      GAME_BOX_COVER_MOTION_SCHEMA_VERSION
  ) {
    throw new TypeError(
      'A compatible game-box cover motion plan is required.'
    );
  }
  const elapsed = finiteNumber(
    elapsedMs,
    'elapsedMs'
  );
  if (elapsed < 0) {
    throw new RangeError(
      'elapsedMs must not be negative.'
    );
  }

  const progress = plan.durationMs === 0
    ? 1
    : clamp01(elapsed / plan.durationMs);
  const easedProgress =
    plan.direction === 'open'
      ? cubicIn(progress)
      : (
          plan.direction === 'close'
            ? cubicOut(progress)
            : 1
        );
  const opennessValue =
    plan.fromOpenness +
    (
      (
        plan.toOpenness -
        plan.fromOpenness
      ) *
      easedProgress
    );
  const angle =
    plan.openAngleRadians * opennessValue;

  return Object.freeze({
    phase:
      progress >= 1
        ? 'complete'
        : 'hinge-travel',
    complete: progress >= 1,
    direction: plan.direction,
    elapsedMs: Math.min(
      elapsed,
      plan.durationMs
    ),
    durationMs: plan.durationMs,
    progress,
    easedProgress,
    openness: opennessValue,
    left: doorPose(
      'left',
      -angle,
      opennessValue
    ),
    right: doorPose(
      'right',
      angle,
      opennessValue
    )
  });
}
