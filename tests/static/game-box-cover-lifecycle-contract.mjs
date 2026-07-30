import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {
  fileURLToPath
} from 'node:url';
import {
  GameBoxCoverSurface
} from '../../frontend/src/game-box-cover-surface.js';

const root = path.resolve(
  path.dirname(
    fileURLToPath(import.meta.url)
  ),
  '../..'
);
let assertions = 0;

function assert(condition, message) {
  assertions += 1;
  if (!condition) {
    throw new Error(message);
  }
}

function near(
  actual,
  expected,
  epsilon,
  message
) {
  assert(
    Math.abs(actual - expected) <=
      epsilon,
    `${message}: expected ${expected}, received ${actual}`
  );
}

function descriptor(
  sequence,
  target,
  startedAtMs
) {
  return {
    schemaVersion: 1,
    sequence,
    target,
    startedAtMs,
    durationMs:
      startedAtMs === null
        ? 0
        : 2000,
    easing:
      startedAtMs === null
        ? null
        : (
            target === 'open'
              ? 'cubic-in'
              : 'cubic-out'
          ),
    frame: {
      x: 0,
      y: 0,
      width: 755,
      height: 562
    },
    panels: [
      {
        id: 'left',
        textureUrl:
          '/images/left.png',
        rect: {
          x: 0,
          y: 0,
          width: 377,
          height: 562
        },
        hinge: 'left',
        rotationSign: -1
      },
      {
        id: 'right',
        textureUrl:
          '/images/right.png',
        rect: {
          x: 376,
          y: 0,
          width: 378,
          height: 562
        },
        hinge: 'right',
        rotationSign: 1
      }
    ]
  };
}

function texture(label) {
  return {
    label,
    disposeCalls: 0,
    dispose() {
      this.disposeCalls += 1;
    }
  };
}

function bareSurface() {
  const surface =
    Object.create(
      GameBoxCoverSurface.prototype
    );
  surface.disposed = false;
  surface.contextLost = false;
  surface.suspended = false;
  surface.visibilitySuspended = false;
  surface.status = 'loading';
  surface.ready = false;
  surface.readyReported = false;
  surface.generation = 0;
  surface.presentation = null;
  surface.appliedSequence = -1;
  surface.currentPose = null;
  surface.motion = null;
  surface.motionGeneration = 0;
  surface.animationFrameId = null;
  surface.pendingFrameCount = 0;
  surface.peakPendingFrameCount = 0;
  surface.frameCount = 0;
  surface.acceptedTransitions = 0;
  surface.completedTransitions = 0;
  surface.cancelledTransitions = 0;
  surface.ignoredPresentations = 0;
  surface.ignoredStalePresentations = 0;
  surface.reducedMotionTransitions = 0;
  surface.lastTransition = null;
  surface.lastFailureReason = null;
  surface.textures = new Map();
  surface.materials = [];
  surface.pendingTextureLoads =
    new Set();
  surface.doorEntries = {};
  surface.options = {};
  surface.render = () => {};
  surface.prefersReducedMotion =
    () => false;
  return surface;
}

try {
  let clockNow = 0;
  globalThis.window = {
    performance: {
      now() {
        return clockNow;
      }
    },
    setTimeout,
    clearTimeout,
    requestAnimationFrame() {
      throw new Error(
        'pre-ready motion scheduled a frame'
      );
    },
    cancelAnimationFrame() {},
    devicePixelRatio: 1,
    matchMedia() {
      return {matches: false};
    }
  };

  const partialSurface =
    bareSurface();
  const fulfilledTexture =
    texture('left-fulfilled');
  let partialBuilds = 0;
  let partialErrors = 0;
  partialSurface.loadTexture =
    (url) => (
      url === '/images/left.png'
        ? Promise.resolve(
            fulfilledTexture
          )
        : Promise.reject(
            new Error(
              'right texture failed'
            )
          )
    );
  partialSurface.buildDoors = () => {
    partialBuilds += 1;
  };
  partialSurface.reportError = () => {
    partialErrors += 1;
  };
  await partialSurface.loadDoors();
  assert(
    fulfilledTexture.disposeCalls ===
      1 &&
      partialBuilds === 0 &&
      partialErrors === 1 &&
      partialSurface.textures.size ===
        0,
    'a fulfilled sibling texture survived an atomic door-load failure'
  );

  const staleSurface = bareSurface();
  const staleLeft =
    texture('stale-left');
  const staleRight =
    texture('stale-right');
  let releaseLeft;
  let releaseRight;
  let staleBuilds = 0;
  let staleErrors = 0;
  staleSurface.loadTexture =
    (url) => new Promise((resolve) => {
      if (url === '/images/left.png') {
        releaseLeft = () => resolve(
          staleLeft
        );
      } else {
        releaseRight = () => resolve(
          staleRight
        );
      }
    });
  staleSurface.buildDoors = () => {
    staleBuilds += 1;
  };
  staleSurface.reportError = () => {
    staleErrors += 1;
  };
  const staleLoad =
    staleSurface.loadDoors();
  staleSurface.generation += 1;
  releaseLeft();
  releaseRight();
  await staleLoad;
  assert(
    staleLeft.disposeCalls === 1 &&
      staleRight.disposeCalls === 1 &&
      staleBuilds === 0 &&
      staleErrors === 0 &&
      staleSurface.textures.size === 0,
    'a stale door generation installed or retained late textures'
  );

  const returnedTextureSurface =
    bareSurface();
  const returnedPartial =
    texture('loader-return');
  returnedTextureSurface
    .textureLoadTimeoutMs = 20;
  returnedTextureSurface.renderer = {
    capabilities: {
      getMaxAnisotropy() {
        throw new Error(
          'late texture touched a disposed renderer'
        );
      }
    }
  };
  let lateOnLoad;
  returnedTextureSurface.textureLoader = {
    load(
      url,
      onLoad,
      onProgress,
      onError
    ) {
      lateOnLoad = onLoad;
      queueMicrotask(onError);
      return returnedPartial;
    }
  };
  let returnedRejected = false;
  try {
    await returnedTextureSurface
      .loadTexture(
        '/images/right.png'
      );
  } catch (error) {
    returnedRejected = true;
  }
  assert(
    returnedRejected &&
      returnedPartial.disposeCalls ===
        1 &&
      returnedTextureSurface
        .pendingTextureLoads.size === 0,
    'the immediate TextureLoader result leaked after failure'
  );
  lateOnLoad(returnedPartial);
  assert(
    returnedPartial.disposeCalls === 1,
    'a late texture completion was not inert or disposed exactly once'
  );

  const virtualSurface =
    bareSurface();
  clockNow = 0;
  virtualSurface.setPresentation(
    descriptor(0, 'closed', null)
  );
  clockNow = 200;
  virtualSurface.setPresentation(
    descriptor(1, 'open', 100)
  );
  assert(
    virtualSurface.motion !== null &&
      virtualSurface.pendingFrameCount ===
        0,
    'pre-ready motion did not remain virtual and frame-free'
  );
  clockNow = 800;
  virtualSurface.setPresentation(
    descriptor(2, 'closed', 500)
  );
  near(
    virtualSurface.motion.plan
      .fromOpenness,
    Math.pow(400 / 2000, 3),
    1e-12,
    'pre-ready reversal source pose'
  );
  assert(
    virtualSurface.acceptedTransitions ===
      2 &&
      virtualSurface.cancelledTransitions ===
        1 &&
      virtualSurface.pendingFrameCount ===
        0,
    'pre-ready supersession counters or scheduler are inconsistent'
  );

  let malformedRejected = false;
  try {
    virtualSurface
      .normalizePresentation(
        descriptor(
          3,
          'open',
          null
        )
      );
  } catch (error) {
    malformedRejected = true;
  }
  assert(
    malformedRejected,
    'a non-initial null-time descriptor was accepted'
  );

  const graphicsContext = {
    gh: {},
    console,
    JSON,
    document: {},
    window: {},
    $() {
      return {};
    }
  };
  vm.runInNewContext(
    fs.readFileSync(
      path.join(
        root,
        'public/js/plugins/gh.graphics.js'
      ),
      'utf8'
    ),
    graphicsContext,
    {filename: 'gh.graphics.js'}
  );
  const graphics =
    Object.create(
      graphicsContext.gh
        .graphics.prototype
    );
  const healthySurface = {};
  let failedCoverDisposals = 0;
  let readyGate = true;
  graphics.surface = healthySurface;
  graphics.effectiveMode = 'modern';
  graphics.gameCoverReady = true;
  graphics.gameCoverFallbackReason =
    null;
  graphics.gameCoverSurfaceDisposing =
    false;
  graphics.gameCoverSurface = {
    setPresentation() {
      throw new Error(
        'simulated cover render failure'
      );
    },
    dispose() {
      failedCoverDisposals += 1;
    }
  };
  graphics.cover = {
    setModernCoverReady(ready) {
      readyGate = ready;
    }
  };
  graphics.updateModernStatus =
    () => {};
  graphics.updateGameCover(
    descriptor(1, 'open', 100)
  );
  assert(
    graphics.effectiveMode ===
      'modern' &&
      graphics.surface ===
        healthySurface &&
      graphics.gameCoverSurface ===
        null &&
      graphics.gameCoverReady ===
        false &&
      graphics.gameCoverFallbackReason ===
        'presentation-failed' &&
      readyGate === false &&
      failedCoverDisposals === 1,
    'a cover-only runtime failure demoted or replaced healthy Modern graphics'
  );

  console.log(
    `game-box cover lifecycle contract passed (${assertions} assertions)`
  );
} catch (error) {
  console.error(
    `game-box cover lifecycle contract failed: ${error.message}`
  );
  process.exitCode = 1;
}
