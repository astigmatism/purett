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

const STUDIO_LOGICAL_WIDTH = 755;
const STUDIO_LOGICAL_HEIGHT = 562;
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
const STUDIO_SHADOW_Z = -4;
const STUDIO_CAMERA_SAFETY_MARGIN = 90;
const STUDIO_CAMERA_VALIDATION_SAMPLES = 240;
const MAX_PIXEL_RATIO = 3;
const DEFAULT_CARD_BACK_URL = '/images/cards/cardBack.png';

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
    this.cardDescriptor = null;
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
    this.preset = validateMotionStudioPreset(
      CARD_MOTION_PRESETS.casualToss
    );
    this.motionContext = normalizeStudioContext(null);
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
      this.shadowGeometry = new PlaneGeometry(132, 164);
      this.shadowTexture = this.createShadowTexture();

      this.hemisphereLight = new HemisphereLight(
        0xfff4df,
        0x251821,
        0.72
      );
      this.keyLight = new DirectionalLight(0xffe8bd, 1.3);
      this.keyLight.position.set(160, 510, 650);
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
      this.status = 'waiting-for-card';
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
    this.pause();
    this.clearCard();
    this.cardDescriptor = normalized;
    this.status = 'loading';
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

  createPlan(preset) {
    return createStudioPlan(preset, this.motionContext);
  }

  getDuration() {
    if (!this.plan) {
      return 0;
    }
    return this.motionContext.direction === 'exit'
      ? this.motionContext.delayMs + this.plan.timing.motionMs
      : this.plan.timing.totalMs;
  }

  samplePose(elapsedMs) {
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
    this.motionContext = normalizeStudioContext(context);
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
    this.preset = validateMotionStudioPreset(preset);
    this.plan = this.createPlan(this.preset);
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

  applyPose(pose) {
    this.pose = pose;
    if (!this.cardRoot || !this.orientationRoot || !this.scaleRoot) {
      this.render();
      this.notifyState();
      return;
    }

    const authoredScale = Math.max(0.01, pose.authoredScale);
    const depth = cardDepthMetrics(
      STUDIO_CARD_WIDTH,
      STUDIO_CARD_HEIGHT,
      STUDIO_FACE_OFFSET,
      pose.rotationX,
      pose.rotationY,
      pose.rotationZ,
      authoredScale
    );
    const rootZ = Math.max(0, pose.height) - depth.minimum;
    const visibleCenterDepth = rootZ + depth.visibleCenter;
    const cameraDistanceToCenter = Math.max(
      STUDIO_CAMERA_SAFETY_MARGIN,
      STUDIO_CAMERA_DISTANCE - visibleCenterDepth
    );
    const compensation =
      cameraDistanceToCenter /
      STUDIO_CAMERA_DISTANCE;
    const screenX = pose.screenX;
    const screenWorldY = STUDIO_LOGICAL_HEIGHT - pose.screenY;
    const worldX =
      STUDIO_CAMERA_CENTER_X +
      ((screenX - STUDIO_CAMERA_CENTER_X) * compensation);
    const worldY =
      STUDIO_CAMERA_CENTER_Y +
      ((screenWorldY - STUDIO_CAMERA_CENTER_Y) * compensation);

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
      screenWorldY
    );
    this.visibleFace = visibleFaceForDepth(depth.normalDepth);
    this.perspectiveScale =
      STUDIO_CAMERA_DISTANCE /
      cameraDistanceToCenter;
    this.renderedScale = authoredScale * this.perspectiveScale;
    this.updateShadow(pose, authoredScale);
    this.render();
    this.notifyState();
  }

  applyFlatTableProjection(pose, depth, screenWorldY) {
    if (!this.projectionRoot) {
      return;
    }
    const horizontalOffset =
      (pose.screenX - STUDIO_CAMERA_CENTER_X) /
      STUDIO_CAMERA_DISTANCE;
    const verticalOffset =
      (screenWorldY - STUDIO_CAMERA_CENTER_Y) /
      STUDIO_CAMERA_DISTANCE;
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
    this.shadowMesh.position.set(
      pose.screenX + (pose.height * 0.075),
      STUDIO_LOGICAL_HEIGHT -
        (pose.screenY + (pose.height * 0.045)),
      STUDIO_SHADOW_Z
    );
    this.shadowMesh.rotation.z = pose.rotationZ * 0.45;
    this.shadowMesh.scale.set(spread, spread * 0.92, 1);
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
    this.render();
    this.notifyState();
  }

  render() {
    if (!this.disposed && !this.contextLost && this.renderer) {
      this.renderer.render(this.scene, this.camera);
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
      preset: this.debugPreset,
      plan: this.debugPlan,
      pose: clonePlain(this.pose),
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
    if (this.shadowGeometry) {
      this.shadowGeometry.dispose();
    }
    if (this.shadowTexture) {
      this.shadowTexture.dispose();
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
  faceOffset: STUDIO_FACE_OFFSET
});
