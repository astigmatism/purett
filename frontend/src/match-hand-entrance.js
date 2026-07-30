export const MATCH_HAND_ENTRANCE_SCHEMA_VERSION = 1;
export const MATCH_HAND_ENTRANCE_CACHE_IDENTITY =
  '0.185.1-match-hand-fan.1';

export const MATCH_HAND_ENTRANCE_DEFAULTS = Object.freeze({
  cardDurationMs: 620,
  staggerMs: 55,
  liftDepth: 18,
  lateralArc: 4,
  tiltDegrees: 4.5,
  yawDegrees: 2,
  rollDegrees: 1.5
});

function clamp(value, minimum, maximum) {
  return Math.min(
    Math.max(value, minimum),
    maximum
  );
}

function easeOutCubic(progress) {
  return 1 - Math.pow(1 - progress, 3);
}

function radians(degrees) {
  return degrees * (Math.PI / 180);
}

function finiteNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(
      `The match-hand entrance ${label} must be finite.`
    );
  }
  return number;
}

function nonnegativeNumber(value, label) {
  const number = finiteNumber(value, label);
  if (number < 0) {
    throw new Error(
      `The match-hand entrance ${label} cannot be negative.`
    );
  }
  return number;
}

function positiveNumber(value, label) {
  const number = finiteNumber(value, label);
  if (number <= 0) {
    throw new Error(
      `The match-hand entrance ${label} must be positive.`
    );
  }
  return number;
}

function deepFreeze(value) {
  if (
    !value ||
    typeof value !== 'object' ||
    Object.isFrozen(value)
  ) {
    return value;
  }
  Object.keys(value).forEach((key) => {
    deepFreeze(value[key]);
  });
  return Object.freeze(value);
}

function normalizeDefaults(options) {
  const source = options || {};
  return {
    cardDurationMs: positiveNumber(
      source.cardDurationMs == null
        ? MATCH_HAND_ENTRANCE_DEFAULTS.cardDurationMs
        : source.cardDurationMs,
      'card duration'
    ),
    staggerMs: nonnegativeNumber(
      source.staggerMs == null
        ? MATCH_HAND_ENTRANCE_DEFAULTS.staggerMs
        : source.staggerMs,
      'stagger'
    ),
    liftDepth: nonnegativeNumber(
      source.liftDepth == null
        ? MATCH_HAND_ENTRANCE_DEFAULTS.liftDepth
        : source.liftDepth,
      'lift depth'
    ),
    lateralArc: nonnegativeNumber(
      source.lateralArc == null
        ? MATCH_HAND_ENTRANCE_DEFAULTS.lateralArc
        : source.lateralArc,
      'lateral arc'
    ),
    tiltDegrees: nonnegativeNumber(
      source.tiltDegrees == null
        ? MATCH_HAND_ENTRANCE_DEFAULTS.tiltDegrees
        : source.tiltDegrees,
      'tilt'
    ),
    yawDegrees: nonnegativeNumber(
      source.yawDegrees == null
        ? MATCH_HAND_ENTRANCE_DEFAULTS.yawDegrees
        : source.yawDegrees,
      'yaw'
    ),
    rollDegrees: nonnegativeNumber(
      source.rollDegrees == null
        ? MATCH_HAND_ENTRANCE_DEFAULTS.rollDegrees
        : source.rollDegrees,
      'roll'
    )
  };
}

function normalizeSide(cards, side) {
  if (!Array.isArray(cards) || cards.length > 5) {
    throw new Error(
      `The ${side} match hand must contain zero to five cards.`
    );
  }

  return cards.map((card, index) => {
    const handIndex = Number(card && card.handIndex);
    const width = positiveNumber(
      card && card.width,
      `${side} card width`
    );
    const height = positiveNumber(
      card && card.height,
      `${side} card height`
    );
    const x = finiteNumber(
      card && card.x,
      `${side} card x`
    );
    const y = finiteNumber(
      card && card.y,
      `${side} card y`
    );

    if (
      !Number.isInteger(handIndex) ||
      handIndex !== index
    ) {
      throw new Error(
        `The ${side} match-hand indexes must be contiguous.`
      );
    }

    return {
      side,
      handIndex,
      destination: {
        x: x + (width / 2),
        y: y + (height / 2)
      }
    };
  });
}

function buildSidePlans(cards, side, defaults) {
  const normalized = normalizeSide(cards, side);
  if (normalized.length === 0) {
    return [];
  }

  const stackCard =
    normalized[normalized.length - 1];
  const stack = stackCard.destination;
  const maximumTravel = normalized.reduce(
    (maximum, card) =>
      Math.max(
        maximum,
        Math.hypot(
          card.destination.x - stack.x,
          card.destination.y - stack.y
        )
      ),
    0
  );
  const sideSign = side === 'player'
    ? -1
    : 1;
  const lastMovingIndex =
    normalized.length - 2;

  return normalized.map((card) => {
    const stationary =
      card.handIndex ===
        stackCard.handIndex;
    const travelDistance = Math.hypot(
      card.destination.x - stack.x,
      card.destination.y - stack.y
    );
    const travelRatio = maximumTravel > 0
      ? travelDistance / maximumTravel
      : 0;
    const revealOrdinal = stationary
      ? -1
      : lastMovingIndex -
        card.handIndex;
    const delayMs = stationary
      ? 0
      : revealOrdinal *
        defaults.staggerMs;

    return {
      side,
      sideSign,
      handIndex: card.handIndex,
      topmostInStack:
        card.handIndex ===
          stackCard.handIndex,
      stationary,
      revealOrdinal,
      source: {
        x: stack.x,
        y: stack.y
      },
      destination: card.destination,
      travelDistance,
      travelRatio,
      delayMs,
      durationMs: stationary
        ? 0
        : defaults.cardDurationMs
    };
  });
}

export function createMatchHandEntrancePlan(
  hands,
  options
) {
  const source = hands || {};
  const defaults = normalizeDefaults(options);
  const cards = buildSidePlans(
    source.player || [],
    'player',
    defaults
  ).concat(
    buildSidePlans(
      source.opponent || [],
      'opponent',
      defaults
    )
  );
  const totalMs = cards.reduce(
    (maximum, card) =>
      Math.max(
        maximum,
        card.delayMs + card.durationMs
      ),
    0
  );

  return deepFreeze({
    schemaVersion:
      MATCH_HAND_ENTRANCE_SCHEMA_VERSION,
    subject: 'match-hands',
    stackAnchor: 'last-current-card',
    revealOrder:
      'next-under-top-through-first',
    easing: 'cubic-out',
    defaults,
    totalMs,
    cards
  });
}

function sampleCard(plan, elapsedMs, defaults) {
  if (plan.stationary) {
    return {
      side: plan.side,
      handIndex: plan.handIndex,
      topmostInStack:
        plan.topmostInStack,
      revealOrdinal:
        plan.revealOrdinal,
      delayMs: plan.delayMs,
      durationMs: plan.durationMs,
      rawProgress: 1,
      easedProgress: 1,
      screenX: plan.destination.x,
      screenY: plan.destination.y,
      depth: 0,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      complete: true
    };
  }

  const localElapsed = Math.max(
    0,
    elapsedMs - plan.delayMs
  );
  const rawProgress = clamp(
    localElapsed / plan.durationMs,
    0,
    1
  );
  const easedProgress =
    easeOutCubic(rawProgress);
  const motionArc =
    rawProgress <= 0 ||
    rawProgress >= 1
      ? 0
      : (
          Math.sin(Math.PI * rawProgress) *
          plan.travelRatio
        );
  const screenX =
    plan.source.x +
    (
      (
        plan.destination.x -
        plan.source.x
      ) *
      easedProgress
    ) +
    (
      plan.sideSign *
      defaults.lateralArc *
      motionArc
    );

  return {
    side: plan.side,
    handIndex: plan.handIndex,
    topmostInStack:
      plan.topmostInStack,
    revealOrdinal:
      plan.revealOrdinal,
    delayMs: plan.delayMs,
    durationMs: plan.durationMs,
    rawProgress,
    easedProgress,
    screenX,
    screenY:
      plan.source.y +
      (
        (
          plan.destination.y -
          plan.source.y
        ) *
        easedProgress
      ),
    depth:
      defaults.liftDepth *
      motionArc,
    rotationX:
      -radians(
        defaults.tiltDegrees
      ) *
      motionArc,
    rotationY:
      plan.sideSign *
      radians(
        defaults.yawDegrees
      ) *
      motionArc,
    rotationZ:
      plan.sideSign *
      radians(
        defaults.rollDegrees
      ) *
      motionArc,
    complete: rawProgress >= 1
  };
}

export function sampleMatchHandEntrance(
  plan,
  elapsedMs
) {
  if (
    !plan ||
    plan.schemaVersion !==
      MATCH_HAND_ENTRANCE_SCHEMA_VERSION ||
    !Array.isArray(plan.cards) ||
    !plan.defaults
  ) {
    throw new Error(
      'The match-hand entrance plan is invalid.'
    );
  }
  const elapsed = nonnegativeNumber(
    elapsedMs,
    'elapsed time'
  );
  const cards = plan.cards.map((card) =>
    sampleCard(
      card,
      elapsed,
      plan.defaults
    )
  );
  const complete =
    elapsed >= plan.totalMs &&
    cards.every((card) => card.complete);

  return {
    subject: plan.subject,
    elapsedMs: elapsed,
    totalMs: plan.totalMs,
    progress: plan.totalMs === 0
      ? 1
      : clamp(
          elapsed / plan.totalMs,
          0,
          1
        ),
    complete,
    cards
  };
}
