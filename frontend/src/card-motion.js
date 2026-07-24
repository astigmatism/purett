export const CARD_MOTION_SCHEMA_VERSION = 1;

const DEGREES_TO_RADIANS = Math.PI / 180;
const FULL_TURN_DEGREES = 360;
const PLAN_KIND = 'purett-card-motion-plan';

const PATH_KEYS = Object.freeze([
  'directionDeg',
  'distancePx',
  'curvePx',
  'landingXPx',
  'landingYPx',
  'releaseHeight',
  'apexHeight',
  'flightMs'
]);
const ROTATION_KEYS = Object.freeze([
  'releasePitchDeg',
  'releaseYawDeg',
  'releaseRollDeg',
  'contactPitchDeg',
  'contactYawDeg',
  'contactRollDeg',
  'xTurns',
  'yTurns',
  'zTurns',
  'finalRollDeg'
]);
const LANDING_KEYS = Object.freeze([
  'skidDistancePx',
  'skidAngleDeg',
  'slapMs',
  'skidMs'
]);
const SCALE_KEYS = Object.freeze([
  'mode',
  'cardScale',
  'start',
  'apex',
  'contact',
  'end'
]);
const SHADOW_KEYS = Object.freeze([
  'strength',
  'spread'
]);
const ROOT_KEYS = Object.freeze([
  'schemaVersion',
  'id',
  'label',
  'path',
  'rotation',
  'landing',
  'scale',
  'shadow'
]);

export const CARD_MOTION_LIMITS = deepFreeze({
  path: {
    directionDeg: {minimum: -180, maximum: 180},
    distancePx: {minimum: 0, maximum: 2000},
    curvePx: {minimum: -1000, maximum: 1000},
    landingXPx: {minimum: -1000, maximum: 1000},
    landingYPx: {minimum: -1000, maximum: 1000},
    releaseHeight: {minimum: 0, maximum: 800},
    apexHeight: {minimum: 0, maximum: 1000},
    flightMs: {minimum: 100, maximum: 5000}
  },
  rotation: {
    releasePitchDeg: {minimum: -360, maximum: 360},
    releaseYawDeg: {minimum: -360, maximum: 360},
    releaseRollDeg: {minimum: -360, maximum: 360},
    contactPitchDeg: {minimum: -360, maximum: 360},
    contactYawDeg: {minimum: -360, maximum: 360},
    contactRollDeg: {minimum: -360, maximum: 360},
    xTurns: {minimum: -5, maximum: 5},
    yTurns: {minimum: -5, maximum: 5},
    zTurns: {minimum: -5, maximum: 5},
    finalRollDeg: {minimum: -180, maximum: 180}
  },
  landing: {
    skidDistancePx: {minimum: 0, maximum: 500},
    skidAngleDeg: {minimum: -180, maximum: 180},
    slapMs: {minimum: 0, maximum: 1500},
    skidMs: {minimum: 0, maximum: 3000}
  },
  scale: {
    cardScale: {minimum: 0.1, maximum: 4},
    start: {minimum: 0.1, maximum: 4},
    apex: {minimum: 0.1, maximum: 4},
    contact: {minimum: 0.1, maximum: 4},
    end: {minimum: 0.1, maximum: 4}
  },
  shadow: {
    strength: {minimum: 0, maximum: 1},
    spread: {minimum: 0.1, maximum: 5}
  },
  instance: {
    destination: {minimum: -1000000, maximum: 1000000},
    delayMs: {minimum: 0, maximum: 10000},
    speed: {minimum: 0.1, maximum: 4},
    startOffsetXY: {minimum: -5000, maximum: 5000},
    startOffsetZ: {minimum: -800, maximum: 800},
    rotationOffset: {minimum: -360, maximum: 360}
  }
});

export const CARD_MOTION_AUTHORING_LIMITS = deepFreeze({
  path: {
    directionDeg: {minimum: -180, maximum: 180},
    distancePx: {minimum: 0, maximum: 1000},
    curvePx: {minimum: -300, maximum: 300},
    landingXPx: {minimum: -300, maximum: 300},
    landingYPx: {minimum: -220, maximum: 220},
    releaseHeight: {minimum: 0, maximum: 300},
    apexHeight: {minimum: 0, maximum: 400},
    flightMs: {minimum: 200, maximum: 2500}
  },
  rotation: {
    releasePitchDeg: {minimum: -75, maximum: 75},
    releaseYawDeg: {minimum: -75, maximum: 75},
    releaseRollDeg: {minimum: -180, maximum: 180},
    contactPitchDeg: {minimum: -45, maximum: 45},
    contactYawDeg: {minimum: -45, maximum: 45},
    contactRollDeg: {minimum: -180, maximum: 180},
    xTurns: {minimum: -3, maximum: 3},
    yTurns: {minimum: -3, maximum: 3},
    zTurns: {minimum: -2, maximum: 2},
    finalRollDeg: {minimum: -30, maximum: 30}
  },
  landing: {
    skidDistancePx: {minimum: 0, maximum: 200},
    skidAngleDeg: {minimum: -180, maximum: 180},
    slapMs: {minimum: 0, maximum: 400},
    skidMs: {minimum: 0, maximum: 1000}
  },
  scale: {
    cardScale: {minimum: 0.5, maximum: 2},
    start: {minimum: 0.5, maximum: 2},
    apex: {minimum: 0.5, maximum: 2},
    contact: {minimum: 0.5, maximum: 2},
    end: {minimum: 0.5, maximum: 2}
  },
  shadow: {
    strength: {minimum: 0, maximum: 1},
    spread: {minimum: 0.5, maximum: 2}
  }
});

export const CARD_MOTION_CONTROLS = deepFreeze({
  path: PATH_KEYS.slice(0),
  rotation: ROTATION_KEYS.slice(0),
  landing: LANDING_KEYS.slice(0),
  scale: SCALE_KEYS.slice(0),
  shadow: SHADOW_KEYS.slice(0),
  scaleModes: ['perspective', 'keyframed'],
  coordinatePolicy:
    'screen-space destination-relative; positive x is right, positive y is down',
  directionPolicy:
    'directionDeg points from the release point toward the settled destination',
  scalePolicy:
    'perspective preserves cardScale and delegates apparent size to camera depth; keyframed multiplies cardScale by the authored scale curve'
});

const GENTLE_DROP_SOURCE = {
  schemaVersion: CARD_MOTION_SCHEMA_VERSION,
  id: 'gentle-drop',
  label: 'Gentle Drop',
  path: {
    directionDeg: 10,
    distancePx: 255,
    curvePx: 24,
    landingXPx: 0,
    landingYPx: 0,
    releaseHeight: 130,
    apexHeight: 170,
    flightMs: 920
  },
  rotation: {
    releasePitchDeg: 22,
    releaseYawDeg: -7,
    releaseRollDeg: -11,
    contactPitchDeg: 7,
    contactYawDeg: 2,
    contactRollDeg: 3,
    xTurns: 0,
    yTurns: 0,
    zTurns: 0.04,
    finalRollDeg: 0
  },
  landing: {
    skidDistancePx: 18,
    skidAngleDeg: -4,
    slapMs: 115,
    skidMs: 220
  },
  scale: {
    mode: 'perspective',
    cardScale: 1,
    start: 1,
    apex: 1,
    contact: 1,
    end: 1
  },
  shadow: {
    strength: 0.32,
    spread: 1
  }
};

const CASUAL_TOSS_SOURCE = {
  schemaVersion: CARD_MOTION_SCHEMA_VERSION,
  id: 'casual-toss',
  label: 'Casual Toss',
  path: {
    directionDeg: 4,
    distancePx: 390,
    curvePx: 62,
    landingXPx: 0,
    landingYPx: 0,
    releaseHeight: 185,
    apexHeight: 275,
    flightMs: 820
  },
  rotation: {
    releasePitchDeg: 30,
    releaseYawDeg: -11,
    releaseRollDeg: -18,
    contactPitchDeg: 10,
    contactYawDeg: 4,
    contactRollDeg: 5,
    xTurns: 0.5,
    yTurns: 0,
    zTurns: 0.18,
    finalRollDeg: 0
  },
  landing: {
    skidDistancePx: 34,
    skidAngleDeg: 4,
    slapMs: 95,
    skidMs: 230
  },
  scale: {
    mode: 'perspective',
    cardScale: 1,
    start: 1,
    apex: 1,
    contact: 1,
    end: 1
  },
  shadow: {
    strength: 0.38,
    spread: 1.1
  }
};

const ENERGETIC_SCATTER_SOURCE = {
  schemaVersion: CARD_MOTION_SCHEMA_VERSION,
  id: 'energetic-scatter',
  label: 'Energetic Scatter',
  path: {
    directionDeg: -12,
    distancePx: 520,
    curvePx: -105,
    landingXPx: 0,
    landingYPx: 0,
    releaseHeight: 235,
    apexHeight: 390,
    flightMs: 670
  },
  rotation: {
    releasePitchDeg: 38,
    releaseYawDeg: 14,
    releaseRollDeg: 24,
    contactPitchDeg: 12,
    contactYawDeg: -5,
    contactRollDeg: -7,
    xTurns: 1,
    yTurns: 0.25,
    zTurns: -0.45,
    finalRollDeg: 0
  },
  landing: {
    skidDistancePx: 58,
    skidAngleDeg: -8,
    slapMs: 72,
    skidMs: 245
  },
  scale: {
    mode: 'keyframed',
    cardScale: 1,
    start: 0.86,
    apex: 1.14,
    contact: 1.03,
    end: 1
  },
  shadow: {
    strength: 0.44,
    spread: 1.25
  }
};

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }
  Object.keys(value).forEach((key) => deepFreeze(value[key]));
  return Object.freeze(value);
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function normalizeAngle(value) {
  const wrapped = ((value + 180) % 360 + 360) % 360 - 180;
  return Object.is(wrapped, -0) ? 0 : wrapped;
}

function boundedNumber(value, fallback, bounds) {
  const converted = typeof value === 'string' && value.trim() !== ''
    ? Number(value)
    : value;
  const finite = typeof converted === 'number' && Number.isFinite(converted)
    ? converted
    : fallback;
  return clamp(finite, bounds.minimum, bounds.maximum);
}

function boundedAngle(value, fallback) {
  const converted = typeof value === 'string' && value.trim() !== ''
    ? Number(value)
    : value;
  return normalizeAngle(
    typeof converted === 'number' && Number.isFinite(converted)
      ? converted
      : fallback
  );
}

function normalizeIdentifier(value, fallback) {
  const normalized = String(value == null ? fallback : value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return normalized || fallback;
}

function normalizeLabel(value, fallback) {
  const normalized = String(value == null ? fallback : value)
    .trim()
    .slice(0, 100);
  return normalized || fallback;
}

function sourceGroup(raw, groupName) {
  return isRecord(raw) && isRecord(raw[groupName]) ? raw[groupName] : {};
}

function normalizePresetInternal(raw) {
  const source = isRecord(raw) ? raw : {};
  if (source.schemaVersion != null &&
      Number(source.schemaVersion) !== CARD_MOTION_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported card-motion schema version "${source.schemaVersion}".`
    );
  }

  const defaults = CASUAL_TOSS_SOURCE;
  const path = sourceGroup(source, 'path');
  const rotation = sourceGroup(source, 'rotation');
  const landing = sourceGroup(source, 'landing');
  const scale = sourceGroup(source, 'scale');
  const shadow = sourceGroup(source, 'shadow');
  const normalizedReleaseHeight = boundedNumber(
    path.releaseHeight,
    defaults.path.releaseHeight,
    CARD_MOTION_LIMITS.path.releaseHeight
  );
  const normalizedApexHeight = Math.max(
    normalizedReleaseHeight,
    boundedNumber(
      path.apexHeight,
      defaults.path.apexHeight,
      CARD_MOTION_LIMITS.path.apexHeight
    )
  );
  const scaleMode = scale.mode === 'keyframed' ||
      scale.mode === 'perspective'
    ? scale.mode
    : defaults.scale.mode;

  return {
    schemaVersion: CARD_MOTION_SCHEMA_VERSION,
    id: normalizeIdentifier(source.id, defaults.id),
    label: normalizeLabel(source.label, defaults.label),
    path: {
      directionDeg: boundedAngle(
        path.directionDeg,
        defaults.path.directionDeg
      ),
      distancePx: boundedNumber(
        path.distancePx,
        defaults.path.distancePx,
        CARD_MOTION_LIMITS.path.distancePx
      ),
      curvePx: boundedNumber(
        path.curvePx,
        defaults.path.curvePx,
        CARD_MOTION_LIMITS.path.curvePx
      ),
      landingXPx: boundedNumber(
        path.landingXPx,
        defaults.path.landingXPx,
        CARD_MOTION_LIMITS.path.landingXPx
      ),
      landingYPx: boundedNumber(
        path.landingYPx,
        defaults.path.landingYPx,
        CARD_MOTION_LIMITS.path.landingYPx
      ),
      releaseHeight: normalizedReleaseHeight,
      apexHeight: normalizedApexHeight,
      flightMs: boundedNumber(
        path.flightMs,
        defaults.path.flightMs,
        CARD_MOTION_LIMITS.path.flightMs
      )
    },
    rotation: {
      releasePitchDeg: boundedNumber(
        rotation.releasePitchDeg,
        defaults.rotation.releasePitchDeg,
        CARD_MOTION_LIMITS.rotation.releasePitchDeg
      ),
      releaseYawDeg: boundedNumber(
        rotation.releaseYawDeg,
        defaults.rotation.releaseYawDeg,
        CARD_MOTION_LIMITS.rotation.releaseYawDeg
      ),
      releaseRollDeg: boundedNumber(
        rotation.releaseRollDeg,
        defaults.rotation.releaseRollDeg,
        CARD_MOTION_LIMITS.rotation.releaseRollDeg
      ),
      contactPitchDeg: boundedNumber(
        rotation.contactPitchDeg,
        defaults.rotation.contactPitchDeg,
        CARD_MOTION_LIMITS.rotation.contactPitchDeg
      ),
      contactYawDeg: boundedNumber(
        rotation.contactYawDeg,
        defaults.rotation.contactYawDeg,
        CARD_MOTION_LIMITS.rotation.contactYawDeg
      ),
      contactRollDeg: boundedNumber(
        rotation.contactRollDeg,
        defaults.rotation.contactRollDeg,
        CARD_MOTION_LIMITS.rotation.contactRollDeg
      ),
      xTurns: boundedNumber(
        rotation.xTurns,
        defaults.rotation.xTurns,
        CARD_MOTION_LIMITS.rotation.xTurns
      ),
      yTurns: boundedNumber(
        rotation.yTurns,
        defaults.rotation.yTurns,
        CARD_MOTION_LIMITS.rotation.yTurns
      ),
      zTurns: boundedNumber(
        rotation.zTurns,
        defaults.rotation.zTurns,
        CARD_MOTION_LIMITS.rotation.zTurns
      ),
      finalRollDeg: boundedAngle(
        rotation.finalRollDeg,
        defaults.rotation.finalRollDeg
      )
    },
    landing: {
      skidDistancePx: boundedNumber(
        landing.skidDistancePx,
        defaults.landing.skidDistancePx,
        CARD_MOTION_LIMITS.landing.skidDistancePx
      ),
      skidAngleDeg: boundedAngle(
        landing.skidAngleDeg,
        defaults.landing.skidAngleDeg
      ),
      slapMs: boundedNumber(
        landing.slapMs,
        defaults.landing.slapMs,
        CARD_MOTION_LIMITS.landing.slapMs
      ),
      skidMs: boundedNumber(
        landing.skidMs,
        defaults.landing.skidMs,
        CARD_MOTION_LIMITS.landing.skidMs
      )
    },
    scale: {
      mode: scaleMode,
      cardScale: boundedNumber(
        scale.cardScale,
        defaults.scale.cardScale,
        CARD_MOTION_LIMITS.scale.cardScale
      ),
      start: boundedNumber(
        scale.start,
        defaults.scale.start,
        CARD_MOTION_LIMITS.scale.start
      ),
      apex: boundedNumber(
        scale.apex,
        defaults.scale.apex,
        CARD_MOTION_LIMITS.scale.apex
      ),
      contact: boundedNumber(
        scale.contact,
        defaults.scale.contact,
        CARD_MOTION_LIMITS.scale.contact
      ),
      end: boundedNumber(
        scale.end,
        defaults.scale.end,
        CARD_MOTION_LIMITS.scale.end
      )
    },
    shadow: {
      strength: boundedNumber(
        shadow.strength,
        defaults.shadow.strength,
        CARD_MOTION_LIMITS.shadow.strength
      ),
      spread: boundedNumber(
        shadow.spread,
        defaults.shadow.spread,
        CARD_MOTION_LIMITS.shadow.spread
      )
    }
  };
}

export function normalizeCardMotionPreset(raw) {
  return deepFreeze(normalizePresetInternal(raw));
}

function assertAuthoringLimits(preset) {
  Object.keys(CARD_MOTION_AUTHORING_LIMITS).forEach((section) => {
    const limits = CARD_MOTION_AUTHORING_LIMITS[section];
    Object.keys(limits).forEach((field) => {
      const value = preset[section][field];
      const bounds = limits[field];
      if (!Number.isFinite(value) ||
          value < bounds.minimum ||
          value > bounds.maximum) {
        throw new RangeError(
          `Motion Studio ${section}.${field} must be between ` +
          `${bounds.minimum} and ${bounds.maximum}.`
        );
      }
    });
  });
}

export function normalizeCardMotionAuthoringPreset(raw) {
  const normalized = normalizeCardMotionPreset(raw);
  assertAuthoringLimits(normalized);
  return normalized;
}

export const GENTLE_DROP_PRESET = deepFreeze(
  normalizePresetInternal(GENTLE_DROP_SOURCE)
);
export const CASUAL_TOSS_PRESET = deepFreeze(
  normalizePresetInternal(CASUAL_TOSS_SOURCE)
);
export const ENERGETIC_SCATTER_PRESET = deepFreeze(
  normalizePresetInternal(ENERGETIC_SCATTER_SOURCE)
);

export const CARD_MOTION_PRESETS = deepFreeze({
  gentleDrop: GENTLE_DROP_PRESET,
  casualToss: CASUAL_TOSS_PRESET,
  energeticScatter: ENERGETIC_SCATTER_PRESET
});

function normalizePoint(raw, fallback, bounds) {
  const source = isRecord(raw) ? raw : {};
  return {
    x: boundedNumber(source.x, fallback.x, bounds.x),
    y: boundedNumber(source.y, fallback.y, bounds.y),
    z: boundedNumber(source.z, fallback.z, bounds.z)
  };
}

function normalizeInstance(raw) {
  const source = isRecord(raw) ? raw : {};
  const destinationLimit = CARD_MOTION_LIMITS.instance.destination;
  const offsetXYLimit = CARD_MOTION_LIMITS.instance.startOffsetXY;
  const offsetZLimit = CARD_MOTION_LIMITS.instance.startOffsetZ;
  const rotationLimit = CARD_MOTION_LIMITS.instance.rotationOffset;
  const speedValue = source.speed == null
    ? source.speedMultiplier
    : source.speed;

  return {
    destination: normalizePoint(
      source.destination,
      {x: 0, y: 0, z: 0},
      {
        x: destinationLimit,
        y: destinationLimit,
        z: destinationLimit
      }
    ),
    delayMs: boundedNumber(
      source.delayMs,
      0,
      CARD_MOTION_LIMITS.instance.delayMs
    ),
    speed: boundedNumber(
      speedValue,
      1,
      CARD_MOTION_LIMITS.instance.speed
    ),
    startOffset: normalizePoint(
      source.startOffset,
      {x: 0, y: 0, z: 0},
      {
        x: offsetXYLimit,
        y: offsetXYLimit,
        z: offsetZLimit
      }
    ),
    rotationOffset: normalizePoint(
      source.rotationOffset,
      {x: 0, y: 0, z: 0},
      {
        x: rotationLimit,
        y: rotationLimit,
        z: rotationLimit
      }
    )
  };
}

function createBallisticParameters(releaseHeight, apexHeight) {
  if (apexHeight <= 0) {
    return {
      verticalImpulse: 0,
      gravity: 0,
      apexProgress: 0
    };
  }

  const apexDelta = Math.max(0, apexHeight - releaseHeight);
  if (apexDelta === 0) {
    return {
      verticalImpulse: 0,
      gravity: 2 * releaseHeight,
      apexProgress: 0
    };
  }

  const verticalImpulse =
    (2 * apexDelta) +
    (2 * Math.sqrt(apexDelta * apexHeight));
  const gravity = 2 * (releaseHeight + verticalImpulse);
  return {
    verticalImpulse,
    gravity,
    apexProgress: verticalImpulse / gravity
  };
}

function closestEquivalentDegrees(targetDegrees, fromDegrees) {
  return targetDegrees + (
    Math.round((fromDegrees - targetDegrees) / FULL_TURN_DEGREES) *
    FULL_TURN_DEGREES
  );
}

export function createCardMotionPlan(preset, instance) {
  const normalizedPreset = normalizeCardMotionPreset(preset);
  const normalizedInstance = normalizeInstance(instance);
  const speed = normalizedInstance.speed;
  const directionRadians =
    normalizedPreset.path.directionDeg * DEGREES_TO_RADIANS;
  const skidRadians =
    normalizedPreset.landing.skidAngleDeg * DEGREES_TO_RADIANS;
  const finalPosition = {
    x:
      normalizedInstance.destination.x +
      normalizedPreset.path.landingXPx,
    y:
      normalizedInstance.destination.y +
      normalizedPreset.path.landingYPx,
    z: normalizedInstance.destination.z
  };
  const startPosition = {
    x:
      finalPosition.x +
      (-Math.cos(directionRadians) * normalizedPreset.path.distancePx) +
      normalizedInstance.startOffset.x,
    y:
      finalPosition.y +
      (-Math.sin(directionRadians) * normalizedPreset.path.distancePx) +
      normalizedInstance.startOffset.y
  };
  const contactPosition = {
    x:
      finalPosition.x -
      (
        Math.cos(skidRadians) *
        normalizedPreset.landing.skidDistancePx
      ),
    y:
      finalPosition.y -
      (
        Math.sin(skidRadians) *
        normalizedPreset.landing.skidDistancePx
      )
  };
  const travel = {
    x: contactPosition.x - startPosition.x,
    y: contactPosition.y - startPosition.y
  };
  const travelLength = Math.hypot(travel.x, travel.y);
  const normal = travelLength > 0.000000001
    ? {
      x: -travel.y / travelLength,
      y: travel.x / travelLength
    }
    : {x: 0, y: -1};
  const controlPosition = {
    x:
      ((startPosition.x + contactPosition.x) / 2) +
      (normal.x * normalizedPreset.path.curvePx),
    y:
      ((startPosition.y + contactPosition.y) / 2) +
      (normal.y * normalizedPreset.path.curvePx)
  };
  const releaseHeight = clamp(
    normalizedPreset.path.releaseHeight +
      normalizedInstance.startOffset.z,
    CARD_MOTION_LIMITS.path.releaseHeight.minimum,
    CARD_MOTION_LIMITS.path.apexHeight.maximum
  );
  const apexHeight = Math.max(
    releaseHeight,
    clamp(
      normalizedPreset.path.apexHeight +
        normalizedInstance.startOffset.z,
      CARD_MOTION_LIMITS.path.apexHeight.minimum,
      CARD_MOTION_LIMITS.path.apexHeight.maximum
    )
  );
  const ballistic = createBallisticParameters(
    releaseHeight,
    apexHeight
  );
  const flightMs = normalizedPreset.path.flightMs / speed;
  const slapMs = normalizedPreset.landing.slapMs / speed;
  const skidMs = normalizedPreset.landing.skidMs / speed;
  const landingMs = slapMs + skidMs;
  const motionMs = flightMs + landingMs;
  const rotationOffset = normalizedInstance.rotationOffset;
  const releaseRotation = {
    x:
      normalizedPreset.rotation.releasePitchDeg +
      rotationOffset.x,
    y:
      normalizedPreset.rotation.releaseYawDeg +
      rotationOffset.y,
    z:
      normalizedPreset.rotation.releaseRollDeg +
      rotationOffset.z
  };
  const contactRotation = {
    x:
      normalizedPreset.rotation.contactPitchDeg +
      rotationOffset.x +
      (
        normalizedPreset.rotation.xTurns *
        FULL_TURN_DEGREES
      ),
    y:
      normalizedPreset.rotation.contactYawDeg +
      rotationOffset.y +
      (
        normalizedPreset.rotation.yTurns *
        FULL_TURN_DEGREES
      ),
    z:
      normalizedPreset.rotation.contactRollDeg +
      rotationOffset.z +
      (
        normalizedPreset.rotation.zTurns *
        FULL_TURN_DEGREES
      )
  };
  const finalBaseRotation = {
    x: 0,
    y: 0,
    z:
      normalizedPreset.rotation.finalRollDeg +
      rotationOffset.z
  };
  const finalRotation = {
    x: closestEquivalentDegrees(
      finalBaseRotation.x,
      contactRotation.x
    ),
    y: closestEquivalentDegrees(
      finalBaseRotation.y,
      contactRotation.y
    ),
    z: closestEquivalentDegrees(
      finalBaseRotation.z,
      contactRotation.z
    )
  };

  return deepFreeze({
    kind: PLAN_KIND,
    schemaVersion: CARD_MOTION_SCHEMA_VERSION,
    preset: normalizedPreset,
    instance: normalizedInstance,
    timing: {
      delayMs: normalizedInstance.delayMs,
      flightMs,
      slapMs,
      skidMs,
      landingMs,
      motionMs,
      totalMs: normalizedInstance.delayMs + motionMs
    },
    path: {
      start: {
        x: startPosition.x,
        y: startPosition.y,
        z: finalPosition.z + releaseHeight
      },
      control: {
        x: controlPosition.x,
        y: controlPosition.y
      },
      contact: {
        x: contactPosition.x,
        y: contactPosition.y,
        z: finalPosition.z
      },
      destination: finalPosition,
      releaseHeight,
      apexHeight,
      apexProgress: ballistic.apexProgress,
      verticalImpulse: ballistic.verticalImpulse,
      gravity: ballistic.gravity
    },
    rotation: {
      releaseDegrees: releaseRotation,
      contactDegrees: contactRotation,
      flatDegrees: {
        x: finalRotation.x,
        y: finalRotation.y,
        z: contactRotation.z
      },
      finalDegrees: finalRotation,
      finalNormalizedDegrees: finalBaseRotation,
      turns: {
        x: normalizedPreset.rotation.xTurns,
        y: normalizedPreset.rotation.yTurns,
        z: normalizedPreset.rotation.zTurns
      }
    },
    scale: {
      mode: normalizedPreset.scale.mode,
      cardScale: normalizedPreset.scale.cardScale,
      start: normalizedPreset.scale.start,
      apex: normalizedPreset.scale.apex,
      contact: normalizedPreset.scale.contact,
      end: normalizedPreset.scale.end
    },
    shadow: {
      strength: normalizedPreset.shadow.strength,
      spread: normalizedPreset.shadow.spread
    }
  });
}

function interpolate(start, end, progress) {
  return start + ((end - start) * progress);
}

function quadraticBezier(start, control, end, progress) {
  const inverse = 1 - progress;
  return (
    (inverse * inverse * start) +
    (2 * inverse * progress * control) +
    (progress * progress * end)
  );
}

function smoothStep(progress) {
  const bounded = clamp(progress, 0, 1);
  return bounded * bounded * (3 - (2 * bounded));
}

function easeOutQuadratic(progress) {
  const bounded = clamp(progress, 0, 1);
  return 1 - ((1 - bounded) * (1 - bounded));
}

function normalizeRotationDegrees(rotation) {
  return {
    x: normalizeAngle(rotation.x),
    y: normalizeAngle(rotation.y),
    z: normalizeAngle(rotation.z)
  };
}

function sampleFlightScale(plan, progress) {
  if (plan.scale.mode === 'perspective') {
    return plan.scale.cardScale;
  }
  const apexProgress = plan.path.apexProgress;
  let multiplier;
  if (apexProgress <= 0) {
    multiplier = interpolate(
      plan.scale.apex,
      plan.scale.contact,
      smoothStep(progress)
    );
  } else if (progress <= apexProgress) {
    multiplier = interpolate(
      plan.scale.start,
      plan.scale.apex,
      smoothStep(progress / apexProgress)
    );
  } else {
    multiplier = interpolate(
      plan.scale.apex,
      plan.scale.contact,
      smoothStep(
        (progress - apexProgress) /
        (1 - apexProgress)
      )
    );
  }
  return plan.scale.cardScale * multiplier;
}

function sampleLandingScale(plan, progress) {
  if (plan.scale.mode === 'perspective') {
    return plan.scale.cardScale;
  }
  return plan.scale.cardScale * interpolate(
    plan.scale.contact,
    plan.scale.end,
    smoothStep(progress)
  );
}

function createPose(
  plan,
  phase,
  complete,
  elapsedMs,
  localElapsedMs,
  progress,
  flightProgress,
  landingProgress,
  position,
  height,
  rotationDegrees,
  scale
) {
  const normalizedRotation = normalizeRotationDegrees(rotationDegrees);
  const heightRatio = plan.path.apexHeight > 0
    ? clamp(height / plan.path.apexHeight, 0, 1)
    : 0;
  const shadowLift = Math.sqrt(heightRatio);
  const rotationRadians = {
    x: rotationDegrees.x * DEGREES_TO_RADIANS,
    y: rotationDegrees.y * DEGREES_TO_RADIANS,
    z: rotationDegrees.z * DEGREES_TO_RADIANS
  };

  return {
    schemaVersion: CARD_MOTION_SCHEMA_VERSION,
    phase,
    complete,
    elapsedMs,
    localElapsedMs,
    progress,
    flightProgress,
    landingProgress,
    screenX: position.x,
    screenY: position.y,
    height,
    depth: height,
    z: plan.path.destination.z + height,
    position: {
      x: position.x,
      y: position.y,
      z: plan.path.destination.z + height,
      height
    },
    rotationDegrees: {
      x: rotationDegrees.x,
      y: rotationDegrees.y,
      z: rotationDegrees.z
    },
    normalizedRotationDegrees: normalizedRotation,
    rotationRadians,
    rotationX: rotationRadians.x,
    rotationY: rotationRadians.y,
    rotationZ: rotationRadians.z,
    scaleMode: plan.scale.mode,
    authoredScale: scale,
    scale,
    shadow: {
      strength:
        plan.shadow.strength *
        (1 - (0.72 * shadowLift)),
      spread:
        plan.shadow.spread *
        (1 + (0.85 * shadowLift))
    }
  };
}

function assertPlan(plan) {
  if (!plan || plan.kind !== PLAN_KIND ||
      plan.schemaVersion !== CARD_MOTION_SCHEMA_VERSION) {
    throw new TypeError(
      'sampleCardMotion requires a current card-motion plan.'
    );
  }
}

export function sampleCardMotion(plan, elapsedMs) {
  assertPlan(plan);
  if (typeof elapsedMs !== 'number' || !Number.isFinite(elapsedMs)) {
    throw new TypeError('Card-motion elapsed time must be finite.');
  }

  const boundedElapsed = Math.max(0, elapsedMs);
  const localElapsed = boundedElapsed - plan.timing.delayMs;
  const startPosition = plan.path.start;
  const destination = plan.path.destination;

  if (localElapsed <= 0) {
    const waitingScale = plan.scale.mode === 'perspective'
      ? plan.scale.cardScale
      : plan.scale.cardScale * plan.scale.start;
    return createPose(
      plan,
      'waiting',
      false,
      boundedElapsed,
      localElapsed,
      0,
      0,
      0,
      startPosition,
      plan.path.releaseHeight,
      plan.rotation.releaseDegrees,
      waitingScale
    );
  }

  if (localElapsed >= plan.timing.motionMs) {
    const finalScale = plan.scale.mode === 'perspective'
      ? plan.scale.cardScale
      : plan.scale.cardScale * plan.scale.end;
    return createPose(
      plan,
      'settled',
      true,
      boundedElapsed,
      localElapsed,
      1,
      1,
      1,
      destination,
      0,
      plan.rotation.finalDegrees,
      finalScale
    );
  }

  if (localElapsed < plan.timing.flightMs) {
    const flightProgress = clamp(
      localElapsed / plan.timing.flightMs,
      0,
      1
    );
    const baseRotationProgress = smoothStep(flightProgress);
    const rotation = {
      x:
        interpolate(
          plan.rotation.releaseDegrees.x,
          plan.preset.rotation.contactPitchDeg +
            plan.instance.rotationOffset.x,
          baseRotationProgress
        ) +
        (
          plan.rotation.turns.x *
          FULL_TURN_DEGREES *
          flightProgress
        ),
      y:
        interpolate(
          plan.rotation.releaseDegrees.y,
          plan.preset.rotation.contactYawDeg +
            plan.instance.rotationOffset.y,
          baseRotationProgress
        ) +
        (
          plan.rotation.turns.y *
          FULL_TURN_DEGREES *
          flightProgress
        ),
      z:
        interpolate(
          plan.rotation.releaseDegrees.z,
          plan.preset.rotation.contactRollDeg +
            plan.instance.rotationOffset.z,
          baseRotationProgress
        ) +
        (
          plan.rotation.turns.z *
          FULL_TURN_DEGREES *
          flightProgress
        )
    };
    const height = flightProgress >= 1
      ? 0
      : Math.max(
        0,
        plan.path.releaseHeight +
          (plan.path.verticalImpulse * flightProgress) -
          (
            0.5 *
            plan.path.gravity *
            flightProgress *
            flightProgress
          )
      );
    const position = {
      x: quadraticBezier(
        startPosition.x,
        plan.path.control.x,
        plan.path.contact.x,
        flightProgress
      ),
      y: quadraticBezier(
        startPosition.y,
        plan.path.control.y,
        plan.path.contact.y,
        flightProgress
      )
    };
    return createPose(
      plan,
      'flight',
      false,
      boundedElapsed,
      localElapsed,
      localElapsed / plan.timing.motionMs,
      flightProgress,
      0,
      position,
      height,
      rotation,
      sampleFlightScale(plan, flightProgress)
    );
  }

  const landingElapsed = localElapsed - plan.timing.flightMs;
  if (plan.timing.landingMs <= 0) {
    const finalScale = plan.scale.mode === 'perspective'
      ? plan.scale.cardScale
      : plan.scale.cardScale * plan.scale.end;
    return createPose(
      plan,
      'settled',
      true,
      boundedElapsed,
      localElapsed,
      1,
      1,
      1,
      destination,
      0,
      plan.rotation.finalDegrees,
      finalScale
    );
  }

  const landingProgress = clamp(
    landingElapsed / plan.timing.landingMs,
    0,
    1
  );
  const contactScale = plan.scale.mode === 'perspective'
    ? plan.scale.cardScale
    : plan.scale.cardScale * plan.scale.contact;
  const translationProgress = easeOutQuadratic(landingProgress);
  const position = {
    x: interpolate(
      plan.path.contact.x,
      destination.x,
      translationProgress
    ),
    y: interpolate(
      plan.path.contact.y,
      destination.y,
      translationProgress
    )
  };

  if (plan.timing.slapMs > 0 &&
      landingElapsed < plan.timing.slapMs) {
    const slapProgress = clamp(
      landingElapsed / plan.timing.slapMs,
      0,
      1
    );
    const rotationProgress = smoothStep(slapProgress);
    return createPose(
      plan,
      'slap',
      false,
      boundedElapsed,
      localElapsed,
      localElapsed / plan.timing.motionMs,
      1,
      landingProgress,
      position,
      0,
      {
        x: interpolate(
          plan.rotation.contactDegrees.x,
          plan.rotation.flatDegrees.x,
          rotationProgress
        ),
        y: interpolate(
          plan.rotation.contactDegrees.y,
          plan.rotation.flatDegrees.y,
          rotationProgress
        ),
        z: interpolate(
          plan.rotation.contactDegrees.z,
          plan.rotation.flatDegrees.z,
          rotationProgress
        )
      },
      contactScale
    );
  }

  const skidElapsed = Math.max(
    0,
    landingElapsed - plan.timing.slapMs
  );
  const skidProgress = plan.timing.skidMs > 0
    ? clamp(skidElapsed / plan.timing.skidMs, 0, 1)
    : 1;
  const rotationProgress = smoothStep(skidProgress);
  const rotation = {
    x: interpolate(
      plan.rotation.flatDegrees.x,
      plan.rotation.finalDegrees.x,
      rotationProgress
    ),
    y: interpolate(
      plan.rotation.flatDegrees.y,
      plan.rotation.finalDegrees.y,
      rotationProgress
    ),
    z: interpolate(
      plan.rotation.flatDegrees.z,
      plan.rotation.finalDegrees.z,
      rotationProgress
    )
  };

  return createPose(
    plan,
    'skid',
    false,
    boundedElapsed,
    localElapsed,
    localElapsed / plan.timing.motionMs,
    1,
    landingProgress,
    position,
    0,
    rotation,
    sampleLandingScale(plan, skidProgress)
  );
}

function assertExactKeys(value, expectedKeys, path) {
  if (!isRecord(value)) {
    throw new TypeError(`${path} must be an object.`);
  }
  const actual = Object.keys(value).sort();
  const expected = expectedKeys.slice(0).sort();
  if (actual.length !== expected.length ||
      actual.some((key, index) => key !== expected[index])) {
    throw new Error(
      `${path} must contain exactly: ${expectedKeys.join(', ')}.`
    );
  }
}

function assertStrictNumber(value, bounds, path) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${path} must be a finite number.`);
  }
  if (value < bounds.minimum || value > bounds.maximum) {
    throw new RangeError(
      `${path} must be between ${bounds.minimum} and ${bounds.maximum}.`
    );
  }
}

function validateStrictPreset(raw) {
  assertExactKeys(raw, ROOT_KEYS, 'Card-motion preset');
  if (raw.schemaVersion !== CARD_MOTION_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported card-motion schema version "${raw.schemaVersion}".`
    );
  }
  if (typeof raw.id !== 'string' ||
      !/^[a-z0-9][a-z0-9-]{0,63}$/.test(raw.id)) {
    throw new TypeError(
      'Card-motion preset id must be a lowercase kebab-case identifier.'
    );
  }
  if (typeof raw.label !== 'string' ||
      !raw.label.trim() ||
      raw.label.length > 100) {
    throw new TypeError(
      'Card-motion preset label must be a non-empty string of 100 characters or fewer.'
    );
  }

  assertExactKeys(raw.path, PATH_KEYS, 'Card-motion preset path');
  PATH_KEYS.forEach((key) => {
    assertStrictNumber(
      raw.path[key],
      CARD_MOTION_LIMITS.path[key],
      `Card-motion preset path.${key}`
    );
  });
  if (raw.path.apexHeight < raw.path.releaseHeight) {
    throw new RangeError(
      'Card-motion preset path.apexHeight cannot be below releaseHeight.'
    );
  }

  assertExactKeys(
    raw.rotation,
    ROTATION_KEYS,
    'Card-motion preset rotation'
  );
  ROTATION_KEYS.forEach((key) => {
    assertStrictNumber(
      raw.rotation[key],
      CARD_MOTION_LIMITS.rotation[key],
      `Card-motion preset rotation.${key}`
    );
  });

  assertExactKeys(
    raw.landing,
    LANDING_KEYS,
    'Card-motion preset landing'
  );
  LANDING_KEYS.forEach((key) => {
    assertStrictNumber(
      raw.landing[key],
      CARD_MOTION_LIMITS.landing[key],
      `Card-motion preset landing.${key}`
    );
  });

  assertExactKeys(raw.scale, SCALE_KEYS, 'Card-motion preset scale');
  if (raw.scale.mode !== 'perspective' &&
      raw.scale.mode !== 'keyframed') {
    throw new TypeError(
      'Card-motion preset scale.mode must be perspective or keyframed.'
    );
  }
  SCALE_KEYS.filter((key) => key !== 'mode').forEach((key) => {
    assertStrictNumber(
      raw.scale[key],
      CARD_MOTION_LIMITS.scale[key],
      `Card-motion preset scale.${key}`
    );
  });

  assertExactKeys(
    raw.shadow,
    SHADOW_KEYS,
    'Card-motion preset shadow'
  );
  SHADOW_KEYS.forEach((key) => {
    assertStrictNumber(
      raw.shadow[key],
      CARD_MOTION_LIMITS.shadow[key],
      `Card-motion preset shadow.${key}`
    );
  });
}

export function serializeCardMotionPreset(preset) {
  const normalized = normalizeCardMotionPreset(preset);
  return JSON.stringify(normalized, null, 2);
}

export function parseCardMotionPreset(json) {
  if (typeof json !== 'string') {
    throw new TypeError('Card-motion preset JSON must be a string.');
  }
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    throw new SyntaxError(
      `Card-motion preset JSON is invalid. ${error.message}`
    );
  }
  validateStrictPreset(parsed);
  return normalizeCardMotionPreset(parsed);
}
