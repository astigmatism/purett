const DEGREES_TO_RADIANS = Math.PI / 180;
const CARD_FACE_OFFSET = 1.7;

export const CASUAL_DROP_LEFT_PROFILE = Object.freeze({
  name: 'casual-drop-left',
  originEdge: 'left',
  originPolicy: 'compact-left-hand-packet',
  placementOrder: 'art-directed-human-scatter',
  collisionPolicy: 'depth-separated-natural-overflight',
  minimumReleaseGapMs: 55,
  maximumReleaseGapMs: 340,
  maximumReleaseWindowMs: 720,
  minimumFlightMs: 390,
  maximumFlightMs: 880,
  maximumAirDepth: 52,
  maximumVertexPerspectiveScale: 1.09,
  maxBatchDurationMs: 1500
});

export const CARD_ARRIVAL_PROFILES = Object.freeze({
  [CASUAL_DROP_LEFT_PROFILE.name]: CASUAL_DROP_LEFT_PROFILE
});

const HUMAN_SCATTER_GESTURES = Object.freeze([
  Object.freeze({
    name: 'long-skim',
    speedMin: 0.88,
    speedMax: 0.94,
    releaseGapMinMs: 0,
    releaseGapMaxMs: 0,
    launchYOffset: -7,
    launchAirGapMin: 4,
    launchAirGapMax: 7,
    verticalImpulseMin: 21,
    verticalImpulseMax: 27,
    startPitchMin: 5,
    startPitchMax: 8,
    startYawMin: 10,
    startYawMax: 13,
    contactPitchMin: 2,
    contactPitchMax: 3.5,
    contactYawMin: 3,
    contactYawMax: 4.5,
    spinMin: 8,
    spinMax: 14,
    slideDistanceMin: 39,
    slideDistanceMax: 47,
    slapDurationMinMs: 70,
    slapDurationMaxMs: 88,
    postContactDurationMinMs: 225,
    postContactDurationMaxMs: 250,
    pathBowMin: 22,
    pathBowMax: 36,
    launchDirectionJitterDegrees: 5,
    skidDirectionJitterDegrees: 3
  }),
  Object.freeze({
    name: 'lofted-toss',
    speedMin: 0.72,
    speedMax: 0.8,
    releaseGapMinMs: 105,
    releaseGapMaxMs: 145,
    launchYOffset: 13,
    launchAirGapMin: 10,
    launchAirGapMax: 14,
    verticalImpulseMin: 42,
    verticalImpulseMax: 50,
    startPitchMin: 7,
    startPitchMax: 10,
    startYawMin: 8,
    startYawMax: 12,
    contactPitchMin: 3,
    contactPitchMax: 5,
    contactYawMin: 2.5,
    contactYawMax: 4,
    spinMin: 9,
    spinMax: 16,
    slideDistanceMin: 30,
    slideDistanceMax: 38,
    slapDurationMinMs: 86,
    slapDurationMaxMs: 108,
    postContactDurationMinMs: 205,
    postContactDurationMaxMs: 235,
    pathBowMin: 38,
    pathBowMax: 56,
    launchDirectionJitterDegrees: 9,
    skidDirectionJitterDegrees: 5
  }),
  Object.freeze({
    name: 'quick-slip',
    speedMin: 0.88,
    speedMax: 0.98,
    releaseGapMinMs: 300,
    releaseGapMaxMs: 340,
    launchYOffset: -17,
    launchAirGapMin: 3,
    launchAirGapMax: 6,
    verticalImpulseMin: 28,
    verticalImpulseMax: 34,
    startPitchMin: 4,
    startPitchMax: 7,
    startYawMin: 8,
    startYawMax: 11,
    contactPitchMin: 1.5,
    contactPitchMax: 3,
    contactYawMin: 2.5,
    contactYawMax: 4,
    spinMin: 7,
    spinMax: 13,
    slideDistanceMin: 25,
    slideDistanceMax: 32,
    slapDurationMinMs: 60,
    slapDurationMaxMs: 78,
    postContactDurationMinMs: 165,
    postContactDurationMaxMs: 190,
    pathBowMin: 24,
    pathBowMax: 40,
    launchDirectionJitterDegrees: 7,
    skidDirectionJitterDegrees: 4
  }),
  Object.freeze({
    name: 'loose-follower',
    speedMin: 0.72,
    speedMax: 0.82,
    releaseGapMinMs: 55,
    releaseGapMaxMs: 82,
    launchYOffset: 22,
    launchAirGapMin: 14,
    launchAirGapMax: 18,
    verticalImpulseMin: 40,
    verticalImpulseMax: 48,
    startPitchMin: 6,
    startPitchMax: 9,
    startYawMin: 9,
    startYawMax: 12,
    contactPitchMin: 2.5,
    contactPitchMax: 4,
    contactYawMin: 2.5,
    contactYawMax: 4,
    spinMin: 7,
    spinMax: 13,
    slideDistanceMin: 21,
    slideDistanceMax: 28,
    slapDurationMinMs: 72,
    slapDurationMaxMs: 92,
    postContactDurationMinMs: 170,
    postContactDurationMaxMs: 200,
    pathBowMin: 34,
    pathBowMax: 52,
    launchDirectionJitterDegrees: 10,
    skidDirectionJitterDegrees: 5
  }),
  Object.freeze({
    name: 'soft-drop',
    speedMin: 0.58,
    speedMax: 0.68,
    releaseGapMinMs: 105,
    releaseGapMaxMs: 140,
    launchYOffset: 4,
    launchAirGapMin: 6,
    launchAirGapMax: 10,
    verticalImpulseMin: 7,
    verticalImpulseMax: 13,
    startPitchMin: 7,
    startPitchMax: 10,
    startYawMin: 6,
    startYawMax: 9,
    contactPitchMin: 3.5,
    contactPitchMax: 5.5,
    contactYawMin: 2,
    contactYawMax: 3.5,
    spinMin: 5,
    spinMax: 10,
    slideDistanceMin: 14,
    slideDistanceMax: 20,
    slapDurationMinMs: 92,
    slapDurationMaxMs: 118,
    postContactDurationMinMs: 145,
    postContactDurationMaxMs: 170,
    pathBowMin: 20,
    pathBowMax: 32,
    launchDirectionJitterDegrees: 6,
    skidDirectionJitterDegrees: 4
  })
]);

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

function easeOutQuadratic(progress) {
  const bounded = clamp(progress, 0, 1);
  return 1 - ((1 - bounded) * (1 - bounded));
}

function easeOutCubic(progress) {
  const bounded = clamp(progress, 0, 1);
  return 1 - Math.pow(1 - bounded, 3);
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

function randomSign(random) {
  return random() < 0.5 ? -1 : 1;
}

function rotateVector(vector, angle) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return {
    x: (vector.x * cosine) - (vector.y * sine),
    y: (vector.x * sine) + (vector.y * cosine)
  };
}

function normalizeVector(vector) {
  const length = Math.hypot(vector.x, vector.y);
  if (length <= 0.000001) {
    return {x: 1, y: 0};
  }
  return {
    x: vector.x / length,
    y: vector.y / length
  };
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

function faceDepthRange(width, height, rotationX, rotationY) {
  const cosineX = Math.cos(rotationX);
  const sineX = Math.sin(rotationX);
  const cosineY = Math.cos(rotationY);
  const sineY = Math.sin(rotationY);
  const centerDepth = CARD_FACE_OFFSET * cosineX * cosineY;
  const cornerSpan =
    ((width / 2) * Math.abs(cosineX * sineY)) +
    ((height / 2) * Math.abs(sineX));
  return {
    minimum: centerDepth - cornerSpan,
    maximum: centerDepth + cornerSpan
  };
}

function tiltClearance(width, height, rotationX, rotationY) {
  const range = faceDepthRange(width, height, rotationX, rotationY);
  return Math.max(0, CARD_FACE_OFFSET - range.minimum);
}

function conservativeLaunchHalfExtent(card, maximumDepth) {
  const halfDiagonal = Math.hypot(card.width, card.height) / 2;
  if (card.perspectiveDistance == null) {
    return halfDiagonal * 1.12;
  }
  const nearestPossibleDepth =
    card.perspectiveDistance - maximumDepth - halfDiagonal;
  if (nearestPossibleDepth <= 0) {
    throw new Error('A card-arrival launch crosses its perspective camera.');
  }
  return halfDiagonal * Math.max(
    1,
    card.perspectiveDistance / nearestPossibleDepth
  );
}

function createScatterOrder(cards) {
  const remaining = cards.map((card, index) => ({
    card,
    index
  })).sort((left, right) => (
    left.card.destination.x - right.card.destination.x ||
    left.index - right.index
  ));
  const order = [];
  if (remaining.length) {
    order.push(remaining.pop());
  }
  if (remaining.length) {
    order.push(remaining.splice(Math.floor(remaining.length / 2), 1)[0]);
  }
  while (remaining.length) {
    order.push(remaining.pop());
  }
  return order;
}

function gestureForReleaseIndex(releaseIndex) {
  return HUMAN_SCATTER_GESTURES[
    Math.min(releaseIndex, HUMAN_SCATTER_GESTURES.length - 1)
  ];
}

function buildReleaseTimes(count, batchSeed, profile) {
  const random = createSeededRandom(mixSeed(batchSeed, 'human-cadence'));
  const releaseTimes = [];
  let releaseAtMs = 0;
  for (let releaseIndex = 0; releaseIndex < count; releaseIndex += 1) {
    const gesture = gestureForReleaseIndex(releaseIndex);
    if (releaseIndex > 0) {
      const jitteredGap = Math.round(randomBetween(
        random,
        gesture.releaseGapMinMs,
        gesture.releaseGapMaxMs
      ));
      releaseAtMs += clamp(
        jitteredGap,
        profile.minimumReleaseGapMs,
        profile.maximumReleaseGapMs
      );
    }
    releaseTimes.push(releaseAtMs);
  }
  if (releaseAtMs > profile.maximumReleaseWindowMs) {
    throw new Error(
      `${profile.name} exceeded its ${profile.maximumReleaseWindowMs}ms release window.`
    );
  }
  return releaseTimes;
}

function createPlan(
  card,
  batchSeed,
  releaseIndex,
  fallbackIndex,
  batchPhysics,
  profile
) {
  const destination = card.destination;
  const gesture = gestureForReleaseIndex(releaseIndex);
  const cardSeed = mixSeed(
    batchSeed,
    profile.name,
    gesture.name,
    stableCardKey(card, fallbackIndex)
  );
  const random = createSeededRandom(cardSeed);
  const pitchSign = randomSign(random);
  const spinSign = releaseIndex % 2 === 0 ? 1 : -1;
  const contactRotationX =
    pitchSign *
    randomBetween(
      random,
      gesture.contactPitchMin,
      gesture.contactPitchMax
    ) *
    DEGREES_TO_RADIANS;
  const contactRotationY =
    randomBetween(
      random,
      gesture.contactYawMin,
      gesture.contactYawMax
    ) *
    DEGREES_TO_RADIANS;
  const contactRotationZ =
    randomBetween(random, -4.2, 4.2) *
    DEGREES_TO_RADIANS;
  const startRotationX =
    pitchSign *
    randomBetween(
      random,
      gesture.startPitchMin,
      gesture.startPitchMax
    ) *
    DEGREES_TO_RADIANS;
  const startRotationY =
    randomBetween(
      random,
      gesture.startYawMin,
      gesture.startYawMax
    ) *
    DEGREES_TO_RADIANS;
  const startRotationZ =
    contactRotationZ -
    (
      spinSign *
      randomBetween(random, gesture.spinMin, gesture.spinMax) *
      DEGREES_TO_RADIANS
    );
  const launchHalfExtent = conservativeLaunchHalfExtent(
    card,
    profile.maximumAirDepth
  );
  const launchAirGap = randomBetween(
    random,
    gesture.launchAirGapMin,
    gesture.launchAirGapMax
  );
  const start = {
    x: batchPhysics.launchX + randomBetween(random, -4, 4),
    y: clamp(
      batchPhysics.launchY +
        gesture.launchYOffset +
        randomBetween(random, -8, 8),
      card.height / 2,
      card.viewportHeight - (card.height / 2)
    ),
    depth:
      tiltClearance(
        card.width,
        card.height,
        startRotationX,
        startRotationY
      ) +
      launchAirGap,
    airGap: launchAirGap,
    rotationX: startRotationX,
    rotationY: startRotationY,
    rotationZ: startRotationZ
  };
  const directDirection = normalizeVector({
    x: destination.x - start.x,
    y: destination.y - start.y
  });
  const skidDirection = rotateVector(
    directDirection,
    randomBetween(
      random,
      -gesture.skidDirectionJitterDegrees,
      gesture.skidDirectionJitterDegrees
    ) * DEGREES_TO_RADIANS
  );
  const slideDistance = randomBetween(
    random,
    gesture.slideDistanceMin,
    gesture.slideDistanceMax
  );
  const contact = {
    x: destination.x - (skidDirection.x * slideDistance),
    y: destination.y - (skidDirection.y * slideDistance),
    depth: tiltClearance(
      card.width,
      card.height,
      contactRotationX,
      contactRotationY
    ),
    airGap: 0,
    rotationX: contactRotationX,
    rotationY: contactRotationY,
    rotationZ: contactRotationZ
  };
  const flightVector = {
    x: contact.x - start.x,
    y: contact.y - start.y
  };
  const flightDistance = Math.hypot(flightVector.x, flightVector.y);
  const sampledSpeed = randomBetween(
    random,
    gesture.speedMin,
    gesture.speedMax
  );
  const flightDurationMs = Math.round(clamp(
    flightDistance / sampledSpeed,
    profile.minimumFlightMs,
    profile.maximumFlightMs
  ));
  const slapDurationMs = Math.round(randomBetween(
    random,
    gesture.slapDurationMinMs,
    gesture.slapDurationMaxMs
  ));
  const postContactDurationMs = Math.round(randomBetween(
    random,
    gesture.postContactDurationMinMs,
    gesture.postContactDurationMaxMs
  ));
  const slideDurationMs = postContactDurationMs - slapDurationMs;
  const durationMs = flightDurationMs + postContactDurationMs;
  const delayMs = batchPhysics.releaseTimes[releaseIndex];
  const impactSpeed = (2 * slideDistance) / postContactDurationMs;
  const launchDirection = rotateVector(
    normalizeVector(flightVector),
    randomBetween(
      random,
      -gesture.launchDirectionJitterDegrees,
      gesture.launchDirectionJitterDegrees
    ) * DEGREES_TO_RADIANS
  );
  const averageFlightSpeed = flightDistance / flightDurationMs;
  const launchSpeed = averageFlightSpeed * randomBetween(random, 1.08, 1.24);
  const controlOneDistance = (launchSpeed * flightDurationMs) / 3;
  const controlTwoDistance = (impactSpeed * flightDurationMs) / 3;
  const pathNormal = {
    x: -directDirection.y,
    y: directDirection.x
  };
  const pathBow =
    (releaseIndex % 2 === 0 ? 1 : -1) *
    randomBetween(random, gesture.pathBowMin, gesture.pathBowMax);
  const verticalImpulse = randomBetween(
    random,
    gesture.verticalImpulseMin,
    gesture.verticalImpulseMax
  );
  const gravityPerProgressSquared =
    2 * (launchAirGap + verticalImpulse);
  const apexAtProgress = verticalImpulse / gravityPerProgressSquared;
  const apexAirGap =
    launchAirGap +
    (verticalImpulse * apexAtProgress) -
    (
      0.5 *
      gravityPerProgressSquared *
      apexAtProgress *
      apexAtProgress
    );
  const slapTravelProgress = easeOutQuadratic(
    slapDurationMs / postContactDurationMs
  );
  const slideStart = {
    x: interpolate(contact.x, destination.x, slapTravelProgress),
    y: interpolate(contact.y, destination.y, slapTravelProgress)
  };

  return {
    cardIndex: card.index,
    key: stableCardKey(card, fallbackIndex),
    seed: cardSeed,
    orderIndex: releaseIndex,
    releaseIndex,
    motionVariant: gesture.name,
    delayMs,
    releaseAtMs: delayMs,
    contactAtMs: delayMs + flightDurationMs,
    flatAtMs: delayMs + flightDurationMs + slapDurationMs,
    settleAtMs: delayMs + durationMs,
    flightDurationMs,
    slapDurationMs,
    slideDurationMs,
    postContactDurationMs,
    durationMs,
    totalDurationMs: delayMs + durationMs,
    profile: profile.name,
    card: {
      width: card.width,
      height: card.height,
      perspectiveDistance: card.perspectiveDistance == null
        ? null
        : card.perspectiveDistance,
      maximumVertexPerspectiveScale:
        profile.maximumVertexPerspectiveScale
    },
    destination: {
      x: destination.x,
      y: destination.y,
      z: destination.z
    },
    launchHalfExtent,
    start,
    contact,
    slideStart,
    direction: {
      x: skidDirection.x,
      y: skidDirection.y
    },
    path: {
      controlOne: {
        x:
          start.x +
          (launchDirection.x * controlOneDistance) +
          (pathNormal.x * pathBow),
        y:
          start.y +
          (launchDirection.y * controlOneDistance) +
          (pathNormal.y * pathBow)
      },
      controlTwo: {
        x:
          contact.x -
          (skidDirection.x * controlTwoDistance),
        y:
          contact.y -
          (skidDirection.y * controlTwoDistance)
      },
      launchVelocity: {
        x: launchDirection.x * launchSpeed,
        y: launchDirection.y * launchSpeed,
        depth: verticalImpulse / flightDurationMs
      },
      impactVelocity: {
        x: skidDirection.x * impactSpeed,
        y: skidDirection.y * impactSpeed,
        depth:
          (
            verticalImpulse -
            gravityPerProgressSquared
          ) / flightDurationMs
      },
      gravity:
        gravityPerProgressSquared /
        (flightDurationMs * flightDurationMs),
      verticalImpulse,
      apexAtProgress,
      apexAirGap,
      bow: pathBow,
      slideDistance
    }
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
  const batchRandom = createSeededRandom(mixSeed(batchSeed, 'hand-packet'));
  const scatterOrder = createScatterOrder(cards);
  const orderByIndex = new Map();
  scatterOrder.forEach((ranked, releaseIndex) => {
    orderByIndex.set(ranked.index, releaseIndex);
  });
  const releaseTimes = buildReleaseTimes(
    cards.length,
    batchSeed,
    profile
  );
  const averageDestinationY = cards.length
    ? cards.reduce((total, card) => total + card.destination.y, 0) / cards.length
    : 0;
  const maximumLaunchHalfExtent = cards.reduce((maximum, card) => (
    Math.max(
      maximum,
      conservativeLaunchHalfExtent(card, profile.maximumAirDepth)
    )
  ), 0);
  const batchPhysics = {
    releaseTimes,
    launchX:
      -maximumLaunchHalfExtent -
      randomBetween(batchRandom, 36, 44),
    launchY:
      averageDestinationY +
      randomBetween(batchRandom, -24, 24)
  };
  const plans = cards.map((card, index) => createPlan(
    card,
    batchSeed,
    orderByIndex.get(index),
    index,
    batchPhysics,
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
    originPolicy: profile.originPolicy,
    placementOrder: profile.placementOrder,
    collisionPolicy: profile.collisionPolicy,
    releaseTimes: releaseTimes.slice(0),
    releaseWindowMs: releaseTimes.length
      ? releaseTimes[releaseTimes.length - 1]
      : 0,
    seed: batchSeed,
    requestedSeed: String(requestedSeed),
    maxBatchDurationMs: profile.maxBatchDurationMs,
    totalDurationMs,
    plans
  };
}

function createPose(plan, phase, progress, values) {
  const depthRange = faceDepthRange(
    plan.card.width,
    plan.card.height,
    values.rotationX,
    values.rotationY
  );
  const requiredClearance = Math.max(
    0,
    CARD_FACE_OFFSET - depthRange.minimum
  );
  let depth = Math.max(
    requiredClearance,
    requiredClearance + Math.max(0, values.airGap)
  );
  if (plan.card.perspectiveDistance !== null) {
    const maximumRenderedDepth =
      plan.card.perspectiveDistance *
      (1 - (1 / plan.card.maximumVertexPerspectiveScale));
    depth = Math.min(
      depth,
      maximumRenderedDepth -
        plan.destination.z -
        depthRange.maximum
    );
    if (depth + 0.000001 < requiredClearance) {
      throw new Error(
        'A card-arrival tilt exceeds its perspective-scale clearance.'
      );
    }
  }
  const airGap = Math.max(0, depth - requiredClearance);
  return {
    complete: false,
    phase,
    progress,
    screenX: values.screenX,
    screenY: values.screenY,
    depth,
    z: plan.destination.z + depth,
    airGap,
    tableClearance: airGap,
    nearestVertexDepth:
      plan.destination.z + depth + depthRange.maximum,
    farthestVertexDepth:
      plan.destination.z + depth + depthRange.minimum,
    rotationX: values.rotationX,
    rotationY: values.rotationY,
    rotationZ: values.rotationZ
  };
}

export function sampleCardArrival(plan, elapsedMs) {
  const elapsed = Math.max(0, elapsedMs);
  const localElapsed = elapsed - plan.delayMs;
  const destination = plan.destination;

  if (localElapsed <= 0) {
    return createPose(plan, 'waiting', 0, {
      screenX: plan.start.x,
      screenY: plan.start.y,
      airGap: plan.start.airGap,
      rotationX: plan.start.rotationX,
      rotationY: plan.start.rotationY,
      rotationZ: plan.start.rotationZ
    });
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
      airGap: 0,
      tableClearance: 0,
      nearestVertexDepth: destination.z + CARD_FACE_OFFSET,
      farthestVertexDepth: destination.z + CARD_FACE_OFFSET,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0
    };
  }

  if (localElapsed < plan.flightDurationMs) {
    const progress = localElapsed / plan.flightDurationMs;
    const airGap = Math.max(
      0,
      plan.start.airGap +
        (plan.path.verticalImpulse * progress) -
        (
          0.5 *
          plan.path.gravity *
          plan.flightDurationMs *
          plan.flightDurationMs *
          progress *
          progress
        )
    );

    return createPose(plan, 'flight', progress, {
      screenX: cubicBezier(
        plan.start.x,
        plan.path.controlOne.x,
        plan.path.controlTwo.x,
        plan.contact.x,
        progress
      ),
      screenY: cubicBezier(
        plan.start.y,
        plan.path.controlOne.y,
        plan.path.controlTwo.y,
        plan.contact.y,
        progress
      ),
      airGap,
      rotationX: interpolate(
        plan.start.rotationX,
        plan.contact.rotationX,
        progress
      ),
      rotationY: interpolate(
        plan.start.rotationY,
        plan.contact.rotationY,
        progress
      ),
      rotationZ: interpolate(
        plan.start.rotationZ,
        plan.contact.rotationZ,
        progress
      )
    });
  }

  const afterFlight = localElapsed - plan.flightDurationMs;
  const postContactProgress =
    afterFlight / plan.postContactDurationMs;
  const frictionProgress = easeOutQuadratic(postContactProgress);
  const postContactScreenX = interpolate(
    plan.contact.x,
    destination.x,
    frictionProgress
  );
  const postContactScreenY = interpolate(
    plan.contact.y,
    destination.y,
    frictionProgress
  );
  const rotationZ = interpolate(
    plan.contact.rotationZ,
    0,
    frictionProgress
  );

  if (afterFlight < plan.slapDurationMs) {
    const progress = afterFlight / plan.slapDurationMs;
    const flattenProgress = easeOutCubic(progress);
    return createPose(plan, 'slap', progress, {
      screenX: postContactScreenX,
      screenY: postContactScreenY,
      airGap: 0,
      rotationX: interpolate(
        plan.contact.rotationX,
        0,
        flattenProgress
      ),
      rotationY: interpolate(
        plan.contact.rotationY,
        0,
        flattenProgress
      ),
      rotationZ
    });
  }

  const slideProgress =
    (afterFlight - plan.slapDurationMs) /
    plan.slideDurationMs;

  return createPose(plan, 'slide', slideProgress, {
    screenX: postContactScreenX,
    screenY: postContactScreenY,
    airGap: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ
  });
}
