import {
  BoxGeometry,
  DirectionalLight,
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
  SRGBColorSpace,
  Scene,
  TextureLoader,
  WebGLRenderer
} from 'three';
import {
  GAME_BOX_COVER_CACHE_IDENTITY,
  GAME_BOX_COVER_DOORS,
  GAME_BOX_COVER_MOTION_DEFAULTS,
  GAME_BOX_COVER_MOTION_SCHEMA_VERSION,
  GAME_BOX_COVER_STAGE,
  createGameBoxCoverMotionPlan,
  sampleGameBoxCoverMotion
} from './game-box-cover-motion.js';

const MAX_PIXEL_RATIO = 3;
const COVER_CAMERA_FOV = 40;
const COVER_CAMERA_CENTER_X =
  GAME_BOX_COVER_STAGE.width / 2;
const COVER_CAMERA_CENTER_Y =
  GAME_BOX_COVER_STAGE.height / 2;
const COVER_CAMERA_DISTANCE =
  (GAME_BOX_COVER_STAGE.height / 2) /
  Math.tan(
    (
      COVER_CAMERA_FOV *
      Math.PI /
      180
    ) /
    2
  );
const COVER_PANEL_THICKNESS = 10;
const COVER_FACE_OFFSET = 0.08;
const COVER_TEXTURE_TIMEOUT_MS = 6000;

function clonePlain(value) {
  return value == null
    ? value
    : JSON.parse(JSON.stringify(value));
}

function hasExactKeys(value, expectedKeys) {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return false;
  }
  const actualKeys =
    Object.keys(value).sort();
  const normalizedExpected =
    expectedKeys.slice().sort();
  return actualKeys.length ===
      normalizedExpected.length &&
    actualKeys.every(
      (key, index) => (
        key === normalizedExpected[index]
      )
    );
}

function nowMs() {
  return window.performance &&
    typeof window.performance.now === 'function'
    ? window.performance.now()
    : Date.now();
}

function expectedPanel(side) {
  const definition = GAME_BOX_COVER_DOORS[side];
  return {
    id: side,
    textureUrl: definition.textureUrl,
    rect: {
      x: definition.x,
      y: 0,
      width: definition.width,
      height: GAME_BOX_COVER_STAGE.height
    },
    hinge: side,
    rotationSign: side === 'left' ? -1 : 1
  };
}

function normalizePanel(panel, side) {
  const expected = expectedPanel(side);
  const source = panel || {};
  const rect = source.rect || {};
  const valid =
    hasExactKeys(
      source,
      [
        'id',
        'textureUrl',
        'rect',
        'hinge',
        'rotationSign'
      ]
    ) &&
    hasExactKeys(
      rect,
      [
        'x',
        'y',
        'width',
        'height'
      ]
    ) &&
    source.id === expected.id &&
    source.textureUrl ===
      expected.textureUrl &&
    source.hinge === expected.hinge &&
    Number(source.rotationSign) ===
      expected.rotationSign &&
    Number(rect.x) === expected.rect.x &&
    Number(rect.y) === expected.rect.y &&
    Number(rect.width) ===
      expected.rect.width &&
    Number(rect.height) ===
      expected.rect.height;
  if (!valid) {
    throw new Error(
      `The ${side} game-box panel descriptor is invalid.`
    );
  }
  return expected;
}

export class GameBoxCoverSurface {
  constructor(host, options) {
    if (!host) {
      throw new Error(
        'The Modern game-box cover host is unavailable.'
      );
    }

    this.host = host;
    this.options = options || {};
    this.disposed = false;
    this.contextLost = false;
    this.suspended = false;
    this.visibilitySuspended =
      document.hidden === true;
    this.status = 'loading';
    this.ready = false;
    this.readyReported = false;
    this.generation = 0;
    this.presentation = null;
    this.appliedSequence = -1;
    this.currentPose = null;
    this.motion = null;
    this.motionGeneration = 0;
    this.animationFrameId = null;
    this.pendingFrameCount = 0;
    this.peakPendingFrameCount = 0;
    this.frameCount = 0;
    this.acceptedTransitions = 0;
    this.completedTransitions = 0;
    this.cancelledTransitions = 0;
    this.ignoredPresentations = 0;
    this.ignoredStalePresentations = 0;
    this.reducedMotionTransitions = 0;
    this.lastTransition = null;
    this.lastFailureReason = null;
    this.textures = new Map();
    this.materials = [];
    this.pendingTextureLoads = new Set();
    this.doorEntries = {};
    const requestedTextureTimeout =
      Number(
        this.options.textureLoadTimeoutMs
      );
    this.textureLoadTimeoutMs =
      Number.isFinite(
        requestedTextureTimeout
      ) &&
      requestedTextureTimeout > 0
        ? Math.min(
            requestedTextureTimeout,
            COVER_TEXTURE_TIMEOUT_MS
          )
        : COVER_TEXTURE_TIMEOUT_MS;

    try {
      this.scene = new Scene();
      this.camera = new PerspectiveCamera(
        COVER_CAMERA_FOV,
        GAME_BOX_COVER_STAGE.width /
          GAME_BOX_COVER_STAGE.height,
        50,
        1800
      );
      this.camera.position.set(
        COVER_CAMERA_CENTER_X,
        COVER_CAMERA_CENTER_Y,
        COVER_CAMERA_DISTANCE
      );
      this.camera.lookAt(
        COVER_CAMERA_CENTER_X,
        COVER_CAMERA_CENTER_Y,
        0
      );

      this.doorGroup = new Group();
      this.scene.add(this.doorGroup);
      this.bodyMaterial =
        new MeshStandardMaterial({
          color: 0x4f2414,
          roughness: 0.72,
          metalness: 0,
          depthTest: true,
          depthWrite: true
        });
      this.materials.push(this.bodyMaterial);

      this.hemisphereLight =
        new HemisphereLight(
          0xffeed2,
          0x1d0d09,
          0.78
        );
      this.keyLight =
        new DirectionalLight(
          0xffdfac,
          1.15
        );
      this.keyLight.position.set(
        COVER_CAMERA_CENTER_X,
        GAME_BOX_COVER_STAGE.height + 160,
        COVER_CAMERA_DISTANCE
      );
      this.keyLight.target.position.set(
        COVER_CAMERA_CENTER_X,
        COVER_CAMERA_CENTER_Y,
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
      this.renderer.setClearColor(
        0x000000,
        0
      );
      this.renderer.outputColorSpace =
        SRGBColorSpace;
      this.renderer.shadowMap.enabled = false;

      this.canvas = this.renderer.domElement;
      this.canvas.className =
        'modern-graphics-canvas modern-game-cover-canvas';
      this.canvas.setAttribute(
        'aria-hidden',
        'true'
      );
      this.canvas.setAttribute(
        'tabindex',
        '-1'
      );
      this.canvas.dataset.threePackageVersion =
        __PURETT_THREE_PACKAGE_VERSION__;
      this.canvas.dataset.threeRevision =
        REVISION;
      this.canvas.dataset.modernSurface =
        'game-box-cover';
      this.canvas.dataset.modernCacheIdentity =
        GAME_BOX_COVER_CACHE_IDENTITY;

      this.handleContextLost = (event) => {
        event.preventDefault();
        this.contextLost = true;
        this.status = 'context-lost';
        this.ready = false;
        this.lastFailureReason =
          'context-lost';
        this.cancelMotion(
          'context-lost',
          false
        );
        if (
          typeof this.options
            .onContextLost === 'function'
        ) {
          this.options.onContextLost(
            new Error(
              'The Modern game-box cover WebGL context was lost.'
            )
          );
        }
      };
      this.handleVisibilityChange = () => {
        this.visibilitySuspended =
          document.hidden === true;
        if (this.visibilitySuspended) {
          this.cancelScheduledFrame();
        } else {
          try {
            this.synchronizePresentation();
          } catch (error) {
            this.reportError(error);
          }
        }
      };

      this.canvas.addEventListener(
        'webglcontextlost',
        this.handleContextLost,
        false
      );
      document.addEventListener(
        'visibilitychange',
        this.handleVisibilityChange,
        false
      );
      this.host.appendChild(this.canvas);
      this.setContentScale(
        this.options.contentScale || 1
      );
      this.loadDoors();
    } catch (error) {
      try {
        this.dispose();
      } catch (cleanupError) {
        // Preserve the original initialization error.
      }
      throw error;
    }
  }

  normalizePresentation(presentation) {
    const source = presentation || {};
    const frame = source.frame || {};
    const panels = Array.isArray(
      source.panels
    )
      ? source.panels
      : [];
    const sequence = Number(
      source.sequence
    );
    const target = String(
      source.target || ''
    );
    const startedAtMs =
      source.startedAtMs === null
        ? null
        : Number(source.startedAtMs);
    const durationMs = Number(
      source.durationMs
    );
    const easing =
      source.easing === null
        ? null
        : String(source.easing || '');
    const initialSnapshot =
      sequence === 0 &&
      target === 'closed' &&
      startedAtMs === null &&
      durationMs === 0 &&
      easing === null;
    const timedTransition =
      sequence > 0 &&
      Number.isFinite(startedAtMs) &&
      startedAtMs >= 0 &&
      durationMs ===
        GAME_BOX_COVER_MOTION_DEFAULTS
          .durationMs &&
      easing === (
        target === 'open'
          ? 'cubic-in'
          : 'cubic-out'
      );

    if (
      !hasExactKeys(
        source,
        [
          'schemaVersion',
          'sequence',
          'target',
          'startedAtMs',
          'durationMs',
          'easing',
          'frame',
          'panels'
        ]
      ) ||
      !hasExactKeys(
        frame,
        [
          'x',
          'y',
          'width',
          'height'
        ]
      ) ||
      Number(source.schemaVersion) !==
        GAME_BOX_COVER_MOTION_SCHEMA_VERSION ||
      !Number.isInteger(sequence) ||
      sequence < 0 ||
      (
        target !== 'open' &&
        target !== 'closed'
      ) ||
      (
        !initialSnapshot &&
        !timedTransition
      ) ||
      Number(frame.x) !== 0 ||
      Number(frame.y) !== 0 ||
      Number(frame.width) !==
        GAME_BOX_COVER_STAGE.width ||
      Number(frame.height) !==
        GAME_BOX_COVER_STAGE.height ||
      panels.length !== 2
    ) {
      throw new Error(
        'The game-box cover presentation descriptor is invalid.'
      );
    }

    return {
      schemaVersion:
        GAME_BOX_COVER_MOTION_SCHEMA_VERSION,
      sequence,
      target,
      startedAtMs,
      durationMs,
      easing,
      frame: {
        x: 0,
        y: 0,
        width:
          GAME_BOX_COVER_STAGE.width,
        height:
          GAME_BOX_COVER_STAGE.height
      },
      panels: [
        normalizePanel(
          panels[0],
          'left'
        ),
        normalizePanel(
          panels[1],
          'right'
        )
      ]
    };
  }

  setPresentation(presentation) {
    if (this.disposed) {
      return;
    }

    let normalized;
    try {
      normalized =
        this.normalizePresentation(
          presentation
        );
    } catch (error) {
      this.reportError(error);
      return;
    }

    if (
      this.presentation &&
      normalized.sequence <
        this.presentation.sequence
    ) {
      this.ignoredPresentations += 1;
      this.ignoredStalePresentations += 1;
      return;
    }
    if (
      this.presentation &&
      normalized.sequence ===
        this.presentation.sequence
    ) {
      this.ignoredPresentations += 1;
      return;
    }

    if (this.motion) {
      this.advanceMotion(
        normalized.startedAtMs === null
          ? nowMs()
          : normalized.startedAtMs,
        false
      );
    }
    this.presentation = normalized;
    try {
      this.beginPresentation(
        normalized
      );
    } catch (error) {
      this.reportError(error);
    }
  }

  loadTexture(textureUrl) {
    if (
      textureUrl !==
        GAME_BOX_COVER_DOORS.left
          .textureUrl &&
      textureUrl !==
        GAME_BOX_COVER_DOORS.right
          .textureUrl
    ) {
      return Promise.reject(
        new Error(
          'The game-box cover texture is not approved.'
        )
      );
    }

    return new Promise(
      (resolve, reject) => {
        const token = {
          settled: false,
          failed: false,
          timer: null,
          cancel: null,
          texture: null,
          textureDisposed: false
        };
        const disposeTokenTexture = (
          texture
        ) => {
          const ownedTexture =
            texture || token.texture;
          if (
            ownedTexture &&
            !token.textureDisposed
          ) {
            ownedTexture.dispose();
            token.textureDisposed = true;
          }
        };
        const finish = (
          error,
          texture
        ) => {
          if (token.settled) {
            if (
              token.failed ||
              this.disposed
            ) {
              disposeTokenTexture(
                texture
              );
            }
            return;
          }
          if (texture) {
            token.texture = texture;
          }
          token.settled = true;
          token.failed =
            Boolean(error);
          if (token.timer !== null) {
            window.clearTimeout(
              token.timer
            );
          }
          this.pendingTextureLoads.delete(
            token
          );
          if (error) {
            disposeTokenTexture();
            reject(error);
          } else {
            token.texture = null;
            resolve(texture);
          }
        };
        token.cancel = () => {
          finish(
            new Error(
              'The game-box cover texture load was cancelled.'
            ),
            null
          );
        };
        token.timer = window.setTimeout(
          () => {
            finish(
              new Error(
                'The game-box cover texture load timed out.'
              ),
              null
            );
          },
          this.textureLoadTimeoutMs
        );
        this.pendingTextureLoads.add(
          token
        );
        try {
          const returnedTexture =
            this.textureLoader.load(
              textureUrl,
              (texture) => {
                if (
                  token.settled ||
                  this.disposed
                ) {
                  disposeTokenTexture(
                    texture
                  );
                  return;
                }
                texture.colorSpace =
                  SRGBColorSpace;
                texture.minFilter =
                  LinearMipmapLinearFilter;
                texture.magFilter =
                  LinearFilter;
                texture.generateMipmaps =
                  true;
                texture.anisotropy =
                  Math.min(
                    4,
                    this.renderer
                      .capabilities
                      .getMaxAnisotropy()
                  );
                texture.needsUpdate = true;
                finish(null, texture);
              },
              undefined,
              () => {
                finish(
                  new Error(
                    `The game-box cover texture ${textureUrl} could not be loaded.`
                  ),
                  null
                );
              }
            );
          if (!token.settled) {
            token.texture =
              returnedTexture;
          } else if (token.failed) {
            disposeTokenTexture(
              returnedTexture
            );
          }
        } catch (error) {
          finish(error, null);
        }
      }
    );
  }

  cancelPendingTextureLoads() {
    Array.from(
      this.pendingTextureLoads
    ).forEach((token) => {
      token.cancel();
    });
    this.pendingTextureLoads.clear();
  }

  loadDoors() {
    const generation = ++this.generation;
    const urls = [
      GAME_BOX_COVER_DOORS.left
        .textureUrl,
      GAME_BOX_COVER_DOORS.right
        .textureUrl
    ];

    return Promise.all(
      urls.map((url) => (
        this.loadTexture(url).then(
          (texture) => ({
            status: 'fulfilled',
            url,
            texture
          }),
          (error) => ({
            status: 'rejected',
            url,
            error
          })
        )
      ))
    ).then((outcomes) => {
      const loaded = outcomes.filter(
        (entry) => (
          entry.status ===
            'fulfilled'
        )
      );
      const failure = outcomes.find(
        (entry) => (
          entry.status ===
            'rejected'
        )
      );

      if (failure) {
        loaded.forEach((entry) => {
          entry.texture.dispose();
        });
        if (
          !this.disposed &&
          generation === this.generation
        ) {
          this.reportError(
            failure.error
          );
        }
        return;
      }
      if (
        this.disposed ||
        generation !== this.generation
      ) {
        loaded.forEach((entry) => {
          entry.texture.dispose();
        });
        return;
      }
      loaded.forEach((entry) => {
        this.textures.set(
          entry.url,
          entry.texture
        );
      });
      this.buildDoors();
      this.ready = true;
      this.status = 'ready';
      this.lastFailureReason = null;
      this.synchronizePresentation();
      this.render();
      this.reportReady();
    }).catch((error) => {
      if (
        !this.disposed &&
        generation === this.generation
      ) {
        this.reportError(error);
      }
    });
  }

  buildDoors() {
    ['left', 'right'].forEach(
      (side) => {
        const definition =
          GAME_BOX_COVER_DOORS[side];
        const pivot = new Group();
        const panel = new Group();
        const bodyGeometry =
          new BoxGeometry(
            definition.width,
            GAME_BOX_COVER_STAGE.height,
            COVER_PANEL_THICKNESS
          );
        const faceGeometry =
          new PlaneGeometry(
            definition.width,
            GAME_BOX_COVER_STAGE.height
          );
        const faceMaterial =
          new MeshBasicMaterial({
            map: this.textures.get(
              definition.textureUrl
            ),
            color: 0xffffff,
            depthTest: true,
            depthWrite: true,
            toneMapped: false
          });
        const body = new Mesh(
          bodyGeometry,
          this.bodyMaterial
        );
        const face = new Mesh(
          faceGeometry,
          faceMaterial
        );

        pivot.position.set(
          definition.hingeX,
          COVER_CAMERA_CENTER_Y,
          0
        );
        panel.position.x =
          side === 'left'
            ? definition.width / 2
            : -definition.width / 2;
        body.position.z =
          -COVER_PANEL_THICKNESS / 2;
        face.position.z =
          COVER_FACE_OFFSET +
          (side === 'right'
            ? 0.02
            : 0);
        face.renderOrder =
          side === 'right' ? 2 : 1;

        panel.add(body);
        panel.add(face);
        pivot.add(panel);
        this.doorGroup.add(pivot);
        this.materials.push(
          faceMaterial
        );
        this.doorEntries[side] = {
          pivot,
          panel,
          body,
          face,
          bodyGeometry,
          faceGeometry
        };
      }
    );
  }

  synchronizePresentation() {
    if (
      this.disposed ||
      !this.ready ||
      !this.presentation
    ) {
      return;
    }

    if (
      this.motion &&
      this.motion.sequence ===
        this.presentation.sequence
    ) {
      this.advanceMotion(
        nowMs(),
        true
      );
      return;
    }
    if (
      !this.motion &&
      this.appliedSequence ===
        this.presentation.sequence
    ) {
      this.render();
      return;
    }
    this.beginPresentation(
      this.presentation
    );
  }

  beginPresentation(presentation) {
    const targetOpenness =
      presentation.target === 'open'
        ? 1
        : 0;
    const isFirstPresentation =
      this.appliedSequence < 0;
    let fromOpenness;

    this.cancelMotion(
      'superseded',
      true
    );
    if (
      presentation.startedAtMs ===
        null
    ) {
      fromOpenness = targetOpenness;
    } else if (
      this.currentPose &&
      !isFirstPresentation
    ) {
      fromOpenness =
        this.currentPose.openness;
    } else {
      fromOpenness =
        targetOpenness === 1
          ? 0
          : 1;
    }

    const plan =
      createGameBoxCoverMotionPlan({
        fromOpenness,
        toOpenness: targetOpenness
      });
    this.appliedSequence =
      presentation.sequence;

    if (
      presentation.startedAtMs ===
        null ||
      plan.durationMs === 0
    ) {
      this.applyPose(
        sampleGameBoxCoverMotion(
          plan,
          plan.durationMs
        )
      );
      this.lastTransition = {
        outcome: 'snapped',
        sequence:
          presentation.sequence,
        target: presentation.target
      };
      return;
    }

    if (this.prefersReducedMotion()) {
      this.applyPose(
        sampleGameBoxCoverMotion(
          plan,
          plan.durationMs
        )
      );
      this.acceptedTransitions += 1;
      this.completedTransitions += 1;
      this.reducedMotionTransitions += 1;
      this.lastTransition = {
        outcome: 'completed',
        completion: 'reduced-motion',
        sequence:
          presentation.sequence,
        target: presentation.target
      };
      return;
    }

    this.acceptedTransitions += 1;
    const generation =
      ++this.motionGeneration;
    this.motion = {
      generation,
      sequence:
        presentation.sequence,
      target:
        presentation.target,
      startedAtMs:
        presentation.startedAtMs,
      plan
    };
    this.lastTransition = {
      outcome: 'active',
      sequence:
        presentation.sequence,
      target: presentation.target
    };
    this.advanceMotion(
      nowMs(),
      true
    );
  }

  prefersReducedMotion() {
    return Boolean(
      window.matchMedia &&
      window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches
    );
  }

  applyPose(pose) {
    if (!pose) {
      return;
    }
    this.currentPose = pose;
    if (
      !this.doorEntries.left ||
      !this.doorEntries.right
    ) {
      return;
    }
    this.doorEntries.left
      .pivot.rotation.y =
        pose.left.rotationY;
    this.doorEntries.right
      .pivot.rotation.y =
        pose.right.rotationY;
    this.render();
  }

  advanceMotion(timestamp, scheduleNext) {
    const motion = this.motion;
    if (
      !motion ||
      motion.generation !==
        this.motionGeneration
    ) {
      return;
    }
    const elapsed = Math.max(
      0,
      Number(timestamp) -
        motion.startedAtMs
    );
    const pose =
      sampleGameBoxCoverMotion(
        motion.plan,
        elapsed
      );
    this.applyPose(pose);

    if (pose.complete) {
      this.motion = null;
      this.completedTransitions += 1;
      this.lastTransition = {
        outcome: 'completed',
        completion: 'animation',
        sequence: motion.sequence,
        target: motion.target
      };
      this.cancelScheduledFrame();
      return;
    }

    if (
      scheduleNext &&
      this.ready &&
      !this.suspended &&
      !this.visibilitySuspended &&
      !this.contextLost
    ) {
      this.scheduleFrame(
        motion.generation
      );
    }
  }

  scheduleFrame(generation) {
    if (
      this.animationFrameId !== null ||
      this.disposed ||
      !this.ready ||
      this.suspended ||
      this.visibilitySuspended ||
      this.contextLost ||
      !this.motion
    ) {
      return;
    }

    let frameId = null;
    frameId =
      window.requestAnimationFrame(
        (timestamp) => {
          if (
            this.animationFrameId !==
              frameId
          ) {
            return;
          }
          this.animationFrameId = null;
          this.pendingFrameCount = 0;
          if (
            this.disposed ||
            generation !==
              this.motionGeneration ||
            !this.motion ||
            this.motion.generation !==
              generation
          ) {
            return;
          }
          this.frameCount += 1;
          try {
            this.advanceMotion(
              timestamp,
              true
            );
          } catch (error) {
            this.reportError(error);
          }
        }
      );
    this.animationFrameId = frameId;
    this.pendingFrameCount = 1;
    this.peakPendingFrameCount =
      Math.max(
        this.peakPendingFrameCount,
        this.pendingFrameCount
      );
  }

  cancelScheduledFrame() {
    if (
      this.animationFrameId !== null
    ) {
      window.cancelAnimationFrame(
        this.animationFrameId
      );
      this.animationFrameId = null;
    }
    this.pendingFrameCount = 0;
  }

  cancelMotion(reason, record) {
    const motion = this.motion;
    this.cancelScheduledFrame();
    if (!motion) {
      return;
    }
    this.motion = null;
    this.motionGeneration += 1;
    if (record !== false) {
      this.cancelledTransitions += 1;
      this.lastTransition = {
        outcome: 'cancelled',
        reason,
        sequence: motion.sequence,
        target: motion.target
      };
    }
  }

  suspend() {
    if (this.disposed) {
      return;
    }
    if (this.motion) {
      this.advanceMotion(
        nowMs(),
        false
      );
    }
    this.suspended = true;
    this.cancelScheduledFrame();
  }

  resume() {
    if (this.disposed) {
      return;
    }
    this.suspended = false;
    this.synchronizePresentation();
  }

  setContentScale(contentScale) {
    if (
      this.disposed ||
      !this.renderer
    ) {
      return;
    }
    const scale =
      Number.isFinite(
        Number(contentScale)
      )
        ? Number(contentScale)
        : 1;
    const devicePixelRatio =
      window.devicePixelRatio || 1;
    this.renderer.setPixelRatio(
      Math.min(
        Math.max(
          devicePixelRatio * scale,
          1
        ),
        MAX_PIXEL_RATIO
      )
    );
    this.renderer.setSize(
      GAME_BOX_COVER_STAGE.width,
      GAME_BOX_COVER_STAGE.height,
      false
    );
    this.camera.aspect =
      GAME_BOX_COVER_STAGE.width /
      GAME_BOX_COVER_STAGE.height;
    this.camera.updateProjectionMatrix();
    this.render();
  }

  render() {
    if (
      !this.disposed &&
      !this.contextLost &&
      this.renderer
    ) {
      this.renderer.render(
        this.scene,
        this.camera
      );
    }
  }

  reportReady() {
    if (this.readyReported) {
      return;
    }
    this.readyReported = true;
    if (
      typeof this.options.onReady ===
        'function'
    ) {
      this.options.onReady(
        this.getDebugState()
      );
    }
  }

  reportError(error) {
    if (
      this.disposed ||
      this.status === 'error'
    ) {
      return;
    }
    this.status = 'error';
    this.ready = false;
    this.cancelMotion(
      'failure',
      true
    );
    this.cancelPendingTextureLoads();
    this.lastFailureReason =
      error instanceof Error
        ? error.message
        : 'modern-cover-error';
    if (
      typeof this.options.onError ===
        'function'
    ) {
      this.options.onError(
        error instanceof Error
          ? error
          : new Error(
              'The Modern game-box cover failed.'
            )
      );
    }
  }

  getDebugState() {
    return {
      surface: 'game-box-cover',
      schemaVersion:
        GAME_BOX_COVER_MOTION_SCHEMA_VERSION,
      cacheIdentity:
        GAME_BOX_COVER_CACHE_IDENTITY,
      continuationAuthority:
        'legacy-raphael',
      legacyContinuationAuthority:
        true,
      applicationContinuationAuthority:
        false,
      ready:
        this.ready &&
        !this.disposed &&
        !this.contextLost,
      status: this.status,
      packageVersion:
        __PURETT_THREE_PACKAGE_VERSION__,
      revision: REVISION,
      stage: {
        width:
          GAME_BOX_COVER_STAGE.width,
        height:
          GAME_BOX_COVER_STAGE.height
      },
      camera: {
        type: 'perspective',
        fov: COVER_CAMERA_FOV,
        centerX:
          COVER_CAMERA_CENTER_X,
        centerY:
          COVER_CAMERA_CENTER_Y,
        distance:
          COVER_CAMERA_DISTANCE
      },
      geometry: {
        topology:
          'two-outer-edge-hinged-doors',
        thickness:
          COVER_PANEL_THICKNESS,
        openAngleDegrees:
          GAME_BOX_COVER_MOTION_DEFAULTS
            .openAngleDegrees,
        onePixelCenterOverlap: true
      },
      materials: {
        fronts:
          'unlit-srgb-original-art',
        edgeAndBack:
          'restrained-lit-wood',
        hardwareShadows: false
      },
      presentation:
        clonePlain(this.presentation),
      currentPose:
        clonePlain(this.currentPose),
      progress: this.currentPose
        ? {
            elapsedMs:
              this.currentPose.elapsedMs,
            durationMs:
              this.currentPose.durationMs,
            raw:
              this.currentPose.progress,
            eased:
              this.currentPose.easedProgress,
            openness:
              this.currentPose.openness
          }
        : null,
      motion: this.motion
        ? {
            sequence:
              this.motion.sequence,
            target:
              this.motion.target,
            startedAtMs:
              this.motion.startedAtMs,
            durationMs:
              this.motion.plan.durationMs,
            direction:
              this.motion.plan.direction,
            easing:
              this.motion.plan.easing,
            fromOpenness:
              this.motion.plan.fromOpenness,
            toOpenness:
              this.motion.plan.toOpenness,
            generation:
              this.motion.generation
          }
        : null,
      suspended: this.suspended,
      visibilitySuspended:
        this.visibilitySuspended,
      contextLost: this.contextLost,
      frameCount: this.frameCount,
      rafActive:
        this.animationFrameId !== null,
      pendingFrameCount:
        this.pendingFrameCount,
      peakPendingFrameCount:
        this.peakPendingFrameCount,
      pendingTextureLoadCount:
        this.pendingTextureLoads.size,
      resources: {
        textureCount:
          this.textures.size,
        materialCount:
          this.materials.length,
        doorCount:
          Object.keys(
            this.doorEntries
          ).length,
        pendingTextureLoadCount:
          this.pendingTextureLoads.size,
        disposed: this.disposed
      },
      failureReason:
        this.lastFailureReason,
      acceptedTransitions:
        this.acceptedTransitions,
      completedTransitions:
        this.completedTransitions,
      cancelledTransitions:
        this.cancelledTransitions,
      ignoredPresentations:
        this.ignoredPresentations,
      ignoredStalePresentations:
        this.ignoredStalePresentations,
      reducedMotionTransitions:
        this.reducedMotionTransitions,
      reducedMotionPreferred:
        this.prefersReducedMotion(),
      motionPolicy: {
        durationMs:
          GAME_BOX_COVER_MOTION_DEFAULTS
            .durationMs,
        openingEasing: 'cubic-in',
        closingEasing: 'cubic-out',
        reducedMotion:
          'snap-modern-visual-only'
      },
      lastTransition:
        clonePlain(this.lastTransition),
      gameplayAuthority: false,
      semanticActionCount: 0,
      requestCount: 0
    };
  }

  dispose() {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.status = 'disposed';
    this.generation += 1;
    this.cancelMotion(
      'dispose',
      false
    );
    this.cancelPendingTextureLoads();

    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange,
      false
    );
    if (this.canvas) {
      this.canvas.removeEventListener(
        'webglcontextlost',
        this.handleContextLost,
        false
      );
    }

    Object.keys(
      this.doorEntries
    ).forEach((side) => {
      const entry =
        this.doorEntries[side];
      entry.bodyGeometry.dispose();
      entry.faceGeometry.dispose();
      if (entry.pivot.parent) {
        entry.pivot.parent.remove(
          entry.pivot
        );
      }
    });
    this.doorEntries = {};
    this.materials.forEach(
      (material) => {
        material.dispose();
      }
    );
    this.materials = [];
    this.textures.forEach(
      (texture) => {
        texture.dispose();
      }
    );
    this.textures.clear();

    if (this.keyLight) {
      this.scene.remove(
        this.keyLight.target
      );
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }
    if (
      this.canvas &&
      this.canvas.parentNode
    ) {
      this.canvas.parentNode.removeChild(
        this.canvas
      );
    }
  }
}
