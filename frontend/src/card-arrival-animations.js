const DEGREES_TO_RADIANS = Math.PI / 180;

export const CASUAL_DROP_LEFT_PROFILE = Object.freeze({
  name: 'casual-drop-left',
  originEdge: 'left',
  staggerStepMs: 92,
  staggerJitterMs: 38,
  durationMinMs: 1180,
  durationRangeMs: 250,
  flightRatio: 0.76,
  maxBatchDurationMs: 2000
});

export const CARD_ARRIVAL_PROFILES = Object.freeze({
  [CASUAL_DROP_LEFT_PROFILE.name]: CASUAL_DROP_LEFT_PROFILE
});

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function interpolate(start, end, progress) {
  return start + ((end - start) * progress);
}

function cubicBezier(start, controlOne, controlTwo, end, progress) {
  const inverse = 1 - progress;
  return (
    (inverse * inverse * inverse * start) +
    (3 * inverse * inverse * progress * controlOne) +
    (3 * inverse * progress * progress * controlTwo) +
    (progress * progress * progress * end)
  );
}

function easeOutCubic(progress) {
  const bounded = clamp(progress, 0, 1);
  return 1 - Math.pow(1 - bounded, 3);
}

function easeInCubic(progress) {
  const bounded = clamp(progress, 0, 1);
  return bounded * bounded * bounded;
}

function fnv1a(value) {
  let hash = 0x811c9dc5;
  const text = String(value);
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mixSeed(...values) {
  return fnv1a(values.join('|'));
}

function createSeededRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function randomBetween(random, minimum, maximum) {
  return minimum + ((maximum - minimum) * random());
}

function resolveProfile(request) {
  const profileName = request && request.profile
    ? String(request.profile)
    : CASUAL_DROP_LEFT_PROFILE.name;
  const profile = CARD_ARRIVAL_PROFILES[profileName];
  if (!profile) {
    throw new Error(`Unknown card-arrival profile "${profileName}".`);
  }
  return profile;
}

function validateCard(card, index) {
  const destination = card && card.destination;
  const numericFields = [
    card && card.width,
    card && card.height,
    card && card.viewportHeight,
    destination && destination.x,
    destination && destination.y,
    destination && destination.z
  ];
  if (!card || !destination ||
      numericFields.some((value) => (
        typeof value !== 'number' || !Number.isFinite(value)
      )) ||
      card.width <= 0 ||
      card.height <= 0 ||
      card.viewportHeight <= 0) {
    throw new Error(`Card-arrival input ${index + 1} is invalid.`);
  }
  if (card.perspectiveDistance != null &&
      (typeof card.perspectiveDistance !== 'number' ||
        !Number.isFinite(card.perspectiveDistance) ||
        card.perspectiveDistance <= 0)) {
    throw new Error(
      `Card-arrival input ${index + 1} has an invalid perspective distance.`
    );
  }
}

function stableCardKey(card, fallbackIndex) {
  return [
    card.userCardId == null ? '' : card.userCardId,
    card.cardId == null ? '' : card.cardId,
    card.index == null ? fallbackIndex : card.index,
    card.textureUrl || ''
  ].join(':');
}

function createPlan(card, batchSeed, orderIndex, fallbackIndex, profile) {
  const destination = card.destination;
  const cardSeed = mixSeed(
    batchSeed,
    profile.name,
    stableCardKey(card, fallbackIndex)
  );
  const random = createSeededRandom(cardSeed);
  const halfHeight = card.height / 2;
  const halfDiagonal = Math.hypot(card.width, card.height) / 2;
  const launchDepth = randomBetween(random, 105, 168);
  const perspectiveDistance = card.perspectiveDistance == null
    ? null
    : card.perspectiveDistance;
  let maximumPerspectiveScale = 1.6;
  if (perspectiveDistance !== null) {
    const nearestPossibleDepth =
      perspectiveDistance - launchDepth - halfDiagonal;
    if (nearestPossibleDepth <= 0) {
      throw new Error(
        `Card-arrival input ${fallbackIndex + 1} crosses its perspective camera.`
      );
    }
    maximumPerspectiveScale = Math.max(
      1,
      perspectiveDistance / nearestPossibleDepth
    );
  }
  const launchHalfExtent = halfDiagonal * maximumPerspectiveScale;
  const start = {
    x: -launchHalfExtent - randomBetween(random, 28, 118),
    y: clamp(
      destination.y + randomBetween(random, -175, 140),
      -halfHeight,
      card.viewportHeight + halfHeight
    ),
    depth: launchDepth,
    rotationX: randomBetween(random, -15, 18) * DEGREES_TO_RADIANS,
    rotationY: randomBetween(random, -12, 12) * DEGREES_TO_RADIANS,
    rotationZ: randomBetween(random, -25, 25) * DEGREES_TO_RADIANS
  };
  const impactOffset = {
    x: randomBetween(random, -11, 11),
    y: randomBetween(random, -8, 10),
    depth: randomBetween(random, 4, 11),
    rotationX: randomBetween(random, -3.5, 3.5) * DEGREES_TO_RADIANS,
    rotationY: randomBetween(random, -2.5, 2.5) * DEGREES_TO_RADIANS,
    rotationZ: randomBetween(random, -4, 4) * DEGREES_TO_RADIANS
  };
  const delayMs =
    (orderIndex * profile.staggerStepMs) +
    Math.round(randomBetween(random, 0, profile.staggerJitterMs));
  const durationMs = Math.round(
    profile.durationMinMs + randomBetween(random, 0, profile.durationRangeMs)
  );

  return {
    cardIndex: card.index,
    key: stableCardKey(card, fallbackIndex),
    seed: cardSeed,
    orderIndex,
    delayMs,
    durationMs,
    totalDurationMs: delayMs + durationMs,
    profile: profile.name,
    destination: {
      x: destination.x,
      y: destination.y,
      z: destination.z
    },
    launchHalfExtent,
    start,
    controls: {
      one: {
        x: randomBetween(random, 18, 118),
        y: start.y + randomBetween(random, -75, 115)
      },
      two: {
        x: destination.x - randomBetween(random, 75, 210),
        y: destination.y + randomBetween(random, -105, 90)
      }
    },
    impactOffset,
    arcDepth: randomBetween(random, 30, 72),
    flutterX: randomBetween(random, -4, 4) * DEGREES_TO_RADIANS,
    flutterY: randomBetween(random, -3, 3) * DEGREES_TO_RADIANS,
    flutterZ: randomBetween(random, -5, 5) * DEGREES_TO_RADIANS,
    landingCycles: randomBetween(random, 1.15, 1.7),
    flightRatio: profile.flightRatio
  };
}

export function createCardArrivalBatch(cards, request) {
  if (!Array.isArray(cards)) {
    throw new Error('Card-arrival cards must be an array.');
  }
  cards.forEach(validateCard);
  const profile = resolveProfile(request);
  const requestId = request && request.id != null ? String(request.id) : '0';
  const requestedSeed = request && request.seed != null
    ? request.seed
    : `${profile.name}:${requestId}`;
  const batchSeed = fnv1a(requestedSeed);
  const rankedCards = cards.map((card, index) => {
    const cardSeed = mixSeed(batchSeed, stableCardKey(card, index), 'arrival-order');
    return {
      card,
      index,
      rank: createSeededRandom(cardSeed)()
    };
  }).sort((left, right) => (
    left.rank - right.rank || left.index - right.index
  ));
  const orderByIndex = new Map();
  rankedCards.forEach((ranked, orderIndex) => {
    orderByIndex.set(ranked.index, orderIndex);
  });
  const plans = cards.map((card, index) => createPlan(
    card,
    batchSeed,
    orderByIndex.get(index),
    index,
    profile
  ));
  const totalDurationMs = plans.reduce((maximum, plan) => (
    Math.max(maximum, plan.totalDurationMs)
  ), 0);

  if (totalDurationMs > profile.maxBatchDurationMs) {
    throw new Error(
      `${profile.name} exceeded its ${profile.maxBatchDurationMs}ms batch deadline.`
    );
  }

  return {
    requestId,
    trigger: request && request.trigger
      ? String(request.trigger)
      : 'command-bar-reveal',
    profile: profile.name,
    originEdge: profile.originEdge,
    seed: batchSeed,
    requestedSeed: String(requestedSeed),
    maxBatchDurationMs: profile.maxBatchDurationMs,
    totalDurationMs,
    plans
  };
}

export function sampleCardArrival(plan, elapsedMs) {
  const elapsed = Math.max(0, elapsedMs);
  const localElapsed = elapsed - plan.delayMs;
  const destination = plan.destination;

  if (localElapsed <= 0) {
    return {
      complete: false,
      phase: 'waiting',
      progress: 0,
      screenX: plan.start.x,
      screenY: plan.start.y,
      depth: plan.start.depth,
      z: destination.z + plan.start.depth,
      rotationX: plan.start.rotationX,
      rotationY: plan.start.rotationY,
      rotationZ: plan.start.rotationZ
    };
  }

  if (localElapsed >= plan.durationMs) {
    return {
      complete: true,
      phase: 'settled',
      progress: 1,
      screenX: destination.x,
      screenY: destination.y,
      depth: 0,
      z: destination.z,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0
    };
  }

  const flightDuration = plan.durationMs * plan.flightRatio;
  if (localElapsed < flightDuration) {
    const rawProgress = localElapsed / flightDuration;
    const pathProgress = easeOutCubic(rawProgress);
    const impactX = destination.x + plan.impactOffset.x;
    const impactY = destination.y + plan.impactOffset.y;
    const orientationProgress = easeOutCubic(rawProgress);
    const flutterEnvelope = Math.sin(Math.PI * rawProgress);
    const fallingDepth =
      interpolate(plan.start.depth, plan.impactOffset.depth, easeInCubic(rawProgress)) +
      (plan.arcDepth * Math.sin(Math.PI * rawProgress));

    return {
      complete: false,
      phase: 'flight',
      progress: rawProgress,
      screenX: cubicBezier(
        plan.start.x,
        plan.controls.one.x,
        plan.controls.two.x,
        impactX,
        pathProgress
      ),
      screenY: cubicBezier(
        plan.start.y,
        plan.controls.one.y,
        plan.controls.two.y,
        impactY,
        pathProgress
      ),
      depth: Math.max(plan.impactOffset.depth, fallingDepth),
      z: destination.z + Math.max(plan.impactOffset.depth, fallingDepth),
      rotationX:
        interpolate(plan.start.rotationX, plan.impactOffset.rotationX, orientationProgress) +
        (plan.flutterX * flutterEnvelope),
      rotationY:
        interpolate(plan.start.rotationY, plan.impactOffset.rotationY, orientationProgress) +
        (plan.flutterY * flutterEnvelope),
      rotationZ:
        interpolate(plan.start.rotationZ, plan.impactOffset.rotationZ, orientationProgress) +
        (plan.flutterZ * flutterEnvelope)
    };
  }

  const landingProgress =
    (localElapsed - flightDuration) /
    (plan.durationMs - flightDuration);
  const envelope = Math.pow(1 - landingProgress, 2);
  const rebound = Math.cos(
    landingProgress * Math.PI * 2 * plan.landingCycles
  ) * envelope;
  const depthBounce = Math.abs(Math.sin(
    landingProgress * Math.PI * plan.landingCycles
  )) * plan.impactOffset.depth * envelope;

  const landingDepth = Math.max(
    0,
    (plan.impactOffset.depth * envelope) + depthBounce
  );

  return {
    complete: false,
    phase: 'landing',
    progress: landingProgress,
    screenX: destination.x + (plan.impactOffset.x * rebound),
    screenY: destination.y + (plan.impactOffset.y * rebound),
    depth: landingDepth,
    z: destination.z + landingDepth,
    rotationX: plan.impactOffset.rotationX * rebound,
    rotationY: plan.impactOffset.rotationY * rebound,
    rotationZ: plan.impactOffset.rotationZ * rebound
  };
}
