import {
  CARD_MOTION_PRESETS,
  CARD_MOTION_SCHEMA_VERSION,
  createCardMotionPlan,
  normalizeCardMotionAuthoringPreset,
  parseCardMotionPreset,
  sampleCardMotion
} from './card-motion.js';

export const LOBBY_MOTION_PLAYBOOK_SCHEMA_VERSION = 1;
export const LOBBY_MOTION_PLAYBOOK_ID = 'lobby-card-motion';
export const LOBBY_WIND_EXIT_TARGET_ID =
  'lobby-hand-gentle-wind-exit';

const PLAYBOOK_KIND = 'purett-lobby-motion-playbook';
const BATCH_KIND = 'purett-lobby-motion-batch';
const PLAN_KIND = 'purett-lobby-motion-plan';
const DEFAULT_WIND_SEED = 'gentle-wind-preview-1';
const MAX_ENTRY_DELAY_MS = 1500;
const EXIT_LEFT_CLEARANCE_PX = 36;
const EXIT_ENDPOINT_JITTER_PX = 150;
const EXIT_HEADING_MIN_DEGREES = -28;
const EXIT_HEADING_MAX_DEGREES = -2;
const EXIT_CARD_ORDER = Object.freeze([4, 3, 2, 1, 0]);

export const LOBBY_INTRO_SHARED_MOTION_FIELDS = deepFreeze([
  'path.releaseHeight',
  'path.apexHeight',
  'path.flightMs',
  'rotation.releasePitchDeg',
  'rotation.releaseYawDeg',
  'rotation.releaseRollDeg',
  'rotation.contactPitchDeg',
  'rotation.contactYawDeg',
  'rotation.contactRollDeg',
  'rotation.xTurns',
  'rotation.yTurns',
  'rotation.zTurns',
  'rotation.finalRollDeg',
  'landing.skidDistancePx',
  'landing.skidAngleDeg',
  'landing.slapMs',
  'landing.skidMs',
  'scale.mode',
  'scale.start',
  'scale.apex',
  'scale.contact',
  'shadow.strength',
  'shadow.spread'
]);

const ROOT_KEYS = Object.freeze([
  'schemaVersion',
  'id',
  'label',
  'targets',
  'wind'
]);
const ENTRY_KEYS = Object.freeze([
  'targetId',
  'delayMs',
  'preset'
]);
const WIND_KEYS = Object.freeze([
  'locked',
  'seed'
]);

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }
  Object.keys(value).forEach((key) => deepFreeze(value[key]));
  return Object.freeze(value);
}

function clonePlain(value) {
  return value == null
    ? value
    : JSON.parse(JSON.stringify(value));
}

function isRecord(value) {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function finiteNumber(value, fallback, minimum, maximum) {
  const converted = typeof value === 'string' && value.trim() !== ''
    ? Number(value)
    : value;
  return clamp(
    Number.isFinite(converted) ? converted : fallback,
    minimum,
    maximum
  );
}

function normalizeSeed(value, fallback) {
  const normalized = String(value == null ? fallback : value)
    .trim()
    .slice(0, 100);
  return normalized || fallback;
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

function replacePresetFields(preset, changes) {
  const candidate = clonePlain(preset);
  Object.keys(changes).forEach((path) => {
    const parts = path.split('.');
    let target = candidate;
    for (let index = 0; index < parts.length - 1; index += 1) {
      target = target[parts[index]];
    }
    target[parts[parts.length - 1]] = changes[path];
  });
  return candidate;
}

function getPresetField(preset, path) {
  return path.split('.').reduce(
    (value, part) => value[part],
    preset
  );
}

function createTargetDefinitions() {
  const targets = [];
  for (let slotIndex = 0; slotIndex < 5; slotIndex += 1) {
    targets.push({
      id: `lobby-card-${slotIndex + 1}-intro`,
      label: `Lobby card ${slotIndex + 1} — Intro`,
      kind: 'intro',
      slotIndex,
      sequenceLevel: false,
      lockedAnchor: 'lobby-slot-destination'
    });
  }
  targets.push({
    id: LOBBY_WIND_EXIT_TARGET_ID,
    label: 'Lobby hand — Gentle Wind Exit',
    kind: 'exit',
    slotIndex: null,
    sequenceLevel: true,
    lockedAnchor: 'lobby-slot-origin'
  });
  return targets;
}

export const LOBBY_MOTION_TARGETS = deepFreeze(
  createTargetDefinitions()
);

const TARGET_BY_ID = new Map(
  LOBBY_MOTION_TARGETS.map((target) => [target.id, target])
);

export const LOBBY_WIND_VARIATION = deepFreeze({
  profile: 'gentle-wind',
  exitRegion: 'lower-left-offscreen',
  headingDegrees: {
    minimum: EXIT_HEADING_MIN_DEGREES,
    maximum: EXIT_HEADING_MAX_DEGREES,
    sharedJitter: 2.5,
    cardJitter: 3.5
  },
  distanceJitterPx: 45,
  endpointJitterPx: EXIT_ENDPOINT_JITTER_PX,
  curveJitterPx: 34,
  releaseHeightJitter: 18,
  apexHeightJitter: 28,
  flightSpeed: {
    minimum: 0.9,
    maximum: 1.1
  },
  delayJitterMs: 28,
  releasePitchJitterDeg: 7,
  releaseYawJitterDeg: 6,
  releaseRollJitterDeg: 13,
  xTurnsJitter: 0.16,
  yTurnsJitter: 0.12,
  zTurnsJitter: 0.14,
  cardOrder: EXIT_CARD_ORDER.slice(0)
});

function targetDefinition(targetId) {
  const target = TARGET_BY_ID.get(String(targetId));
  if (!target) {
    throw new Error(`Unknown lobby motion target "${targetId}".`);
  }
  return target;
}

function constrainPreset(rawPreset, target) {
  const normalized = normalizeCardMotionAuthoringPreset(rawPreset);
  const changes = {
    id: target.id,
    label: target.label,
    'path.landingXPx': 0,
    'path.landingYPx': 0,
    'scale.cardScale': 1,
    'scale.end': 1
  };
  if (target.kind === 'exit') {
    changes['path.directionDeg'] = clamp(
      normalized.path.directionDeg,
      EXIT_HEADING_MIN_DEGREES,
      EXIT_HEADING_MAX_DEGREES
    );
    changes['rotation.finalRollDeg'] = 0;
  }
  return normalizeCardMotionAuthoringPreset(
    replacePresetFields(normalized, changes)
  );
}

function introDefaultPreset(slotIndex) {
  const startDistances = [250, 375, 500, 625, 750];
  const target = targetDefinition(
    `lobby-card-${slotIndex + 1}-intro`
  );
  return constrainPreset(
    replacePresetFields(CARD_MOTION_PRESETS.casualToss, {
      id: target.id,
      label: target.label,
      'path.distancePx': startDistances[slotIndex],
      'rotation.finalRollDeg': 0
    }),
    target
  );
}

function windDefaultPreset() {
  const target = targetDefinition(LOBBY_WIND_EXIT_TARGET_ID);
  return constrainPreset(
    replacePresetFields(CARD_MOTION_PRESETS.gentleDrop, {
      id: target.id,
      label: target.label,
      'path.directionDeg': -11,
      'path.distancePx': 820,
      'path.curvePx': 72,
      'path.releaseHeight': 118,
      'path.apexHeight': 205,
      'path.flightMs': 980,
      'rotation.releasePitchDeg': 27,
      'rotation.releaseYawDeg': -8,
      'rotation.releaseRollDeg': -12,
      'rotation.contactPitchDeg': 7,
      'rotation.contactYawDeg': 2,
      'rotation.contactRollDeg': 2,
      'rotation.xTurns': 0.3,
      'rotation.yTurns': 0.08,
      'rotation.zTurns': 0.16,
      'rotation.finalRollDeg': 0,
      'landing.skidDistancePx': 14,
      'landing.skidAngleDeg': -7,
      'landing.slapMs': 75,
      'landing.skidMs': 165,
      'shadow.strength': 0.36,
      'shadow.spread': 1.12
    }),
    target
  );
}

function createDefaultPlaybookSource() {
  const targets = {};
  const introDelays = [0, 105, 220, 340, 465];
  for (let slotIndex = 0; slotIndex < 5; slotIndex += 1) {
    const targetId = `lobby-card-${slotIndex + 1}-intro`;
    targets[targetId] = {
      targetId,
      delayMs: introDelays[slotIndex],
      preset: introDefaultPreset(slotIndex)
    };
  }
  targets[LOBBY_WIND_EXIT_TARGET_ID] = {
    targetId: LOBBY_WIND_EXIT_TARGET_ID,
    delayMs: 90,
    preset: windDefaultPreset()
  };
  return {
    schemaVersion: LOBBY_MOTION_PLAYBOOK_SCHEMA_VERSION,
    id: LOBBY_MOTION_PLAYBOOK_ID,
    label: 'Lobby Card Motion Playbook',
    targets,
    wind: {
      locked: false,
      seed: DEFAULT_WIND_SEED
    }
  };
}

export const DEFAULT_LOBBY_MOTION_PLAYBOOK = deepFreeze(
  createDefaultPlaybookSource()
);

function normalizeEntry(rawEntry, target, fallbackEntry) {
  const source = isRecord(rawEntry) ? rawEntry : {};
  return {
    targetId: target.id,
    delayMs: finiteNumber(
      source.delayMs,
      fallbackEntry.delayMs,
      0,
      MAX_ENTRY_DELAY_MS
    ),
    preset: constrainPreset(
      source.preset || fallbackEntry.preset,
      target
    )
  };
}

export function normalizeLobbyMotionPlaybook(raw) {
  const source = isRecord(raw) ? raw : {};
  if (source.schemaVersion != null &&
      Number(source.schemaVersion) !==
        LOBBY_MOTION_PLAYBOOK_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported lobby motion playbook schema version ` +
      `"${source.schemaVersion}".`
    );
  }
  const sourceTargets = isRecord(source.targets)
    ? source.targets
    : {};
  const targets = {};
  LOBBY_MOTION_TARGETS.forEach((target) => {
    targets[target.id] = normalizeEntry(
      sourceTargets[target.id],
      target,
      DEFAULT_LOBBY_MOTION_PLAYBOOK.targets[target.id]
    );
  });
  const wind = isRecord(source.wind) ? source.wind : {};
  return deepFreeze({
    kind: PLAYBOOK_KIND,
    schemaVersion: LOBBY_MOTION_PLAYBOOK_SCHEMA_VERSION,
    id: LOBBY_MOTION_PLAYBOOK_ID,
    label: String(source.label || 'Lobby Card Motion Playbook')
      .trim()
      .slice(0, 100) || 'Lobby Card Motion Playbook',
    targets,
    wind: {
      locked: wind.locked === true,
      seed: normalizeSeed(
        wind.seed,
        DEFAULT_LOBBY_MOTION_PLAYBOOK.wind.seed
      )
    }
  });
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

function validateStrictPlaybook(raw) {
  assertExactKeys(raw, ROOT_KEYS, 'Lobby motion playbook');
  if (raw.schemaVersion !== LOBBY_MOTION_PLAYBOOK_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported lobby motion playbook schema version ` +
      `"${raw.schemaVersion}".`
    );
  }
  if (raw.id !== LOBBY_MOTION_PLAYBOOK_ID) {
    throw new Error(
      `Lobby motion playbook id must be "${LOBBY_MOTION_PLAYBOOK_ID}".`
    );
  }
  if (typeof raw.label !== 'string' ||
      !raw.label.trim() ||
      raw.label.length > 100) {
    throw new TypeError(
      'Lobby motion playbook label must be a non-empty string.'
    );
  }
  assertExactKeys(raw.wind, WIND_KEYS, 'Lobby motion playbook wind');
  if (typeof raw.wind.locked !== 'boolean') {
    throw new TypeError(
      'Lobby motion playbook wind.locked must be boolean.'
    );
  }
  if (typeof raw.wind.seed !== 'string' ||
      !raw.wind.seed.trim() ||
      raw.wind.seed.length > 100) {
    throw new TypeError(
      'Lobby motion playbook wind.seed must be a non-empty string.'
    );
  }
  if (!isRecord(raw.targets)) {
    throw new TypeError(
      'Lobby motion playbook targets must be an object.'
    );
  }
  const actualTargetIds = Object.keys(raw.targets).sort();
  const expectedTargetIds = LOBBY_MOTION_TARGETS
    .map((target) => target.id)
    .sort();
  if (actualTargetIds.length !== expectedTargetIds.length ||
      actualTargetIds.some(
        (targetId, index) => targetId !== expectedTargetIds[index]
      )) {
    throw new Error(
      'Lobby motion playbook targets do not match the application registry.'
    );
  }
  LOBBY_MOTION_TARGETS.forEach((target) => {
    const entry = raw.targets[target.id];
    assertExactKeys(
      entry,
      ENTRY_KEYS,
      `Lobby motion target ${target.id}`
    );
    if (entry.targetId !== target.id) {
      throw new Error(
        `Lobby motion target ${target.id} has a mismatched targetId.`
      );
    }
    if (typeof entry.delayMs !== 'number' ||
        !Number.isFinite(entry.delayMs) ||
        entry.delayMs < 0 ||
        entry.delayMs > MAX_ENTRY_DELAY_MS) {
      throw new RangeError(
        `Lobby motion target ${target.id} delayMs must be between ` +
        `0 and ${MAX_ENTRY_DELAY_MS}.`
      );
    }
    const preset = parseCardMotionPreset(
      JSON.stringify(entry.preset)
    );
    if (preset.path.landingXPx !== 0 ||
        preset.path.landingYPx !== 0) {
      throw new Error(
        `Lobby motion target ${target.id} cannot move its locked anchor.`
      );
    }
    if (preset.scale.cardScale !== 1 ||
        preset.scale.end !== 1) {
      throw new Error(
        `Lobby motion target ${target.id} must settle at application scale.`
      );
    }
    if (target.kind === 'exit' &&
        preset.rotation.finalRollDeg !== 0) {
      throw new Error(
        'The Gentle Wind exit must begin at the application-owned rotation.'
      );
    }
  });
}

export function parseLobbyMotionPlaybook(serialized) {
  if (typeof serialized !== 'string') {
    throw new TypeError(
      'Lobby motion playbook JSON must be a string.'
    );
  }
  let parsed;
  try {
    parsed = JSON.parse(serialized);
  } catch (error) {
    throw new SyntaxError('Lobby motion playbook JSON is invalid.');
  }
  validateStrictPlaybook(parsed);
  return normalizeLobbyMotionPlaybook(parsed);
}

export function serializeLobbyMotionPlaybook(playbook) {
  const normalized = normalizeLobbyMotionPlaybook(playbook);
  const serializable = {
    schemaVersion: normalized.schemaVersion,
    id: normalized.id,
    label: normalized.label,
    targets: {},
    wind: clonePlain(normalized.wind)
  };
  LOBBY_MOTION_TARGETS.forEach((target) => {
    serializable.targets[target.id] = clonePlain(
      normalized.targets[target.id]
    );
  });
  return JSON.stringify(serializable, null, 2);
}

export function getLobbyMotionTarget(playbook, targetId) {
  const normalized = normalizeLobbyMotionPlaybook(playbook);
  const target = targetDefinition(targetId);
  return normalized.targets[target.id];
}

export function updateLobbyMotionTarget(
  playbook,
  targetId,
  preset,
  delayMs
) {
  const normalized = normalizeLobbyMotionPlaybook(playbook);
  const target = targetDefinition(targetId);
  const next = JSON.parse(serializeLobbyMotionPlaybook(normalized));
  next.targets[target.id] = {
    targetId: target.id,
    delayMs: finiteNumber(
      delayMs,
      normalized.targets[target.id].delayMs,
      0,
      MAX_ENTRY_DELAY_MS
    ),
    preset: clonePlain(constrainPreset(preset, target))
  };
  return normalizeLobbyMotionPlaybook(next);
}

export function copyLobbyIntroSharedMotion(
  playbook,
  sourceTargetId,
  destinationTargetIds
) {
  const normalized = normalizeLobbyMotionPlaybook(playbook);
  const sourceTarget = targetDefinition(sourceTargetId);
  if (sourceTarget.kind !== 'intro') {
    throw new Error(
      'Shared lobby motion can only be copied from an intro target.'
    );
  }
  if (!Array.isArray(destinationTargetIds) ||
      destinationTargetIds.length === 0) {
    throw new Error(
      'Choose at least one lobby intro destination.'
    );
  }

  const destinations = [];
  const seen = new Set();
  destinationTargetIds.forEach((destinationTargetId) => {
    const destinationTarget = targetDefinition(destinationTargetId);
    if (destinationTarget.kind !== 'intro') {
      throw new Error(
        'Shared lobby motion can only be copied to intro targets.'
      );
    }
    if (destinationTarget.id === sourceTarget.id) {
      throw new Error(
        'The source lobby intro cannot also be a copy destination.'
      );
    }
    if (seen.has(destinationTarget.id)) {
      throw new Error(
        `Lobby intro destination "${destinationTarget.id}" is duplicated.`
      );
    }
    seen.add(destinationTarget.id);
    destinations.push(destinationTarget);
  });

  const sourcePreset =
    normalized.targets[sourceTarget.id].preset;
  const sharedChanges = {};
  LOBBY_INTRO_SHARED_MOTION_FIELDS.forEach((path) => {
    sharedChanges[path] = clonePlain(
      getPresetField(sourcePreset, path)
    );
  });

  let next = normalized;
  destinations.forEach((destinationTarget) => {
    const destinationEntry =
      next.targets[destinationTarget.id];
    next = updateLobbyMotionTarget(
      next,
      destinationTarget.id,
      replacePresetFields(
        destinationEntry.preset,
        sharedChanges
      ),
      destinationEntry.delayMs
    );
  });
  return next;
}

export function updateLobbyWindSeed(playbook, seed, locked) {
  const next = JSON.parse(
    serializeLobbyMotionPlaybook(playbook)
  );
  next.wind.seed = normalizeSeed(
    seed,
    DEFAULT_WIND_SEED
  );
  next.wind.locked = locked === true;
  return normalizeLobbyMotionPlaybook(next);
}

function normalizeAnchor(card, index) {
  const destination = isRecord(card && card.destination)
    ? card.destination
    : null;
  const width = finiteNumber(
    card && card.width,
    117,
    1,
    1000
  );
  const height = finiteNumber(
    card && card.height,
    146,
    1,
    1000
  );
  const x = destination
    ? Number(destination.x)
    : Number(card && card.x) + (width / 2);
  const y = destination
    ? Number(destination.y)
    : Number(card && card.y) + (height / 2);
  const z = destination && Number.isFinite(Number(destination.z))
    ? Number(destination.z)
    : 0;
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error(
      `Lobby card ${index + 1} is missing its application anchor.`
    );
  }
  const cardIndex = Number.isFinite(Number(card && card.index))
    ? Number(card.index)
    : index;
  if (!Number.isInteger(cardIndex) ||
      cardIndex < 0 ||
      cardIndex > 4) {
    throw new RangeError(
      `Lobby card ${index + 1} must use a slot index from 0 through 4.`
    );
  }
  return {
    cardIndex,
    width,
    height,
    rotationDegrees: Number.isFinite(
      Number(card && card.rotationDegrees)
    )
      ? Number(card.rotationDegrees)
      : 0,
    destination: {x, y, z}
  };
}

function varyWindPreset(basePreset, anchor, shared, cardRandom) {
  const heading = clamp(
    basePreset.path.directionDeg +
      shared.headingDelta +
      randomBetween(
        cardRandom,
        -LOBBY_WIND_VARIATION.headingDegrees.cardJitter,
        LOBBY_WIND_VARIATION.headingDegrees.cardJitter
      ),
    EXIT_HEADING_MIN_DEGREES,
    EXIT_HEADING_MAX_DEGREES
  );
  const headingRadians = heading * Math.PI / 180;
  const minimumDistance =
    (
      anchor.destination.x +
      (anchor.width / 2) +
      EXIT_LEFT_CLEARANCE_PX
    ) /
    Math.max(0.25, Math.cos(headingRadians));
  const authoredDistance =
    basePreset.path.distancePx * shared.strength;
  const endpointVariance = randomBetween(
    cardRandom,
    0,
    EXIT_ENDPOINT_JITTER_PX
  );
  const distance = Math.max(
    minimumDistance + endpointVariance,
    authoredDistance +
      randomBetween(
        cardRandom,
        -LOBBY_WIND_VARIATION.distanceJitterPx,
        LOBBY_WIND_VARIATION.distanceJitterPx
      )
  );
  const releaseHeight = clamp(
    basePreset.path.releaseHeight * shared.lift +
      randomBetween(
        cardRandom,
        -LOBBY_WIND_VARIATION.releaseHeightJitter,
        LOBBY_WIND_VARIATION.releaseHeightJitter
      ),
    0,
    300
  );
  const apexHeight = clamp(
    Math.max(
      releaseHeight,
      basePreset.path.apexHeight * shared.lift +
        randomBetween(
          cardRandom,
          -LOBBY_WIND_VARIATION.apexHeightJitter,
          LOBBY_WIND_VARIATION.apexHeightJitter
        )
    ),
    releaseHeight,
    400
  );
  const flightSpeed = shared.strength * randomBetween(
    cardRandom,
    LOBBY_WIND_VARIATION.flightSpeed.minimum,
    LOBBY_WIND_VARIATION.flightSpeed.maximum
  );
  return constrainPreset(
    replacePresetFields(basePreset, {
      'path.directionDeg': heading,
      'path.distancePx': clamp(distance, 0, 1000),
      'path.curvePx': clamp(
        basePreset.path.curvePx +
          shared.curveDelta +
          randomBetween(
            cardRandom,
            -LOBBY_WIND_VARIATION.curveJitterPx,
            LOBBY_WIND_VARIATION.curveJitterPx
          ),
        -300,
        300
      ),
      'path.releaseHeight': releaseHeight,
      'path.apexHeight': apexHeight,
      'path.flightMs': clamp(
        basePreset.path.flightMs / flightSpeed,
        200,
        2500
      ),
      'rotation.releasePitchDeg': clamp(
        basePreset.rotation.releasePitchDeg +
          randomBetween(
            cardRandom,
            -LOBBY_WIND_VARIATION.releasePitchJitterDeg,
            LOBBY_WIND_VARIATION.releasePitchJitterDeg
          ),
        -75,
        75
      ),
      'rotation.releaseYawDeg': clamp(
        basePreset.rotation.releaseYawDeg +
          randomBetween(
            cardRandom,
            -LOBBY_WIND_VARIATION.releaseYawJitterDeg,
            LOBBY_WIND_VARIATION.releaseYawJitterDeg
          ),
        -75,
        75
      ),
      'rotation.releaseRollDeg': clamp(
        basePreset.rotation.releaseRollDeg +
          randomBetween(
            cardRandom,
            -LOBBY_WIND_VARIATION.releaseRollJitterDeg,
            LOBBY_WIND_VARIATION.releaseRollJitterDeg
          ),
        -180,
        180
      ),
      'rotation.xTurns': clamp(
        basePreset.rotation.xTurns +
          randomBetween(
            cardRandom,
            -LOBBY_WIND_VARIATION.xTurnsJitter,
            LOBBY_WIND_VARIATION.xTurnsJitter
          ),
        -3,
        3
      ),
      'rotation.yTurns': clamp(
        basePreset.rotation.yTurns +
          randomBetween(
            cardRandom,
            -LOBBY_WIND_VARIATION.yTurnsJitter,
            LOBBY_WIND_VARIATION.yTurnsJitter
          ),
        -3,
        3
      ),
      'rotation.zTurns': clamp(
        basePreset.rotation.zTurns +
          randomBetween(
            cardRandom,
            -LOBBY_WIND_VARIATION.zTurnsJitter,
            LOBBY_WIND_VARIATION.zTurnsJitter
          ),
        -2,
        2
      )
    }),
    targetDefinition(LOBBY_WIND_EXIT_TARGET_ID)
  );
}

function createIntroPlan(playbook, anchor, request) {
  const targetId = `lobby-card-${anchor.cardIndex + 1}-intro`;
  const entry = playbook.targets[targetId];
  if (!entry) {
    throw new Error(
      `Lobby intro target "${targetId}" is unavailable.`
    );
  }
  const plan = createCardMotionPlan(entry.preset, {
    destination: anchor.destination,
    delayMs: entry.delayMs
  });
  return deepFreeze({
    kind: PLAN_KIND,
    sequence: 'intro',
    targetId,
    cardIndex: anchor.cardIndex,
    seed: request.seed,
    delayMs: entry.delayMs,
    motionPlan: plan,
    durationMs: plan.timing.motionMs,
    totalMs: plan.timing.totalMs,
    anchor: clonePlain(anchor.destination),
    endpoint: clonePlain(plan.path.destination),
    effectivePreset: entry.preset
  });
}

function createExitPlan(
  playbook,
  anchor,
  request,
  shared,
  orderIndex
) {
  const entry = playbook.targets[LOBBY_WIND_EXIT_TARGET_ID];
  const cardSeed = mixSeed(
    request.seed,
    LOBBY_WIND_EXIT_TARGET_ID,
    anchor.cardIndex
  );
  const random = createSeededRandom(cardSeed);
  const variedPreset = varyWindPreset(
    entry.preset,
    anchor,
    shared,
    random
  );
  const effectivePreset = normalizeCardMotionAuthoringPreset(
    replacePresetFields(variedPreset, {
      'rotation.finalRollDeg': clamp(
        anchor.rotationDegrees,
        -30,
        30
      )
    })
  );
  const cadence = entry.delayMs * shared.cadence;
  const delayMs = Math.max(
    0,
    Math.round(
      orderIndex * cadence +
      randomBetween(
        random,
        -LOBBY_WIND_VARIATION.delayJitterMs,
        LOBBY_WIND_VARIATION.delayJitterMs
      )
    )
  );
  const plan = createCardMotionPlan(effectivePreset, {
    destination: anchor.destination,
    delayMs: 0
  });
  return deepFreeze({
    kind: PLAN_KIND,
    sequence: 'exit',
    targetId: LOBBY_WIND_EXIT_TARGET_ID,
    cardIndex: anchor.cardIndex,
    seed: String(cardSeed),
    delayMs,
    motionPlan: plan,
    durationMs: plan.timing.motionMs,
    totalMs: delayMs + plan.timing.motionMs,
    anchor: clonePlain(anchor.destination),
    endpoint: clonePlain(plan.path.start),
    effectivePreset
  });
}

export function createLobbyMotionBatch(
  rawPlaybook,
  sequence,
  cards,
  request
) {
  if (sequence !== 'intro' && sequence !== 'exit') {
    throw new Error(
      `Unknown lobby motion sequence "${sequence}".`
    );
  }
  const playbook = normalizeLobbyMotionPlaybook(rawPlaybook);
  const normalizedCards = (cards || [])
    .slice(0, 5)
    .map(normalizeAnchor);
  if (new Set(
    normalizedCards.map((card) => card.cardIndex)
  ).size !== normalizedCards.length) {
    throw new Error(
      'Lobby motion cards must use distinct application slot indices.'
    );
  }
  const requestSource = isRecord(request) ? request : {};
  const seed = normalizeSeed(
    requestSource.seed,
    playbook.wind.seed
  );
  const normalizedRequest = {
    id: String(
      requestSource.id == null
        ? `${sequence}-${seed}`
        : requestSource.id
    ),
    trigger: String(
      requestSource.trigger ||
      (sequence === 'intro'
        ? 'command-bar-reveal'
        : 'lobby-command')
    ),
    seed
  };
  let plans;
  let shared = null;
  if (sequence === 'intro') {
    plans = normalizedCards.map((anchor) => (
      createIntroPlan(playbook, anchor, normalizedRequest)
    ));
  } else {
    const sharedRandom = createSeededRandom(
      mixSeed(seed, 'gentle-wind-shared-gust')
    );
    shared = deepFreeze({
      headingDelta: randomBetween(
        sharedRandom,
        -LOBBY_WIND_VARIATION.headingDegrees.sharedJitter,
        LOBBY_WIND_VARIATION.headingDegrees.sharedJitter
      ),
      strength: randomBetween(sharedRandom, 0.94, 1.06),
      lift: randomBetween(sharedRandom, 0.94, 1.08),
      curveDelta: randomBetween(sharedRandom, -18, 18),
      cadence: randomBetween(sharedRandom, 0.9, 1.12)
    });
    const orderIndexByCard = new Map(
      EXIT_CARD_ORDER.map((cardIndex, orderIndex) => (
        [cardIndex, orderIndex]
      ))
    );
    plans = normalizedCards.map((anchor) => (
      createExitPlan(
        playbook,
        anchor,
        normalizedRequest,
        shared,
        orderIndexByCard.get(anchor.cardIndex)
      )
    ));
  }
  const totalDurationMs = plans.reduce(
    (maximum, plan) => Math.max(maximum, plan.totalMs),
    0
  );
  return deepFreeze({
    kind: BATCH_KIND,
    schemaVersion: LOBBY_MOTION_PLAYBOOK_SCHEMA_VERSION,
    requestId: normalizedRequest.id,
    sequence,
    trigger: normalizedRequest.trigger,
    seed,
    shared,
    totalDurationMs,
    deadlineMs: totalDurationMs + 500,
    plans
  });
}

function assertMotionPlan(plan) {
  if (!plan || plan.kind !== PLAN_KIND) {
    throw new TypeError(
      'sampleLobbyMotionPlan requires a lobby motion plan.'
    );
  }
}

export function sampleLobbyMotionPlan(plan, elapsedMs) {
  assertMotionPlan(plan);
  if (!Number.isFinite(elapsedMs)) {
    throw new TypeError(
      'Lobby motion elapsed time must be finite.'
    );
  }
  const elapsed = Math.max(0, elapsedMs);
  if (plan.sequence === 'intro') {
    const pose = sampleCardMotion(plan.motionPlan, elapsed);
    return Object.assign({}, pose, {
      sequence: 'intro',
      phase: pose.phase === 'settled'
        ? 'settled'
        : `intro-${pose.phase}`,
      complete: pose.complete
    });
  }

  const localElapsed = elapsed - plan.delayMs;
  const motionDuration = plan.motionPlan.timing.motionMs;
  if (localElapsed <= 0) {
    const waitingPose = sampleCardMotion(
      plan.motionPlan,
      motionDuration
    );
    return Object.assign({}, waitingPose, {
      sequence: 'exit',
      phase: 'exit-waiting',
      complete: false,
      elapsedMs: elapsed,
      localElapsedMs: localElapsed
    });
  }
  const reverseElapsed = Math.max(
    0,
    motionDuration - localElapsed
  );
  const pose = sampleCardMotion(
    plan.motionPlan,
    reverseElapsed
  );
  const complete = localElapsed >= motionDuration;
  return Object.assign({}, pose, {
    sequence: 'exit',
    phase: complete ? 'exited' : `exit-${pose.phase}`,
    complete,
    elapsedMs: elapsed,
    localElapsedMs: localElapsed,
    progress: clamp(localElapsed / motionDuration, 0, 1)
  });
}

export function getLobbyMotionTargetDefinition(targetId) {
  return targetDefinition(targetId);
}

export function getLobbyMotionTargetForCard(
  sequence,
  cardIndex
) {
  if (sequence === 'intro') {
    return targetDefinition(
      `lobby-card-${Number(cardIndex) + 1}-intro`
    );
  }
  if (sequence === 'exit') {
    return targetDefinition(LOBBY_WIND_EXIT_TARGET_ID);
  }
  throw new Error(
    `Unknown lobby motion sequence "${sequence}".`
  );
}

export const LOBBY_MOTION_PLAYBOOK_METADATA = deepFreeze({
  kind: PLAYBOOK_KIND,
  schemaVersion: LOBBY_MOTION_PLAYBOOK_SCHEMA_VERSION,
  cardMotionSchemaVersion: CARD_MOTION_SCHEMA_VERSION,
  applicationTargetCount: LOBBY_MOTION_TARGETS.length,
  introTargetCount: 5,
  exitTargetCount: 1,
  exitInstanceCount: 5,
  anchorsSerialized: false,
  randomnessPolicy:
    'one-explicit-sequence-seed-with-stable-per-card-derivation',
  landingPolicy:
    'application-owned-intro-destination-and-exit-origin'
});
