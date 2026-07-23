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
        settledPlaneScale: 1
      },
      cardModel: {
        width: 117,
        height: 146,
        thickness: 3
      },
      motionProfile: {
        flipAxis: 'x',
        nominalDurationMs: 2450,
        deadlineMs: 3000,
        liftScreenY: 18,
        liftZ: 105
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
          completedFlips: otherCard.completedFlips,
          transform: otherCard.transform
        })),
      completedAnimationCount: state.completedAnimationCount
    };
  }, cardIndex);
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
      lastPick: state.lastPick,
      lastTransition: state.lastTransition,
      card: state.cards[index],
      otherCards: state.cards
        .filter(card => card.index !== index)
        .map(card => ({
          index: card.index,
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
      edgePasses: 2
    }
  });
  expect(settled.lastTransition.evidence.maxScreenLiftY).toBeGreaterThan(20);
  expect(settled.lastTransition.evidence.maxLiftZ).toBeGreaterThan(105);
  expect(settled.lastTransition.evidence.maxAbsFlipRotationX).toBeCloseTo(Math.PI, 5);
  expect(settled.lastTransition.evidence.maxPickupTilt).toBeGreaterThan(0.1);
  expect(settled.lastTransition.evidence.maxTopBottomDepthSpan).toBeGreaterThan(130);
  expect(settled.lastTransition.evidence.maxPerspectiveScale).toBeGreaterThan(1.14);
  expect(settled.card).toMatchObject({
    backTextureUrl: '/images/cards/cardBack.png',
    phase: 'idle',
    visibleFace: 'front',
    completedFlips: 1
  });
  expect(settled.card.transform).toEqual(baseline.card.transform);
  expect(settled.otherCards).toEqual(baseline.otherCards);
  expect(applicationRequests).toEqual([]);
});

test('ray-picks the clicked Modern card, locks overlapping clicks, and ignores empty space', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await loginWithLegacyGraphics(page);
  await selectGraphicsMode(page, 'modern');
  await waitForModernLobby(page);

  const lockedStates = await dispatchLobbyCardClicks(page, [0, 4]);
  const lockedState = lockedStates[lockedStates.length - 1];
  const locked = {
    acceptedClicks: lockedState.acceptedClicks,
    ignoredClicks: lockedState.ignoredClicks,
    activeAnimationCount: lockedState.activeAnimationCount,
    lastPick: lockedState.lastPick,
    firstCardPhase: lockedState.cards[0].phase,
    lastCardPhase: lockedState.cards[4].phase
  };
  expect(locked).toMatchObject({
    acceptedClicks: 1,
    ignoredClicks: 1,
    activeAnimationCount: 1,
    lastCardPhase: 'idle'
  });
  expect(locked.firstCardPhase).not.toBe('idle');
  expect(locked.lastPick).toEqual(await page.evaluate(() => {
    const card = gh.manager.graphics.getState().surface.cards[4];
    return {
      index: card.index,
      userCardId: card.userCardId,
      cardId: card.cardId
    };
  }));

  await expect.poll(() => page.evaluate(() => (
    gh.manager.graphics.getState().surface.completedAnimationCount
  ))).toBe(1);
  expect(await page.evaluate(() => {
    const state = gh.manager.graphics.getState().surface;
    return {
      acceptedClicks: state.acceptedClicks,
      ignoredClicks: state.ignoredClicks,
      completedFlips: state.cards.map(card => card.completedFlips)
    };
  })).toEqual({
    acceptedClicks: 1,
    ignoredClicks: 1,
    completedFlips: [1, 0, 0, 0, 0]
  });

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
    acceptedClicks: 1,
    emptyClicks: 1,
    lastPick: null,
    completedAnimationCount: 1
  });
});

test('reduced motion shows a bounded back/front proof and settles in two frames', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await loginWithLegacyGraphics(page);
  await selectGraphicsMode(page, 'modern');
  await waitForModernLobby(page);

  const baselineFrames = await page.evaluate(() => (
    gh.manager.graphics.getState().surface.animationFrameCount
  ));
  await dispatchLobbyCardClicks(page, [3]);
  await expect.poll(() => page.evaluate(() => {
    const transition = gh.manager.graphics.getState().surface.lastTransition;
    return transition && transition.outcome;
  })).toBe('completed-reduced-motion');

  expect(await page.evaluate(index => {
    const state = gh.manager.graphics.getState().surface;
    return {
      prefersReducedMotion: state.prefersReducedMotion,
      animationFrameCount: state.animationFrameCount,
      lockHeld: state.lockHeld,
      activeCardIndex: state.activeCardIndex,
      rafActive: state.rafActive,
      completedAnimationCount: state.completedAnimationCount,
      lastTransition: state.lastTransition,
      card: state.cards[index]
    };
  }, 3)).toMatchObject({
    prefersReducedMotion: true,
    animationFrameCount: baselineFrames + 2,
    lockHeld: false,
    activeCardIndex: null,
    rafActive: false,
    completedAnimationCount: 1,
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
        maxAbsFlipRotationX: Math.PI,
        maxAbsFlipRotationY: 0,
        maxPickupTilt: 0,
        maxTopBottomDepthSpan: 0,
        maxPerspectiveScale: 1,
        edgePasses: 0
      }
    },
    card: {
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
        perspectiveScale: 1
      }
    }
  });
});

test('switching to Legacy cancels an in-flight Modern lobby flip and restores the same Raphael hand', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await loginWithLegacyGraphics(page);
  await page.evaluate(() => {
    window.__legacyLobbyCardNodes = gh.manager.menu.hand.map(card => card.node);
  });
  await selectGraphicsMode(page, 'modern');
  await waitForModernLobby(page);

  const cancellationStart = await page.evaluate(cardIndex => {
    window.__animatedLobbySurface = gh.manager.graphics.surface;
    const state = window.__animatedLobbySurface.getDebugState();
    const card = state.cards[cardIndex];
    const canvas = document.querySelector('#modernLobbyHand canvas.modern-lobby-hand-canvas');
    const bounds = canvas.getBoundingClientRect();
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
    const started = window.__animatedLobbySurface.getDebugState();
    gh.manager.graphics.setMode('legacy', false);
    return {
      started: {
        activeAnimationCount: started.activeAnimationCount,
        lockHeld: started.lockHeld,
        activeCardIndex: started.activeCardIndex,
        outcome: started.lastTransition && started.lastTransition.outcome
      }
    };
  }, 1);
  expect(cancellationStart.started).toEqual({
    activeAnimationCount: 1,
    lockHeld: true,
    activeCardIndex: 1,
    outcome: 'running'
  });
  await expect.poll(() => page.evaluate(() => gh.manager.graphics.effectiveMode)).toBe('legacy');
  await expect(page.locator('#menu')).not.toHaveClass(/graphics-modern-hand/);
  await expect(page.locator('#modernLobbyHand')).toHaveAttribute('aria-hidden', 'true');

  const cancelled = await page.evaluate(() => {
    const state = window.__animatedLobbySurface.getDebugState();
    const card = state.cards[1];
    return {
      suspended: state.suspended,
      interactive: state.interactive,
      inputHandlersAttached: state.inputHandlersAttached,
      activeAnimationCount: state.activeAnimationCount,
      rafActive: state.rafActive,
      completedAnimationCount: state.completedAnimationCount,
      lastTransition: state.lastTransition,
      card: {
        phase: card.phase,
        visibleFace: card.visibleFace,
        completedFlips: card.completedFlips,
        transform: card.transform
      },
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
      cardIndex: 1,
      outcome: 'cancelled'
    },
    card: {
      phase: 'idle',
      visibleFace: 'front',
      completedFlips: 0,
      transform: {
        liftY: 0,
        z: 0,
        scale: 1,
        rotationX: 0,
        rotationY: 0,
        pickupTiltX: 0,
        pickupTiltY: 0,
        perspectiveScale: 1
      }
    },
    legacyCardsVisible: true
  });
  expect(cancelled.lastTransition.phases[0]).toBe('lift');
  expect(cancelled.lastTransition.phases.at(-1)).toBe('settled');

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
        card.transform.liftY === 0 &&
        card.transform.z === 0 &&
        card.transform.scale === 1 &&
        card.transform.rotationX === 0 &&
        card.transform.rotationY === 0 &&
        card.transform.pickupTiltX === 0 &&
        card.transform.pickupTiltY === 0 &&
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
