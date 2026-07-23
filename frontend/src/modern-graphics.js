import {
  DoubleSide,
  Group,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  REVISION,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  WebGLRenderer
} from 'three';

const LOGICAL_WIDTH = 693;
const LOGICAL_HEIGHT = 500;
const LOBBY_LOGICAL_WIDTH = 755;
const LOBBY_LOGICAL_HEIGHT = 562;
const MAX_PIXEL_RATIO = 3;
const LOBBY_CARD_ROTATIONS = [-1.6, 1.1, -0.6, 1.5, -1.0];

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
    this.textures = new Map();
    this.materials = [];

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

      this.handleContextLost = (event) => {
        event.preventDefault();
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

      if (!textureUrl || !Number.isFinite(x) || !Number.isFinite(y) ||
          !Number.isFinite(width) || !Number.isFinite(height) ||
          width <= 0 || height <= 0) {
        throw new Error(`Lobby hand card ${index + 1} has invalid rendering data.`);
      }

      return {
        index: Number.isFinite(Number(card.index)) ? Number(card.index) : index,
        userCardId: card.userCardId == null ? null : card.userCardId,
        cardId: card.cardId == null ? null : card.cardId,
        textureUrl,
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
    this.cardKey = cardKey;
    this.status = 'loading';
    this.cards = normalized;
    this.clearCommittedCards();
    this.render();

    const textureUrls = Array.from(new Set(normalized.map((card) => card.textureUrl)));
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
    this.cards.forEach((card) => {
      const material = new MeshBasicMaterial({
        map: this.textures.get(card.textureUrl),
        transparent: true,
        alphaTest: 0.01,
        depthTest: false,
        depthWrite: false,
        side: DoubleSide,
        toneMapped: false
      });
      const mesh = new Mesh(this.cardGeometry, material);
      mesh.position.set(
        card.x + (card.width / 2),
        LOBBY_LOGICAL_HEIGHT - card.y - (card.height / 2),
        0
      );
      mesh.rotation.z = card.rotationDegrees * Math.PI / 180;
      mesh.renderOrder = card.index;
      mesh.userData.purettCard = card;
      this.cardGroup.add(mesh);
      this.materials.push(material);
      this.meshes.push(mesh);
    });
  }

  clearCommittedCards() {
    this.meshes.forEach((mesh) => this.cardGroup.remove(mesh));
    this.materials.forEach((material) => material.dispose());
    this.textures.forEach((texture) => texture.dispose());
    this.meshes = [];
    this.materials = [];
    this.textures.clear();
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
      meshCount: this.meshes.length,
      textureCount: this.textures.size,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      cards: this.cards.map((card) => ({
        index: card.index,
        userCardId: card.userCardId,
        cardId: card.cardId,
        textureUrl: card.textureUrl,
        screenRect: {
          x: card.x,
          y: card.y,
          width: card.width,
          height: card.height
        },
        rotationDegrees: card.rotationDegrees,
        visible: this.status === 'ready'
      }))
    };
  }

  dispose() {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.generation += 1;
    this.clearCommittedCards();
    if (this.cardGeometry) {
      this.cardGeometry.dispose();
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
