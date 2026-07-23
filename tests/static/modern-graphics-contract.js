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
  const application = read('public/js/default/index.js');
  const lobbyMenu = read('public/js/plugins/gh.menu.js');
  const modernSource = read('frontend/src/modern-graphics.js');
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
  assert(!/window\.THREE\s*=/.test(modernSource + modernBundle), 'modern bundle overwrites the legacy snow THREE global');
  assert(fs.existsSync(path.join(root, 'public/js/modern/THREE-LICENSE.txt')), 'distributed Three.js license is missing');

  assert(coordinator.includes('/js/modern/purett-modern-graphics.min.js?v=0.185.1-lobby-flip.1'), 'coordinator does not use the lobby-flip bundle cache revision');
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

  assert(application.includes('menu: me.menu'), 'application does not pass the lobby menu to the graphics coordinator');
  assert(coordinator.includes('this.menu = options.menu'), 'graphics coordinator does not retain the lobby menu bridge');
  assert(lobbyMenu.includes('id="modernLobbyHand"'), 'lobby menu does not create a dedicated Modern hand host');
  assert(modernSource.includes('createLobbyHandSurface(host, options)'), 'modern graphics facade has no dedicated lobby-hand factory');
  assert(coordinator.includes("ensureSurface('lobby-hand')"), 'coordinator does not select the dedicated lobby-hand surface');

  assert(lobbyMenu.includes('legacy-menu-hand-card'), 'lobby Raphael hand cards do not receive a hand-only gate class');
  assert(boardCss.includes('#menu.graphics-modern-hand .legacy-menu-hand-card'), 'Modern lobby mode does not gate only the legacy hand-card elements');
  assert(!boardCss.includes('#menu.graphics-modern-hand svg'), 'Modern lobby mode broadly hides the Raphael menu paper');
  assert(lobbyMenu.includes("$('#menu').toggleClass('graphics-modern-hand', useModernHand)"), 'legacy lobby cards are not gated on confirmed Modern-hand readiness');

  assert(modernSource.includes('const LOBBY_LOGICAL_WIDTH = 755'), 'Modern lobby surface does not preserve the 755px logical width');
  assert(modernSource.includes('const LOBBY_LOGICAL_HEIGHT = 562'), 'Modern lobby surface does not preserve the 562px logical height');
  assert(modernSource.includes('(cards || []).slice(0, 5)'), 'Modern lobby surface is not bounded to the five-card preview');
  assert(lobbyMenu.includes('pos:        [72, 197, 322, 447, 572]'), 'lobby preview no longer carries the five legacy hand positions');
  assert(modernSource.includes('Raycaster') && modernSource.includes('new Vector2()'), 'Modern lobby surface has no Three.js picking path');
  assert(modernSource.includes("const LOBBY_CARD_BACK_URL = '/images/cards/cardBack.png'"), 'Modern lobby flip does not use the same-origin card back');
  assert(lobbyMenu.includes("backTextureUrl: '/images/cards/cardBack.png'"), 'lobby card descriptions omit the card-back texture');
  assert(modernSource.includes("this.inputTarget.addEventListener('click', this.handleCanvasClick, true)"), 'Modern lobby menu bridge does not accept captured card clicks');
  assert(modernSource.includes("this.inputTarget.removeEventListener('click', this.handleCanvasClick, true)"), 'Modern lobby click listener is not removed during disposal');
  assert(
    /#modernLobbyHand \.modern-graphics-canvas\s*\{[^}]*pointer-events:\s*none;/.test(boardCss),
    'Modern lobby canvas is not pointer-inert'
  );
  assert(modernSource.includes('this.activeAnimation') && modernSource.includes('this.ignoredClicks'), 'Modern lobby flip has no click lock state');
  assert(modernSource.includes('window.requestAnimationFrame') && modernSource.includes('window.cancelAnimationFrame'), 'Modern lobby flip does not own and cancel its animation frames');
  assert(modernSource.includes("typeof window.performance.now === 'function'"), 'Modern lobby flip does not anchor its deadline at accepted-click time');
  assert(
    modernSource.includes("phases: ['lift']") &&
      modernSource.includes("this.markTransitionPhase('back')") &&
      modernSource.includes("this.markTransitionPhase('front')") &&
      modernSource.includes("this.markTransitionPhase('settled')"),
    'Modern lobby diagnostics do not expose the lift/back/front/settled sequence'
  );
  assert(modernSource.includes("this.cancelAnimation('disposed')"), 'disposing the Modern lobby surface does not cancel an in-flight flip');
  assert(modernSource.includes("this.status !== 'ready'"), 'Modern lobby input handlers are not gated on confirmed readiness');
  assert(coordinator.includes('this.surface.suspend()') && coordinator.includes('this.surface.resume()'), 'runtime graphics switching does not suspend and resume lobby interaction');
  assert(modernSource.includes('startReducedMotionAnimation(entry)') && modernSource.includes('tickReducedMotionAnimation(animation)'), 'reduced motion has no bounded back/front proof');

  console.log(`ok - modern graphics build/runtime contract (${assertions} assertions)`);
} catch (error) {
  console.error(`not ok - modern graphics contract: ${error.message}`);
  process.exitCode = 1;
}
