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
  const modernSource = read('frontend/src/modern-graphics.js');
  const modernBundle = read('public/js/modern/purett-modern-graphics.min.js');
  const layout = read('application/views/layouts/standalone.phtml');
  const game = read('public/js/plugins/gh.game.js');
  const boardCss = read('public/css/default/index.css');
  const menu = read('application/views/partials/overlays.phtml');
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

  assert(coordinator.includes('/js/modern/purett-modern-graphics.min.js?v=0.185.1'), 'coordinator does not use the pinned same-origin bundle');
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
  assert(menu.includes('data-graphics-mode="legacy"') && menu.includes('data-graphics-mode="modern"'), 'graphics menu choices are incomplete');

  console.log(`ok - modern graphics build/runtime contract (${assertions} assertions)`);
} catch (error) {
  console.error(`not ok - modern graphics contract: ${error.message}`);
  process.exitCode = 1;
}
