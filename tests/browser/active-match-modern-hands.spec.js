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
    game.gameid = 'modern-match-hand-fixture';
    game.isMyTurn = true;
    game.dragging = null;
    game.isDroppable = false;
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

async function waitForModernMatch(page) {
  await expect.poll(() => page.evaluate(() => {
    const state = gh.manager.graphics.getState();
    return state.effectiveMode === 'modern' &&
      state.surfaceKind === 'active-match' &&
      state.surface &&
      state.surface.ready === true;
  })).toBe(true);
}

async function modernLogicalPoint(page, x, y) {
  return page.locator('#modernGraphics').evaluate(
    (host, logicalPoint) => {
      let rect = host.getBoundingClientRect();
      const absoluteX =
        window.scrollX +
        rect.left +
        ((logicalPoint.x / 693) * rect.width);
      const absoluteY =
        window.scrollY +
        rect.top +
        ((logicalPoint.y / 500) * rect.height);
      window.scrollTo(
        Math.max(
          0,
          absoluteX - (window.innerWidth / 2)
        ),
        Math.max(
          0,
          absoluteY - (window.innerHeight / 2)
        )
      );
      rect = host.getBoundingClientRect();
      return {
        x: rect.left + (
          (logicalPoint.x / 693) * rect.width
        ),
        y: rect.top + (
          (logicalPoint.y / 500) * rect.height
        )
      };
    },
    {x, y}
  );
}

async function clickModernLogicalPoint(page, x, y) {
  const point = await modernLogicalPoint(page, x, y);
  await page.mouse.click(point.x, point.y);
  return point;
}

async function moveModernLogicalPoint(page, x, y, options = {}) {
  const point = await modernLogicalPoint(page, x, y);
  await page.mouse.move(point.x, point.y, options);
  return point;
}

test('renders exact pickup-capable player and Closed opponent hands and restores the same Legacy nodes', async ({page}) => {
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
  await waitForModernMatch(page);

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
      projection: 'perspective',
      fov: 40,
      settledPlaneScale: 1
    },
    status: 'ready',
    ready: true,
    interactive: true,
    inputHandlersAttached: true,
    rafActive: false,
    pendingFrameCount: 0,
    pickupPolicy: {
      activation: 'click',
      maxHeld: 1,
      drop: 'not-implemented'
    },
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
    modern.state.surface.cards.slice(0, 5)
      .every(card => card.pickable === true)
  ).toBe(true);
  expect(
    modern.state.surface.cards.slice(5)
      .every(card =>
        card.pickable === false &&
        card.face === 'back' &&
        card.visibleArtKey === 'cardBack' &&
        card.textureUrl === '/images/cards/cardBack.png'
      )
  ).toBe(true);
  expect(JSON.stringify(modern.state.matchHands))
    .not.toContain('opponent-hidden-face');
  expect(cardTextureRequests.join('\n'))
    .not.toContain('opponent-hidden-face');

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

test('click-picks one player card, preserves its grab offset, and settles bounded resistance motion without gameplay mutation', async ({page}) => {
  const moveRequests = [];
  page.on('request', request => {
    const requestUrl = new URL(request.url());
    if (
      request.method() === 'POST' &&
      requestUrl.pathname === '/index/me'
    ) {
      moveRequests.push(request.url());
    }
  });

  await loginWithLegacyGraphics(page);
  await installPassiveMatchFixture(page);
  const legacyBefore = await page.evaluate(() => ({
    playerIds: gh.manager.game.p1h.map(
      item => item.gameCardId
    ),
    opponentIds: gh.manager.game.p2h.map(
      item => item.gameCardId
    ),
    playerPositions: gh.manager.game.p1h.map(item => ({
      x: item.card.attr('x'),
      y: item.card.attr('y')
    })),
    gameId: gh.manager.game.gameid,
    isMyTurn: gh.manager.game.isMyTurn,
    dragging: gh.manager.game.dragging,
    isDroppable: gh.manager.game.isDroppable
  }));

  await selectGraphicsMode(page, 'modern');
  await waitForModernMatch(page);

  const clickLogical = {x: 110, y: 300};
  await clickModernLogicalPoint(
    page,
    clickLogical.x,
    clickLogical.y
  );
  await expect.poll(() => page.evaluate(() => {
    const surface = gh.manager.graphics.getState().surface;
    return surface.heldCard && {
      gameCardId: surface.heldCard.gameCardId,
      phase: surface.heldCard.phase,
      rafActive: surface.rafActive
    };
  })).toEqual({
    gameCardId: 'player-5',
    phase: 'held',
    rafActive: false
  });

  const lifted = await page.evaluate(() => (
    gh.manager.graphics.getState().surface
  ));
  expect(lifted.acceptedPickups).toBe(1);
  expect(lifted.pendingFrameCount).toBe(0);
  expect(lifted.peakPendingFrameCount).toBeLessThanOrEqual(1);
  expect(lifted.heldCard).toMatchObject({
    gameCardId: 'player-5',
    handIndex: 4,
    phase: 'held',
    currentPosition: {
      z: 48
    },
    grabOffset: {
      x: 23.5,
      y: -11
    },
    pointerPosition: clickLogical,
    presentedGrabPoint: clickLogical,
    liftZ: 48,
    rotationRadians: {
      x: 0,
      y: 0,
      z: 0
    }
  });
  expect(lifted.heldCard.perspectiveScale)
    .toBeCloseTo(1.075, 2);
  expect(lifted.heldCard.currentPosition.x)
    .toBeCloseTo(
      clickLogical.x -
        (
          lifted.heldCard.grabOffset.x *
          lifted.heldCard.perspectiveScale
        ),
      6
    );
  expect(lifted.heldCard.currentPosition.y)
    .toBeCloseTo(
      clickLogical.y -
        (
          lifted.heldCard.grabOffset.y *
          lifted.heldCard.perspectiveScale
        ),
      6
    );

  const pointerTarget = {x: 310, y: 100};
  await moveModernLogicalPoint(
    page,
    pointerTarget.x,
    pointerTarget.y,
    {steps: 4}
  );
  await expect.poll(() => page.evaluate(() => {
    const surface = gh.manager.graphics.getState().surface;
    const held = surface && surface.heldCard;
    if (!held) {
      return false;
    }
    const rotation = held.rotationRadians;
    const minimumReadableTilt =
      4 * Math.PI / 180;
    const magnitude = Math.min(
      Math.abs(rotation.x),
      Math.abs(rotation.y)
    );
    if (magnitude >= minimumReadableTilt) {
      window.__modernPickupTiltEvidence = {
        x: rotation.x,
        y: rotation.y
      };
    }
    return Boolean(window.__modernPickupTiltEvidence);
  }), {
    intervals: [10, 20, 30, 50, 80],
    timeout: 2000
  }).toBe(true);

  const observedTilt = await page.evaluate(() => (
    window.__modernPickupTiltEvidence
  ));
  const minimumReadableTiltRadians = 4 * Math.PI / 180;
  const maximumTiltRadians = (10 * Math.PI / 180) + 0.002;
  expect(Math.abs(observedTilt.x))
    .toBeGreaterThanOrEqual(minimumReadableTiltRadians);
  expect(Math.abs(observedTilt.y))
    .toBeGreaterThanOrEqual(minimumReadableTiltRadians);
  expect(Math.abs(observedTilt.x))
    .toBeLessThanOrEqual(maximumTiltRadians);
  expect(Math.abs(observedTilt.y))
    .toBeLessThanOrEqual(maximumTiltRadians);
  expect(observedTilt.x).toBeLessThan(0);
  expect(observedTilt.y).toBeGreaterThan(0);

  const expectedCenter = {
    x:
      pointerTarget.x -
      (
        lifted.heldCard.grabOffset.x *
        lifted.heldCard.perspectiveScale
      ),
    y:
      pointerTarget.y -
      (
        lifted.heldCard.grabOffset.y *
        lifted.heldCard.perspectiveScale
      )
  };
  await expect.poll(() => page.evaluate(
    ({expected, pointer}) => {
    const surface = gh.manager.graphics.getState().surface;
    const held = surface && surface.heldCard;
    if (!held) {
      return false;
    }
    return (
      Math.abs(
        held.currentPosition.x - expected.x
      ) < 0.25 &&
      Math.abs(
        held.currentPosition.y - expected.y
      ) < 0.25 &&
      Math.abs(
        held.presentedGrabPoint.x - pointer.x
      ) < 0.01 &&
      Math.abs(
        held.presentedGrabPoint.y - pointer.y
      ) < 0.01 &&
      Math.max(
        Math.abs(held.rotationRadians.x),
        Math.abs(held.rotationRadians.y)
      ) < 0.001 &&
      surface.rafActive === false &&
      surface.pendingFrameCount === 0
    );
  }, {
    expected: expectedCenter,
    pointer: pointerTarget
  })).toBe(true);
  const settled = await page.evaluate(() => (
    gh.manager.graphics.getState().surface
  ));
  expect(Math.abs(
    settled.heldCard.currentPosition.x - expectedCenter.x
  )).toBeLessThan(0.25);
  expect(Math.abs(
    settled.heldCard.currentPosition.y - expectedCenter.y
  )).toBeLessThan(0.25);
  expect(settled.heldCard.presentedGrabPoint)
    .toEqual(pointerTarget);

  const ignoredBefore = await page.evaluate(() => (
    gh.manager.graphics.getState().surface.ignoredWhileHeld
  ));
  await clickModernLogicalPoint(page, 86.5, 45);
  expect(await page.evaluate(() => {
    const surface = gh.manager.graphics.getState().surface;
    return {
      gameCardId: surface.heldCard.gameCardId,
      ignoredWhileHeld: surface.ignoredWhileHeld
    };
  })).toEqual({
    gameCardId: 'player-5',
    ignoredWhileHeld: ignoredBefore + 1
  });

  const authorityAfter = await page.evaluate(() => ({
    playerIds: gh.manager.game.p1h.map(
      item => item.gameCardId
    ),
    opponentIds: gh.manager.game.p2h.map(
      item => item.gameCardId
    ),
    playerPositions: gh.manager.game.p1h.map(item => ({
      x: item.card.attr('x'),
      y: item.card.attr('y')
    })),
    gameId: gh.manager.game.gameid,
    isMyTurn: gh.manager.game.isMyTurn,
    dragging: gh.manager.game.dragging,
    isDroppable: gh.manager.game.isDroppable,
    playerNodeIdentity:
      window.__matchHandFixture.playerNodes.every(
        (node, index) =>
          node === gh.manager.game.p1h[index].card.node
      ),
    opponentNodeIdentity:
      window.__matchHandFixture.opponentNodes.every(
        (node, index) =>
          node === gh.manager.game.p2h[index].card.node
      )
  }));
  expect(authorityAfter).toMatchObject({
    playerIds: legacyBefore.playerIds,
    opponentIds: legacyBefore.opponentIds,
    playerPositions: legacyBefore.playerPositions,
    gameId: legacyBefore.gameId,
    isMyTurn: legacyBefore.isMyTurn,
    dragging: legacyBefore.dragging,
    isDroppable: legacyBefore.isDroppable,
    playerNodeIdentity: true,
    opponentNodeIdentity: true
  });
  expect(moveRequests).toHaveLength(0);
});

test('opponent and empty clicks are inert while overlap picking selects only the topmost player card', async ({page}) => {
  const moveRequests = [];
  page.on('request', request => {
    const requestUrl = new URL(request.url());
    if (
      request.method() === 'POST' &&
      requestUrl.pathname === '/index/me'
    ) {
      moveRequests.push(request.url());
    }
  });

  await loginWithLegacyGraphics(page);
  await installPassiveMatchFixture(page);
  await selectGraphicsMode(page, 'modern');
  await waitForModernMatch(page);

  await clickModernLogicalPoint(page, 608.5, 311);
  await clickModernLogicalPoint(page, 346.5, 450);
  const inert = await page.evaluate(() => (
    gh.manager.graphics.getState().surface
  ));
  expect(inert).toMatchObject({
    heldCard: null,
    acceptedPickups: 0,
    opponentClicks: 1,
    emptyClicks: 1,
    rafActive: false,
    pendingFrameCount: 0
  });

  // y=100 intersects player cards 1 and 2. Index 1 is painted
  // above index 0 and therefore must own the pickup.
  await clickModernLogicalPoint(page, 86.5, 100);
  await expect.poll(() => page.evaluate(() => {
    const surface = gh.manager.graphics.getState().surface;
    return surface.heldCard &&
      surface.heldCard.phase === 'held'
      ? surface.heldCard.gameCardId
      : null;
  })).toBe('player-2');
  expect(moveRequests).toHaveLength(0);
});

test('pickup follows identical logical movement at every application scale and cleans up across mode and view changes', async ({page}) => {
  const moveRequests = [];
  page.on('request', request => {
    const requestUrl = new URL(request.url());
    if (
      request.method() === 'POST' &&
      requestUrl.pathname === '/index/me'
    ) {
      moveRequests.push(request.url());
    }
  });

  await loginWithLegacyGraphics(page);
  await installPassiveMatchFixture(page);

  for (const scale of [1, 1.5, 2, 3]) {
    await page.evaluate(nextScale => {
      gh.manager.setContentScale(nextScale, false);
      gh.manager.graphics.setMode('modern', false);
    }, scale);
    await waitForModernMatch(page);

    const clickLogical = {x: 110, y: 300};
    const pointerTarget = {x: 330, y: 205};
    await clickModernLogicalPoint(
      page,
      clickLogical.x,
      clickLogical.y
    );
    await expect.poll(() => page.evaluate(() => {
      const surface = gh.manager.graphics.getState().surface;
      return surface.heldCard &&
        surface.heldCard.phase === 'held';
    })).toBe(true);
    await moveModernLogicalPoint(
      page,
      pointerTarget.x,
      pointerTarget.y,
      {steps: 3}
    );

    await expect.poll(() => page.evaluate(pointer => {
      const surface = gh.manager.graphics.getState().surface;
      const held = surface && surface.heldCard;
      if (!held || surface.rafActive) {
        return false;
      }
      return (
        Math.abs(
          held.presentedGrabPoint.x - pointer.x
        ) < 0.25 &&
        Math.abs(
          held.presentedGrabPoint.y - pointer.y
        ) < 0.25 &&
        Math.abs(held.currentPosition.z - 48) < 0.01 &&
        Math.abs(held.rotationRadians.x) < 0.001 &&
        Math.abs(held.rotationRadians.y) < 0.001 &&
        surface.pendingFrameCount === 0
      );
    }, pointerTarget)).toBe(true);

    await page.evaluate(() => {
      gh.manager.graphics.setMode('legacy', false);
    });
    await expect.poll(() => page.evaluate(() => (
      gh.manager.graphics.effectiveMode
    ))).toBe('legacy');
    expect(await page.evaluate(() => {
      const surface = gh.manager.graphics.getState().surface;
      return {
        heldCard: surface.heldCard,
        inputHandlersAttached:
          surface.inputHandlersAttached,
        rafActive: surface.rafActive,
        pendingFrameCount: surface.pendingFrameCount,
        legacyIdentity:
          window.__matchHandFixture.playerNodes.every(
            (node, index) =>
              node === gh.manager.game.p1h[index].card.node
          )
      };
    })).toEqual({
      heldCard: null,
      inputHandlersAttached: false,
      rafActive: false,
      pendingFrameCount: 0,
      legacyIdentity: true
    });
  }

  await page.evaluate(() => {
    gh.manager.graphics.setMode('modern', false);
  });
  await waitForModernMatch(page);
  await clickModernLogicalPoint(page, 110, 300);
  await moveModernLogicalPoint(page, 300, 220);
  await page.evaluate(() => {
    gh.manager.graphics.setActiveMatch(false);
  });
  await expect(
    page.locator('#modernGraphics canvas')
  ).toHaveCount(0);
  expect(await page.evaluate(() => {
    const state = gh.manager.graphics.getState();
    return {
      activeMatchVisible: state.activeMatchVisible,
      surface: state.surface,
      matchHands: state.matchHands
    };
  })).toEqual({
    activeMatchVisible: false,
    surface: null,
    matchHands: {
      player: [],
      opponent: []
    }
  });
  expect(moveRequests).toHaveLength(0);
});

test('reduced motion keeps click-to-carry functional without velocity tilt or a persistent frame', async ({page}) => {
  const moveRequests = [];
  page.on('request', request => {
    const requestUrl = new URL(request.url());
    if (
      request.method() === 'POST' &&
      requestUrl.pathname === '/index/me'
    ) {
      moveRequests.push(request.url());
    }
  });

  await page.emulateMedia({reducedMotion: 'reduce'});
  await loginWithLegacyGraphics(page);
  await installPassiveMatchFixture(page);
  await selectGraphicsMode(page, 'modern');
  await waitForModernMatch(page);

  const clickLogical = {x: 110, y: 300};
  const pointerTarget = {x: 340, y: 230};
  await clickModernLogicalPoint(
    page,
    clickLogical.x,
    clickLogical.y
  );
  await expect.poll(() => page.evaluate(() => {
    const surface = gh.manager.graphics.getState().surface;
    return surface.heldCard &&
      surface.heldCard.phase === 'held'
      ? {
          z: surface.heldCard.currentPosition.z,
          rotation: surface.heldCard.rotationRadians,
          rafActive: surface.rafActive
        }
      : null;
  })).toEqual({
    z: 48,
    rotation: {x: 0, y: 0, z: 0},
    rafActive: false
  });

  await moveModernLogicalPoint(
    page,
    pointerTarget.x,
    pointerTarget.y
  );
  await expect.poll(() => page.evaluate(pointer => {
    const surface = gh.manager.graphics.getState().surface;
    const held = surface && surface.heldCard;
    return Boolean(
      held &&
      Math.abs(
        held.presentedGrabPoint.x - pointer.x
      ) < 0.25 &&
      Math.abs(
        held.presentedGrabPoint.y - pointer.y
      ) < 0.25 &&
      held.rotationRadians.x === 0 &&
      held.rotationRadians.y === 0 &&
      held.rotationRadians.z === 0 &&
      surface.rafActive === false &&
      surface.pendingFrameCount === 0
    );
  }, pointerTarget)).toBe(true);
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
