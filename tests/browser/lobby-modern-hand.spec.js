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

async function waitForModernLobby(page) {
  await expect.poll(() => page.evaluate(() => {
    const state = gh.manager.graphics.getState();
    return state.effectiveMode === 'modern' &&
      state.surfaceKind === 'lobby-hand' &&
      state.surface &&
      state.surface.ready === true &&
      state.surface.interactive === true;
  })).toBe(true);
}

async function dispatchLobbyCardClicks(page, indexes) {
  return page.evaluate(cardIndexes => {
    const state = gh.manager.graphics.getState().surface;
    const canvas = document.querySelector('#modernLobbyHand canvas.modern-lobby-hand-canvas');
    const bounds = canvas.getBoundingClientRect();
    return cardIndexes.map(cardIndex => {
      const card = state.cards[cardIndex];
      const clientX = bounds.left +
        ((card.screenRect.x + (card.screenRect.width / 2)) * bounds.width / state.logicalWidth);
      const clientY = bounds.top +
        ((card.screenRect.y + (card.screenRect.height / 2)) * bounds.height / state.logicalHeight);
      const target = document.elementFromPoint(clientX, clientY);
      if (!target) {
        throw new Error(`No lobby click target for card ${cardIndex}.`);
      }
      target.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        button: 0,
        clientX,
        clientY,
        view: window
      }));
      return gh.manager.graphics.getState().surface;
    });
  }, indexes);
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
    backTextureUrl: '/images/cards/cardBack.png',
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
      camera: {
        projection: 'perspective',
        fovDegrees: 40,
        near: 450,
        far: 900,
        settledPlaneScale: 1
      },
      cardModel: {
        width: 117,
        height: 146,
        thickness: 3,
        faceOffset: 1.7,
        faceBodyClearance: 0.2,
        slabFaceCaps: false
      },
      motionProfile: {
        flipAxis: 'x',
        rotationPath: '0-to-negative-two-pi',
        projectionProfile: 'flat-table-neutralized',
        pickupTiltPolicy: 'none',
        animationConcurrency: 'independent-per-card',
        repeatedActiveCardPolicy: 'ignored-until-settled',
        scheduler: 'shared-request-animation-frame',
        maxConcurrentAnimations: 5,
        nominalDurationMs: 2450,
        deadlineMs: 3000,
        continuousTurnMs: 1650,
        liftScreenY: 18,
        liftZ: 105
      },
      renderPolicy: {
        faceMaterial: 'unlit',
        faceToneMapped: false,
        textureColorSpace: 'srgb',
        outputColorSpace: 'srgb',
        textureMipmaps: true,
        shadowStrategy: 'analytic-contact',
        shadowOwnership: 'per-active-card',
        shadowMapEnabled: false
      },
      disposed: false,
      contextLost: false,
      status: 'ready',
      ready: true,
      interactive: true,
      suspended: false,
      inputHandlersAttached: true,
      meshCount: 5
    }
  });
  expect(modernState.surface.cards).toHaveLength(5);
  expect(modernState.surface.cards.map(card => ({
    index: card.index,
    userCardId: card.userCardId,
    cardId: card.cardId,
    textureUrl: card.textureUrl,
    backTextureUrl: card.backTextureUrl,
    screenRect: card.screenRect
  }))).toEqual(expectedCards);
  expect(modernState.surface.cards.every(card => card.visible)).toBe(true);
  expect(modernState.surface.renderPolicy.textureAnisotropy).toBeGreaterThan(0);
  expect(modernState.surface.cards.every(card =>
    card.rotationDegrees === 0 &&
    card.transform.liftY === 0 &&
    card.transform.z === 0 &&
    card.transform.scale === 1 &&
    card.transform.rotationX === 0 &&
    card.transform.rotationY === 0 &&
    card.transform.pickupTiltX === 0 &&
    card.transform.pickupTiltY === 0 &&
    card.transform.staticRotationZ === 0 &&
    card.transform.perspectiveScale === 1 &&
    Math.abs(card.transform.projectedFace.lateralShear) < 0.000001
  )).toBe(true);
  modernState.surface.cards.forEach(card => {
    expect(card.transform.projectedFace.center.x).toBeCloseTo(
      card.screenRect.x + (card.screenRect.width / 2),
      8
    );
    expect(card.transform.projectedFace.center.y).toBeCloseTo(
      card.screenRect.y + (card.screenRect.height / 2),
      8
    );
    expect(card.transform.projectedFace.topWidth).toBeCloseTo(card.screenRect.width, 8);
    expect(card.transform.projectedFace.bottomWidth).toBeCloseTo(card.screenRect.width, 8);
  });

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
    const play = document.querySelector('ul.mainmenu li.play');
    const playRect = play.getBoundingClientRect();
    const commandHitTarget = document.elementFromPoint(
      playRect.left + (playRect.width / 2),
      playRect.top + (playRect.height / 2)
    );

    return {
      hostAriaHidden: host.getAttribute('aria-hidden'),
      hostPointerEvents: getComputedStyle(host).pointerEvents,
      canvasAriaHidden: canvas.getAttribute('aria-hidden'),
      canvasPointerEvents: getComputedStyle(canvas).pointerEvents,
      canvasTabIndex: canvas.tabIndex,
      hitTargetIsModernSurface: hitTarget === canvas || host.contains(hitTarget),
      commandHitTargetIsPlay: commandHitTarget === play || play.contains(commandHitTarget),
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
    commandHitTargetIsPlay: true,
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

test('keeps left, center, and right lobby cards on one flat projected plane during the lifted turn', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await loginWithLegacyGraphics(page);
  await selectGraphicsMode(page, 'modern');
  await waitForModernLobby(page);

  const samples = await page.evaluate(({cardIndexes, sampleElapsedMs, settleElapsedMs}) => {
    const surface = gh.manager.graphics.surface;
    const canvas = document.querySelector('#modernLobbyHand canvas.modern-lobby-hand-canvas');
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;
    const queuedFrames = new Map();
    let nextFrameId = 1;

    const snapshotTransforms = state => state.cards.map(card => ({
      index: card.index,
      rotationDegrees: card.rotationDegrees,
      phase: card.phase,
      visibleFace: card.visibleFace,
      transform: card.transform
    }));
    const runNextFrame = timestamp => {
      const next = queuedFrames.entries().next();
      if (next.done) {
        throw new Error(`No controlled lobby animation frame is queued for ${timestamp}.`);
      }
      const [frameId, callback] = next.value;
      queuedFrames.delete(frameId);
      callback(timestamp);
    };
    const clickCard = cardIndex => {
      const state = surface.getDebugState();
      const card = state.cards[cardIndex];
      const bounds = canvas.getBoundingClientRect();
      const clientX = bounds.left +
        ((card.screenRect.x + (card.screenRect.width / 2)) * bounds.width / state.logicalWidth);
      const clientY = bounds.top +
        ((card.screenRect.y + (card.screenRect.height / 2)) * bounds.height / state.logicalHeight);
      const target = document.elementFromPoint(clientX, clientY);
      if (!target) {
        throw new Error(`No controlled lobby click target for card ${cardIndex}.`);
      }
      target.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        button: 0,
        clientX,
        clientY,
        view: window
      }));
    };

    window.requestAnimationFrame = callback => {
      const frameId = nextFrameId++;
      queuedFrames.set(frameId, callback);
      return frameId;
    };
    window.cancelAnimationFrame = frameId => {
      queuedFrames.delete(frameId);
    };

    try {
      return cardIndexes.map(cardIndex => {
        const baseline = surface.getDebugState();
        clickCard(cardIndex);
        const animation = Array.from(surface.activeAnimations.values())
          .find(candidate => candidate.entry.card.index === cardIndex);
        if (!animation) {
          throw new Error(`Card ${cardIndex} did not start its controlled lobby animation.`);
        }

        const startTime = animation.startTime;
        runNextFrame(startTime + sampleElapsedMs);
        const sampled = surface.getDebugState();
        runNextFrame(startTime + settleElapsedMs);
        const settled = surface.getDebugState();

        return {
          cardIndex,
          baselineTransforms: snapshotTransforms(baseline),
          baselineCompletedFlips: baseline.cards[cardIndex].completedFlips,
          baselineCompletedAnimationCount: baseline.completedAnimationCount,
          sampledCard: sampled.cards[cardIndex],
          sampledTransition: sampled.lastTransition,
          settledTransforms: snapshotTransforms(settled),
          settledCompletedFlips: settled.cards[cardIndex].completedFlips,
          settledCompletedAnimationCount: settled.completedAnimationCount,
          settledActiveAnimationCount: settled.activeAnimationCount,
          settledRafActive: settled.rafActive,
          settledShadowVisible: settled.analyticShadowVisible,
          settledShadowOpacity: settled.analyticShadowOpacity,
          queuedFrameCount: queuedFrames.size
        };
      });
    } finally {
      if (surface.activeAnimations.size > 0) {
        surface.cancelAnimations('controlled-test-cleanup');
      }
      window.requestAnimationFrame = originalRequestAnimationFrame;
      window.cancelAnimationFrame = originalCancelAnimationFrame;
    }
  }, {
    cardIndexes: [0, 2, 4],
    sampleElapsedMs: 650,
    settleElapsedMs: 2450
  });

  const normalizedCorners = projectedFace => projectedFace.corners.map(corner => ({
    x: corner.x - projectedFace.center.x,
    y: corner.y - projectedFace.center.y
  }));
  const centerSample = samples.find(sample => sample.cardIndex === 2);
  const centerFace = centerSample.sampledCard.transform.projectedFace;
  const centerCorners = normalizedCorners(centerFace);

  expect(samples.map(sample => sample.cardIndex)).toEqual([0, 2, 4]);
  samples.forEach(sample => {
    const card = sample.sampledCard;
    const transform = card.transform;
    const projectedFace = transform.projectedFace;
    const corners = normalizedCorners(projectedFace);

    expect(transform.z).toBeGreaterThan(105);
    expect(transform.perspectiveScale).toBeGreaterThan(1.14);
    expect(transform.rotationX).toBeLessThan(0);
    expect(transform.rotationY).toBe(0);
    expect(transform.pickupTiltX).toBe(0);
    expect(transform.pickupTiltY).toBe(0);
    expect(transform.staticRotationZ).toBe(0);
    expect(Math.abs(projectedFace.lateralShear)).toBeLessThan(0.000001);
    expect(sample.sampledTransition.evidence.maxPickupTilt).toBe(0);
    expect(sample.sampledTransition.evidence.maxAbsProjectedLateralShear)
      .toBeLessThan(0.000001);
    expect(projectedFace.center.x).toBeCloseTo(
      card.screenRect.x + (card.screenRect.width / 2),
      8
    );
    expect(projectedFace.center.y).toBeCloseTo(centerFace.center.y, 8);
    expect(projectedFace.topWidth).toBeCloseTo(centerFace.topWidth, 8);
    expect(projectedFace.bottomWidth).toBeCloseTo(centerFace.bottomWidth, 8);
    corners.forEach((corner, cornerIndex) => {
      expect(corner.x).toBeCloseTo(centerCorners[cornerIndex].x, 8);
      expect(corner.y).toBeCloseTo(centerCorners[cornerIndex].y, 8);
    });

    expect(sample.settledTransforms).toEqual(sample.baselineTransforms);
    expect(sample.settledCompletedFlips).toBe(sample.baselineCompletedFlips + 1);
    expect(sample.settledCompletedAnimationCount)
      .toBe(sample.baselineCompletedAnimationCount + 1);
    expect(sample.settledActiveAnimationCount).toBe(0);
    expect(sample.settledRafActive).toBe(false);
    expect(sample.settledShadowVisible).toBe(false);
    expect(sample.settledShadowOpacity).toBe(0);
    expect(sample.queuedFrameCount).toBe(0);
  });
});

test('one Modern lobby click performs a perspective end-over-end turn and settles without application requests', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'no-preference'});
  const applicationRequests = [];
  page.on('request', request => {
    if (request.resourceType() === 'xhr' || request.resourceType() === 'fetch') {
      applicationRequests.push(`${request.method()} ${new URL(request.url()).pathname}`);
    }
  });

  await loginWithLegacyGraphics(page);
  await selectGraphicsMode(page, 'modern');
  await waitForModernLobby(page);

  const cardIndex = 2;
  const baseline = await page.evaluate(index => {
    const state = gh.manager.graphics.getState().surface;
    const card = state.cards[index];
    return {
      applicationState: JSON.stringify({
        hand: gh.data.hand,
        ingame: gh.data.ingame
      }),
      card,
      otherCards: state.cards
        .filter(otherCard => otherCard.index !== index)
        .map(otherCard => ({
          index: otherCard.index,
          rotationDegrees: otherCard.rotationDegrees,
          completedFlips: otherCard.completedFlips,
          transform: otherCard.transform
        })),
      completedAnimationCount: state.completedAnimationCount
    };
  }, cardIndex);
  expect(baseline.card.rotationDegrees).toBe(0);
  expect(baseline.card.transform).toMatchObject({
    liftY: 0,
    z: 0,
    scale: 1,
    rotationX: 0,
    rotationY: 0,
    pickupTiltX: 0,
    pickupTiltY: 0,
    staticRotationZ: 0,
    perspectiveScale: 1
  });
  expect(baseline.otherCards.every(card =>
    card.rotationDegrees === 0 &&
    card.transform.rotationX === 0 &&
    card.transform.rotationY === 0 &&
    card.transform.pickupTiltX === 0 &&
    card.transform.pickupTiltY === 0 &&
    card.transform.staticRotationZ === 0
  )).toBe(true);
  applicationRequests.length = 0;

  const started = (await dispatchLobbyCardClicks(page, [cardIndex]))[0];
  expect({
    acceptedClicks: started.acceptedClicks,
    activeAnimationCount: started.activeAnimationCount,
    rafActive: started.rafActive,
    outcome: started.lastTransition && started.lastTransition.outcome,
    firstPhase: started.lastTransition && started.lastTransition.phases[0]
  }).toEqual({
    acceptedClicks: 1,
    activeAnimationCount: 1,
    rafActive: true,
    outcome: 'running',
    firstPhase: 'lift'
  });

  await expect.poll(() => page.evaluate(() => {
    const state = gh.manager.graphics.getState().surface;
    return state.lastTransition && state.lastTransition.outcome;
  })).toBe('completed');

  const settled = await page.evaluate(index => {
    const state = gh.manager.graphics.getState().surface;
    return {
      applicationState: JSON.stringify({
        hand: gh.data.hand,
        ingame: gh.data.ingame
      }),
      acceptedClicks: state.acceptedClicks,
      ignoredClicks: state.ignoredClicks,
      emptyClicks: state.emptyClicks,
      completedAnimationCount: state.completedAnimationCount,
      activeAnimationCount: state.activeAnimationCount,
      rafActive: state.rafActive,
      analyticShadowVisible: state.analyticShadowVisible,
      analyticShadowOpacity: state.analyticShadowOpacity,
      lastPick: state.lastPick,
      lastTransition: state.lastTransition,
      card: state.cards[index],
      otherCards: state.cards
        .filter(card => card.index !== index)
        .map(card => ({
          index: card.index,
          rotationDegrees: card.rotationDegrees,
          completedFlips: card.completedFlips,
          transform: card.transform
        }))
    };
  }, cardIndex);

  expect(settled.applicationState).toBe(baseline.applicationState);
  expect(settled.acceptedClicks).toBe(1);
  expect(settled.ignoredClicks).toBe(0);
  expect(settled.emptyClicks).toBe(0);
  expect(settled.completedAnimationCount).toBe(baseline.completedAnimationCount + 1);
  expect(settled.activeAnimationCount).toBe(0);
  expect(settled.rafActive).toBe(false);
  expect(settled.analyticShadowVisible).toBe(false);
  expect(settled.analyticShadowOpacity).toBe(0);
  expect(settled.lastPick).toEqual({
    index: baseline.card.index,
    userCardId: baseline.card.userCardId,
    cardId: baseline.card.cardId
  });
  expect(settled.lastTransition).toMatchObject({
    cardIndex: baseline.card.index,
    userCardId: baseline.card.userCardId,
    cardId: baseline.card.cardId,
    outcome: 'completed',
    phases: ['lift', 'first-edge', 'back', 'second-edge', 'front', 'settled'],
    flipAxis: 'x',
    nominalDurationMs: 2450,
    deadlineMs: 3000,
    evidence: {
      maxAbsFlipRotationY: 0,
      directionReversals: 0,
      firstEdgeAngleX: -Math.PI / 2,
      backAngleX: -Math.PI,
      secondEdgeAngleX: -Math.PI * 1.5,
      frontAngleBeforeSettlement: -Math.PI * 2,
      edgePasses: 2
    }
  });
  expect(settled.lastTransition.evidence.maxScreenLiftY).toBeGreaterThan(20);
  expect(settled.lastTransition.evidence.maxLiftZ).toBeGreaterThan(105);
  expect(settled.lastTransition.evidence.maxAbsFlipRotationX).toBeCloseTo(Math.PI * 2, 5);
  expect(settled.lastTransition.evidence.minFlipRotationX).toBeCloseTo(-Math.PI * 2, 5);
  expect(settled.lastTransition.evidence.maxPickupTilt).toBe(0);
  expect(settled.lastTransition.evidence.maxTopBottomDepthSpan).toBeGreaterThan(130);
  expect(settled.lastTransition.evidence.maxPerspectiveScale).toBeGreaterThan(1.14);
  expect(settled.lastTransition.evidence.maxAnalyticShadowOpacity).toBeGreaterThan(0.15);
  expect(settled.lastTransition.evidence.maxAbsProjectedLateralShear).toBeLessThan(0.000001);
  expect(settled.card).toMatchObject({
    backTextureUrl: '/images/cards/cardBack.png',
    rotationDegrees: 0,
    phase: 'idle',
    visibleFace: 'front',
    completedFlips: 1
  });
  expect(settled.card.transform).toEqual(baseline.card.transform);
  expect(settled.otherCards).toEqual(baseline.otherCards);
  expect(applicationRequests).toEqual([]);
});

test('ray-picks cards with independent re-entry guards and one shared concurrent scheduler', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await loginWithLegacyGraphics(page);
  await selectGraphicsMode(page, 'modern');
  await waitForModernLobby(page);

  const concurrency = await page.evaluate(({firstCardIndex, secondCardIndex}) => {
    const surface = gh.manager.graphics.surface;
    const canvas = document.querySelector('#modernLobbyHand canvas.modern-lobby-hand-canvas');
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;
    const queuedFrames = new Map();
    let nextFrameId = 1;

    const clickCard = cardIndex => {
      const state = surface.getDebugState();
      const card = state.cards[cardIndex];
      const bounds = canvas.getBoundingClientRect();
      const clientX = bounds.left +
        ((card.screenRect.x + (card.screenRect.width / 2)) * bounds.width / state.logicalWidth);
      const clientY = bounds.top +
        ((card.screenRect.y + (card.screenRect.height / 2)) * bounds.height / state.logicalHeight);
      const target = document.elementFromPoint(clientX, clientY);
      if (!target) {
        throw new Error(`No concurrent lobby click target for card ${cardIndex}.`);
      }
      target.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        button: 0,
        clientX,
        clientY,
        view: window
      }));
    };
    const animationFor = cardIndex => (
      Array.from(surface.activeAnimations.values())
        .find(animation => animation.entry.card.index === cardIndex)
    );
    const runNextFrame = timestamp => {
      const next = queuedFrames.entries().next();
      if (next.done) {
        throw new Error(`No shared lobby animation frame is queued for ${timestamp}.`);
      }
      const [frameId, callback] = next.value;
      queuedFrames.delete(frameId);
      callback(timestamp);
    };
    const selectState = () => {
      const state = surface.getDebugState();
      return {
        acceptedClicks: state.acceptedClicks,
        ignoredClicks: state.ignoredClicks,
        completedAnimationCount: state.completedAnimationCount,
        activeAnimationCount: state.activeAnimationCount,
        activeCardIndices: state.activeCardIndices,
        lockedCardIndices: state.lockedCardIndices,
        activeCardIndex: state.activeCardIndex,
        phase: state.phase,
        rafActive: state.rafActive,
        activeAnalyticShadowCount: state.activeAnalyticShadowCount,
        analyticShadowVisible: state.analyticShadowVisible,
        cards: state.cards.map(card => ({
          index: card.index,
          phase: card.phase,
          visibleFace: card.visibleFace,
          completedFlips: card.completedFlips,
          animating: card.animating,
          analyticShadowVisible: card.analyticShadowVisible,
          analyticShadowOpacity: card.analyticShadowOpacity,
          lastTransition: card.lastTransition,
          transform: card.transform
        })),
        recentTransitions: state.recentTransitions
      };
    };

    window.requestAnimationFrame = callback => {
      const frameId = nextFrameId++;
      queuedFrames.set(frameId, callback);
      return frameId;
    };
    window.cancelAnimationFrame = frameId => {
      queuedFrames.delete(frameId);
    };

    try {
      const baseline = selectState();

      clickCard(firstCardIndex);
      clickCard(secondCardIndex);
      const afterDifferentCards = selectState();
      const queuedAfterDifferentCards = queuedFrames.size;

      clickCard(firstCardIndex);
      const afterActiveCardRepeat = selectState();
      const queuedAfterActiveCardRepeat = queuedFrames.size;

      const firstAnimation = animationFor(firstCardIndex);
      const secondAnimation = animationFor(secondCardIndex);
      if (!firstAnimation || !secondAnimation) {
        throw new Error('Both different-card animations must be active.');
      }
      firstAnimation.startTime = 1000;
      secondAnimation.startTime = 1800;

      runNextFrame(2450);
      const whileBothMoving = selectState();
      const queuedWhileBothMoving = queuedFrames.size;

      runNextFrame(3450);
      const afterFirstSettles = selectState();
      const queuedAfterFirstSettles = queuedFrames.size;

      clickCard(firstCardIndex);
      const restartedAnimation = animationFor(firstCardIndex);
      if (!restartedAnimation || restartedAnimation === firstAnimation) {
        throw new Error('The settled card did not acquire a new animation.');
      }
      restartedAnimation.startTime = 3450;
      const afterSettledCardRestarts = selectState();
      const queuedAfterSettledCardRestarts = queuedFrames.size;

      runNextFrame(4250);
      const afterSecondSettles = selectState();
      const queuedAfterSecondSettles = queuedFrames.size;

      runNextFrame(5900);
      const fullySettled = selectState();

      return {
        baseline,
        afterDifferentCards,
        queuedAfterDifferentCards,
        afterActiveCardRepeat,
        queuedAfterActiveCardRepeat,
        whileBothMoving,
        queuedWhileBothMoving,
        afterFirstSettles,
        queuedAfterFirstSettles,
        afterSettledCardRestarts,
        queuedAfterSettledCardRestarts,
        afterSecondSettles,
        queuedAfterSecondSettles,
        fullySettled,
        queuedAfterAllSettle: queuedFrames.size
      };
    } finally {
      if (surface.activeAnimations.size > 0) {
        surface.cancelAnimations('controlled-concurrency-test-cleanup');
      }
      window.requestAnimationFrame = originalRequestAnimationFrame;
      window.cancelAnimationFrame = originalCancelAnimationFrame;
    }
  }, {
    firstCardIndex: 0,
    secondCardIndex: 4
  });

  expect(concurrency.afterDifferentCards).toMatchObject({
    acceptedClicks: 2,
    ignoredClicks: 0,
    activeAnimationCount: 2,
    activeCardIndices: [0, 4],
    lockedCardIndices: [0, 4],
    activeCardIndex: null,
    phase: 'concurrent',
    rafActive: true
  });
  expect(concurrency.queuedAfterDifferentCards).toBe(1);
  expect(concurrency.afterDifferentCards.cards[0].animating).toBe(true);
  expect(concurrency.afterDifferentCards.cards[4].animating).toBe(true);

  expect(concurrency.afterActiveCardRepeat).toMatchObject({
    acceptedClicks: 2,
    ignoredClicks: 1,
    activeAnimationCount: 2,
    activeCardIndices: [0, 4],
    lockedCardIndices: [0, 4],
    rafActive: true
  });
  expect(concurrency.queuedAfterActiveCardRepeat).toBe(1);

  expect(concurrency.whileBothMoving).toMatchObject({
    activeAnimationCount: 2,
    activeCardIndices: [0, 4],
    lockedCardIndices: [0, 4],
    rafActive: true,
    activeAnalyticShadowCount: 2,
    analyticShadowVisible: true
  });
  expect(concurrency.queuedWhileBothMoving).toBe(1);
  expect(concurrency.whileBothMoving.cards[0].analyticShadowVisible).toBe(true);
  expect(concurrency.whileBothMoving.cards[4].analyticShadowVisible).toBe(true);
  expect(concurrency.whileBothMoving.cards[0].analyticShadowOpacity).toBeGreaterThan(0);
  expect(concurrency.whileBothMoving.cards[4].analyticShadowOpacity).toBeGreaterThan(0);
  expect(concurrency.whileBothMoving.cards[0].lastTransition).toMatchObject({
    cardIndex: 0,
    outcome: 'running'
  });
  expect(concurrency.whileBothMoving.cards[4].lastTransition).toMatchObject({
    cardIndex: 4,
    outcome: 'running'
  });
  expect(concurrency.whileBothMoving.cards[0].lastTransition.token)
    .not.toBe(concurrency.whileBothMoving.cards[4].lastTransition.token);
  expect(concurrency.whileBothMoving.cards[0].lastTransition.evidence.maxAbsFlipRotationX)
    .toBeGreaterThan(
      concurrency.whileBothMoving.cards[4].lastTransition.evidence.maxAbsFlipRotationX
    );

  expect(concurrency.afterFirstSettles).toMatchObject({
    acceptedClicks: 2,
    ignoredClicks: 1,
    completedAnimationCount: 1,
    activeAnimationCount: 1,
    activeCardIndices: [4],
    lockedCardIndices: [4],
    activeCardIndex: 4,
    rafActive: true,
    activeAnalyticShadowCount: 1,
    analyticShadowVisible: true
  });
  expect(concurrency.queuedAfterFirstSettles).toBe(1);
  expect(concurrency.afterFirstSettles.cards[0]).toMatchObject({
    phase: 'idle',
    visibleFace: 'front',
    completedFlips: 1,
    animating: false,
    analyticShadowVisible: false,
    analyticShadowOpacity: 0,
    lastTransition: {
      cardIndex: 0,
      outcome: 'completed'
    }
  });
  expect(concurrency.afterFirstSettles.cards[0].transform)
    .toEqual(concurrency.baseline.cards[0].transform);
  expect(concurrency.afterFirstSettles.cards[4]).toMatchObject({
    completedFlips: 0,
    animating: true,
    analyticShadowVisible: true,
    lastTransition: {
      cardIndex: 4,
      outcome: 'running'
    }
  });

  expect(concurrency.afterSettledCardRestarts).toMatchObject({
    acceptedClicks: 3,
    ignoredClicks: 1,
    completedAnimationCount: 1,
    activeAnimationCount: 2,
    activeCardIndices: [0, 4],
    lockedCardIndices: [0, 4],
    activeCardIndex: null,
    phase: 'concurrent',
    rafActive: true
  });
  expect(concurrency.queuedAfterSettledCardRestarts).toBe(1);
  expect(concurrency.afterSettledCardRestarts.cards[0]).toMatchObject({
    completedFlips: 1,
    animating: true,
    lastTransition: {
      cardIndex: 0,
      outcome: 'running'
    }
  });
  expect(concurrency.afterSettledCardRestarts.cards[0].lastTransition.token)
    .not.toBe(concurrency.afterFirstSettles.cards[0].lastTransition.token);

  expect(concurrency.afterSecondSettles).toMatchObject({
    completedAnimationCount: 2,
    activeAnimationCount: 1,
    activeCardIndices: [0],
    lockedCardIndices: [0],
    activeCardIndex: 0,
    rafActive: true,
    activeAnalyticShadowCount: 1,
    analyticShadowVisible: true
  });
  expect(concurrency.queuedAfterSecondSettles).toBe(1);
  expect(concurrency.afterSecondSettles.cards[4]).toMatchObject({
    phase: 'idle',
    visibleFace: 'front',
    completedFlips: 1,
    animating: false,
    analyticShadowVisible: false,
    analyticShadowOpacity: 0,
    lastTransition: {
      cardIndex: 4,
      outcome: 'completed'
    }
  });
  expect(concurrency.afterSecondSettles.cards[4].transform)
    .toEqual(concurrency.baseline.cards[4].transform);
  expect(concurrency.afterSecondSettles.cards[0]).toMatchObject({
    completedFlips: 1,
    animating: true,
    analyticShadowVisible: true,
    lastTransition: {
      cardIndex: 0,
      outcome: 'running'
    }
  });

  expect(concurrency.fullySettled).toMatchObject({
    acceptedClicks: 3,
    ignoredClicks: 1,
    completedAnimationCount: 3,
    activeAnimationCount: 0,
    activeCardIndices: [],
    lockedCardIndices: [],
    activeCardIndex: null,
    phase: 'idle',
    rafActive: false,
    activeAnalyticShadowCount: 0,
    analyticShadowVisible: false
  });
  expect(concurrency.fullySettled.cards.map(card => card.completedFlips))
    .toEqual([2, 0, 0, 0, 1]);
  concurrency.fullySettled.cards.forEach((card, index) => {
    expect(card.phase).toBe('idle');
    expect(card.visibleFace).toBe('front');
    expect(card.animating).toBe(false);
    expect(card.analyticShadowVisible).toBe(false);
    expect(card.analyticShadowOpacity).toBe(0);
    expect(card.transform).toEqual(concurrency.baseline.cards[index].transform);
  });
  expect(concurrency.fullySettled.recentTransitions.map(transition => ({
    cardIndex: transition.cardIndex,
    outcome: transition.outcome
  }))).toEqual([
    {cardIndex: 0, outcome: 'completed'},
    {cardIndex: 4, outcome: 'completed'},
    {cardIndex: 0, outcome: 'completed'}
  ]);
  expect(concurrency.queuedAfterAllSettle).toBe(0);

  const emptyPoint = await page.evaluate(() => {
    const canvas = document.querySelector('#modernLobbyHand canvas.modern-lobby-hand-canvas');
    const bounds = canvas.getBoundingClientRect();
    return {
      x: bounds.left + (20 * bounds.width / 755),
      y: bounds.top + (375 * bounds.height / 562)
    };
  });
  await page.mouse.click(emptyPoint.x, emptyPoint.y);
  expect(await page.evaluate(() => {
    const state = gh.manager.graphics.getState().surface;
    return {
      acceptedClicks: state.acceptedClicks,
      emptyClicks: state.emptyClicks,
      lastPick: state.lastPick,
      completedAnimationCount: state.completedAnimationCount
    };
  })).toEqual({
    acceptedClicks: 3,
    emptyClicks: 1,
    lastPick: null,
    completedAnimationCount: 3
  });
});

test('reduced motion shares three bounded frame boundaries across concurrent cards', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await loginWithLegacyGraphics(page);
  await selectGraphicsMode(page, 'modern');
  await waitForModernLobby(page);

  const baselineFrames = await page.evaluate(() => (
    gh.manager.graphics.getState().surface.animationFrameCount
  ));
  const startedStates = await dispatchLobbyCardClicks(page, [1, 3]);
  expect(startedStates.at(-1)).toMatchObject({
    acceptedClicks: 2,
    activeAnimationCount: 2,
    activeCardIndices: [1, 3],
    lockedCardIndices: [1, 3],
    activeCardIndex: null,
    phase: 'concurrent',
    rafActive: true,
    peakConcurrentAnimationCount: 2
  });
  await expect.poll(() => page.evaluate(() => {
    const state = gh.manager.graphics.getState().surface;
    return state.completedAnimationCount;
  })).toBe(2);

  const reduced = await page.evaluate(indexes => {
    const state = gh.manager.graphics.getState().surface;
    return {
      prefersReducedMotion: state.prefersReducedMotion,
      animationFrameCount: state.animationFrameCount,
      lockHeld: state.lockHeld,
      activeCardIndex: state.activeCardIndex,
      rafActive: state.rafActive,
      completedAnimationCount: state.completedAnimationCount,
      activeAnimationCount: state.activeAnimationCount,
      activeCardIndices: state.activeCardIndices,
      lockedCardIndices: state.lockedCardIndices,
      peakConcurrentAnimationCount: state.peakConcurrentAnimationCount,
      lastTransition: state.lastTransition,
      recentTransitions: state.recentTransitions,
      cards: indexes.map(index => state.cards[index])
    };
  }, [1, 3]);
  expect(reduced).toMatchObject({
    prefersReducedMotion: true,
    animationFrameCount: baselineFrames + 3,
    lockHeld: false,
    activeCardIndex: null,
    rafActive: false,
    completedAnimationCount: 2,
    activeAnimationCount: 0,
    activeCardIndices: [],
    lockedCardIndices: [],
    peakConcurrentAnimationCount: 2,
    lastTransition: {
      cardIndex: 3,
      outcome: 'completed-reduced-motion',
      phases: ['back', 'front', 'settled'],
      flipAxis: 'x',
      nominalDurationMs: 0,
      deadlineMs: 3000,
      evidence: {
        maxScreenLiftY: 0,
        maxLiftZ: 0,
        maxAbsFlipRotationX: Math.PI * 2,
        minFlipRotationX: -Math.PI * 2,
        maxAbsFlipRotationY: 0,
        maxPickupTilt: 0,
        maxTopBottomDepthSpan: 0,
        maxPerspectiveScale: 1,
        maxAnalyticShadowOpacity: 0,
        maxAbsProjectedLateralShear: 0,
        directionReversals: 0,
        firstEdgeAngleX: null,
        backAngleX: -Math.PI,
        secondEdgeAngleX: null,
        frontAngleBeforeSettlement: -Math.PI * 2,
        edgePasses: 0
      }
    }
  });
  expect(reduced.recentTransitions.map(transition => ({
    cardIndex: transition.cardIndex,
    outcome: transition.outcome,
    phases: transition.phases
  }))).toEqual([
    {
      cardIndex: 1,
      outcome: 'completed-reduced-motion',
      phases: ['back', 'front', 'settled']
    },
    {
      cardIndex: 3,
      outcome: 'completed-reduced-motion',
      phases: ['back', 'front', 'settled']
    }
  ]);
  expect(reduced.cards.map(card => card.index)).toEqual([1, 3]);
  reduced.cards.forEach(card => {
    expect(card).toMatchObject({
      rotationDegrees: 0,
      phase: 'idle',
      visibleFace: 'front',
      completedFlips: 1,
      transform: {
        liftY: 0,
        z: 0,
        scale: 1,
        rotationX: 0,
        rotationY: 0,
        pickupTiltX: 0,
        pickupTiltY: 0,
        staticRotationZ: 0,
        perspectiveScale: 1
      }
    });
  });
});

test('switching to Legacy cancels concurrent Modern lobby flips and restores the same Raphael hand', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await loginWithLegacyGraphics(page);
  await page.evaluate(() => {
    window.__legacyLobbyCardNodes = gh.manager.menu.hand.map(card => card.node);
  });
  await selectGraphicsMode(page, 'modern');
  await waitForModernLobby(page);

  const cancellationStart = await page.evaluate(cardIndexes => {
    window.__animatedLobbySurface = gh.manager.graphics.surface;
    const canvas = document.querySelector('#modernLobbyHand canvas.modern-lobby-hand-canvas');
    const bounds = canvas.getBoundingClientRect();
    cardIndexes.forEach(cardIndex => {
      const state = window.__animatedLobbySurface.getDebugState();
      const card = state.cards[cardIndex];
      const clientX = bounds.left +
        ((card.screenRect.x + (card.screenRect.width / 2)) * bounds.width / state.logicalWidth);
      const clientY = bounds.top +
        ((card.screenRect.y + (card.screenRect.height / 2)) * bounds.height / state.logicalHeight);
      const target = document.elementFromPoint(clientX, clientY);
      target.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        button: 0,
        clientX,
        clientY,
        view: window
      }));
    });
    const started = window.__animatedLobbySurface.getDebugState();
    gh.manager.graphics.setMode('legacy', false);
    return {
      started: {
        activeAnimationCount: started.activeAnimationCount,
        lockHeld: started.lockHeld,
        activeCardIndex: started.activeCardIndex,
        activeCardIndices: started.activeCardIndices,
        lockedCardIndices: started.lockedCardIndices,
        outcomes: cardIndexes.map(index => (
          started.cards[index].lastTransition &&
          started.cards[index].lastTransition.outcome
        ))
      }
    };
  }, [1, 3]);
  expect(cancellationStart.started).toEqual({
    activeAnimationCount: 2,
    lockHeld: true,
    activeCardIndex: null,
    activeCardIndices: [1, 3],
    lockedCardIndices: [1, 3],
    outcomes: ['running', 'running']
  });
  await expect.poll(() => page.evaluate(() => gh.manager.graphics.effectiveMode)).toBe('legacy');
  await expect(page.locator('#menu')).not.toHaveClass(/graphics-modern-hand/);
  await expect(page.locator('#modernLobbyHand')).toHaveAttribute('aria-hidden', 'true');

  const cancelled = await page.evaluate(() => {
    const state = window.__animatedLobbySurface.getDebugState();
    return {
      suspended: state.suspended,
      interactive: state.interactive,
      inputHandlersAttached: state.inputHandlersAttached,
      activeAnimationCount: state.activeAnimationCount,
      rafActive: state.rafActive,
      completedAnimationCount: state.completedAnimationCount,
      lastTransition: state.lastTransition,
      recentTransitions: state.recentTransitions,
      cards: [1, 3].map(index => ({
        index,
        rotationDegrees: state.cards[index].rotationDegrees,
        phase: state.cards[index].phase,
        visibleFace: state.cards[index].visibleFace,
        completedFlips: state.cards[index].completedFlips,
        animating: state.cards[index].animating,
        analyticShadowVisible: state.cards[index].analyticShadowVisible,
        analyticShadowOpacity: state.cards[index].analyticShadowOpacity,
        lastTransition: state.cards[index].lastTransition,
        transform: state.cards[index].transform
      })),
      legacyCardsVisible: window.__legacyLobbyCardNodes.every((node, index) =>
        node === gh.manager.menu.hand[index].node &&
        node.isConnected &&
        node.getAttribute('aria-hidden') === 'false' &&
        getComputedStyle(node).opacity !== '0'
      )
    };
  });
  expect(cancelled).toMatchObject({
    suspended: true,
    interactive: false,
    inputHandlersAttached: false,
    activeAnimationCount: 0,
    rafActive: false,
    completedAnimationCount: 0,
    lastTransition: {
      cardIndex: 3,
      outcome: 'cancelled'
    },
    legacyCardsVisible: true
  });
  expect(cancelled.recentTransitions.map(transition => ({
    cardIndex: transition.cardIndex,
    outcome: transition.outcome
  }))).toEqual([
    {cardIndex: 1, outcome: 'cancelled'},
    {cardIndex: 3, outcome: 'cancelled'}
  ]);
  expect(cancelled.cards.map(card => card.index)).toEqual([1, 3]);
  cancelled.cards.forEach(card => {
    expect(card).toMatchObject({
      rotationDegrees: 0,
      phase: 'idle',
      visibleFace: 'front',
      completedFlips: 0,
      animating: false,
      analyticShadowVisible: false,
      analyticShadowOpacity: 0,
      lastTransition: {
        cardIndex: card.index,
        outcome: 'cancelled'
      },
      transform: {
        liftY: 0,
        z: 0,
        scale: 1,
        rotationX: 0,
        rotationY: 0,
        pickupTiltX: 0,
        pickupTiltY: 0,
        staticRotationZ: 0,
        perspectiveScale: 1
      }
    });
  });
  cancelled.recentTransitions.forEach(transition => {
    expect(transition.phases[0]).toBe('lift');
    expect(transition.phases.at(-1)).toBe('settled');
  });

  await page.evaluate(() => new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
  expect(await page.evaluate(() => {
    const state = window.__animatedLobbySurface.getDebugState();
    return {
      outcome: state.lastTransition.outcome,
      activeAnimationCount: state.activeAnimationCount,
      rafActive: state.rafActive,
      completedAnimationCount: state.completedAnimationCount
    };
  })).toEqual({
    outcome: 'cancelled',
    activeAnimationCount: 0,
    rafActive: false,
    completedAnimationCount: 0
  });

  await page.evaluate(() => gh.manager.graphics.setMode('modern', false));
  await waitForModernLobby(page);
  expect(await page.evaluate(() => {
    const state = gh.manager.graphics.getState().surface;
    return {
      sameSurface: gh.manager.graphics.surface === window.__animatedLobbySurface,
      suspended: state.suspended,
      interactive: state.interactive,
      inputHandlersAttached: state.inputHandlersAttached,
      cardsSettled: state.cards.every(card =>
        card.phase === 'idle' &&
        card.visibleFace === 'front' &&
        card.rotationDegrees === 0 &&
        card.transform.liftY === 0 &&
        card.transform.z === 0 &&
        card.transform.scale === 1 &&
        card.transform.rotationX === 0 &&
        card.transform.rotationY === 0 &&
        card.transform.pickupTiltX === 0 &&
        card.transform.pickupTiltY === 0 &&
        card.transform.staticRotationZ === 0 &&
        card.transform.perspectiveScale === 1
      )
    };
  })).toEqual({
    sameSurface: true,
    suspended: false,
    interactive: true,
    inputHandlersAttached: true,
    cardsSettled: true
  });
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
