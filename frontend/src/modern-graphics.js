import {PerspectiveCamera, REVISION, Scene, WebGLRenderer} from 'three';

const LOGICAL_WIDTH = 693;
const LOGICAL_HEIGHT = 500;
const MAX_PIXEL_RATIO = 3;

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

window.gh = window.gh || {};
window.gh.modernGraphics = {
  packageVersion: __PURETT_THREE_PACKAGE_VERSION__,
  revision: REVISION,
  createSurface(host, options) {
    return new ModernGraphicsSurface(host, options);
  }
};
