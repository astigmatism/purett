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

async function loginWithStoredGraphicsPreference(page, mode) {
  await page.goto('/auth/login');
  await page.evaluate(storedMode => {
    window.localStorage.setItem(
      'purett.graphicsMode.v1',
      storedMode
    );
  }, mode);
  await page.locator('input[name="username"]').fill('demo');
  await page.locator('input[name="password"]').fill('TripleTriad!');
  await Promise.all([
    page.waitForURL(url => url.pathname === '/'),
    page.locator('button[type="submit"]').click()
  ]);
  await expect.poll(() => page.evaluate(() => Boolean(
    window.gh && gh.manager && gh.manager.menu &&
      gh.manager.game && gh.manager.graphics
  ))).toBe(true);
}

async function loginWithoutWaitingForWindowLoad(page, mode) {
  await page.goto('/auth/login');
  await page.evaluate(storedMode => {
    window.localStorage.setItem(
      'purett.graphicsMode.v1',
      storedMode
    );
  }, mode);
  await page.locator('input[name="username"]').fill('demo');
  await page.locator('input[name="password"]').fill('TripleTriad!');
  await Promise.all([
    page.waitForURL(
      url => url.pathname === '/',
      {waitUntil: 'domcontentloaded'}
    ),
    page.locator('button[type="submit"]').click({
      noWaitAfter: true
    })
  ]);
  await expect.poll(() => page.evaluate(() => Boolean(
    window.gh && gh.manager && gh.manager.menu &&
      gh.manager.game && gh.manager.graphics
  ))).toBe(true);
}

async function installStartupPaintProbe(page) {
  await page.addInitScript(() => {
    const probe = {
      frames: 0,
      startupModernFrames: 0,
      legacyCardFrames: 0,
      visibleLegacyFrames: 0,
      exposedLegacyStartupFrames: 0,
      inaccessibleLegacyStartupFrames: 0,
      accessibleLegacyStartupFrames: 0,
      maxLegacyCardCount: 0
    };
    window.__graphicsStartupPaintProbe = probe;

    const sample = () => {
      const cards = Array.from(
        document.querySelectorAll('.legacy-menu-hand-card')
      );
      const startupModern =
        document.documentElement.getAttribute(
          'data-graphics-startup-mode'
        ) === 'modern';
      const legacyVisible = cards.some(card => {
        const style = window.getComputedStyle(card);
        return style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          Number(style.opacity) > 0.01;
      });

      probe.frames += 1;
      probe.maxLegacyCardCount = Math.max(
        probe.maxLegacyCardCount,
        cards.length
      );
      if (startupModern) {
        probe.startupModernFrames += 1;
      }
      if (cards.length > 0) {
        probe.legacyCardFrames += 1;
      }
      if (legacyVisible) {
        probe.visibleLegacyFrames += 1;
      }
      if (startupModern && legacyVisible) {
        probe.exposedLegacyStartupFrames += 1;
      }
      if (startupModern && cards.length > 0) {
        if (cards.every(card =>
          card.getAttribute('aria-hidden') === 'true'
        )) {
          probe.inaccessibleLegacyStartupFrames += 1;
        } else {
          probe.accessibleLegacyStartupFrames += 1;
        }
      }
      window.requestAnimationFrame(sample);
    };
    window.requestAnimationFrame(sample);
  });
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
    gh.manager.menu.hide();
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
    loadState: 'idle',
    startupModernGatePending: false
  });
  expect(await page.evaluate(() => (
    document.documentElement.getAttribute(
      'data-graphics-startup-mode'
    )
  ))).toBeNull();
  expect(modernRequests).toHaveLength(requestCountBeforeLegacyReload);
});

test('masks the retained Legacy lobby hand before first paint when Modern is restored', async ({page}) => {
  await installStartupPaintProbe(page);
  await page.route(
    '**/js/modern/purett-modern-graphics.min.js*',
    async route => {
      await new Promise(resolve => setTimeout(resolve, 2200));
      await route.continue();
    }
  );

  await loginWithStoredGraphicsPreference(page, 'modern');
  await expect.poll(() => page.evaluate(() => {
    const graphics = gh.manager.graphics.getState();
    return graphics.effectiveMode === 'modern' &&
      graphics.surfaceKind === 'lobby-hand' &&
      graphics.surface &&
      graphics.surface.ready === true;
  })).toBe(true);

  const startup = await page.evaluate(() => ({
    probe: window.__graphicsStartupPaintProbe,
    rootMode: document.documentElement.getAttribute(
      'data-graphics-startup-mode'
    ),
    state: gh.manager.graphics.getState(),
    legacyCards: Array.from(
      document.querySelectorAll('.legacy-menu-hand-card')
    ).map(card => ({
      opacity: getComputedStyle(card).opacity,
      ariaHidden: card.getAttribute('aria-hidden')
    }))
  }));

  expect(startup.probe.startupModernFrames).toBeGreaterThan(0);
  expect(startup.probe.legacyCardFrames).toBeGreaterThan(0);
  expect(startup.probe.maxLegacyCardCount).toBe(5);
  expect(startup.probe.visibleLegacyFrames).toBe(0);
  expect(startup.probe.exposedLegacyStartupFrames).toBe(0);
  expect(
    startup.probe.inaccessibleLegacyStartupFrames
  ).toBeGreaterThan(0);
  expect(startup.probe.accessibleLegacyStartupFrames).toBe(0);
  expect(startup.rootMode).toBeNull();
  expect(startup.state).toMatchObject({
    requestedMode: 'modern',
    effectiveMode: 'modern',
    startupModernGatePending: false
  });
  expect(startup.legacyCards).toHaveLength(5);
  expect(startup.legacyCards.every(card =>
    card.opacity === '0' && card.ariaHidden === 'true'
  )).toBe(true);
});

test('fails the restored-Modern startup mask open to the intact Legacy hand', async ({page}) => {
  await installStartupPaintProbe(page);
  await page.route(
    '**/js/modern/purett-modern-graphics.min.js*',
    async route => {
      await new Promise(resolve => setTimeout(resolve, 1400));
      await route.abort();
    }
  );

  await loginWithStoredGraphicsPreference(page, 'modern');
  await expect.poll(() => page.evaluate(() => {
    const state = gh.manager.graphics.getState();
    return state.requestedMode === 'modern' &&
      state.effectiveMode === 'legacy' &&
      state.fallbackReason === 'initialization-failed' &&
      gh.manager.menu.hand.length === 5;
  })).toBe(true);
  await expect.poll(() => page.evaluate(() => (
    Array.from(document.querySelectorAll('.legacy-menu-hand-card'))
      .every(card => Number(getComputedStyle(card).opacity) > 0.99)
  ))).toBe(true);

  const fallback = await page.evaluate(() => ({
    rootMode: document.documentElement.getAttribute(
      'data-graphics-startup-mode'
    ),
    state: gh.manager.graphics.getState(),
    probe: window.__graphicsStartupPaintProbe,
    storedMode: window.localStorage.getItem(
      'purett.graphicsMode.v1'
    ),
    legacyCards: Array.from(
      document.querySelectorAll('.legacy-menu-hand-card')
    ).map(card => ({
      opacity: getComputedStyle(card).opacity,
      ariaHidden: card.getAttribute('aria-hidden')
    }))
  }));

  expect(fallback.rootMode).toBeNull();
  expect(fallback.state.startupModernGatePending).toBe(false);
  expect(
    fallback.probe.inaccessibleLegacyStartupFrames
  ).toBeGreaterThan(0);
  expect(fallback.probe.accessibleLegacyStartupFrames).toBe(0);
  expect(fallback.probe.exposedLegacyStartupFrames).toBe(0);
  expect(fallback.probe.visibleLegacyFrames).toBeGreaterThan(0);
  expect(fallback.storedMode).toBe('modern');
  expect(fallback.legacyCards).toHaveLength(5);
  expect(fallback.legacyCards.every(card =>
    card.opacity === '1' && card.ariaHidden === 'false'
  )).toBe(true);
});

test('fails a silent restored-Modern startup stall open within its watchdog', async ({page}) => {
  let releaseModernRequest;
  const stalledModernRequest = new Promise(resolve => {
    releaseModernRequest = resolve;
  });
  await installStartupPaintProbe(page);
  await page.route(
    '**/js/modern/purett-modern-graphics.min.js*',
    async route => {
      await stalledModernRequest;
      await route.abort();
    }
  );

  await loginWithoutWaitingForWindowLoad(page, 'modern');
  await expect.poll(() => page.evaluate(() => (
    gh.manager.menu.hand.length === 5 &&
      gh.manager.graphics.getState()
        .startupModernGatePending === true
  ))).toBe(true);
  await expect.poll(
    () => page.evaluate(() => {
      const state = gh.manager.graphics.getState();
      return state.requestedMode === 'modern' &&
        state.effectiveMode === 'legacy' &&
        state.fallbackReason === 'startup-timeout' &&
        state.startupModernGateTimedOut === true;
    }),
    {timeout: 9000}
  ).toBe(true);

  const timeoutFallback = await page.evaluate(() => ({
    rootMode: document.documentElement.getAttribute(
      'data-graphics-startup-mode'
    ),
    storedMode: window.localStorage.getItem(
      'purett.graphicsMode.v1'
    ),
    probe: window.__graphicsStartupPaintProbe,
    legacyCards: Array.from(
      document.querySelectorAll('.legacy-menu-hand-card')
    ).map(card => ({
      opacity: getComputedStyle(card).opacity,
      ariaHidden: card.getAttribute('aria-hidden')
    }))
  }));
  expect(timeoutFallback.rootMode).toBeNull();
  expect(timeoutFallback.storedMode).toBe('modern');
  expect(
    timeoutFallback.probe.exposedLegacyStartupFrames
  ).toBe(0);
  expect(timeoutFallback.legacyCards).toHaveLength(5);
  expect(timeoutFallback.legacyCards.every(card =>
    card.opacity === '1' && card.ariaHidden === 'false'
  )).toBe(true);

  releaseModernRequest();
  await expect.poll(() => page.evaluate(() => {
    const state = gh.manager.graphics.getState();
    return state.loadState === 'failed' &&
      state.effectiveMode === 'legacy' &&
      state.startupModernGateTimedOut === true;
  })).toBe(true);
});
