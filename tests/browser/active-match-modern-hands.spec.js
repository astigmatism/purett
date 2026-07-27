'use strict';

const {test, expect} = require('@playwright/test');

async function loginWithLegacyGraphics(page) {
  await page.goto('/auth/login');
  await page.evaluate(() => {
    window.localStorage.removeItem('purett.graphicsMode.v1');
  });
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
    gh.manager.menu.currentHandCards.length === 5 &&
    gh.manager.game &&
    gh.manager.graphics
  ))).toBe(true);
}

async function selectGraphicsMode(page, mode) {
  await page.locator('#title-icon').click();
  await page.locator(
    `#contextmenu button[data-graphics-mode="${mode}"]`
  ).click();
  await expect.poll(() => page.evaluate(
    expected => gh.manager.graphics.requestedMode === expected,
    mode
  )).toBe(true);
}

async function installPassiveMatchFixture(page, options = {}) {
  await page.evaluate(settings => {
    const game = gh.manager.game;
    const lobbyCards =
      gh.manager.menu.currentHandCards.slice(0, 5);
    const toVisibleArtKey = textureUrl => textureUrl
      .replace(/^\/images\/cards\//, '')
      .replace(/\.png$/, '');

    gh.manager.graphics.setActiveMatch(true);
    gh.manager.menu.hide();
    const wrapper = document.querySelector('#game-wrapper');
    wrapper.classList.remove('hide');
    wrapper.style.display = 'block';
    wrapper.style.zIndex = '50';

    document.querySelector('#svgBoard').replaceChildren();
    document.querySelector('#svgRules').replaceChildren();
    game.cW = 117;
    game.cH = 146;
    game.p1h = [];
    game.p2h = [];
    game.pb = [];
    game.isreplay = true;
    game.buildCanvas();
    game.buildPositions();

    lobbyCards.forEach((card, index) => {
      const legacyImage = toVisibleArtKey(card.textureUrl);
      const visibleImage = index === 0 && settings.failTexture
        ? 'missing-modern-match-hand'
        : (index === 0 && settings.stallTexture
          ? 'stalled-modern-match-hand'
          : legacyImage);
      game.p1h.push({
        gameCardId: `player-${index + 1}`,
        usercardid: `player-user-card-${index + 1}`,
        image: legacyImage,
        visibleImage,
        owner: 'demo',
        purchased: 0,
        card: null,
        x: 0,
        y: 0
      });
      game.p2h.push({
        gameCardId: `opponent-${index + 1}`,
        usercardid: `opponent-user-card-${index + 1}`,
        image: 'cardBack',
        visibleImage: 'cardBack',
        owner: '1',
        purchased: 0,
        card: null,
        x: 0,
        y: 0
      });
    });

    game.drawPlayerOneHand();
    game.drawPlayerTwoHand();
    game.p2h.forEach(item => {
      item.image = 'opponent-hidden-face';
    });
    game.notifyGraphicsHands();
    window.__matchHandFixture = {
      playerNodes: game.p1h.map(item => item.card.node),
      opponentNodes: game.p2h.map(item => item.card.node),
      playerIds: game.p1h.map(item => item.gameCardId),
      opponentIds: game.p2h.map(item => item.gameCardId),
      playerLegacyTextureUrls:
        lobbyCards.map(card => card.textureUrl)
    };
  }, options);
}

test('renders exact passive player and Closed opponent hands and restores the same Legacy nodes', async ({page}) => {
  const moveRequests = [];
  const cardTextureRequests = [];
  page.on('request', request => {
    const requestUrl = new URL(request.url());
    if (requestUrl.pathname.startsWith('/images/cards/')) {
      cardTextureRequests.push(requestUrl.pathname);
    }
    if (
      request.method() === 'POST' &&
      requestUrl.pathname === '/index/me'
    ) {
      moveRequests.push(request.url());
    }
  });

  await loginWithLegacyGraphics(page);
  await installPassiveMatchFixture(page);
  await expect(page.locator('#svgBoard image')).toHaveCount(10);

  await selectGraphicsMode(page, 'modern');
  await expect.poll(() => page.evaluate(() => {
    const state = gh.manager.graphics.getState();
    return state.effectiveMode === 'modern' &&
      state.surfaceKind === 'active-match' &&
      state.surface &&
      state.surface.ready === true;
  })).toBe(true);

  const modern = await page.evaluate(() => {
    const state = gh.manager.graphics.getState();
    const host = document.querySelector('#modernGraphics');
    const message = host.querySelector(
      '.modern-graphics-message'
    );
    return {
      state,
      hostBackground: getComputedStyle(host).backgroundImage,
      hostPointerEvents: getComputedStyle(host).pointerEvents,
      messageDisplay: getComputedStyle(message).display,
      canvasPointerEvents: getComputedStyle(
        host.querySelector('canvas')
      ).pointerEvents
    };
  });

  expect(modern.state.surface).toMatchObject({
    surface: 'active-match-hands',
    logicalWidth: 693,
    logicalHeight: 500,
    camera: {
      projection: 'orthographic',
      left: 0,
      right: 693,
      top: 500,
      bottom: 0
    },
    status: 'ready',
    ready: true,
    interactive: false,
    inputHandlersAttached: false,
    rafActive: false,
    playerCount: 5,
    opponentCount: 5,
    meshCount: 10
  });
  expect(modern.hostBackground).toBe('none');
  expect(modern.hostPointerEvents).toBe('auto');
  expect(modern.canvasPointerEvents).toBe('none');
  expect(modern.messageDisplay).toBe('none');

  const expectedY = [18, 73, 128, 183, 238];
  expect(
    modern.state.surface.cards.map(card => card.screenRect)
  ).toEqual([
    ...expectedY.map(y => ({
      x: 28,
      y,
      width: 117,
      height: 146
    })),
    ...expectedY.map(y => ({
      x: 550,
      y,
      width: 117,
      height: 146
    }))
  ]);
  expect(
    modern.state.surface.cards.map(card => card.rotationDegrees)
  ).toEqual(new Array(10).fill(0));
  expect(
    modern.state.surface.cards.slice(0, 5)
      .map(card => card.zOrder)
  ).toEqual([0, 1, 2, 3, 4]);
  expect(
    modern.state.surface.cards.slice(5)
      .every(card =>
        card.face === 'back' &&
        card.visibleArtKey === 'cardBack' &&
        card.textureUrl === '/images/cards/cardBack.png'
      )
  ).toBe(true);
  expect(JSON.stringify(modern.state.matchHands))
    .not.toContain('opponent-hidden-face');
  expect(cardTextureRequests.join('\n'))
    .not.toContain('opponent-hidden-face');

  await page.locator('#modernGraphics').click({
    position: {x: 86, y: 90}
  });
  expect(moveRequests).toHaveLength(0);
  expect(await page.evaluate(() => ({
    playerIds: gh.manager.game.p1h.map(item => item.gameCardId),
    opponentIds: gh.manager.game.p2h.map(
      item => item.gameCardId
    )
  }))).toEqual({
    playerIds: [
      'player-1',
      'player-2',
      'player-3',
      'player-4',
      'player-5'
    ],
    opponentIds: [
      'opponent-1',
      'opponent-2',
      'opponent-3',
      'opponent-4',
      'opponent-5'
    ]
  });

  await selectGraphicsMode(page, 'legacy');
  await expect.poll(() => page.evaluate(() => (
    gh.manager.graphics.effectiveMode
  ))).toBe('legacy');
  expect(await page.evaluate(() => {
    const fixture = window.__matchHandFixture;
    return fixture.playerNodes.every(
      (node, index) =>
        node === gh.manager.game.p1h[index].card.node &&
        node.isConnected
    ) && fixture.opponentNodes.every(
      (node, index) =>
        node === gh.manager.game.p2h[index].card.node &&
        node.isConnected
    );
  })).toBe(true);
  await expect(page.locator('#svgBoard image')).toHaveCount(10);
  expect(moveRequests).toHaveLength(0);
});

test('fails an incomplete required hand texture open to Legacy without a partial Modern hand', async ({page}) => {
  await loginWithLegacyGraphics(page);
  await installPassiveMatchFixture(page, {
    failTexture: true
  });

  await selectGraphicsMode(page, 'modern');
  await expect.poll(() => page.evaluate(() => {
    const state = gh.manager.graphics.getState();
    return state.requestedMode === 'modern' &&
      state.effectiveMode === 'legacy' &&
      state.fallbackReason === 'initialization-failed';
  })).toBe(true);

  const fallback = await page.evaluate(() => ({
    state: gh.manager.graphics.getState(),
    legacyImageCount:
      document.querySelectorAll('#svgBoard image').length,
    modernCanvasCount:
      document.querySelectorAll('#modernGraphics canvas').length,
    legacyNodeIdentity:
      window.__matchHandFixture.playerNodes.every(
        (node, index) =>
          node === gh.manager.game.p1h[index].card.node
      ),
    legacyImageSourcesValid:
      gh.manager.game.p1h.every((item, index) => {
        const node = item.card.node;
        const actual =
          node.getAttribute('href') ||
          node.getAttributeNS(
            'http://www.w3.org/1999/xlink',
            'href'
          );
        return new URL(actual, window.location.origin).pathname ===
          window.__matchHandFixture.playerLegacyTextureUrls[index];
      })
  }));
  expect(fallback.state).toMatchObject({
    requestedMode: 'modern',
    effectiveMode: 'legacy',
    fallbackReason: 'initialization-failed'
  });
  expect(fallback.legacyImageCount).toBe(10);
  expect(fallback.modernCanvasCount).toBe(0);
  expect(fallback.legacyNodeIdentity).toBe(true);
  expect(fallback.legacyImageSourcesValid).toBe(true);
});

test('does not infer an active match when a non-match view hides the lobby', async ({page}) => {
  await loginWithLegacyGraphics(page);
  await selectGraphicsMode(page, 'modern');
  await expect.poll(() => page.evaluate(() => {
    const state = gh.manager.graphics.getState();
    return state.surfaceKind === 'lobby-hand' &&
      state.surface &&
      state.surface.ready === true;
  })).toBe(true);

  await page.evaluate(() => {
    gh.manager.menu.hide();
  });
  await expect.poll(() => page.evaluate(() => {
    const state = gh.manager.graphics.getState();
    return {
      activeMatchVisible: state.activeMatchVisible,
      surfaceKind: state.surfaceKind,
      matchCardCount:
        state.matchHands.player.length +
        state.matchHands.opponent.length
    };
  })).toEqual({
    activeMatchVisible: false,
    surfaceKind: null,
    matchCardCount: 0
  });
  await expect(
    page.locator(
      '#modernGraphics canvas, #modernLobbyHand canvas'
    )
  ).toHaveCount(0);
});

test('fails a stalled required texture open after the bounded deadline', async ({page}) => {
  let releaseStalledRequest;
  const stalledRequest = new Promise(resolve => {
    releaseStalledRequest = resolve;
  });

  await page.route(
    '**/images/cards/stalled-modern-match-hand.png',
    async route => {
      await stalledRequest;
      await route.abort();
    }
  );
  await loginWithLegacyGraphics(page);
  await installPassiveMatchFixture(page, {
    stallTexture: true
  });

  await selectGraphicsMode(page, 'modern');
  try {
    await expect.poll(() => page.evaluate(() => {
      const state = gh.manager.graphics.getState();
      return state.requestedMode === 'modern' &&
        state.effectiveMode === 'legacy' &&
        state.fallbackReason === 'initialization-failed';
    }), {
      timeout: 12000
    }).toBe(true);
  } finally {
    releaseStalledRequest();
  }

  expect(await page.evaluate(() => ({
    modernCanvasCount:
      document.querySelectorAll('#modernGraphics canvas').length,
    legacyImageCount:
      document.querySelectorAll('#svgBoard image').length
  }))).toEqual({
    modernCanvasCount: 0,
    legacyImageCount: 10
  });
});
