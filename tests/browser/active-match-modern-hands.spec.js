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
    game.isMyTurn = settings.isMyTurn !== false;
    game.dragging = null;
    game.isDroppable = false;
    game.isreplay = true;
    game.buildCanvas();
    game.buildPositions();
    game.pb = game.pbp.slice(1).map(position => ({
      gameCardId: 0,
      image: null,
      visibleImage: null,
      captured: null,
      owner: null,
      usercardid: null,
      card: null,
      rect: null,
      elementId: -1,
      element: null,
      bonus: 0,
      bonusObject: null,
      x: position.x,
      y: position.y
    }));
    (settings.occupiedSlots || []).forEach(slotIndex => {
      if (game.pb[slotIndex]) {
        game.pb[slotIndex].gameCardId =
          900 + slotIndex;
        game.pb[slotIndex].image = 'cardBack';
        game.pb[slotIndex].visibleImage = 'cardBack';
        game.pb[slotIndex].owner = '1';
      }
    });

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

    game.drawBoardDrops();
    game.drawPlayerOneHand();
    game.drawPlayerTwoHand();
    game.enableBoard(settings.boardEnabled !== false);
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
        lobbyCards.map(card => card.textureUrl),
      boardNodes: game.pb.map(item =>
        item.rect ? item.rect.node : null
      ),
      boardEnabled: game.boardEnabled,
      isMyTurn: game.isMyTurn
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

async function installControlledMatchFrameClock(page) {
  await page.evaluate(() => {
    const originalRequestAnimationFrame =
      window.requestAnimationFrame;
    const originalCancelAnimationFrame =
      window.cancelAnimationFrame;
    const callbacks = new Map();
    const cancelledCallbacks = [];
    let nextFrameId = 1;

    window.__modernMatchFrameClock = {
      advance(timestamp) {
        const queued = Array.from(
          callbacks.entries()
        );
        callbacks.clear();
        queued.forEach(([, callback]) => {
          callback(timestamp);
        });
        return queued.length;
      },
      pending() {
        return callbacks.size;
      },
      runLastCancelled(timestamp) {
        const callback =
          cancelledCallbacks[
            cancelledCallbacks.length - 1
          ];
        if (callback) {
          callback(timestamp);
        }
        return Boolean(callback);
      },
      restore() {
        callbacks.clear();
        window.requestAnimationFrame =
          originalRequestAnimationFrame;
        window.cancelAnimationFrame =
          originalCancelAnimationFrame;
      }
    };
    window.requestAnimationFrame = callback => {
      const frameId = nextFrameId;
      nextFrameId += 1;
      callbacks.set(frameId, callback);
      return frameId;
    };
    window.cancelAnimationFrame = frameId => {
      const callback = callbacks.get(frameId);
      if (callback) {
        cancelledCallbacks.push(callback);
      }
      callbacks.delete(frameId);
    };
  });
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
      drop: 'second-click-valid-zone-preview-otherwise-invalid',
      dropZoneCount: 9,
      validPlacement: {
        durationMs: 300,
        easing: 'cubic-out',
        reversePickupLift: true,
        exactSlotCenter: true,
        positionJitter: false,
        screenRotationRangeDegrees: [-2, 2],
        oneRendererLocalPlacementPerSnapshot: true,
        submitted: false
      },
      invalidReturn: {
        durationMs: 300,
        easing: 'cubic-out',
        screenDirection: 'clockwise',
        exactHandSettlement: true
      }
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

test('shows one exact Legacy drop shadow while a carried card hovers a valid empty slot, including during lift', async ({page}) => {
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
  await installPassiveMatchFixture(page, {
    occupiedSlots: [4]
  });
  await selectGraphicsMode(page, 'modern');
  await waitForModernMatch(page);

  const initial = await page.evaluate(() => {
    const surface =
      gh.manager.graphics.getState().surface;
    return {
      dropZones: surface.dropZones.map(zone => ({
        slotIndex: zone.slotIndex,
        x: zone.x,
        y: zone.y,
        width: zone.width,
        height: zone.height,
        cornerRadius: zone.cornerRadius,
        available: zone.available,
        valid: zone.valid,
        hovered: zone.hovered,
        visible: zone.visible
      })),
      hoveredDropZone:
        surface.hoveredDropZone,
      visibleDropZoneCount:
        surface.visibleDropZoneCount
    };
  });
  const expectedPositions = [
    [172, 35],
    [289, 35],
    [406, 35],
    [172, 181],
    [289, 181],
    [406, 181],
    [172, 327],
    [289, 327],
    [406, 327]
  ];
  expect(initial.dropZones).toEqual(
    expectedPositions.map(([x, y], slotIndex) => ({
      slotIndex,
      x,
      y,
      width: 117,
      height: 146,
      cornerRadius: 10,
      available: slotIndex !== 4,
      valid: slotIndex !== 4,
      hovered: false,
      visible: false
    }))
  );
  expect(initial).toMatchObject({
    hoveredDropZone: null,
    visibleDropZoneCount: 0
  });

  await installControlledMatchFrameClock(page);
  await clickModernLogicalPoint(page, 110, 300);
  await expect.poll(() => page.evaluate(() => {
    const surface =
      gh.manager.graphics.getState().surface;
    return surface.heldCard &&
      surface.heldCard.phase === 'lifting' &&
      surface.heldCard.dropArmed === false;
  })).toBe(true);

  await moveModernLogicalPoint(page, 230.5, 108);
  await expect.poll(() => page.evaluate(() => {
    const surface =
      gh.manager.graphics.getState().surface;
    return {
      hoveredSlot: surface.hoveredDropZone
        ? surface.hoveredDropZone.slotIndex
        : null,
      heldPhase: surface.heldCard.phase,
      dropArmed: surface.heldCard.dropArmed,
      visibleDropZoneCount:
        surface.visibleDropZoneCount,
      visibleSlots: surface.dropZones
        .filter(zone => zone.visible)
        .map(zone => zone.slotIndex)
    };
  })).toEqual({
    hoveredSlot: 0,
    heldPhase: 'lifting',
    dropArmed: false,
    visibleDropZoneCount: 1,
    visibleSlots: [0]
  });

  // Hover starts with Legacy's dragging state, but placement remains
  // guarded by the original 300 ms pickup deadline.
  await page.evaluate(() => {
    const surface = gh.manager.graphics.surface;
    const beginValidPlacement =
      surface.beginValidPlacement;
    const earlyTimestamp =
      surface.heldCard.liftStartedAt + 100;
    surface.beginValidPlacement = function(zone) {
      surface.beginValidPlacement =
        beginValidPlacement;
      return beginValidPlacement.call(
        surface,
        zone,
        earlyTimestamp
      );
    };
  });
  await clickModernLogicalPoint(page, 230.5, 108);
  expect(await page.evaluate(() => {
    const surface =
      gh.manager.graphics.getState().surface;
    return {
      phase: surface.heldCard.phase,
      dropArmed: surface.heldCard.dropArmed,
      ignoredUnarmedPlacements:
        surface.ignoredUnarmedPlacements,
      acceptedValidPlacements:
        surface.acceptedValidPlacements
    };
  })).toEqual({
    phase: 'lifting',
    dropArmed: false,
    ignoredUnarmedPlacements: 1,
    acceptedValidPlacements: 0
  });

  // Slot four is occupied in the fixture and therefore can never
  // produce a Modern drop shadow.
  await moveModernLogicalPoint(page, 347.5, 254);
  await expect.poll(() => page.evaluate(() => {
    const surface =
      gh.manager.graphics.getState().surface;
    return {
      hoveredDropZone: surface.hoveredDropZone,
      visibleDropZoneCount:
        surface.visibleDropZoneCount
    };
  })).toEqual({
    hoveredDropZone: null,
    visibleDropZoneCount: 0
  });

  // The rectangles use half-open hit bounds, so the shared x=289
  // boundary belongs to slot one rather than slot zero.
  await moveModernLogicalPoint(page, 289, 108);
  await expect.poll(() => page.evaluate(() => (
    gh.manager.graphics.getState().surface
      .hoveredDropZone
  ))).toMatchObject({
    slotIndex: 1
  });

  await moveModernLogicalPoint(page, 620, 420);
  await expect.poll(() => page.evaluate(() => {
    const surface =
      gh.manager.graphics.getState().surface;
    return {
      hoveredDropZone: surface.hoveredDropZone,
      visibleDropZoneCount:
        surface.visibleDropZoneCount
    };
  })).toEqual({
    hoveredDropZone: null,
    visibleDropZoneCount: 0
  });
  await page.evaluate(() => {
    gh.manager.graphics.surface.cancelPickup(
      'test-cleanup',
      false
    );
    window.__modernMatchFrameClock.restore();
  });
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

test('a second click at the pickup deadline arms and starts return before the delayed pickup frame arrives', async ({page}) => {
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
  await installControlledMatchFrameClock(page);

  const clickLogical = {x: 110, y: 300};
  await clickModernLogicalPoint(
    page,
    clickLogical.x,
    clickLogical.y
  );
  const beforeDeadlineClick = await page.evaluate(() => {
    const surface =
      gh.manager.graphics.getState().surface;
    return {
      surface,
      queuedFrames:
        window.__modernMatchFrameClock.pending()
    };
  });
  expect(beforeDeadlineClick.surface).toMatchObject({
    acceptedPickups: 1,
    acceptedInvalidReturns: 0,
    ignoredUnarmedReturns: 0,
    frameCount: 0,
    pendingFrameCount: 1,
    heldCard: {
      gameCardId: 'player-5',
      phase: 'lifting',
      dropArmed: false,
      currentPosition: {
        z: 0
      }
    }
  });
  expect(beforeDeadlineClick.queuedFrames).toBe(1);

  // Keep the real click path, but make its one timing argument
  // deterministic at the exact 300 ms pickup boundary.
  await page.evaluate(() => {
    const surface = gh.manager.graphics.surface;
    const beginInvalidReturn =
      surface.beginInvalidReturn;
    const boundaryTimestamp =
      surface.heldCard.liftStartedAt + 300;
    surface.beginInvalidReturn = function() {
      surface.beginInvalidReturn =
        beginInvalidReturn;
      return beginInvalidReturn.call(
        surface,
        boundaryTimestamp
      );
    };
  });
  await clickModernLogicalPoint(
    page,
    clickLogical.x,
    clickLogical.y
  );

  const returning = await page.evaluate(() => {
    const surface =
      gh.manager.graphics.getState().surface;
    return {
      surface,
      queuedFrames:
        window.__modernMatchFrameClock.pending()
    };
  });
  expect(returning.surface).toMatchObject({
    acceptedInvalidReturns: 1,
    ignoredUnarmedReturns: 0,
    frameCount: 1,
    pendingFrameCount: 1,
    heldCard: {
      gameCardId: 'player-5',
      phase: 'returning',
      dropArmed: false,
      currentPosition: {
        z: 48
      },
      rotationRadians: {
        x: 0,
        y: 0,
        z: 0
      },
      returnMotion: {
        progress: 0,
        easedProgress: 0,
        start: {
          depth: 48,
          tiltX: 0,
          tiltY: 0,
          rotationZ: 0
        }
      }
    }
  });
  expect(returning.surface.heldCard.returnMotion.start.x)
    .toBeCloseTo(
      returning.surface.heldCard.currentPosition.x,
      8
    );
  expect(returning.surface.heldCard.returnMotion.start.y)
    .toBeCloseTo(
      returning.surface.heldCard.currentPosition.y,
      8
    );
  expect(
    returning.surface.heldCard.returnMotion.start
      .projectedScale
  ).toBeCloseTo(
    returning.surface.pickupPolicy
      .projectedLiftScale,
    8
  );
  expect(returning.queuedFrames).toBe(1);

  const returnStartedAt =
    returning.surface.heldCard.returnMotion
      .startedAt;
  expect(await page.evaluate(timestamp => (
    window.__modernMatchFrameClock
      .runLastCancelled(timestamp)
  ), returnStartedAt)).toBe(true);
  const afterStalePickupFrame =
    await page.evaluate(() => {
      const surface =
        gh.manager.graphics.getState().surface;
      return {
        phase: surface.heldCard.phase,
        progress:
          surface.heldCard.returnMotion.progress,
        frameCount: surface.frameCount,
        pendingFrameCount:
          surface.pendingFrameCount,
        queuedFrames:
          window.__modernMatchFrameClock.pending()
      };
    });
  expect(afterStalePickupFrame).toEqual({
    phase: 'returning',
    progress: 0,
    frameCount: 1,
    pendingFrameCount: 1,
    queuedFrames: 1
  });

  expect(await page.evaluate(timestamp => (
    window.__modernMatchFrameClock.advance(timestamp)
  ), returnStartedAt + 300)).toBe(1);
  const completed = await page.evaluate(() => {
    const surface =
      gh.manager.graphics.getState().surface;
    return {
      heldCard: surface.heldCard,
      completedInvalidReturns:
        surface.completedInvalidReturns,
      pendingFrameCount: surface.pendingFrameCount,
      rafActive: surface.rafActive,
      returnedCard: surface.cards.find(
        card => card.gameCardId === 'player-5'
      )
    };
  });
  expect(completed).toMatchObject({
    heldCard: null,
    completedInvalidReturns: 1,
    pendingFrameCount: 0,
    rafActive: false,
    returnedCard: {
      currentPosition: {
        x: 86.5,
        y: 311,
        z: 0
      },
      rotationRadians: {
        x: 0,
        y: 0,
        z: 0
      },
      held: false
    }
  });
  await page.evaluate(() => {
    window.__modernMatchFrameClock.restore();
  });
  expect(moveRequests).toHaveLength(0);
});

test('second click runs the Legacy cubic-out clockwise invalid return and restores the exact hand pose', async ({page}) => {
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
  const authorityBefore = await page.evaluate(() => ({
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
  await installControlledMatchFrameClock(page);
  await clickModernLogicalPoint(
    page,
    clickLogical.x,
    clickLogical.y
  );
  const lifting = await page.evaluate(() => (
    gh.manager.graphics.getState().surface
  ));
  expect(lifting.heldCard).toMatchObject({
    gameCardId: 'player-5',
    phase: 'lifting',
    dropArmed: false
  });
  expect(lifting.pendingFrameCount).toBe(1);

  await clickModernLogicalPoint(
    page,
    clickLogical.x,
    clickLogical.y
  );
  const unarmed = await page.evaluate(() => (
    gh.manager.graphics.getState().surface
  ));
  expect(unarmed).toMatchObject({
    acceptedInvalidReturns: 0,
    ignoredUnarmedReturns: 1,
    ignoredWhileHeld: 1,
    pendingFrameCount: 1
  });
  expect(unarmed.heldCard).toMatchObject({
    gameCardId: 'player-5',
    phase: 'lifting',
    dropArmed: false
  });

  const liftStartedAt =
    unarmed.heldCard.liftStartedAt;
  expect(await page.evaluate(timestamp => (
    window.__modernMatchFrameClock.advance(timestamp)
  ), liftStartedAt)).toBe(1);
  expect(await page.evaluate(timestamp => (
    window.__modernMatchFrameClock.advance(timestamp)
  ), liftStartedAt + 300)).toBe(1);
  const armed = await page.evaluate(() => (
    gh.manager.graphics.getState().surface
  ));
  expect(armed.heldCard).toMatchObject({
    phase: 'held',
    dropArmed: true,
    currentPosition: {
      z: 48
    },
    rotationRadians: {
      x: 0,
      y: 0,
      z: 0
    }
  });
  expect(armed.rafActive).toBe(false);
  expect(armed.pendingFrameCount).toBe(0);
  await page.evaluate(() => {
    window.__modernMatchFrameClock.restore();
  });

  const pointerTarget = {x: 620, y: 420};
  await moveModernLogicalPoint(
    page,
    pointerTarget.x,
    pointerTarget.y,
    {steps: 4}
  );
  await expect.poll(() => page.evaluate(pointer => {
    const surface =
      gh.manager.graphics.getState().surface;
    const held = surface && surface.heldCard;
    return Boolean(
      held &&
      held.phase === 'held' &&
      held.dropArmed === true &&
      Math.abs(
        held.presentedGrabPoint.x - pointer.x
      ) < 0.01 &&
      Math.abs(
        held.presentedGrabPoint.y - pointer.y
      ) < 0.01 &&
      surface.rafActive === false
    );
  }, pointerTarget)).toBe(true);
  const heldBeforeReturn = await page.evaluate(() => (
    gh.manager.graphics.getState().surface
  ));

  await installControlledMatchFrameClock(page);
  await clickModernLogicalPoint(
    page,
    pointerTarget.x,
    pointerTarget.y
  );
  const returning = await page.evaluate(() => (
    gh.manager.graphics.getState().surface
  ));
  expect(returning).toMatchObject({
    acceptedInvalidReturns: 1,
    completedInvalidReturns: 0,
    pendingFrameCount: 1
  });
  expect(returning.pickupPolicy).toMatchObject({
    drop: 'second-click-valid-zone-preview-otherwise-invalid',
    dropZoneCount: 9,
    validPlacement: {
      durationMs: 300,
      easing: 'cubic-out',
      reversePickupLift: true,
      exactSlotCenter: true,
      positionJitter: false,
      screenRotationRangeDegrees: [-2, 2],
      oneRendererLocalPlacementPerSnapshot: true,
      submitted: false
    },
    invalidReturn: {
      durationMs: 300,
      easing: 'cubic-out',
      screenDirection: 'clockwise',
      exactHandSettlement: true
    }
  });
  expect(returning.heldCard).toMatchObject({
    gameCardId: 'player-5',
    phase: 'returning',
    dropArmed: false,
    returnMotion: {
      durationMs: 300,
      easing: 'cubic-out',
      screenDirection: 'clockwise',
      progress: 0,
      easedProgress: 0,
      destination: {
        x: 86.5,
        y: 311,
        depth: 0,
        projectedScale: 1,
        tiltX: 0,
        tiltY: 0,
        normalizedRotationZ: 0
      }
    },
    renderOrder: {
      shadow: 112,
      body: 113,
      face: 114
    }
  });
  expect(returning.heldCard.returnMotion.start.x)
    .toBeCloseTo(
      heldBeforeReturn.heldCard.currentPosition.x,
      8
    );
  expect(returning.heldCard.returnMotion.start.y)
    .toBeCloseTo(
      heldBeforeReturn.heldCard.currentPosition.y,
      8
    );
  expect(
    returning.heldCard.returnMotion.destination
      .unwrappedRotationZ
  ).toBeCloseTo(-2 * Math.PI, 8);

  const returnStartedAt =
    returning.heldCard.returnMotion.startedAt;
  expect(await page.evaluate(timestamp => (
    window.__modernMatchFrameClock.advance(timestamp)
  ), returnStartedAt)).toBe(1);
  const zeroFrame = await page.evaluate(() => (
    gh.manager.graphics.getState().surface
  ));
  expect(zeroFrame.heldCard.returnMotion.progress)
    .toBe(0);
  expect(zeroFrame.heldCard.currentPosition.x)
    .toBeCloseTo(
      returning.heldCard.returnMotion.start.x,
      8
    );
  expect(zeroFrame.heldCard.currentPosition.y)
    .toBeCloseTo(
      returning.heldCard.returnMotion.start.y,
      8
    );
  expect(zeroFrame.heldCard.currentPosition.z)
    .toBeCloseTo(
      returning.heldCard.returnMotion.start.depth,
      8
    );

  expect(await page.evaluate(timestamp => (
    window.__modernMatchFrameClock.advance(timestamp)
  ), returnStartedAt + 150)).toBe(1);
  const midpoint = await page.evaluate(() => (
    gh.manager.graphics.getState().surface
  ));
  const easedMidpoint = 0.875;
  const returnStart =
    returning.heldCard.returnMotion.start;
  const returnDestination =
    returning.heldCard.returnMotion.destination;
  const expectedMidpoint = {
    x:
      returnStart.x +
      (
        returnDestination.x -
        returnStart.x
      ) *
      easedMidpoint,
    y:
      returnStart.y +
      (
        returnDestination.y -
        returnStart.y
      ) *
      easedMidpoint,
    projectedScale:
      returnStart.projectedScale +
      (
        1 -
        returnStart.projectedScale
      ) *
      easedMidpoint,
    rotationZ:
      returnStart.rotationZ -
      (2 * Math.PI * easedMidpoint)
  };
  expect(midpoint.heldCard.returnMotion.progress)
    .toBeCloseTo(0.5, 8);
  expect(midpoint.heldCard.returnMotion.easedProgress)
    .toBeCloseTo(easedMidpoint, 8);
  expect(midpoint.heldCard.currentPosition.x)
    .toBeCloseTo(expectedMidpoint.x, 8);
  expect(midpoint.heldCard.currentPosition.y)
    .toBeCloseTo(expectedMidpoint.y, 8);
  expect(midpoint.heldCard.perspectiveScale)
    .toBeCloseTo(
      expectedMidpoint.projectedScale,
      8
    );
  expect(midpoint.heldCard.rotationRadians.z)
    .toBeCloseTo(expectedMidpoint.rotationZ, 8);
  expect(midpoint.heldCard.rotationRadians.z)
    .toBeLessThan(0);
  expect(midpoint.pendingFrameCount).toBe(1);

  const midpointPose =
    midpoint.heldCard.returnMotion.current;
  await moveModernLogicalPoint(page, 600, 420);
  await clickModernLogicalPoint(
    page,
    pointerTarget.x,
    pointerTarget.y
  );
  const locked = await page.evaluate(() => (
    gh.manager.graphics.getState().surface
  ));
  expect(locked).toMatchObject({
    acceptedInvalidReturns: 1,
    completedInvalidReturns: 0,
    ignoredWhileReturning: 1,
    pendingFrameCount: 1
  });
  expect(locked.heldCard.phase).toBe('returning');
  expect(locked.heldCard.returnMotion.current)
    .toEqual(midpointPose);

  expect(await page.evaluate(timestamp => (
    window.__modernMatchFrameClock.advance(timestamp)
  ), returnStartedAt + 300)).toBe(1);
  const completed = await page.evaluate(() => {
    const surface =
      gh.manager.graphics.getState().surface;
    return {
      surface,
      returnedCard: surface.cards.find(
        card => card.gameCardId === 'player-5'
      )
    };
  });
  expect(completed.surface).toMatchObject({
    heldCard: null,
    acceptedInvalidReturns: 1,
    completedInvalidReturns: 1,
    rafActive: false,
    pendingFrameCount: 0,
    semanticActionCount: 0,
    requestCount: 0,
    lastReturn: {
      outcome: 'completed',
      completion: 'animation',
      gameCardId: 'player-5',
      handIndex: 4,
      durationMs: 300,
      easing: 'cubic-out',
      screenDirection: 'clockwise',
      reducedMotion: false,
      finalPose: {
        x: 86.5,
        y: 311,
        depth: 0,
        projectedScale: 1,
        rotationRadians: {
          x: 0,
          y: 0,
          z: 0
        }
      }
    }
  });
  expect(completed.returnedCard).toMatchObject({
    screenRect: {
      x: 28,
      y: 238,
      width: 117,
      height: 146
    },
    currentPosition: {
      x: 86.5,
      y: 311,
      z: 0
    },
    rotationRadians: {
      x: 0,
      y: 0,
      z: 0
    },
    held: false,
    pickable: true
  });
  expect(await page.evaluate(() => (
    window.__modernMatchFrameClock.pending()
  ))).toBe(0);
  await page.evaluate(() => {
    window.__modernMatchFrameClock.restore();
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
    isDroppable: gh.manager.game.isDroppable
  }));
  expect(authorityAfter).toEqual(authorityBefore);
  expect(moveRequests).toHaveLength(0);

  await clickModernLogicalPoint(
    page,
    clickLogical.x,
    clickLogical.y
  );
  await expect.poll(() => page.evaluate(() => {
    const surface =
      gh.manager.graphics.getState().surface;
    return surface.heldCard &&
      surface.heldCard.phase === 'held'
      ? surface.acceptedPickups
      : null;
  })).toBe(2);
});

test('valid second click reverses the lift into one renderer-local askew board placement without gameplay authority', async ({page}) => {
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
  const authorityBefore = await page.evaluate(() => ({
    playerIds: gh.manager.game.p1h.map(
      item => item.gameCardId
    ),
    playerPositions: gh.manager.game.p1h.map(item => ({
      x: item.card.attr('x'),
      y: item.card.attr('y')
    })),
    boardIds: gh.manager.game.pb.map(
      item => item.gameCardId
    ),
    boardEnabled: gh.manager.game.boardEnabled,
    isMyTurn: gh.manager.game.isMyTurn,
    dragging: gh.manager.game.dragging,
    isDroppable: gh.manager.game.isDroppable
  }));
  await selectGraphicsMode(page, 'modern');
  await waitForModernMatch(page);
  await page.evaluate(() => {
    gh.manager.graphics.surface.randomSource =
      () => 0.75;
  });

  await clickModernLogicalPoint(page, 110, 300);
  await expect.poll(() => page.evaluate(() => {
    const surface =
      gh.manager.graphics.getState().surface;
    return surface.heldCard &&
      surface.heldCard.phase === 'held' &&
      surface.heldCard.dropArmed === true;
  })).toBe(true);

  const target = {x: 347.5, y: 254};
  await moveModernLogicalPoint(
    page,
    target.x,
    target.y,
    {steps: 4}
  );
  await expect.poll(() => page.evaluate(pointer => {
    const surface =
      gh.manager.graphics.getState().surface;
    const held = surface && surface.heldCard;
    return Boolean(
      held &&
      held.phase === 'held' &&
      held.dropArmed === true &&
      Math.abs(
        held.presentedGrabPoint.x - pointer.x
      ) < 0.01 &&
      Math.abs(
        held.presentedGrabPoint.y - pointer.y
      ) < 0.01 &&
      surface.hoveredDropZone &&
      surface.hoveredDropZone.slotIndex === 4 &&
      surface.visibleDropZoneCount === 1 &&
      surface.rafActive === false
    );
  }, target)).toBe(true);

  await installControlledMatchFrameClock(page);
  await clickModernLogicalPoint(
    page,
    target.x,
    target.y
  );
  const placing = await page.evaluate(() => (
    gh.manager.graphics.getState().surface
  ));
  expect(placing).toMatchObject({
    acceptedValidPlacements: 1,
    completedValidPlacements: 0,
    acceptedInvalidReturns: 0,
    hoveredDropZone: null,
    visibleDropZoneCount: 0,
    localPreviewPlacement: null,
    pendingFrameCount: 1,
    semanticActionCount: 0,
    requestCount: 0
  });
  expect(placing.heldCard).toMatchObject({
    gameCardId: 'player-5',
    handIndex: 4,
    phase: 'placing',
    dropArmed: false,
    placementMotion: {
      slotIndex: 4,
      durationMs: 300,
      easing: 'cubic-out',
      progress: 0,
      easedProgress: 0,
      screenRotationDegrees: 1,
      destination: {
        x: target.x,
        y: target.y,
        depth: 0,
        projectedScale: 1,
        tiltX: 0,
        tiltY: 0,
        rotationZ: -(Math.PI / 180)
      }
    }
  });
  const motion = placing.heldCard.placementMotion;

  expect(await page.evaluate(timestamp => (
    window.__modernMatchFrameClock.advance(timestamp)
  ), motion.startedAt)).toBe(1);
  expect(await page.evaluate(timestamp => (
    window.__modernMatchFrameClock.advance(timestamp)
  ), motion.startedAt + 150)).toBe(1);
  const midpoint = await page.evaluate(() => (
    gh.manager.graphics.getState().surface
  ));
  const easedMidpoint = 0.875;
  expect(midpoint.heldCard).toMatchObject({
    phase: 'placing',
    placementMotion: {
      progress: 0.5,
      easedProgress: easedMidpoint
    }
  });
  expect(midpoint.heldCard.currentPosition.x)
    .toBeCloseTo(
      motion.start.x +
        (
          motion.destination.x -
          motion.start.x
        ) *
        easedMidpoint,
      8
    );
  expect(midpoint.heldCard.currentPosition.y)
    .toBeCloseTo(
      motion.start.y +
        (
          motion.destination.y -
          motion.start.y
        ) *
        easedMidpoint,
      8
    );
  expect(midpoint.heldCard.perspectiveScale)
    .toBeCloseTo(
      motion.start.projectedScale +
        (
          1 -
          motion.start.projectedScale
        ) *
        easedMidpoint,
      8
    );
  expect(midpoint.heldCard.rotationRadians.z)
    .toBeCloseTo(
      motion.start.rotationZ +
        (
          motion.destination.rotationZ -
          motion.start.rotationZ
        ) *
        easedMidpoint,
      8
    );

  const midpointPose =
    midpoint.heldCard.placementMotion.current;
  await moveModernLogicalPoint(page, 620, 420);
  await clickModernLogicalPoint(
    page,
    target.x,
    target.y
  );
  const locked = await page.evaluate(() => (
    gh.manager.graphics.getState().surface
  ));
  expect(locked).toMatchObject({
    acceptedValidPlacements: 1,
    completedValidPlacements: 0,
    ignoredWhilePlacing: 1,
    pendingFrameCount: 1
  });
  expect(locked.heldCard.phase).toBe('placing');
  expect(locked.heldCard.placementMotion.current)
    .toEqual(midpointPose);

  expect(await page.evaluate(timestamp => (
    window.__modernMatchFrameClock.advance(timestamp)
  ), motion.startedAt + 300)).toBe(1);
  const completed = await page.evaluate(() => {
    const surface =
      gh.manager.graphics.getState().surface;
    return {
      surface,
      placedCard: surface.cards.find(
        card => card.gameCardId === 'player-5'
      )
    };
  });
  expect(completed.surface).toMatchObject({
    heldCard: null,
    acceptedValidPlacements: 1,
    completedValidPlacements: 1,
    acceptedInvalidReturns: 0,
    visibleDropZoneCount: 0,
    rafActive: false,
    pendingFrameCount: 0,
    semanticActionCount: 0,
    requestCount: 0,
    localPreviewPlacement: {
      gameCardId: 'player-5',
      handIndex: 4,
      slotIndex: 4,
      finalPose: {
        x: target.x,
        y: target.y,
        depth: 0,
        projectedScale: 1,
        screenRotationDegrees: 1,
        rotationRadians: {
          x: 0,
          y: 0,
          z: -(Math.PI / 180)
        }
      }
    },
    lastPlacement: {
      outcome: 'completed',
      completion: 'animation',
      gameCardId: 'player-5',
      handIndex: 4,
      slotIndex: 4,
      durationMs: 300,
      easing: 'cubic-out',
      screenRotationDegrees: 1,
      reducedMotion: false
    }
  });
  expect(completed.placedCard).toMatchObject({
    currentPosition: {
      x: target.x,
      y: target.y,
      z: 0
    },
    rotationRadians: {
      x: 0,
      y: 0,
      z: -(Math.PI / 180)
    },
    held: false,
    placed: true,
    placedSlotIndex: 4,
    pickable: false
  });
  expect(await page.evaluate(() => (
    window.__modernMatchFrameClock.pending()
  ))).toBe(0);
  await page.evaluate(() => {
    window.__modernMatchFrameClock.restore();
  });

  await clickModernLogicalPoint(page, 86.5, 100);
  expect(await page.evaluate(() => {
    const surface =
      gh.manager.graphics.getState().surface;
    return {
      heldCard: surface.heldCard,
      acceptedPickups: surface.acceptedPickups,
      ignoredAfterPlacement:
        surface.ignoredAfterPlacement
    };
  })).toEqual({
    heldCard: null,
    acceptedPickups: 1,
    ignoredAfterPlacement: 1
  });

  const authorityAfter = await page.evaluate(() => ({
    playerIds: gh.manager.game.p1h.map(
      item => item.gameCardId
    ),
    playerPositions: gh.manager.game.p1h.map(item => ({
      x: item.card.attr('x'),
      y: item.card.attr('y')
    })),
    boardIds: gh.manager.game.pb.map(
      item => item.gameCardId
    ),
    boardEnabled: gh.manager.game.boardEnabled,
    isMyTurn: gh.manager.game.isMyTurn,
    dragging: gh.manager.game.dragging,
    isDroppable: gh.manager.game.isDroppable
  }));
  expect(authorityAfter).toEqual(authorityBefore);
  expect(moveRequests).toHaveLength(0);

  await page.evaluate(() => {
    gh.manager.graphics.setMode('legacy', false);
  });
  await expect.poll(() => page.evaluate(() => (
    gh.manager.graphics.effectiveMode
  ))).toBe('legacy');
  const reset = await page.evaluate(() => {
    const surface =
      gh.manager.graphics.getState().surface;
    return {
      localPreviewPlacement:
        surface.localPreviewPlacement,
      card: surface.cards.find(
        item => item.gameCardId === 'player-5'
      )
    };
  });
  expect(reset.localPreviewPlacement).toBeNull();
  expect(reset.card).toMatchObject({
    currentPosition: {
      x: 86.5,
      y: 311,
      z: 0
    },
    rotationRadians: {
      x: 0,
      y: 0,
      z: 0
    },
    held: false,
    placed: false,
    pickable: true
  });
});

test('mode and view lifecycle cancellation reject stale invalid-return frames and restore the exact hand', async ({page}) => {
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

  const clickLogical = {x: 110, y: 300};
  const pointerTarget = {x: 620, y: 420};
  await clickModernLogicalPoint(
    page,
    clickLogical.x,
    clickLogical.y
  );
  await expect.poll(() => page.evaluate(() => {
    const surface =
      gh.manager.graphics.getState().surface;
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
    const surface =
      gh.manager.graphics.getState().surface;
    return Boolean(
      surface.heldCard &&
      surface.heldCard.phase === 'held' &&
      Math.abs(
        surface.heldCard.presentedGrabPoint.x -
          pointer.x
      ) < 0.01 &&
      Math.abs(
        surface.heldCard.presentedGrabPoint.y -
          pointer.y
      ) < 0.01 &&
      surface.rafActive === false
    );
  }, pointerTarget)).toBe(true);

  await installControlledMatchFrameClock(page);
  await clickModernLogicalPoint(
    page,
    pointerTarget.x,
    pointerTarget.y
  );
  const returnBeforeModeSwitch =
    await page.evaluate(() => (
      gh.manager.graphics.getState().surface
    ));
  expect(returnBeforeModeSwitch.heldCard.phase)
    .toBe('returning');
  expect(returnBeforeModeSwitch.pendingFrameCount)
    .toBe(1);
  const returnStartedAt =
    returnBeforeModeSwitch.heldCard.returnMotion
      .startedAt;
  const returnGeneration =
    returnBeforeModeSwitch.heldCard.generation;

  await page.evaluate(() => {
    gh.manager.graphics.setMode('legacy', false);
  });
  await expect.poll(() => page.evaluate(() => (
    gh.manager.graphics.effectiveMode
  ))).toBe('legacy');
  const cancelledByMode = await page.evaluate(() => {
    const state = gh.manager.graphics.getState();
    const returnedCard = state.surface.cards.find(
      card => card.gameCardId === 'player-5'
    );
    return {
      state,
      returnedCard,
      legacyIdentity:
        window.__matchHandFixture.playerNodes.every(
          (node, index) =>
            node === gh.manager.game.p1h[index].card.node
        )
    };
  });
  expect(cancelledByMode.state.surface).toMatchObject({
    heldCard: null,
    completedInvalidReturns: 0,
    inputHandlersAttached: false,
    rafActive: false,
    pendingFrameCount: 0,
    lastReturn: {
      outcome: 'cancelled',
      reason: 'suspend',
      gameCardId: 'player-5'
    }
  });
  expect(
    cancelledByMode.state.surface.holdGeneration
  ).toBeGreaterThan(returnGeneration);
  expect(cancelledByMode.returnedCard).toMatchObject({
    currentPosition: {
      x: 86.5,
      y: 311,
      z: 0
    },
    rotationRadians: {
      x: 0,
      y: 0,
      z: 0
    },
    held: false
  });
  expect(cancelledByMode.legacyIdentity).toBe(true);

  expect(await page.evaluate(timestamp => (
    window.__modernMatchFrameClock
      .runLastCancelled(timestamp)
  ), returnStartedAt + 300)).toBe(true);
  const afterStaleModeFrame = await page.evaluate(() => {
    const surface =
      gh.manager.graphics.getState().surface;
    return {
      heldCard: surface.heldCard,
      completedInvalidReturns:
        surface.completedInvalidReturns,
      lastReturn: surface.lastReturn,
      rafActive: surface.rafActive,
      pendingFrameCount: surface.pendingFrameCount,
      returnedCard: surface.cards.find(
        card => card.gameCardId === 'player-5'
      )
    };
  });
  expect(afterStaleModeFrame).toMatchObject({
    heldCard: null,
    completedInvalidReturns: 0,
    lastReturn: {
      outcome: 'cancelled',
      reason: 'suspend',
      gameCardId: 'player-5'
    },
    rafActive: false,
    pendingFrameCount: 0,
    returnedCard: {
      currentPosition: {
        x: 86.5,
        y: 311,
        z: 0
      },
      rotationRadians: {
        x: 0,
        y: 0,
        z: 0
      },
      held: false
    }
  });
  await page.evaluate(() => {
    window.__modernMatchFrameClock.restore();
    gh.manager.graphics.setMode('modern', false);
  });
  await waitForModernMatch(page);
  expect(await page.evaluate(() => {
    const surface =
      gh.manager.graphics.getState().surface;
    const returnedCard = surface.cards.find(
      card => card.gameCardId === 'player-5'
    );
    return {
      heldCard: surface.heldCard,
      inputHandlersAttached:
        surface.inputHandlersAttached,
      rafActive: surface.rafActive,
      currentPosition:
        returnedCard.currentPosition,
      rotationRadians:
        returnedCard.rotationRadians
    };
  })).toEqual({
    heldCard: null,
    inputHandlersAttached: true,
    rafActive: false,
    currentPosition: {
      x: 86.5,
      y: 311,
      z: 0
    },
    rotationRadians: {
      x: 0,
      y: 0,
      z: 0
    }
  });

  await clickModernLogicalPoint(
    page,
    clickLogical.x,
    clickLogical.y
  );
  await expect.poll(() => page.evaluate(() => {
    const surface =
      gh.manager.graphics.getState().surface;
    return surface.heldCard &&
      surface.heldCard.phase === 'held';
  })).toBe(true);
  await installControlledMatchFrameClock(page);
  await clickModernLogicalPoint(
    page,
    clickLogical.x,
    clickLogical.y
  );
  const returnBeforeViewExit =
    await page.evaluate(() => (
      gh.manager.graphics.getState().surface
    ));
  expect(returnBeforeViewExit.heldCard.phase)
    .toBe('returning');
  const viewReturnStartedAt =
    returnBeforeViewExit.heldCard.returnMotion
      .startedAt;
  await page.evaluate(() => {
    gh.manager.graphics.setActiveMatch(false);
  });
  expect(await page.evaluate(timestamp => (
    window.__modernMatchFrameClock
      .runLastCancelled(timestamp)
  ), viewReturnStartedAt + 300)).toBe(true);
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
  await page.evaluate(() => {
    window.__modernMatchFrameClock.restore();
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

test('pickup and exact invalid return remain scale-correct and clean up across mode and view changes', async ({page}) => {
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

  for (const [scaleIndex, scale] of [1, 1.5, 2, 3].entries()) {
    await page.evaluate(nextScale => {
      gh.manager.setContentScale(nextScale, false);
      gh.manager.graphics.setMode('modern', false);
    }, scale);
    await waitForModernMatch(page);

    const clickLogical = {x: 110, y: 300};
    const pointerTarget = {x: 620, y: 420};
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

    await clickModernLogicalPoint(
      page,
      pointerTarget.x,
      pointerTarget.y
    );
    await expect.poll(() => page.evaluate(
      expectedCompletionCount => {
        const surface =
          gh.manager.graphics.getState().surface;
        const returnedCard = surface.cards.find(
          card => card.gameCardId === 'player-5'
        );
        return Boolean(
          surface.heldCard === null &&
          surface.completedInvalidReturns ===
            expectedCompletionCount &&
          surface.rafActive === false &&
          surface.pendingFrameCount === 0 &&
          returnedCard &&
          returnedCard.currentPosition.x === 86.5 &&
          returnedCard.currentPosition.y === 311 &&
          returnedCard.currentPosition.z === 0 &&
          returnedCard.rotationRadians.x === 0 &&
          returnedCard.rotationRadians.y === 0 &&
          returnedCard.rotationRadians.z === 0
        );
      },
      scaleIndex + 1
    )).toBe(true);

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

test('reduced motion keeps click-to-carry functional and settles a second-click return immediately', async ({page}) => {
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
  const pointerTarget = {x: 620, y: 420};
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

  await clickModernLogicalPoint(
    page,
    pointerTarget.x,
    pointerTarget.y
  );
  const returned = await page.evaluate(() => {
    const surface =
      gh.manager.graphics.getState().surface;
    return {
      surface,
      card: surface.cards.find(
        item => item.gameCardId === 'player-5'
      )
    };
  });
  expect(returned.surface).toMatchObject({
    reducedMotion: true,
    heldCard: null,
    acceptedInvalidReturns: 1,
    completedInvalidReturns: 1,
    rafActive: false,
    pendingFrameCount: 0,
    lastReturn: {
      outcome: 'completed',
      completion: 'reduced-motion',
      gameCardId: 'player-5',
      durationMs: 300,
      easing: 'cubic-out',
      screenDirection: 'clockwise',
      reducedMotion: true,
      finalPose: {
        x: 86.5,
        y: 311,
        depth: 0,
        projectedScale: 1,
        rotationRadians: {
          x: 0,
          y: 0,
          z: 0
        }
      }
    }
  });
  expect(returned.card).toMatchObject({
    currentPosition: {
      x: 86.5,
      y: 311,
      z: 0
    },
    rotationRadians: {
      x: 0,
      y: 0,
      z: 0
    },
    held: false
  });
  expect(moveRequests).toHaveLength(0);
});

test('reduced motion settles a valid renderer-local placement synchronously', async ({page}) => {
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
  await page.evaluate(() => {
    gh.manager.graphics.surface.randomSource =
      () => 0.25;
  });

  await clickModernLogicalPoint(page, 110, 300);
  await moveModernLogicalPoint(page, 464.5, 400);
  await expect.poll(() => page.evaluate(() => (
    gh.manager.graphics.getState().surface
      .hoveredDropZone
  ))).toMatchObject({
    slotIndex: 8
  });
  await clickModernLogicalPoint(page, 464.5, 400);

  const settled = await page.evaluate(() => {
    const surface =
      gh.manager.graphics.getState().surface;
    return {
      surface,
      card: surface.cards.find(
        item => item.gameCardId === 'player-5'
      )
    };
  });
  expect(settled.surface).toMatchObject({
    reducedMotion: true,
    heldCard: null,
    acceptedValidPlacements: 1,
    completedValidPlacements: 1,
    acceptedInvalidReturns: 0,
    visibleDropZoneCount: 0,
    rafActive: false,
    pendingFrameCount: 0,
    localPreviewPlacement: {
      gameCardId: 'player-5',
      slotIndex: 8,
      finalPose: {
        x: 464.5,
        y: 400,
        depth: 0,
        projectedScale: 1,
        screenRotationDegrees: -1,
        rotationRadians: {
          x: 0,
          y: 0,
          z: Math.PI / 180
        }
      }
    },
    lastPlacement: {
      outcome: 'completed',
      completion: 'reduced-motion',
      gameCardId: 'player-5',
      slotIndex: 8,
      reducedMotion: true
    }
  });
  expect(settled.card).toMatchObject({
    currentPosition: {
      x: 464.5,
      y: 400,
      z: 0
    },
    rotationRadians: {
      x: 0,
      y: 0,
      z: Math.PI / 180
    },
    held: false,
    placed: true,
    placedSlotIndex: 8,
    pickable: false
  });
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
