import {
  BoxGeometry,
  CanvasTexture,
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

const LOGICAL_WIDTH = 693;
const LOGICAL_HEIGHT = 500;
const LOBBY_LOGICAL_WIDTH = 755;
const LOBBY_LOGICAL_HEIGHT = 562;
const MAX_PIXEL_RATIO = 3;
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

class ModernGraphicsSurface {
  constructor(host, options) {
    if (!host) {
      throw new Error('The modern graphics host is unavailable.');
    }

    this.host = host;
    this.options = options || {};
    this.disposed = false;
    this.contextLost = false;
    this.renderer = null;
    this.canvas = null;

    try {
      this.scene = new Scene();
      this.camera = new PerspectiveCamera(45, LOGICAL_WIDTH / LOGICAL_HEIGHT, 0.1, 1000);
      this.camera.position.z = 5;
      this.renderer = new WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false
      });
      this.renderer.setClearColor(0x000000, 0);

      this.canvas = this.renderer.domElement;
      this.canvas.className = 'modern-graphics-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.canvas.setAttribute('tabindex', '-1');
      this.canvas.dataset.threePackageVersion = __PURETT_THREE_PACKAGE_VERSION__;
      this.canvas.dataset.threeRevision = REVISION;

      this.handleContextLost = (event) => {
        event.preventDefault();
        this.contextLost = true;
        if (typeof this.options.onContextLost === 'function') {
          this.options.onContextLost(new Error('The WebGL context was lost.'));
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

  setContentScale(contentScale) {
    if (this.disposed) {
      return;
    }

    const scale = Number.isFinite(Number(contentScale)) ? Number(contentScale) : 1;
    const devicePixelRatio = window.devicePixelRatio || 1;
    this.renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio * scale, 1), MAX_PIXEL_RATIO));
    this.renderer.setSize(LOGICAL_WIDTH, LOGICAL_HEIGHT, false);
    this.camera.aspect = LOGICAL_WIDTH / LOGICAL_HEIGHT;
    this.camera.updateProjectionMatrix();
    this.render();
  }

  render() {
    if (!this.disposed && !this.contextLost) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  getDebugState() {
    const context = this.renderer.getContext();
    const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && context instanceof WebGL2RenderingContext;

    return {
      packageVersion: __PURETT_THREE_PACKAGE_VERSION__,
      revision: REVISION,
      contextType: isWebGL2 ? 'webgl2' : 'webgl',
      logicalWidth: LOGICAL_WIDTH,
      logicalHeight: LOGICAL_HEIGHT,
      pixelRatio: this.renderer.getPixelRatio(),
      disposed: this.disposed,
      contextLost: this.contextLost
    };
  }

  dispose() {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
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
    const arrivalRequest = this.normalizeArrivalRequest(options);
    if (arrivalRequest &&
        !this.consumedArrivalRequestIds.has(arrivalRequest.id)) {
      this.pendingArrivalRequest = arrivalRequest;
    } else if (cardKey !== this.cardKey) {
      this.pendingArrivalRequest = null;
    }

    if (cardKey === this.cardKey && this.status === 'ready') {
      if (this.pendingArrivalRequest) {
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
      this.consumePendingArrivalWithoutMotion('empty');
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
        this.preparePendingArrival();
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
        currentMotion: {
          screenLiftY: 0,
          depth: 0,
          pickupTiltX: 0,
          pickupTiltY: 0,
          projectionShearX: 0,
          projectionShearY: 0,
          previousFlipRotationX: 0,
          screenX: basePosition.x,
          screenY: basePosition.y
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
      const arrivalRenderOrder = 100 + (
        batch.plans.length - plan.orderIndex
      );
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
      placementOrder: 'farthest-first',
      collisionPolicy: 'spatial-order-and-release-separation',
      flightSpeed: null,
      releaseTimes: [],
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
          bow: plan.path.bow,
          apexDepth: plan.path.apexDepth
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
      placementOrder: batch.placementOrder,
      collisionPolicy: batch.collisionPolicy,
      flightSpeed: batch.flightSpeed,
      releaseTimes: batch.releaseTimes.slice(0),
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
          bow: plan.path.bow,
          apexDepth: plan.path.apexDepth
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
      !this.hasActiveArrival();
  }

  hasActiveArrival() {
    return Array.from(this.activeAnimations.values()).some((animation) => (
      animation.kind === 'arrival'
    ));
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
    } else {
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
          : this.updateAnimation(animation, boundedElapsed);
        if (complete || deadlineElapsed) {
          completed.push({
            animation,
            outcome: animation.kind === 'arrival'
              ? 'completed-arrival'
              : 'completed'
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
    const spread = 0.88 + (0.22 * heightRatio);
    const contactFade = pose.phase === 'slap'
      ? Math.pow(1 - pose.progress, 1.4)
      : 1;
    entry.liftShadow.position.set(
      pose.screenX + (5 + (7 * heightRatio)),
      pose.screenY - (4 + (6 * heightRatio)),
      LOBBY_ANALYTIC_SHADOW_Z
    );
    entry.liftShadow.scale.set(spread, spread * 0.92, 1);
    entry.liftShadowMaterial.opacity =
      (0.04 + (0.12 * (1 - heightRatio))) *
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
    entry.tiltRoot.rotation.z = 0;
    entry.pickupRoot.rotation.x = 0;
    entry.pickupRoot.rotation.y = 0;
    entry.flipRoot.rotation.x = 0;
    entry.flipRoot.rotation.y = 0;
    entry.bodyMesh.renderOrder = entry.card.index;
    entry.frontMesh.renderOrder = entry.card.index;
    entry.backMesh.renderOrder = entry.card.index;
    entry.currentMotion.screenLiftY = 0;
    entry.currentMotion.depth = 0;
    entry.currentMotion.pickupTiltX = 0;
    entry.currentMotion.pickupTiltY = 0;
    entry.currentMotion.screenX = entry.basePosition.x;
    entry.currentMotion.screenY = entry.basePosition.y;
    this.applyFlatTableProjection(entry, 0);
    entry.currentMotion.previousFlipRotationX = 0;
    entry.phase = 'idle';
    entry.visibleFace = 'front';
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
      plan: transition.plan ? {
        orderIndex: transition.plan.orderIndex,
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
          bow: transition.plan.path.bow,
          apexDepth: transition.plan.path.apexDepth
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
    const activeFlipAnimations = activeAnimations.filter((animation) => (
      animation.kind !== 'arrival'
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
          placementOrder: 'farthest-first',
          collisionPolicy: 'spatial-order-and-release-separation',
          projectionProfile: 'flat-table-neutralized-through-arrival',
          phases: ['flight', 'slap', 'slide'],
          landingPolicy: 'monotonic-contact-without-rebound',
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
        placementOrder: this.lastArrivalBatch.placementOrder,
        collisionPolicy: this.lastArrivalBatch.collisionPolicy,
        flightSpeed: this.lastArrivalBatch.flightSpeed,
        releaseTimes: this.lastArrivalBatch.releaseTimes
          ? this.lastArrivalBatch.releaseTimes.slice(0)
          : [],
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
            bow: plan.path.bow,
            apexDepth: plan.path.apexDepth
          }
        }))
      } : null,
      lastArrivalTransition:
        this.cloneTransition(this.lastArrivalTransition),
      recentArrivalTransitions: this.arrivalTransitionHistory.map(
        (transition) => this.cloneTransition(transition)
      ),
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
  createSurface(host, options) {
    return new ModernGraphicsSurface(host, options);
  },
  createLobbyHandSurface(host, options) {
    return new LobbyHandSurface(host, options);
  }
};
