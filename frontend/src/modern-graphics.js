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
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  REVISION,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer
} from 'three';
import {
  CASUAL_DROP_LEFT_PROFILE,
  createCardArrivalBatch,
  sampleCardArrival
} from './card-arrival-animations.js';
import {
  CARD_MOTION_AUTHORING_LIMITS,
  CARD_MOTION_CONTROLS,
  CARD_MOTION_LIMITS,
  CARD_MOTION_PRESETS,
  CARD_MOTION_SCHEMA_VERSION,
  createCardMotionPlan,
  parseCardMotionPreset,
  sampleCardMotion,
  serializeCardMotionPreset
} from './card-motion.js';
import {
  DEFAULT_LOBBY_MOTION_PLAYBOOK,
  LOBBY_INTRO_SHARED_MOTION_FIELDS,
  LOBBY_MOTION_PLAYBOOK_METADATA,
  LOBBY_MOTION_TARGETS,
  LOBBY_WIND_EXIT_TARGET_ID,
  LOBBY_WIND_VARIATION,
  copyLobbyIntroSharedMotion,
  createLobbyMotionBatch,
  getLobbyMotionTarget,
  getLobbyMotionTargetDefinition,
  normalizeLobbyMotionPlaybook,
  parseLobbyMotionPlaybook,
  sampleLobbyMotionPlan,
  serializeLobbyMotionPlaybook,
  updateLobbyMotionTarget,
  updateLobbyWindSeed
} from './lobby-motion-playbook.js';
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
} from './turn-marker-motion.js';
import {
  GAME_BOX_COVER_CACHE_IDENTITY,
  GAME_BOX_COVER_DOORS,
  GAME_BOX_COVER_MOTION_DEFAULTS,
  GAME_BOX_COVER_MOTION_SCHEMA_VERSION,
  GAME_BOX_COVER_STAGE,
  createGameBoxCoverMotionPlan,
  sampleGameBoxCoverMotion
} from './game-box-cover-motion.js';
import {
  GameBoxCoverSurface
} from './game-box-cover-surface.js';
import {
  MOTION_STUDIO_CAMERA,
  MotionStudioSurface,
  validateMotionStudioPreset
} from './motion-studio-surface.js';

const LOGICAL_WIDTH = 693;
const LOGICAL_HEIGHT = 500;
const LOBBY_LOGICAL_WIDTH = 755;
const LOBBY_LOGICAL_HEIGHT = 562;
const MAX_PIXEL_RATIO = 3;
const MATCH_HAND_TEXTURE_TIMEOUT_MS = 6000;
const MATCH_CAMERA_FOV = 40;
const MATCH_CAMERA_CENTER_X = LOGICAL_WIDTH / 2;
const MATCH_CAMERA_CENTER_Y = LOGICAL_HEIGHT / 2;
const MATCH_CAMERA_DISTANCE =
  (LOGICAL_HEIGHT / 2) / Math.tan((MATCH_CAMERA_FOV * Math.PI / 180) / 2);
const MATCH_CARD_WIDTH = 117;
const MATCH_CARD_HEIGHT = 146;
const MATCH_CARD_THICKNESS = 3;
const MATCH_CARD_FACE_BODY_CLEARANCE = 0.2;
const MATCH_CARD_FACE_OFFSET =
  (MATCH_CARD_THICKNESS / 2) + MATCH_CARD_FACE_BODY_CLEARANCE;
const MATCH_PICKUP_LIFT_Z = 48;
const MATCH_PICKUP_DURATION_MS = 300;
const MATCH_PICKUP_POSITION_RESPONSE = 24;
const MATCH_PICKUP_VELOCITY_RESPONSE = 18;
const MATCH_PICKUP_STALE_VELOCITY_MS = 80;
const MATCH_PICKUP_VELOCITY_DECAY = 12;
const MATCH_PICKUP_MAX_SPEED = 1200;
const MATCH_PICKUP_TILT_SPEED = 450;
const MATCH_PICKUP_TILT_RESPONSE = 18;
const MATCH_PICKUP_MAX_TILT =
  10 * (Math.PI / 180);
const MATCH_PICKUP_POSITION_EPSILON = 0.05;
const MATCH_PICKUP_VELOCITY_EPSILON = 0.5;
const MATCH_PICKUP_TILT_EPSILON =
  0.02 * (Math.PI / 180);
const MATCH_PICKUP_SHADOW_Z = -0.5;
const MATCH_INVALID_RETURN_DURATION_MS = 300;
const MATCH_INVALID_RETURN_ROTATION_Z =
  -2 * Math.PI;
const MATCH_INVALID_RETURN_EASING =
  'cubic-out';
const MATCH_VALID_PLACEMENT_DURATION_MS = 300;
const MATCH_VALID_PLACEMENT_EASING =
  'cubic-out';
const MATCH_VALID_PLACEMENT_ROTATION_RANGE_DEGREES = 2;
const MATCH_DROP_ZONE_OPACITY = 0.3;
const MATCH_DROP_ZONE_CORNER_RADIUS = 10;
const MATCH_DROP_ZONE_RENDER_ORDER = 50;
const MATCH_PLACED_CARD_RENDER_ORDER = 200;
const MATCH_TURN_COIN_DIAMETER = 41;
const MATCH_TURN_COIN_RADIUS =
  MATCH_TURN_COIN_DIAMETER / 2;
const MATCH_TURN_COIN_THICKNESS = 3;
const MATCH_TURN_COIN_FACE_OFFSET =
  (MATCH_TURN_COIN_THICKNESS / 2) + 0.08;
const MATCH_TURN_COIN_RENDER_ORDER = 5000;
const MATCH_TURN_COIN_SHADOW_Z = -0.75;
const MATCH_TURN_COIN_SHADOW_SIZE = 54;
const MATCH_TURN_COIN_SHADOW_SCALE = 0.9;
const LOBBY_CARD_BACK_URL = '/images/cards/cardBack.png';
const LOBBY_CAMERA_FOV = 40;
const LOBBY_CAMERA_CENTER_X = LOBBY_LOGICAL_WIDTH / 2;
const LOBBY_CAMERA_CENTER_Y = LOBBY_LOGICAL_HEIGHT / 2;
const LOBBY_CAMERA_DISTANCE =
  (LOBBY_LOGICAL_HEIGHT / 2) / Math.tan((LOBBY_CAMERA_FOV * Math.PI / 180) / 2);
const LOBBY_CARD_THICKNESS = 3;
const LOBBY_CARD_FACE_BODY_CLEARANCE = 0.2;
const LOBBY_CARD_FACE_OFFSET =
  (LOBBY_CARD_THICKNESS / 2) + LOBBY_CARD_FACE_BODY_CLEARANCE;
const LOBBY_LIFT_SCREEN_Y = 18;
const LOBBY_LIFT_Z = 105;
const LOBBY_TURN_ARC_SCREEN_Y = 5;
const LOBBY_TURN_ARC_Z = 12;
const LOBBY_PICKUP_TILT_X = 0;
const LOBBY_PICKUP_TILT_Y = 0;
const LOBBY_ANALYTIC_SHADOW_Z = -4;
const LOBBY_ANALYTIC_SHADOW_OPACITY = 0.22;
const LOBBY_FLIP_TIMINGS = Object.freeze({
  lift: 350,
  turn: 1650,
  settle: 450
});
const LOBBY_FLIP_DURATION = 2450;
const LOBBY_FLIP_DEADLINE = 3000;
const LOBBY_TRANSITION_HISTORY_LIMIT = 10;
const LOBBY_ARRIVAL_HISTORY_LIMIT = 10;
const LOBBY_PLAYBOOK_HISTORY_LIMIT = 30;

function clonePlain(value) {
  return value == null
    ? value
    : JSON.parse(JSON.stringify(value));
}

function easeOutCubic(progress) {
  return 1 - Math.pow(1 - progress, 3);
}

function cardMotionDepthMetrics(
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
  return {
    minimum: -halfDepthSpan * scale,
    maximum: halfDepthSpan * scale,
    visibleCenter:
      Math.abs(depthZ * faceOffset) * scale,
    normalDepth: depthZ
  };
}

class ModernGraphicsSurface {
  constructor(host, options) {
    if (!host) {
      throw new Error('The modern graphics host is unavailable.');
    }

    this.host = host;
    this.options = options || {};
    this.disposed = false;
    this.contextLost = false;
    this.suspended = false;
    this.visibilitySuspended = document.hidden === true;
    this.renderer = null;
    this.canvas = null;
    this.status = 'empty';
    this.generation = 0;
    this.hands = {
      player: [],
      opponent: []
    };
    this.handsKey = null;
    this.dropZones = [];
    this.dropZonesKey = null;
    this.turnIndicator = null;
    this.turnIndicatorKey = null;
    this.turnIndicatorProfile =
      DEFAULT_TURN_MARKER_MOTION_PROFILE;
    this.turnIndicatorEntry = null;
    this.turnIndicatorTexture = null;
    this.turnIndicatorTextureUrl = null;
    this.turnIndicatorStatus = 'empty';
    this.turnIndicatorLoadGeneration = 0;
    this.turnIndicatorMotion = null;
    this.turnIndicatorMotionGeneration = 0;
    this.turnIndicatorAnimationFrameId = null;
    this.turnIndicatorPendingFrameCount = 0;
    this.turnIndicatorPeakPendingFrameCount = 0;
    this.turnIndicatorFrameCount = 0;
    this.snapNextTurnIndicatorUpdate = false;
    this.acceptedTurnIndicatorTransitions = 0;
    this.completedTurnIndicatorTransitions = 0;
    this.cancelledTurnIndicatorTransitions = 0;
    this.ignoredTurnIndicatorNotifications = 0;
    this.ignoredStaleTurnIndicatorNotifications = 0;
    this.snappedTurnIndicatorUpdates = 0;
    this.lastTurnIndicatorTransition = null;
    this.cardEntries = [];
    this.playerPickMeshes = [];
    this.opponentPickMeshes = [];
    this.textures = new Map();
    this.pendingTextureLoads = new Set();
    this.pendingTurnIndicatorTextureLoads =
      new Set();
    this.raycaster = new Raycaster();
    this.pointerNdc = new Vector2();
    this.heldCard = null;
    this.hoveredDropZone = null;
    this.localPreviewPlacement = null;
    this.holdGeneration = 0;
    this.animationFrameId = null;
    this.pendingFrameCount = 0;
    this.peakPendingFrameCount = 0;
    this.frameCount = 0;
    this.inputHandlersAttached = false;
    this.acceptedPickups = 0;
    this.ignoredWhileHeld = 0;
    this.acceptedInvalidReturns = 0;
    this.completedInvalidReturns = 0;
    this.acceptedValidPlacements = 0;
    this.completedValidPlacements = 0;
    this.ignoredUnarmedReturns = 0;
    this.ignoredUnarmedPlacements = 0;
    this.ignoredWhileReturning = 0;
    this.ignoredWhilePlacing = 0;
    this.ignoredAfterPlacement = 0;
    this.dropZoneHoverChanges = 0;
    this.emptyClicks = 0;
    this.opponentClicks = 0;
    this.lastPick = null;
    this.lastReturn = null;
    this.lastPlacement = null;
    this.lastPlacementReset = null;
    this.lastCancellation = null;
    this.randomSource =
      typeof this.options.random === 'function'
        ? this.options.random
        : Math.random;
    this.textureLoadTimeoutMs =
      Number.isFinite(Number(this.options.textureLoadTimeoutMs)) &&
      Number(this.options.textureLoadTimeoutMs) > 0
        ? Number(this.options.textureLoadTimeoutMs)
        : MATCH_HAND_TEXTURE_TIMEOUT_MS;

    try {
      this.scene = new Scene();
      this.camera = new PerspectiveCamera(
        MATCH_CAMERA_FOV,
        LOGICAL_WIDTH / LOGICAL_HEIGHT,
        0.1,
        2000
      );
      this.camera.position.set(
        MATCH_CAMERA_CENTER_X,
        MATCH_CAMERA_CENTER_Y,
        MATCH_CAMERA_DISTANCE
      );
      this.camera.lookAt(
        MATCH_CAMERA_CENTER_X,
        MATCH_CAMERA_CENTER_Y,
        0
      );
      this.cardGroup = new Group();
      this.scene.add(this.cardGroup);
      this.turnIndicatorGroup = new Group();
      this.scene.add(this.turnIndicatorGroup);
      this.cardGeometry = new PlaneGeometry(
        MATCH_CARD_WIDTH,
        MATCH_CARD_HEIGHT
      );
      this.cardBodyGeometry = new BoxGeometry(
        MATCH_CARD_WIDTH - 1.5,
        MATCH_CARD_HEIGHT - 1.5,
        MATCH_CARD_THICKNESS
      );
      this.matchShadowGeometry = new PlaneGeometry(
        MATCH_CARD_WIDTH + 22,
        MATCH_CARD_HEIGHT + 24
      );
      this.cardBodyMaterial = new MeshBasicMaterial({
        color: 0xd4cfc2,
        depthTest: false,
        depthWrite: false,
        toneMapped: false
      });
      this.matchShadowTexture =
        this.createAnalyticShadowTexture();
      this.matchShadowMaterial = new MeshBasicMaterial({
        map: this.matchShadowTexture,
        color: 0x000000,
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false,
        toneMapped: false
      });
      this.dropZoneTexture =
        this.createDropZoneTexture();
      this.dropZoneGeometry = new PlaneGeometry(
        MATCH_CARD_WIDTH,
        MATCH_CARD_HEIGHT
      );
      this.dropZoneMaterial =
        new MeshBasicMaterial({
          map: this.dropZoneTexture,
          color: 0x000000,
          transparent: true,
          opacity: MATCH_DROP_ZONE_OPACITY,
          depthTest: false,
          depthWrite: false,
          toneMapped: false
        });
      this.dropZoneHighlight = new Mesh(
        this.dropZoneGeometry,
        this.dropZoneMaterial
      );
      this.dropZoneHighlight.visible = false;
      this.dropZoneHighlight.renderOrder =
        MATCH_DROP_ZONE_RENDER_ORDER;
      this.cardGroup.add(this.dropZoneHighlight);
      this.turnIndicatorFaceGeometry =
        new CircleGeometry(
          MATCH_TURN_COIN_RADIUS,
          64
        );
      this.turnIndicatorEdgeGeometry =
        new CylinderGeometry(
          MATCH_TURN_COIN_RADIUS,
          MATCH_TURN_COIN_RADIUS,
          MATCH_TURN_COIN_THICKNESS,
          64,
          1,
          true
        );
      this.turnIndicatorShadowGeometry =
        new PlaneGeometry(
          MATCH_TURN_COIN_SHADOW_SIZE,
          MATCH_TURN_COIN_SHADOW_SIZE
        );
      this.turnIndicatorShadowMaterial =
        new MeshBasicMaterial({
          map: this.matchShadowTexture,
          color: 0x000000,
          transparent: true,
          opacity: 0,
          depthTest: false,
          depthWrite: false,
          toneMapped: false
        });
      this.turnIndicatorEdgeMaterial =
        new MeshStandardMaterial({
          color: 0xbebcb6,
          roughness: 0.38,
          metalness: 0.72,
          depthTest: true,
          depthWrite: true,
          toneMapped: false
        });
      this.turnIndicatorHemisphereLight =
        new HemisphereLight(
          0xfff7df,
          0x302a28,
          0.88
        );
      this.turnIndicatorKeyLight =
        new DirectionalLight(0xfff2d5, 1.25);
      this.turnIndicatorKeyLight.position.set(
        150,
        470,
        600
      );
      this.turnIndicatorKeyLight.target.position.set(
        MATCH_CAMERA_CENTER_X,
        MATCH_CAMERA_CENTER_Y,
        0
      );
      this.scene.add(this.turnIndicatorHemisphereLight);
      this.scene.add(this.turnIndicatorKeyLight);
      this.scene.add(
        this.turnIndicatorKeyLight.target
      );
      this.textureLoader = new TextureLoader();
      this.renderer = new WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false
      });
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.outputColorSpace = SRGBColorSpace;
      this.renderer.shadowMap.enabled = false;

      this.canvas = this.renderer.domElement;
      this.canvas.className =
        'modern-graphics-canvas modern-match-hands-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.canvas.setAttribute('tabindex', '-1');
      this.canvas.dataset.threePackageVersion = __PURETT_THREE_PACKAGE_VERSION__;
      this.canvas.dataset.threeRevision = REVISION;
      this.canvas.dataset.modernSurface = 'active-match-hands';

      this.handleContextLost = (event) => {
        event.preventDefault();
        this.contextLost = true;
        this.cancelTurnIndicatorMotion(
          'context-lost',
          false,
          true
        );
        this.cancelPickup('context-lost', false);
        this.clearLocalPreviewPlacement(
          'context-lost',
          false
        );
        this.detachInputHandlers();
        if (typeof this.options.onContextLost === 'function') {
          this.options.onContextLost(new Error('The WebGL context was lost.'));
        }
      };
      this.handleClick = (event) => {
        if (event.button !== 0 || this.suspended) {
          return;
        }
        event.preventDefault();
        if (this.heldCard) {
          const now = performance.now();
          const point = this.clientPoint(
            event.clientX,
            event.clientY
          );
          const dropZone = point
            ? this.findValidDropZone(
                point.logical
              )
            : null;
          if (dropZone) {
            this.beginValidPlacement(
              dropZone,
              now
            );
          } else {
            this.beginInvalidReturn(now);
          }
          return;
        }
        this.pickUpAt(event.clientX, event.clientY);
      };
      this.handlePointerMove = (event) => {
        if (
          !this.heldCard ||
          this.heldCard.phase === 'returning' ||
          this.heldCard.phase === 'placing' ||
          this.suspended ||
          this.visibilitySuspended
        ) {
          return;
        }
        this.moveHeldCard(
          event.clientX,
          event.clientY,
          performance.now()
        );
        this.updateDropZoneHover(
          event.clientX,
          event.clientY
        );
      };
      this.handlePointerLeave = () => {
        if (this.clearDropZoneHover()) {
          this.render();
        }
      };
      this.handleVisibilityChange = () => {
        this.visibilitySuspended =
          document.hidden === true;
        if (this.visibilitySuspended) {
          this.cancelTurnIndicatorMotion(
            'visibility-hidden',
            false,
            true
          );
          this.cancelPickup(
            'visibility-hidden',
            false
          );
          this.clearLocalPreviewPlacement(
            'visibility-hidden',
            false
          );
          this.detachInputHandlers();
          return;
        }
        if (this.turnIndicatorMotion) {
          this.cancelTurnIndicatorMotion(
            'visibility-restored',
            false,
            true
          );
        }
        this.attachInputHandlers();
        this.render();
      };

      this.canvas.addEventListener('webglcontextlost', this.handleContextLost, false);
      document.addEventListener(
        'visibilitychange',
        this.handleVisibilityChange,
        false
      );
      this.host.appendChild(this.canvas);
      this.setContentScale(this.options.contentScale || 1);
    } catch (error) {
      try {
        this.dispose();
      } catch (cleanupError) {
        // Preserve the original initialization error.
      }
      throw error;
    }
  }

  createAnalyticShadowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(
      128,
      128,
      8,
      128,
      128,
      122
    );

    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.58)');
    gradient.addColorStop(0.48, 'rgba(0, 0, 0, 0.31)');
    gradient.addColorStop(0.78, 'rgba(0, 0, 0, 0.09)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);

    const texture = new CanvasTexture(canvas);
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }

  createDropZoneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = MATCH_CARD_WIDTH * 2;
    canvas.height = MATCH_CARD_HEIGHT * 2;
    const context = canvas.getContext('2d');
    const radius =
      MATCH_DROP_ZONE_CORNER_RADIUS * 2;
    const width = canvas.width;
    const height = canvas.height;

    context.clearRect(0, 0, width, height);
    context.beginPath();
    context.moveTo(radius, 0);
    context.lineTo(width - radius, 0);
    context.quadraticCurveTo(
      width,
      0,
      width,
      radius
    );
    context.lineTo(width, height - radius);
    context.quadraticCurveTo(
      width,
      height,
      width - radius,
      height
    );
    context.lineTo(radius, height);
    context.quadraticCurveTo(
      0,
      height,
      0,
      height - radius
    );
    context.lineTo(0, radius);
    context.quadraticCurveTo(
      0,
      0,
      radius,
      0
    );
    context.closePath();
    context.fillStyle = '#000000';
    context.fill();

    const texture = new CanvasTexture(canvas);
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }

  prefersReducedMotion() {
    if (typeof this.options.reducedMotion === 'boolean') {
      return this.options.reducedMotion;
    }
    return typeof window.matchMedia === 'function' &&
      window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
  }

  isPresentationReady() {
    return (
      this.status === 'ready' &&
      Boolean(this.turnIndicator) &&
      this.turnIndicatorStatus === 'ready' &&
      Boolean(this.turnIndicatorEntry)
    );
  }

  attachInputHandlers() {
    if (
      this.inputHandlersAttached ||
      this.disposed ||
      this.contextLost ||
      this.suspended ||
      this.visibilitySuspended ||
      !this.isPresentationReady()
    ) {
      return;
    }

    this.host.addEventListener('click', this.handleClick, false);
    this.host.addEventListener(
      'pointermove',
      this.handlePointerMove,
      false
    );
    this.host.addEventListener(
      'pointerleave',
      this.handlePointerLeave,
      false
    );
    this.inputHandlersAttached = true;
  }

  detachInputHandlers() {
    if (!this.inputHandlersAttached) {
      return;
    }

    this.host.removeEventListener('click', this.handleClick, false);
    this.host.removeEventListener(
      'pointermove',
      this.handlePointerMove,
      false
    );
    this.host.removeEventListener(
      'pointerleave',
      this.handlePointerLeave,
      false
    );
    this.inputHandlersAttached = false;
  }

  clientPoint(clientX, clientY) {
    const bounds = this.canvas.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) {
      return null;
    }

    const normalizedX = (clientX - bounds.left) / bounds.width;
    const normalizedY = (clientY - bounds.top) / bounds.height;
    return {
      logical: {
        x: normalizedX * LOGICAL_WIDTH,
        y: normalizedY * LOGICAL_HEIGHT
      },
      ndc: {
        x: (normalizedX * 2) - 1,
        y: 1 - (normalizedY * 2)
      }
    };
  }

  normalizeDropZones(dropZones) {
    const source =
      Array.isArray(dropZones)
        ? dropZones
        : [];
    if (
      source.length !== 0 &&
      source.length !== 9
    ) {
      return [];
    }

    const seenSlotIndexes = new Set();
    const normalized = [];
    for (let index = 0; index < source.length; index += 1) {
      const zone = source[index];
      const slotIndex = Number(
        zone && zone.slotIndex
      );
      const x = Number(zone && zone.x);
      const y = Number(zone && zone.y);
      const width = Number(zone && zone.width);
      const height = Number(zone && zone.height);
      const cornerRadius = Number(
        zone && zone.cornerRadius
      );

      if (
        !Number.isInteger(slotIndex) ||
        slotIndex < 0 ||
        slotIndex > 8 ||
        seenSlotIndexes.has(slotIndex) ||
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        !Number.isFinite(cornerRadius) ||
        width <= 0 ||
        height <= 0 ||
        cornerRadius < 0 ||
        zone.x == null ||
        zone.y == null ||
        zone.width == null ||
        zone.height == null ||
        zone.cornerRadius == null ||
        x !==
          172 +
          ((slotIndex % 3) * MATCH_CARD_WIDTH) ||
        y !==
          35 +
          (
            Math.floor(slotIndex / 3) *
            MATCH_CARD_HEIGHT
          ) ||
        width !== MATCH_CARD_WIDTH ||
        height !== MATCH_CARD_HEIGHT ||
        cornerRadius !==
          MATCH_DROP_ZONE_CORNER_RADIUS
      ) {
        return [];
      }

      seenSlotIndexes.add(slotIndex);
      const available =
        zone.available === true;
      normalized.push({
        slotIndex,
        x,
        y,
        width,
        height,
        cornerRadius,
        available,
        valid:
          available &&
          zone.valid === true
      });
    }
    return normalized.sort((left, right) =>
      left.slotIndex - right.slotIndex
    );
  }

  dropZoneCenter(zone) {
    return {
      x: zone.x + (zone.width / 2),
      y: zone.y + (zone.height / 2)
    };
  }

  findValidDropZone(logicalPoint) {
    if (
      !logicalPoint ||
      this.localPreviewPlacement
    ) {
      return null;
    }

    return this.dropZones.find((zone) =>
      zone.available === true &&
      zone.valid === true &&
      logicalPoint.x >= zone.x &&
      logicalPoint.x < zone.x + zone.width &&
      logicalPoint.y >= zone.y &&
      logicalPoint.y < zone.y + zone.height
    ) || null;
  }

  clearDropZoneHover() {
    const changed =
      this.hoveredDropZone !== null ||
      (
        this.dropZoneHighlight &&
        this.dropZoneHighlight.visible
      );
    this.hoveredDropZone = null;
    if (this.dropZoneHighlight) {
      this.dropZoneHighlight.visible = false;
    }
    if (changed) {
      this.dropZoneHoverChanges += 1;
    }
    return changed;
  }

  setDropZoneHover(zone) {
    if (
      !zone ||
      !this.heldCard ||
      this.heldCard.phase === 'returning' ||
      this.heldCard.phase === 'placing' ||
      this.localPreviewPlacement
    ) {
      return this.clearDropZoneHover();
    }
    if (
      this.hoveredDropZone &&
      this.hoveredDropZone.slotIndex ===
        zone.slotIndex &&
      this.dropZoneHighlight.visible
    ) {
      return false;
    }

    const center = this.dropZoneCenter(zone);
    const world = this.screenCenterToWorld(
      center.x,
      center.y,
      0
    );
    this.hoveredDropZone = zone;
    this.dropZoneHighlight.position.set(
      world.x,
      world.y,
      0
    );
    this.dropZoneHighlight.scale.set(
      zone.width / MATCH_CARD_WIDTH,
      zone.height / MATCH_CARD_HEIGHT,
      1
    );
    this.dropZoneMaterial.opacity =
      MATCH_DROP_ZONE_OPACITY;
    this.dropZoneHighlight.visible = true;
    this.dropZoneHoverChanges += 1;
    return true;
  }

  updateDropZoneHoverAtLogical(
    logicalPoint,
    shouldRender
  ) {
    const zone = this.findValidDropZone(
      logicalPoint
    );
    const changed = this.setDropZoneHover(zone);
    if (changed && shouldRender !== false) {
      this.render();
    }
    return changed;
  }

  updateDropZoneHover(
    clientX,
    clientY,
    shouldRender
  ) {
    const point = this.clientPoint(
      clientX,
      clientY
    );
    return this.updateDropZoneHoverAtLogical(
      point ? point.logical : null,
      shouldRender
    );
  }

  screenCenterToWorld(screenX, screenY, depth) {
    const planeScale =
      (MATCH_CAMERA_DISTANCE - depth) /
      MATCH_CAMERA_DISTANCE;
    const screenWorldY = LOGICAL_HEIGHT - screenY;
    return {
      x:
        MATCH_CAMERA_CENTER_X +
        ((screenX - MATCH_CAMERA_CENTER_X) * planeScale),
      y:
        MATCH_CAMERA_CENTER_Y +
        ((screenWorldY - MATCH_CAMERA_CENTER_Y) * planeScale)
    };
  }

  worldPointToScreen(worldX, worldY, worldZ) {
    const perspectiveScale =
      MATCH_CAMERA_DISTANCE /
      (MATCH_CAMERA_DISTANCE - worldZ);
    return {
      x:
        MATCH_CAMERA_CENTER_X +
        ((worldX - MATCH_CAMERA_CENTER_X) *
          perspectiveScale),
      y:
        LOGICAL_HEIGHT -
        (
          MATCH_CAMERA_CENTER_Y +
          ((worldY - MATCH_CAMERA_CENTER_Y) *
            perspectiveScale)
        )
    };
  }

  entryRelativePoint(entry, localPoint) {
    const relative = new Vector3(
      localPoint.x,
      localPoint.y,
      MATCH_CARD_FACE_OFFSET
    );
    relative.applyEuler(entry.tilt.rotation);
    relative.x *= entry.root.scale.x;
    relative.y *= entry.root.scale.y;
    relative.z *= entry.root.scale.z;
    return relative;
  }

  settledCenterForGrab(entry, pointer, localGrab, depth) {
    const perspectiveScale =
      MATCH_CAMERA_DISTANCE /
      (MATCH_CAMERA_DISTANCE - depth);
    return {
      x:
        pointer.x -
        (
          localGrab.x *
          entry.root.scale.x *
          perspectiveScale
        ),
      y:
        pointer.y +
        (
          localGrab.y *
          entry.root.scale.y *
          perspectiveScale
        ),
      z: depth
    };
  }

  setEntryRenderOrder(entry, held) {
    if (held) {
      entry.shadowMesh.renderOrder = 1000;
      entry.bodyMesh.renderOrder = 1001;
      entry.mesh.renderOrder = 1002;
      return;
    }

    entry.shadowMesh.renderOrder = entry.baseRenderOrder;
    entry.bodyMesh.renderOrder = entry.baseRenderOrder + 1;
    entry.mesh.renderOrder = entry.baseRenderOrder + 2;
  }

  setEntryPlacedRenderOrder(entry, slotIndex) {
    const base =
      MATCH_PLACED_CARD_RENDER_ORDER +
      (slotIndex * 3);
    entry.shadowMesh.renderOrder = base;
    entry.bodyMesh.renderOrder = base + 1;
    entry.mesh.renderOrder = base + 2;
  }

  applyEntryPose(
    entry,
    screenX,
    screenY,
    depth,
    tiltX,
    tiltY,
    grabPose,
    rotationZ
  ) {
    const resolvedRotationZ =
      Number.isFinite(rotationZ)
        ? rotationZ
        : 0;
    entry.tilt.rotation.set(
      tiltX,
      tiltY,
      resolvedRotationZ
    );
    const rootZ =
      depth - MATCH_CARD_FACE_OFFSET;
    let projectedCenterX = screenX;
    let projectedCenterY = screenY;

    if (grabPose && grabPose.local && grabPose.screen) {
      const relativeGrab = this.entryRelativePoint(
        entry,
        grabPose.local
      );
      const grabWorldZ =
        rootZ + relativeGrab.z;
      const desiredGrabWorld =
        this.screenCenterToWorld(
          grabPose.screen.x,
          grabPose.screen.y,
          grabWorldZ
        );
      entry.root.position.set(
        desiredGrabWorld.x - relativeGrab.x,
        desiredGrabWorld.y - relativeGrab.y,
        rootZ
      );

      const relativeCenter = this.entryRelativePoint(
        entry,
        {x: 0, y: 0}
      );
      const projectedCenter =
        this.worldPointToScreen(
          entry.root.position.x +
            relativeCenter.x,
          entry.root.position.y +
            relativeCenter.y,
          entry.root.position.z +
            relativeCenter.z
        );
      projectedCenterX = projectedCenter.x;
      projectedCenterY = projectedCenter.y;
    } else {
      const world = this.screenCenterToWorld(
        screenX,
        screenY,
        depth
      );
      entry.root.position.set(
        world.x,
        world.y,
        rootZ
      );
    }

    entry.currentPosition.x = projectedCenterX;
    entry.currentPosition.y = projectedCenterY;
    entry.currentPosition.z = depth;
    entry.rotationRadians.x = tiltX;
    entry.rotationRadians.y = tiltY;
    entry.rotationRadians.z =
      resolvedRotationZ;

    if (entry.held && depth > 0.1) {
      const liftRatio = Math.min(
        Math.max(depth / MATCH_PICKUP_LIFT_Z, 0),
        1
      );
      const shadowScreenX =
        projectedCenterX + (5 * liftRatio);
      const shadowScreenY =
        projectedCenterY + (7 * liftRatio);
      entry.shadowMesh.position.set(
        shadowScreenX,
        LOGICAL_HEIGHT - shadowScreenY,
        MATCH_PICKUP_SHADOW_Z
      );
      entry.shadowMesh.scale.setScalar(
        0.93 + (0.12 * liftRatio)
      );
      this.matchShadowMaterial.opacity =
        0.05 + (0.19 * liftRatio);
      entry.shadowMesh.visible = true;
    } else {
      entry.shadowMesh.visible = false;
    }
  }

  resetEntryPose(entry) {
    entry.held = false;
    entry.placed = false;
    entry.placedSlotIndex = null;
    entry.placedPose = null;
    this.setEntryRenderOrder(entry, false);
    this.applyEntryPose(
      entry,
      entry.basePosition.x,
      entry.basePosition.y,
      0,
      0,
      0
    );
    entry.shadowMesh.visible = false;
    this.matchShadowMaterial.opacity = 0;
  }

  selectTopIntersection(intersections) {
    return intersections
      .filter((intersection) =>
        Boolean(
          intersection.object.userData
            .purettCardEntry &&
          intersection.object.userData
            .purettCardEntry.placed !== true
        )
      )
      .sort((left, right) =>
        right.object.userData
          .purettCardEntry.baseRenderOrder -
        left.object.userData
          .purettCardEntry.baseRenderOrder
      )[0] || null;
  }

  pickUpAt(clientX, clientY) {
    if (
      this.disposed ||
      this.contextLost ||
      this.suspended ||
      this.visibilitySuspended ||
      this.status !== 'ready'
    ) {
      return false;
    }
    if (this.heldCard) {
      this.ignoredWhileHeld += 1;
      return false;
    }
    if (this.localPreviewPlacement) {
      this.ignoredAfterPlacement += 1;
      this.lastPick = {
        outcome:
          'renderer-local-placement-already-present',
        gameCardId:
          this.localPreviewPlacement.gameCardId,
        slotIndex:
          this.localPreviewPlacement.slotIndex
      };
      return false;
    }

    const point = this.clientPoint(clientX, clientY);
    if (!point) {
      this.emptyClicks += 1;
      return false;
    }

    this.pointerNdc.set(point.ndc.x, point.ndc.y);
    this.scene.updateMatrixWorld(true);
    this.camera.updateMatrixWorld(true);
    this.raycaster.setFromCamera(
      this.pointerNdc,
      this.camera
    );
    const playerIntersection =
      this.selectTopIntersection(
      this.raycaster.intersectObjects(
        this.playerPickMeshes,
        false
      )
    );
    const entry = playerIntersection
      ? playerIntersection.object.userData
        .purettCardEntry
      : null;

    if (!entry) {
      const opponentIntersection =
        this.selectTopIntersection(
        this.raycaster.intersectObjects(
          this.opponentPickMeshes,
          false
        )
      );
      const opponentEntry = opponentIntersection
        ? opponentIntersection.object.userData
          .purettCardEntry
        : null;
      if (opponentEntry) {
        this.opponentClicks += 1;
        this.lastPick = {
          outcome: 'opponent-inert',
          gameCardId: opponentEntry.card.gameCardId,
          handIndex: opponentEntry.card.handIndex
        };
      } else {
        this.emptyClicks += 1;
        this.lastPick = {
          outcome: 'empty'
        };
      }
      return false;
    }

    const localGrabPoint =
      entry.mesh.worldToLocal(
        playerIntersection.point.clone()
      );
    const now = performance.now();
    const reducedMotion =
      this.prefersReducedMotion();
    entry.held = true;
    this.setEntryRenderOrder(entry, true);
    this.holdGeneration += 1;
    this.heldCard = {
      generation: this.holdGeneration,
      entry,
      phase: reducedMotion
        ? 'held'
        : 'lifting',
      reducedMotion,
      dropArmed: reducedMotion,
      returnMotion: null,
      placementMotion: null,
      base: {
        x: entry.basePosition.x,
        y: entry.basePosition.y,
        z: 0
      },
      currentPointer: {
        x: point.logical.x,
        y: point.logical.y
      },
      targetPointer: {
        x: point.logical.x,
        y: point.logical.y
      },
      depth: 0,
      localGrab: {
        x: localGrabPoint.x,
        y: localGrabPoint.y
      },
      grabOffset: {
        x: point.logical.x - entry.currentPosition.x,
        y: point.logical.y - entry.currentPosition.y
      },
      velocity: {
        x: 0,
        y: 0
      },
      targetVelocity: {
        x: 0,
        y: 0
      },
      tiltX: 0,
      tiltY: 0,
      liftStartedAt: now,
      lastFrameAt: null,
      lastPointerAt: now,
      lastPointerTarget: {
        x: point.logical.x,
        y: point.logical.y
      }
    };
    this.acceptedPickups += 1;
    this.lastPick = {
      outcome: 'player-held',
      gameCardId: entry.card.gameCardId,
      handIndex: entry.card.handIndex,
      grabOffset: {
        x: this.heldCard.grabOffset.x,
        y: this.heldCard.grabOffset.y
      }
    };
    this.host.style.cursor = 'grabbing';

    if (this.heldCard.reducedMotion) {
      this.heldCard.depth = MATCH_PICKUP_LIFT_Z;
      this.applyEntryPose(
        entry,
        entry.currentPosition.x,
        entry.currentPosition.y,
        MATCH_PICKUP_LIFT_Z,
        0,
        0,
        {
          local: this.heldCard.localGrab,
          screen:
            this.heldCard.currentPointer
        }
      );
      this.render();
      return true;
    }

    this.scheduleAnimationFrame();
    return true;
  }

  moveHeldCard(clientX, clientY, now) {
    const held = this.heldCard;
    const point = this.clientPoint(clientX, clientY);
    if (
      !held ||
      held.phase === 'returning' ||
      held.phase === 'placing' ||
      !point
    ) {
      return;
    }

    const nextTargetPointer = {
      x: point.logical.x,
      y: point.logical.y
    };
    const elapsedSeconds = Math.min(
      Math.max(
        (now - held.lastPointerAt) / 1000,
        1 / 240
      ),
      0.05
    );
    let velocityX =
      (
        nextTargetPointer.x -
        held.lastPointerTarget.x
      ) /
      elapsedSeconds;
    let velocityY =
      (
        nextTargetPointer.y -
        held.lastPointerTarget.y
      ) /
      elapsedSeconds;
    const speed = Math.hypot(velocityX, velocityY);

    if (speed > MATCH_PICKUP_MAX_SPEED) {
      const speedScale =
        MATCH_PICKUP_MAX_SPEED / speed;
      velocityX *= speedScale;
      velocityY *= speedScale;
    }

    held.targetPointer.x =
      nextTargetPointer.x;
    held.targetPointer.y =
      nextTargetPointer.y;
    held.targetVelocity.x = velocityX;
    held.targetVelocity.y = velocityY;
    held.lastPointerAt = now;
    held.lastPointerTarget.x =
      nextTargetPointer.x;
    held.lastPointerTarget.y =
      nextTargetPointer.y;

    if (held.reducedMotion) {
      held.currentPointer.x =
        held.targetPointer.x;
      held.currentPointer.y =
        held.targetPointer.y;
      held.depth = MATCH_PICKUP_LIFT_Z;
      held.velocity.x = 0;
      held.velocity.y = 0;
      held.tiltX = 0;
      held.tiltY = 0;
      held.phase = 'held';
      this.applyEntryPose(
        held.entry,
        held.entry.currentPosition.x,
        held.entry.currentPosition.y,
        held.depth,
        0,
        0,
        {
          local: held.localGrab,
          screen: held.currentPointer
        }
      );
      this.render();
      return;
    }

    held.phase = held.depth <
      MATCH_PICKUP_LIFT_Z - 0.01
      ? 'lifting'
      : 'following';
    this.scheduleAnimationFrame();
  }

  ensureHeldDropArmed(now) {
    const held = this.heldCard;
    if (!held) {
      return false;
    }
    if (
      !held.dropArmed &&
      !held.reducedMotion &&
      now - held.liftStartedAt >=
        MATCH_PICKUP_DURATION_MS
    ) {
      this.cancelAnimationFrame();
      this.stepPickup(
        now,
        held.generation,
        false
      );
    }
    return Boolean(
      this.heldCard &&
      this.heldCard.generation ===
        held.generation &&
      this.heldCard.dropArmed
    );
  }

  beginInvalidReturn(now) {
    const held = this.heldCard;
    if (
      !held ||
      this.disposed ||
      this.contextLost ||
      this.suspended ||
      this.visibilitySuspended ||
      this.status !== 'ready'
    ) {
      return false;
    }
    if (held.phase === 'returning') {
      this.ignoredWhileHeld += 1;
      this.ignoredWhileReturning += 1;
      this.lastPick = {
        outcome: 'return-already-running',
        gameCardId: held.entry.card.gameCardId,
        handIndex: held.entry.card.handIndex
      };
      return false;
    }
    if (held.phase === 'placing') {
      this.ignoredWhileHeld += 1;
      this.ignoredWhilePlacing += 1;
      this.lastPick = {
        outcome: 'placement-already-running',
        gameCardId: held.entry.card.gameCardId,
        handIndex: held.entry.card.handIndex,
        slotIndex:
          held.placementMotion
            ? held.placementMotion.slotIndex
            : null
      };
      return false;
    }
    if (!this.ensureHeldDropArmed(now)) {
      this.ignoredWhileHeld += 1;
      this.ignoredUnarmedReturns += 1;
      this.lastPick = {
        outcome: 'return-not-armed',
        gameCardId: held.entry.card.gameCardId,
        handIndex: held.entry.card.handIndex
      };
      return false;
    }

    this.cancelAnimationFrame();
    this.clearDropZoneHover();
    const entry = held.entry;
    const startProjectedScale =
      MATCH_CAMERA_DISTANCE /
      (MATCH_CAMERA_DISTANCE - held.depth);
    const reducedMotion =
      held.reducedMotion ||
      this.prefersReducedMotion();
    held.phase = 'returning';
    held.dropArmed = false;
    held.reducedMotion = reducedMotion;
    held.velocity.x = 0;
    held.velocity.y = 0;
    held.targetVelocity.x = 0;
    held.targetVelocity.y = 0;
    held.lastFrameAt = null;
    held.returnMotion = {
      startedAt: now,
      durationMs:
        MATCH_INVALID_RETURN_DURATION_MS,
      easing:
        MATCH_INVALID_RETURN_EASING,
      screenDirection: 'clockwise',
      progress: 0,
      easedProgress: 0,
      start: {
        x: entry.currentPosition.x,
        y: entry.currentPosition.y,
        depth: held.depth,
        projectedScale: startProjectedScale,
        tiltX: held.tiltX,
        tiltY: held.tiltY,
        rotationZ:
          entry.rotationRadians.z
      },
      destination: {
        x: entry.basePosition.x,
        y: entry.basePosition.y,
        depth: 0,
        projectedScale: 1,
        tiltX: 0,
        tiltY: 0,
        unwrappedRotationZ:
          entry.rotationRadians.z +
          MATCH_INVALID_RETURN_ROTATION_Z,
        normalizedRotationZ: 0
      },
      current: {
        x: entry.currentPosition.x,
        y: entry.currentPosition.y,
        depth: held.depth,
        projectedScale: startProjectedScale,
        tiltX: held.tiltX,
        tiltY: held.tiltY,
        rotationZ:
          entry.rotationRadians.z
      }
    };
    this.setEntryRenderOrder(entry, false);
    this.acceptedInvalidReturns += 1;
    this.lastPick = {
      outcome: 'invalid-return-started',
      gameCardId: entry.card.gameCardId,
      handIndex: entry.card.handIndex
    };
    this.lastReturn = {
      outcome: 'running',
      gameCardId: entry.card.gameCardId,
      handIndex: entry.card.handIndex,
      startedAt: now,
      durationMs:
        MATCH_INVALID_RETURN_DURATION_MS,
      easing:
        MATCH_INVALID_RETURN_EASING,
      screenDirection: 'clockwise',
      reducedMotion
    };
    this.host.style.cursor = '';

    if (reducedMotion) {
      this.completeInvalidReturn(
        now,
        'reduced-motion'
      );
      return true;
    }

    this.render();
    this.scheduleAnimationFrame();
    return true;
  }

  stepInvalidReturn(timestamp, holdGeneration) {
    const held = this.heldCard;
    if (
      !held ||
      held.generation !== holdGeneration ||
      held.phase !== 'returning' ||
      !held.returnMotion
    ) {
      return;
    }

    const motion = held.returnMotion;
    const progress = Math.min(
      Math.max(
        (
          timestamp -
          motion.startedAt
        ) /
        motion.durationMs,
        0
      ),
      1
    );
    const easedProgress =
      easeOutCubic(progress);
    const inverseProgress =
      1 - easedProgress;
    const projectedScale =
      motion.start.projectedScale +
      (
        motion.destination.projectedScale -
        motion.start.projectedScale
      ) *
      easedProgress;
    const depth =
      MATCH_CAMERA_DISTANCE *
      (1 - (1 / projectedScale));
    const screenX =
      motion.start.x +
      (
        motion.destination.x -
        motion.start.x
      ) *
      easedProgress;
    const screenY =
      motion.start.y +
      (
        motion.destination.y -
        motion.start.y
      ) *
      easedProgress;
    const tiltX =
      motion.start.tiltX *
      inverseProgress;
    const tiltY =
      motion.start.tiltY *
      inverseProgress;
    const rotationZ =
      motion.start.rotationZ +
      (
        MATCH_INVALID_RETURN_ROTATION_Z *
        easedProgress
      );

    held.depth = depth;
    held.tiltX = tiltX;
    held.tiltY = tiltY;
    motion.progress = progress;
    motion.easedProgress = easedProgress;
    motion.current = {
      x: screenX,
      y: screenY,
      depth,
      projectedScale,
      tiltX,
      tiltY,
      rotationZ
    };
    this.applyEntryPose(
      held.entry,
      screenX,
      screenY,
      depth,
      tiltX,
      tiltY,
      {
        local: {x: 0, y: 0},
        screen: {x: screenX, y: screenY}
      },
      rotationZ
    );
    this.frameCount += 1;
    this.render();

    if (progress >= 1) {
      this.completeInvalidReturn(
        timestamp,
        'animation'
      );
      return;
    }
    this.scheduleAnimationFrame();
  }

  completeInvalidReturn(
    completedAt,
    completion
  ) {
    const held = this.heldCard;
    if (
      !held ||
      held.phase !== 'returning'
    ) {
      return false;
    }

    const entry = held.entry;
    const motion = held.returnMotion;
    this.cancelAnimationFrame();
    this.holdGeneration += 1;
    this.heldCard = null;
    this.resetEntryPose(entry);
    this.host.style.cursor = '';
    this.completedInvalidReturns += 1;
    this.lastReturn = {
      outcome: 'completed',
      completion,
      gameCardId: entry.card.gameCardId,
      handIndex: entry.card.handIndex,
      startedAt: motion.startedAt,
      completedAt,
      durationMs: motion.durationMs,
      easing: motion.easing,
      screenDirection:
        motion.screenDirection,
      reducedMotion: held.reducedMotion,
      finalPose: {
        x: entry.basePosition.x,
        y: entry.basePosition.y,
        depth: 0,
        projectedScale: 1,
        rotationRadians: {
          x: 0,
          y: 0,
          z: 0
        }
      }
    };
    this.render();
    return true;
  }

  sampleValidPlacementRotation() {
    let unit = 0.5;
    try {
      const sampled = Number(this.randomSource());
      if (Number.isFinite(sampled)) {
        unit = Math.min(
          Math.max(sampled, 0),
          1 - Number.EPSILON
        );
      }
    } catch (error) {
      unit = 0.5;
    }

    const screenDegrees =
      (
        (unit * 2) -
        1
      ) *
      MATCH_VALID_PLACEMENT_ROTATION_RANGE_DEGREES;
    return {
      unit,
      screenDegrees,
      localRadians:
        -screenDegrees * (Math.PI / 180)
    };
  }

  beginValidPlacement(zone, now) {
    const held = this.heldCard;
    const currentZone = zone
      ? this.dropZones.find((candidate) =>
          candidate.slotIndex ===
            zone.slotIndex &&
          candidate.available === true &&
          candidate.valid === true
        )
      : null;
    if (
      !held ||
      !currentZone ||
      this.localPreviewPlacement ||
      this.disposed ||
      this.contextLost ||
      this.suspended ||
      this.visibilitySuspended ||
      this.status !== 'ready'
    ) {
      return false;
    }
    if (held.phase === 'returning') {
      this.ignoredWhileHeld += 1;
      this.ignoredWhileReturning += 1;
      this.lastPick = {
        outcome: 'return-already-running',
        gameCardId: held.entry.card.gameCardId,
        handIndex: held.entry.card.handIndex
      };
      return false;
    }
    if (held.phase === 'placing') {
      this.ignoredWhileHeld += 1;
      this.ignoredWhilePlacing += 1;
      this.lastPick = {
        outcome: 'placement-already-running',
        gameCardId: held.entry.card.gameCardId,
        handIndex: held.entry.card.handIndex,
        slotIndex:
          held.placementMotion
            ? held.placementMotion.slotIndex
            : currentZone.slotIndex
      };
      return false;
    }
    if (!this.ensureHeldDropArmed(now)) {
      this.ignoredWhileHeld += 1;
      this.ignoredUnarmedPlacements += 1;
      this.lastPick = {
        outcome: 'placement-not-armed',
        gameCardId: held.entry.card.gameCardId,
        handIndex: held.entry.card.handIndex,
        slotIndex: currentZone.slotIndex
      };
      return false;
    }

    this.cancelAnimationFrame();
    this.clearDropZoneHover();
    const entry = held.entry;
    const destination =
      this.dropZoneCenter(currentZone);
    const rotation =
      this.sampleValidPlacementRotation();
    const startProjectedScale =
      MATCH_CAMERA_DISTANCE /
      (MATCH_CAMERA_DISTANCE - held.depth);
    const reducedMotion =
      held.reducedMotion ||
      this.prefersReducedMotion();

    held.phase = 'placing';
    held.dropArmed = false;
    held.reducedMotion = reducedMotion;
    held.velocity.x = 0;
    held.velocity.y = 0;
    held.targetVelocity.x = 0;
    held.targetVelocity.y = 0;
    held.lastFrameAt = null;
    held.placementMotion = {
      slotIndex: currentZone.slotIndex,
      placementOrdinal:
        this.acceptedValidPlacements + 1,
      startedAt: now,
      durationMs:
        MATCH_VALID_PLACEMENT_DURATION_MS,
      easing:
        MATCH_VALID_PLACEMENT_EASING,
      progress: 0,
      easedProgress: 0,
      randomUnit: rotation.unit,
      screenRotationDegrees:
        rotation.screenDegrees,
      start: {
        x: entry.currentPosition.x,
        y: entry.currentPosition.y,
        depth: held.depth,
        projectedScale:
          startProjectedScale,
        tiltX: held.tiltX,
        tiltY: held.tiltY,
        rotationZ:
          entry.rotationRadians.z
      },
      destination: {
        x: destination.x,
        y: destination.y,
        depth: 0,
        projectedScale: 1,
        tiltX: 0,
        tiltY: 0,
        rotationZ:
          rotation.localRadians
      },
      current: {
        x: entry.currentPosition.x,
        y: entry.currentPosition.y,
        depth: held.depth,
        projectedScale:
          startProjectedScale,
        tiltX: held.tiltX,
        tiltY: held.tiltY,
        rotationZ:
          entry.rotationRadians.z
      }
    };
    this.setEntryRenderOrder(entry, true);
    this.acceptedValidPlacements += 1;
    this.lastPick = {
      outcome: 'valid-placement-started',
      gameCardId: entry.card.gameCardId,
      handIndex: entry.card.handIndex,
      slotIndex: currentZone.slotIndex
    };
    this.lastPlacement = {
      outcome: 'running',
      gameCardId: entry.card.gameCardId,
      handIndex: entry.card.handIndex,
      slotIndex: currentZone.slotIndex,
      placementOrdinal:
        held.placementMotion.placementOrdinal,
      startedAt: now,
      durationMs:
        MATCH_VALID_PLACEMENT_DURATION_MS,
      easing:
        MATCH_VALID_PLACEMENT_EASING,
      screenRotationDegrees:
        rotation.screenDegrees,
      reducedMotion
    };
    this.host.style.cursor = '';

    if (reducedMotion) {
      this.completeValidPlacement(
        now,
        'reduced-motion'
      );
      return true;
    }

    this.render();
    this.scheduleAnimationFrame();
    return true;
  }

  stepValidPlacement(
    timestamp,
    holdGeneration
  ) {
    const held = this.heldCard;
    if (
      !held ||
      held.generation !== holdGeneration ||
      held.phase !== 'placing' ||
      !held.placementMotion
    ) {
      return;
    }

    const motion = held.placementMotion;
    const progress = Math.min(
      Math.max(
        (
          timestamp -
          motion.startedAt
        ) /
        motion.durationMs,
        0
      ),
      1
    );
    const easedProgress =
      easeOutCubic(progress);
    const inverseProgress =
      1 - easedProgress;
    const projectedScale =
      motion.start.projectedScale +
      (
        motion.destination.projectedScale -
        motion.start.projectedScale
      ) *
      easedProgress;
    const depth =
      MATCH_CAMERA_DISTANCE *
      (1 - (1 / projectedScale));
    const screenX =
      motion.start.x +
      (
        motion.destination.x -
        motion.start.x
      ) *
      easedProgress;
    const screenY =
      motion.start.y +
      (
        motion.destination.y -
        motion.start.y
      ) *
      easedProgress;
    const tiltX =
      motion.start.tiltX *
      inverseProgress;
    const tiltY =
      motion.start.tiltY *
      inverseProgress;
    const rotationZ =
      motion.start.rotationZ +
      (
        motion.destination.rotationZ -
        motion.start.rotationZ
      ) *
      easedProgress;

    held.depth = depth;
    held.tiltX = tiltX;
    held.tiltY = tiltY;
    motion.progress = progress;
    motion.easedProgress = easedProgress;
    motion.current = {
      x: screenX,
      y: screenY,
      depth,
      projectedScale,
      tiltX,
      tiltY,
      rotationZ
    };
    this.applyEntryPose(
      held.entry,
      screenX,
      screenY,
      depth,
      tiltX,
      tiltY,
      {
        local: {x: 0, y: 0},
        screen: {x: screenX, y: screenY}
      },
      rotationZ
    );
    this.frameCount += 1;
    this.render();

    if (progress >= 1) {
      this.completeValidPlacement(
        timestamp,
        'animation'
      );
      return;
    }
    this.scheduleAnimationFrame();
  }

  completeValidPlacement(
    completedAt,
    completion
  ) {
    const held = this.heldCard;
    if (
      !held ||
      held.phase !== 'placing' ||
      !held.placementMotion
    ) {
      return false;
    }

    const entry = held.entry;
    const motion = held.placementMotion;
    const finalPose = {
      x: motion.destination.x,
      y: motion.destination.y,
      depth: 0,
      projectedScale: 1,
      rotationRadians: {
        x: 0,
        y: 0,
        z: motion.destination.rotationZ
      },
      screenRotationDegrees:
        motion.screenRotationDegrees
    };
    this.cancelAnimationFrame();
    this.holdGeneration += 1;
    this.heldCard = null;
    entry.held = false;
    entry.placed = true;
    entry.placedSlotIndex =
      motion.slotIndex;
    entry.placedPose = clonePlain(finalPose);
    this.setEntryPlacedRenderOrder(
      entry,
      motion.slotIndex
    );
    this.applyEntryPose(
      entry,
      finalPose.x,
      finalPose.y,
      0,
      0,
      0,
      null,
      finalPose.rotationRadians.z
    );
    entry.shadowMesh.visible = false;
    this.matchShadowMaterial.opacity = 0;
    this.clearDropZoneHover();
    this.host.style.cursor = '';
    this.completedValidPlacements += 1;
    this.localPreviewPlacement = {
      entry,
      gameCardId: entry.card.gameCardId,
      userCardId: entry.card.userCardId,
      handIndex: entry.card.handIndex,
      slotIndex: motion.slotIndex,
      placementOrdinal:
        motion.placementOrdinal,
      startedAt: motion.startedAt,
      completedAt,
      durationMs: motion.durationMs,
      easing: motion.easing,
      randomUnit: motion.randomUnit,
      screenRotationDegrees:
        motion.screenRotationDegrees,
      finalPose
    };
    this.lastPlacement = {
      outcome: 'completed',
      completion,
      gameCardId: entry.card.gameCardId,
      handIndex: entry.card.handIndex,
      slotIndex: motion.slotIndex,
      placementOrdinal:
        motion.placementOrdinal,
      startedAt: motion.startedAt,
      completedAt,
      durationMs: motion.durationMs,
      easing: motion.easing,
      randomUnit: motion.randomUnit,
      screenRotationDegrees:
        motion.screenRotationDegrees,
      reducedMotion: held.reducedMotion,
      finalPose: clonePlain(finalPose)
    };
    this.render();
    return true;
  }

  scheduleAnimationFrame() {
    if (
      this.animationFrameId !== null ||
      !this.heldCard ||
      this.disposed ||
      this.contextLost ||
      this.suspended ||
      this.visibilitySuspended ||
      this.heldCard.reducedMotion
    ) {
      return;
    }

    this.pendingFrameCount = 1;
    this.peakPendingFrameCount = Math.max(
      this.peakPendingFrameCount,
      this.pendingFrameCount
    );
    const holdGeneration =
      this.heldCard.generation;
    let frameId = null;
    frameId = window.requestAnimationFrame(
      (timestamp) => {
        if (this.animationFrameId !== frameId) {
          return;
        }
        this.animationFrameId = null;
        this.pendingFrameCount = 0;
        if (
          !this.heldCard ||
          this.heldCard.generation !==
            holdGeneration
        ) {
          return;
        }
        this.stepPickup(
          timestamp,
          holdGeneration
        );
      }
    );
    this.animationFrameId = frameId;
  }

  stepPickup(
    timestamp,
    holdGeneration,
    shouldSchedule
  ) {
    const held = this.heldCard;
    if (
      !held ||
      held.generation !== holdGeneration ||
      this.disposed ||
      this.contextLost ||
      this.suspended ||
      this.visibilitySuspended
    ) {
      return;
    }
    if (held.phase === 'returning') {
      this.stepInvalidReturn(
        timestamp,
        holdGeneration
      );
      return;
    }
    if (held.phase === 'placing') {
      this.stepValidPlacement(
        timestamp,
        holdGeneration
      );
      return;
    }

    const elapsedSeconds = held.lastFrameAt === null
      ? 1 / 60
      : Math.min(
        Math.max((timestamp - held.lastFrameAt) / 1000, 1 / 240),
        0.05
      );
    held.lastFrameAt = timestamp;
    const positionBlend =
      1 - Math.exp(
        -MATCH_PICKUP_POSITION_RESPONSE * elapsedSeconds
      );
    held.currentPointer.x +=
      (
        held.targetPointer.x -
        held.currentPointer.x
      ) *
      positionBlend;
    held.currentPointer.y +=
      (
        held.targetPointer.y -
        held.currentPointer.y
      ) *
      positionBlend;

    const wasDropArmed =
      held.dropArmed;
    const liftProgress = Math.min(
      Math.max(
        (timestamp - held.liftStartedAt) /
        MATCH_PICKUP_DURATION_MS,
        0
      ),
      1
    );
    const easedLift =
      easeOutCubic(liftProgress);
    held.depth =
      MATCH_PICKUP_LIFT_Z * easedLift;
    if (liftProgress >= 1) {
      held.dropArmed = true;
    }
    if (
      !wasDropArmed &&
      held.dropArmed
    ) {
      this.updateDropZoneHoverAtLogical(
        held.targetPointer,
        false
      );
    }

    const pointerIsStale =
      timestamp - held.lastPointerAt >
      MATCH_PICKUP_STALE_VELOCITY_MS;
    const desiredVelocityX = pointerIsStale
      ? 0
      : held.targetVelocity.x;
    const desiredVelocityY = pointerIsStale
      ? 0
      : held.targetVelocity.y;
    const velocityResponse = pointerIsStale
      ? MATCH_PICKUP_VELOCITY_DECAY
      : MATCH_PICKUP_VELOCITY_RESPONSE;
    const velocityBlend =
      1 - Math.exp(
        -velocityResponse * elapsedSeconds
      );
    held.velocity.x +=
      (desiredVelocityX - held.velocity.x) *
      velocityBlend;
    held.velocity.y +=
      (desiredVelocityY - held.velocity.y) *
      velocityBlend;

    const targetTiltX =
      Math.max(
        -1,
        Math.min(
          held.velocity.y / MATCH_PICKUP_TILT_SPEED,
          1
        )
      ) * MATCH_PICKUP_MAX_TILT * easedLift;
    const targetTiltY =
      Math.max(
        -1,
        Math.min(
          held.velocity.x / MATCH_PICKUP_TILT_SPEED,
          1
        )
      ) * MATCH_PICKUP_MAX_TILT * easedLift;
    const tiltBlend =
      1 - Math.exp(
        -MATCH_PICKUP_TILT_RESPONSE * elapsedSeconds
      );
    held.tiltX +=
      (targetTiltX - held.tiltX) * tiltBlend;
    held.tiltY +=
      (targetTiltY - held.tiltY) * tiltBlend;

    this.applyEntryPose(
      held.entry,
      held.entry.currentPosition.x,
      held.entry.currentPosition.y,
      held.depth,
      held.tiltX,
      held.tiltY,
      {
        local: held.localGrab,
        screen: held.currentPointer
      }
    );
    this.frameCount += 1;
    this.render();

    const positionUnsettled =
      Math.hypot(
        held.targetPointer.x -
          held.currentPointer.x,
        held.targetPointer.y -
          held.currentPointer.y
      ) > MATCH_PICKUP_POSITION_EPSILON;
    const velocityUnsettled =
      Math.hypot(
        held.velocity.x,
        held.velocity.y
      ) > MATCH_PICKUP_VELOCITY_EPSILON;
    const tiltUnsettled =
      Math.abs(held.tiltX) >
        MATCH_PICKUP_TILT_EPSILON ||
      Math.abs(held.tiltY) >
        MATCH_PICKUP_TILT_EPSILON;
    const liftUnsettled = liftProgress < 1;

    if (
      liftUnsettled ||
      positionUnsettled ||
      velocityUnsettled ||
      tiltUnsettled
    ) {
      held.phase = liftUnsettled
        ? 'lifting'
        : 'following';
      if (shouldSchedule !== false) {
        this.scheduleAnimationFrame();
      }
      return;
    }

    held.currentPointer.x =
      held.targetPointer.x;
    held.currentPointer.y =
      held.targetPointer.y;
    held.depth = MATCH_PICKUP_LIFT_Z;
    held.velocity.x = 0;
    held.velocity.y = 0;
    held.tiltX = 0;
    held.tiltY = 0;
    held.phase = 'held';
    held.dropArmed = true;
    this.applyEntryPose(
      held.entry,
      held.entry.currentPosition.x,
      held.entry.currentPosition.y,
      held.depth,
      0,
      0,
      {
        local: held.localGrab,
        screen: held.currentPointer
      }
    );
    this.render();
  }

  cancelAnimationFrame() {
    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(
        this.animationFrameId
      );
    }
    this.animationFrameId = null;
    this.pendingFrameCount = 0;
  }

  cancelPickup(reason, shouldRender) {
    this.cancelAnimationFrame();
    this.clearDropZoneHover();
    if (!this.heldCard) {
      this.holdGeneration += 1;
      return;
    }

    const held = this.heldCard;
    const entry = held.entry;
    const cancellation = {
      reason,
      gameCardId: entry.card.gameCardId,
      handIndex: entry.card.handIndex,
      phase: held.phase
    };
    if (
      held.phase === 'returning' &&
      held.returnMotion
    ) {
      this.lastReturn = {
        outcome: 'cancelled',
        reason,
        gameCardId: entry.card.gameCardId,
        handIndex: entry.card.handIndex,
        startedAt:
          held.returnMotion.startedAt,
        progress:
          held.returnMotion.progress,
        easedProgress:
          held.returnMotion.easedProgress,
        durationMs:
          held.returnMotion.durationMs,
        easing:
          held.returnMotion.easing,
        screenDirection:
          held.returnMotion.screenDirection,
        reducedMotion:
          held.reducedMotion
      };
    }
    if (
      held.phase === 'placing' &&
      held.placementMotion
    ) {
      this.lastPlacement = {
        outcome: 'cancelled',
        reason,
        gameCardId: entry.card.gameCardId,
        handIndex: entry.card.handIndex,
        slotIndex:
          held.placementMotion.slotIndex,
        placementOrdinal:
          held.placementMotion
            .placementOrdinal,
        startedAt:
          held.placementMotion.startedAt,
        progress:
          held.placementMotion.progress,
        easedProgress:
          held.placementMotion
            .easedProgress,
        durationMs:
          held.placementMotion.durationMs,
        easing:
          held.placementMotion.easing,
        screenRotationDegrees:
          held.placementMotion
            .screenRotationDegrees,
        reducedMotion:
          held.reducedMotion
      };
    }
    this.holdGeneration += 1;
    this.heldCard = null;
    this.resetEntryPose(entry);
    this.host.style.cursor = '';
    this.lastCancellation = cancellation;
    if (shouldRender !== false) {
      this.render();
    }
  }

  clearLocalPreviewPlacement(
    reason,
    shouldRender
  ) {
    const placement =
      this.localPreviewPlacement;
    const hoverChanged =
      this.clearDropZoneHover();
    if (!placement) {
      if (
        hoverChanged &&
        shouldRender !== false
      ) {
        this.render();
      }
      return false;
    }

    this.localPreviewPlacement = null;
    if (
      placement.entry &&
      this.cardEntries.includes(
        placement.entry
      )
    ) {
      this.resetEntryPose(placement.entry);
    }
    this.lastPlacementReset = {
      reason,
      gameCardId: placement.gameCardId,
      handIndex: placement.handIndex,
      slotIndex: placement.slotIndex,
      placementOrdinal:
        placement.placementOrdinal
    };
    if (shouldRender !== false) {
      this.render();
    }
    return true;
  }

  suspend() {
    if (this.disposed) {
      return;
    }
    this.suspended = true;
    this.snapNextTurnIndicatorUpdate = true;
    this.cancelTurnIndicatorMotion(
      'suspend',
      false,
      true
    );
    this.cancelPickup('suspend', false);
    this.clearLocalPreviewPlacement(
      'suspend',
      false
    );
    this.detachInputHandlers();
    this.render();
  }

  resume() {
    if (this.disposed) {
      return;
    }
    this.suspended = false;
    if (
      this.turnIndicatorEntry &&
      this.turnIndicator
    ) {
      this.applyTurnIndicatorPose(
        this.settledTurnIndicatorPose(
          this.turnIndicator
        )
      );
    }
    this.attachInputHandlers();
    this.render();
  }

  setContentScale(contentScale) {
    if (this.disposed) {
      return;
    }

    const scale = Number.isFinite(Number(contentScale)) ? Number(contentScale) : 1;
    const devicePixelRatio = window.devicePixelRatio || 1;
    this.renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio * scale, 1), MAX_PIXEL_RATIO));
    this.renderer.setSize(LOGICAL_WIDTH, LOGICAL_HEIGHT, false);
    this.camera.updateProjectionMatrix();
    this.render();
  }

  normalizeTurnIndicator(indicator) {
    if (indicator == null) {
      return null;
    }
    const sequence = Number(indicator.sequence);
    const side = String(
      indicator.side == null
        ? ''
        : indicator.side
    );
    const x = Number(indicator.x);
    const y = Number(indicator.y);
    const width = Number(indicator.width);
    const height = Number(indicator.height);
    const textureUrl = String(
      indicator.textureUrl || ''
    );
    const textureAllowed =
      textureUrl === '/images/dime-heads.png' ||
      textureUrl === '/images/dime-tails.png';

    if (
      !Number.isInteger(sequence) ||
      sequence < 0 ||
      (
        side !== 'initial' &&
        side !== 'player' &&
        side !== 'opponent'
      ) ||
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width !== MATCH_TURN_COIN_DIAMETER ||
      height !== MATCH_TURN_COIN_DIAMETER ||
      !textureAllowed
    ) {
      throw new Error(
        'The match turn-indicator description is invalid.'
      );
    }

    return {
      sequence,
      side,
      x,
      y,
      width,
      height,
      centerX: x + (width / 2),
      centerY: y + (height / 2),
      textureUrl,
      visible: indicator.visible !== false
    };
  }

  normalizeCard(card, side, handIndex) {
    const width = Number(card && card.width);
    const height = Number(card && card.height);
    const x = Number(card && card.x);
    const y = Number(card && card.y);
    const textureUrl = card && typeof card.textureUrl === 'string'
      ? card.textureUrl
      : '';
    let safeTextureUrl = false;

    try {
      const canonicalTextureUrl = new URL(
        textureUrl,
        window.location.origin
      );
      safeTextureUrl =
        canonicalTextureUrl.origin === window.location.origin &&
        canonicalTextureUrl.search === '' &&
        canonicalTextureUrl.hash === '' &&
        canonicalTextureUrl.pathname === textureUrl &&
        canonicalTextureUrl.pathname.startsWith('/images/cards/') &&
        canonicalTextureUrl.pathname.endsWith('.png') &&
        textureUrl.indexOf('%') === -1 &&
        textureUrl.indexOf('\\') === -1 &&
        textureUrl.indexOf('..') === -1;
    } catch (error) {
      safeTextureUrl = false;
    }

    if (
      !safeTextureUrl ||
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    ) {
      return null;
    }

    return {
      side,
      handIndex,
      gameCardId: card.gameCardId,
      userCardId: card.userCardId,
      owner: card.owner,
      purchased: card.purchased,
      visibleArtKey: card.visibleArtKey,
      face: card.face === 'back' ? 'back' : 'front',
      textureUrl,
      x,
      y,
      width,
      height,
      rotationDegrees: 0,
      zOrder: handIndex
    };
  }

  normalizeHands(hands) {
    const source = hands || {};
    const normalizeSide = (cards, side) => (cards || [])
      .slice(0, 5)
      .map((card, handIndex) => {
        const normalized = this.normalizeCard(
          card,
          side,
          handIndex
        );
        if (!normalized) {
          throw new Error(
            'A match-hand card description is invalid.'
          );
        }
        return normalized;
      });

    return {
      player: normalizeSide(source.player, 'player'),
      opponent: normalizeSide(source.opponent, 'opponent')
    };
  }

  configureTexture(texture) {
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.magFilter = LinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = Math.min(
      4,
      this.renderer.capabilities.getMaxAnisotropy()
    );
    texture.needsUpdate = true;
    return texture;
  }

  loadTexture(
    textureUrl,
    pendingLoads,
    subjectLabel
  ) {
    const loadSet =
      pendingLoads || this.pendingTextureLoads;
    const label =
      subjectLabel || 'match-hand card';
    return new Promise((resolve, reject) => {
      let settled = false;
      let pendingTexture = null;
      let timeoutId = null;
      const settle = (error, texture) => {
        if (settled) {
          if (texture) {
            texture.dispose();
          }
          return;
        }

        settled = true;
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
        }
        loadSet.delete(cancel);
        if (error) {
          if (pendingTexture) {
            pendingTexture.dispose();
          }
          reject(
            error instanceof Error
              ? error
              : new Error(
                `A ${label} texture could not be loaded.`
              )
          );
          return;
        }

        resolve(this.configureTexture(texture));
      };
      const cancel = () => {
        settle(
          new Error(
            `A ${label} texture load was cancelled.`
          )
        );
      };

      loadSet.add(cancel);
      timeoutId = window.setTimeout(() => {
        settle(
          new Error(
            `A ${label} texture load timed out.`
          )
        );
      }, this.textureLoadTimeoutMs);

      try {
        pendingTexture = this.textureLoader.load(
          textureUrl,
          (texture) => settle(null, texture),
          undefined,
          (error) => settle(error)
        );
      } catch (error) {
        settle(error);
      }
    });
  }

  cancelPendingTextureLoads() {
    const cancellations = Array.from(this.pendingTextureLoads);
    this.pendingTextureLoads.clear();
    cancellations.forEach((cancel) => cancel());
  }

  cancelPendingTurnIndicatorTextureLoads() {
    const cancellations = Array.from(
      this.pendingTurnIndicatorTextureLoads
    );
    this.pendingTurnIndicatorTextureLoads.clear();
    cancellations.forEach((cancel) => cancel());
  }

  clearTurnIndicator() {
    this.cancelPendingTurnIndicatorTextureLoads();
    this.cancelTurnIndicatorMotion(
      'turn-indicator-cleared',
      false,
      false
    );
    if (this.turnIndicatorEntry) {
      this.turnIndicatorGroup.remove(
        this.turnIndicatorEntry.root
      );
      this.turnIndicatorGroup.remove(
        this.turnIndicatorEntry.shadowMesh
      );
      this.turnIndicatorEntry.faceMaterial.dispose();
    }
    if (this.turnIndicatorTexture) {
      this.turnIndicatorTexture.dispose();
    }
    this.turnIndicatorEntry = null;
    this.turnIndicatorTexture = null;
    this.turnIndicatorTextureUrl = null;
    this.turnIndicatorStatus = 'empty';
  }

  commitTurnIndicator(texture, descriptor) {
    if (this.turnIndicatorEntry) {
      this.turnIndicatorGroup.remove(
        this.turnIndicatorEntry.root
      );
      this.turnIndicatorGroup.remove(
        this.turnIndicatorEntry.shadowMesh
      );
      this.turnIndicatorEntry.faceMaterial.dispose();
    }
    if (
      this.turnIndicatorTexture &&
      this.turnIndicatorTexture !== texture
    ) {
      this.turnIndicatorTexture.dispose();
    }

    const faceMaterial = new MeshBasicMaterial({
      map: texture,
      color: 0xffffff,
      transparent: true,
      alphaTest: 0.01,
      alphaToCoverage: true,
      depthTest: true,
      depthWrite: true,
      side: FrontSide,
      toneMapped: false
    });
    const root = new Group();
    const projection = new Group();
    const orientation = new Group();
    const frontMesh = new Mesh(
      this.turnIndicatorFaceGeometry,
      faceMaterial
    );
    const backMesh = new Mesh(
      this.turnIndicatorFaceGeometry,
      faceMaterial
    );
    const edgeMesh = new Mesh(
      this.turnIndicatorEdgeGeometry,
      this.turnIndicatorEdgeMaterial
    );
    const shadowMesh = new Mesh(
      this.turnIndicatorShadowGeometry,
      this.turnIndicatorShadowMaterial
    );

    frontMesh.position.z =
      MATCH_TURN_COIN_FACE_OFFSET;
    backMesh.position.z =
      -MATCH_TURN_COIN_FACE_OFFSET;
    backMesh.rotation.y = Math.PI;
    edgeMesh.rotation.x = Math.PI / 2;
    shadowMesh.position.z =
      MATCH_TURN_COIN_SHADOW_Z;
    shadowMesh.renderOrder =
      MATCH_TURN_COIN_RENDER_ORDER - 1;
    edgeMesh.renderOrder =
      MATCH_TURN_COIN_RENDER_ORDER;
    frontMesh.renderOrder =
      MATCH_TURN_COIN_RENDER_ORDER + 1;
    backMesh.renderOrder =
      MATCH_TURN_COIN_RENDER_ORDER + 1;

    orientation.add(edgeMesh);
    orientation.add(frontMesh);
    orientation.add(backMesh);
    projection.matrixAutoUpdate = false;
    projection.add(orientation);
    root.add(projection);
    this.turnIndicatorGroup.add(shadowMesh);
    this.turnIndicatorGroup.add(root);

    this.turnIndicatorTexture = texture;
    this.turnIndicatorTextureUrl =
      descriptor.textureUrl;
    this.turnIndicatorEntry = {
      root,
      projection,
      orientation,
      frontMesh,
      backMesh,
      edgeMesh,
      shadowMesh,
      faceMaterial,
      currentPose: null
    };
    this.applyTurnIndicatorPose(
      this.settledTurnIndicatorPose(descriptor)
    );
  }

  settledTurnIndicatorPose(indicator) {
    return {
      phase: 'settled',
      complete: true,
      progress: 1,
      flightProgress: 1,
      settleProgress: 1,
      screenX: indicator.centerX,
      screenY: indicator.centerY,
      height: 0,
      depth: 0,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      authoredScale: 1,
      shadowOpacity:
        this.turnIndicatorProfile.shadow.strength,
      shadowScale:
        this.turnIndicatorProfile.shadow.spread,
      shadow: {
        strength:
          this.turnIndicatorProfile.shadow.strength,
        spread:
          this.turnIndicatorProfile.shadow.spread
      }
    };
  }

  applyTurnIndicatorProfileAtRest() {
    if (
      !this.turnIndicatorEntry ||
      !this.turnIndicator ||
      this.turnIndicatorMotion
    ) {
      return;
    }
    const current =
      this.turnIndicatorEntry.currentPose ||
      this.settledTurnIndicatorPose(
        this.turnIndicator
      );
    this.applyTurnIndicatorPose(
      Object.assign({}, current, {
        shadowOpacity:
          this.turnIndicatorProfile.shadow
            .strength,
        shadowScale:
          this.turnIndicatorProfile.shadow
            .spread,
        shadow: {
          strength:
            this.turnIndicatorProfile.shadow
              .strength,
          spread:
            this.turnIndicatorProfile.shadow
              .spread
        }
      })
    );
  }

  applyTurnIndicatorPose(pose) {
    const entry = this.turnIndicatorEntry;
    if (!entry || !pose) {
      return;
    }
    const depth = Math.max(
      0,
      Number(pose.height) || 0
    );
    const rotationX =
      Number(pose.rotationX) || 0;
    const rotationY =
      Number(pose.rotationY) || 0;
    const rotationZ =
      Number(pose.rotationZ) || 0;
    const depthMetrics =
      cardMotionDepthMetrics(
        MATCH_TURN_COIN_DIAMETER,
        MATCH_TURN_COIN_DIAMETER,
        MATCH_TURN_COIN_FACE_OFFSET,
        rotationX,
        rotationY,
        rotationZ,
        1
      );
    const rootZ =
      depth - depthMetrics.minimum;
    const visibleCenterDepth =
      rootZ + depthMetrics.visibleCenter;
    const world = this.screenCenterToWorld(
      Number(pose.screenX),
      Number(pose.screenY),
      visibleCenterDepth
    );
    const shadowOpacity = Number.isFinite(
      Number(pose.shadowOpacity)
    )
      ? Number(pose.shadowOpacity)
      : Number(
          pose.shadow &&
          pose.shadow.strength
        ) || 0;
    const shadowScale = Number.isFinite(
      Number(pose.shadowScale)
    )
      ? Number(pose.shadowScale)
      : Number(
          pose.shadow &&
          pose.shadow.spread
        ) || 1;

    entry.root.position.set(
      world.x,
      world.y,
      rootZ
    );
    entry.orientation.rotation.set(
      rotationX,
      rotationY,
      rotationZ
    );
    const screenWorldY =
      LOGICAL_HEIGHT - Number(pose.screenY);
    const horizontalOffset =
      (
        Number(pose.screenX) -
        MATCH_CAMERA_CENTER_X
      ) / MATCH_CAMERA_DISTANCE;
    const verticalOffset =
      (
        screenWorldY -
        MATCH_CAMERA_CENTER_Y
      ) / MATCH_CAMERA_DISTANCE;
    const shearX = -horizontalOffset;
    const shearY = -verticalOffset;
    const anchorDepth =
      depthMetrics.visibleCenter;
    entry.projection.matrix.set(
      1, 0, shearX, -shearX * anchorDepth,
      0, 1, shearY, -shearY * anchorDepth,
      0, 0, 1, 0,
      0, 0, 0, 1
    );
    entry.projection.matrixWorldNeedsUpdate = true;
    entry.shadowMesh.position.set(
      Number(pose.screenX) + (depth * 0.04),
      LOGICAL_HEIGHT -
        (Number(pose.screenY) + (depth * 0.03)),
      MATCH_TURN_COIN_SHADOW_Z
    );
    entry.shadowMesh.scale.set(
      shadowScale *
        MATCH_TURN_COIN_SHADOW_SCALE,
      shadowScale *
        MATCH_TURN_COIN_SHADOW_SCALE,
      1
    );
    this.turnIndicatorShadowMaterial.opacity =
      Math.max(0, Math.min(1, shadowOpacity));
    entry.shadowMesh.visible =
      this.turnIndicatorShadowMaterial.opacity >
        0.002;
    entry.root.visible =
      !this.turnIndicator ||
      this.turnIndicator.visible !== false;
    entry.shadowMesh.visible =
      entry.root.visible &&
      entry.shadowMesh.visible;
    entry.currentPose = clonePlain(pose);
  }

  clearCommittedHands() {
    this.cardEntries.forEach((entry) => {
      this.cardGroup.remove(entry.root);
      this.cardGroup.remove(entry.shadowMesh);
      entry.material.dispose();
    });
    this.cardEntries = [];
    this.playerPickMeshes = [];
    this.opponentPickMeshes = [];
    this.textures.forEach((texture) => texture.dispose());
    this.textures.clear();
  }

  commitHands(cards, textures) {
    this.clearCommittedHands();
    this.textures = textures;
    this.cardEntries = cards.map((card) => {
      const material = new MeshBasicMaterial({
        map: textures.get(card.textureUrl),
        color: 0xffffff,
        transparent: true,
        alphaTest: 0.01,
        depthTest: false,
        depthWrite: false,
        side: FrontSide,
        toneMapped: false
      });
      const root = new Group();
      const tilt = new Group();
      const bodyMesh = new Mesh(
        this.cardBodyGeometry,
        this.cardBodyMaterial
      );
      const mesh = new Mesh(
        this.cardGeometry,
        material
      );
      const shadowMesh = new Mesh(
        this.matchShadowGeometry,
        this.matchShadowMaterial
      );
      const basePosition = {
        x: card.x + (card.width / 2),
        y: card.y + (card.height / 2)
      };
      const baseRenderOrder =
        (card.side === 'player' ? 100 : 0) +
        (card.handIndex * 3);

      root.scale.set(
        card.width / MATCH_CARD_WIDTH,
        card.height / MATCH_CARD_HEIGHT,
        1
      );
      mesh.position.z = MATCH_CARD_FACE_OFFSET;
      mesh.rotation.z = 0;
      shadowMesh.visible = false;
      tilt.add(bodyMesh);
      tilt.add(mesh);
      root.add(tilt);
      this.cardGroup.add(shadowMesh);
      this.cardGroup.add(root);

      const entry = {
        card,
        material,
        root,
        tilt,
        bodyMesh,
        mesh,
        shadowMesh,
        basePosition,
        baseRenderOrder,
        held: false,
        placed: false,
        placedSlotIndex: null,
        placedPose: null,
        currentPosition: {
          x: basePosition.x,
          y: basePosition.y,
          z: 0
        },
        rotationRadians: {
          x: 0,
          y: 0,
          z: 0
        }
      };
      mesh.userData.purettCardEntry = entry;
      this.setEntryRenderOrder(entry, false);
      this.applyEntryPose(
        entry,
        basePosition.x,
        basePosition.y,
        0,
        0,
        0
      );
      if (card.side === 'player') {
        this.playerPickMeshes.push(mesh);
      } else {
        this.opponentPickMeshes.push(mesh);
      }
      return entry;
    });
  }

  setTurnIndicator(indicator, profile) {
    if (this.disposed) {
      return;
    }
    const normalizedProfile =
      normalizeTurnMarkerMotionProfile(
        profile ||
        this.turnIndicatorProfile ||
        DEFAULT_TURN_MARKER_MOTION_PROFILE
      );
    const profileChanged =
      JSON.stringify(normalizedProfile) !==
      JSON.stringify(this.turnIndicatorProfile);
    const normalized =
      this.normalizeTurnIndicator(indicator);
    const previous = this.turnIndicator;
    const previousKey = this.turnIndicatorKey;
    const nextKey = normalized
      ? [
          normalized.side,
          normalized.centerX,
          normalized.centerY,
          normalized.textureUrl,
          normalized.visible
        ].join('|')
      : null;
    const presentationChanged =
      previousKey !== null &&
      nextKey !== previousKey;
    const targetChanged =
      Boolean(previous) &&
      (
        normalized.side !== previous.side ||
        normalized.centerX !==
          previous.centerX ||
        normalized.centerY !==
          previous.centerY
      );

    this.turnIndicatorProfile =
      normalizedProfile;

    if (!normalized) {
      this.turnIndicator = null;
      this.turnIndicatorKey = null;
      this.turnIndicatorLoadGeneration += 1;
      this.detachInputHandlers();
      this.clearTurnIndicator();
      this.render();
      return;
    }

    if (
      previous &&
      (
        normalized.sequence < previous.sequence ||
        (
          targetChanged &&
          normalized.sequence <= previous.sequence
        )
      )
    ) {
      this.ignoredTurnIndicatorNotifications += 1;
      this.ignoredStaleTurnIndicatorNotifications += 1;
      if (
        profileChanged &&
        !this.turnIndicatorMotion
      ) {
        this.applyTurnIndicatorProfileAtRest();
      }
      this.render();
      this.reportReady();
      return;
    }

    const snapForLifecycle =
      this.snapNextTurnIndicatorUpdate ||
      this.suspended ||
      this.visibilitySuspended ||
      this.contextLost;
    this.snapNextTurnIndicatorUpdate = false;
    this.turnIndicator = normalized;
    this.turnIndicatorKey = nextKey;

    if (
      !this.turnIndicatorEntry ||
      this.turnIndicatorTextureUrl !==
        normalized.textureUrl
    ) {
      if (
        this.turnIndicatorStatus === 'loading' &&
        this.turnIndicatorTextureUrl ===
          normalized.textureUrl
      ) {
        return;
      }
      const loadGeneration =
        ++this.turnIndicatorLoadGeneration;
      this.cancelPendingTurnIndicatorTextureLoads();
      this.turnIndicatorStatus = 'loading';
      this.turnIndicatorTextureUrl =
        normalized.textureUrl;
      this.detachInputHandlers();
      this.loadTexture(
        normalized.textureUrl,
        this.pendingTurnIndicatorTextureLoads,
        'match turn-indicator'
      ).then((texture) => {
        if (
          this.disposed ||
          loadGeneration !==
            this.turnIndicatorLoadGeneration ||
          !this.turnIndicator
        ) {
          texture.dispose();
          return;
        }
        this.commitTurnIndicator(
          texture,
          this.turnIndicator
        );
        this.turnIndicatorStatus = 'ready';
        this.attachInputHandlers();
        this.render();
        this.reportReady();
      }).catch((error) => {
        if (
          this.disposed ||
          loadGeneration !==
            this.turnIndicatorLoadGeneration
        ) {
          return;
        }
        this.turnIndicatorStatus = 'error';
        this.turnIndicatorTextureUrl = null;
        this.reportError(
          error instanceof Error
            ? error
            : new Error(
                'The match turn-indicator texture could not be loaded.'
              )
        );
      });
      return;
    }

    this.turnIndicatorStatus = 'ready';
    if (
      targetChanged &&
      previous &&
      normalized.sequence >
        previous.sequence &&
      !snapForLifecycle
    ) {
      this.beginTurnIndicatorTransition(
        previous,
        normalized
      );
    } else {
      this.ignoredTurnIndicatorNotifications +=
        previous ? 1 : 0;
      if (!this.turnIndicatorMotion) {
        if (
          !previous ||
          snapForLifecycle
        ) {
          this.applyTurnIndicatorPose(
            this.settledTurnIndicatorPose(
              normalized
            )
          );
          if (previous && snapForLifecycle) {
            this.snappedTurnIndicatorUpdates += 1;
          }
        } else if (profileChanged) {
          this.applyTurnIndicatorProfileAtRest();
        } else if (
          presentationChanged &&
          this.turnIndicatorEntry &&
          this.turnIndicatorEntry.currentPose
        ) {
          this.applyTurnIndicatorPose(
            this.turnIndicatorEntry.currentPose
          );
        }
      } else if (
        presentationChanged &&
        this.turnIndicatorEntry &&
        this.turnIndicatorEntry.currentPose
      ) {
        this.applyTurnIndicatorPose(
          this.turnIndicatorEntry.currentPose
        );
      }
      this.render();
      this.reportReady();
    }
  }

  beginTurnIndicatorTransition(
    previous,
    destination
  ) {
    const entry = this.turnIndicatorEntry;
    if (!entry) {
      return;
    }
    const sourcePose =
      entry.currentPose ||
      this.settledTurnIndicatorPose(previous);
    const sourceShadowOpacity =
      Number.isFinite(
        Number(sourcePose.shadowOpacity)
      )
        ? Number(sourcePose.shadowOpacity)
        : this.turnIndicatorProfile.shadow
            .strength;
    const sourceShadowScale =
      Number.isFinite(
        Number(sourcePose.shadowScale)
      )
        ? Number(sourcePose.shadowScale)
        : this.turnIndicatorProfile.shadow
            .spread;
    this.cancelTurnIndicatorMotion(
      'superseded',
      false,
      false
    );
    const generation =
      ++this.turnIndicatorMotionGeneration;
    const plan = createTurnMarkerMotionPlan(
      this.turnIndicatorProfile,
      {
        source: {
          x: previous.centerX,
          y: previous.centerY
        },
        destination: {
          x: destination.centerX,
          y: destination.centerY
        },
        sourcePose: {
          screenX: sourcePose.screenX,
          screenY: sourcePose.screenY,
          height:
            Math.max(
              0,
              Number(sourcePose.height) || 0
            ),
          rotationX:
            Number(sourcePose.rotationX) || 0,
          rotationY:
            Number(sourcePose.rotationY) || 0,
          rotationZ:
            Number(sourcePose.rotationZ) || 0,
          shadowOpacity:
            sourceShadowOpacity,
          shadowScale:
            sourceShadowScale
        }
      }
    );
    const reducedMotion =
      this.prefersReducedMotion();
    const startedAt = performance.now();

    this.turnIndicatorMotion = {
      generation,
      sequence: destination.sequence,
      fromSide: previous.side,
      toSide: destination.side,
      startedAt,
      plan,
      progress: 0,
      reducedMotion
    };
    this.acceptedTurnIndicatorTransitions += 1;
    this.lastTurnIndicatorTransition = {
      outcome: 'running',
      sequence: destination.sequence,
      fromSide: previous.side,
      toSide: destination.side,
      startedAt,
      durationMs: plan.timing.totalMs,
      reducedMotion
    };

    if (reducedMotion) {
      this.completeTurnIndicatorTransition(
        startedAt,
        'reduced-motion'
      );
      return;
    }
    this.scheduleTurnIndicatorFrame();
  }

  scheduleTurnIndicatorFrame() {
    if (
      this.turnIndicatorAnimationFrameId !== null ||
      !this.turnIndicatorMotion ||
      this.disposed ||
      this.contextLost ||
      this.suspended ||
      this.visibilitySuspended
    ) {
      return;
    }
    this.turnIndicatorPendingFrameCount = 1;
    this.turnIndicatorPeakPendingFrameCount =
      Math.max(
        this.turnIndicatorPeakPendingFrameCount,
        this.turnIndicatorPendingFrameCount
      );
    const generation =
      this.turnIndicatorMotion.generation;
    let frameId = null;
    frameId = window.requestAnimationFrame(
      (timestamp) => {
        if (
          this.turnIndicatorAnimationFrameId !==
            frameId
        ) {
          return;
        }
        this.turnIndicatorAnimationFrameId = null;
        this.turnIndicatorPendingFrameCount = 0;
        if (
          !this.turnIndicatorMotion ||
          this.turnIndicatorMotion.generation !==
            generation
        ) {
          return;
        }
        this.stepTurnIndicatorTransition(
          timestamp,
          generation
        );
      }
    );
    this.turnIndicatorAnimationFrameId =
      frameId;
  }

  stepTurnIndicatorTransition(
    timestamp,
    generation
  ) {
    const motion = this.turnIndicatorMotion;
    if (
      !motion ||
      motion.generation !== generation ||
      !this.turnIndicatorEntry ||
      this.disposed ||
      this.contextLost ||
      this.suspended ||
      this.visibilitySuspended
    ) {
      return;
    }
    const elapsed = Math.max(
      0,
      timestamp - motion.startedAt
    );
    const pose = sampleTurnMarkerMotion(
      motion.plan,
      elapsed
    );
    motion.progress = pose.progress;
    this.applyTurnIndicatorPose(pose);
    this.turnIndicatorFrameCount += 1;
    this.render();

    if (pose.complete) {
      this.completeTurnIndicatorTransition(
        timestamp,
        'animation'
      );
      return;
    }
    this.scheduleTurnIndicatorFrame();
  }

  completeTurnIndicatorTransition(
    completedAt,
    completion
  ) {
    const motion = this.turnIndicatorMotion;
    if (!motion || !this.turnIndicator) {
      return false;
    }
    if (
      this.turnIndicatorAnimationFrameId !== null
    ) {
      window.cancelAnimationFrame(
        this.turnIndicatorAnimationFrameId
      );
    }
    this.turnIndicatorAnimationFrameId = null;
    this.turnIndicatorPendingFrameCount = 0;
    const finalPose = sampleTurnMarkerMotion(
      motion.plan,
      motion.plan.timing.totalMs
    );
    this.turnIndicatorMotion = null;
    this.applyTurnIndicatorPose(finalPose);
    this.completedTurnIndicatorTransitions += 1;
    this.lastTurnIndicatorTransition = {
      outcome: 'completed',
      completion,
      sequence: motion.sequence,
      fromSide: motion.fromSide,
      toSide: motion.toSide,
      startedAt: motion.startedAt,
      completedAt,
      durationMs:
        motion.plan.timing.totalMs,
      reducedMotion:
        motion.reducedMotion,
      finalPose: clonePlain(finalPose)
    };
    this.render();
    return true;
  }

  cancelTurnIndicatorMotion(
    reason,
    shouldRender,
    settleLatest
  ) {
    if (
      this.turnIndicatorAnimationFrameId !== null
    ) {
      window.cancelAnimationFrame(
        this.turnIndicatorAnimationFrameId
      );
    }
    this.turnIndicatorAnimationFrameId = null;
    this.turnIndicatorPendingFrameCount = 0;
    if (this.turnIndicatorMotion) {
      const motion = this.turnIndicatorMotion;
      this.cancelledTurnIndicatorTransitions += 1;
      this.lastTurnIndicatorTransition = {
        outcome: 'cancelled',
        reason,
        sequence: motion.sequence,
        fromSide: motion.fromSide,
        toSide: motion.toSide,
        startedAt: motion.startedAt,
        progress: motion.progress,
        durationMs:
          motion.plan.timing.totalMs,
        reducedMotion:
          motion.reducedMotion
      };
    }
    this.turnIndicatorMotion = null;
    this.turnIndicatorMotionGeneration += 1;
    if (
      settleLatest === true &&
      this.turnIndicatorEntry &&
      this.turnIndicator
    ) {
      this.applyTurnIndicatorPose(
        this.settledTurnIndicatorPose(
          this.turnIndicator
        )
      );
    }
    if (shouldRender !== false) {
      this.render();
    }
  }

  setHands(hands, dropZones) {
    if (this.disposed) {
      return;
    }

    const normalized = this.normalizeHands(hands);
    const normalizedDropZones =
      this.normalizeDropZones(dropZones);
    const cards = normalized.player.concat(normalized.opponent);
    const nextHandsKey =
      JSON.stringify(normalized);
    const nextDropZonesKey =
      JSON.stringify(normalizedDropZones);
    const handsUnchanged =
      nextHandsKey === this.handsKey;
    const dropZonesChanged =
      nextDropZonesKey !==
        this.dropZonesKey;

    this.hands = normalized;
    this.dropZones = normalizedDropZones;
    if (
      handsUnchanged &&
      (this.status === 'loading' || this.status === 'ready')
    ) {
      if (dropZonesChanged) {
        this.cancelPickup(
          'drop-zones-replaced',
          false
        );
        this.clearLocalPreviewPlacement(
          'drop-zones-replaced',
          false
        );
        this.dropZonesKey =
          nextDropZonesKey;
      }
      if (this.status === 'ready') {
        this.attachInputHandlers();
        this.reportReady();
      }
      this.render();
      return;
    }

    this.cancelPickup('hand-replaced', false);
    this.clearLocalPreviewPlacement(
      'hand-replaced',
      false
    );
    this.detachInputHandlers();
    this.handsKey = nextHandsKey;
    this.dropZonesKey =
      nextDropZonesKey;
    this.generation += 1;
    const generation = this.generation;
    this.cancelPendingTextureLoads();
    this.clearCommittedHands();

    if (cards.length === 0) {
      this.status = 'empty';
      this.render();
      return;
    }

    this.status = 'loading';
    const textureUrls = Array.from(
      new Set(cards.map((card) => card.textureUrl))
    );

    Promise.allSettled(
      textureUrls.map((textureUrl) => this.loadTexture(textureUrl))
    ).then((results) => {
      const loadedTextures = new Map();
      let loadError = null;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          loadedTextures.set(textureUrls[index], result.value);
        } else if (!loadError) {
          loadError = result.reason instanceof Error
            ? result.reason
            : new Error('A match-hand card texture could not be loaded.');
        }
      });

      if (this.disposed || generation !== this.generation) {
        loadedTextures.forEach((texture) => texture.dispose());
        return;
      }
      if (loadError) {
        loadedTextures.forEach((texture) => texture.dispose());
        this.status = 'error';
        this.detachInputHandlers();
        this.reportError(loadError);
        return;
      }

      this.commitHands(cards, loadedTextures);
      this.status = 'ready';
      this.attachInputHandlers();
      this.render();
      this.reportReady();
    });
  }

  render() {
    if (!this.disposed && !this.contextLost) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  reportReady() {
    if (
      this.isPresentationReady() &&
      typeof this.options.onReady === 'function'
    ) {
      this.options.onReady(this.getDebugState());
    }
  }

  reportError(error) {
    if (typeof this.options.onError === 'function') {
      this.options.onError(error);
    }
  }

  getDebugState() {
    const context = this.renderer.getContext();
    const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && context instanceof WebGL2RenderingContext;
    const held = this.heldCard;
    const turnMotion =
      this.turnIndicatorMotion;
    const interactive =
      this.isPresentationReady() &&
      !this.suspended &&
      !this.contextLost &&
      this.inputHandlersAttached;
    const heldTargetCenter = held
      ? (
        held.phase === 'returning'
          ? {
              x: held.entry.basePosition.x,
              y: held.entry.basePosition.y,
              z: 0
            }
          : (
            held.phase === 'placing' &&
            held.placementMotion
              ? {
                  x:
                    held.placementMotion
                      .destination.x,
                  y:
                    held.placementMotion
                      .destination.y,
                  z: 0
                }
          : this.settledCenterForGrab(
              held.entry,
              held.targetPointer,
              held.localGrab,
              MATCH_PICKUP_LIFT_Z
            )
          )
      )
      : null;
    const heldCard = held
      ? {
        gameCardId: held.entry.card.gameCardId,
        userCardId: held.entry.card.userCardId,
        handIndex: held.entry.card.handIndex,
        generation: held.generation,
        phase: held.phase,
        reducedMotion: held.reducedMotion,
        dropArmed: held.dropArmed,
        liftStartedAt: held.liftStartedAt,
        base: {
          x: held.base.x,
          y: held.base.y,
          z: held.base.z
        },
        current: {
          x: held.entry.currentPosition.x,
          y: held.entry.currentPosition.y,
          z: held.depth
        },
        currentPosition: {
          x: held.entry.currentPosition.x,
          y: held.entry.currentPosition.y,
          z: held.depth
        },
        target: {
          x: heldTargetCenter.x,
          y: heldTargetCenter.y,
          z: heldTargetCenter.z
        },
        targetPosition: {
          x: heldTargetCenter.x,
          y: heldTargetCenter.y,
          z: heldTargetCenter.z
        },
        grabOffset: {
          x: held.grabOffset.x,
          y: held.grabOffset.y
        },
        pointerPosition: {
          x: held.targetPointer.x,
          y: held.targetPointer.y
        },
        presentedGrabPoint: {
          x: held.currentPointer.x,
          y: held.currentPointer.y
        },
        localGrabPoint: {
          x: held.localGrab.x,
          y: held.localGrab.y
        },
        liftZ: MATCH_PICKUP_LIFT_Z,
        tiltX: held.tiltX,
        tiltY: held.tiltY,
        rotationRadians: {
          x: held.tiltX,
          y: held.tiltY,
          z:
            held.entry.rotationRadians.z
        },
        velocity: {
          x: held.velocity.x,
          y: held.velocity.y
        },
        projectedScale:
          MATCH_CAMERA_DISTANCE /
          (MATCH_CAMERA_DISTANCE - held.depth),
        perspectiveScale:
          MATCH_CAMERA_DISTANCE /
          (MATCH_CAMERA_DISTANCE - held.depth),
        renderOrder: {
          shadow: held.entry.shadowMesh.renderOrder,
          body: held.entry.bodyMesh.renderOrder,
          face: held.entry.mesh.renderOrder
        },
        returnMotion:
          clonePlain(held.returnMotion),
        placementMotion:
          clonePlain(held.placementMotion)
      }
      : null;
    const localPreviewPlacement =
      this.localPreviewPlacement
        ? {
            gameCardId:
              this.localPreviewPlacement
                .gameCardId,
            userCardId:
              this.localPreviewPlacement
                .userCardId,
            handIndex:
              this.localPreviewPlacement
                .handIndex,
            slotIndex:
              this.localPreviewPlacement
                .slotIndex,
            placementOrdinal:
              this.localPreviewPlacement
                .placementOrdinal,
            startedAt:
              this.localPreviewPlacement
                .startedAt,
            completedAt:
              this.localPreviewPlacement
                .completedAt,
            durationMs:
              this.localPreviewPlacement
                .durationMs,
            easing:
              this.localPreviewPlacement
                .easing,
            randomUnit:
              this.localPreviewPlacement
                .randomUnit,
            screenRotationDegrees:
              this.localPreviewPlacement
                .screenRotationDegrees,
            finalPose:
              clonePlain(
                this.localPreviewPlacement
                  .finalPose
              )
          }
        : null;
    const hoveredDropZone =
      this.hoveredDropZone
        ? {
            slotIndex:
              this.hoveredDropZone
                .slotIndex,
            x: this.hoveredDropZone.x,
            y: this.hoveredDropZone.y,
            width:
              this.hoveredDropZone.width,
            height:
              this.hoveredDropZone.height,
            cornerRadius:
              this.hoveredDropZone
                .cornerRadius
          }
        : null;
    const dropZones = this.dropZones.map(
      (zone) => {
        const locallyOccupied =
          Boolean(
            localPreviewPlacement &&
            localPreviewPlacement.slotIndex ===
              zone.slotIndex
          );
        const valid =
          zone.valid === true &&
          !this.localPreviewPlacement;
        return {
          slotIndex: zone.slotIndex,
          x: zone.x,
          y: zone.y,
          width: zone.width,
          height: zone.height,
          cornerRadius:
            zone.cornerRadius,
          available:
            zone.available === true &&
            !locallyOccupied,
          sourceValid:
            zone.valid === true,
          valid,
          locallyOccupied,
          hovered:
            Boolean(
              hoveredDropZone &&
              hoveredDropZone.slotIndex ===
                zone.slotIndex
            ),
          visible:
            Boolean(
              this.dropZoneHighlight.visible &&
              hoveredDropZone &&
              hoveredDropZone.slotIndex ===
                zone.slotIndex
            )
        };
      }
    );

    return {
      packageVersion: __PURETT_THREE_PACKAGE_VERSION__,
      revision: REVISION,
      contextType: isWebGL2 ? 'webgl2' : 'webgl',
      surface: 'active-match-hands',
      logicalWidth: LOGICAL_WIDTH,
      logicalHeight: LOGICAL_HEIGHT,
      camera: {
        projection: 'perspective',
        fov: this.camera.fov,
        aspect: this.camera.aspect,
        tablePlaneDistance: MATCH_CAMERA_DISTANCE,
        settledPlaneScale: 1,
        position: {
          x: this.camera.position.x,
          y: this.camera.position.y,
          z: this.camera.position.z
        }
      },
      renderPolicy: {
        faceMaterial: 'unlit',
        faceToneMapped: false,
        textureColorSpace: SRGBColorSpace,
        outputColorSpace: this.renderer.outputColorSpace,
        textureMipmaps: true,
        textureAnisotropy: Math.min(
          4,
          this.renderer.capabilities.getMaxAnisotropy()
        ),
        placement: 'legacy-exact-at-rest',
        table: 'flat-top-down',
        interaction:
          'pickup-invalid-return-valid-placement-preview'
      },
      pickupPolicy: {
        activation: 'click',
        maxHeld: 1,
        playerCardsOnly: true,
        preserveGrabOffset: true,
        liftZ: MATCH_PICKUP_LIFT_Z,
        projectedLiftScale:
          MATCH_CAMERA_DISTANCE /
          (MATCH_CAMERA_DISTANCE - MATCH_PICKUP_LIFT_Z),
        maxTiltRadians: MATCH_PICKUP_MAX_TILT,
        follow: 'pointer-with-transient-velocity-tilt',
        drop:
          'second-click-valid-zone-preview-otherwise-invalid',
        dropZoneCount:
          this.dropZones.length,
        validDropZoneCount:
          dropZones.filter(
            (zone) => zone.valid
          ).length,
        hover: {
          visibleOnlyWhen:
            'held-pointer-over-valid-zone',
          color: 'black',
          opacity:
            MATCH_DROP_ZONE_OPACITY,
          cornerRadius:
            MATCH_DROP_ZONE_CORNER_RADIUS,
          persistent: false
        },
        validPlacement: {
          durationMs:
            MATCH_VALID_PLACEMENT_DURATION_MS,
          easing:
            MATCH_VALID_PLACEMENT_EASING,
          reversePickupLift: true,
          exactSlotCenter: true,
          positionJitter: false,
          screenRotationRangeDegrees: [
            -MATCH_VALID_PLACEMENT_ROTATION_RANGE_DEGREES,
            MATCH_VALID_PLACEMENT_ROTATION_RANGE_DEGREES
          ],
          oneRendererLocalPlacementPerSnapshot:
            true,
          submitted: false
        },
        invalidReturn: {
          durationMs:
            MATCH_INVALID_RETURN_DURATION_MS,
          easing:
            MATCH_INVALID_RETURN_EASING,
          screenDirection: 'clockwise',
          rotationRadians:
            MATCH_INVALID_RETURN_ROTATION_Z,
          exactHandSettlement: true
        },
        gameplayAuthority: false
      },
      turnIndicatorPolicy: {
        subject: 'coin',
        diameter:
          MATCH_TURN_COIN_DIAMETER,
        thickness:
          MATCH_TURN_COIN_THICKNESS,
        textureFaces: 'same-approved-image',
        faceMaterial: 'unlit-srgb',
        edgeMaterial: 'lit-metallic',
        depthOcclusion: 'self-occluding',
        projection: 'flat-table-neutralized',
        endpoints:
          clonePlain(
            TURN_MARKER_MATCH_CENTERS
          ),
        profile:
          clonePlain(
            this.turnIndicatorProfile
          ),
        motion:
          'deterministic-arc-flip-tumble-spin-settle',
        gameplayAuthority: false
      },
      pixelRatio: this.renderer.getPixelRatio(),
      disposed: this.disposed,
      contextLost: this.contextLost,
      suspended: this.suspended,
      visibilitySuspended:
        this.visibilitySuspended,
      status: this.status,
      ready: this.isPresentationReady(),
      interactive,
      inputHandlersAttached:
        this.inputHandlersAttached,
      reducedMotion: this.prefersReducedMotion(),
      rafActive: this.animationFrameId !== null,
      pendingFrameCount: this.pendingFrameCount,
      peakPendingFrameCount:
        this.peakPendingFrameCount,
      frameCount: this.frameCount,
      turnIndicatorRafActive:
        this.turnIndicatorAnimationFrameId !==
          null,
      turnIndicatorPendingFrameCount:
        this.turnIndicatorPendingFrameCount,
      turnIndicatorPeakPendingFrameCount:
        this.turnIndicatorPeakPendingFrameCount,
      turnIndicatorFrameCount:
        this.turnIndicatorFrameCount,
      pendingHandTextureLoadCount:
        this.pendingTextureLoads.size,
      pendingTurnIndicatorTextureLoadCount:
        this.pendingTurnIndicatorTextureLoads
          .size,
      turnIndicatorStatus:
        this.turnIndicatorStatus,
      turnIndicator:
        this.turnIndicator
          ? {
              descriptor:
                clonePlain(
                  this.turnIndicator
                ),
              currentPose:
                this.turnIndicatorEntry
                  ? clonePlain(
                      this.turnIndicatorEntry
                        .currentPose
                    )
                  : null,
              motion: turnMotion
                ? {
                    generation:
                      turnMotion.generation,
                    sequence:
                      turnMotion.sequence,
                    fromSide:
                      turnMotion.fromSide,
                    toSide:
                      turnMotion.toSide,
                    startedAt:
                      turnMotion.startedAt,
                    durationMs:
                      turnMotion.plan.timing
                        .totalMs,
                    progress:
                      turnMotion.progress,
                    reducedMotion:
                      turnMotion.reducedMotion,
                    plan:
                      clonePlain(
                        turnMotion.plan
                      )
                  }
                : null,
              visible:
                Boolean(
                  this.turnIndicatorEntry &&
                  this.turnIndicatorEntry.root
                    .visible
                )
            }
          : null,
      acceptedTurnIndicatorTransitions:
        this.acceptedTurnIndicatorTransitions,
      completedTurnIndicatorTransitions:
        this.completedTurnIndicatorTransitions,
      cancelledTurnIndicatorTransitions:
        this.cancelledTurnIndicatorTransitions,
      ignoredTurnIndicatorNotifications:
        this.ignoredTurnIndicatorNotifications,
      ignoredStaleTurnIndicatorNotifications:
        this.ignoredStaleTurnIndicatorNotifications,
      snappedTurnIndicatorUpdates:
        this.snappedTurnIndicatorUpdates,
      lastTurnIndicatorTransition:
        clonePlain(
          this.lastTurnIndicatorTransition
        ),
      holdGeneration: this.holdGeneration,
      heldCard,
      acceptedPickups: this.acceptedPickups,
      ignoredWhileHeld: this.ignoredWhileHeld,
      acceptedInvalidReturns:
        this.acceptedInvalidReturns,
      completedInvalidReturns:
        this.completedInvalidReturns,
      ignoredUnarmedReturns:
        this.ignoredUnarmedReturns,
      ignoredUnarmedPlacements:
        this.ignoredUnarmedPlacements,
      ignoredWhileReturning:
        this.ignoredWhileReturning,
      ignoredWhilePlacing:
        this.ignoredWhilePlacing,
      ignoredAfterPlacement:
        this.ignoredAfterPlacement,
      acceptedValidPlacements:
        this.acceptedValidPlacements,
      completedValidPlacements:
        this.completedValidPlacements,
      dropZoneHoverChanges:
        this.dropZoneHoverChanges,
      emptyClicks: this.emptyClicks,
      opponentClicks: this.opponentClicks,
      dropZones,
      hoveredDropZone,
      visibleDropZoneCount:
        dropZones.filter(
          (zone) => zone.visible
        ).length,
      dropZoneHighlight: {
        visible:
          this.dropZoneHighlight.visible,
        opacity:
          this.dropZoneMaterial.opacity,
        color: 'black',
        renderOrder:
          this.dropZoneHighlight
            .renderOrder
      },
      localPreviewPlacement,
      semanticActionCount: 0,
      requestCount: 0,
      lastPick: clonePlain(this.lastPick),
      lastReturn:
        clonePlain(this.lastReturn),
      lastPlacement:
        clonePlain(this.lastPlacement),
      lastPlacementReset:
        clonePlain(
          this.lastPlacementReset
        ),
      lastCancellation:
        clonePlain(this.lastCancellation),
      playerCount: this.hands.player.length,
      opponentCount: this.hands.opponent.length,
      meshCount: this.cardEntries.length,
      textureCount: this.textures.size,
      drawCalls: this.renderer.info.render.calls,
      cards: this.hands.player.concat(this.hands.opponent)
        .map((card, index) => {
          const entry = this.cardEntries[index];
          return {
            side: card.side,
            handIndex: card.handIndex,
            gameCardId: card.gameCardId,
            userCardId: card.userCardId,
            owner: card.owner,
            visibleArtKey: card.visibleArtKey,
            face: card.face,
            textureUrl: card.textureUrl,
            screenRect: {
              x: card.x,
              y: card.y,
              width: card.width,
              height: card.height
            },
            currentPosition: entry
              ? {
                x: entry.currentPosition.x,
                y: entry.currentPosition.y,
                z: entry.currentPosition.z
              }
              : {
                x: card.x + (card.width / 2),
                y: card.y + (card.height / 2),
                z: 0
              },
            rotationRadians: entry
              ? {
                x: entry.rotationRadians.x,
                y: entry.rotationRadians.y,
                z: entry.rotationRadians.z
              }
              : {
                x: 0,
                y: 0,
                z: 0
              },
            rotationDegrees: entry
              ? -(
                  entry.rotationRadians.z *
                  (180 / Math.PI)
                )
              : 0,
            zOrder: card.zOrder,
            pickable:
              card.side === 'player' &&
              !this.localPreviewPlacement &&
              Boolean(
                !entry ||
                entry.placed !== true
              ),
            held: Boolean(entry && entry.held),
            placed:
              Boolean(
                entry &&
                entry.placed
              ),
            placedSlotIndex:
              entry
                ? entry.placedSlotIndex
                : null,
            visible: this.status === 'ready'
          };
        })
    };
  }

  dispose() {
    if (this.disposed) {
      return;
    }

    this.clearTurnIndicator();
    this.cancelPickup('dispose', false);
    this.clearLocalPreviewPlacement(
      'dispose',
      false
    );
    this.detachInputHandlers();
    this.disposed = true;
    this.generation += 1;
    this.cancelPendingTextureLoads();
    this.clearCommittedHands();
    if (this.cardGeometry) {
      this.cardGeometry.dispose();
    }
    if (this.cardBodyGeometry) {
      this.cardBodyGeometry.dispose();
    }
    if (this.matchShadowGeometry) {
      this.matchShadowGeometry.dispose();
    }
    if (this.cardBodyMaterial) {
      this.cardBodyMaterial.dispose();
    }
    if (this.matchShadowMaterial) {
      this.matchShadowMaterial.dispose();
    }
    if (this.matchShadowTexture) {
      this.matchShadowTexture.dispose();
    }
    if (this.dropZoneGeometry) {
      this.dropZoneGeometry.dispose();
    }
    if (this.dropZoneMaterial) {
      this.dropZoneMaterial.dispose();
    }
    if (this.dropZoneTexture) {
      this.dropZoneTexture.dispose();
    }
    if (this.turnIndicatorFaceGeometry) {
      this.turnIndicatorFaceGeometry.dispose();
    }
    if (this.turnIndicatorEdgeGeometry) {
      this.turnIndicatorEdgeGeometry.dispose();
    }
    if (this.turnIndicatorShadowGeometry) {
      this.turnIndicatorShadowGeometry.dispose();
    }
    if (this.turnIndicatorShadowMaterial) {
      this.turnIndicatorShadowMaterial.dispose();
    }
    if (this.turnIndicatorEdgeMaterial) {
      this.turnIndicatorEdgeMaterial.dispose();
    }
    if (this.canvas && this.handleContextLost) {
      this.canvas.removeEventListener('webglcontextlost', this.handleContextLost, false);
    }
    if (this.handleVisibilityChange) {
      document.removeEventListener(
        'visibilitychange',
        this.handleVisibilityChange,
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
    this.host.style.cursor = '';
  }
}

class LobbyHandSurface {
  constructor(host, options) {
    if (!host) {
      throw new Error('The modern lobby hand host is unavailable.');
    }

    this.host = host;
    this.options = options || {};
    this.disposed = false;
    this.contextLost = false;
    this.renderer = null;
    this.canvas = null;
    this.generation = 0;
    this.status = 'idle';
    this.cardKey = null;
    this.cards = [];
    this.meshes = [];
    this.pickMeshes = [];
    this.cardEntries = [];
    this.textures = new Map();
    this.materials = [];
    this.raycaster = new Raycaster();
    this.pointer = new Vector2();
    this.suspended = false;
    this.activeAnimations = new Map();
    this.animationFrameId = null;
    this.animationFrameCount = 0;
    this.activationSequence = 0;
    this.peakConcurrentAnimationCount = 0;
    this.acceptedClicks = 0;
    this.ignoredClicks = 0;
    this.emptyClicks = 0;
    this.completedAnimationCount = 0;
    this.completedArrivalCount = 0;
    this.peakConcurrentArrivalCount = 0;
    this.lastPick = null;
    this.lastTransition = null;
    this.transitionHistory = [];
    this.pendingArrivalRequest = null;
    this.consumedArrivalRequestIds = new Set();
    this.lastArrivalBatch = null;
    this.lastArrivalTransition = null;
    this.arrivalTransitionHistory = [];
    this.playbook = normalizeLobbyMotionPlaybook(
      DEFAULT_LOBBY_MOTION_PLAYBOOK
    );
    this.pendingPlaybookRequest = null;
    this.consumedPlaybookRequestIds = new Set();
    this.lastPlaybookBatch = null;
    this.playbookTransitionHistory = [];
    this.activePlaybookCompletion = null;
    this.completedPlaybookIntroCount = 0;
    this.completedPlaybookExitCount = 0;

    try {
      this.scene = new Scene();
      this.camera = new PerspectiveCamera(
        LOBBY_CAMERA_FOV,
        LOBBY_LOGICAL_WIDTH / LOBBY_LOGICAL_HEIGHT,
        450,
        900
      );
      this.camera.position.set(
        LOBBY_CAMERA_CENTER_X,
        LOBBY_CAMERA_CENTER_Y,
        LOBBY_CAMERA_DISTANCE
      );
      this.camera.lookAt(LOBBY_CAMERA_CENTER_X, LOBBY_CAMERA_CENTER_Y, 0);
      this.cardGroup = new Group();
      this.scene.add(this.cardGroup);
      this.cardGeometry = new PlaneGeometry(117, 146);
      this.cardBodyGeometry = new BoxGeometry(
        115.5,
        144.5,
        LOBBY_CARD_THICKNESS
      );
      this.liftShadowGeometry = new PlaneGeometry(132, 164);
      this.liftShadowTexture = this.createAnalyticShadowTexture();

      this.hemisphereLight = new HemisphereLight(0xfff4df, 0x251821, 0.72);
      this.keyLight = new DirectionalLight(0xffe8bd, 1.3);
      this.keyLight.position.set(160, 510, 650);
      this.keyLight.target.position.set(
        LOBBY_CAMERA_CENTER_X,
        LOBBY_CAMERA_CENTER_Y,
        0
      );
      this.scene.add(this.hemisphereLight);
      this.scene.add(this.keyLight);
      this.scene.add(this.keyLight.target);

      this.textureLoader = new TextureLoader();
      this.renderer = new WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false
      });
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.outputColorSpace = SRGBColorSpace;
      this.renderer.shadowMap.enabled = false;

      this.canvas = this.renderer.domElement;
      this.canvas.className = 'modern-graphics-canvas modern-lobby-hand-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.canvas.setAttribute('tabindex', '-1');
      this.canvas.dataset.threePackageVersion = __PURETT_THREE_PACKAGE_VERSION__;
      this.canvas.dataset.threeRevision = REVISION;
      this.canvas.dataset.modernSurface = 'lobby-hand';
      this.inputTarget = this.host.closest('#menu') || this.host.parentElement || this.host;
      this.inputTargetCursor = this.inputTarget.style.cursor;
      this.inputHandlersAttached = false;

      this.handleCanvasClick = (event) => {
        this.onCanvasClick(event);
      };
      this.handleCanvasPointerMove = (event) => {
        this.onCanvasPointerMove(event);
      };
      this.handleCanvasPointerLeave = () => {
        this.restoreInputCursor();
      };
      this.handleContextLost = (event) => {
        event.preventDefault();
        this.cancelAnimations('context-lost', false);
        this.detachInputHandlers();
        this.contextLost = true;
        this.status = 'context-lost';
        if (typeof this.options.onContextLost === 'function') {
          this.options.onContextLost(new Error('The lobby hand WebGL context was lost.'));
        }
      };

      this.canvas.addEventListener('webglcontextlost', this.handleContextLost, false);
      this.host.appendChild(this.canvas);
      this.setContentScale(this.options.contentScale || 1);
    } catch (error) {
      try {
        this.dispose();
      } catch (cleanupError) {
        // Preserve the original initialization error.
      }
      throw error;
    }
  }

  createAnalyticShadowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 160;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('The lobby contact-shadow canvas is unavailable.');
    }

    context.save();
    context.scale(1, 1.25);
    const gradient = context.createRadialGradient(64, 64, 8, 64, 64, 62);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    gradient.addColorStop(0.55, 'rgba(0, 0, 0, 0.36)');
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

  normalizeCards(cards) {
    return (cards || []).slice(0, 5).map((card, index) => {
      const width = Number(card.width);
      const height = Number(card.height);
      const x = Number(card.x);
      const y = Number(card.y);
      const textureUrl = String(card.textureUrl || '');
      const backTextureUrl = String(card.backTextureUrl || LOBBY_CARD_BACK_URL);

      if (!textureUrl || !backTextureUrl || !Number.isFinite(x) || !Number.isFinite(y) ||
          !Number.isFinite(width) || !Number.isFinite(height) ||
          width <= 0 || height <= 0) {
        throw new Error(`Lobby hand card ${index + 1} has invalid rendering data.`);
      }

      return {
        index: Number.isFinite(Number(card.index)) ? Number(card.index) : index,
        userCardId: card.userCardId == null ? null : card.userCardId,
        cardId: card.cardId == null ? null : card.cardId,
        textureUrl,
        backTextureUrl,
        x,
        y,
        width,
        height,
        rotationDegrees: 0
      };
    });
  }

  normalizeArrivalRequest(options) {
    const request = options && options.arrival;
    if (!request || request.id == null) {
      return null;
    }

    return {
      id: String(request.id),
      trigger: request.trigger
        ? String(request.trigger)
        : 'command-bar-reveal',
      profile: request.profile
        ? String(request.profile)
        : CASUAL_DROP_LEFT_PROFILE.name,
      seed: request.seed == null ? null : String(request.seed),
      startedAtMs: request.startedAtMs != null &&
          Number.isFinite(Number(request.startedAtMs))
        ? Number(request.startedAtMs)
        : null
    };
  }

  normalizePlaybookRequest(options) {
    const request = options && options.playbookRequest;
    if (!request || request.id == null) {
      return null;
    }
    const sequence = request.sequence === 'exit'
      ? 'exit'
      : 'intro';
    return {
      id: String(request.id),
      sequence,
      trigger: request.trigger
        ? String(request.trigger)
        : (
          sequence === 'exit'
            ? 'lobby-command'
            : 'command-bar-reveal'
        ),
      seed: request.seed == null
        ? null
        : String(request.seed),
      startedAtMs: request.startedAtMs != null &&
          Number.isFinite(Number(request.startedAtMs))
        ? Number(request.startedAtMs)
        : null
    };
  }

  setPlaybook(playbook) {
    this.playbook = normalizeLobbyMotionPlaybook(
      playbook || DEFAULT_LOBBY_MOTION_PLAYBOOK
    );
  }

  setCards(cards, options) {
    if (this.disposed || this.contextLost) {
      return;
    }

    this.resume();
    let normalized;
    try {
      normalized = this.normalizeCards(cards);
    } catch (error) {
      this.reportError(error);
      return;
    }
    const cardKey = JSON.stringify(normalized.map((card) => [
      card.userCardId,
      card.cardId,
      card.textureUrl,
      card.backTextureUrl,
      card.x,
      card.y,
      card.width,
      card.height
    ]));
    if (options && options.playbook) {
      try {
        this.setPlaybook(options.playbook);
      } catch (error) {
        this.reportError(error);
        return;
      }
    }
    const playbookRequest = this.normalizePlaybookRequest(options);
    const arrivalRequest = this.normalizeArrivalRequest(options);
    if (playbookRequest &&
        !this.consumedPlaybookRequestIds.has(playbookRequest.id)) {
      this.pendingPlaybookRequest = playbookRequest;
      this.pendingArrivalRequest = null;
    } else if (arrivalRequest &&
        !this.consumedArrivalRequestIds.has(arrivalRequest.id)) {
      this.pendingArrivalRequest = arrivalRequest;
      this.pendingPlaybookRequest = null;
    } else if (cardKey !== this.cardKey) {
      this.pendingArrivalRequest = null;
      this.pendingPlaybookRequest = null;
    }

    if (cardKey === this.cardKey && this.status === 'ready') {
      if (this.pendingPlaybookRequest) {
        this.cancelAnimations('replaced');
        this.preparePendingPlaybook();
      } else if (this.pendingArrivalRequest) {
        this.cancelAnimations('replaced');
        this.preparePendingArrival();
      }
      this.presentReady();
      this.scheduleAnimationFrame();
      return;
    }
    if (cardKey === this.cardKey && this.status === 'loading') {
      return;
    }

    const generation = ++this.generation;
    this.cancelAnimations('replaced');
    this.detachInputHandlers();
    this.cardKey = cardKey;
    this.status = 'loading';
    this.cards = normalized;
    this.clearCommittedCards();
    this.render();

    const textureUrls = Array.from(new Set(normalized.reduce((urls, card) => (
      urls.concat([card.textureUrl, card.backTextureUrl])
    ), [])));
    if (!textureUrls.length) {
      this.status = 'ready';
      if (this.pendingPlaybookRequest) {
        this.consumePendingPlaybookWithoutMotion('empty');
      } else {
        this.consumePendingArrivalWithoutMotion('empty');
      }
      this.presentReady();
      return;
    }

    const texturePromises = textureUrls.map((textureUrl) => (
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

    Promise.allSettled(texturePromises).then((results) => {
      const loaded = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);

      if (this.disposed || generation !== this.generation) {
        loaded.forEach((entry) => entry.texture.dispose());
        return;
      }

      const failed = results.find((result) => result.status === 'rejected');
      if (failed) {
        loaded.forEach((entry) => entry.texture.dispose());
        this.status = 'failed';
        this.reportError(new Error(
          `A lobby card texture could not be loaded. ${this.errorMessage(failed.reason)}`
        ));
        return;
      }

      try {
        loaded.forEach((entry) => this.textures.set(entry.textureUrl, entry.texture));
        this.commitCards();
        if (this.pendingPlaybookRequest) {
          this.preparePendingPlaybook();
        } else {
          this.preparePendingArrival();
        }
        this.status = 'ready';
        this.presentReady();
        this.scheduleAnimationFrame();
      } catch (error) {
        this.clearCommittedCards();
        this.status = 'failed';
        this.reportError(error);
      }
    });
  }

  commitCards() {
    const backMaterials = new Map();
    const bodyMaterial = new MeshStandardMaterial({
      color: 0xc8b892,
      roughness: 0.82,
      metalness: 0,
      depthTest: true,
      depthWrite: true,
      toneMapped: false
    });
    const hiddenBodyCapMaterial = new MeshBasicMaterial({
      visible: false
    });
    const bodyMaterials = [
      bodyMaterial,
      bodyMaterial,
      bodyMaterial,
      bodyMaterial,
      hiddenBodyCapMaterial,
      hiddenBodyCapMaterial
    ];
    this.materials.push(bodyMaterial, hiddenBodyCapMaterial);

    this.cards.forEach((card) => {
      const frontMaterial = new MeshBasicMaterial({
        color: 0xffffff,
        map: this.textures.get(card.textureUrl),
        transparent: false,
        alphaTest: 0.5,
        alphaToCoverage: true,
        depthTest: true,
        depthWrite: true,
        side: FrontSide,
        toneMapped: false
      });
      let backMaterial = backMaterials.get(card.backTextureUrl);
      if (!backMaterial) {
        backMaterial = new MeshBasicMaterial({
          color: 0xffffff,
          map: this.textures.get(card.backTextureUrl),
          transparent: false,
          alphaTest: 0.5,
          alphaToCoverage: true,
          depthTest: true,
          depthWrite: true,
          side: FrontSide,
          toneMapped: false
        });
        backMaterials.set(card.backTextureUrl, backMaterial);
        this.materials.push(backMaterial);
      }

      const motionRoot = new Group();
      const tiltRoot = new Group();
      const projectionRoot = new Group();
      const pickupRoot = new Group();
      const flipRoot = new Group();
      const bodyMesh = new Mesh(this.cardBodyGeometry, bodyMaterials);
      const frontMesh = new Mesh(this.cardGeometry, frontMaterial);
      const backMesh = new Mesh(this.cardGeometry, backMaterial);
      const liftShadowMaterial = new MeshBasicMaterial({
        map: this.liftShadowTexture,
        transparent: true,
        opacity: 0,
        depthTest: true,
        depthWrite: false
      });
      const liftShadow = new Mesh(this.liftShadowGeometry, liftShadowMaterial);
      const basePosition = {
        x: card.x + (card.width / 2),
        y: LOBBY_LOGICAL_HEIGHT - card.y - (card.height / 2),
        z: -LOBBY_CARD_FACE_OFFSET
      };

      motionRoot.position.set(
        basePosition.x,
        basePosition.y,
        basePosition.z
      );
      tiltRoot.rotation.z = 0;
      frontMesh.position.z = LOBBY_CARD_FACE_OFFSET;
      backMesh.position.z = -LOBBY_CARD_FACE_OFFSET;
      backMesh.rotation.x = Math.PI;
      liftShadow.position.z = LOBBY_ANALYTIC_SHADOW_Z;
      liftShadow.renderOrder = -100 + card.index;
      liftShadow.visible = false;
      projectionRoot.matrixAutoUpdate = false;
      bodyMesh.renderOrder = card.index;
      frontMesh.renderOrder = card.index;
      backMesh.renderOrder = card.index;

      flipRoot.add(bodyMesh);
      flipRoot.add(frontMesh);
      flipRoot.add(backMesh);
      pickupRoot.add(flipRoot);
      tiltRoot.add(pickupRoot);
      projectionRoot.add(tiltRoot);
      motionRoot.add(projectionRoot);

      const entry = {
        card,
        motionRoot,
        tiltRoot,
        projectionRoot,
        pickupRoot,
        flipRoot,
        bodyMesh,
        frontMesh,
        backMesh,
        liftShadow,
        liftShadowMaterial,
        basePosition,
        settledRotationZ: 0,
        exited: false,
        currentMotion: {
          screenLiftY: 0,
          depth: 0,
          airGap: 0,
          tableClearance: 0,
          nearestVertexDepth: basePosition.z + LOBBY_CARD_FACE_OFFSET,
          farthestVertexDepth: basePosition.z + LOBBY_CARD_FACE_OFFSET,
          pickupTiltX: 0,
          pickupTiltY: 0,
          projectionShearX: 0,
          projectionShearY: 0,
          previousFlipRotationX: 0,
          screenX: basePosition.x,
          screenY: basePosition.y,
          authoredScale: 1
        },
        phase: 'idle',
        visibleFace: 'front',
        completedFlips: 0,
        completedArrivals: 0,
        lastTransition: null,
        lastArrivalTransition: null
      };
      frontMesh.userData.purettCardEntry = entry;
      backMesh.userData.purettCardEntry = entry;
      this.cardGroup.add(motionRoot);
      this.scene.add(liftShadow);
      this.materials.push(frontMaterial, liftShadowMaterial);
      this.cardEntries.push(entry);
      this.meshes.push(frontMesh);
      this.pickMeshes.push(frontMesh, backMesh);
      this.applyFlatTableProjection(entry, 0);
    });
  }

  playbookCards() {
    return this.cardEntries.map((entry) => ({
      index: entry.card.index,
      width: entry.card.width,
      height: entry.card.height,
      rotationDegrees:
        entry.settledRotationZ * 180 / Math.PI,
      destination: {
        x: entry.basePosition.x,
        y:
          LOBBY_LOGICAL_HEIGHT -
          entry.basePosition.y,
        z: 0
      }
    }));
  }

  preparePendingPlaybook() {
    const request = this.pendingPlaybookRequest;
    this.pendingPlaybookRequest = null;
    if (!request ||
        this.consumedPlaybookRequestIds.has(request.id) ||
        this.cardEntries.length === 0) {
      return false;
    }
    const batch = createLobbyMotionBatch(
      this.playbook,
      request.sequence,
      this.playbookCards(),
      request
    );
    const elapsedBeforeReadyMs = request.startedAtMs === null
      ? 0
      : Math.max(
        0,
        window.performance.now() - request.startedAtMs
      );
    this.consumedPlaybookRequestIds.add(String(request.id));
    this.lastPlaybookBatch = this.clonePlaybookBatch(
      batch,
      'running',
      elapsedBeforeReadyMs
    );
    if (this.prefersReducedMotion() || this.suspended) {
      batch.plans.forEach((plan, index) => {
        const entry = this.cardEntries[index];
        if (request.sequence === 'intro') {
          entry.settledRotationZ =
            plan.effectivePreset.rotation.finalRollDeg *
            Math.PI / 180;
          this.settleEntry(entry);
        } else if (!this.suspended) {
          const finalPose = sampleLobbyMotionPlan(
            plan,
            plan.totalMs
          );
          this.applyCardMotionPose(entry, finalPose);
          this.hideAnalyticShadow(entry);
          entry.exited = true;
          entry.phase = 'exited';
          entry.visibleFace = this.visibleFaceForPose(finalPose);
        } else {
          this.settleEntry(entry);
        }
      });
      this.lastPlaybookBatch.outcome = this.suspended
        ? 'cancelled-before-ready'
        : 'skipped-reduced-motion';
      return false;
    }
    return this.startPlaybookBatch(
      batch,
      request.startedAtMs,
      elapsedBeforeReadyMs,
      null
    );
  }

  consumePendingPlaybookWithoutMotion(outcome) {
    const request = this.pendingPlaybookRequest;
    if (!request) {
      return;
    }
    this.consumedPlaybookRequestIds.add(String(request.id));
    this.lastPlaybookBatch = {
      requestId: request.id,
      sequence: request.sequence,
      trigger: request.trigger,
      seed: request.seed,
      totalDurationMs: 0,
      deadlineMs: 0,
      outcome: outcome || 'empty',
      elapsedBeforeReadyMs: 0,
      plans: []
    };
    this.pendingPlaybookRequest = null;
  }

  playPlaybookSequence(sequence, playbook, request, callback) {
    const complete = typeof callback === 'function'
      ? callback
      : () => {};
    if (this.disposed || this.contextLost ||
        this.status !== 'ready' ||
        this.cardEntries.length === 0 ||
        this.suspended) {
      complete({
        outcome: 'unavailable',
        sequence
      });
      return null;
    }
    try {
      this.setPlaybook(playbook);
      const normalizedRequest = Object.assign({}, request || {}, {
        id: request && request.id != null
          ? String(request.id)
          : `${sequence}-${Date.now()}`,
        sequence
      });
      const batch = createLobbyMotionBatch(
        this.playbook,
        sequence,
        this.playbookCards(),
        normalizedRequest
      );
      this.cancelAnimations('replaced');
      if (this.prefersReducedMotion()) {
        batch.plans.forEach((plan, index) => {
          const entry = this.cardEntries[index];
          if (sequence === 'intro') {
            entry.settledRotationZ =
              plan.effectivePreset.rotation.finalRollDeg *
              Math.PI / 180;
            this.settleEntry(entry);
          } else {
            const finalPose = sampleLobbyMotionPlan(
              plan,
              plan.totalMs
            );
            this.applyCardMotionPose(entry, finalPose);
            this.hideAnalyticShadow(entry);
            entry.exited = true;
            entry.phase = 'exited';
            entry.visibleFace = this.visibleFaceForPose(finalPose);
          }
        });
        this.lastPlaybookBatch = this.clonePlaybookBatch(
          batch,
          'skipped-reduced-motion',
          0
        );
        this.render();
        complete({
          outcome: 'skipped-reduced-motion',
          sequence,
          batch: this.lastPlaybookBatch
        });
        return batch;
      }
      this.lastPlaybookBatch = this.clonePlaybookBatch(
        batch,
        'running',
        0
      );
      this.startPlaybookBatch(
        batch,
        null,
        0,
        complete
      );
      return batch;
    } catch (error) {
      complete({
        outcome: 'failed',
        sequence,
        error
      });
      return null;
    }
  }

  resetPlaybookCards() {
    if (this.disposed) {
      return;
    }
    this.cancelAnimations('reset');
    this.cardEntries.forEach((entry) => {
      this.settleEntry(entry);
    });
    this.render();
  }

  startPlaybookBatch(
    batch,
    startedAtMs,
    initialElapsedMs,
    callback
  ) {
    let registered = false;
    if (callback) {
      this.activePlaybookCompletion = {
        requestId: batch.requestId,
        sequence: batch.sequence,
        callback
      };
    }
    batch.plans.forEach((plan, index) => {
      const entry = this.cardEntries[index];
      const initialPose = sampleLobbyMotionPlan(
        plan,
        initialElapsedMs
      );
      const token = ++this.activationSequence;
      const transition = this.createPlaybookTransition(
        entry,
        batch,
        plan
      );
      if (initialPose.complete) {
        if (batch.sequence === 'intro') {
          entry.settledRotationZ =
            plan.effectivePreset.rotation.finalRollDeg *
            Math.PI / 180;
          this.settleEntry(entry);
        } else {
          this.applyCardMotionPose(entry, initialPose);
          entry.exited = true;
        }
        transition.outcome = 'completed-before-ready';
        transition.phases.push(
          batch.sequence === 'intro' ? 'settled' : 'exited'
        );
        this.playbookTransitionHistory.push(transition);
        return;
      }
      const animation = {
        kind: 'playbook',
        sequence: batch.sequence,
        entry,
        plan,
        batch,
        startTime: startedAtMs,
        initialElapsedMs,
        token,
        reducedMotion: false,
        transition
      };
      this.applyCardMotionPose(entry, initialPose);
      entry.phase = initialPose.phase;
      entry.visibleFace = this.visibleFaceForPose(initialPose);
      const renderOrder = 200 + entry.card.index;
      entry.bodyMesh.renderOrder = renderOrder;
      entry.frontMesh.renderOrder = renderOrder;
      entry.backMesh.renderOrder = renderOrder;
      this.registerAnimation(animation);
      registered = true;
    });
    if (!registered) {
      this.finishPlaybookBatch(batch, 'completed-before-ready');
      return false;
    }
    this.restoreInputCursor();
    this.render();
    this.scheduleAnimationFrame();
    return true;
  }

  createPlaybookTransition(entry, batch, plan) {
    return {
      kind: 'playbook',
      sequence: batch.sequence,
      cardIndex: entry.card.index,
      token: this.activationSequence,
      requestId: batch.requestId,
      trigger: batch.trigger,
      seed: plan.seed,
      outcome: 'running',
      phases: [batch.sequence === 'intro'
        ? 'intro-waiting'
        : 'exit-waiting'],
      nominalDurationMs: plan.totalMs,
      deadlineMs: batch.deadlineMs,
      endpoint: Object.assign({}, plan.endpoint),
      anchor: Object.assign({}, plan.anchor)
    };
  }

  clonePlaybookBatch(batch, outcome, elapsedBeforeReadyMs) {
    return {
      requestId: batch.requestId,
      sequence: batch.sequence,
      trigger: batch.trigger,
      seed: batch.seed,
      shared: batch.shared
        ? Object.assign({}, batch.shared)
        : null,
      totalDurationMs: batch.totalDurationMs,
      deadlineMs: batch.deadlineMs,
      outcome,
      elapsedBeforeReadyMs,
      plans: batch.plans.map((plan) => ({
        cardIndex: plan.cardIndex,
        targetId: plan.targetId,
        seed: plan.seed,
        delayMs: plan.delayMs,
        durationMs: plan.durationMs,
        totalMs: plan.totalMs,
        anchor: Object.assign({}, plan.anchor),
        endpoint: Object.assign({}, plan.endpoint),
        directionDeg:
          plan.effectivePreset.path.directionDeg,
        distancePx:
          plan.effectivePreset.path.distancePx,
        curvePx:
          plan.effectivePreset.path.curvePx,
        releaseHeight:
          plan.effectivePreset.path.releaseHeight,
        apexHeight:
          plan.effectivePreset.path.apexHeight,
        flightMs:
          plan.effectivePreset.path.flightMs
      }))
    };
  }

  finishPlaybookBatch(batch, outcome) {
    if (this.lastPlaybookBatch &&
        this.lastPlaybookBatch.requestId === batch.requestId) {
      this.lastPlaybookBatch.outcome = outcome || 'completed';
    }
    if (batch.sequence === 'intro') {
      this.completedPlaybookIntroCount += 1;
    } else {
      this.completedPlaybookExitCount += 1;
    }
    const completion = this.activePlaybookCompletion;
    if (completion &&
        completion.requestId === batch.requestId) {
      this.activePlaybookCompletion = null;
      completion.callback({
        outcome: outcome || 'completed',
        sequence: batch.sequence,
        batch: this.lastPlaybookBatch
      });
    }
  }

  preparePendingArrival() {
    const request = this.pendingArrivalRequest;
    this.pendingArrivalRequest = null;
    if (!request || this.consumedArrivalRequestIds.has(request.id) ||
        this.cardEntries.length === 0) {
      return false;
    }
    if (request.profile !== CASUAL_DROP_LEFT_PROFILE.name) {
      throw new Error(`Unknown card-arrival profile "${request.profile}".`);
    }

    const arrivalCards = this.cardEntries.map((entry) => ({
      index: entry.card.index,
      userCardId: entry.card.userCardId,
      cardId: entry.card.cardId,
      textureUrl: entry.card.textureUrl,
      width: entry.card.width,
      height: entry.card.height,
      viewportHeight: LOBBY_LOGICAL_HEIGHT,
      perspectiveDistance: LOBBY_CAMERA_DISTANCE,
      destination: {
        x: entry.basePosition.x,
        y: entry.basePosition.y,
        z: entry.basePosition.z
      }
    }));
    const batch = createCardArrivalBatch(arrivalCards, request);
    const elapsedBeforeReadyMs = request.startedAtMs === null
      ? 0
      : Math.max(0, window.performance.now() - request.startedAtMs);
    batch.startedAtMs = request.startedAtMs;
    batch.elapsedBeforeReadyMs = elapsedBeforeReadyMs;
    this.rememberConsumedArrivalRequest(request.id);
    this.lastArrivalBatch = this.cloneArrivalBatch(batch);

    if (this.prefersReducedMotion() || this.suspended) {
      const skippedOutcome = this.suspended
        ? 'cancelled-before-ready'
        : 'skipped-reduced-motion';
      batch.plans.forEach((plan, index) => {
        const entry = this.cardEntries[index];
        this.activationSequence += 1;
        const transition = this.createArrivalTransition(
          entry,
          batch,
          plan,
          skippedOutcome
        );
        transition.phases = ['settled'];
        transition.evidence.exactSettlement = true;
        this.recordArrivalTransition(entry, transition);
        if (!this.suspended) {
          entry.completedArrivals += 1;
          this.completedArrivalCount += 1;
        }
        this.settleEntry(entry);
      });
      this.lastArrivalBatch.outcome = skippedOutcome;
      return false;
    }

    let registeredArrival = false;
    batch.plans.forEach((plan, index) => {
      const entry = this.cardEntries[index];
      const token = ++this.activationSequence;
      const transition = this.createArrivalTransition(
        entry,
        batch,
        plan,
        'running'
      );
      const initialPose = sampleCardArrival(plan, elapsedBeforeReadyMs);
      if (initialPose.complete) {
        transition.phases = ['settled'];
        transition.outcome = 'completed-before-ready';
        transition.evidence.exactSettlement = true;
        entry.completedArrivals += 1;
        this.completedArrivalCount += 1;
        this.recordArrivalTransition(entry, transition);
        this.settleEntry(entry);
        return;
      }
      const animation = {
        kind: 'arrival',
        entry,
        plan,
        batch,
        startTime: request.startedAtMs,
        initialElapsedMs: elapsedBeforeReadyMs,
        token,
        reducedMotion: false,
        transition
      };
      this.applyArrivalPose(entry, initialPose);
      entry.phase = `arrival-${initialPose.phase}`;
      entry.visibleFace = 'front';
      const arrivalRenderOrder = 100 + entry.card.index;
      entry.bodyMesh.renderOrder = arrivalRenderOrder;
      entry.frontMesh.renderOrder = arrivalRenderOrder;
      entry.backMesh.renderOrder = arrivalRenderOrder;
      this.registerAnimation(animation);
      registeredArrival = true;
    });
    if (!registeredArrival) {
      this.lastArrivalBatch.outcome = 'completed-before-ready';
    }
    return registeredArrival;
  }

  consumePendingArrivalWithoutMotion(outcome) {
    if (!this.pendingArrivalRequest) {
      return;
    }
    this.rememberConsumedArrivalRequest(this.pendingArrivalRequest.id);
    this.lastArrivalBatch = {
      requestId: this.pendingArrivalRequest.id,
      trigger: this.pendingArrivalRequest.trigger,
      profile: this.pendingArrivalRequest.profile,
      originEdge: CASUAL_DROP_LEFT_PROFILE.originEdge,
      originPolicy: CASUAL_DROP_LEFT_PROFILE.originPolicy,
      placementOrder: CASUAL_DROP_LEFT_PROFILE.placementOrder,
      collisionPolicy: CASUAL_DROP_LEFT_PROFILE.collisionPolicy,
      releaseTimes: [],
      releaseWindowMs: 0,
      seed: null,
      totalDurationMs: 0,
      maxBatchDurationMs: CASUAL_DROP_LEFT_PROFILE.maxBatchDurationMs,
      outcome: outcome || 'empty',
      plans: []
    };
    this.pendingArrivalRequest = null;
  }

  rememberConsumedArrivalRequest(requestId) {
    this.consumedArrivalRequestIds.add(String(requestId));
  }

  createArrivalTransition(entry, batch, plan, outcome) {
    return {
      kind: 'arrival',
      cardIndex: entry.card.index,
      userCardId: entry.card.userCardId,
      cardId: entry.card.cardId,
      token: this.activationSequence,
      requestId: batch.requestId,
      trigger: batch.trigger,
      profile: batch.profile,
      seed: plan.seed,
      outcome,
      phases: ['waiting'],
      nominalDurationMs: plan.totalDurationMs,
      deadlineMs: Math.min(
        batch.maxBatchDurationMs,
        plan.totalDurationMs + 100
      ),
      plan: {
        orderIndex: plan.orderIndex,
        releaseIndex: plan.releaseIndex,
        motionVariant: plan.motionVariant,
        delayMs: plan.delayMs,
        releaseAtMs: plan.releaseAtMs,
        contactAtMs: plan.contactAtMs,
        flatAtMs: plan.flatAtMs,
        settleAtMs: plan.settleAtMs,
        flightDurationMs: plan.flightDurationMs,
        slapDurationMs: plan.slapDurationMs,
        slideDurationMs: plan.slideDurationMs,
        postContactDurationMs: plan.postContactDurationMs,
        durationMs: plan.durationMs,
        totalDurationMs: plan.totalDurationMs,
        launchHalfExtent: plan.launchHalfExtent,
        start: Object.assign({}, plan.start),
        contact: Object.assign({}, plan.contact),
        slideStart: Object.assign({}, plan.slideStart),
        destination: Object.assign({}, plan.destination),
        direction: Object.assign({}, plan.direction),
        path: {
          controlOne: Object.assign({}, plan.path.controlOne),
          controlTwo: Object.assign({}, plan.path.controlTwo),
          launchVelocity: Object.assign({}, plan.path.launchVelocity),
          impactVelocity: Object.assign({}, plan.path.impactVelocity),
          gravity: plan.path.gravity,
          verticalImpulse: plan.path.verticalImpulse,
          apexAtProgress: plan.path.apexAtProgress,
          apexAirGap: plan.path.apexAirGap,
          bow: plan.path.bow,
          slideDistance: plan.path.slideDistance
        }
      },
      evidence: {
        maxDepth: plan.start.depth,
        maxAbsRotationX: Math.abs(plan.start.rotationX),
        maxAbsRotationY: Math.abs(plan.start.rotationY),
        maxAbsRotationZ: Math.abs(plan.start.rotationZ),
        maxVertexPerspectiveScale: 1,
        minimumTableClearance: null,
        startedOffscreenLeft:
          plan.start.x + plan.launchHalfExtent < 0,
        exactSettlement: false
      }
    };
  }

  cloneArrivalBatch(batch) {
    return {
      requestId: batch.requestId,
      trigger: batch.trigger,
      profile: batch.profile,
      originEdge: batch.originEdge,
      originPolicy: batch.originPolicy,
      placementOrder: batch.placementOrder,
      collisionPolicy: batch.collisionPolicy,
      releaseTimes: batch.releaseTimes.slice(0),
      releaseWindowMs: batch.releaseWindowMs,
      seed: batch.seed,
      requestedSeed: batch.requestedSeed,
      startedAtMs: batch.startedAtMs,
      elapsedBeforeReadyMs: batch.elapsedBeforeReadyMs,
      totalDurationMs: batch.totalDurationMs,
      maxBatchDurationMs: batch.maxBatchDurationMs,
      outcome: 'running',
      plans: batch.plans.map((plan) => ({
        cardIndex: plan.cardIndex,
        seed: plan.seed,
        orderIndex: plan.orderIndex,
        releaseIndex: plan.releaseIndex,
        motionVariant: plan.motionVariant,
        delayMs: plan.delayMs,
        releaseAtMs: plan.releaseAtMs,
        contactAtMs: plan.contactAtMs,
        flatAtMs: plan.flatAtMs,
        settleAtMs: plan.settleAtMs,
        flightDurationMs: plan.flightDurationMs,
        slapDurationMs: plan.slapDurationMs,
        slideDurationMs: plan.slideDurationMs,
        postContactDurationMs: plan.postContactDurationMs,
        durationMs: plan.durationMs,
        totalDurationMs: plan.totalDurationMs,
        launchHalfExtent: plan.launchHalfExtent,
        start: Object.assign({}, plan.start),
        contact: Object.assign({}, plan.contact),
        slideStart: Object.assign({}, plan.slideStart),
        destination: Object.assign({}, plan.destination),
        direction: Object.assign({}, plan.direction),
        path: {
          controlOne: Object.assign({}, plan.path.controlOne),
          controlTwo: Object.assign({}, plan.path.controlTwo),
          launchVelocity: Object.assign({}, plan.path.launchVelocity),
          impactVelocity: Object.assign({}, plan.path.impactVelocity),
          gravity: plan.path.gravity,
          verticalImpulse: plan.path.verticalImpulse,
          apexAtProgress: plan.path.apexAtProgress,
          apexAirGap: plan.path.apexAirGap,
          bow: plan.path.bow,
          slideDistance: plan.path.slideDistance
        }
      }))
    };
  }

  clearCommittedCards() {
    this.cancelAnimations('cleared');
    this.cardEntries.forEach((entry) => {
      this.cardGroup.remove(entry.motionRoot);
      this.scene.remove(entry.liftShadow);
    });
    this.materials.forEach((material) => material.dispose());
    this.textures.forEach((texture) => texture.dispose());
    this.meshes = [];
    this.pickMeshes = [];
    this.cardEntries = [];
    this.materials = [];
    this.textures.clear();
  }

  isInteractive() {
    return this.status === 'ready' &&
      !this.suspended &&
      !this.disposed &&
      !this.contextLost &&
      !this.hasActiveArrival() &&
      !this.hasActivePlaybook();
  }

  hasActiveArrival() {
    return Array.from(this.activeAnimations.values()).some((animation) => (
      animation.kind === 'arrival'
    ));
  }

  hasActivePlaybook() {
    return Array.from(this.activeAnimations.values()).some(
      (animation) => animation.kind === 'playbook'
    );
  }

  pickCard(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height ||
        clientX < rect.left || clientX > rect.right ||
        clientY < rect.top || clientY > rect.bottom) {
      return null;
    }

    this.pointer.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -(((clientY - rect.top) / rect.height) * 2 - 1)
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersections = this.raycaster.intersectObjects(this.pickMeshes, false);
    if (!intersections.length) {
      return null;
    }

    const hits = intersections
      .map((intersection) => ({
        distance: intersection.distance,
        entry: intersection.object.userData.purettCardEntry
      }))
      .filter((hit) => Boolean(hit.entry))
      .sort((left, right) => {
        const distanceDelta = left.distance - right.distance;
        return Math.abs(distanceDelta) > 0.001
          ? distanceDelta
          : right.entry.frontMesh.renderOrder - left.entry.frontMesh.renderOrder;
      });
    return hits.length ? hits[0].entry : null;
  }

  onCanvasClick(event) {
    if (!this.isInteractive() || (typeof event.button === 'number' && event.button !== 0)) {
      return;
    }

    const entry = this.pickCard(event.clientX, event.clientY);
    this.lastPick = entry ? {
      index: entry.card.index,
      userCardId: entry.card.userCardId,
      cardId: entry.card.cardId
    } : null;
    if (!entry) {
      this.emptyClicks += 1;
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    if (this.activeAnimations.has(entry)) {
      this.ignoredClicks += 1;
      return;
    }

    this.acceptedClicks += 1;
    if (this.prefersReducedMotion()) {
      this.startReducedMotionAnimation(entry);
      return;
    }

    this.startAnimation(entry);
  }

  onCanvasPointerMove(event) {
    if (!this.isInteractive()) {
      this.restoreInputCursor();
      return;
    }
    const entry = this.pickCard(event.clientX, event.clientY);
    this.inputTarget.style.cursor = entry && !this.activeAnimations.has(entry)
      ? 'pointer'
      : this.inputTargetCursor;
  }

  prefersReducedMotion() {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  startAnimation(entry) {
    if (this.activeAnimations.has(entry)) {
      return false;
    }

    const token = ++this.activationSequence;
    const transition = this.createTransition(entry, false);
    entry.phase = 'lifting';
    entry.visibleFace = 'front';
    entry.currentMotion.previousFlipRotationX = 0;
    entry.bodyMesh.renderOrder = 100 + token;
    entry.frontMesh.renderOrder = 100 + token;
    entry.backMesh.renderOrder = 100 + token;
    const animation = {
      kind: 'flip',
      entry,
      startTime: window.performance && typeof window.performance.now === 'function'
        ? window.performance.now()
        : null,
      token,
      reducedMotion: false,
      transition
    };
    this.registerAnimation(animation);
    this.restoreInputCursor();
    this.scheduleAnimationFrame();
    return true;
  }

  startReducedMotionAnimation(entry) {
    if (this.activeAnimations.has(entry)) {
      return false;
    }

    const token = ++this.activationSequence;
    const transition = this.createTransition(entry, true);
    entry.phase = 'showing-back';
    entry.visibleFace = 'back';
    entry.bodyMesh.renderOrder = 100 + token;
    entry.frontMesh.renderOrder = 100 + token;
    entry.backMesh.renderOrder = 100 + token;
    entry.flipRoot.rotation.x = -Math.PI;
    entry.flipRoot.rotation.y = 0;
    entry.currentMotion.previousFlipRotationX = -Math.PI;
    const animation = {
      kind: 'flip',
      entry,
      startTime: null,
      token,
      reducedMotion: true,
      reducedStep: 0,
      transition
    };
    this.registerAnimation(animation);
    this.restoreInputCursor();
    this.render();
    this.scheduleAnimationFrame();
    return true;
  }

  createTransition(entry, reducedMotion) {
    return {
      kind: 'flip',
      cardIndex: entry.card.index,
      userCardId: entry.card.userCardId,
      cardId: entry.card.cardId,
      token: this.activationSequence,
      outcome: reducedMotion ? 'running-reduced-motion' : 'running',
      phases: [reducedMotion ? 'back' : 'lift'],
      flipAxis: 'x',
      nominalDurationMs: reducedMotion ? 0 : LOBBY_FLIP_DURATION,
      deadlineMs: LOBBY_FLIP_DEADLINE,
      evidence: {
        maxScreenLiftY: 0,
        maxLiftZ: 0,
        maxAbsFlipRotationX: reducedMotion ? Math.PI : 0,
        minFlipRotationX: reducedMotion ? -Math.PI : 0,
        maxAbsFlipRotationY: 0,
        maxPickupTilt: 0,
        maxTopBottomDepthSpan: 0,
        maxPerspectiveScale: 1,
        maxAnalyticShadowOpacity: 0,
        maxAbsProjectedLateralShear: 0,
        directionReversals: 0,
        firstEdgeAngleX: null,
        backAngleX: reducedMotion ? -Math.PI : null,
        secondEdgeAngleX: null,
        frontAngleBeforeSettlement: null,
        edgePasses: 0
      }
    };
  }

  registerAnimation(animation) {
    const entry = animation.entry;
    if (animation.kind === 'arrival') {
      this.recordArrivalTransition(entry, animation.transition);
    } else if (animation.kind === 'playbook') {
      this.playbookTransitionHistory.push(animation.transition);
      if (this.playbookTransitionHistory.length >
          LOBBY_PLAYBOOK_HISTORY_LIMIT) {
        this.playbookTransitionHistory.splice(
          0,
          this.playbookTransitionHistory.length -
            LOBBY_PLAYBOOK_HISTORY_LIMIT
        );
      }
    } else {
      entry.lastTransition = animation.transition;
      this.lastTransition = animation.transition;
      this.transitionHistory.push(animation.transition);
      if (this.transitionHistory.length > LOBBY_TRANSITION_HISTORY_LIMIT) {
        this.transitionHistory.splice(
          0,
          this.transitionHistory.length - LOBBY_TRANSITION_HISTORY_LIMIT
        );
      }
    }
    this.activeAnimations.set(entry, animation);
    const activeKindCount = Array.from(this.activeAnimations.values())
      .filter((active) => active.kind === animation.kind).length;
    if (animation.kind === 'arrival') {
      this.peakConcurrentArrivalCount = Math.max(
        this.peakConcurrentArrivalCount,
        activeKindCount
      );
    } else if (animation.kind !== 'playbook') {
      this.peakConcurrentAnimationCount = Math.max(
        this.peakConcurrentAnimationCount,
        activeKindCount
      );
    }
  }

  recordArrivalTransition(entry, transition) {
    entry.lastArrivalTransition = transition;
    this.lastArrivalTransition = transition;
    this.arrivalTransitionHistory.push(transition);
    if (this.arrivalTransitionHistory.length > LOBBY_ARRIVAL_HISTORY_LIMIT) {
      this.arrivalTransitionHistory.splice(
        0,
        this.arrivalTransitionHistory.length - LOBBY_ARRIVAL_HISTORY_LIMIT
      );
    }
  }

  scheduleAnimationFrame() {
    if (this.animationFrameId !== null || this.activeAnimations.size === 0 ||
        this.disposed || this.contextLost || this.suspended) {
      return;
    }

    this.animationFrameId = window.requestAnimationFrame((timestamp) => {
      this.animationFrameId = null;
      this.tickAnimations(timestamp);
    });
  }

  tickAnimations(timestamp) {
    if (this.activeAnimations.size === 0 ||
        this.disposed || this.contextLost || this.suspended) {
      return;
    }

    try {
      const completed = [];
      Array.from(this.activeAnimations.values()).forEach((animation) => {
        if (this.activeAnimations.get(animation.entry) !== animation) {
          return;
        }

        if (animation.reducedMotion) {
          if (this.tickReducedMotionAnimation(animation)) {
            completed.push({
              animation,
              outcome: 'completed-reduced-motion'
            });
          }
          return;
        }

        if (animation.startTime === null) {
          animation.startTime =
            timestamp - Math.max(0, animation.initialElapsedMs || 0);
        }
        const elapsed = Math.max(0, timestamp - animation.startTime);
        const deadlineElapsed = elapsed >= animation.transition.deadlineMs;
        const boundedElapsed = Math.min(
          elapsed,
          animation.transition.deadlineMs
        );
        const complete = animation.kind === 'arrival'
          ? this.updateArrivalAnimation(animation, boundedElapsed)
          : (
            animation.kind === 'playbook'
              ? this.updatePlaybookAnimation(
                animation,
                boundedElapsed
              )
              : this.updateAnimation(animation, boundedElapsed)
          );
        if (complete || deadlineElapsed) {
          completed.push({
            animation,
            outcome: animation.kind === 'arrival'
              ? 'completed-arrival'
              : (
                animation.kind === 'playbook'
                  ? `completed-${animation.sequence}`
                  : 'completed'
              )
          });
        }
      });

      completed.forEach((entry) => {
        this.completeAnimation(entry.animation, entry.outcome, false);
      });
      this.animationFrameCount += 1;
      this.render();
      this.scheduleAnimationFrame();
    } catch (error) {
      this.cancelAnimations('failed', false);
      this.status = 'failed';
      this.reportError(error);
    }
  }

  updateArrivalAnimation(animation, elapsed) {
    const pose = sampleCardArrival(animation.plan, elapsed);
    const entry = animation.entry;
    const transition = animation.transition;
    entry.phase = `arrival-${pose.phase}`;
    entry.visibleFace = 'front';
    this.markTransitionPhase(transition, pose.phase);
    this.applyArrivalPose(entry, pose);

    if (transition.evidence) {
      transition.evidence.maxDepth = Math.max(
        transition.evidence.maxDepth,
        pose.depth
      );
      transition.evidence.maxAbsRotationX = Math.max(
        transition.evidence.maxAbsRotationX,
        Math.abs(pose.rotationX)
      );
      transition.evidence.maxAbsRotationY = Math.max(
        transition.evidence.maxAbsRotationY,
        Math.abs(pose.rotationY)
      );
      transition.evidence.maxAbsRotationZ = Math.max(
        transition.evidence.maxAbsRotationZ,
        Math.abs(pose.rotationZ)
      );
      transition.evidence.maxVertexPerspectiveScale = Math.max(
        transition.evidence.maxVertexPerspectiveScale,
        LOBBY_CAMERA_DISTANCE /
          (LOBBY_CAMERA_DISTANCE - pose.nearestVertexDepth)
      );
      transition.evidence.minimumTableClearance =
        transition.evidence.minimumTableClearance === null
          ? pose.tableClearance
          : Math.min(
            transition.evidence.minimumTableClearance,
            pose.tableClearance
          );
    }
    return pose.complete;
  }

  updatePlaybookAnimation(animation, elapsed) {
    const pose = sampleLobbyMotionPlan(
      animation.plan,
      elapsed
    );
    const entry = animation.entry;
    entry.phase = pose.phase;
    entry.visibleFace = this.visibleFaceForPose(pose);
    this.markTransitionPhase(
      animation.transition,
      pose.phase
    );
    this.applyCardMotionPose(entry, pose);
    return pose.complete;
  }

  tickReducedMotionAnimation(animation) {
    if (animation.reducedStep === 0) {
      // Retain the back through a frame boundary before presenting the front.
      animation.reducedStep = 1;
      animation.entry.phase = 'showing-back';
      animation.entry.visibleFace = 'back';
      animation.entry.flipRoot.rotation.x = -Math.PI;
      animation.entry.flipRoot.rotation.y = 0;
      return false;
    }

    if (animation.reducedStep === 1) {
      // Retain the restored front through its own frame boundary before the
      // exact settled transform releases this card's re-entry guard.
      animation.reducedStep = 2;
      animation.entry.phase = 'showing-front';
      animation.entry.visibleFace = 'front';
      animation.entry.flipRoot.rotation.x = -Math.PI * 2;
      animation.entry.flipRoot.rotation.y = 0;
      animation.entry.currentMotion.previousFlipRotationX = -Math.PI * 2;
      if (animation.transition.evidence) {
        animation.transition.evidence.maxAbsFlipRotationX = Math.PI * 2;
        animation.transition.evidence.minFlipRotationX = -Math.PI * 2;
        animation.transition.evidence.frontAngleBeforeSettlement = -Math.PI * 2;
      }
      this.markTransitionPhase(animation.transition, 'front');
      return false;
    }

    return true;
  }

  updateAnimation(animation, elapsed) {
    const entry = animation.entry;
    const transition = animation.transition;
    const liftEnd = LOBBY_FLIP_TIMINGS.lift;
    const turnEnd = liftEnd + LOBBY_FLIP_TIMINGS.turn;
    const settleEnd = turnEnd + LOBBY_FLIP_TIMINGS.settle;
    let progress;
    let turnProgress;
    let arcProgress;

    if (elapsed < liftEnd) {
      progress = this.easeOutCubic(elapsed / LOBBY_FLIP_TIMINGS.lift);
      entry.phase = 'lifting';
      entry.visibleFace = 'front';
      this.applyLift(entry, progress, 0, progress);
      entry.flipRoot.rotation.x = 0;
      entry.flipRoot.rotation.y = 0;
      this.recordMotionEvidence(entry, transition);
      return false;
    }
    if (elapsed < turnEnd) {
      progress = (elapsed - liftEnd) / LOBBY_FLIP_TIMINGS.turn;
      turnProgress = this.easeInOutSine(progress);
      entry.flipRoot.rotation.x = -Math.PI * 2 * turnProgress;
      entry.flipRoot.rotation.y = 0;
      arcProgress = Math.abs(Math.sin(entry.flipRoot.rotation.x));
      entry.phase = turnProgress <= 0.5 ? 'showing-back' : 'showing-front';
      entry.visibleFace = Math.abs(Math.cos(entry.flipRoot.rotation.x)) < 0.12
        ? 'edge'
        : (Math.cos(entry.flipRoot.rotation.x) > 0 ? 'front' : 'back');
      this.markTurnMilestones(transition, turnProgress);
      this.applyLift(
        entry,
        1,
        arcProgress,
        Math.abs((turnProgress * 2) - 1)
      );
      this.recordMotionEvidence(entry, transition);
      return false;
    }

    this.markTurnMilestones(transition, 1);
    if (elapsed < settleEnd) {
      progress = this.easeInOutCubic((elapsed - turnEnd) / LOBBY_FLIP_TIMINGS.settle);
      entry.phase = 'settling';
      entry.visibleFace = 'front';
      this.applyLift(entry, 1 - progress, 0, 1 - progress);
      entry.flipRoot.rotation.x = -Math.PI * 2;
      entry.flipRoot.rotation.y = 0;
      if (transition.evidence) {
        transition.evidence.frontAngleBeforeSettlement = -Math.PI * 2;
      }
      this.recordMotionEvidence(entry, transition);
      return false;
    }

    return true;
  }

  markTurnMilestones(transition, turnProgress) {
    const progress = Math.max(0, Math.min(1, turnProgress));
    const thresholdEpsilon = 0.000000001;
    const evidence = transition && transition.evidence;

    if (progress + thresholdEpsilon >= 0.25) {
      this.markTransitionPhase(transition, 'first-edge');
      if (evidence) {
        evidence.firstEdgeAngleX = -Math.PI / 2;
      }
    }
    if (progress + thresholdEpsilon >= 0.5) {
      this.markTransitionPhase(transition, 'back');
      if (evidence) {
        evidence.backAngleX = -Math.PI;
      }
    }
    if (progress + thresholdEpsilon >= 0.75) {
      this.markTransitionPhase(transition, 'second-edge');
      if (evidence) {
        evidence.secondEdgeAngleX = -Math.PI * 1.5;
      }
    }
    if (progress + thresholdEpsilon >= 1) {
      this.markTransitionPhase(transition, 'front');
      if (evidence) {
        evidence.frontAngleBeforeSettlement = -Math.PI * 2;
      }
    }
  }

  visibleFaceForPose(pose) {
    const normalDepth =
      Math.cos(pose.rotationX) *
      Math.cos(pose.rotationY);
    if (Math.abs(normalDepth) < 0.08) {
      return 'edge';
    }
    return normalDepth >= 0 ? 'front' : 'back';
  }

  applyCardMotionPose(entry, pose) {
    const authoredScale = Math.max(
      0.01,
      Number(pose.authoredScale) || 1
    );
    const depth = cardMotionDepthMetrics(
      entry.card.width,
      entry.card.height,
      LOBBY_CARD_FACE_OFFSET,
      pose.rotationX,
      pose.rotationY,
      pose.rotationZ,
      authoredScale
    );
    const rotationClearance = Math.max(
      0,
      -depth.minimum - LOBBY_CARD_FACE_OFFSET
    );
    const liftDepth =
      Math.max(0, pose.height) +
      rotationClearance;
    const perspectiveCompensation =
      (LOBBY_CAMERA_DISTANCE - liftDepth) /
      LOBBY_CAMERA_DISTANCE;
    const worldScreenY =
      LOBBY_LOGICAL_HEIGHT - pose.screenY;
    entry.motionRoot.position.set(
      LOBBY_CAMERA_CENTER_X +
        (
          (pose.screenX - LOBBY_CAMERA_CENTER_X) *
          perspectiveCompensation
        ),
      LOBBY_CAMERA_CENTER_Y +
        (
          (worldScreenY - LOBBY_CAMERA_CENTER_Y) *
          perspectiveCompensation
        ),
      entry.basePosition.z + liftDepth
    );
    entry.motionRoot.scale.set(
      authoredScale,
      authoredScale,
      authoredScale
    );
    entry.tiltRoot.rotation.z = pose.rotationZ;
    entry.pickupRoot.rotation.x = pose.rotationX;
    entry.pickupRoot.rotation.y = pose.rotationY;
    entry.flipRoot.rotation.x = 0;
    entry.flipRoot.rotation.y = 0;
    entry.currentMotion.screenLiftY =
      worldScreenY - entry.basePosition.y;
    entry.currentMotion.depth = liftDepth;
    entry.currentMotion.airGap = Math.max(0, pose.height);
    entry.currentMotion.tableClearance = rotationClearance;
    entry.currentMotion.nearestVertexDepth =
      entry.basePosition.z +
      liftDepth +
      depth.maximum;
    entry.currentMotion.farthestVertexDepth =
      entry.basePosition.z +
      liftDepth +
      depth.minimum;
    entry.currentMotion.pickupTiltX = pose.rotationX;
    entry.currentMotion.pickupTiltY = pose.rotationY;
    entry.currentMotion.previousFlipRotationX = 0;
    entry.currentMotion.screenX = pose.screenX;
    entry.currentMotion.screenY = worldScreenY;
    entry.currentMotion.authoredScale = authoredScale;
    this.applyFlatTableProjection(
      entry,
      entry.currentMotion.screenLiftY,
      pose.screenX,
      worldScreenY
    );
    this.updateCardMotionShadow(
      entry,
      pose,
      worldScreenY,
      authoredScale
    );
  }

  updateCardMotionShadow(
    entry,
    pose,
    worldScreenY,
    authoredScale
  ) {
    if (!entry.liftShadow || !entry.liftShadowMaterial) {
      return;
    }
    if (pose.complete && pose.sequence === 'intro') {
      this.hideAnalyticShadow(entry);
      return;
    }
    const heightRatio = Math.max(
      0,
      Math.min(1, pose.height / 250)
    );
    const spread =
      Math.max(0.5, pose.shadow.spread) *
      authoredScale *
      (0.9 + (0.25 * heightRatio));
    entry.liftShadow.position.set(
      pose.screenX + (6 + (14 * heightRatio)),
      worldScreenY - (4 + (12 * heightRatio)),
      LOBBY_ANALYTIC_SHADOW_Z
    );
    entry.liftShadow.rotation.z = pose.rotationZ * 0.45;
    entry.liftShadow.scale.set(
      spread,
      spread * 0.92,
      1
    );
    entry.liftShadowMaterial.opacity =
      Math.max(0, Math.min(1, pose.shadow.strength)) *
      (0.72 - (0.34 * heightRatio));
    entry.liftShadow.visible =
      entry.liftShadowMaterial.opacity > 0.002;
  }

  applyArrivalPose(entry, pose) {
    const depth = Math.max(0, pose.depth);
    const worldZ = Number.isFinite(pose.z)
      ? pose.z
      : entry.basePosition.z + depth;
    const perspectiveCompensation =
      (LOBBY_CAMERA_DISTANCE - depth) / LOBBY_CAMERA_DISTANCE;
    entry.motionRoot.position.set(
      LOBBY_CAMERA_CENTER_X +
        ((pose.screenX - LOBBY_CAMERA_CENTER_X) * perspectiveCompensation),
      LOBBY_CAMERA_CENTER_Y +
        ((pose.screenY - LOBBY_CAMERA_CENTER_Y) * perspectiveCompensation),
      worldZ
    );
    entry.motionRoot.scale.set(1, 1, 1);
    entry.tiltRoot.rotation.z = pose.rotationZ;
    entry.pickupRoot.rotation.x = pose.rotationX;
    entry.pickupRoot.rotation.y = pose.rotationY;
    entry.flipRoot.rotation.x = 0;
    entry.flipRoot.rotation.y = 0;
    entry.currentMotion.screenLiftY = pose.screenY - entry.basePosition.y;
    entry.currentMotion.depth = depth;
    entry.currentMotion.airGap = pose.airGap;
    entry.currentMotion.tableClearance = pose.tableClearance;
    entry.currentMotion.nearestVertexDepth = pose.nearestVertexDepth;
    entry.currentMotion.farthestVertexDepth = pose.farthestVertexDepth;
    entry.currentMotion.pickupTiltX = pose.rotationX;
    entry.currentMotion.pickupTiltY = pose.rotationY;
    entry.currentMotion.previousFlipRotationX = 0;
    entry.currentMotion.screenX = pose.screenX;
    entry.currentMotion.screenY = pose.screenY;
    this.applyFlatTableProjection(
      entry,
      0,
      pose.screenX,
      pose.screenY
    );
    this.updateArrivalShadow(entry, pose);
  }

  applyLift(entry, progress, turnArc, pickupProgress) {
    const liftProgress = Math.max(0, Math.min(1, progress));
    const arcProgress = Math.max(0, Math.min(1, turnArc));
    const pickup = Math.max(0, Math.min(1, pickupProgress));
    const depth = (LOBBY_LIFT_Z * liftProgress) + (LOBBY_TURN_ARC_Z * arcProgress);
    const screenLiftY =
      (LOBBY_LIFT_SCREEN_Y * liftProgress) +
      (LOBBY_TURN_ARC_SCREEN_Y * arcProgress);
    const perspectiveCompensation = (LOBBY_CAMERA_DISTANCE - depth) / LOBBY_CAMERA_DISTANCE;

    entry.motionRoot.position.set(
      LOBBY_CAMERA_CENTER_X +
        ((entry.basePosition.x - LOBBY_CAMERA_CENTER_X) * perspectiveCompensation),
      LOBBY_CAMERA_CENTER_Y +
        ((entry.basePosition.y + screenLiftY - LOBBY_CAMERA_CENTER_Y) * perspectiveCompensation),
      entry.basePosition.z + depth
    );
    entry.motionRoot.scale.set(1, 1, 1);
    entry.pickupRoot.rotation.x = LOBBY_PICKUP_TILT_X * pickup;
    entry.pickupRoot.rotation.y = LOBBY_PICKUP_TILT_Y * pickup;
    entry.currentMotion.screenLiftY = screenLiftY;
    entry.currentMotion.depth = depth;
    entry.currentMotion.pickupTiltX = entry.pickupRoot.rotation.x;
    entry.currentMotion.pickupTiltY = entry.pickupRoot.rotation.y;
    entry.currentMotion.screenX = entry.basePosition.x;
    entry.currentMotion.screenY = entry.basePosition.y + screenLiftY;
    this.applyFlatTableProjection(entry, screenLiftY);
    this.updateAnalyticShadow(entry, liftProgress, arcProgress);
  }

  applyFlatTableProjection(entry, screenLiftY, screenX, screenY) {
    const anchorX = Number.isFinite(screenX)
      ? screenX
      : entry.basePosition.x;
    const anchorY = Number.isFinite(screenY)
      ? screenY
      : entry.basePosition.y + screenLiftY;
    const horizontalOffset =
      (anchorX - LOBBY_CAMERA_CENTER_X) / LOBBY_CAMERA_DISTANCE;
    const verticalOffset =
      (anchorY - LOBBY_CAMERA_CENTER_Y) /
      LOBBY_CAMERA_DISTANCE;
    const shearX = -horizontalOffset;
    const shearY = -verticalOffset;

    // A head-on perspective camera otherwise makes a rotated off-axis plane
    // lean toward the camera center: each vertex's local Z changes the
    // projection of the card's slot offset. Apply the inverse projective
    // shear outside the card rotation and anchor it at the visible face
    // plane. Every slot then receives the center card's symmetric silhouette
    // without sacrificing perspective enlargement or depth foreshortening.
    entry.projectionRoot.matrix.set(
      1, 0, shearX, -shearX * LOBBY_CARD_FACE_OFFSET,
      0, 1, shearY, -shearY * LOBBY_CARD_FACE_OFFSET,
      0, 0, 1, 0,
      0, 0, 0, 1
    );
    entry.projectionRoot.matrixWorldNeedsUpdate = true;
    entry.currentMotion.projectionShearX = shearX;
    entry.currentMotion.projectionShearY = shearY;
  }

  updateArrivalShadow(entry, pose) {
    if (!entry.liftShadow || !entry.liftShadowMaterial) {
      return;
    }
    if (pose.phase === 'slide' || pose.phase === 'settled') {
      this.hideAnalyticShadow(entry);
      return;
    }
    const heightRatio = Math.max(0, Math.min(1, pose.airGap / 55));
    const spread = 0.88 + (0.28 * heightRatio);
    const contactFade = pose.phase === 'slap'
      ? Math.pow(1 - pose.progress, 1.4)
      : 1;
    entry.liftShadow.position.set(
      pose.screenX + (5 + (13 * heightRatio)),
      pose.screenY - (4 + (11 * heightRatio)),
      LOBBY_ANALYTIC_SHADOW_Z
    );
    entry.liftShadow.rotation.z = pose.rotationZ * 0.65;
    entry.liftShadow.scale.set(spread, spread * 0.92, 1);
    entry.liftShadowMaterial.opacity =
      (0.08 + (0.16 * (1 - heightRatio))) *
      contactFade;
    entry.liftShadow.visible = entry.liftShadowMaterial.opacity > 0.002;
  }

  updateAnalyticShadow(entry, liftProgress, arcProgress) {
    if (!entry.liftShadow || !entry.liftShadowMaterial || liftProgress <= 0.001) {
      this.hideAnalyticShadow(entry);
      return;
    }

    const spreadX = 0.88 + (0.22 * liftProgress) + (0.06 * arcProgress);
    const spreadY = 0.82 + (0.26 * liftProgress) + (0.08 * arcProgress);
    entry.liftShadow.position.set(
      entry.basePosition.x + (8 * liftProgress),
      entry.basePosition.y - (10 * liftProgress),
      LOBBY_ANALYTIC_SHADOW_Z
    );
    entry.liftShadow.scale.set(spreadX, spreadY, 1);
    entry.liftShadowMaterial.opacity =
      LOBBY_ANALYTIC_SHADOW_OPACITY *
      Math.min(1, liftProgress * 1.4) *
      (1 - (0.15 * arcProgress));
    entry.liftShadow.visible = true;
  }

  hideAnalyticShadow(entry) {
    if (entry && entry.liftShadow) {
      entry.liftShadow.visible = false;
      entry.liftShadow.position.set(0, 0, LOBBY_ANALYTIC_SHADOW_Z);
      entry.liftShadow.scale.set(1, 1, 1);
    }
    if (entry && entry.liftShadowMaterial) {
      entry.liftShadowMaterial.opacity = 0;
    }
  }

  recordMotionEvidence(entry, transition) {
    const evidence = transition && transition.evidence;
    if (!evidence) {
      return;
    }

    const combinedRotationX = entry.pickupRoot.rotation.x + entry.flipRoot.rotation.x;
    const flipRotationX = entry.flipRoot.rotation.x;
    evidence.maxScreenLiftY = Math.max(
      evidence.maxScreenLiftY,
      entry.currentMotion.screenLiftY
    );
    evidence.maxLiftZ = Math.max(evidence.maxLiftZ, entry.currentMotion.depth);
    evidence.maxAbsFlipRotationX = Math.max(
      evidence.maxAbsFlipRotationX,
      Math.abs(flipRotationX)
    );
    evidence.minFlipRotationX = Math.min(evidence.minFlipRotationX, flipRotationX);
    evidence.maxAbsFlipRotationY = Math.max(
      evidence.maxAbsFlipRotationY,
      Math.abs(entry.flipRoot.rotation.y)
    );
    evidence.maxPickupTilt = Math.max(
      evidence.maxPickupTilt,
      Math.abs(entry.pickupRoot.rotation.x),
      Math.abs(entry.pickupRoot.rotation.y)
    );
    evidence.maxTopBottomDepthSpan = Math.max(
      evidence.maxTopBottomDepthSpan,
      Math.abs(Math.sin(combinedRotationX)) * entry.card.height
    );
    evidence.maxPerspectiveScale = Math.max(
      evidence.maxPerspectiveScale,
      LOBBY_CAMERA_DISTANCE / (LOBBY_CAMERA_DISTANCE - entry.currentMotion.depth)
    );
    evidence.maxAnalyticShadowOpacity = Math.max(
      evidence.maxAnalyticShadowOpacity,
      entry.liftShadowMaterial ? entry.liftShadowMaterial.opacity : 0
    );
    const projectedFace = this.getProjectedFaceMetrics(entry);
    if (projectedFace) {
      evidence.maxAbsProjectedLateralShear = Math.max(
        evidence.maxAbsProjectedLateralShear,
        Math.abs(projectedFace.lateralShear)
      );
    }
    if (flipRotationX > entry.currentMotion.previousFlipRotationX + 0.000001) {
      evidence.directionReversals += 1;
    }
    entry.currentMotion.previousFlipRotationX = flipRotationX;
  }

  getProjectedFaceMetrics(entry) {
    if (!entry || !entry.frontMesh || !this.camera) {
      return null;
    }

    this.scene.updateMatrixWorld(true);
    this.camera.updateMatrixWorld(true);
    const halfWidth = entry.card.width / 2;
    const halfHeight = entry.card.height / 2;
    const localCorners = [
      [-halfWidth, halfHeight],
      [halfWidth, halfHeight],
      [halfWidth, -halfHeight],
      [-halfWidth, -halfHeight]
    ];
    const corners = localCorners.map((corner) => {
      const projected = new Vector3(corner[0], corner[1], 0)
        .applyMatrix4(entry.frontMesh.matrixWorld)
        .project(this.camera);
      return {
        x: (projected.x + 1) * LOBBY_LOGICAL_WIDTH / 2,
        y: (1 - projected.y) * LOBBY_LOGICAL_HEIGHT / 2
      };
    });
    const topMidpointX = (corners[0].x + corners[1].x) / 2;
    const bottomMidpointX = (corners[2].x + corners[3].x) / 2;
    const edgeLength = (left, right) => Math.hypot(
      right.x - left.x,
      right.y - left.y
    );

    return {
      corners,
      center: {
        x: corners.reduce((sum, corner) => sum + corner.x, 0) / corners.length,
        y: corners.reduce((sum, corner) => sum + corner.y, 0) / corners.length
      },
      lateralShear: topMidpointX - bottomMidpointX,
      topWidth: edgeLength(corners[0], corners[1]),
      bottomWidth: edgeLength(corners[3], corners[2])
    };
  }

  completeAnimation(animation, outcome, shouldRender) {
    if (!animation ||
        this.activeAnimations.get(animation.entry) !== animation) {
      return;
    }

    const entry = animation.entry;
    this.activeAnimations.delete(entry);
    if (this.activeAnimations.size === 0 && this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (animation.kind === 'playbook') {
      const finalPose = sampleLobbyMotionPlan(
        animation.plan,
        animation.plan.totalMs
      );
      if (animation.sequence === 'intro') {
        entry.settledRotationZ =
          animation.plan.effectivePreset.rotation.finalRollDeg *
          Math.PI / 180;
        this.settleEntry(entry);
        this.markTransitionPhase(
          animation.transition,
          'settled'
        );
      } else {
        this.applyCardMotionPose(entry, finalPose);
        this.hideAnalyticShadow(entry);
        entry.exited = true;
        entry.phase = 'exited';
        entry.visibleFace = this.visibleFaceForPose(finalPose);
        this.markTransitionPhase(
          animation.transition,
          'exited'
        );
      }
      animation.transition.outcome =
        outcome || `completed-${animation.sequence}`;
      const batchStillActive = Array.from(
        this.activeAnimations.values()
      ).some((active) => (
        active.kind === 'playbook' &&
        active.batch.requestId === animation.batch.requestId
      ));
      if (!batchStillActive) {
        this.finishPlaybookBatch(
          animation.batch,
          outcome || 'completed'
        );
      }
      if (shouldRender !== false) {
        this.render();
      }
      return;
    }
    this.settleEntry(entry);
    if (animation.kind === 'arrival') {
      entry.completedArrivals += 1;
      this.completedArrivalCount += 1;
    } else {
      entry.completedFlips += 1;
      this.completedAnimationCount += 1;
    }
    this.markTransitionPhase(animation.transition, 'settled');
    if (animation.transition.evidence &&
        animation.kind === 'arrival') {
      animation.transition.evidence.exactSettlement = true;
    }
    animation.transition.outcome = outcome || 'completed';
    if (animation.kind === 'arrival' &&
        !this.hasActiveArrival() &&
        this.lastArrivalBatch &&
        this.lastArrivalBatch.requestId === animation.batch.requestId) {
      this.lastArrivalBatch.outcome = 'completed';
    }
    if (shouldRender !== false) {
      this.render();
    }
  }

  cancelAnimations(outcome, shouldRender) {
    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.activeAnimations.size === 0) {
      return;
    }

    const animations = Array.from(this.activeAnimations.values());
    const playbookBatch = animations.find(
      (animation) => animation.kind === 'playbook'
    );
    this.activeAnimations.clear();
    animations.forEach((animation) => {
      this.settleEntry(animation.entry);
      this.markTransitionPhase(animation.transition, 'settled');
      if (animation.transition.evidence &&
          animation.kind === 'arrival') {
        animation.transition.evidence.exactSettlement = true;
      }
      if (animation.transition.outcome === 'running' ||
          animation.transition.outcome === 'running-reduced-motion') {
        animation.transition.outcome = outcome || 'cancelled';
      }
    });
    if (animations.some((animation) => animation.kind === 'arrival') &&
        this.lastArrivalBatch) {
      this.lastArrivalBatch.outcome = outcome || 'cancelled';
    }
    if (playbookBatch) {
      this.finishPlaybookBatch(
        playbookBatch.batch,
        outcome || 'cancelled'
      );
    }
    if (shouldRender !== false) {
      this.render();
    }
  }

  settleEntry(entry) {
    this.hideAnalyticShadow(entry);
    entry.motionRoot.position.set(
      entry.basePosition.x,
      entry.basePosition.y,
      entry.basePosition.z
    );
    entry.motionRoot.scale.set(1, 1, 1);
    entry.tiltRoot.rotation.z = entry.settledRotationZ || 0;
    entry.pickupRoot.rotation.x = 0;
    entry.pickupRoot.rotation.y = 0;
    entry.flipRoot.rotation.x = 0;
    entry.flipRoot.rotation.y = 0;
    entry.bodyMesh.renderOrder = entry.card.index;
    entry.frontMesh.renderOrder = entry.card.index;
    entry.backMesh.renderOrder = entry.card.index;
    entry.currentMotion.screenLiftY = 0;
    entry.currentMotion.depth = 0;
    entry.currentMotion.airGap = 0;
    entry.currentMotion.tableClearance = 0;
    entry.currentMotion.nearestVertexDepth =
      entry.basePosition.z + LOBBY_CARD_FACE_OFFSET;
    entry.currentMotion.farthestVertexDepth =
      entry.basePosition.z + LOBBY_CARD_FACE_OFFSET;
    entry.currentMotion.pickupTiltX = 0;
    entry.currentMotion.pickupTiltY = 0;
    entry.currentMotion.screenX = entry.basePosition.x;
    entry.currentMotion.screenY = entry.basePosition.y;
    entry.currentMotion.authoredScale = 1;
    this.applyFlatTableProjection(entry, 0);
    entry.currentMotion.previousFlipRotationX = 0;
    entry.phase = 'idle';
    entry.visibleFace = 'front';
    entry.exited = false;
  }

  markTransitionPhase(transition, phase) {
    if (!transition || transition.phases.indexOf(phase) !== -1) {
      return;
    }
    transition.phases.push(phase);
    if ((phase === 'first-edge' || phase === 'second-edge') &&
        transition.evidence) {
      transition.evidence.edgePasses += 1;
    }
  }

  easeOutCubic(value) {
    const progress = Math.max(0, Math.min(1, value));
    return 1 - Math.pow(1 - progress, 3);
  }

  easeInOutCubic(value) {
    const progress = Math.max(0, Math.min(1, value));
    return progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  }

  easeInOutSine(value) {
    const progress = Math.max(0, Math.min(1, value));
    return -(Math.cos(Math.PI * progress) - 1) / 2;
  }

  suspend() {
    this.suspended = true;
    this.cancelAnimations('cancelled');
    this.detachInputHandlers();
    this.restoreInputCursor();
  }

  resume() {
    this.suspended = false;
    this.attachInputHandlers();
  }

  attachInputHandlers() {
    if (!this.inputTarget || this.inputHandlersAttached || this.status !== 'ready' ||
        this.suspended || this.disposed || this.contextLost) {
      return;
    }
    // Listen through the surrounding menu in capture phase. The WebGL canvas
    // stays pointer-inert, so empty lobby space and existing controls retain
    // their original event targets. Only a confirmed card hit is intercepted.
    this.inputTarget.addEventListener('click', this.handleCanvasClick, true);
    this.inputTarget.addEventListener('pointermove', this.handleCanvasPointerMove, true);
    this.inputTarget.addEventListener('pointerleave', this.handleCanvasPointerLeave, true);
    this.inputHandlersAttached = true;
  }

  detachInputHandlers() {
    if (!this.inputTarget || !this.inputHandlersAttached) {
      return;
    }
    this.inputTarget.removeEventListener('click', this.handleCanvasClick, true);
    this.inputTarget.removeEventListener('pointermove', this.handleCanvasPointerMove, true);
    this.inputTarget.removeEventListener('pointerleave', this.handleCanvasPointerLeave, true);
    this.inputHandlersAttached = false;
  }

  restoreInputCursor() {
    if (this.inputTarget) {
      this.inputTarget.style.cursor = this.inputTargetCursor;
    }
  }

  setContentScale(contentScale) {
    if (this.disposed) {
      return;
    }

    const scale = Number.isFinite(Number(contentScale)) ? Number(contentScale) : 1;
    const devicePixelRatio = window.devicePixelRatio || 1;
    this.renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio * scale, 1), MAX_PIXEL_RATIO));
    this.renderer.setSize(LOBBY_LOGICAL_WIDTH, LOBBY_LOGICAL_HEIGHT, false);
    this.camera.aspect = LOBBY_LOGICAL_WIDTH / LOBBY_LOGICAL_HEIGHT;
    this.camera.updateProjectionMatrix();
    this.render();
  }

  render() {
    if (!this.disposed && !this.contextLost) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  reportReady() {
    if (typeof this.options.onReady === 'function') {
      this.options.onReady(this.getDebugState());
    }
  }

  presentReady() {
    // Render once before the atomic hand gate changes, then once more after
    // the callback reveals the previously hidden canvas to the compositor.
    this.render();
    this.attachInputHandlers();
    this.reportReady();
    this.render();
  }

  reportError(error) {
    if (typeof this.options.onError === 'function') {
      this.options.onError(error);
    }
  }

  errorMessage(error) {
    return error && error.message ? error.message : 'Unknown texture error.';
  }

  cloneTransition(transition) {
    return transition ? {
      kind: transition.kind || 'flip',
      sequence: transition.sequence || null,
      cardIndex: transition.cardIndex,
      userCardId: transition.userCardId,
      cardId: transition.cardId,
      token: transition.token,
      requestId: transition.requestId || null,
      trigger: transition.trigger || null,
      profile: transition.profile || null,
      seed: transition.seed == null ? null : transition.seed,
      outcome: transition.outcome,
      phases: transition.phases.slice(0),
      flipAxis: transition.flipAxis || null,
      nominalDurationMs: transition.nominalDurationMs,
      deadlineMs: transition.deadlineMs,
      endpoint: transition.endpoint
        ? Object.assign({}, transition.endpoint)
        : null,
      anchor: transition.anchor
        ? Object.assign({}, transition.anchor)
        : null,
      plan: transition.plan ? {
        orderIndex: transition.plan.orderIndex,
        releaseIndex: transition.plan.releaseIndex,
        motionVariant: transition.plan.motionVariant,
        delayMs: transition.plan.delayMs,
        releaseAtMs: transition.plan.releaseAtMs,
        contactAtMs: transition.plan.contactAtMs,
        flatAtMs: transition.plan.flatAtMs,
        settleAtMs: transition.plan.settleAtMs,
        flightDurationMs: transition.plan.flightDurationMs,
        slapDurationMs: transition.plan.slapDurationMs,
        slideDurationMs: transition.plan.slideDurationMs,
        postContactDurationMs: transition.plan.postContactDurationMs,
        durationMs: transition.plan.durationMs,
        totalDurationMs: transition.plan.totalDurationMs,
        launchHalfExtent: transition.plan.launchHalfExtent,
        start: Object.assign({}, transition.plan.start),
        contact: Object.assign({}, transition.plan.contact),
        slideStart: Object.assign({}, transition.plan.slideStart),
        destination: Object.assign({}, transition.plan.destination),
        direction: Object.assign({}, transition.plan.direction),
        path: {
          controlOne: Object.assign(
            {},
            transition.plan.path.controlOne
          ),
          controlTwo: Object.assign(
            {},
            transition.plan.path.controlTwo
          ),
          launchVelocity: Object.assign(
            {},
            transition.plan.path.launchVelocity
          ),
          impactVelocity: Object.assign(
            {},
            transition.plan.path.impactVelocity
          ),
          gravity: transition.plan.path.gravity,
          verticalImpulse: transition.plan.path.verticalImpulse,
          apexAtProgress: transition.plan.path.apexAtProgress,
          apexAirGap: transition.plan.path.apexAirGap,
          bow: transition.plan.path.bow,
          slideDistance: transition.plan.path.slideDistance
        }
      } : null,
      evidence: transition.evidence
        ? Object.assign({}, transition.evidence)
        : null
    } : null;
  }

  getDebugState() {
    const context = this.renderer.getContext();
    const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && context instanceof WebGL2RenderingContext;
    const activeAnimations = Array.from(this.activeAnimations.values())
      .sort((left, right) => left.token - right.token);
    const activeArrivalAnimations = activeAnimations.filter((animation) => (
      animation.kind === 'arrival'
    ));
    const activePlaybookAnimations = activeAnimations.filter(
      (animation) => animation.kind === 'playbook'
    );
    const activeFlipAnimations = activeAnimations.filter((animation) => (
      animation.kind !== 'arrival' &&
      animation.kind !== 'playbook'
    ));
    const activeCardIndices = activeAnimations
      .map((animation) => animation.entry.card.index)
      .sort((left, right) => left - right);
    const visibleShadows = this.cardEntries.filter((entry) => (
      entry.liftShadow && entry.liftShadow.visible
    ));
    const maxShadowOpacity = visibleShadows.reduce((maximum, entry) => (
      Math.max(
        maximum,
        entry.liftShadowMaterial ? entry.liftShadowMaterial.opacity : 0
      )
    ), 0);

    return {
      packageVersion: __PURETT_THREE_PACKAGE_VERSION__,
      revision: REVISION,
      contextType: isWebGL2 ? 'webgl2' : 'webgl',
      surface: 'lobby-hand',
      logicalWidth: LOBBY_LOGICAL_WIDTH,
      logicalHeight: LOBBY_LOGICAL_HEIGHT,
      camera: {
        projection: 'perspective',
        fovDegrees: LOBBY_CAMERA_FOV,
        distance: LOBBY_CAMERA_DISTANCE,
        position: {
          x: this.camera.position.x,
          y: this.camera.position.y,
          z: this.camera.position.z
        },
        near: this.camera.near,
        far: this.camera.far,
        settledPlaneScale: 1
      },
      cardModel: {
        width: 117,
        height: 146,
        thickness: LOBBY_CARD_THICKNESS,
        faceOffset: LOBBY_CARD_FACE_OFFSET,
        faceBodyClearance: LOBBY_CARD_FACE_BODY_CLEARANCE,
        slabFaceCaps: false
      },
      motionProfile: {
        flipAxis: 'x',
        rotationPath: '0-to-negative-two-pi',
        projectionProfile: 'flat-table-neutralized',
        pickupTiltPolicy: 'none',
        animationConcurrency: 'independent-per-card',
        repeatedActiveCardPolicy: 'ignored-until-settled',
        scheduler: 'shared-request-animation-frame',
        maxConcurrentAnimations: this.cards.length,
        nominalDurationMs: LOBBY_FLIP_DURATION,
        deadlineMs: LOBBY_FLIP_DEADLINE,
        continuousTurnMs: LOBBY_FLIP_TIMINGS.turn,
        liftScreenY: LOBBY_LIFT_SCREEN_Y,
        liftZ: LOBBY_LIFT_Z,
        arrival: {
          profile: CASUAL_DROP_LEFT_PROFILE.name,
          originEdge: CASUAL_DROP_LEFT_PROFILE.originEdge,
          seeded: true,
          destinationDriven: true,
          originPolicy: CASUAL_DROP_LEFT_PROFILE.originPolicy,
          placementOrder: CASUAL_DROP_LEFT_PROFILE.placementOrder,
          collisionPolicy: CASUAL_DROP_LEFT_PROFILE.collisionPolicy,
          projectionProfile: 'flat-table-neutralized-through-arrival',
          phases: ['flight', 'slap', 'slide'],
          flightPolicy: 'analytic-ballistic-human-scatter',
          landingPolicy: 'edge-contact-and-continuous-friction',
          maxBatchDurationMs:
            CASUAL_DROP_LEFT_PROFILE.maxBatchDurationMs
        }
      },
      renderPolicy: {
        faceMaterial: 'unlit',
        faceToneMapped: false,
        textureColorSpace: SRGBColorSpace,
        outputColorSpace: this.renderer.outputColorSpace,
        textureMipmaps: true,
        textureAnisotropy: Math.min(
          4,
          this.renderer.capabilities.getMaxAnisotropy()
        ),
        shadowStrategy: 'analytic-contact',
        shadowOwnership: 'per-active-card',
        shadowMapEnabled: this.renderer.shadowMap.enabled
      },
      pixelRatio: this.renderer.getPixelRatio(),
      disposed: this.disposed,
      contextLost: this.contextLost,
      status: this.status,
      ready: this.status === 'ready',
      interactive: this.isInteractive(),
      suspended: this.suspended,
      inputHandlersAttached: this.inputHandlersAttached,
      meshCount: this.meshes.length,
      textureCount: this.textures.size,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      rafActive: this.animationFrameId !== null,
      activeAnimationCount: activeAnimations.length,
      activeCardIndices,
      lockedCardIndices: activeCardIndices.slice(0),
      activeAnimations: activeAnimations.map((animation) => ({
        kind: animation.kind,
        cardIndex: animation.entry.card.index,
        token: animation.token,
        phase: animation.entry.phase,
        reducedMotion: animation.reducedMotion,
        transition: this.cloneTransition(animation.transition)
      })),
      peakConcurrentAnimationCount: this.peakConcurrentAnimationCount,
      peakConcurrentArrivalCount: this.peakConcurrentArrivalCount,
      activeArrivalCount: activeArrivalAnimations.length,
      activePlaybookCount: activePlaybookAnimations.length,
      activeFlipCount: activeFlipAnimations.length,
      lockHeld: activeAnimations.length > 0,
      activeCardIndex: activeAnimations.length === 1
        ? activeAnimations[0].entry.card.index
        : null,
      phase: activeAnimations.length === 0
        ? 'idle'
        : (activeAnimations.length === 1
          ? activeAnimations[0].entry.phase
          : 'concurrent'),
      animationFrameCount: this.animationFrameCount,
      acceptedClicks: this.acceptedClicks,
      ignoredClicks: this.ignoredClicks,
      emptyClicks: this.emptyClicks,
      completedAnimationCount: this.completedAnimationCount,
      completedArrivalCount: this.completedArrivalCount,
      activeAnalyticShadowCount: visibleShadows.length,
      analyticShadowVisible: visibleShadows.length > 0,
      analyticShadowOpacity: maxShadowOpacity,
      lastPick: this.lastPick ? Object.assign({}, this.lastPick) : null,
      lastTransition: this.cloneTransition(this.lastTransition),
      recentTransitions: this.transitionHistory.map((transition) => (
        this.cloneTransition(transition)
      )),
      pendingArrivalRequest: this.pendingArrivalRequest
        ? Object.assign({}, this.pendingArrivalRequest)
        : null,
      lastArrivalBatch: this.lastArrivalBatch ? {
        requestId: this.lastArrivalBatch.requestId,
        trigger: this.lastArrivalBatch.trigger,
        profile: this.lastArrivalBatch.profile,
        originEdge: this.lastArrivalBatch.originEdge || 'left',
        originPolicy: this.lastArrivalBatch.originPolicy,
        placementOrder: this.lastArrivalBatch.placementOrder,
        collisionPolicy: this.lastArrivalBatch.collisionPolicy,
        releaseTimes: this.lastArrivalBatch.releaseTimes
          ? this.lastArrivalBatch.releaseTimes.slice(0)
          : [],
        releaseWindowMs: this.lastArrivalBatch.releaseWindowMs,
        seed: this.lastArrivalBatch.seed,
        requestedSeed: this.lastArrivalBatch.requestedSeed,
        startedAtMs: this.lastArrivalBatch.startedAtMs,
        elapsedBeforeReadyMs: this.lastArrivalBatch.elapsedBeforeReadyMs,
        totalDurationMs: this.lastArrivalBatch.totalDurationMs,
        maxBatchDurationMs: this.lastArrivalBatch.maxBatchDurationMs,
        outcome: this.lastArrivalBatch.outcome,
        plans: this.lastArrivalBatch.plans.map((plan) => ({
          cardIndex: plan.cardIndex,
          seed: plan.seed,
          orderIndex: plan.orderIndex,
          releaseIndex: plan.releaseIndex,
          motionVariant: plan.motionVariant,
          delayMs: plan.delayMs,
          releaseAtMs: plan.releaseAtMs,
          contactAtMs: plan.contactAtMs,
          flatAtMs: plan.flatAtMs,
          settleAtMs: plan.settleAtMs,
          flightDurationMs: plan.flightDurationMs,
          slapDurationMs: plan.slapDurationMs,
          slideDurationMs: plan.slideDurationMs,
          postContactDurationMs: plan.postContactDurationMs,
          durationMs: plan.durationMs,
          totalDurationMs: plan.totalDurationMs,
          launchHalfExtent: plan.launchHalfExtent,
          start: Object.assign({}, plan.start),
          contact: Object.assign({}, plan.contact),
          slideStart: Object.assign({}, plan.slideStart),
          destination: Object.assign({}, plan.destination),
          direction: Object.assign({}, plan.direction),
          path: {
            controlOne: Object.assign({}, plan.path.controlOne),
            controlTwo: Object.assign({}, plan.path.controlTwo),
            launchVelocity: Object.assign({}, plan.path.launchVelocity),
            impactVelocity: Object.assign({}, plan.path.impactVelocity),
            gravity: plan.path.gravity,
            verticalImpulse: plan.path.verticalImpulse,
            apexAtProgress: plan.path.apexAtProgress,
            apexAirGap: plan.path.apexAirGap,
            bow: plan.path.bow,
            slideDistance: plan.path.slideDistance
          }
        }))
      } : null,
      lastArrivalTransition:
        this.cloneTransition(this.lastArrivalTransition),
      recentArrivalTransitions: this.arrivalTransitionHistory.map(
        (transition) => this.cloneTransition(transition)
      ),
      pendingPlaybookRequest: this.pendingPlaybookRequest
        ? Object.assign({}, this.pendingPlaybookRequest)
        : null,
      lastPlaybookBatch: this.lastPlaybookBatch
        ? clonePlain(this.lastPlaybookBatch)
        : null,
      recentPlaybookTransitions:
        this.playbookTransitionHistory.map(
          (transition) => clonePlain(transition)
        ),
      completedPlaybookIntroCount:
        this.completedPlaybookIntroCount,
      completedPlaybookExitCount:
        this.completedPlaybookExitCount,
      prefersReducedMotion: this.prefersReducedMotion(),
      cards: this.cards.map((card, index) => {
        const entry = this.cardEntries[index];
        return {
          index: card.index,
          userCardId: card.userCardId,
          cardId: card.cardId,
          textureUrl: card.textureUrl,
          backTextureUrl: card.backTextureUrl,
          screenRect: {
            x: card.x,
            y: card.y,
            width: card.width,
            height: card.height
          },
          rotationDegrees: card.rotationDegrees,
          visible: this.status === 'ready',
          phase: entry ? entry.phase : 'unmounted',
          visibleFace: entry ? entry.visibleFace : 'front',
          completedFlips: entry ? entry.completedFlips : 0,
          completedArrivals: entry ? entry.completedArrivals : 0,
          animating: entry ? this.activeAnimations.has(entry) : false,
          animationKind: entry && this.activeAnimations.has(entry)
            ? this.activeAnimations.get(entry).kind
            : null,
          arrivalAnimating: entry
            ? Boolean(
              this.activeAnimations.get(entry) &&
              this.activeAnimations.get(entry).kind === 'arrival'
            )
            : false,
          playbookAnimating: entry
            ? Boolean(
              this.activeAnimations.get(entry) &&
              this.activeAnimations.get(entry).kind === 'playbook'
            )
            : false,
          exited: entry ? entry.exited === true : false,
          settledRotationZ: entry
            ? entry.settledRotationZ
            : 0,
          analyticShadowVisible: Boolean(
            entry && entry.liftShadow && entry.liftShadow.visible
          ),
          analyticShadowOpacity: entry && entry.liftShadowMaterial
            ? entry.liftShadowMaterial.opacity
            : 0,
          lastTransition: entry
            ? this.cloneTransition(entry.lastTransition)
            : null,
          lastArrivalTransition: entry
            ? this.cloneTransition(entry.lastArrivalTransition)
            : null,
          transform: entry ? {
            liftY: entry.currentMotion.screenLiftY,
            z: entry.currentMotion.depth,
            airGap: entry.currentMotion.airGap,
            tableClearance: entry.currentMotion.tableClearance,
            nearestVertexDepth: entry.currentMotion.nearestVertexDepth,
            farthestVertexDepth: entry.currentMotion.farthestVertexDepth,
            scale: entry.motionRoot.scale.x,
            rotationX: entry.flipRoot.rotation.x,
            rotationY: entry.flipRoot.rotation.y,
            pickupTiltX: entry.currentMotion.pickupTiltX,
            pickupTiltY: entry.currentMotion.pickupTiltY,
            projectionShearX: entry.currentMotion.projectionShearX,
            projectionShearY: entry.currentMotion.projectionShearY,
            staticRotationZ: entry.tiltRoot.rotation.z,
            screenPosition: {
              x: entry.currentMotion.screenX,
              y: entry.currentMotion.screenY
            },
            perspectiveScale:
              LOBBY_CAMERA_DISTANCE /
              (LOBBY_CAMERA_DISTANCE - entry.currentMotion.depth),
            worldPosition: {
              x: entry.motionRoot.position.x,
              y: entry.motionRoot.position.y,
              z: entry.motionRoot.position.z
            },
            projectedFace: this.getProjectedFaceMetrics(entry)
          } : null
        };
      })
    };
  }

  dispose() {
    if (this.disposed) {
      return;
    }

    this.cancelAnimations('disposed', false);
    this.disposed = true;
    this.generation += 1;
    this.clearCommittedCards();
    if (this.cardGeometry) {
      this.cardGeometry.dispose();
    }
    if (this.cardBodyGeometry) {
      this.cardBodyGeometry.dispose();
    }
    if (this.liftShadowGeometry) {
      this.liftShadowGeometry.dispose();
    }
    if (this.liftShadowTexture) {
      this.liftShadowTexture.dispose();
    }
    if (this.inputTarget && this.handleCanvasClick) {
      this.detachInputHandlers();
      this.restoreInputCursor();
    }
    if (this.canvas && this.handleContextLost) {
      this.canvas.removeEventListener('webglcontextlost', this.handleContextLost, false);
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

const lobbyPlaybookApi = Object.freeze({
  metadata: LOBBY_MOTION_PLAYBOOK_METADATA,
  targets: LOBBY_MOTION_TARGETS,
  introSharedMotionFields: LOBBY_INTRO_SHARED_MOTION_FIELDS,
  windTargetId: LOBBY_WIND_EXIT_TARGET_ID,
  windVariation: LOBBY_WIND_VARIATION,
  defaults: DEFAULT_LOBBY_MOTION_PLAYBOOK,
  normalize(playbook) {
    return normalizeLobbyMotionPlaybook(playbook);
  },
  parse(json) {
    return parseLobbyMotionPlaybook(json);
  },
  serialize(playbook) {
    return serializeLobbyMotionPlaybook(playbook);
  },
  getTarget(playbook, targetId) {
    return getLobbyMotionTarget(playbook, targetId);
  },
  getTargetDefinition(targetId) {
    return getLobbyMotionTargetDefinition(targetId);
  },
  updateTarget(playbook, targetId, preset, delayMs) {
    return updateLobbyMotionTarget(
      playbook,
      targetId,
      preset,
      delayMs
    );
  },
  copyIntroSharedMotion(
    playbook,
    sourceTargetId,
    destinationTargetIds
  ) {
    return copyLobbyIntroSharedMotion(
      playbook,
      sourceTargetId,
      destinationTargetIds
    );
  },
  updateWindSeed(playbook, seed, locked) {
    return updateLobbyWindSeed(playbook, seed, locked);
  },
  createBatch(playbook, sequence, cards, request) {
    return createLobbyMotionBatch(
      playbook,
      sequence,
      cards,
      request
    );
  },
  samplePlan(plan, elapsedMs) {
    return sampleLobbyMotionPlan(plan, elapsedMs);
  }
});

window.gh = window.gh || {};
window.gh.modernGraphics = {
  packageVersion: __PURETT_THREE_PACKAGE_VERSION__,
  revision: REVISION,
  cardAnimations: Object.freeze({
    profiles: Object.freeze({
      casualDropLeft: CASUAL_DROP_LEFT_PROFILE
    }),
    createArrivalBatch(cards, request) {
      return createCardArrivalBatch(cards, request);
    },
    sampleArrival(plan, elapsedMs) {
      return sampleCardArrival(plan, elapsedMs);
    }
  }),
  motionStudio: Object.freeze({
    schemaVersion: CARD_MOTION_SCHEMA_VERSION,
    camera: MOTION_STUDIO_CAMERA,
    controls: CARD_MOTION_CONTROLS,
    limits: CARD_MOTION_AUTHORING_LIMITS,
    recipeLimits: CARD_MOTION_LIMITS,
    presets: Object.freeze({
      'gentle-drop': CARD_MOTION_PRESETS.gentleDrop,
      'casual-toss': CARD_MOTION_PRESETS.casualToss,
      'energetic-scatter': CARD_MOTION_PRESETS.energeticScatter
    }),
    playbook: lobbyPlaybookApi,
    normalizePreset(preset) {
      return validateMotionStudioPreset(preset);
    },
    createPlan(preset, instance) {
      return createCardMotionPlan(preset, instance);
    },
    samplePlan(plan, elapsedMs) {
      return sampleCardMotion(plan, elapsedMs);
    },
    serializePreset(preset) {
      return serializeCardMotionPreset(preset);
    },
    parsePreset(json) {
      return parseCardMotionPreset(json);
    },
    coin: Object.freeze({
      schemaVersion:
        TURN_MARKER_MOTION_SCHEMA_VERSION,
      defaults:
        DEFAULT_TURN_MARKER_MOTION_PROFILE,
      positions:
        TURN_MARKER_MATCH_CENTERS,
      limits:
        TURN_MARKER_MOTION_LIMITS,
      normalize(profile) {
        return normalizeTurnMarkerMotionProfile(
          profile
        );
      },
      createPlan(profile, instance) {
        return createTurnMarkerMotionPlan(
          profile,
          instance
        );
      },
      samplePlan(plan, elapsedMs) {
        return sampleTurnMarkerMotion(
          plan,
          elapsedMs
        );
      },
      serialize(profile) {
        return serializeTurnMarkerMotionProfile(
          profile
        );
      },
      parse(json) {
        return parseTurnMarkerMotionProfile(json);
      }
    })
  }),
  lobbyPlaybook: lobbyPlaybookApi,
  gameBoxCover: Object.freeze({
    cacheIdentity:
      GAME_BOX_COVER_CACHE_IDENTITY,
    schemaVersion:
      GAME_BOX_COVER_MOTION_SCHEMA_VERSION,
    stage: GAME_BOX_COVER_STAGE,
    doors: GAME_BOX_COVER_DOORS,
    defaults:
      GAME_BOX_COVER_MOTION_DEFAULTS,
    createPlan(options) {
      return createGameBoxCoverMotionPlan(
        options
      );
    },
    samplePlan(plan, elapsedMs) {
      return sampleGameBoxCoverMotion(
        plan,
        elapsedMs
      );
    }
  }),
  createSurface(host, options) {
    return new ModernGraphicsSurface(host, options);
  },
  createLobbyHandSurface(host, options) {
    return new LobbyHandSurface(host, options);
  },
  createMotionStudioSurface(host, options) {
    return new MotionStudioSurface(host, options);
  },
  createGameBoxCoverSurface(host, options) {
    return new GameBoxCoverSurface(
      host,
      options
    );
  }
};
