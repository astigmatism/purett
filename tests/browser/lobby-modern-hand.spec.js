'use strict';

const {test, expect} = require('@playwright/test');

async function loginWithLegacyGraphics(page) {
  await page.goto('/auth/login');
  await page.evaluate(() => window.localStorage.removeItem('purett.graphicsMode.v1'));
  await page.locator('input[name="username"]').fill('demo');
  await page.locator('input[name="password"]').fill('TripleTriad!');
  await Promise.all([
    page.waitForURL(url => url.pathname === '/'),
    page.locator('button[type="submit"]').click()
  ]);

  await expect.poll(() => page.evaluate(() => Boolean(
    window.gh &&
    gh.manager &&
    gh.manager.menu &&
    gh.manager.graphics &&
    gh.manager.menu.visible &&
    gh.manager.menu.hand.length === 5
  ))).toBe(true);
  await expect(page.locator('ul.mainmenu li.play')).toBeVisible();
}

async function selectGraphicsMode(page, mode) {
  await page.locator('#title-icon').click();
  await page.locator(`#contextmenu button[data-graphics-mode="${mode}"]`).click();
  await expect.poll(() => page.evaluate(
    expected => gh.manager.graphics.requestedMode === expected,
    mode
  )).toBe(true);
}

test('renders the five-card lobby hand with Three.js and preserves the Legacy lobby', async ({page}) => {
  await loginWithLegacyGraphics(page);

  const expectedCards = await page.evaluate(() => gh.data.hand.slice(0, 5).map((card, index) => ({
    index,
    userCardId: card.usercardid == null ? null : card.usercardid,
    cardId: card.cardid == null ? null : card.cardid,
    textureUrl:
      '/images/cards/' +
      (Number(card.purchased) === 1 ? 'p' : '') +
      gh.data.color +
      '/' +
      card.image +
      '.png',
    screenRect: {
      x: gh.manager.menu.pos[index],
      y: 203,
      width: gh.manager.menu.cW,
      height: gh.manager.menu.cH
    }
  })));
  expect(expectedCards).toHaveLength(5);

  await expect(page.locator('.legacy-menu-hand-card')).toHaveCount(5);
  await expect(page.locator('ul.mainmenu li.play')).toBeVisible();
  await expect(page.locator('ul.mainmenu li.shop')).toBeVisible();
  await expect(page.locator('ul.mainmenu li.tutorials')).toBeVisible();

  await page.evaluate(() => {
    window.__legacyLobbyCardNodes = gh.manager.menu.hand.map(card => card.node);
    window.__legacyLobbyBarNode = gh.manager.menu.bar.node;
  });

  await selectGraphicsMode(page, 'modern');
  await expect.poll(() => page.evaluate(() => {
    const state = gh.manager.graphics.getState();
    return state.effectiveMode === 'modern' &&
      state.surfaceKind === 'lobby-hand' &&
      state.surface &&
      state.surface.ready === true;
  })).toBe(true);

  const modernState = await page.evaluate(() => gh.manager.graphics.getState());
  expect(modernState).toMatchObject({
    requestedMode: 'modern',
    effectiveMode: 'modern',
    loadState: 'loaded',
    packageVersion: '0.185.1',
    revision: '185',
    surfaceKind: 'lobby-hand',
    lobbyVisible: true,
    surface: {
      surface: 'lobby-hand',
      logicalWidth: 755,
      logicalHeight: 562,
      disposed: false,
      contextLost: false,
      status: 'ready',
      ready: true,
      meshCount: 5
    }
  });
  expect(modernState.surface.cards).toHaveLength(5);
  expect(modernState.surface.cards.map(card => ({
    index: card.index,
    userCardId: card.userCardId,
    cardId: card.cardId,
    textureUrl: card.textureUrl,
    screenRect: card.screenRect
  }))).toEqual(expectedCards);
  expect(modernState.surface.cards.every(card => card.visible)).toBe(true);

  await expect(page.locator('#modernLobbyHand canvas.modern-lobby-hand-canvas')).toHaveCount(1);
  await expect(page.locator('#menu')).toHaveClass(/graphics-modern-hand/);

  const modernPresentation = await page.evaluate(() => {
    const host = document.querySelector('#modernLobbyHand');
    const canvas = host.querySelector('canvas');
    const legacyCards = Array.from(document.querySelectorAll('.legacy-menu-hand-card'));
    const firstRect = gh.manager.graphics.getState().surface.cards[0].screenRect;
    const hostRect = host.getBoundingClientRect();
    const hitTarget = document.elementFromPoint(
      hostRect.left + ((firstRect.x + (firstRect.width / 2)) * hostRect.width / 755),
      hostRect.top + ((firstRect.y + (firstRect.height / 2)) * hostRect.height / 562)
    );

    return {
      hostAriaHidden: host.getAttribute('aria-hidden'),
      hostPointerEvents: getComputedStyle(host).pointerEvents,
      canvasAriaHidden: canvas.getAttribute('aria-hidden'),
      canvasPointerEvents: getComputedStyle(canvas).pointerEvents,
      canvasTabIndex: canvas.tabIndex,
      hitTargetIsModernSurface: hitTarget === canvas || host.contains(hitTarget),
      legacyCardsPreserved: legacyCards.length === 5 &&
        window.__legacyLobbyCardNodes.every((node, index) =>
          node === legacyCards[index] && node.isConnected
        ),
      legacyCardsHidden: legacyCards.every(node =>
        getComputedStyle(node).opacity === '0' &&
        getComputedStyle(node).pointerEvents === 'none' &&
        node.getAttribute('aria-hidden') === 'true'
      ),
      commandBarPreserved:
        window.__legacyLobbyBarNode === gh.manager.menu.bar.node &&
        window.__legacyLobbyBarNode.isConnected
    };
  });
  expect(modernPresentation).toEqual({
    hostAriaHidden: 'false',
    hostPointerEvents: 'none',
    canvasAriaHidden: 'true',
    canvasPointerEvents: 'none',
    canvasTabIndex: -1,
    hitTargetIsModernSurface: false,
    legacyCardsPreserved: true,
    legacyCardsHidden: true,
    commandBarPreserved: true
  });

  await selectGraphicsMode(page, 'legacy');
  await expect.poll(() => page.evaluate(() => gh.manager.graphics.effectiveMode)).toBe('legacy');
  await expect(page.locator('#menu')).not.toHaveClass(/graphics-modern-hand/);
  await expect(page.locator('#modernLobbyHand')).toHaveAttribute('aria-hidden', 'true');

  expect(await page.evaluate(() => {
    const currentNodes = gh.manager.menu.hand.map(card => card.node);
    return currentNodes.length === 5 &&
      window.__legacyLobbyCardNodes.every((node, index) =>
        node === currentNodes[index] &&
        node.isConnected &&
        node.getAttribute('aria-hidden') === 'false' &&
        getComputedStyle(node).opacity !== '0'
      ) &&
      window.__legacyLobbyBarNode === gh.manager.menu.bar.node &&
      window.__legacyLobbyBarNode.isConnected;
  })).toBe(true);

  await selectGraphicsMode(page, 'modern');
  await expect.poll(() => page.evaluate(() => (
    gh.manager.graphics.surfaceKind === 'lobby-hand' &&
    gh.manager.graphics.surface.getDebugState().ready
  ))).toBe(true);

  await page.evaluate(() => {
    window.__disposedLobbySurface = gh.manager.graphics.surface;
    gh.manager.menu.hide();
  });
  await expect.poll(() => page.evaluate(() => gh.manager.graphics.surfaceKind)).toBe('active-match');
  await expect(page.locator('#modernLobbyHand canvas')).toHaveCount(0);
  await expect(page.locator('#modernGraphics canvas.modern-graphics-canvas')).toHaveCount(1);
  expect(await page.evaluate(() => ({
    disposed: window.__disposedLobbySurface.disposed,
    canvasConnected: window.__disposedLobbySurface.canvas.isConnected,
    lobbyVisible: gh.manager.graphics.lobbyVisible,
    surfaceKind: gh.manager.graphics.surfaceKind
  }))).toEqual({
    disposed: true,
    canvasConnected: false,
    lobbyVisible: false,
    surfaceKind: 'active-match'
  });

  await expect(page.locator('#menu')).toBeHidden();
  await page.evaluate(() => gh.manager.menu.show(() => {}));
  await expect.poll(() => page.evaluate(() => {
    const state = gh.manager.graphics.getState();
    return state.lobbyVisible &&
      state.surfaceKind === 'lobby-hand' &&
      state.surface &&
      state.surface.ready;
  })).toBe(true);
  await expect(page.locator('#modernLobbyHand canvas.modern-lobby-hand-canvas')).toHaveCount(1);
  expect(await page.evaluate(() => gh.manager.graphics.getState().surface.cards.map(card => card.textureUrl)))
    .toEqual(expectedCards.map(card => card.textureUrl));
});

test('restores the intact Legacy lobby when a Modern card texture fails', async ({page}) => {
  await loginWithLegacyGraphics(page);

  await page.evaluate(() => {
    window.__legacyLobbyCardNodes = gh.manager.menu.hand.map(card => card.node);
    const failedCards = gh.manager.menu.currentHandCards.map(card => Object.assign({}, card));
    failedCards[0].textureUrl = '/images/cards/__missing-modern-lobby-test-card__.png';
    gh.manager.graphics.showLobbyHand(failedCards);
  });

  await selectGraphicsMode(page, 'modern');
  await expect.poll(() => page.evaluate(() => {
    const state = gh.manager.graphics.getState();
    return {
      requestedMode: state.requestedMode,
      effectiveMode: state.effectiveMode,
      fallbackReason: state.fallbackReason,
      surfaceKind: state.surfaceKind
    };
  })).toEqual({
    requestedMode: 'modern',
    effectiveMode: 'legacy',
    fallbackReason: 'initialization-failed',
    surfaceKind: null
  });

  await expect(page.locator('#modernLobbyHand canvas')).toHaveCount(0);
  await expect(page.locator('#menu')).not.toHaveClass(/graphics-modern-hand/);
  expect(await page.evaluate(() => (
    gh.manager.menu.hand.length === 5 &&
    window.__legacyLobbyCardNodes.every((node, index) =>
      node === gh.manager.menu.hand[index].node &&
      node.isConnected &&
      node.getAttribute('aria-hidden') === 'false' &&
      getComputedStyle(node).opacity !== '0'
    )
  ))).toBe(true);
});

test('disposes a lost lobby context and falls back to the intact Legacy hand', async ({page}) => {
  await loginWithLegacyGraphics(page);
  await page.evaluate(() => {
    window.__legacyLobbyCardNodes = gh.manager.menu.hand.map(card => card.node);
  });

  await selectGraphicsMode(page, 'modern');
  await expect.poll(() => page.evaluate(() => {
    const state = gh.manager.graphics.getState();
    return state.surfaceKind === 'lobby-hand' && state.surface && state.surface.ready;
  })).toBe(true);

  await page.evaluate(() => {
    window.__lostLobbySurface = gh.manager.graphics.surface;
    window.__lostLobbySurface.canvas.dispatchEvent(
      new Event('webglcontextlost', {cancelable: true})
    );
  });

  await expect.poll(() => page.evaluate(() => {
    const state = gh.manager.graphics.getState();
    return {
      effectiveMode: state.effectiveMode,
      fallbackReason: state.fallbackReason,
      surfaceKind: state.surfaceKind
    };
  })).toEqual({
    effectiveMode: 'legacy',
    fallbackReason: 'initialization-failed',
    surfaceKind: null
  });
  expect(await page.evaluate(() => ({
    disposed: window.__lostLobbySurface.disposed,
    canvasConnected: window.__lostLobbySurface.canvas.isConnected,
    legacyCardsVisible: window.__legacyLobbyCardNodes.every(node =>
      node.isConnected &&
      node.getAttribute('aria-hidden') === 'false' &&
      getComputedStyle(node).opacity !== '0'
    )
  }))).toEqual({
    disposed: true,
    canvasConnected: false,
    legacyCardsVisible: true
  });
});
