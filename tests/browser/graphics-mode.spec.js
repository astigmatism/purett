'use strict';

const {test, expect} = require('@playwright/test');

async function loginWithFreshGraphicsPreference(page) {
  await page.goto('/auth/login');
  await page.evaluate(() => window.localStorage.removeItem('purett.graphicsMode.v1'));
  await page.locator('input[name="username"]').fill('demo');
  await page.locator('input[name="password"]').fill('TripleTriad!');
  await Promise.all([
    page.waitForURL(url => url.pathname === '/'),
    page.locator('button[type="submit"]').click()
  ]);
  await expect.poll(() => page.evaluate(() => Boolean(
    window.gh && gh.manager && gh.manager.menu && gh.manager.game && gh.manager.graphics
  ))).toBe(true);
}

async function selectGraphicsMode(page, mode) {
  await page.locator('#title-icon').click();
  await page.locator(`#contextmenu button[data-graphics-mode="${mode}"]`).click();
  await expect.poll(() => page.evaluate(
    expected => gh.manager.graphics.requestedMode === expected,
    mode
  )).toBe(true);
}

test('switches a live Raphael surface to isolated Three.js and back without rebuilding', async ({page}) => {
  const modernRequests = [];
  const moveRequests = [];
  page.on('request', request => {
    if (request.url().includes('/js/modern/purett-modern-graphics.min.js')) modernRequests.push(request.url());
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/index/me') moveRequests.push(request.url());
  });

  await loginWithFreshGraphicsPreference(page);

  expect(await page.evaluate(() => gh.manager.graphics.getState())).toMatchObject({
    requestedMode: 'legacy',
    effectiveMode: 'legacy',
    loadState: 'idle'
  });
  expect(modernRequests).toHaveLength(0);
  await expect(page.locator('#modernGraphics canvas')).toHaveCount(0);

  await page.evaluate(() => {
    const game = gh.manager.game;
    const gameWrapper = document.querySelector('#game-wrapper');
    gameWrapper.classList.remove('hide');
    gameWrapper.style.display = 'block';
    gameWrapper.style.zIndex = '50';

    document.querySelector('#svgBoard').replaceChildren();
    document.querySelector('#svgRules').replaceChildren();
    game.buildCanvas();
    const probe = game.canvas.rect(80, 80, 117, 146).attr({
      fill: '#fff',
      stroke: '#000'
    });
    probe.node.id = 'graphics-legacy-probe';
    probe.node.setAttribute('pointer-events', 'all');
    window.__graphicsLegacyProbe = probe.node;
    window.__legacyThreeIdentity = {
      object: window.THREE,
      Camera: window.THREE.Camera,
      CanvasRenderer: window.THREE.CanvasRenderer
    };
  });

  const legacyProbe = page.locator('#graphics-legacy-probe');
  await expect(legacyProbe).toBeVisible();
  await selectGraphicsMode(page, 'modern');
  await expect.poll(() => page.evaluate(() => gh.manager.graphics.effectiveMode)).toBe('modern');

  expect(modernRequests).toHaveLength(1);
  await expect(page.locator('#modernGraphics canvas.modern-graphics-canvas')).toHaveCount(1);
  expect(await page.evaluate(() => gh.manager.graphics.getState())).toMatchObject({
    requestedMode: 'modern',
    effectiveMode: 'modern',
    loadState: 'loaded',
    packageVersion: '0.185.1',
    revision: '185',
    surface: {
      logicalWidth: 693,
      logicalHeight: 500,
      contextType: 'webgl2',
      disposed: false,
      contextLost: false
    }
  });

  const modernGate = await page.evaluate(() => ({
    boardOpacity: getComputedStyle(document.querySelector('#svgBoard')).opacity,
    boardPointerEvents: getComputedStyle(document.querySelector('#svgBoard')).pointerEvents,
    probePointerEvents: getComputedStyle(document.querySelector('#graphics-legacy-probe')).pointerEvents,
    boardAriaHidden: document.querySelector('#svgBoard').getAttribute('aria-hidden'),
    legacyNodePreserved: window.__graphicsLegacyProbe === document.querySelector('#graphics-legacy-probe'),
    legacyThreePreserved:
      window.__legacyThreeIdentity.object === window.THREE &&
      window.__legacyThreeIdentity.Camera === window.THREE.Camera &&
      window.__legacyThreeIdentity.CanvasRenderer === window.THREE.CanvasRenderer
  }));
  expect(modernGate).toEqual({
    boardOpacity: '0',
    boardPointerEvents: 'none',
    probePointerEvents: 'none',
    boardAriaHidden: 'true',
    legacyNodePreserved: true,
    legacyThreePreserved: true
  });

  await page.locator('#modernGraphics').click({position: {x: 345, y: 250}});
  expect(moveRequests).toHaveLength(0);

  await selectGraphicsMode(page, 'legacy');
  await expect.poll(() => page.evaluate(() => gh.manager.graphics.effectiveMode)).toBe('legacy');
  await expect(legacyProbe).toBeVisible();
  expect(await page.evaluate(() => (
    window.__graphicsLegacyProbe === document.querySelector('#graphics-legacy-probe') &&
    getComputedStyle(document.querySelector('#svgBoard')).opacity === '1'
  ))).toBe(true);

  for (let index = 0; index < 10; index += 1) {
    await page.evaluate(mode => gh.manager.graphics.setMode(mode, false), index % 2 ? 'legacy' : 'modern');
  }
  await page.evaluate(() => gh.manager.graphics.setMode('legacy', false));
  expect(await page.locator('#modernGraphics canvas').count()).toBe(1);
  expect(await page.locator('#purett-modern-graphics-script').count()).toBe(1);
  expect(modernRequests).toHaveLength(1);
  expect(await page.evaluate(() => window.__graphicsLegacyProbe === document.querySelector('#graphics-legacy-probe'))).toBe(true);
});

test('persists the requested mode while keeping Legacy free of Modern bundle requests', async ({page}) => {
  const modernRequests = [];
  page.on('request', request => {
    if (request.url().includes('/js/modern/purett-modern-graphics.min.js')) modernRequests.push(request.url());
  });

  await loginWithFreshGraphicsPreference(page);
  expect(modernRequests).toHaveLength(0);

  await page.evaluate(() => gh.manager.graphics.setModernEnabled(false));
  await selectGraphicsMode(page, 'modern');
  expect(await page.evaluate(() => gh.manager.graphics.getState())).toMatchObject({
    requestedMode: 'modern',
    effectiveMode: 'legacy',
    modernEnabled: false,
    fallbackReason: 'configuration-disabled',
    loadState: 'idle'
  });
  expect(modernRequests).toHaveLength(0);
  expect(await page.locator('#contextmenu .graphics-mode-status').textContent()).toContain('disabled by configuration');

  await page.evaluate(() => gh.manager.graphics.setModernEnabled(true));
  await expect.poll(() => page.evaluate(() => gh.manager.graphics.effectiveMode)).toBe('modern');
  expect(await page.evaluate(() => window.localStorage.getItem('purett.graphicsMode.v1'))).toBe('modern');

  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(gh.manager && gh.manager.graphics))).toBe(true);
  await expect.poll(() => page.evaluate(() => gh.manager.graphics.effectiveMode)).toBe('modern');
  expect(await page.evaluate(() => gh.manager.graphics.requestedMode)).toBe('modern');

  await selectGraphicsMode(page, 'legacy');
  const requestCountBeforeLegacyReload = modernRequests.length;
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(gh.manager && gh.manager.graphics))).toBe(true);
  expect(await page.evaluate(() => gh.manager.graphics.getState())).toMatchObject({
    requestedMode: 'legacy',
    effectiveMode: 'legacy',
    loadState: 'idle'
  });
  expect(modernRequests).toHaveLength(requestCountBeforeLegacyReload);
});
