'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
let assertions = 0;

function assert(condition, message) {
  assertions += 1;
  if (!condition) throw new Error(message);
}

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

try {
  const packageJson = JSON.parse(read('frontend/package.json'));
  const packageLock = JSON.parse(read('frontend/package-lock.json'));
  const coordinator = read('public/js/plugins/gh.graphics.js');
  const motionStudioController = read(
    'public/js/plugins/gh.motionstudio.js'
  );
  const application = read('public/js/default/index.js');
  const lobbyMenu = read('public/js/plugins/gh.menu.js');
  const modernSource = read('frontend/src/modern-graphics.js');
  const arrivalSource = read('frontend/src/card-arrival-animations.js');
  const cardMotionSource = read('frontend/src/card-motion.js');
  const lobbyPlaybookSource = read(
    'frontend/src/lobby-motion-playbook.js'
  );
  const motionStudioSurfaceSource = read(
    'frontend/src/motion-studio-surface.js'
  );
  const modernBundle = read('public/js/modern/purett-modern-graphics.min.js');
  const layout = read('application/views/layouts/standalone.phtml');
  const game = read('public/js/plugins/gh.game.js');
  const boardCss = read('public/css/default/index.css');
  const contextMenu = read('application/views/partials/overlays.phtml');
  const bootController = read('library/Standalone/Controller/Action.php');

  assert(packageJson.dependencies.three === '0.185.1', 'Three.js is not pinned to 0.185.1');
  assert(packageJson.devDependencies.esbuild === '0.28.1', 'esbuild is not pinned to 0.28.1');
  assert(packageLock.packages['node_modules/three'].version === '0.185.1', 'lockfile resolves a different Three.js version');
  assert(packageLock.packages['node_modules/esbuild'].version === '0.28.1', 'lockfile resolves a different esbuild version');

  assert(modernBundle.length > 100000, 'generated modern graphics bundle is missing or implausibly small');
  assert(modernBundle.startsWith('/*! Purett modern graphics | Three.js 0.185.1 | MIT License */'), 'bundle license/version banner is missing');
  assert(modernBundle.includes('modernGraphics'), 'bundle does not register the modern graphics facade');
  assert(
    modernBundle.includes('createMotionStudioSurface') &&
      modernBundle.includes('purett-card-motion-plan'),
    'generated modern graphics bundle omits the Motion Studio surface or card-motion recipe API'
  );
  assert(!/window\.THREE\s*=/.test(modernSource + modernBundle), 'modern bundle overwrites the legacy snow THREE global');
  assert(fs.existsSync(path.join(root, 'public/js/modern/THREE-LICENSE.txt')), 'distributed Three.js license is missing');

  assert(coordinator.includes('/js/modern/purett-modern-graphics.min.js?v=0.185.1-lobby-playbook.2'), 'coordinator does not use the lobby-playbook bundle cache revision');
  assert(!/https?:\/\//.test(coordinator), 'coordinator references a third-party graphics URL');
  assert(coordinator.includes("this.storageKey = 'purett.graphicsMode.v1'"), 'graphics preference does not have a stable storage key');
  assert(coordinator.includes("this.requestedMode = 'legacy'"), 'Legacy is not the safe default');
  assert(coordinator.includes("this.effectiveMode = 'legacy'"), 'Legacy is not the initial effective renderer');
  assert(coordinator.includes('configuration-disabled'), 'graphics coordinator has no classified release kill-switch fallback');
  assert(bootController.includes('PURETT_MODERN_GRAPHICS_ENABLED'), 'server boot data does not expose the release kill switch');

  assert(layout.includes('/js/plugins/gh.graphics.js'), 'standalone layout does not load the graphics coordinator');
  assert(layout.indexOf('/js/plugins/gh.graphics.js') < layout.indexOf('/js/plugins/gh.game.js'), 'graphics coordinator loads after the game plugin');
  assert(!layout.includes('/js/modern/purett-modern-graphics.min.js'), 'modern bundle is eagerly loaded in Legacy mode');
  assert(game.includes('id="modernGraphics"'), 'game surface does not include a Modern host');
  assert(game.includes('setGraphicsMode: function(mode)'), 'game surface has no runtime graphics gate');
  assert(boardCss.includes('#board.graphics-modern #svgBoard *'), 'Modern mode does not block descendant Raphael hit targets');
  assert(boardCss.includes('pointer-events: none !important'), 'Raphael pointer blocking is not authoritative');
  assert(contextMenu.includes('data-graphics-mode="legacy"') && contextMenu.includes('data-graphics-mode="modern"'), 'graphics menu choices are incomplete');
  assert(
    contextMenu.includes('class="motion-studio enabled"') &&
      contextMenu.includes('Motion Studio&hellip;'),
    'the main menu does not expose the Motion Studio'
  );
  assert(
      contextMenu.includes('id="motionstudio"') &&
      contextMenu.includes('role="dialog"') &&
      contextMenu.includes('aria-labelledby="motionstudio-title"') &&
      contextMenu.includes('tabindex="-1"') &&
      contextMenu.includes('id="motionstudio-canvas-host"') &&
      contextMenu.includes('id="motionstudio-controls"') &&
      contextMenu.includes('id="motionstudio-timeline"') &&
      contextMenu.includes('id="motionstudio-json"') &&
      contextMenu.includes('class="motion-studio-scale-stage"') &&
      contextMenu.includes('class="motion-studio-shell"') &&
      contextMenu.includes('id="motionstudio-copy-target"') &&
      contextMenu.includes('class="motion-studio-copy-intro"'),
    'the Motion Studio overlay is missing its dialog, preview, controls, timeline, or recipe editor'
  );
  assert(
    layout.includes('/js/plugins/gh.motionstudio.js') &&
      layout.indexOf('/js/plugins/gh.graphics.js') <
        layout.indexOf('/js/plugins/gh.motionstudio.js'),
    'the standalone layout does not load the Motion Studio controller after the graphics coordinator'
  );
  assert(
    application.includes('me.motionstudio = new gh.motionstudio({') &&
      application.includes('graphics: me.graphics') &&
      application.includes(
        'me.motionstudio.setContentScale(scale)'
      ),
    'the application does not initialize the Motion Studio controller with the graphics coordinator'
  );
  assert(
    motionStudioController.includes('gh.motionstudio = function(options)') &&
      motionStudioController.includes("this.storageKey = 'purett.motionStudio.v2'") &&
      motionStudioController.includes('this.graphics.openMotionStudio(') &&
      motionStudioController.includes('this.graphics.closeMotionStudio()') &&
      motionStudioController.includes(
        "$('#motionstudio').appendTo(document.body)"
      ) &&
      motionStudioController.includes(
        'setContentScale: function(scale)'
      ) &&
      motionStudioController.includes(
        'syncContentScaleLayout: function()'
      ) &&
      motionStudioController.includes(
        'copyIntroSharedMotion: function()'
      ) &&
      motionStudioController.includes('this.api.playbook.serialize(') &&
      motionStudioController.includes('this.api.playbook.parse(') &&
      motionStudioController.includes('applyAndPreview: function()') &&
      motionStudioController.includes('this.graphics.previewLobbyPlaybook('),
    'the Motion Studio controller does not cover open, close, application targets, whole-playbook exchange, and production preview'
  );
  const draftUpdateSection = motionStudioController.slice(
    motionStudioController.indexOf(
      'applyPresetToSurface: function('
    ),
    motionStudioController.indexOf(
      'createPreviewBatch: function('
    )
  );
  assert(
    motionStudioController.includes('draftPlaybook: draftPlaybook') &&
      motionStudioController.includes(
        'this.api.playbook.parse(\n' +
        '                            session.draftPlaybook'
      ) &&
      motionStudioController.includes(
        'targetPresetNames: $.extend('
      ) &&
      !draftUpdateSection.includes('setLobbyPlaybook(') &&
      (
        motionStudioController.match(
          /this\.graphics\.setLobbyPlaybook\(/g
        ) || []
      ).length === 2,
    'Studio drafts are not isolated in session state until explicit Import or Apply & Preview'
  );
  assert(
    motionStudioController.includes(
      'text = this.api.playbook.serialize(this.playbook)'
    ) &&
      motionStudioController.includes(
        'me.pendingPreviewToken !== previewToken'
      ) &&
      motionStudioController.includes(
        'me.graphics.canRestoreMotionStudioPreview()'
      ),
    'whole-playbook export or stale-preview ownership guards are incomplete'
  );
  assert(
    coordinator.includes('openMotionStudio: function(host, options, callback)') &&
      coordinator.includes('closeMotionStudio: function()') &&
      coordinator.includes('disposeMotionStudioSurface: function()') &&
      coordinator.includes('contentScale: me.getContentScale()') &&
      coordinator.includes('this.studioGeneration += 1') &&
      coordinator.includes('motionStudioOpen: this.studioOpen') &&
      coordinator.includes('motionStudio: this.studioSurface'),
    'the graphics coordinator does not own the application-scaled Motion Studio surface lifecycle'
  );
  assert(
    coordinator.includes('cancelLobbyPreview: function(outcome)') &&
      coordinator.includes(
        'canRestoreMotionStudioPreview: function()'
      ) &&
      coordinator.includes(
        "this.cancelLobbyPreview('cancelled-lobby-command')"
      ) &&
      coordinator.includes(
        "this.cancelLobbyPreview('cancelled-view-change')"
      ) &&
      coordinator.includes('this.previewAllowStudioRestore = false') &&
      coordinator.includes('this.activePreviewFinish = finish'),
    'production preview cannot yield safely to a newer command, view, or Graphics choice'
  );
  assert(
    cardMotionSource.includes('export const CARD_MOTION_SCHEMA_VERSION = 1') &&
      cardMotionSource.includes('export const CARD_MOTION_PRESETS') &&
      cardMotionSource.includes('export function createCardMotionPlan') &&
      cardMotionSource.includes('export function sampleCardMotion') &&
      cardMotionSource.includes('export function serializeCardMotionPreset') &&
      cardMotionSource.includes('export function parseCardMotionPreset') &&
      !/\b(?:window|document|HTMLElement|WebGLRenderer|from ['"]three['"])\b/.test(
        cardMotionSource
      ),
    'the reusable card-motion facade is not a DOM-free, versioned recipe API'
  );
  assert(
    motionStudioSurfaceSource.includes('export class MotionStudioSurface') &&
      motionStudioSurfaceSource.includes("surface: 'motion-studio'") &&
      motionStudioSurfaceSource.includes('getDebugState()') &&
      motionStudioSurfaceSource.includes('rafActive:') &&
      motionStudioSurfaceSource.includes('renderedScale:') &&
      motionStudioSurfaceSource.includes('dispose()'),
    'the Three.js Motion Studio surface lacks inspectable playback and disposal state'
  );
  assert(
    modernSource.includes('createMotionStudioSurface(host, options)') &&
      modernSource.includes('new MotionStudioSurface(host, options)') &&
      modernSource.includes('motionStudio: Object.freeze({') &&
      modernSource.includes('normalizePreset(') &&
      modernSource.includes('createPlan(') &&
      modernSource.includes('samplePlan(') &&
      modernSource.includes('serializePreset(') &&
      modernSource.includes('parsePreset('),
    'the Modern graphics facade does not expose the Motion Studio factory and reusable recipe API'
  );
  assert(
    lobbyPlaybookSource.includes(
      'export const LOBBY_MOTION_PLAYBOOK_SCHEMA_VERSION = 1'
    ) &&
      lobbyPlaybookSource.includes(
        'export const LOBBY_MOTION_TARGETS'
      ) &&
      lobbyPlaybookSource.includes(
        'export function createLobbyMotionBatch'
      ) &&
      lobbyPlaybookSource.includes(
        'export function copyLobbyIntroSharedMotion'
      ) &&
      lobbyPlaybookSource.includes(
        'export function sampleLobbyMotionPlan'
      ) &&
      !/\b(?:window|document|HTMLElement|WebGLRenderer|from ['"]three['"])\b/.test(
        lobbyPlaybookSource
      ),
    'the application-bound lobby playbook is not a DOM-free, versioned planning API'
  );
  assert(
    modernSource.includes('copyIntroSharedMotion(') &&
      modernSource.includes(
        'introSharedMotionFields: LOBBY_INTRO_SHARED_MOTION_FIELDS'
      ) &&
      motionStudioController.includes(
        'this.api.playbook.copyIntroSharedMotion('
      ) &&
      (
        motionStudioController.match(
          /this\.graphics\.setLobbyPlaybook\(/g
        ) || []
      ).length === 2,
    'shared intro copying is not exposed as a draft-only playbook operation'
  );
  assert(
    boardCss.includes('grid-template-columns: 755px 410px') &&
      boardCss.includes('width: 755px;\n    height: 562px;') &&
      boardCss.includes('.motion-studio-scale-stage') &&
      boardCss.includes('transform-origin: top left') &&
      boardCss.includes("url('/images/gameBoard.png')") &&
      !boardCss.includes('.motion-studio-preview.actual-size'),
    'Motion Studio does not preserve a full-size board stage outside its controls'
  );

  assert(application.includes('menu: me.menu'), 'application does not pass the lobby menu to the graphics coordinator');
  assert(coordinator.includes('this.menu = options.menu'), 'graphics coordinator does not retain the lobby menu bridge');
  assert(lobbyMenu.includes('id="modernLobbyHand"'), 'lobby menu does not create a dedicated Modern hand host');
  assert(modernSource.includes('createLobbyHandSurface(host, options)'), 'modern graphics facade has no dedicated lobby-hand factory');
  assert(coordinator.includes("ensureSurface('lobby-hand')"), 'coordinator does not select the dedicated lobby-hand surface');
  assert(
    lobbyMenu.includes('me.presentationSequence += 1') &&
      lobbyMenu.includes("trigger: 'command-bar-reveal'") &&
      lobbyMenu.includes("sequence: 'intro'") &&
      lobbyMenu.includes('startedAtMs: window.performance.now()') &&
      lobbyMenu.includes('me.graphics.showLobbyHand(cards, me.activePresentation)'),
    'the lobby reveal does not create and pass one explicit Modern presentation token'
  );
  assert(
    coordinator.includes('showLobbyHand: function(cards, presentation)') &&
      coordinator.includes('this.lobbyPresentation = presentation ? {') &&
      coordinator.includes('playbookRequest: playbookRequest') &&
      coordinator.includes('String(playbookRequest.id)'),
    'the graphics coordinator does not preserve the lobby playbook request'
  );

  assert(lobbyMenu.includes('legacy-menu-hand-card'), 'lobby Raphael hand cards do not receive a hand-only gate class');
  assert(boardCss.includes('#menu.graphics-modern-hand .legacy-menu-hand-card'), 'Modern lobby mode does not gate only the legacy hand-card elements');
  assert(!boardCss.includes('#menu.graphics-modern-hand svg'), 'Modern lobby mode broadly hides the Raphael menu paper');
  assert(lobbyMenu.includes("$('#menu').toggleClass('graphics-modern-hand', useModernHand)"), 'legacy lobby cards are not gated on confirmed Modern-hand readiness');

  assert(modernSource.includes('const LOBBY_LOGICAL_WIDTH = 755'), 'Modern lobby surface does not preserve the 755px logical width');
  assert(modernSource.includes('const LOBBY_LOGICAL_HEIGHT = 562'), 'Modern lobby surface does not preserve the 562px logical height');
  assert(modernSource.includes('(cards || []).slice(0, 5)'), 'Modern lobby surface is not bounded to the five-card preview');
  assert(lobbyMenu.includes('pos:        [72, 197, 322, 447, 572]'), 'lobby preview no longer carries the five legacy hand positions');
  assert(
    /class LobbyHandSurface[\s\S]*?this\.camera = new PerspectiveCamera\(\s*LOBBY_CAMERA_FOV,\s*LOBBY_LOGICAL_WIDTH \/ LOBBY_LOGICAL_HEIGHT,\s*450,\s*900\s*\)/.test(modernSource),
    'Modern lobby surface does not use its calibrated perspective camera and depth-stable clip range'
  );
  assert(modernSource.includes("projection: 'perspective'") && modernSource.includes('settledPlaneScale: 1'), 'Modern lobby diagnostics do not identify the perspective projection and settled-plane mapping');
  assert(
    modernSource.includes('new BoxGeometry(') &&
      modernSource.includes('LOBBY_CARD_THICKNESS = 3') &&
      modernSource.includes('LOBBY_CARD_FACE_BODY_CLEARANCE = 0.2'),
    'Modern lobby cards do not include the separated three-dimensional body and face planes'
  );
  assert(
    modernSource.includes('const hiddenBodyCapMaterial = new MeshBasicMaterial({') &&
      modernSource.includes('hiddenBodyCapMaterial,') &&
      modernSource.includes('slabFaceCaps: false'),
    'Modern lobby body does not hide the BoxGeometry caps beneath the face planes'
  );
  assert(
    modernSource.includes('const frontMaterial = new MeshBasicMaterial({') &&
      modernSource.includes('backMaterial = new MeshBasicMaterial({') &&
      modernSource.includes('color: 0xffffff') &&
      modernSource.includes('toneMapped: false'),
    'Modern lobby face and back are not color-faithful unlit materials'
  );
  assert(
    modernSource.includes('texture.colorSpace = SRGBColorSpace') &&
      modernSource.includes('this.renderer.outputColorSpace = SRGBColorSpace') &&
      modernSource.includes('texture.minFilter = LinearMipmapLinearFilter') &&
      modernSource.includes('texture.generateMipmaps = true') &&
      modernSource.includes('this.renderer.capabilities.getMaxAnisotropy()'),
    'Modern lobby textures do not use the sRGB mipmap and anisotropy policy'
  );
  assert(
    modernSource.includes('createAnalyticShadowTexture()') &&
      modernSource.includes("shadowStrategy: 'analytic-contact'") &&
      modernSource.includes('this.renderer.shadowMap.enabled = false') &&
      !/\bShadowMaterial\b/.test(modernSource) &&
      !/\bPCFShadowMap\b/.test(modernSource),
    'Modern lobby depth cue still depends on a hardware shadow map'
  );
  assert(
    modernSource.includes('this.liftShadowGeometry = new PlaneGeometry(132, 164)') &&
      modernSource.includes('this.liftShadowTexture = this.createAnalyticShadowTexture()') &&
      modernSource.includes('const liftShadowMaterial = new MeshBasicMaterial({') &&
      modernSource.includes('map: this.liftShadowTexture') &&
      modernSource.includes('const liftShadow = new Mesh(this.liftShadowGeometry, liftShadowMaterial)') &&
      modernSource.includes('this.scene.add(liftShadow)') &&
      modernSource.includes('this.scene.remove(entry.liftShadow)') &&
      modernSource.includes('updateAnalyticShadow(entry, liftProgress, arcProgress)') &&
      modernSource.includes('hideAnalyticShadow(entry)') &&
      !modernSource.includes('this.liftShadowMaterial =') &&
      !modernSource.includes('this.liftShadow ='),
    'Modern lobby cards do not own independent analytic shadows backed by shared geometry and texture'
  );
  assert(modernSource.includes('Raycaster') && modernSource.includes('new Vector2()'), 'Modern lobby surface has no Three.js picking path');
  assert(modernSource.includes("const LOBBY_CARD_BACK_URL = '/images/cards/cardBack.png'"), 'Modern lobby flip does not use the same-origin card back');
  assert(lobbyMenu.includes("backTextureUrl: '/images/cards/cardBack.png'"), 'lobby card descriptions omit the card-back texture');
  assert(modernSource.includes('backMesh.rotation.x = Math.PI'), 'Modern lobby card back is not oriented upright for an X-axis turn');
  assert(
    modernSource.includes('entry.flipRoot.rotation.x = -Math.PI * 2 * turnProgress') &&
      modernSource.includes('entry.flipRoot.rotation.x = -Math.PI * 2;') &&
      modernSource.includes('entry.flipRoot.rotation.y = 0'),
    'Modern lobby card does not turn continuously around local X from 0 to -2PI'
  );
  assert(
    modernSource.includes('const LOBBY_FLIP_DURATION = 2450') &&
      modernSource.includes('const LOBBY_FLIP_DEADLINE = 3000') &&
      modernSource.includes('const deadlineElapsed = elapsed >= animation.transition.deadlineMs') &&
      modernSource.includes('Math.min(') &&
      modernSource.includes('animation.transition.deadlineMs') &&
      modernSource.includes('turn: 1650'),
    'Modern lobby vertical flip does not enforce the inspectable 2.45-second timeline and 3-second deadline'
  );
  assert(
    !modernSource.includes('LOBBY_CARD_ROTATIONS') &&
      modernSource.includes('rotationDegrees: 0') &&
      modernSource.includes('tiltRoot.rotation.z = 0'),
    'Modern lobby cards are not perfectly flat and unrotated at rest'
  );
  assert(
    modernSource.includes('LOBBY_LIFT_SCREEN_Y = 18') &&
      modernSource.includes('LOBBY_LIFT_Z = 105') &&
      modernSource.includes('const LOBBY_PICKUP_TILT_X = 0') &&
      modernSource.includes('const LOBBY_PICKUP_TILT_Y = 0'),
    'Modern lobby vertical flip does not preserve lift depth with a neutral pickup plane'
  );
  assert(
    modernSource.includes('const projectionRoot = new Group()') &&
      modernSource.includes('projectionRoot.matrixAutoUpdate = false') &&
      modernSource.includes('tiltRoot.add(pickupRoot)') &&
      modernSource.includes('projectionRoot.add(tiltRoot)') &&
      modernSource.includes('applyFlatTableProjection(entry, screenLiftY)') &&
      modernSource.includes('-shearX * LOBBY_CARD_FACE_OFFSET') &&
      modernSource.includes('-shearY * LOBBY_CARD_FACE_OFFSET'),
    'Modern lobby cards do not neutralize off-axis perspective outside the pickup and flip transforms'
  );
  assert(
    modernSource.includes("projectionProfile: 'flat-table-neutralized'") &&
      modernSource.includes("pickupTiltPolicy: 'none'") &&
      modernSource.includes('projectionShearX') &&
      modernSource.includes('projectionShearY') &&
      modernSource.includes('projectedFace: this.getProjectedFaceMetrics(entry)'),
    'Modern lobby diagnostics do not expose the flat-table projection policy and per-card projection state'
  );
  assert(modernSource.includes("this.inputTarget.addEventListener('click', this.handleCanvasClick, true)"), 'Modern lobby menu bridge does not accept captured card clicks');
  assert(modernSource.includes("this.inputTarget.removeEventListener('click', this.handleCanvasClick, true)"), 'Modern lobby click listener is not removed during disposal');
  assert(
    /#modernLobbyHand \.modern-graphics-canvas\s*\{[^}]*pointer-events:\s*none;/.test(boardCss),
    'Modern lobby canvas is not pointer-inert'
  );
  assert(
    arrivalSource.includes("name: 'casual-drop-left'") &&
      arrivalSource.includes('export const CARD_ARRIVAL_PROFILES') &&
      arrivalSource.includes('Unknown card-arrival profile') &&
      arrivalSource.includes('maxBatchDurationMs: 1500') &&
      arrivalSource.includes('maximumVertexPerspectiveScale: 1.09') &&
      arrivalSource.includes('function createSeededRandom(seed)') &&
      arrivalSource.includes('export function createCardArrivalBatch(cards, request)') &&
      arrivalSource.includes('export function sampleCardArrival(plan, elapsedMs)') &&
      arrivalSource.includes('destination: {') &&
      !arrivalSource.includes('Math.random'),
    'the reusable seeded destination-driven arrival planner is incomplete'
  );
  assert(
    arrivalSource.includes("originPolicy: 'compact-left-hand-packet'") &&
      arrivalSource.includes("placementOrder: 'art-directed-human-scatter'") &&
      arrivalSource.includes("collisionPolicy: 'depth-separated-natural-overflight'") &&
      arrivalSource.includes("name: 'long-skim'") &&
      arrivalSource.includes("name: 'lofted-toss'") &&
      arrivalSource.includes("name: 'quick-slip'") &&
      arrivalSource.includes("name: 'soft-drop'") &&
      arrivalSource.includes('motionVariant') &&
      arrivalSource.includes('apexAtProgress') &&
      arrivalSource.includes('gravity') &&
      arrivalSource.includes('easeOutQuadratic') &&
      arrivalSource.includes('launchX:') &&
      arrivalSource.includes('perspectiveDistance / nearestPossibleDepth') &&
      arrivalSource.includes('releaseTimes') &&
      arrivalSource.includes("createPose(plan, 'flight'") &&
      arrivalSource.includes("createPose(plan, 'slap'") &&
      arrivalSource.includes("createPose(plan, 'slide'") &&
      modernSource.includes('preparePendingPlaybook()') &&
      modernSource.includes('applyCardMotionPose(entry, pose') &&
      modernSource.includes('updatePlaybookAnimation(animation, elapsed)') &&
      modernSource.includes('sampleLobbyMotionPlan('),
    'the lobby surface does not consume the application playbook through the renderer-neutral motion sampler'
  );
  assert(
    modernSource.includes('this.consumedPlaybookRequestIds = new Set()') &&
      modernSource.includes(
        'this.consumedPlaybookRequestIds.add(String(request.id))'
      ) &&
      coordinator.includes('this.lobbyPresentationDeliveredId') &&
      modernSource.includes('elapsedBeforeReadyMs') &&
      modernSource.includes('this.prefersReducedMotion() || this.suspended') &&
      modernSource.includes("'skipped-reduced-motion'") &&
      modernSource.includes('resetPlaybookCards()') &&
      modernSource.includes('finishPlaybookBatch('),
    'playbook replay, reduced-motion, exact-settlement, or completion guards are incomplete'
  );
  assert(
    modernSource.includes("kind: 'playbook'") &&
      modernSource.includes("kind: 'flip'") &&
      modernSource.includes("animation.kind === 'playbook'") &&
      modernSource.includes('this.activeAnimations.set(entry, animation)') &&
      modernSource.includes('this.scheduleAnimationFrame()'),
    'playbook and flip motion do not share the discriminated single scheduler'
  );
  assert(
    modernSource.includes('cardAnimations: Object.freeze({') &&
      modernSource.includes('createArrivalBatch(cards, request)') &&
      modernSource.includes('sampleArrival(plan, elapsedMs)'),
    'the Modern facade does not expose the reusable card-arrival recipe'
  );
  assert(
    modernSource.includes('this.activeAnimations = new Map()') &&
      modernSource.includes('if (this.activeAnimations.has(entry))') &&
      modernSource.includes('this.activeAnimations.set(entry, animation)') &&
      modernSource.includes('this.activeAnimations.delete(entry)') &&
      modernSource.includes('this.ignoredClicks') &&
      !modernSource.includes('this.activeAnimation ='),
    'Modern lobby flip does not guard re-entry per card while allowing independent cards to animate'
  );
  assert(
    modernSource.includes('window.requestAnimationFrame') &&
      modernSource.includes('window.cancelAnimationFrame') &&
      modernSource.includes('tickAnimations(timestamp)') &&
      modernSource.includes('Array.from(this.activeAnimations.values()).forEach((animation) => {') &&
      modernSource.includes('completed.forEach((entry) => {') &&
      modernSource.includes('this.scheduleAnimationFrame()'),
    'Modern lobby flips are not advanced together by one cancellable animation-frame scheduler'
  );
  assert(modernSource.includes("typeof window.performance.now === 'function'"), 'Modern lobby flip does not anchor its deadline at accepted-click time');
  assert(
    modernSource.includes("phases: [reducedMotion ? 'back' : 'lift']") &&
      modernSource.includes("this.markTransitionPhase(transition, 'first-edge')") &&
      modernSource.includes("this.markTransitionPhase(transition, 'back')") &&
      modernSource.includes("this.markTransitionPhase(transition, 'second-edge')") &&
      modernSource.includes("this.markTransitionPhase(transition, 'front')") &&
      modernSource.includes("this.markTransitionPhase(animation.transition, 'settled')"),
    'Modern lobby diagnostics do not expose both edge passes in the lift/back/front/settled sequence'
  );
  assert(
    modernSource.includes('const transition = animation.transition') &&
      modernSource.includes('updateAnimation(animation, elapsed)') &&
      modernSource.includes('markTurnMilestones(transition, turnProgress)') &&
      modernSource.includes('recordMotionEvidence(entry, transition)') &&
      modernSource.includes('markTransitionPhase(transition, phase)') &&
      modernSource.includes('completeAnimation(animation, outcome, shouldRender)'),
    'Concurrent lobby animations do not keep phase and motion evidence on their own transitions'
  );
  assert(
    modernSource.includes("flipAxis: 'x'") &&
      modernSource.includes('maxScreenLiftY') &&
      modernSource.includes('maxLiftZ') &&
      modernSource.includes('maxAbsFlipRotationX') &&
      modernSource.includes('minFlipRotationX') &&
      modernSource.includes('maxAbsFlipRotationY') &&
      modernSource.includes('maxPickupTilt') &&
      modernSource.includes('maxTopBottomDepthSpan') &&
      modernSource.includes('maxPerspectiveScale') &&
      modernSource.includes('maxAnalyticShadowOpacity') &&
      modernSource.includes('maxAbsProjectedLateralShear') &&
      modernSource.includes('directionReversals') &&
      modernSource.includes('firstEdgeAngleX') &&
      modernSource.includes('backAngleX') &&
      modernSource.includes('secondEdgeAngleX') &&
      modernSource.includes('frontAngleBeforeSettlement') &&
      modernSource.includes('edgePasses'),
    'Modern lobby diagnostics do not expose evidence for the monotonic full turn and artifact-free depth cues'
  );
  assert(
    modernSource.includes('getProjectedFaceMetrics(entry)') &&
      modernSource.includes('new Vector3(corner[0], corner[1], 0)') &&
      modernSource.includes('lateralShear: topMidpointX - bottomMidpointX') &&
      modernSource.includes('topWidth: edgeLength(corners[0], corners[1])') &&
      modernSource.includes('bottomWidth: edgeLength(corners[3], corners[2])'),
    'Modern lobby diagnostics cannot measure the projected card silhouette or lateral shear'
  );
  assert(
    modernSource.includes('cancelAnimations(outcome, shouldRender)') &&
      modernSource.includes("this.cancelAnimations('context-lost', false)") &&
      modernSource.includes("this.cancelAnimations('replaced')") &&
      modernSource.includes("this.cancelAnimations('cleared')") &&
      modernSource.includes("this.cancelAnimations('cancelled')") &&
      modernSource.includes("this.cancelAnimations('disposed', false)"),
    'Modern lobby lifecycle does not cancel and settle every in-flight card animation'
  );
  assert(
    modernSource.includes('activeAnimationCount: activeAnimations.length') &&
      modernSource.includes('activeCardIndices,') &&
      modernSource.includes('lockedCardIndices: activeCardIndices.slice(0)') &&
      modernSource.includes('activeAnimations: activeAnimations.map((animation) => ({') &&
      modernSource.includes('activeArrivalCount: activeArrivalAnimations.length') &&
      modernSource.includes('completedArrivalCount: this.completedArrivalCount') &&
      modernSource.includes('lastArrivalBatch: this.lastArrivalBatch ? {') &&
      modernSource.includes('recentArrivalTransitions: this.arrivalTransitionHistory.map(') &&
      modernSource.includes('peakConcurrentAnimationCount: this.peakConcurrentAnimationCount') &&
      modernSource.includes('activeAnalyticShadowCount: visibleShadows.length') &&
      modernSource.includes('recentTransitions: this.transitionHistory.map((transition) => (') &&
      modernSource.includes('animating: entry ? this.activeAnimations.has(entry) : false') &&
      modernSource.includes('lastTransition: entry'),
    'Modern lobby diagnostics do not expose concurrent card locks, transitions, and per-card shadows'
  );
  assert(modernSource.includes("this.status !== 'ready'"), 'Modern lobby input handlers are not gated on confirmed readiness');
  assert(coordinator.includes('this.surface.suspend()') && coordinator.includes('this.surface.resume()'), 'runtime graphics switching does not suspend and resume lobby interaction');
  assert(modernSource.includes('startReducedMotionAnimation(entry)') && modernSource.includes('tickReducedMotionAnimation(animation)'), 'reduced motion has no bounded back/front proof');

  console.log(`ok - modern graphics build/runtime contract (${assertions} assertions)`);
} catch (error) {
  console.error(`not ok - modern graphics contract: ${error.message}`);
  process.exitCode = 1;
}
