const DEGREES_TO_RADIANS = Math.PI / 180;
const CARD_FACE_OFFSET = 1.7;

export const CASUAL_DROP_LEFT_PROFILE = Object.freeze({
  name: 'casual-drop-left',
  originEdge: 'left',
  minimumReleaseGapMs: 275,
  maximumReleaseGapMs: 280,
  flightSpeedMin: 0.78,
  flightSpeedMax: 0.84,
  minimumFlightMs: 500,
  maximumFlightMs: 980,
  slapDurationMinMs: 88,
  slapDurationRangeMs: 14,
  slideDurationMinMs: 205,
  slideDurationRangeMs: 25,
  maximumAirDepth: 52,
  maximumVertexPerspectiveScale: 1.1,
  maxBatchDurationMs: 1950
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

function easeInOutCubic(progress) {
  const bounded = clamp(progress, 0, 1);
  return bounded < 0.5
    ? 4 * bounded * bounded * bounded
    : 1 - Math.pow(-2 * bounded + 2, 3) / 2;
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
  const range = faceDepthRange(
    width,
    height,
    rotationX,
    rotationY
  );
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

function createPlan(
  card,
  batchSeed,
  orderIndex,
  fallbackIndex,
  batchPhysics,
  profile
) {
  const destination = card.destination;
  const cardSeed = mixSeed(
    batchSeed,
    profile.name,
    stableCardKey(card, fallbackIndex)
  );
  const random = createSeededRandom(cardSeed);
  const startRotationX =
    randomSign(random) *
    randomBetween(random, 8, 11) *
    DEGREES_TO_RADIANS;
  const startRotationY =
    -randomBetween(random, 12, 17) *
    DEGREES_TO_RADIANS;
  const startRotationZ =
    randomBetween(random, -12, 12) *
    DEGREES_TO_RADIANS;
  const contactRotationX =
    Math.sign(startRotationX) *
    randomBetween(random, 5, 7) *
    DEGREES_TO_RADIANS;
  const contactRotationY =
    -randomBetween(random, 2, 4) *
    DEGREES_TO_RADIANS;
  const contactRotationZ =
    startRotationZ * randomBetween(random, 0.28, 0.42);
  const launchHalfExtent = conservativeLaunchHalfExtent(
    card,
    profile.maximumAirDepth
  );
  const start = {
    x: batchPhysics.launchX,
    y: clamp(
      batchPhysics.launchY + randomBetween(random, -10, 10),
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
      randomBetween(random, 4, 6),
    rotationX: startRotationX,
    rotationY: startRotationY,
    rotationZ: startRotationZ
  };
  const destinationVector = {
    x: destination.x - start.x,
    y: destination.y - start.y
  };
  const destinationDistance = Math.hypot(
    destinationVector.x,
    destinationVector.y
  );
  const direction = {
    x: destinationVector.x / destinationDistance,
    y: destinationVector.y / destinationDistance
  };
  const slideDistance = randomBetween(random, 27, 36);
  const contact = {
    x: destination.x - (direction.x * slideDistance),
    y: destination.y - (direction.y * slideDistance),
    depth:
      tiltClearance(
        card.width,
        card.height,
        contactRotationX,
        contactRotationY
      ),
    rotationX: contactRotationX,
    rotationY: contactRotationY,
    rotationZ: contactRotationZ
  };
  const flightVector = {
    x: contact.x - start.x,
    y: contact.y - start.y
  };
  const flightDistance = Math.hypot(flightVector.x, flightVector.y);
  const pathBow = randomBetween(random, -20, 20);
  const flightDurationMs = Math.round(clamp(
    flightDistance / batchPhysics.flightSpeed,
    profile.minimumFlightMs,
    profile.maximumFlightMs
  ));
  const slapDurationMs = Math.round(
    profile.slapDurationMinMs +
    randomBetween(random, 0, profile.slapDurationRangeMs)
  );
  const slideDurationMs = Math.round(
    profile.slideDurationMinMs +
    randomBetween(random, 0, profile.slideDurationRangeMs)
  );
  const durationMs =
    flightDurationMs +
    slapDurationMs +
    slideDurationMs;
  const postContactDurationMs = slapDurationMs + slideDurationMs;
  const slapTravelProgress = easeOutCubic(
    slapDurationMs / postContactDurationMs
  );
  const slideStart = {
    x: interpolate(
      contact.x,
      destination.x,
      slapTravelProgress
    ),
    y: interpolate(
      contact.y,
      destination.y,
      slapTravelProgress
    )
  };
  const delayMs = batchPhysics.releaseTimes[orderIndex];
  const linearMidDepth = (start.depth + contact.depth) / 2;
  const apexDepth = Math.min(
    profile.maximumAirDepth,
    Math.max(
      linearMidDepth + randomBetween(random, 13, 20),
      start.depth + randomBetween(random, 8, 14)
    )
  );

  return {
    cardIndex: card.index,
    key: stableCardKey(card, fallbackIndex),
    seed: cardSeed,
    orderIndex,
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
    direction,
    path: {
      controlOne: {
        x: start.x + (flightVector.x / 3),
        y: start.y + (flightVector.y / 3) + pathBow
      },
      controlTwo: {
        x: start.x + ((flightVector.x * 2) / 3),
        y: start.y + ((flightVector.y * 2) / 3) + pathBow
      },
      bow: pathBow,
      apexDepth
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
  const batchRandom = createSeededRandom(mixSeed(batchSeed, 'batch-physics'));
  const flightSpeed = randomBetween(
    batchRandom,
    profile.flightSpeedMin,
    profile.flightSpeedMax
  );
  const farthestFirst = cards.map((card, index) => ({
    card,
    index
  })).sort((left, right) => (
    right.card.destination.x - left.card.destination.x ||
    left.index - right.index
  ));
  const orderByIndex = new Map();
  farthestFirst.forEach((ranked, orderIndex) => {
    orderByIndex.set(ranked.index, orderIndex);
  });
  const maximumDiagonal = cards.reduce((maximum, card) => (
    Math.max(maximum, Math.hypot(card.width, card.height))
  ), 0);
  const geometryReleaseGap = Math.ceil(
    (maximumDiagonal + 10) / flightSpeed
  );
  const minimumReleaseGap = Math.max(
    profile.minimumReleaseGapMs,
    geometryReleaseGap
  );
  const releaseTimes = [0];
  for (let orderIndex = 1; orderIndex < cards.length; orderIndex += 1) {
    releaseTimes.push(
      releaseTimes[orderIndex - 1] +
      Math.round(randomBetween(
        batchRandom,
        minimumReleaseGap,
        Math.max(minimumReleaseGap, profile.maximumReleaseGapMs)
      ))
    );
  }
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
    flightSpeed,
    releaseTimes,
    launchX:
      -maximumLaunchHalfExtent -
      randomBetween(batchRandom, 34, 42),
    launchY: averageDestinationY + randomBetween(batchRandom, -34, 34)
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
    placementOrder: 'farthest-first',
    collisionPolicy: 'spatial-order-and-release-separation',
    flightSpeed,
    releaseTimes: releaseTimes.slice(0),
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
  let depth = Math.max(values.depth, requiredClearance);
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
  return {
    complete: false,
    phase,
    progress,
    screenX: values.screenX,
    screenY: values.screenY,
    depth,
    z: plan.destination.z + depth,
    airGap: Math.max(0, depth - requiredClearance),
    tableClearance: Math.max(0, depth - requiredClearance),
    nearestVertexDepth:
      plan.destination.z + depth + depthRange.maximum,
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
      depth: plan.start.depth,
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
      nearestVertexDepth:
        destination.z + CARD_FACE_OFFSET,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0
    };
  }

  if (localElapsed < plan.flightDurationMs) {
    const progress = localElapsed / plan.flightDurationMs;
    const baselineDepth = interpolate(
      plan.start.depth,
      plan.contact.depth,
      progress
    );
    const midlineDepth = (plan.start.depth + plan.contact.depth) / 2;
    const arcDepth =
      Math.max(0, plan.path.apexDepth - midlineDepth) *
      4 *
      progress *
      (1 - progress);

    return createPose(plan, 'flight', progress, {
      screenX: interpolate(plan.start.x, plan.contact.x, progress),
      screenY: cubicBezier(
        plan.start.y,
        plan.path.controlOne.y,
        plan.path.controlTwo.y,
        plan.contact.y,
        progress
      ),
      depth: baselineDepth + arcDepth,
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
  const frictionProgress = easeOutCubic(postContactProgress);
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
  if (afterFlight < plan.slapDurationMs) {
    const progress = afterFlight / plan.slapDurationMs;
    const flattenProgress = easeInOutCubic(progress);
    const rotationX = interpolate(
      plan.contact.rotationX,
      0,
      flattenProgress
    );
    const rotationY = interpolate(
      plan.contact.rotationY,
      0,
      flattenProgress
    );
    const requiredClearance = tiltClearance(
      plan.card.width,
      plan.card.height,
      rotationX,
      rotationY
    );

    return createPose(plan, 'slap', progress, {
      screenX: postContactScreenX,
      screenY: postContactScreenY,
      depth: requiredClearance,
      rotationX,
      rotationY,
      rotationZ: interpolate(
        plan.contact.rotationZ,
        0,
        flattenProgress
      )
    });
  }

  const slideProgress =
    (afterFlight - plan.slapDurationMs) /
    plan.slideDurationMs;

  return createPose(plan, 'slide', slideProgress, {
    screenX: postContactScreenX,
    screenY: postContactScreenY,
    depth: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0
  });
}
