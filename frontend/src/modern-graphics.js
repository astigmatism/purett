import {
  FrontSide,
  Group,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  REVISION,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  WebGLRenderer
} from 'three';

const LOGICAL_WIDTH = 693;
const LOGICAL_HEIGHT = 500;
const LOBBY_LOGICAL_WIDTH = 755;
const LOBBY_LOGICAL_HEIGHT = 562;
const MAX_PIXEL_RATIO = 3;
const LOBBY_CARD_ROTATIONS = [-1.6, 1.1, -0.6, 1.5, -1.0];
const LOBBY_CARD_BACK_URL = '/images/cards/cardBack.png';
const LOBBY_LIFT_Y = 16;
const LOBBY_LIFT_Z = 4;
const LOBBY_LIFT_SCALE = 1.08;
const LOBBY_FLIP_TIMINGS = Object.freeze({
  lift: 180,
  toBack: 280,
  backHold: 180,
  toFront: 280,
  settle: 220
});

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
    this.activeAnimation = null;
    this.animationFrameId = null;
    this.animationFrameCount = 0;
    this.activationSequence = 0;
    this.acceptedClicks = 0;
    this.ignoredClicks = 0;
    this.emptyClicks = 0;
    this.completedAnimationCount = 0;
    this.lastPick = null;
    this.lastTransition = null;

    try {
      this.scene = new Scene();
      this.camera = new OrthographicCamera(
        0,
        LOBBY_LOGICAL_WIDTH,
        LOBBY_LOGICAL_HEIGHT,
        0,
        0.1,
        100
      );
      this.camera.position.z = 10;
      this.cardGroup = new Group();
      this.scene.add(this.cardGroup);
      this.cardGeometry = new PlaneGeometry(117, 146);
      this.textureLoader = new TextureLoader();
      this.renderer = new WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false
      });
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.outputColorSpace = SRGBColorSpace;

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
        this.cancelAnimation('context-lost', false);
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
        rotationDegrees: LOBBY_CARD_ROTATIONS[index] || 0
      };
    });
  }

  setCards(cards) {
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

    if (cardKey === this.cardKey && this.status === 'ready') {
      this.presentReady();
      return;
    }
    if (cardKey === this.cardKey && this.status === 'loading') {
      return;
    }

    const generation = ++this.generation;
    this.cancelAnimation('replaced');
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
      this.presentReady();
      return;
    }

    const texturePromises = textureUrls.map((textureUrl) => (
      this.textureLoader.loadAsync(textureUrl).then((texture) => {
        texture.colorSpace = SRGBColorSpace;
        texture.minFilter = LinearFilter;
        texture.magFilter = LinearFilter;
        texture.generateMipmaps = false;
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
        this.status = 'ready';
        this.presentReady();
      } catch (error) {
        this.status = 'failed';
        this.reportError(error);
      }
    });
  }

  commitCards() {
    const backMaterials = new Map();

    this.cards.forEach((card) => {
      const frontMaterial = new MeshBasicMaterial({
        map: this.textures.get(card.textureUrl),
        transparent: true,
        alphaTest: 0.01,
        depthTest: false,
        depthWrite: false,
        side: FrontSide,
        toneMapped: false
      });
      let backMaterial = backMaterials.get(card.backTextureUrl);
      if (!backMaterial) {
        backMaterial = new MeshBasicMaterial({
          map: this.textures.get(card.backTextureUrl),
          transparent: true,
          alphaTest: 0.01,
          depthTest: false,
          depthWrite: false,
          side: FrontSide,
          toneMapped: false
        });
        backMaterials.set(card.backTextureUrl, backMaterial);
        this.materials.push(backMaterial);
      }

      const motionRoot = new Group();
      const tiltRoot = new Group();
      const flipRoot = new Group();
      const frontMesh = new Mesh(this.cardGeometry, frontMaterial);
      const backMesh = new Mesh(this.cardGeometry, backMaterial);
      const basePosition = {
        x: card.x + (card.width / 2),
        y: LOBBY_LOGICAL_HEIGHT - card.y - (card.height / 2),
        z: 0
      };

      motionRoot.position.set(
        basePosition.x,
        basePosition.y,
        basePosition.z
      );
      tiltRoot.rotation.z = card.rotationDegrees * Math.PI / 180;
      frontMesh.position.z = 0.01;
      backMesh.position.z = -0.01;
      backMesh.rotation.y = Math.PI;
      frontMesh.renderOrder = card.index;
      backMesh.renderOrder = card.index;

      flipRoot.add(frontMesh);
      flipRoot.add(backMesh);
      tiltRoot.add(flipRoot);
      motionRoot.add(tiltRoot);

      const entry = {
        card,
        motionRoot,
        tiltRoot,
        flipRoot,
        frontMesh,
        backMesh,
        basePosition,
        phase: 'idle',
        visibleFace: 'front',
        completedFlips: 0
      };
      frontMesh.userData.purettCardEntry = entry;
      backMesh.userData.purettCardEntry = entry;
      this.cardGroup.add(motionRoot);
      this.materials.push(frontMaterial);
      this.cardEntries.push(entry);
      this.meshes.push(frontMesh);
      this.pickMeshes.push(frontMesh, backMesh);
    });
  }

  clearCommittedCards() {
    this.cancelAnimation('cleared');
    this.cardEntries.forEach((entry) => this.cardGroup.remove(entry.motionRoot));
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
      !this.contextLost;
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

    const entries = intersections
      .map((intersection) => intersection.object.userData.purettCardEntry)
      .filter(Boolean)
      .sort((left, right) => right.frontMesh.renderOrder - left.frontMesh.renderOrder);
    return entries[0] || null;
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
    if (this.activeAnimation) {
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
    if (!this.isInteractive() || this.activeAnimation) {
      this.restoreInputCursor();
      return;
    }
    this.inputTarget.style.cursor = this.pickCard(event.clientX, event.clientY)
      ? 'pointer'
      : this.inputTargetCursor;
  }

  prefersReducedMotion() {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  startAnimation(entry) {
    const token = ++this.activationSequence;
    entry.phase = 'lifting';
    entry.visibleFace = 'front';
    entry.frontMesh.renderOrder = 100 + this.activationSequence;
    entry.backMesh.renderOrder = 100 + this.activationSequence;
    this.activeAnimation = {
      entry,
      startTime: window.performance && typeof window.performance.now === 'function'
        ? window.performance.now()
        : null,
      token,
      reducedMotion: false
    };
    this.lastTransition = {
      cardIndex: entry.card.index,
      userCardId: entry.card.userCardId,
      cardId: entry.card.cardId,
      outcome: 'running',
      phases: ['lift']
    };
    this.restoreInputCursor();
    this.scheduleAnimationFrame();
  }

  startReducedMotionAnimation(entry) {
    const token = ++this.activationSequence;
    entry.phase = 'showing-back';
    entry.visibleFace = 'back';
    entry.frontMesh.renderOrder = 100 + token;
    entry.backMesh.renderOrder = 100 + token;
    entry.flipRoot.rotation.y = Math.PI;
    this.activeAnimation = {
      entry,
      startTime: null,
      token,
      reducedMotion: true,
      reducedStep: 0
    };
    this.lastTransition = {
      cardIndex: entry.card.index,
      userCardId: entry.card.userCardId,
      cardId: entry.card.cardId,
      outcome: 'running-reduced-motion',
      phases: ['back']
    };
    this.restoreInputCursor();
    this.render();
    this.scheduleAnimationFrame();
  }

  scheduleAnimationFrame() {
    if (this.animationFrameId !== null || !this.activeAnimation ||
        this.disposed || this.contextLost || this.suspended) {
      return;
    }

    const animation = this.activeAnimation;
    this.animationFrameId = window.requestAnimationFrame((timestamp) => {
      this.animationFrameId = null;
      this.tickAnimation(timestamp, animation);
    });
  }

  tickAnimation(timestamp, animation) {
    if (!this.activeAnimation || this.activeAnimation !== animation ||
        this.disposed || this.contextLost || this.suspended) {
      return;
    }

    try {
      if (animation.reducedMotion) {
        this.tickReducedMotionAnimation(animation);
        return;
      }
      if (animation.startTime === null) {
        animation.startTime = timestamp;
      }
      const elapsed = Math.max(0, timestamp - animation.startTime);
      const complete = this.updateAnimation(animation.entry, elapsed);
      this.animationFrameCount += 1;
      this.render();
      if (complete) {
        this.completeAnimation();
      } else {
        this.scheduleAnimationFrame();
      }
    } catch (error) {
      this.cancelAnimation('failed', false);
      this.status = 'failed';
      this.reportError(error);
    }
  }

  tickReducedMotionAnimation(animation) {
    if (animation.reducedStep === 0) {
      // Keep the back through one animation-frame boundary so it can be
      // presented before the next bounded frame restores the front.
      animation.reducedStep = 1;
      animation.entry.phase = 'showing-back';
      animation.entry.visibleFace = 'back';
      animation.entry.flipRoot.rotation.y = Math.PI;
      this.animationFrameCount += 1;
      this.render();
      this.scheduleAnimationFrame();
      return;
    }

    animation.entry.phase = 'showing-front';
    animation.entry.visibleFace = 'front';
    animation.entry.flipRoot.rotation.y = Math.PI * 2;
    this.markTransitionPhase('front');
    this.animationFrameCount += 1;
    this.render();
    this.completeAnimation('completed-reduced-motion');
  }

  updateAnimation(entry, elapsed) {
    const liftEnd = LOBBY_FLIP_TIMINGS.lift;
    const backEnd = liftEnd + LOBBY_FLIP_TIMINGS.toBack;
    const holdEnd = backEnd + LOBBY_FLIP_TIMINGS.backHold;
    const frontEnd = holdEnd + LOBBY_FLIP_TIMINGS.toFront;
    const settleEnd = frontEnd + LOBBY_FLIP_TIMINGS.settle;
    let progress;

    if (elapsed >= backEnd) {
      this.markTransitionPhase('back');
    }
    if (elapsed >= frontEnd) {
      this.markTransitionPhase('front');
    }

    if (elapsed < liftEnd) {
      progress = this.easeOutCubic(elapsed / LOBBY_FLIP_TIMINGS.lift);
      entry.phase = 'lifting';
      entry.visibleFace = 'front';
      this.applyLift(entry, progress);
      entry.flipRoot.rotation.y = 0;
      return false;
    }
    if (elapsed < backEnd) {
      progress = this.easeInOutCubic((elapsed - liftEnd) / LOBBY_FLIP_TIMINGS.toBack);
      entry.phase = 'showing-back';
      entry.visibleFace = progress < 0.5 ? 'front' : 'back';
      this.applyLift(entry, 1);
      entry.flipRoot.rotation.y = Math.PI * progress;
      return false;
    }
    if (elapsed < holdEnd) {
      entry.phase = 'showing-back';
      entry.visibleFace = 'back';
      this.applyLift(entry, 1);
      entry.flipRoot.rotation.y = Math.PI;
      return false;
    }
    if (elapsed < frontEnd) {
      progress = this.easeInOutCubic((elapsed - holdEnd) / LOBBY_FLIP_TIMINGS.toFront);
      entry.phase = 'showing-front';
      entry.visibleFace = progress < 0.5 ? 'back' : 'front';
      this.applyLift(entry, 1);
      entry.flipRoot.rotation.y = Math.PI + (Math.PI * progress);
      return false;
    }
    if (elapsed < settleEnd) {
      progress = this.easeInOutCubic((elapsed - frontEnd) / LOBBY_FLIP_TIMINGS.settle);
      entry.phase = 'settling';
      entry.visibleFace = 'front';
      this.applyLift(entry, 1 - progress);
      entry.flipRoot.rotation.y = Math.PI * 2;
      return false;
    }

    return true;
  }

  applyLift(entry, progress) {
    entry.motionRoot.position.set(
      entry.basePosition.x,
      entry.basePosition.y + (LOBBY_LIFT_Y * progress),
      entry.basePosition.z + (LOBBY_LIFT_Z * progress)
    );
    const scale = 1 + ((LOBBY_LIFT_SCALE - 1) * progress);
    entry.motionRoot.scale.set(scale, scale, scale);
  }

  completeAnimation(outcome) {
    if (!this.activeAnimation) {
      return;
    }

    const entry = this.activeAnimation.entry;
    this.activeAnimation = null;
    this.settleEntry(entry);
    entry.completedFlips += 1;
    this.completedAnimationCount += 1;
    this.markTransitionPhase('settled');
    if (this.lastTransition) {
      this.lastTransition.outcome = outcome || 'completed';
    }
    this.render();
  }

  cancelAnimation(outcome, shouldRender) {
    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (!this.activeAnimation) {
      return;
    }

    const entry = this.activeAnimation.entry;
    this.activeAnimation = null;
    this.settleEntry(entry);
    this.markTransitionPhase('settled');
    if (this.lastTransition &&
        (this.lastTransition.outcome === 'running' ||
         this.lastTransition.outcome === 'running-reduced-motion')) {
      this.lastTransition.outcome = outcome || 'cancelled';
    }
    if (shouldRender !== false) {
      this.render();
    }
  }

  settleEntry(entry) {
    entry.motionRoot.position.set(
      entry.basePosition.x,
      entry.basePosition.y,
      entry.basePosition.z
    );
    entry.motionRoot.scale.set(1, 1, 1);
    entry.flipRoot.rotation.y = 0;
    entry.frontMesh.renderOrder = entry.card.index;
    entry.backMesh.renderOrder = entry.card.index;
    entry.phase = 'idle';
    entry.visibleFace = 'front';
  }

  markTransitionPhase(phase) {
    if (!this.lastTransition || this.lastTransition.phases.indexOf(phase) !== -1) {
      return;
    }
    this.lastTransition.phases.push(phase);
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

  suspend() {
    this.suspended = true;
    this.cancelAnimation('cancelled');
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

  getDebugState() {
    const context = this.renderer.getContext();
    const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && context instanceof WebGL2RenderingContext;

    return {
      packageVersion: __PURETT_THREE_PACKAGE_VERSION__,
      revision: REVISION,
      contextType: isWebGL2 ? 'webgl2' : 'webgl',
      surface: 'lobby-hand',
      logicalWidth: LOBBY_LOGICAL_WIDTH,
      logicalHeight: LOBBY_LOGICAL_HEIGHT,
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
      activeAnimationCount: this.activeAnimation ? 1 : 0,
      lockHeld: Boolean(this.activeAnimation),
      activeCardIndex: this.activeAnimation ? this.activeAnimation.entry.card.index : null,
      phase: this.activeAnimation ? this.activeAnimation.entry.phase : 'idle',
      animationFrameCount: this.animationFrameCount,
      acceptedClicks: this.acceptedClicks,
      ignoredClicks: this.ignoredClicks,
      emptyClicks: this.emptyClicks,
      completedAnimationCount: this.completedAnimationCount,
      lastPick: this.lastPick ? Object.assign({}, this.lastPick) : null,
      lastTransition: this.lastTransition ? {
        cardIndex: this.lastTransition.cardIndex,
        userCardId: this.lastTransition.userCardId,
        cardId: this.lastTransition.cardId,
        outcome: this.lastTransition.outcome,
        phases: this.lastTransition.phases.slice(0)
      } : null,
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
          transform: entry ? {
            liftY: entry.motionRoot.position.y - entry.basePosition.y,
            z: entry.motionRoot.position.z,
            scale: entry.motionRoot.scale.x,
            rotationY: entry.flipRoot.rotation.y
          } : null
        };
      })
    };
  }

  dispose() {
    if (this.disposed) {
      return;
    }

    this.cancelAnimation('disposed');
    this.disposed = true;
    this.generation += 1;
    this.clearCommittedCards();
    if (this.cardGeometry) {
      this.cardGeometry.dispose();
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
  createSurface(host, options) {
    return new ModernGraphicsSurface(host, options);
  },
  createLobbyHandSurface(host, options) {
    return new LobbyHandSurface(host, options);
  }
};
