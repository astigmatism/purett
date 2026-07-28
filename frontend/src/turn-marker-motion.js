export const TURN_MARKER_MOTION_SCHEMA_VERSION = 1;

const PLAN_KIND = 'purett-turn-marker-motion-plan';
const FULL_TURN_RADIANS = Math.PI * 2;
const HALF_TURN_RADIANS = Math.PI;
const DEGREES_TO_RADIANS = Math.PI / 180;

const ROOT_KEYS = Object.freeze([
  'schemaVersion',
  'id',
  'label',
  'path',
  'rotation',
  'landing',
  'shadow'
]);
const PATH_KEYS = Object.freeze([
  'curvePx',
  'apexHeight',
  'flightMs'
]);
const ROTATION_KEYS = Object.freeze([
  'flipTurns',
  'tumbleTurns',
  'spinTurns',
  'contactTiltDeg'
]);
const LANDING_KEYS = Object.freeze([
  'settleMs'
]);
const SHADOW_KEYS = Object.freeze([
  'strength',
  'spread'
]);

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

export const TURN_MARKER_MATCH_CENTERS = deepFreeze({
  initial: {
    x: 347.5,
    y: 440.5
  },
  player: {
    x: 53.5,
    y: 440.5
  },
  opponent: {
    x: 641.5,
    y: 440.5
  }
});

export const TURN_MARKER_MOTION_LIMITS = deepFreeze({
  path: {
    curvePx: {
      minimum: -240,
      maximum: 240
    },
    apexHeight: {
      minimum: 0,
      maximum: 300
    },
    flightMs: {
      minimum: 200,
      maximum: 2000
    }
  },
  rotation: {
    flipTurns: {
      minimum: -8,
      maximum: 8
    },
    tumbleTurns: {
      minimum: -8,
      maximum: 8
    },
    spinTurns: {
      minimum: -4,
      maximum: 4
    },
    contactTiltDeg: {
      minimum: -45,
      maximum: 45
    }
  },
  landing: {
    settleMs: {
      minimum: 0,
      maximum: 600
    }
  },
  shadow: {
    strength: {
      minimum: 0,
      maximum: 1
    },
    spread: {
      minimum: 0.25,
      maximum: 4
    }
  },
  instance: {
    coordinate: {
      minimum: -1000000,
      maximum: 1000000
    },
    delayMs: {
      minimum: 0,
      maximum: 10000
    },
    height: {
      minimum: 0,
      maximum: 1000
    },
    rotationRadians: {
      minimum: -100 * Math.PI,
      maximum: 100 * Math.PI
    },
    shadowOpacity: {
      minimum: 0,
      maximum: 1
    },
    shadowScale: {
      minimum: 0.1,
      maximum: 10
    }
  }
});

const DEFAULT_PROFILE_SOURCE = {
  schemaVersion: TURN_MARKER_MOTION_SCHEMA_VERSION,
  id: 'turn-marker-toss',
  label: 'Turn Marker Toss',
  path: {
    curvePx: -54,
    apexHeight: 92,
    flightMs: 650
  },
  rotation: {
    flipTurns: 2.5,
    tumbleTurns: 0.5,
    spinTurns: 0.125,
    contactTiltDeg: 8
  },
  landing: {
    settleMs: 110
  },
  shadow: {
    strength: 0.34,
    spread: 1
  }
};

function isRecord(value) {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function boundedNumber(value, fallback, bounds) {
  const converted =
    typeof value === 'string' && value.trim() !== ''
      ? Number(value)
      : value;
  const finite =
    typeof converted === 'number' &&
    Number.isFinite(converted)
      ? converted
      : fallback;
  return clamp(
    finite,
    bounds.minimum,
    bounds.maximum
  );
}

function normalizeIdentifier(value, fallback) {
  const normalized = String(
    value == null ? fallback : value
  )
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return normalized || fallback;
}

function normalizeLabel(value, fallback) {
  const normalized = String(
    value == null ? fallback : value
  )
    .trim()
    .slice(0, 100);
  return normalized || fallback;
}

function sourceGroup(source, key) {
  return isRecord(source) &&
    isRecord(source[key])
    ? source[key]
    : {};
}

function normalizeProfileInternal(raw) {
  const source = isRecord(raw) ? raw : {};
  if (
    source.schemaVersion != null &&
    Number(source.schemaVersion) !==
      TURN_MARKER_MOTION_SCHEMA_VERSION
  ) {
    throw new Error(
      'Unsupported turn-marker-motion schema version ' +
      `"${source.schemaVersion}".`
    );
  }

  const path = sourceGroup(source, 'path');
  const rotation = sourceGroup(source, 'rotation');
  const landing = sourceGroup(source, 'landing');
  const shadow = sourceGroup(source, 'shadow');
  const defaults = DEFAULT_PROFILE_SOURCE;

  return {
    schemaVersion:
      TURN_MARKER_MOTION_SCHEMA_VERSION,
    id: normalizeIdentifier(
      source.id,
      defaults.id
    ),
    label: normalizeLabel(
      source.label,
      defaults.label
    ),
    path: {
      curvePx: boundedNumber(
        path.curvePx,
        defaults.path.curvePx,
        TURN_MARKER_MOTION_LIMITS.path.curvePx
      ),
      apexHeight: boundedNumber(
        path.apexHeight,
        defaults.path.apexHeight,
        TURN_MARKER_MOTION_LIMITS.path.apexHeight
      ),
      flightMs: boundedNumber(
        path.flightMs,
        defaults.path.flightMs,
        TURN_MARKER_MOTION_LIMITS.path.flightMs
      )
    },
    rotation: {
      flipTurns: boundedNumber(
        rotation.flipTurns,
        defaults.rotation.flipTurns,
        TURN_MARKER_MOTION_LIMITS.rotation
          .flipTurns
      ),
      tumbleTurns: boundedNumber(
        rotation.tumbleTurns,
        defaults.rotation.tumbleTurns,
        TURN_MARKER_MOTION_LIMITS.rotation
          .tumbleTurns
      ),
      spinTurns: boundedNumber(
        rotation.spinTurns,
        defaults.rotation.spinTurns,
        TURN_MARKER_MOTION_LIMITS.rotation
          .spinTurns
      ),
      contactTiltDeg: boundedNumber(
        rotation.contactTiltDeg,
        defaults.rotation.contactTiltDeg,
        TURN_MARKER_MOTION_LIMITS.rotation
          .contactTiltDeg
      )
    },
    landing: {
      settleMs: boundedNumber(
        landing.settleMs,
        defaults.landing.settleMs,
        TURN_MARKER_MOTION_LIMITS.landing
          .settleMs
      )
    },
    shadow: {
      strength: boundedNumber(
        shadow.strength,
        defaults.shadow.strength,
        TURN_MARKER_MOTION_LIMITS.shadow.strength
      ),
      spread: boundedNumber(
        shadow.spread,
        defaults.shadow.spread,
        TURN_MARKER_MOTION_LIMITS.shadow.spread
      )
    }
  };
}

export function normalizeTurnMarkerMotionProfile(raw) {
  return deepFreeze(
    normalizeProfileInternal(raw)
  );
}

export const DEFAULT_TURN_MARKER_MOTION_PROFILE =
  deepFreeze(
    normalizeProfileInternal(
      DEFAULT_PROFILE_SOURCE
    )
  );

function assertExactKeys(value, expectedKeys, path) {
  if (!isRecord(value)) {
    throw new TypeError(`${path} must be an object.`);
  }
  const actual = Object.keys(value).sort();
  const expected = expectedKeys.slice(0).sort();
  if (
    actual.length !== expected.length ||
    actual.some(
      (key, index) => key !== expected[index]
    )
  ) {
    throw new Error(
      `${path} must contain exactly: ` +
      `${expectedKeys.join(', ')}.`
    );
  }
}

function assertStrictNumber(value, bounds, path) {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    throw new TypeError(
      `${path} must be a finite number.`
    );
  }
  if (
    value < bounds.minimum ||
    value > bounds.maximum
  ) {
    throw new RangeError(
      `${path} must be between ` +
      `${bounds.minimum} and ${bounds.maximum}.`
    );
  }
}

function validateStrictProfile(raw) {
  assertExactKeys(
    raw,
    ROOT_KEYS,
    'Turn-marker-motion profile'
  );
  if (
    raw.schemaVersion !==
      TURN_MARKER_MOTION_SCHEMA_VERSION
  ) {
    throw new Error(
      'Unsupported turn-marker-motion schema version ' +
      `"${raw.schemaVersion}".`
    );
  }
  if (
    typeof raw.id !== 'string' ||
    !/^[a-z0-9][a-z0-9-]{0,63}$/.test(raw.id)
  ) {
    throw new TypeError(
      'Turn-marker-motion profile id must be a ' +
      'lowercase kebab-case identifier.'
    );
  }
  if (
    typeof raw.label !== 'string' ||
    !raw.label.trim() ||
    raw.label.length > 100
  ) {
    throw new TypeError(
      'Turn-marker-motion profile label must be a ' +
      'non-empty string of 100 characters or fewer.'
    );
  }

  [
    ['path', PATH_KEYS],
    ['rotation', ROTATION_KEYS],
    ['landing', LANDING_KEYS],
    ['shadow', SHADOW_KEYS]
  ].forEach(([groupName, keys]) => {
    assertExactKeys(
      raw[groupName],
      keys,
      `Turn-marker-motion profile ${groupName}`
    );
    keys.forEach((key) => {
      assertStrictNumber(
        raw[groupName][key],
        TURN_MARKER_MOTION_LIMITS[groupName][key],
        `Turn-marker-motion profile ${groupName}.${key}`
      );
    });
  });
}

export function serializeTurnMarkerMotionProfile(
  profile
) {
  return JSON.stringify(
    normalizeTurnMarkerMotionProfile(profile),
    null,
    2
  );
}

export function parseTurnMarkerMotionProfile(json) {
  if (typeof json !== 'string') {
    throw new TypeError(
      'Turn-marker-motion profile JSON must be a string.'
    );
  }
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    throw new SyntaxError(
      'Turn-marker-motion profile JSON is invalid. ' +
      error.message
    );
  }
  validateStrictProfile(parsed);
  return normalizeTurnMarkerMotionProfile(parsed);
}

function strictInstanceNumber(
  value,
  bounds,
  path
) {
  assertStrictNumber(value, bounds, path);
  return value;
}

function normalizeRequiredPoint(raw, path) {
  if (!isRecord(raw)) {
    throw new TypeError(
      `${path} must be an object.`
    );
  }
  const bounds =
    TURN_MARKER_MOTION_LIMITS.instance.coordinate;
  return {
    x: strictInstanceNumber(
      raw.x,
      bounds,
      `${path}.x`
    ),
    y: strictInstanceNumber(
      raw.y,
      bounds,
      `${path}.y`
    )
  };
}

function optionalPoseNumber(
  source,
  key,
  fallback,
  bounds,
  path
) {
  if (source[key] == null) {
    return fallback;
  }
  return strictInstanceNumber(
    source[key],
    bounds,
    `${path}.${key}`
  );
}

function normalizeSourcePose(
  raw,
  source,
  profile
) {
  const pose = raw == null ? {} : raw;
  if (!isRecord(pose)) {
    throw new TypeError(
      'Turn-marker-motion sourcePose must be an object.'
    );
  }
  const instanceLimits =
    TURN_MARKER_MOTION_LIMITS.instance;
  return {
    screenX: optionalPoseNumber(
      pose,
      'screenX',
      source.x,
      instanceLimits.coordinate,
      'Turn-marker-motion sourcePose'
    ),
    screenY: optionalPoseNumber(
      pose,
      'screenY',
      source.y,
      instanceLimits.coordinate,
      'Turn-marker-motion sourcePose'
    ),
    height: optionalPoseNumber(
      pose,
      'height',
      0,
      instanceLimits.height,
      'Turn-marker-motion sourcePose'
    ),
    rotationX: optionalPoseNumber(
      pose,
      'rotationX',
      0,
      instanceLimits.rotationRadians,
      'Turn-marker-motion sourcePose'
    ),
    rotationY: optionalPoseNumber(
      pose,
      'rotationY',
      0,
      instanceLimits.rotationRadians,
      'Turn-marker-motion sourcePose'
    ),
    rotationZ: optionalPoseNumber(
      pose,
      'rotationZ',
      0,
      instanceLimits.rotationRadians,
      'Turn-marker-motion sourcePose'
    ),
    shadowOpacity: optionalPoseNumber(
      pose,
      'shadowOpacity',
      profile.shadow.strength,
      instanceLimits.shadowOpacity,
      'Turn-marker-motion sourcePose'
    ),
    shadowScale: optionalPoseNumber(
      pose,
      'shadowScale',
      profile.shadow.spread,
      instanceLimits.shadowScale,
      'Turn-marker-motion sourcePose'
    )
  };
}

function closestMultiple(value, interval) {
  return Math.round(value / interval) * interval;
}

export function createTurnMarkerMotionPlan(
  profile,
  instance
) {
  const normalizedProfile =
    normalizeTurnMarkerMotionProfile(profile);
  if (!isRecord(instance)) {
    throw new TypeError(
      'Turn-marker-motion instance must be an object.'
    );
  }
  const nominalSource = normalizeRequiredPoint(
    instance.source,
    'Turn-marker-motion source'
  );
  const destination = normalizeRequiredPoint(
    instance.destination,
    'Turn-marker-motion destination'
  );
  const delayMs = instance.delayMs == null
    ? 0
    : strictInstanceNumber(
        instance.delayMs,
        TURN_MARKER_MOTION_LIMITS.instance
          .delayMs,
        'Turn-marker-motion delayMs'
      );
  const sourcePose = normalizeSourcePose(
    instance.sourcePose,
    nominalSource,
    normalizedProfile
  );
  const source = {
    x: sourcePose.screenX,
    y: sourcePose.screenY
  };
  const directionSign =
    destination.x !== nominalSource.x
      ? (
          destination.x > nominalSource.x
            ? 1
            : -1
        )
      : (
          destination.y >= nominalSource.y
            ? 1
            : -1
        );
  const control = {
    x: (source.x + destination.x) / 2,
    y:
      ((source.y + destination.y) / 2) +
      normalizedProfile.path.curvePx
  };
  const contactTilt =
    normalizedProfile.rotation.contactTiltDeg *
    DEGREES_TO_RADIANS *
    directionSign;
  const contactRotation = {
    x:
      sourcePose.rotationX +
      (
        normalizedProfile.rotation.tumbleTurns *
        FULL_TURN_RADIANS *
        directionSign
      ) +
      contactTilt,
    y:
      sourcePose.rotationY +
      (
        normalizedProfile.rotation.flipTurns *
        FULL_TURN_RADIANS *
        directionSign
      ),
    z:
      sourcePose.rotationZ +
      (
        normalizedProfile.rotation.spinTurns *
        FULL_TURN_RADIANS *
        directionSign
      )
  };
  const terminalRotation = {
    x: closestMultiple(
      contactRotation.x,
      HALF_TURN_RADIANS
    ),
    y: closestMultiple(
      contactRotation.y,
      HALF_TURN_RADIANS
    ),
    z: closestMultiple(
      contactRotation.z,
      FULL_TURN_RADIANS
    )
  };
  const flightMs =
    normalizedProfile.path.flightMs;
  const settleMs =
    normalizedProfile.landing.settleMs;
  const motionMs = flightMs + settleMs;

  return deepFreeze({
    kind: PLAN_KIND,
    schemaVersion:
      TURN_MARKER_MOTION_SCHEMA_VERSION,
    profile: normalizedProfile,
    instance: {
      nominalSource,
      destination,
      delayMs,
      sourcePose
    },
    directionSign,
    timing: {
      delayMs,
      flightMs,
      settleMs,
      motionMs,
      totalMs: delayMs + motionMs
    },
    path: {
      source,
      nominalSource,
      control,
      destination,
      curvePx:
        normalizedProfile.path.curvePx,
      apexHeight:
        normalizedProfile.path.apexHeight,
      mirroring: 'screen-x-reflection'
    },
    rotation: {
      source: {
        x: sourcePose.rotationX,
        y: sourcePose.rotationY,
        z: sourcePose.rotationZ
      },
      contact: contactRotation,
      terminal: terminalRotation,
      flipTurns:
        normalizedProfile.rotation.flipTurns,
      tumbleTurns:
        normalizedProfile.rotation.tumbleTurns,
      spinTurns:
        normalizedProfile.rotation.spinTurns,
      contactTiltRadians: contactTilt
    },
    shadow: {
      sourceOpacity:
        sourcePose.shadowOpacity,
      sourceScale:
        sourcePose.shadowScale,
      strength:
        normalizedProfile.shadow.strength,
      spread:
        normalizedProfile.shadow.spread
    }
  });
}

function interpolate(start, end, progress) {
  return start + ((end - start) * progress);
}

function quadraticBezier(
  start,
  control,
  end,
  progress
) {
  const inverse = 1 - progress;
  return (
    (inverse * inverse * start) +
    (2 * inverse * progress * control) +
    (progress * progress * end)
  );
}

function smoothStep(progress) {
  const bounded = clamp(progress, 0, 1);
  return (
    bounded *
    bounded *
    (3 - (2 * bounded))
  );
}

function assertPlan(plan) {
  if (
    !plan ||
    plan.kind !== PLAN_KIND ||
    plan.schemaVersion !==
      TURN_MARKER_MOTION_SCHEMA_VERSION
  ) {
    throw new TypeError(
      'sampleTurnMarkerMotion requires a current ' +
      'turn-marker-motion plan.'
    );
  }
}

function createPose(
  plan,
  phase,
  complete,
  elapsedMs,
  localElapsedMs,
  progress,
  flightProgress,
  settleProgress,
  screenX,
  screenY,
  height,
  rotationX,
  rotationY,
  rotationZ,
  shadowOpacity,
  shadowScale
) {
  return deepFreeze({
    schemaVersion:
      TURN_MARKER_MOTION_SCHEMA_VERSION,
    phase,
    complete,
    elapsedMs,
    localElapsedMs,
    progress,
    flightProgress,
    settleProgress,
    screenX,
    screenY,
    height,
    depth: height,
    position: {
      x: screenX,
      y: screenY,
      z: height,
      height
    },
    rotationX,
    rotationY,
    rotationZ,
    rotationRadians: {
      x: rotationX,
      y: rotationY,
      z: rotationZ
    },
    authoredScale: 1,
    scale: 1,
    shadowOpacity,
    shadowScale,
    shadow: {
      opacity: shadowOpacity,
      scale: shadowScale,
      strength: shadowOpacity,
      spread: shadowScale
    }
  });
}

function terminalPose(
  plan,
  elapsedMs,
  localElapsedMs
) {
  const destination = plan.path.destination;
  const rotation = plan.rotation.terminal;
  return createPose(
    plan,
    'complete',
    true,
    elapsedMs,
    localElapsedMs,
    1,
    1,
    1,
    destination.x,
    destination.y,
    0,
    rotation.x,
    rotation.y,
    rotation.z,
    plan.shadow.strength,
    plan.shadow.spread
  );
}

export function sampleTurnMarkerMotion(
  plan,
  elapsedMs
) {
  assertPlan(plan);
  if (
    typeof elapsedMs !== 'number' ||
    !Number.isFinite(elapsedMs)
  ) {
    throw new TypeError(
      'Turn-marker-motion elapsed time must be finite.'
    );
  }

  const boundedElapsed = Math.max(0, elapsedMs);
  const localElapsed =
    boundedElapsed - plan.timing.delayMs;
  const source = plan.path.source;
  const sourcePose = plan.instance.sourcePose;
  const sourceRotation = plan.rotation.source;

  if (localElapsed <= 0) {
    return createPose(
      plan,
      'waiting',
      false,
      boundedElapsed,
      localElapsed,
      0,
      0,
      0,
      source.x,
      source.y,
      sourcePose.height,
      sourceRotation.x,
      sourceRotation.y,
      sourceRotation.z,
      plan.shadow.sourceOpacity,
      plan.shadow.sourceScale
    );
  }

  if (localElapsed < plan.timing.flightMs) {
    const flightProgress = clamp(
      localElapsed / plan.timing.flightMs,
      0,
      1
    );
    const destination = plan.path.destination;
    const contactRotation =
      plan.rotation.contact;
    const height =
      (
        sourcePose.height *
        (1 - flightProgress)
      ) +
      (
        plan.path.apexHeight *
        4 *
        flightProgress *
        (1 - flightProgress)
      );
    const heightRatio =
      plan.path.apexHeight > 0
        ? clamp(
            height / plan.path.apexHeight,
            0,
            1
          )
        : 0;
    const shadowLift = Math.sqrt(heightRatio);
    const targetShadowOpacity =
      plan.shadow.strength *
      (1 - (0.72 * shadowLift));
    const targetShadowScale =
      plan.shadow.spread *
      (1 + (0.85 * shadowLift));
    const shadowBlend =
      smoothStep(flightProgress);

    return createPose(
      plan,
      'flight',
      false,
      boundedElapsed,
      localElapsed,
      clamp(
        localElapsed / plan.timing.motionMs,
        0,
        1
      ),
      flightProgress,
      0,
      quadraticBezier(
        source.x,
        plan.path.control.x,
        destination.x,
        flightProgress
      ),
      quadraticBezier(
        source.y,
        plan.path.control.y,
        destination.y,
        flightProgress
      ),
      height,
      interpolate(
        sourceRotation.x,
        contactRotation.x,
        flightProgress
      ),
      interpolate(
        sourceRotation.y,
        contactRotation.y,
        flightProgress
      ),
      interpolate(
        sourceRotation.z,
        contactRotation.z,
        flightProgress
      ),
      interpolate(
        plan.shadow.sourceOpacity,
        targetShadowOpacity,
        shadowBlend
      ),
      interpolate(
        plan.shadow.sourceScale,
        targetShadowScale,
        shadowBlend
      )
    );
  }

  if (
    localElapsed <
      plan.timing.motionMs &&
    plan.timing.settleMs > 0
  ) {
    const settleProgress = clamp(
      (
        localElapsed -
        plan.timing.flightMs
      ) / plan.timing.settleMs,
      0,
      1
    );
    const eased = smoothStep(settleProgress);
    const destination = plan.path.destination;
    const contact = plan.rotation.contact;
    const terminal = plan.rotation.terminal;
    return createPose(
      plan,
      'settling',
      false,
      boundedElapsed,
      localElapsed,
      clamp(
        localElapsed / plan.timing.motionMs,
        0,
        1
      ),
      1,
      settleProgress,
      destination.x,
      destination.y,
      0,
      interpolate(
        contact.x,
        terminal.x,
        eased
      ),
      interpolate(
        contact.y,
        terminal.y,
        eased
      ),
      interpolate(
        contact.z,
        terminal.z,
        eased
      ),
      plan.shadow.strength,
      plan.shadow.spread
    );
  }

  return terminalPose(
    plan,
    boundedElapsed,
    localElapsed
  );
}
