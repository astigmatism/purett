import {
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  CylinderGeometry,
  DirectionalLight,
  FrontSide,
  Group,
  HemisphereLight,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  REVISION,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  WebGLRenderer
} from 'three';
import {
  CARD_MOTION_PRESETS,
  createCardMotionPlan,
  normalizeCardMotionAuthoringPreset,
  sampleCardMotion
} from './card-motion.js';
import {
  DEFAULT_TURN_MARKER_MOTION_PROFILE,
  TURN_MARKER_MATCH_CENTERS,
  createTurnMarkerMotionPlan,
  normalizeTurnMarkerMotionProfile,
  sampleTurnMarkerMotion
} from './turn-marker-motion.js';

const STUDIO_LOGICAL_WIDTH = 755;
const STUDIO_LOGICAL_HEIGHT = 562;
const STUDIO_MATCH_VIEWPORT_X = 30;
const STUDIO_MATCH_VIEWPORT_Y = 30;
const STUDIO_MATCH_LOGICAL_WIDTH = 693;
const STUDIO_MATCH_LOGICAL_HEIGHT = 500;
const STUDIO_CAMERA_FOV = 40;
const STUDIO_CAMERA_CENTER_X = STUDIO_LOGICAL_WIDTH / 2;
const STUDIO_CAMERA_CENTER_Y = STUDIO_LOGICAL_HEIGHT / 2;
const STUDIO_CAMERA_DISTANCE =
  (STUDIO_LOGICAL_HEIGHT / 2) /
  Math.tan((STUDIO_CAMERA_FOV * Math.PI / 180) / 2);
const STUDIO_DESTINATION = Object.freeze({
  x: 430,
  y: 285,
  z: 0
});
const STUDIO_CARD_WIDTH = 117;
const STUDIO_CARD_HEIGHT = 146;
const STUDIO_CARD_THICKNESS = 3;
const STUDIO_FACE_CLEARANCE = 0.2;
const STUDIO_FACE_OFFSET =
  (STUDIO_CARD_THICKNESS / 2) + STUDIO_FACE_CLEARANCE;
const STUDIO_COIN_DIAMETER = 41;
const STUDIO_COIN_RADIUS = STUDIO_COIN_DIAMETER / 2;
const STUDIO_COIN_THICKNESS = 3;
const STUDIO_COIN_FACE_CLEARANCE = 0.08;
const STUDIO_COIN_FACE_OFFSET =
  (STUDIO_COIN_THICKNESS / 2) + STUDIO_COIN_FACE_CLEARANCE;
const STUDIO_MATCH_CAMERA_CENTER_X =
  STUDIO_MATCH_LOGICAL_WIDTH / 2;
const STUDIO_MATCH_CAMERA_CENTER_Y =
  STUDIO_MATCH_LOGICAL_HEIGHT / 2;
const STUDIO_MATCH_CAMERA_DISTANCE =
  (STUDIO_MATCH_LOGICAL_HEIGHT / 2) /
  Math.tan((STUDIO_CAMERA_FOV * Math.PI / 180) / 2);
const STUDIO_SHADOW_Z = -4;
const STUDIO_CAMERA_SAFETY_MARGIN = 90;
const STUDIO_CAMERA_VALIDATION_SAMPLES = 240;
const MAX_PIXEL_RATIO = 3;
const DEFAULT_CARD_BACK_URL = '/images/cards/cardBack.png';
const DEFAULT_COIN_TEXTURE_URL = '/images/dime-heads.png';

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function clonePlain(value) {
  return value == null
    ? value
    : JSON.parse(JSON.stringify(value));
}

function freezePlain(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }
  Object.keys(value).forEach((key) => freezePlain(value[key]));
  return Object.freeze(value);
}

function cardDepthMetrics(
  width,
  height,
  faceOffset,
  rotationX,
  rotationY,
  rotationZ,
  scale
) {
  const cosineX = Math.cos(rotationX);
  const sineX = Math.sin(rotationX);
  const cosineY = Math.cos(rotationY);
  const sineY = Math.sin(rotationY);
  const cosineZ = Math.cos(rotationZ);
  const sineZ = Math.sin(rotationZ);

  // These are the Z-row coefficients from Three.js' default XYZ Euler
  // matrix. Including rotationZ matters whenever pitch and yaw are also
  // present; it changes which card corner is closest to the camera.
  const depthX =
    (sineX * sineZ) -
    (cosineX * cosineZ * sineY);
  const depthY =
    (sineX * cosineZ) +
    (cosineX * sineZ * sineY);
  const depthZ = cosineX * cosineY;
  const halfDepthSpan =
    ((width / 2) * Math.abs(depthX)) +
    ((height / 2) * Math.abs(depthY)) +
    (faceOffset * Math.abs(depthZ));
  const scaledSpan = halfDepthSpan * scale;
  const visibleCenter = Math.abs(depthZ * faceOffset) * scale;

  return {
    minimum: -scaledSpan,
    maximum: scaledSpan,
    visibleCenter,
    normalDepth: depthZ
  };
}

function visibleFaceForDepth(normalDepth) {
  return normalDepth >= 0
    ? 'Front'
    : 'Back';
}

function finitePoint(raw, fallback) {
  const source = raw && typeof raw === 'object'
    ? raw
    : {};
  return {
    x: Number.isFinite(Number(source.x))
      ? Number(source.x)
      : fallback.x,
    y: Number.isFinite(Number(source.y))
      ? Number(source.y)
      : fallback.y,
    z: Number.isFinite(Number(source.z))
      ? Number(source.z)
      : fallback.z
  };
}

function matchCenter(name, fallback) {
  const source = TURN_MARKER_MATCH_CENTERS &&
    TURN_MARKER_MATCH_CENTERS[name];
  return finitePoint(source, fallback);
}

function normalizeCoinDescriptor(coin) {
  const source = coin && typeof coin === 'object'
    ? coin
    : {};
  const direction = String(source.direction || '')
    .trim()
    .toLowerCase();
  const player = matchCenter(
    'player',
    {x: 53.5, y: 440.5, z: 0}
  );
  const opponent = matchCenter(
    'opponent',
    matchCenter('ai', {x: 641.5, y: 440.5, z: 0})
  );
  const reversed =
    direction === 'opponent-to-player' ||
    direction === 'ai-to-player' ||
    direction === 'right-to-left';
  const defaultSource = reversed ? opponent : player;
  const defaultDestination = reversed ? player : opponent;
  const textureUrl = String(
    source.textureUrl || DEFAULT_COIN_TEXTURE_URL
  );
  const normalizedSource = finitePoint(
    source.source,
    defaultSource
  );
  const normalizedDestination = finitePoint(
    source.destination,
    defaultDestination
  );
  const resolvedReversed = direction
    ? reversed
    : normalizedDestination.x < normalizedSource.x;

  if (!textureUrl) {
    throw new Error(
      'The Motion Studio coin is missing its face texture.'
    );
  }

  return {
    textureUrl,
    source: normalizedSource,
    destination: normalizedDestination,
    direction: resolvedReversed
      ? 'opponent-to-player'
      : 'player-to-opponent'
  };
}

function samePoint(first, second) {
  return Boolean(
    first &&
    second &&
    first.x === second.x &&
    first.y === second.y &&
    first.z === second.z
  );
}

function sameCoinDescriptor(first, second) {
  return Boolean(
    first &&
    second &&
    first.textureUrl === second.textureUrl &&
    first.direction === second.direction &&
    samePoint(first.source, second.source) &&
    samePoint(first.destination, second.destination)
  );
}

function normalizeStudioContext(context) {
  const source = context && typeof context === 'object'
    ? context
    : {};
  const destination = source.destination &&
      typeof source.destination === 'object'
    ? source.destination
    : STUDIO_DESTINATION;
  return {
    direction: source.direction === 'exit' ? 'exit' : 'intro',
    destination: {
      x: Number.isFinite(Number(destination.x))
        ? Number(destination.x)
        : STUDIO_DESTINATION.x,
      y: Number.isFinite(Number(destination.y))
        ? Number(destination.y)
        : STUDIO_DESTINATION.y,
      z: Number.isFinite(Number(destination.z))
        ? Number(destination.z)
        : STUDIO_DESTINATION.z
    },
    delayMs: clamp(Number(source.delayMs) || 0, 0, 1500),
    targetId: source.targetId == null
      ? null
      : String(source.targetId)
  };
}

function planDuration(plan) {
  if (!plan) {
    return 0;
  }
  const timing = plan.timing || {};
  const candidates = [
    timing.totalMs,
    plan.totalMs,
    plan.durationMs,
    timing.motionMs,
    timing.durationMs
  ];
  for (let index = 0; index < candidates.length; index += 1) {
    const value = Number(candidates[index]);
    if (Number.isFinite(value) && value >= 0) {
      return value;
    }
  }
  return 0;
}

function normalizeCoinPose(rawPose) {
  const pose = rawPose && typeof rawPose === 'object'
    ? rawPose
    : {};
  const position = pose.position &&
      typeof pose.position === 'object'
    ? pose.position
    : {};
  const radians = pose.rotationRadians &&
      typeof pose.rotationRadians === 'object'
    ? pose.rotationRadians
    : {};
  const height = Number.isFinite(Number(pose.height))
    ? Number(pose.height)
    : (
      Number.isFinite(Number(pose.depth))
        ? Number(pose.depth)
        : (Number(position.height) || 0)
    );
  const shadowOpacity = Number.isFinite(
    Number(pose.shadowOpacity)
  )
    ? Number(pose.shadowOpacity)
    : Number(pose.shadow && pose.shadow.strength);
  const shadowScale = Number.isFinite(
    Number(pose.shadowScale)
  )
    ? Number(pose.shadowScale)
    : Number(pose.shadow && pose.shadow.spread);

  return Object.assign({}, pose, {
    screenX: Number.isFinite(Number(pose.screenX))
      ? Number(pose.screenX)
      : Number(position.x) || 0,
    screenY: Number.isFinite(Number(pose.screenY))
      ? Number(pose.screenY)
      : Number(position.y) || 0,
    height,
    depth: Number.isFinite(Number(pose.depth))
      ? Number(pose.depth)
      : height,
    rotationX: Number.isFinite(Number(pose.rotationX))
      ? Number(pose.rotationX)
      : Number(radians.x) || 0,
    rotationY: Number.isFinite(Number(pose.rotationY))
      ? Number(pose.rotationY)
      : Number(radians.y) || 0,
    rotationZ: Number.isFinite(Number(pose.rotationZ))
      ? Number(pose.rotationZ)
      : Number(radians.z) || 0,
    authoredScale: Number.isFinite(Number(pose.authoredScale))
      ? Number(pose.authoredScale)
      : 1,
    shadow: {
      strength: Number.isFinite(shadowOpacity)
        ? shadowOpacity
        : 0.3,
      spread: Number.isFinite(shadowScale)
        ? shadowScale
        : 1
    }
  });
}

function createStudioPlan(preset, context) {
  const normalizedContext = normalizeStudioContext(context);
  const plan = createCardMotionPlan(preset, {
    destination: normalizedContext.destination,
    delayMs: normalizedContext.direction === 'intro'
      ? normalizedContext.delayMs
      : 0
  });
  let index;
  let pose;
  let depth;
  let rootZ;
  let nearestCameraDistance;

  for (index = 0; index <= STUDIO_CAMERA_VALIDATION_SAMPLES;
      index += 1) {
    pose = sampleCardMotion(
      plan,
      plan.timing.totalMs *
        (index / STUDIO_CAMERA_VALIDATION_SAMPLES)
    );
    depth = cardDepthMetrics(
      STUDIO_CARD_WIDTH,
      STUDIO_CARD_HEIGHT,
      STUDIO_FACE_OFFSET,
      pose.rotationX,
      pose.rotationY,
      pose.rotationZ,
      Math.max(0.01, pose.authoredScale)
    );
    rootZ = Math.max(0, pose.height) - depth.minimum;
    nearestCameraDistance =
      STUDIO_CAMERA_DISTANCE - (rootZ + depth.maximum);
    if (nearestCameraDistance < STUDIO_CAMERA_SAFETY_MARGIN) {
      throw new RangeError(
        'This height, scale, and rotation combination brings the card ' +
        'too close to the camera. Reduce the apex height or scale.'
      );
    }
  }
  return plan;
}

function createCoinStudioPlan(profile, descriptor) {
  const normalizedProfile =
    normalizeTurnMarkerMotionProfile(
      profile || DEFAULT_TURN_MARKER_MOTION_PROFILE
    );
  const normalizedDescriptor =
    normalizeCoinDescriptor(descriptor);
  const plan = createTurnMarkerMotionPlan(
    normalizedProfile,
    {
      source: normalizedDescriptor.source,
      destination: normalizedDescriptor.destination,
      delayMs: 0
    }
  );
  const duration = planDuration(plan);
  let index;
  let pose;
  let depth;
  let rootZ;
  let nearestCameraDistance;

  for (index = 0; index <= STUDIO_CAMERA_VALIDATION_SAMPLES;
      index += 1) {
    pose = normalizeCoinPose(
      sampleTurnMarkerMotion(
        plan,
        duration *
          (index / STUDIO_CAMERA_VALIDATION_SAMPLES)
      )
    );
    depth = cardDepthMetrics(
      STUDIO_COIN_DIAMETER,
      STUDIO_COIN_DIAMETER,
      STUDIO_COIN_FACE_OFFSET,
      pose.rotationX,
      pose.rotationY,
      pose.rotationZ,
      Math.max(0.01, pose.authoredScale)
    );
    rootZ = Math.max(0, pose.height) - depth.minimum;
    nearestCameraDistance =
      STUDIO_MATCH_CAMERA_DISTANCE -
      (rootZ + depth.maximum);
    if (nearestCameraDistance < STUDIO_CAMERA_SAFETY_MARGIN) {
      throw new RangeError(
        'This coin height and rotation combination brings the turn ' +
        'marker too close to the match camera. Reduce the apex height.'
      );
    }
  }

  return plan;
}

export function validateMotionStudioPreset(preset) {
  const normalized = normalizeCardMotionAuthoringPreset(preset);
  createStudioPlan(normalized, null);
  return normalized;
}

export class MotionStudioSurface {
  constructor(host, options) {
    if (!host) {
      throw new Error('The Motion Studio Three.js host is unavailable.');
    }

    this.host = host;
    this.options = options || {};
    this.disposed = false;
    this.contextLost = false;
    this.status = 'initializing';
    this.generation = 0;
    this.renderer = null;
    this.canvas = null;
    this.animationFrameId = null;
    this.animationToken = 0;
    this.lastFrameTimestamp = null;
    this.playing = false;
    this.loop = true;
    this.playbackRate = 1;
    this.frameCount = 0;
    this.renderCount = 0;
    this.elapsedMs = 0;
    this.subjectKind = 'card';
    this.cardDescriptor = null;
    this.coinDescriptor = null;
    this.cardRoot = null;
    this.projectionRoot = null;
    this.orientationRoot = null;
    this.scaleRoot = null;
    this.frontMesh = null;
    this.backMesh = null;
    this.bodyMesh = null;
    this.shadowMesh = null;
    this.shadowMaterial = null;
    this.materials = [];
    this.textures = [];
    this.cardPreset = validateMotionStudioPreset(
      CARD_MOTION_PRESETS.casualToss
    );
    this.coinPreset = normalizeTurnMarkerMotionProfile(
      DEFAULT_TURN_MARKER_MOTION_PROFILE
    );
    this.cardMotionContext = normalizeStudioContext(null);
    this.motionContext = this.cardMotionContext;
    this.preset = this.cardPreset;
    this.plan = createStudioPlan(
      this.preset,
      this.motionContext
    );
    this.planRevision = 1;
    this.debugPreset = freezePlain(clonePlain(this.preset));
    this.debugPlan = freezePlain(clonePlain(this.plan));
    this.pose = this.samplePose(0);
    this.perspectiveScale = 1;
    this.renderedScale = this.pose.authoredScale;
    this.visibleFace = 'Front';

    try {
      this.scene = new Scene();
      this.camera = new PerspectiveCamera(
        STUDIO_CAMERA_FOV,
        STUDIO_LOGICAL_WIDTH / STUDIO_LOGICAL_HEIGHT,
        10,
        1400
      );
      this.camera.position.set(
        STUDIO_CAMERA_CENTER_X,
        STUDIO_CAMERA_CENTER_Y,
        STUDIO_CAMERA_DISTANCE
      );
      this.camera.lookAt(
        STUDIO_CAMERA_CENTER_X,
        STUDIO_CAMERA_CENTER_Y,
        0
      );
      this.matchCamera = new PerspectiveCamera(
        STUDIO_CAMERA_FOV,
        STUDIO_MATCH_LOGICAL_WIDTH /
          STUDIO_MATCH_LOGICAL_HEIGHT,
        10,
        1400
      );
      this.matchCamera.position.set(
        STUDIO_MATCH_CAMERA_CENTER_X,
        STUDIO_MATCH_CAMERA_CENTER_Y,
        STUDIO_MATCH_CAMERA_DISTANCE
      );
      this.matchCamera.lookAt(
        STUDIO_MATCH_CAMERA_CENTER_X,
        STUDIO_MATCH_CAMERA_CENTER_Y,
        0
      );

      this.renderer = new WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false
      });
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.outputColorSpace = SRGBColorSpace;
      this.renderer.shadowMap.enabled = false;
      this.textureLoader = new TextureLoader();

      this.canvas = this.renderer.domElement;
      this.canvas.className =
        'modern-graphics-canvas motion-studio-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.canvas.setAttribute('tabindex', '-1');
      this.canvas.dataset.threePackageVersion =
        __PURETT_THREE_PACKAGE_VERSION__;
      this.canvas.dataset.threeRevision = REVISION;
      this.canvas.dataset.modernSurface = 'motion-studio';

      this.cardGeometry = new PlaneGeometry(
        STUDIO_CARD_WIDTH,
        STUDIO_CARD_HEIGHT
      );
      this.cardBodyGeometry = new BoxGeometry(
        STUDIO_CARD_WIDTH - 1.5,
        STUDIO_CARD_HEIGHT - 1.5,
        STUDIO_CARD_THICKNESS
      );
      this.coinFaceGeometry = new CircleGeometry(
        STUDIO_COIN_RADIUS,
        64
      );
      this.coinEdgeGeometry = new CylinderGeometry(
        STUDIO_COIN_RADIUS,
        STUDIO_COIN_RADIUS,
        STUDIO_COIN_THICKNESS,
        64,
        1,
        true
      );
      this.coinEdgeGeometry.rotateX(Math.PI / 2);
      this.shadowGeometry = new PlaneGeometry(132, 164);
      this.coinShadowGeometry = new PlaneGeometry(54, 54);
      this.shadowTexture = this.createShadowTexture();
      this.coinShadowTexture =
        this.createCoinShadowTexture();

      this.hemisphereLight = new HemisphereLight(
        0xfff7df,
        0x302a28,
        0.88
      );
      this.keyLight = new DirectionalLight(
        0xfff2d5,
        1.25
      );
      this.keyLight.position.set(150, 470, 600);
      this.keyLight.target.position.set(
        STUDIO_CAMERA_CENTER_X,
        STUDIO_CAMERA_CENTER_Y,
        0
      );
      this.scene.add(this.hemisphereLight);
      this.scene.add(this.keyLight);
      this.scene.add(this.keyLight.target);

      this.handleContextLost = (event) => {
        event.preventDefault();
        this.contextLost = true;
        this.status = 'context-lost';
        this.pause();
        if (typeof this.options.onError === 'function') {
          this.options.onError(
            new Error('The Motion Studio WebGL context was lost.')
          );
        }
      };
      this.canvas.addEventListener(
        'webglcontextlost',
        this.handleContextLost,
        false
      );
      this.host.appendChild(this.canvas);
      this.setContentScale(this.options.contentScale || 1);
      this.status = 'waiting-for-subject';
      this.applyPose(this.pose);
    } catch (error) {
      try {
        this.dispose();
      } catch (cleanupError) {
        // Preserve the original initialization failure.
      }
      throw error;
    }
  }

  createShadowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 160;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('The Motion Studio shadow canvas is unavailable.');
    }

    context.save();
    context.scale(1, 1.25);
    const gradient = context.createRadialGradient(
      64,
      64,
      7,
      64,
      64,
      62
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.74)');
    gradient.addColorStop(0.52, 'rgba(0, 0, 0, 0.38)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    context.restore();

    const texture = new CanvasTexture(canvas);
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }

  createCoinShadowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error(
        'The Motion Studio coin shadow canvas is unavailable.'
      );
    }

    const gradient = context.createRadialGradient(
      64,
      64,
      6,
      64,
      64,
      62
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.34)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);

    const texture = new CanvasTexture(canvas);
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }

  normalizeCard(card) {
    const textureUrl = String(card && card.textureUrl || '');
    const backTextureUrl = String(
      card && card.backTextureUrl || DEFAULT_CARD_BACK_URL
    );
    if (!textureUrl || !backTextureUrl) {
      throw new Error(
        'The Motion Studio card is missing a front or back texture.'
      );
    }
    return {
      textureUrl,
      backTextureUrl,
      cardId: card.cardId == null ? null : card.cardId,
      userCardId: card.userCardId == null ? null : card.userCardId
    };
  }

  setCard(card) {
    if (this.disposed || this.contextLost) {
      return;
    }

    let normalized;
    try {
      normalized = this.normalizeCard(card);
    } catch (error) {
      this.reportError(error);
      return;
    }

    const generation = ++this.generation;
    this.keyLight.target.position.set(
      STUDIO_CAMERA_CENTER_X,
      STUDIO_CAMERA_CENTER_Y,
      0
    );
    this.pause();
    this.clearCard();
    this.subjectKind = 'card';
    this.cardDescriptor = normalized;
    this.coinDescriptor = null;
    this.preset = this.cardPreset;
    this.motionContext = this.cardMotionContext;
    this.plan = createStudioPlan(
      this.preset,
      this.motionContext
    );
    this.planRevision += 1;
    this.debugPreset = freezePlain(clonePlain(this.preset));
    this.debugPlan = freezePlain(clonePlain(this.plan));
    this.pose = this.samplePose(0);
    this.canvas.dataset.motionSubject = 'card';
    this.status = 'loading';
    this.render();
    this.notifyState();

    const textureUrls = Array.from(new Set([
      normalized.textureUrl,
      normalized.backTextureUrl
    ]));
    const promises = textureUrls.map((textureUrl) => (
      this.textureLoader.loadAsync(textureUrl).then((texture) => {
        texture.colorSpace = SRGBColorSpace;
        texture.minFilter = LinearMipmapLinearFilter;
        texture.magFilter = LinearFilter;
        texture.generateMipmaps = true;
        texture.anisotropy = Math.min(
          4,
          this.renderer.capabilities.getMaxAnisotropy()
        );
        texture.needsUpdate = true;
        return {textureUrl, texture};
      })
    ));

    Promise.allSettled(promises).then((results) => {
      const fulfilled = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);
      if (this.disposed || generation !== this.generation) {
        fulfilled.forEach((entry) => entry.texture.dispose());
        return;
      }

      const rejected = results.find(
        (result) => result.status === 'rejected'
      );
      if (rejected) {
        fulfilled.forEach((entry) => entry.texture.dispose());
        this.status = 'failed';
        this.reportError(
          new Error('A Motion Studio card texture could not be loaded.')
        );
        return;
      }

      try {
        const textures = new Map();
        fulfilled.forEach((entry) => {
          textures.set(entry.textureUrl, entry.texture);
          this.textures.push(entry.texture);
        });
        this.commitCard(textures);
        this.status = 'ready';
        this.elapsedMs = 0;
        this.pose = this.samplePose(0);
        this.applyPose(this.pose);
        if (typeof this.options.onReady === 'function') {
          this.options.onReady();
        }
      } catch (error) {
        this.clearCard();
        this.status = 'failed';
        this.reportError(error);
      }
    });
  }

  setCoin(coin) {
    if (this.disposed || this.contextLost) {
      return;
    }

    let normalized;
    let profile;
    let plan;
    try {
      normalized = normalizeCoinDescriptor(coin);
      profile = normalizeTurnMarkerMotionProfile(
        coin && coin.profile
          ? coin.profile
          : this.coinPreset
      );
    } catch (error) {
      this.reportError(error);
      return;
    }
    this.keyLight.target.position.set(
      STUDIO_MATCH_CAMERA_CENTER_X,
      STUDIO_MATCH_CAMERA_CENTER_Y,
      0
    );

    const reusableCoin =
      this.subjectKind === 'coin' &&
      this.cardRoot &&
      sameCoinDescriptor(
        this.coinDescriptor,
        normalized
      );
    const sameProfile = JSON.stringify(profile) ===
      JSON.stringify(this.coinPreset);
    if (reusableCoin && sameProfile) {
      return;
    }

    try {
      plan = createCoinStudioPlan(profile, normalized);
    } catch (error) {
      this.reportError(error);
      return;
    }

    if (
      this.subjectKind === 'coin' &&
      this.cardRoot &&
      this.coinDescriptor &&
      this.coinDescriptor.textureUrl === normalized.textureUrl
    ) {
      const oldDuration = this.getDuration();
      const progress = oldDuration > 0
        ? clamp(this.elapsedMs / oldDuration, 0, 1)
        : 0;
      this.coinDescriptor = normalized;
      this.coinPreset = profile;
      this.preset = profile;
      this.motionContext = {
        direction: normalized.direction,
        source: clonePlain(normalized.source),
        destination: clonePlain(normalized.destination),
        delayMs: 0,
        targetId: 'match-turn-coin-transition'
      };
      this.plan = plan;
      this.planRevision += 1;
      this.debugPreset = freezePlain(clonePlain(this.preset));
      this.debugPlan = freezePlain(clonePlain(this.plan));
      this.elapsedMs = this.getDuration() * progress;
      this.pose = this.samplePose(this.elapsedMs);
      this.lastFrameTimestamp = null;
      this.applyPose(this.pose);
      return;
    }

    const generation = ++this.generation;
    this.pause();
    this.clearCard();
    this.subjectKind = 'coin';
    this.cardDescriptor = null;
    this.coinDescriptor = normalized;
    this.coinPreset = profile;
    this.preset = profile;
    this.motionContext = {
      direction: normalized.direction,
      source: clonePlain(normalized.source),
      destination: clonePlain(normalized.destination),
      delayMs: 0,
      targetId: 'match-turn-coin-transition'
    };
    this.plan = plan;
    this.planRevision += 1;
    this.debugPreset = freezePlain(clonePlain(this.preset));
    this.debugPlan = freezePlain(clonePlain(this.plan));
    this.elapsedMs = 0;
    this.pose = this.samplePose(0);
    this.canvas.dataset.motionSubject = 'coin';
    this.status = 'loading';
    this.render();
    this.notifyState();

    this.textureLoader.loadAsync(normalized.textureUrl)
      .then((texture) => {
        texture.colorSpace = SRGBColorSpace;
        texture.minFilter = LinearMipmapLinearFilter;
        texture.magFilter = LinearFilter;
        texture.generateMipmaps = true;
        texture.anisotropy = Math.min(
          4,
          this.renderer.capabilities.getMaxAnisotropy()
        );
        texture.needsUpdate = true;
        if (this.disposed || generation !== this.generation) {
          texture.dispose();
          return;
        }

        try {
          this.textures.push(texture);
          this.commitCoin(texture);
          this.status = 'ready';
          this.elapsedMs = 0;
          this.pose = this.samplePose(0);
          this.applyPose(this.pose);
          if (typeof this.options.onReady === 'function') {
            this.options.onReady();
          }
        } catch (error) {
          this.clearCard();
          this.status = 'failed';
          this.reportError(error);
        }
      })
      .catch(() => {
        if (this.disposed || generation !== this.generation) {
          return;
        }
        this.status = 'failed';
        this.reportError(
          new Error(
            'The Motion Studio coin texture could not be loaded.'
          )
        );
      });
  }

  setCoinProfile(profile) {
    if (this.disposed) {
      return;
    }
    let normalized;
    try {
      normalized = normalizeTurnMarkerMotionProfile(profile);
    } catch (error) {
      this.reportError(error);
      return;
    }

    if (
      JSON.stringify(normalized) ===
      JSON.stringify(this.coinPreset)
    ) {
      return;
    }

    this.coinPreset = normalized;
    if (this.subjectKind !== 'coin') {
      return;
    }
    this.setPreset(normalized);
  }

  commitCard(textures) {
    const bodyMaterial = new MeshStandardMaterial({
      color: 0xc8b892,
      roughness: 0.82,
      metalness: 0,
      depthTest: true,
      depthWrite: true,
      toneMapped: false
    });
    const hiddenCapMaterial = new MeshBasicMaterial({visible: false});
    const bodyMaterials = [
      bodyMaterial,
      bodyMaterial,
      bodyMaterial,
      bodyMaterial,
      hiddenCapMaterial,
      hiddenCapMaterial
    ];
    const frontMaterial = new MeshBasicMaterial({
      color: 0xffffff,
      map: textures.get(this.cardDescriptor.textureUrl),
      transparent: false,
      alphaTest: 0.5,
      alphaToCoverage: true,
      depthTest: true,
      depthWrite: true,
      side: FrontSide,
      toneMapped: false
    });
    const backMaterial = new MeshBasicMaterial({
      color: 0xffffff,
      map: textures.get(this.cardDescriptor.backTextureUrl),
      transparent: false,
      alphaTest: 0.5,
      alphaToCoverage: true,
      depthTest: true,
      depthWrite: true,
      side: FrontSide,
      toneMapped: false
    });
    const shadowMaterial = new MeshBasicMaterial({
      map: this.shadowTexture,
      transparent: true,
      opacity: 0,
      depthTest: true,
      depthWrite: false,
      toneMapped: false
    });

    this.cardRoot = new Group();
    this.projectionRoot = new Group();
    this.orientationRoot = new Group();
    this.scaleRoot = new Group();
    this.bodyMesh = new Mesh(this.cardBodyGeometry, bodyMaterials);
    this.frontMesh = new Mesh(this.cardGeometry, frontMaterial);
    this.backMesh = new Mesh(this.cardGeometry, backMaterial);
    this.shadowMesh = new Mesh(this.shadowGeometry, shadowMaterial);
    this.shadowMaterial = shadowMaterial;

    this.frontMesh.position.z = STUDIO_FACE_OFFSET;
    this.backMesh.position.z = -STUDIO_FACE_OFFSET;
    this.backMesh.rotation.x = Math.PI;
    this.shadowMesh.position.z = STUDIO_SHADOW_Z;
    this.shadowMesh.renderOrder = -10;

    this.scaleRoot.add(this.bodyMesh);
    this.scaleRoot.add(this.frontMesh);
    this.scaleRoot.add(this.backMesh);
    this.orientationRoot.add(this.scaleRoot);
    this.projectionRoot.matrixAutoUpdate = false;
    this.projectionRoot.add(this.orientationRoot);
    this.cardRoot.add(this.projectionRoot);
    this.scene.add(this.shadowMesh);
    this.scene.add(this.cardRoot);
    this.materials.push(
      bodyMaterial,
      hiddenCapMaterial,
      frontMaterial,
      backMaterial,
      shadowMaterial
    );
  }

  commitCoin(texture) {
    const edgeMaterial = new MeshStandardMaterial({
      color: 0xbeb8aa,
      roughness: 0.42,
      metalness: 0.72,
      depthTest: true,
      depthWrite: true,
      toneMapped: false
    });
    const frontMaterial = new MeshBasicMaterial({
      color: 0xffffff,
      map: texture,
      transparent: true,
      alphaTest: 0.06,
      alphaToCoverage: true,
      depthTest: true,
      depthWrite: true,
      side: FrontSide,
      toneMapped: false
    });
    const backMaterial = new MeshBasicMaterial({
      color: 0xffffff,
      map: texture,
      transparent: true,
      alphaTest: 0.06,
      alphaToCoverage: true,
      depthTest: true,
      depthWrite: true,
      side: FrontSide,
      toneMapped: false
    });
    const shadowMaterial = new MeshBasicMaterial({
      map: this.coinShadowTexture,
      transparent: true,
      opacity: 0,
      depthTest: true,
      depthWrite: false,
      toneMapped: false
    });

    this.cardRoot = new Group();
    this.projectionRoot = new Group();
    this.orientationRoot = new Group();
    this.scaleRoot = new Group();
    this.bodyMesh = new Mesh(
      this.coinEdgeGeometry,
      edgeMaterial
    );
    this.frontMesh = new Mesh(
      this.coinFaceGeometry,
      frontMaterial
    );
    this.backMesh = new Mesh(
      this.coinFaceGeometry,
      backMaterial
    );
    this.shadowMesh = new Mesh(
      this.coinShadowGeometry,
      shadowMaterial
    );
    this.shadowMaterial = shadowMaterial;

    this.frontMesh.position.z = STUDIO_COIN_FACE_OFFSET;
    this.backMesh.position.z = -STUDIO_COIN_FACE_OFFSET;
    this.backMesh.rotation.y = Math.PI;
    this.shadowMesh.position.z = STUDIO_SHADOW_Z;
    this.shadowMesh.renderOrder = -10;

    this.scaleRoot.add(this.bodyMesh);
    this.scaleRoot.add(this.frontMesh);
    this.scaleRoot.add(this.backMesh);
    this.orientationRoot.add(this.scaleRoot);
    this.projectionRoot.matrixAutoUpdate = false;
    this.projectionRoot.add(this.orientationRoot);
    this.cardRoot.add(this.projectionRoot);
    this.scene.add(this.shadowMesh);
    this.scene.add(this.cardRoot);
    this.materials.push(
      edgeMaterial,
      frontMaterial,
      backMaterial,
      shadowMaterial
    );
  }

  createPlan(preset) {
    if (this.subjectKind === 'coin') {
      return createCoinStudioPlan(
        preset,
        this.coinDescriptor || normalizeCoinDescriptor(null)
      );
    }
    return createStudioPlan(preset, this.motionContext);
  }

  getDuration() {
    if (!this.plan) {
      return 0;
    }
    if (this.subjectKind === 'coin') {
      return planDuration(this.plan);
    }
    return this.motionContext.direction === 'exit'
      ? this.motionContext.delayMs + this.plan.timing.motionMs
      : this.plan.timing.totalMs;
  }

  samplePose(elapsedMs) {
    if (this.subjectKind === 'coin') {
      return normalizeCoinPose(
        sampleTurnMarkerMotion(this.plan, elapsedMs)
      );
    }
    if (this.motionContext.direction !== 'exit') {
      return sampleCardMotion(this.plan, elapsedMs);
    }
    const elapsed = clamp(
      Number(elapsedMs) || 0,
      0,
      this.getDuration()
    );
    const localElapsed = elapsed - this.motionContext.delayMs;
    if (localElapsed <= 0) {
      const waitingPose = sampleCardMotion(
        this.plan,
        this.plan.timing.motionMs
      );
      return Object.assign({}, waitingPose, {
        phase: 'exit-waiting',
        complete: false,
        elapsedMs: elapsed,
        localElapsedMs: localElapsed
      });
    }
    const reverseElapsed = Math.max(
      0,
      this.plan.timing.motionMs - localElapsed
    );
    const pose = sampleCardMotion(this.plan, reverseElapsed);
    const complete = localElapsed >= this.plan.timing.motionMs;
    return Object.assign({}, pose, {
      phase: complete ? 'exited' : `exit-${pose.phase}`,
      complete,
      elapsedMs: elapsed,
      localElapsedMs: localElapsed,
      progress: clamp(
        localElapsed / this.plan.timing.motionMs,
        0,
        1
      )
    });
  }

  setMotionContext(context) {
    if (this.disposed) {
      return;
    }
    const oldDuration = this.getDuration();
    const progress = oldDuration > 0
      ? clamp(this.elapsedMs / oldDuration, 0, 1)
      : 0;
    if (this.subjectKind === 'coin') {
      this.coinDescriptor = normalizeCoinDescriptor(
        Object.assign(
          {},
          this.coinDescriptor || {},
          context || {}
        )
      );
      this.motionContext = {
        direction: this.coinDescriptor.direction,
        source: clonePlain(this.coinDescriptor.source),
        destination: clonePlain(
          this.coinDescriptor.destination
        ),
        delayMs: 0,
        targetId: 'match-turn-coin-transition'
      };
    } else {
      this.cardMotionContext = normalizeStudioContext(context);
      this.motionContext = this.cardMotionContext;
    }
    this.plan = this.createPlan(this.preset);
    this.planRevision += 1;
    this.debugPlan = freezePlain(clonePlain(this.plan));
    this.elapsedMs = this.getDuration() * progress;
    this.pose = this.samplePose(this.elapsedMs);
    this.lastFrameTimestamp = null;
    this.applyPose(this.pose);
  }

  setPreset(preset) {
    if (this.disposed) {
      return;
    }
    const oldDuration = this.getDuration();
    const progress = oldDuration > 0
      ? clamp(this.elapsedMs / oldDuration, 0, 1)
      : 0;
    if (this.subjectKind === 'coin') {
      const nextPreset =
        normalizeTurnMarkerMotionProfile(preset);
      const nextPlan = createCoinStudioPlan(
        nextPreset,
        this.coinDescriptor || normalizeCoinDescriptor(null)
      );
      this.coinPreset = nextPreset;
      this.preset = this.coinPreset;
      this.plan = nextPlan;
    } else {
      this.cardPreset = validateMotionStudioPreset(preset);
      this.preset = this.cardPreset;
      this.plan = this.createPlan(this.preset);
    }
    this.planRevision += 1;
    this.debugPreset = freezePlain(clonePlain(this.preset));
    this.debugPlan = freezePlain(clonePlain(this.plan));
    this.elapsedMs = this.getDuration() * progress;
    this.pose = this.samplePose(this.elapsedMs);
    this.lastFrameTimestamp = null;
    this.applyPose(this.pose);
  }

  setPlaybackRate(rate) {
    const numeric = Number(rate);
    this.playbackRate = Number.isFinite(numeric)
      ? clamp(numeric, 0.05, 4)
      : 1;
    this.lastFrameTimestamp = null;
    this.notifyState();
  }

  setLoop(loop) {
    this.loop = loop === true;
    this.notifyState();
  }

  play() {
    if (this.disposed || this.contextLost || this.status !== 'ready') {
      return;
    }
    if (this.elapsedMs >= this.getDuration()) {
      this.elapsedMs = 0;
      this.pose = this.samplePose(0);
      this.applyPose(this.pose);
    }
    if (this.playing) {
      return;
    }
    this.playing = true;
    this.lastFrameTimestamp = null;
    this.animationToken += 1;
    this.scheduleFrame();
    this.notifyState();
  }

  restart() {
    if (this.disposed || this.contextLost) {
      return;
    }
    this.cancelFrame();
    this.elapsedMs = 0;
    this.pose = this.samplePose(0);
    this.applyPose(this.pose);
    if (this.status === 'ready') {
      this.playing = true;
      this.lastFrameTimestamp = null;
      this.animationToken += 1;
      this.scheduleFrame();
      this.notifyState();
    }
  }

  pause() {
    this.playing = false;
    this.lastFrameTimestamp = null;
    this.animationToken += 1;
    this.cancelFrame();
    this.notifyState();
  }

  seek(elapsedMs) {
    if (this.disposed) {
      return;
    }
    this.playing = false;
    this.lastFrameTimestamp = null;
    this.animationToken += 1;
    this.cancelFrame();
    this.elapsedMs = clamp(
      Number(elapsedMs) || 0,
      0,
      this.getDuration()
    );
    this.pose = this.samplePose(this.elapsedMs);
    this.applyPose(this.pose);
  }

  scheduleFrame() {
    if (!this.playing || this.animationFrameId !== null ||
        this.disposed || this.contextLost) {
      return;
    }
    const token = this.animationToken;
    this.animationFrameId = window.requestAnimationFrame((timestamp) => {
      this.animationFrameId = null;
      if (token !== this.animationToken || !this.playing ||
          this.disposed || this.contextLost) {
        return;
      }
      this.advanceFrame(timestamp);
    });
  }

  advanceFrame(timestamp) {
    this.frameCount += 1;
    if (this.lastFrameTimestamp === null) {
      this.lastFrameTimestamp = timestamp;
      this.scheduleFrame();
      return;
    }

    const delta = Math.max(0, timestamp - this.lastFrameTimestamp);
    this.lastFrameTimestamp = timestamp;
    this.elapsedMs += delta * this.playbackRate;
    const duration = this.getDuration();
    if (this.elapsedMs >= duration) {
      if (this.loop && duration > 0) {
        this.elapsedMs %= duration;
        this.lastFrameTimestamp = timestamp;
      } else {
        this.elapsedMs = duration;
        this.playing = false;
        this.lastFrameTimestamp = null;
      }
    }

    this.pose = this.samplePose(this.elapsedMs);
    this.applyPose(this.pose);
    if (this.playing) {
      this.scheduleFrame();
    }
  }

  subjectViewMetrics() {
    if (this.subjectKind === 'coin') {
      return {
        logicalWidth: STUDIO_MATCH_LOGICAL_WIDTH,
        logicalHeight: STUDIO_MATCH_LOGICAL_HEIGHT,
        centerX: STUDIO_MATCH_CAMERA_CENTER_X,
        centerY: STUDIO_MATCH_CAMERA_CENTER_Y,
        cameraDistance: STUDIO_MATCH_CAMERA_DISTANCE,
        width: STUDIO_COIN_DIAMETER,
        height: STUDIO_COIN_DIAMETER,
        faceOffset: STUDIO_COIN_FACE_OFFSET,
        viewport: {
          x: STUDIO_MATCH_VIEWPORT_X,
          y: STUDIO_MATCH_VIEWPORT_Y,
          width: STUDIO_MATCH_LOGICAL_WIDTH,
          height: STUDIO_MATCH_LOGICAL_HEIGHT
        }
      };
    }
    return {
      logicalWidth: STUDIO_LOGICAL_WIDTH,
      logicalHeight: STUDIO_LOGICAL_HEIGHT,
      centerX: STUDIO_CAMERA_CENTER_X,
      centerY: STUDIO_CAMERA_CENTER_Y,
      cameraDistance: STUDIO_CAMERA_DISTANCE,
      width: STUDIO_CARD_WIDTH,
      height: STUDIO_CARD_HEIGHT,
      faceOffset: STUDIO_FACE_OFFSET,
      viewport: {
        x: 0,
        y: 0,
        width: STUDIO_LOGICAL_WIDTH,
        height: STUDIO_LOGICAL_HEIGHT
      }
    };
  }

  applyPose(pose) {
    this.pose = pose;
    if (!this.cardRoot || !this.orientationRoot || !this.scaleRoot) {
      this.render();
      this.notifyState();
      return;
    }

    const view = this.subjectViewMetrics();
    const authoredScale = Math.max(0.01, pose.authoredScale);
    const depth = cardDepthMetrics(
      view.width,
      view.height,
      view.faceOffset,
      pose.rotationX,
      pose.rotationY,
      pose.rotationZ,
      authoredScale
    );
    const rootZ = Math.max(0, pose.height) - depth.minimum;
    const visibleCenterDepth = rootZ + depth.visibleCenter;
    const cameraDistanceToCenter = Math.max(
      STUDIO_CAMERA_SAFETY_MARGIN,
      view.cameraDistance - visibleCenterDepth
    );
    const compensation =
      cameraDistanceToCenter /
      view.cameraDistance;
    const screenX = pose.screenX;
    const screenWorldY = view.logicalHeight - pose.screenY;
    const worldX =
      view.centerX +
      ((screenX - view.centerX) * compensation);
    const worldY =
      view.centerY +
      ((screenWorldY - view.centerY) * compensation);

    this.cardRoot.position.set(worldX, worldY, rootZ);
    this.orientationRoot.rotation.set(
      pose.rotationX,
      pose.rotationY,
      pose.rotationZ
    );
    this.scaleRoot.scale.set(
      authoredScale,
      authoredScale,
      authoredScale
    );
    this.applyFlatTableProjection(
      pose,
      depth,
      screenWorldY,
      view
    );
    this.visibleFace = this.subjectKind === 'coin'
      ? (
        depth.normalDepth >= 0
          ? 'Heads'
          : 'Heads (reverse)'
      )
      : visibleFaceForDepth(depth.normalDepth);
    this.perspectiveScale =
      view.cameraDistance /
      cameraDistanceToCenter;
    this.renderedScale = authoredScale * this.perspectiveScale;
    this.updateShadow(pose, authoredScale);
    this.render();
    this.notifyState();
  }

  applyFlatTableProjection(pose, depth, screenWorldY, view) {
    if (!this.projectionRoot) {
      return;
    }
    const horizontalOffset =
      (pose.screenX - view.centerX) /
      view.cameraDistance;
    const verticalOffset =
      (screenWorldY - view.centerY) /
      view.cameraDistance;
    const shearX = -horizontalOffset;
    const shearY = -verticalOffset;
    const anchorDepth = depth.visibleCenter;

    // A head-on perspective camera makes a tilted off-axis plane lean toward
    // the camera center. Apply the inverse projective shear outside the local
    // card rotation, anchored at the currently visible face center. The card
    // keeps its own pitch, yaw, roll, foreshortening, and perspective size
    // without implying that the tabletop itself is curved.
    this.projectionRoot.matrix.set(
      1, 0, shearX, -shearX * anchorDepth,
      0, 1, shearY, -shearY * anchorDepth,
      0, 0, 1, 0,
      0, 0, 0, 1
    );
    this.projectionRoot.matrixWorldNeedsUpdate = true;
  }

  updateShadow(pose, authoredScale) {
    if (!this.shadowMesh || !this.shadowMaterial) {
      return;
    }
    const spread =
      pose.shadow.spread *
      authoredScale *
      0.9;
    const view = this.subjectViewMetrics();
    const shadowOffsetX = this.subjectKind === 'coin'
      ? pose.height * 0.04
      : pose.height * 0.075;
    const shadowOffsetY = this.subjectKind === 'coin'
      ? pose.height * 0.03
      : pose.height * 0.045;
    this.shadowMesh.position.set(
      pose.screenX + shadowOffsetX,
      view.logicalHeight -
        (pose.screenY + shadowOffsetY),
      STUDIO_SHADOW_Z
    );
    this.shadowMesh.rotation.z = this.subjectKind === 'coin'
      ? 0
      : pose.rotationZ * 0.45;
    this.shadowMesh.scale.set(
      spread,
      this.subjectKind === 'coin'
        ? spread
        : spread * 0.92,
      1
    );
    this.shadowMaterial.opacity = clamp(
      pose.shadow.strength,
      0,
      1
    );
    this.shadowMesh.visible = this.shadowMaterial.opacity > 0.002;
  }

  setContentScale(contentScale) {
    if (this.disposed || !this.renderer) {
      return;
    }
    const scale = Number.isFinite(Number(contentScale))
      ? Number(contentScale)
      : 1;
    const devicePixelRatio = window.devicePixelRatio || 1;
    this.renderer.setPixelRatio(
      Math.min(
        Math.max(devicePixelRatio * scale, 1),
        MAX_PIXEL_RATIO
      )
    );
    this.renderer.setSize(
      STUDIO_LOGICAL_WIDTH,
      STUDIO_LOGICAL_HEIGHT,
      false
    );
    this.camera.aspect =
      STUDIO_LOGICAL_WIDTH / STUDIO_LOGICAL_HEIGHT;
    this.camera.updateProjectionMatrix();
    this.matchCamera.aspect =
      STUDIO_MATCH_LOGICAL_WIDTH /
      STUDIO_MATCH_LOGICAL_HEIGHT;
    this.matchCamera.updateProjectionMatrix();
    this.render();
    this.notifyState();
  }

  render() {
    if (!this.disposed && !this.contextLost && this.renderer) {
      this.renderer.setScissorTest(false);
      this.renderer.setViewport(
        0,
        0,
        STUDIO_LOGICAL_WIDTH,
        STUDIO_LOGICAL_HEIGHT
      );
      this.renderer.clear(true, true, true);
      if (this.subjectKind === 'coin') {
        const viewportBottom =
          STUDIO_LOGICAL_HEIGHT -
          STUDIO_MATCH_VIEWPORT_Y -
          STUDIO_MATCH_LOGICAL_HEIGHT;
        this.renderer.setViewport(
          STUDIO_MATCH_VIEWPORT_X,
          viewportBottom,
          STUDIO_MATCH_LOGICAL_WIDTH,
          STUDIO_MATCH_LOGICAL_HEIGHT
        );
        this.renderer.setScissor(
          STUDIO_MATCH_VIEWPORT_X,
          viewportBottom,
          STUDIO_MATCH_LOGICAL_WIDTH,
          STUDIO_MATCH_LOGICAL_HEIGHT
        );
        this.renderer.setScissorTest(true);
        this.renderer.render(this.scene, this.matchCamera);
        this.renderer.setScissorTest(false);
        this.renderer.setViewport(
          0,
          0,
          STUDIO_LOGICAL_WIDTH,
          STUDIO_LOGICAL_HEIGHT
        );
      } else {
        this.renderer.render(this.scene, this.camera);
      }
      this.renderCount += 1;
    }
  }

  notifyState() {
    if (typeof this.options.onStateChange === 'function' &&
        !this.disposed) {
      this.options.onStateChange(this.getDebugState());
    }
  }

  reportError(error) {
    if (typeof this.options.onError === 'function') {
      this.options.onError(error);
    }
    this.notifyState();
  }

  getDebugState() {
    return {
      packageVersion: __PURETT_THREE_PACKAGE_VERSION__,
      revision: REVISION,
      surface: 'motion-studio',
      subjectKind: this.subjectKind,
      status: this.status,
      ready: this.status === 'ready',
      disposed: this.disposed,
      contextLost: this.contextLost,
      playing: this.playing,
      loop: this.loop,
      playbackRate: this.playbackRate,
      elapsedMs: this.elapsedMs,
      durationMs: this.getDuration(),
      motionContext: clonePlain(this.motionContext),
      planRevision: this.planRevision,
      frameCount: this.frameCount,
      renderCount: this.renderCount,
      rafActive: this.animationFrameId !== null,
      pixelRatio: this.renderer ? this.renderer.getPixelRatio() : 0,
      perspectiveScale: this.perspectiveScale,
      renderedScale: this.renderedScale,
      visibleFace: this.visibleFace,
      subject: this.subjectKind === 'coin'
        ? clonePlain(this.coinDescriptor)
        : clonePlain(this.cardDescriptor),
      coordinateSpace: this.subjectKind === 'coin'
        ? {
          kind: 'active-match',
          logicalWidth: STUDIO_MATCH_LOGICAL_WIDTH,
          logicalHeight: STUDIO_MATCH_LOGICAL_HEIGHT,
          stageOffsetX: STUDIO_MATCH_VIEWPORT_X,
          stageOffsetY: STUDIO_MATCH_VIEWPORT_Y,
          cameraDistance: STUDIO_MATCH_CAMERA_DISTANCE
        }
        : {
          kind: 'lobby-board',
          logicalWidth: STUDIO_LOGICAL_WIDTH,
          logicalHeight: STUDIO_LOGICAL_HEIGHT,
          stageOffsetX: 0,
          stageOffsetY: 0,
          cameraDistance: STUDIO_CAMERA_DISTANCE
        },
      preset: this.debugPreset,
      plan: this.debugPlan,
      pose: clonePlain(this.pose),
      resources: {
        materialCount: this.materials.length,
        textureCount: this.textures.length,
        hasSubjectRoot: Boolean(this.cardRoot),
        hasShadow: Boolean(this.shadowMesh),
        coinFaceSegments: 64,
        coinDiameter: STUDIO_COIN_DIAMETER,
        coinThickness: STUDIO_COIN_THICKNESS
      },
      canvasCount: this.host
        ? this.host.querySelectorAll('canvas').length
        : 0
    };
  }

  clearCard() {
    if (this.cardRoot) {
      this.scene.remove(this.cardRoot);
    }
    if (this.shadowMesh) {
      this.scene.remove(this.shadowMesh);
    }
    this.materials.forEach((material) => material.dispose());
    this.textures.forEach((texture) => texture.dispose());
    this.materials = [];
    this.textures = [];
    this.cardRoot = null;
    this.projectionRoot = null;
    this.orientationRoot = null;
    this.scaleRoot = null;
    this.frontMesh = null;
    this.backMesh = null;
    this.bodyMesh = null;
    this.shadowMesh = null;
    this.shadowMaterial = null;
  }

  cancelFrame() {
    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  dispose() {
    if (this.disposed) {
      return;
    }

    this.playing = false;
    this.animationToken += 1;
    this.cancelFrame();
    this.disposed = true;
    this.generation += 1;
    this.clearCard();
    if (this.cardGeometry) {
      this.cardGeometry.dispose();
    }
    if (this.cardBodyGeometry) {
      this.cardBodyGeometry.dispose();
    }
    if (this.coinFaceGeometry) {
      this.coinFaceGeometry.dispose();
    }
    if (this.coinEdgeGeometry) {
      this.coinEdgeGeometry.dispose();
    }
    if (this.shadowGeometry) {
      this.shadowGeometry.dispose();
    }
    if (this.coinShadowGeometry) {
      this.coinShadowGeometry.dispose();
    }
    if (this.shadowTexture) {
      this.shadowTexture.dispose();
    }
    if (this.coinShadowTexture) {
      this.coinShadowTexture.dispose();
    }
    if (this.canvas && this.handleContextLost) {
      this.canvas.removeEventListener(
        'webglcontextlost',
        this.handleContextLost,
        false
      );
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

export const MOTION_STUDIO_CAMERA = Object.freeze({
  logicalWidth: STUDIO_LOGICAL_WIDTH,
  logicalHeight: STUDIO_LOGICAL_HEIGHT,
  fieldOfView: STUDIO_CAMERA_FOV,
  distance: STUDIO_CAMERA_DISTANCE,
  cardWidth: STUDIO_CARD_WIDTH,
  cardHeight: STUDIO_CARD_HEIGHT,
  cardThickness: STUDIO_CARD_THICKNESS,
  faceOffset: STUDIO_FACE_OFFSET,
  match: Object.freeze({
    logicalWidth: STUDIO_MATCH_LOGICAL_WIDTH,
    logicalHeight: STUDIO_MATCH_LOGICAL_HEIGHT,
    stageOffsetX: STUDIO_MATCH_VIEWPORT_X,
    stageOffsetY: STUDIO_MATCH_VIEWPORT_Y,
    distance: STUDIO_MATCH_CAMERA_DISTANCE
  }),
  coin: Object.freeze({
    diameter: STUDIO_COIN_DIAMETER,
    thickness: STUDIO_COIN_THICKNESS,
    faceOffset: STUDIO_COIN_FACE_OFFSET
  })
});
