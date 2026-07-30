'use strict';

const {test, expect} = require('@playwright/test');

async function loginWithModernGraphics(page) {
  await page.goto('/auth/login');
  await page.evaluate(() => {
    window.localStorage.setItem(
      'purett.graphicsMode.v1',
      'modern'
    );
  });
  await page.locator(
    'input[name="username"]'
  ).fill('demo');
  await page.locator(
    'input[name="password"]'
  ).fill('TripleTriad!');
  await Promise.all([
    page.waitForURL(
      url => url.pathname === '/'
    ),
    page.locator(
      'button[type="submit"]'
    ).click()
  ]);
  await expect.poll(() => page.evaluate(
    () => Boolean(
      window.gh &&
      gh.manager &&
      gh.manager.cover &&
      gh.manager.graphics
    )
  )).toBe(true);
  await expect.poll(() => page.evaluate(
    () => {
      const state =
        gh.manager.graphics.getState();
      return state.effectiveMode ===
        'modern' &&
        state.gameCoverReady === true &&
        state.gameCover &&
        state.gameCover.ready === true;
    }
  )).toBe(true);
}

test('projects the unchanged cover clock as two forward-hinged Three.js doors', async ({page}) => {
  const authorityRequests = [];
  page.on('request', request => {
    const pathname =
      new URL(request.url()).pathname;
    if (
      request.method() === 'POST' &&
      pathname === '/index/me'
    ) {
      authorityRequests.push(
        request.url()
      );
    }
  });

  await loginWithModernGraphics(page);
  const initial = await page.evaluate(() => {
    const graphics =
      gh.manager.graphics.getState();
    const legacyCanvas =
      document.querySelector(
        '#game-cover .legacy-game-cover-canvas'
      );
    const modernCanvas =
      document.querySelector(
        '#modernGameCover canvas'
      );
    const modernHost =
      document.getElementById(
        'modernGameCover'
      );
    const coverHost =
      document.getElementById(
        'game-cover'
      );
    window.__coverAuthority = {
      game: gh.manager.game,
      gameId: gh.manager.game.gameid,
      isMyTurn:
        gh.manager.game.isMyTurn,
      playerHand:
        gh.manager.game.p1h,
      opponentHand:
        gh.manager.game.p2h,
      board: gh.manager.game.pb
    };
    window.__coverCallbacks = {
      open: 0,
      close: 0,
      duplicateClose: 0
    };
    return {
      graphics,
      classReady:
        document.querySelector(
          '#game-cover'
        ).classList.contains(
          'graphics-modern-cover-ready'
        ),
      legacyVisibility:
        getComputedStyle(
          legacyCanvas
        ).visibility,
      modernSurface:
        modernCanvas &&
        modernCanvas.dataset
          .modernSurface,
      modernHostDisplay:
        getComputedStyle(
          modernHost
        ).display,
      modernHostPointerEvents:
        getComputedStyle(
          modernHost
        ).pointerEvents,
      modernCanvasPointerEvents:
        getComputedStyle(
          modernCanvas
        ).pointerEvents,
      coverPointerEvents:
        getComputedStyle(
          coverHost
        ).pointerEvents,
      modernHostAriaHidden:
        modernHost.getAttribute(
          'aria-hidden'
        ),
      modernAriaHidden:
        modernCanvas &&
        modernCanvas.getAttribute(
          'aria-hidden'
        ),
      modernTabIndex:
        modernCanvas &&
        modernCanvas.getAttribute(
          'tabindex'
        ),
      modernCacheIdentity:
        modernCanvas &&
        modernCanvas.dataset
          .modernCacheIdentity
    };
  });

  expect(initial).toMatchObject({
    classReady: true,
    legacyVisibility: 'hidden',
    modernSurface: 'game-box-cover',
    modernHostDisplay: 'block',
    modernHostPointerEvents: 'none',
    modernCanvasPointerEvents: 'none',
    coverPointerEvents: 'auto',
    modernHostAriaHidden: 'true',
    modernAriaHidden: 'true',
    modernTabIndex: '-1',
    modernCacheIdentity:
      '0.185.1-game-cover-hinge.1',
    graphics: {
      gameCoverReady: true,
      gameCoverFallbackReason: null,
      gameCover: {
        surface: 'game-box-cover',
        geometry: {
          topology:
            'two-outer-edge-hinged-doors',
          thickness: 10,
          openAngleDegrees: 112,
          onePixelCenterOverlap: true
        },
        presentation: {
          sequence: 0,
          target: 'closed',
          frame: {
            width: 755,
            height: 562
          },
          panels: [
            {
              id: 'left',
              textureUrl:
                '/images/left.png',
              rect: {
                x: 0,
                width: 377,
                height: 562
              },
              hinge: 'left',
              rotationSign: -1
            },
            {
              id: 'right',
              textureUrl:
                '/images/right.png',
              rect: {
                x: 376,
                width: 378,
                height: 562
              },
              hinge: 'right',
              rotationSign: 1
            }
          ]
        },
        currentPose: {
          complete: true,
          openness: 0,
          left: {rotationY: 0},
          right: {rotationY: 0}
        },
        rafActive: false,
        pendingFrameCount: 0,
        gameplayAuthority: false,
        applicationContinuationAuthority:
          false,
        semanticActionCount: 0,
        requestCount: 0
      }
    }
  });

  const openStart = await page.evaluate(() => {
    const startedAt =
      performance.now();
    gh.manager.cover.open(() => {
      window.__coverCallbacks.open += 1;
      window.__coverCallbacks
        .openElapsedMs =
          performance.now() -
          startedAt;
    });
    const state =
      gh.manager.graphics.getState();
    return {
      callbacks:
        window.__coverCallbacks,
      isOpen:
        gh.manager.cover.isopen,
      coverDisplay:
        getComputedStyle(
          document.querySelector(
            '#game-cover'
          )
        ).display,
      gameCover:
        state.gameCover
    };
  });
  expect(openStart).toMatchObject({
    callbacks: {open: 1},
    isOpen: true,
    coverDisplay: 'block',
    gameCover: {
      presentation: {
        sequence: 1,
        target: 'open',
        durationMs: 2000,
        easing: 'cubic-in'
      },
      motion: {
        sequence: 1,
        target: 'open',
        durationMs: 2000
      },
      rafActive: true,
      pendingFrameCount: 1,
      acceptedTransitions: 1
    }
  });
  await page.waitForTimeout(1500);
  const opening = await page.evaluate(() => {
    const state =
      gh.manager.graphics.getState()
        .gameCover;
    return {
      pose: state.currentPose,
      rafActive: state.rafActive,
      pendingFrameCount:
        state.pendingFrameCount
    };
  });
  expect(opening.pose.openness)
    .toBeGreaterThan(0.25);
  expect(opening.pose.openness)
    .toBeLessThan(0.75);
  expect(opening.pose.left.rotationY)
    .toBeLessThan(-0.4);
  expect(opening.pose.right.rotationY)
    .toBeGreaterThan(0.4);
  expect(
    opening.pose.left.innerEdgeDepth
  ).toBeGreaterThan(200);
  expect(
    opening.pose.right.innerEdgeDepth
  ).toBeGreaterThan(200);
  expect(opening).toMatchObject({
    rafActive: true,
    pendingFrameCount: 1
  });

  await expect.poll(() => page.evaluate(
    () => getComputedStyle(
      document.querySelector(
        '#game-cover'
      )
    ).display
  )).toBe('none');
  await expect.poll(() => page.evaluate(
    () => gh.manager.graphics
      .getState().gameCover
      .rafActive
  )).toBe(false);
  const opened = await page.evaluate(() => (
    gh.manager.graphics.getState()
      .gameCover
  ));
  expect(opened).toMatchObject({
    currentPose: {
      complete: true,
      openness: 1
    },
    motion: null,
    rafActive: false,
    pendingFrameCount: 0,
    completedTransitions: 1,
    lastTransition: {
      outcome: 'completed',
      completion: 'animation',
      sequence: 1,
      target: 'open'
    }
  });
  expect(
    opened.currentPose.left
      .projectedInnerEdgeX
  ).toBeLessThan(0);
  expect(
    opened.currentPose.right
      .projectedInnerEdgeX
  ).toBeGreaterThan(755);

  const closeStart =
    await page.evaluate(() => {
      gh.manager.cover.close(() => {
        window.__coverCallbacks.close +=
          1;
      });
      const state =
        gh.manager.graphics.getState();
      return {
        callbacks:
          window.__coverCallbacks,
        isOpen:
          gh.manager.cover.isopen,
        coverDisplay:
          getComputedStyle(
            document.querySelector(
              '#game-cover'
            )
          ).display,
        gameCover:
          state.gameCover
      };
    });
  expect(closeStart).toMatchObject({
    callbacks: {open: 1, close: 0},
    isOpen: false,
    coverDisplay: 'block',
    gameCover: {
      presentation: {
        sequence: 2,
        target: 'closed',
        durationMs: 2000,
        easing: 'cubic-out'
      },
      motion: {
        sequence: 2,
        target: 'closed'
      },
      rafActive: true,
      pendingFrameCount: 1,
      acceptedTransitions: 2
    }
  });

  await page.waitForTimeout(650);
  const closing = await page.evaluate(() => ({
    callbacks:
      window.__coverCallbacks,
    state:
      gh.manager.graphics.getState()
        .gameCover
  }));
  expect(closing.callbacks.close).toBe(0);
  expect(
    closing.state.currentPose.openness
  ).toBeGreaterThan(0);
  expect(
    closing.state.currentPose.openness
  ).toBeLessThan(0.6);
  expect(closing.state.rafActive)
    .toBe(true);

  await expect.poll(() => page.evaluate(
    () => window.__coverCallbacks.close
  )).toBe(1);
  await expect.poll(() => page.evaluate(
    () => gh.manager.graphics
      .getState().gameCover
      .rafActive
  )).toBe(false);
  const closed = await page.evaluate(() => {
    const authority =
      window.__coverAuthority;
    const game = gh.manager.game;
    const beforeSequence =
      gh.manager.graphics.getState()
        .gameCover.presentation.sequence;
    gh.manager.cover.close(() => {
      window.__coverCallbacks
        .duplicateClose += 1;
    });
    const state =
      gh.manager.graphics.getState();
    return {
      state,
      callbacks:
        window.__coverCallbacks,
      beforeSequence,
      authorityIntact:
        game === authority.game &&
        game.gameid ===
          authority.gameId &&
        game.isMyTurn ===
          authority.isMyTurn &&
        game.p1h ===
          authority.playerHand &&
        game.p2h ===
          authority.opponentHand &&
        game.pb === authority.board
    };
  });
  expect(closed).toMatchObject({
    callbacks: {
      open: 1,
      close: 1,
      duplicateClose: 1
    },
    authorityIntact: true,
    state: {
      gameCover: {
        currentPose: {
          complete: true,
          openness: 0,
          left: {rotationY: 0},
          right: {rotationY: 0}
        },
        motion: null,
        rafActive: false,
        pendingFrameCount: 0,
        completedTransitions: 2
      }
    }
  });
  expect(
    closed.state.gameCover
      .presentation.sequence
  ).toBe(closed.beforeSequence);
  expect(authorityRequests).toHaveLength(0);

  await page.evaluate(() => {
    gh.manager.graphics.setMode(
      'legacy',
      false
    );
  });
  await expect.poll(() => page.evaluate(
    () => gh.manager.graphics
      .effectiveMode
  )).toBe('legacy');
  expect(await page.evaluate(() => ({
    classReady:
      document.querySelector(
        '#game-cover'
      ).classList.contains(
        'graphics-modern-cover-ready'
      ),
    legacyVisibility:
      getComputedStyle(
        document.querySelector(
          '#game-cover .legacy-game-cover-canvas'
        )
      ).visibility,
    modernDisplay:
      getComputedStyle(
        document.getElementById(
          'modernGameCover'
        )
      ).display,
    modernSuspended:
      gh.manager.graphics.getState()
        .gameCover.suspended
  }))).toEqual({
    classReady: false,
    legacyVisibility: 'visible',
    modernDisplay: 'none',
    modernSuspended: true
  });
});

test('keeps healthy Modern graphics active when the cover factory fails', async ({page}) => {
  await loginWithModernGraphics(page);

  const isolatedFailure =
    await page.evaluate(() => {
      const graphics =
        gh.manager.graphics;
      graphics.setMode(
        'legacy',
        false
      );
      const healthySurface =
        graphics.surface;
      graphics.disposeGameCoverSurface();
      gh.modernGraphics
        .createGameBoxCoverSurface =
          null;
      graphics.setMode(
        'modern',
        false
      );
      const state =
        graphics.getState();
      return {
        state,
        surfacePreserved:
          graphics.surface ===
            healthySurface,
        classReady:
          document.getElementById(
            'game-cover'
          ).classList.contains(
            'graphics-modern-cover-ready'
          ),
        legacyVisibility:
          getComputedStyle(
            document.querySelector(
              '#game-cover .legacy-game-cover-canvas'
            )
          ).visibility,
        modernDisplay:
          getComputedStyle(
            document.getElementById(
              'modernGameCover'
            )
          ).display
      };
    });

  expect(isolatedFailure).toMatchObject({
    surfacePreserved: true,
    classReady: false,
    legacyVisibility: 'visible',
    modernDisplay: 'none',
    state: {
      requestedMode: 'modern',
      effectiveMode: 'modern',
      fallbackReason: null,
      gameCoverReady: false,
      gameCoverFallbackReason:
        'initialization-failed',
      gameCover: null
    }
  });
});
