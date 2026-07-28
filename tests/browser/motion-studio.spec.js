'use strict';

const {test, expect} = require('@playwright/test');

const PLAYBOOK_STORAGE_KEY = 'purett.lobbyMotionPlaybook.v1';
const TURN_MARKER_STORAGE_KEY = 'purett.turnMarkerMotion.v1';
const STUDIO_SESSION_KEY = 'purett.motionStudio.v2';
const CONTENT_SCALE_STORAGE_KEY = 'purett.contentScale';
const PLAYBOOK_TARGET_IDS = [
  'lobby-card-1-intro',
  'lobby-card-2-intro',
  'lobby-card-3-intro',
  'lobby-card-4-intro',
  'lobby-card-5-intro',
  'lobby-hand-gentle-wind-exit'
];
const COIN_TARGET_ID = 'match-turn-coin-transition';
const APPLICATION_TARGET_IDS = [
  ...PLAYBOOK_TARGET_IDS,
  COIN_TARGET_ID
];

async function loginWithLegacyGraphics(page) {
  await page.goto('/auth/login');
  await page.evaluate(({playbookKey, turnMarkerKey, sessionKey}) => {
    window.localStorage.removeItem('purett.graphicsMode.v1');
    window.localStorage.removeItem(playbookKey);
    window.localStorage.removeItem(turnMarkerKey);
    window.sessionStorage.removeItem('purett.motionStudio.v1');
    window.sessionStorage.removeItem(sessionKey);
    window.sessionStorage.removeItem('purett.contentScale');
  }, {
    playbookKey: PLAYBOOK_STORAGE_KEY,
    turnMarkerKey: TURN_MARKER_STORAGE_KEY,
    sessionKey: STUDIO_SESSION_KEY
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
    gh.manager.graphics &&
    gh.manager.motionstudio &&
    gh.manager.menu.visible &&
    gh.manager.menu.hand.length === 5
  ))).toBe(true);
  await expect(page.locator('ul.mainmenu li.play')).toBeVisible();
}

async function openMotionStudio(page) {
  await page.locator('#title-icon').click();
  await page.locator('#contextmenu li.motion-studio > button').click();
  await expect(page.locator('#motionstudio')).toBeVisible();
  await expect(page.locator('#motionstudio')).toHaveAttribute(
    'aria-hidden',
    'false'
  );
  await expect.poll(() => page.evaluate(() => {
    const state = gh.manager.graphics.getState();
    return Boolean(
      state.motionStudioOpen &&
      state.motionStudio &&
      state.motionStudio.ready &&
      gh.manager.motionstudio.opened &&
      gh.manager.motionstudio.playbook
    );
  })).toBe(true);
}

async function fillMotionField(page, field, value) {
  await page.locator(
    '#motionstudio input[type="number"]' +
      `[data-motion-field="${field}"]`
  ).fill(String(value));
}

test('authors six application targets as one playbook and keeps edits draft-only until an explicit apply', async ({page}) => {
  const modernRequests = [];
  page.on('request', request => {
    if (request.url().includes('/js/modern/purett-modern-graphics.min.js')) {
      modernRequests.push(request.url());
    }
  });

  await loginWithLegacyGraphics(page);
  await page.evaluate(() => {
    window.__motionStudioLegacyCards =
      gh.manager.menu.hand.map(card => card.node);
  });
  await openMotionStudio(page);

  const opened = await page.evaluate(({playbookKey}) => ({
    graphics: gh.manager.graphics.getState(),
    storedMode: window.localStorage.getItem('purett.graphicsMode.v1'),
    storedPlaybook: window.localStorage.getItem(playbookKey),
    targetIds: gh.manager.motionstudio.api.playbook.targets.map(
      target => target.id
    ),
    targetCount: Object.keys(
      gh.manager.motionstudio.playbook.targets
    ).length,
    canvasCount: document.querySelectorAll(
      '#motionstudio-canvas-host canvas.motion-studio-canvas'
    ).length
  }), {playbookKey: PLAYBOOK_STORAGE_KEY});
  expect(opened.graphics).toMatchObject({
    requestedMode: 'legacy',
    effectiveMode: 'legacy',
    surfaceKind: null,
    motionStudioOpen: true,
    motionStudio: {
      surface: 'motion-studio',
      ready: true,
      disposed: false,
      canvasCount: 1
    }
  });
  expect(opened).toMatchObject({
    storedMode: null,
    storedPlaybook: null,
    targetIds: PLAYBOOK_TARGET_IDS,
    targetCount: 6,
    canvasCount: 1
  });
  expect(modernRequests).toHaveLength(1);
  expect(await page.locator('#motionstudio-target option').evaluateAll(
    options => options.map(option => option.value)
  )).toEqual(APPLICATION_TARGET_IDS);
  await expect(page.locator(
    '#motionstudio .motion-studio-preview-hint'
  )).toContainText('application target is locked');
  await expect(page.locator(
    '#motionstudio .motion-studio-marker-land text'
  )).toHaveText('LOCKED TARGET');

  await page.locator('#motionstudio-auto-replay').uncheck();
  await page.locator('#motionstudio-target').selectOption(
    'lobby-card-3-intro'
  );
  await expect.poll(() => page.evaluate(() => (
    gh.manager.motionstudio.activeTargetId
  ))).toBe('lobby-card-3-intro');

  const beforeDraft = await page.evaluate(() => ({
    application: gh.manager.motionstudio.api.playbook.serialize(
      gh.manager.graphics.getLobbyPlaybook()
    ),
    direction:
      gh.manager.motionstudio.preset.path.directionDeg,
    firstCardDirection:
      gh.manager.motionstudio.playbook.targets[
        'lobby-card-1-intro'
      ].preset.path.directionDeg
  }));
  const editedDirection = beforeDraft.direction >= 135
    ? beforeDraft.direction - 37
    : beforeDraft.direction + 37;
  await page.locator(
    '#motionstudio input[type="number"]' +
      '[data-motion-field="path.directionDeg"]'
  ).fill(String(editedDirection));
  await expect.poll(() => page.evaluate(() => (
    gh.manager.motionstudio.preset.path.directionDeg
  ))).toBe(editedDirection);

  await page.locator('#motionstudio-target').selectOption(
    'lobby-card-5-intro'
  );
  await page.locator(
    '#motionstudio input[type="number"]' +
      '[data-motion-field="entry.delayMs"]'
  ).fill('615');
  await expect.poll(() => page.evaluate(() => (
    gh.manager.motionstudio.entryDelayMs
  ))).toBe(615);
  await page.locator('#motionstudio-target').selectOption(
    'lobby-card-3-intro'
  );

  const draft = await page.evaluate(({playbookKey, sessionKey}) => {
    const controller = gh.manager.motionstudio;
    const session = JSON.parse(
      window.sessionStorage.getItem(sessionKey)
    );
    return {
      application: controller.api.playbook.serialize(
        gh.manager.graphics.getLobbyPlaybook()
      ),
      storedPlaybook: window.localStorage.getItem(playbookKey),
      session,
      activeTargetId: controller.activeTargetId,
      activePresetName: controller.activePresetName,
      thirdCardDirection:
        controller.playbook.targets[
          'lobby-card-3-intro'
        ].preset.path.directionDeg,
      fifthCardDelay:
        controller.playbook.targets[
          'lobby-card-5-intro'
        ].delayMs,
      firstCardDirection:
        controller.playbook.targets[
          'lobby-card-1-intro'
        ].preset.path.directionDeg,
      lockedCoordinates: Object.values(
        controller.playbook.targets
      ).every(entry => (
        entry.preset.path.landingXPx === 0 &&
        entry.preset.path.landingYPx === 0 &&
        entry.preset.scale.cardScale === 1 &&
        entry.preset.scale.end === 1
      ))
    };
  }, {
    playbookKey: PLAYBOOK_STORAGE_KEY,
    sessionKey: STUDIO_SESSION_KEY
  });
  expect(draft).toMatchObject({
    application: beforeDraft.application,
    storedPlaybook: null,
    activeTargetId: 'lobby-card-3-intro',
    activePresetName: 'custom',
    thirdCardDirection: editedDirection,
    fifthCardDelay: 615,
    firstCardDirection: beforeDraft.firstCardDirection,
    lockedCoordinates: true
  });
  expect(draft.session).toMatchObject({
    studioSessionVersion: 2,
    activeTargetId: 'lobby-card-3-intro'
  });
  expect(JSON.parse(draft.session.draftPlaybook).targets[
    'lobby-card-3-intro'
  ].preset.path.directionDeg).toBe(editedDirection);

  await page.locator('details.motion-studio-json summary').click();
  await page.locator('#motionstudio .motion-studio-copy').click();
  const exported = await page.locator('#motionstudio-json').inputValue();
  const exportedPlaybook = JSON.parse(exported);
  expect(exportedPlaybook).toMatchObject({
    schemaVersion: 1,
    id: 'lobby-card-motion',
    wind: {
      locked: false
    }
  });
  expect(Object.keys(exportedPlaybook.targets)).toEqual(
    PLAYBOOK_TARGET_IDS
  );
  expect(exported).not.toContain('destination');
  expect(exported).not.toContain('screenRect');

  exportedPlaybook.targets['lobby-card-1-intro'].delayMs = 145;
  exportedPlaybook.targets[
    'lobby-card-5-intro'
  ].preset.path.curvePx = 91;
  await page.locator('#motionstudio-json').fill(
    JSON.stringify(exportedPlaybook)
  );
  await page.locator(
    '#motionstudio .motion-studio-apply-json'
  ).click();
  await expect(
    page.locator('#motionstudio .motion-studio-json-status')
  ).toContainText('complete lobby playbook was imported');

  const imported = await page.evaluate(({playbookKey}) => {
    const application = gh.manager.graphics.getLobbyPlaybook();
    const stored = JSON.parse(
      window.localStorage.getItem(playbookKey)
    );
    return {
      revision: gh.manager.graphics.getState().playbookRevision,
      targetCount: Object.keys(application.targets).length,
      firstDelay:
        application.targets['lobby-card-1-intro'].delayMs,
      fifthCurve:
        application.targets[
          'lobby-card-5-intro'
        ].preset.path.curvePx,
      storedMatches:
        JSON.stringify(stored) === JSON.stringify(application)
    };
  }, {playbookKey: PLAYBOOK_STORAGE_KEY});
  expect(imported).toEqual({
    revision: 1,
    targetCount: 6,
    firstDelay: 145,
    fifthCurve: 91,
    storedMatches: true
  });

  await page.locator('#motionstudio-json').press('Escape');
  await expect(page.locator('#motionstudio')).toBeVisible();
  await page.locator('#motionstudio .motion-studio-back').click();
  await expect(page.locator('#motionstudio')).toBeHidden();
  await expect(page.locator('#motionstudio-canvas-host canvas')).toHaveCount(
    0
  );

  const closed = await page.evaluate(() => {
    const legacyCards = document.querySelectorAll(
      '.legacy-menu-hand-card'
    );
    return {
      graphics: gh.manager.graphics.getState(),
      controllerOpen: gh.manager.motionstudio.opened,
      legacyCardsIntact:
        legacyCards.length === 5 &&
        window.__motionStudioLegacyCards.every((node, index) => (
          node === legacyCards[index] &&
          node.isConnected &&
          node.getAttribute('aria-hidden') === 'false' &&
          getComputedStyle(node).opacity !== '0'
        ))
    };
  });
  expect(closed.graphics).toMatchObject({
    requestedMode: 'legacy',
    effectiveMode: 'legacy',
    motionStudioOpen: false,
    motionStudio: null
  });
  expect(closed).toMatchObject({
    controllerOpen: false,
    legacyCardsIntact: true
  });
  expect(modernRequests).toHaveLength(1);
});

test('authors and applies the active-match coin flight in exact match coordinates', async ({page}) => {
  await loginWithLegacyGraphics(page);
  await openMotionStudio(page);
  await page.locator('#motionstudio-auto-replay').uncheck();

  await expect(page.locator(
    '#motionstudio .motion-studio-coin-direction-label'
  )).toBeHidden();
  await expect(page.locator(
    '[data-motion-field="rotation.flipTurns"]'
  ).first()).toBeHidden();

  await page.locator('#motionstudio-target').selectOption(
    COIN_TARGET_ID
  );
  await expect(page.locator('#motionstudio')).toHaveClass(
    /motion-studio-coin-target/
  );
  await expect(page.locator(
    '#motionstudio .motion-studio-coin-direction-label'
  )).toBeVisible();
  await expect(page.locator(
    '#motionstudio .motion-studio-preset-label'
  )).toBeHidden();
  await expect(page.locator(
    '[data-motion-field="rotation.flipTurns"]'
  ).first()).toBeVisible();
  await expect(page.locator(
    '[data-motion-field="rotation.xTurns"]'
  ).first()).toBeHidden();
  await expect(page.locator(
    '#motionstudio .motion-studio-preview-hint'
  )).toContainText('Endpoints are locked');
  await expect(page.locator(
    '#motionstudio .motion-studio-marker-start text'
  )).toHaveText('LOCKED SOURCE');
  await expect(page.locator(
    '#motionstudio .motion-studio-apply-preview'
  )).toHaveText('Apply to Match Coin');

  await expect.poll(() => page.evaluate(() => {
    const state = gh.manager.graphics.getState().motionStudio;
    return state && state.ready
      ? {
        subjectKind: state.subjectKind,
        coordinateSpace: state.coordinateSpace,
        subject: state.subject,
        resources: state.resources
      }
      : null;
  })).toMatchObject({
    subjectKind: 'coin',
    coordinateSpace: {
      kind: 'active-match',
      logicalWidth: 693,
      logicalHeight: 500,
      stageOffsetX: 30,
      stageOffsetY: 30
    },
    subject: {
      source: {x: 53.5, y: 440.5},
      destination: {x: 641.5, y: 440.5},
      direction: 'player-to-opponent'
    },
    resources: {
      coinDiameter: 41,
      coinThickness: 3,
      hasSubjectRoot: true,
      hasShadow: true
    }
  });

  await page.locator('#motionstudio-coin-direction').selectOption(
    'opponent-to-player'
  );
  await fillMotionField(page, 'path.curvePx', -83);
  await fillMotionField(page, 'path.apexHeight', 118);
  await fillMotionField(page, 'rotation.flipTurns', 3.25);
  await fillMotionField(page, 'rotation.tumbleTurns', 0.75);
  await fillMotionField(page, 'rotation.spinTurns', -0.25);
  await fillMotionField(page, 'rotation.contactTiltDeg', 11);
  await fillMotionField(page, 'landing.settleMs', 135);

  const sampled = await page.evaluate(() => {
    const controller = gh.manager.motionstudio;
    const before = gh.manager.graphics.getState().motionStudio;
    controller.surface.seek(before.durationMs / 2);
    const state = gh.manager.graphics.getState().motionStudio;
    return {
      stored:
        window.localStorage.getItem(
          'purett.turnMarkerMotion.v1'
        ),
      revision:
        gh.manager.graphics.getState()
          .turnMarkerMotionRevision,
      state
    };
  });
  expect(sampled.stored).toBeNull();
  expect(sampled.revision).toBe(0);
  expect(sampled.state).toMatchObject({
    subjectKind: 'coin',
    subject: {
      source: {x: 641.5, y: 440.5},
      destination: {x: 53.5, y: 440.5},
      direction: 'opponent-to-player'
    },
    preset: {
      path: {
        curvePx: -83,
        apexHeight: 118
      },
      rotation: {
        flipTurns: 3.25,
        tumbleTurns: 0.75,
        spinTurns: -0.25,
        contactTiltDeg: 11
      },
      landing: {
        settleMs: 135
      }
    }
  });
  expect(sampled.state.pose.height).toBeGreaterThan(50);
  expect(sampled.state.pose.rotationX).not.toBe(0);
  expect(sampled.state.pose.rotationY).not.toBe(0);
  expect(sampled.state.pose.rotationZ).not.toBe(0);
  expect(sampled.state.pose.screenX).toBeLessThan(641.5);
  expect(sampled.state.pose.screenX).toBeGreaterThan(53.5);

  await page.locator(
    '#motionstudio .motion-studio-apply-preview'
  ).click();
  await expect(page.locator(
    '#motionstudio .motion-studio-control-status'
  )).toContainText('Modern match turn changes now use this coin profile');

  const applied = await page.evaluate(({storageKey, sessionKey}) => {
    const graphics = gh.manager.graphics.getState();
    const profile = JSON.parse(
      window.localStorage.getItem(storageKey)
    );
    const session = JSON.parse(
      window.sessionStorage.getItem(sessionKey)
    );
    return {
      revision: graphics.turnMarkerMotionRevision,
      profile,
      activeTargetId:
        gh.manager.motionstudio.activeTargetId,
      session: {
        activeTargetId: session.activeTargetId,
        coinPreviewDirection:
          session.coinPreviewDirection,
        draftTurnMarkerPreset:
          JSON.parse(session.draftTurnMarkerPreset)
      },
      lobbyPlaybook:
        window.localStorage.getItem(
          'purett.lobbyMotionPlaybook.v1'
        )
    };
  }, {
    storageKey: TURN_MARKER_STORAGE_KEY,
    sessionKey: STUDIO_SESSION_KEY
  });
  expect(applied).toMatchObject({
    revision: 1,
    activeTargetId: COIN_TARGET_ID,
    profile: {
      schemaVersion: 1,
      path: {
        curvePx: -83,
        apexHeight: 118
      },
      rotation: {
        flipTurns: 3.25,
        tumbleTurns: 0.75,
        spinTurns: -0.25,
        contactTiltDeg: 11
      },
      landing: {
        settleMs: 135
      }
    },
    session: {
      activeTargetId: COIN_TARGET_ID,
      coinPreviewDirection: 'opponent-to-player',
      draftTurnMarkerPreset: {
        path: {
          curvePx: -83,
          apexHeight: 118
        }
      }
    },
    lobbyPlaybook: null
  });
});

test('inherits the selected game scale while retaining logical board coordinates and reachable controls', async ({page}) => {
  await loginWithLegacyGraphics(page);
  await page.locator('#title-icon').click();
  await page.locator(
    '#contextmenu button[data-scale="2"]'
  ).click();
  await openMotionStudio(page);

  const inspectScale = () => page.evaluate(({storageKey}) => {
    const rect = node => {
      const value = node.getBoundingClientRect();
      return {
        left: value.left,
        top: value.top,
        right: value.right,
        bottom: value.bottom,
        width: value.width,
        height: value.height
      };
    };
    const intersects = (first, second) => !(
      first.right <= second.left ||
      first.left >= second.right ||
      first.bottom <= second.top ||
      first.top >= second.bottom
    );
    const root = document.querySelector('#motionstudio');
    const stage = document.querySelector(
      '.motion-studio-scale-stage'
    );
    const shell = document.querySelector('.motion-studio-shell');
    const previewNode = document.querySelector(
      '#motionstudio-preview'
    );
    const preview = rect(previewNode);
    const host = rect(document.querySelector(
      '#motionstudio-canvas-host'
    ));
    const canvasNode = document.querySelector(
      '#motionstudio-canvas-host canvas'
    );
    const canvas = rect(canvasNode);
    const helpersNode = document.querySelector(
      '#motionstudio .motion-studio-helpers'
    );
    const helpers = rect(helpersNode);
    const dock = rect(document.querySelector('.motion-studio-dock'));
    const controls = Array.from(document.querySelectorAll(
      '#motionstudio button, #motionstudio select, ' +
      '#motionstudio input, #motionstudio textarea, ' +
      '#motionstudio summary'
    )).filter(node => {
      const style = window.getComputedStyle(node);
      return style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        node.getClientRects().length > 0;
    }).map(node => rect(node));
    const graphicsState = gh.manager.graphics.getState();
    return {
      managerScale: gh.manager.contentScale,
      controllerScale: gh.manager.motionstudio.contentScale,
      scaleAttribute: root.getAttribute('data-content-scale'),
      storedScale: window.sessionStorage.getItem(storageKey),
      activeElementId: document.activeElement.id,
      logicalPreview: {
        width: previewNode.offsetWidth,
        height: previewNode.offsetHeight
      },
      content: rect(document.querySelector('#content')),
      stage: rect(stage),
      shell: rect(shell),
      preview,
      host,
      canvas,
      helpers,
      dock,
      helperViewBox: helpersNode.getAttribute('viewBox'),
      controlsIntersectBoard:
        controls.some(control => intersects(control, preview)),
      rootClient: {
        width: root.clientWidth,
        height: root.clientHeight
      },
      rootScroll: {
        width: root.scrollWidth,
        height: root.scrollHeight,
        left: root.scrollLeft,
        top: root.scrollTop
      },
      pixelRatio: graphicsState.motionStudio.pixelRatio,
      motionPath: graphicsState.motionStudio.plan.path,
      motionContext: graphicsState.motionStudio.motionContext,
      devicePixelRatio: window.devicePixelRatio || 1,
      canvasBacking: {
        width: canvasNode.width,
        height: canvasNode.height
      }
    };
  }, {storageKey: CONTENT_SCALE_STORAGE_KEY});

  const doubled = await inspectScale();
  expect(doubled).toMatchObject({
    managerScale: 2,
    controllerScale: 2,
    scaleAttribute: '2',
    storedScale: '2',
    activeElementId: 'motionstudio',
    logicalPreview: {
      width: 755,
      height: 562
    },
    helperViewBox: '0 0 755 562',
    controlsIntersectBoard: false
  });
  expect(doubled.content.width).toBeCloseTo(1510, 0);
  expect(doubled.content.height).toBeCloseTo(1124, 0);
  expect(doubled.preview.width).toBeCloseTo(1510, 0);
  expect(doubled.preview.height).toBeCloseTo(1124, 0);
  for (const layer of [
    doubled.host,
    doubled.canvas,
    doubled.helpers
  ]) {
    expect(layer).toMatchObject({
      left: doubled.preview.left,
      top: doubled.preview.top
    });
    expect(layer.width).toBeCloseTo(1510, 0);
    expect(layer.height).toBeCloseTo(1124, 0);
  }
  expect(doubled.stage.width).toBeCloseTo(1510, 0);
  expect(doubled.stage.height).toBeCloseTo(2272, 0);
  expect(doubled.shell).toMatchObject({
    left: doubled.stage.left,
    top: doubled.stage.top
  });
  expect(doubled.shell.width).toBeCloseTo(1510, 0);
  expect(doubled.shell.height).toBeCloseTo(2272, 0);
  expect(doubled.dock.top).toBeGreaterThanOrEqual(
    doubled.preview.bottom
  );
  expect(doubled.rootScroll.width).toBeGreaterThan(
    doubled.rootClient.width
  );
  expect(doubled.rootScroll.height).toBeGreaterThan(
    doubled.rootClient.height
  );
  expect(doubled.rootScroll).toMatchObject({
    left: 0,
    top: 0
  });
  const expectedDoubledPixelRatio = Math.min(
    doubled.devicePixelRatio * 2,
    3
  );
  expect(doubled.pixelRatio).toBeCloseTo(
    expectedDoubledPixelRatio,
    5
  );
  expect(doubled.canvasBacking).toEqual({
    width: Math.floor(755 * expectedDoubledPixelRatio),
    height: Math.floor(562 * expectedDoubledPixelRatio)
  });

  await page.evaluate(() => {
    gh.manager.setContentScale(3, true);
  });
  await expect.poll(() => inspectScale()).toMatchObject({
    managerScale: 3,
    controllerScale: 3,
    scaleAttribute: '3',
    storedScale: '3',
    logicalPreview: {
      width: 755,
      height: 562
    }
  });
  const tripled = await inspectScale();
  expect(tripled.preview.width).toBeCloseTo(2265, 0);
  expect(tripled.preview.height).toBeCloseTo(1686, 0);
  expect(tripled.stage.width).toBeCloseTo(2265, 0);
  expect(tripled.stage.height).toBeCloseTo(3408, 0);
  expect(tripled.controlsIntersectBoard).toBe(false);
  expect(tripled.motionPath).toEqual(doubled.motionPath);
  expect(tripled.motionContext).toEqual(doubled.motionContext);
  const expectedTripledPixelRatio = Math.min(
    tripled.devicePixelRatio * 3,
    3
  );
  expect(tripled.pixelRatio).toBeCloseTo(
    expectedTripledPixelRatio,
    5
  );
  expect(tripled.canvasBacking).toEqual({
    width: Math.floor(755 * expectedTripledPixelRatio),
    height: Math.floor(562 * expectedTripledPixelRatio)
  });

  const reachability = await page.evaluate(() => {
    const root = document.querySelector('#motionstudio');
    root.scrollLeft = root.scrollWidth;
    root.scrollTop = root.scrollHeight;
    const transport = document.querySelector(
      '.motion-studio-transport'
    ).getBoundingClientRect();
    return {
      maxScrollLeft: root.scrollLeft,
      maxScrollTop: root.scrollTop,
      transportVisible:
        transport.right > 0 &&
        transport.left < root.clientWidth &&
        transport.bottom > 0 &&
        transport.top < root.clientHeight
    };
  });
  expect(reachability.maxScrollLeft).toBeGreaterThan(0);
  expect(reachability.maxScrollTop).toBeGreaterThan(0);
  expect(reachability.transportVisible).toBe(true);
});

test('uses the full lobby board as its stage and copies shared intro motion without flattening per-card travel', async ({page}) => {
  await loginWithLegacyGraphics(page);
  await openMotionStudio(page);
  await page.locator('#motionstudio-auto-replay').uncheck();

  const geometry = await page.evaluate(() => {
    const rect = node => {
      const value = node.getBoundingClientRect();
      return {
        left: value.left,
        top: value.top,
        right: value.right,
        bottom: value.bottom,
        width: value.width,
        height: value.height
      };
    };
    const intersects = (first, second) => !(
      first.right <= second.left ||
      first.left >= second.right ||
      first.bottom <= second.top ||
      first.top >= second.bottom
    );
    const preview = rect(document.querySelector('#motionstudio-preview'));
    const host = rect(
      document.querySelector('#motionstudio-canvas-host')
    );
    const canvas = rect(
      document.querySelector('#motionstudio-canvas-host canvas')
    );
    const helpers = rect(
      document.querySelector('#motionstudio .motion-studio-helpers')
    );
    const controls = Array.from(document.querySelectorAll(
      '#motionstudio button, #motionstudio select, ' +
      '#motionstudio input, #motionstudio textarea, ' +
      '#motionstudio summary'
    )).filter(node => {
      const style = window.getComputedStyle(node);
      return style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        node.getClientRects().length > 0;
    }).map(node => ({
      label:
        node.getAttribute('aria-label') ||
        node.textContent.trim() ||
        node.id,
      intersects: intersects(preview, rect(node))
    }));
    return {
      parentIsBody:
        document.querySelector('#motionstudio').parentNode ===
          document.body,
      content: rect(document.querySelector('#content')),
      preview,
      host,
      canvas,
      helpers,
      helperViewBox: document.querySelector(
        '#motionstudio .motion-studio-helpers'
      ).getAttribute('viewBox'),
      boardBackdrop: window.getComputedStyle(
        document.querySelector('.motion-studio-preview-panel')
      ).backgroundImage,
      intersectingControls:
        controls.filter(control => control.intersects)
    };
  });
  expect(geometry.parentIsBody).toBe(true);
  expect(geometry.content).toMatchObject({
    width: 755,
    height: 562
  });
  expect(geometry.preview).toMatchObject({
    width: 755,
    height: 562
  });
  for (const layer of [
    geometry.host,
    geometry.canvas,
    geometry.helpers
  ]) {
    expect(layer).toMatchObject({
      left: geometry.preview.left,
      top: geometry.preview.top,
      width: 755,
      height: 562
    });
  }
  expect(geometry.helperViewBox).toBe('0 0 755 562');
  expect(geometry.boardBackdrop).toContain('gameBoard.png');
  expect(geometry.intersectingControls).toEqual([]);

  await page.locator('#motionstudio-target').selectOption(
    'lobby-card-2-intro'
  );
  await fillMotionField(page, 'entry.delayMs', 165);
  await fillMotionField(page, 'path.directionDeg', -44);
  await fillMotionField(page, 'path.distancePx', 350);
  await fillMotionField(page, 'path.curvePx', 85);

  await page.locator('#motionstudio-target').selectOption(
    'lobby-card-3-intro'
  );
  await fillMotionField(page, 'entry.delayMs', 320);
  await fillMotionField(page, 'path.directionDeg', 52);
  await fillMotionField(page, 'path.distancePx', 620);
  await fillMotionField(page, 'path.curvePx', -75);

  await page.locator('#motionstudio-target').selectOption(
    'lobby-card-1-intro'
  );
  await fillMotionField(page, 'path.releaseHeight', 219);
  await fillMotionField(page, 'path.apexHeight', 341);
  await fillMotionField(page, 'path.flightMs', 1080);
  await fillMotionField(page, 'rotation.xTurns', 1.35);
  await fillMotionField(page, 'rotation.releaseRollDeg', 73);
  await page.locator('#motionstudio-scale-mode').selectOption(
    'keyframed'
  );
  await fillMotionField(page, 'scale.apex', 1.27);

  await expect(page.locator(
    '#motionstudio .motion-studio-intro-copy'
  )).toBeVisible();
  expect(await page.locator(
    '#motionstudio-copy-target option'
  ).evaluateAll(options => options.map(option => option.value))).toEqual([
    '',
    'all',
    'lobby-card-2-intro',
    'lobby-card-3-intro',
    'lobby-card-4-intro',
    'lobby-card-5-intro'
  ]);

  await page.locator('#motionstudio-copy-target').selectOption(
    'lobby-card-2-intro'
  );
  await page.locator(
    '#motionstudio .motion-studio-copy-intro'
  ).click();
  await expect(page.locator(
    '#motionstudio .motion-studio-control-status'
  )).toContainText('Lobby card 2 — Intro');
  const copiedToOne = await page.evaluate(() => {
    const targets = gh.manager.motionstudio.playbook.targets;
    return {
      secondHeight:
        targets['lobby-card-2-intro'].preset.path.releaseHeight,
      secondDelay:
        targets['lobby-card-2-intro'].delayMs,
      thirdHeight:
        targets['lobby-card-3-intro'].preset.path.releaseHeight
    };
  });
  expect(copiedToOne).toEqual({
    secondHeight: 219,
    secondDelay: 165,
    thirdHeight: 185
  });

  await page.locator('#motionstudio-copy-target').selectOption('all');
  await page.locator(
    '#motionstudio .motion-studio-copy-intro'
  ).click();
  await expect(page.locator(
    '#motionstudio .motion-studio-control-status'
  )).toContainText('kept its start delay, heading, distance, and curve');

  const copied = await page.evaluate(({playbookKey, sessionKey}) => {
    const controller = gh.manager.motionstudio;
    const targets = controller.playbook.targets;
    const source = targets['lobby-card-1-intro'].preset;
    return {
      storedPlaybook: window.localStorage.getItem(playbookKey),
      application: controller.api.playbook.serialize(
        gh.manager.graphics.getLobbyPlaybook()
      ),
      draft: controller.api.playbook.serialize(controller.playbook),
      sessionDraft: JSON.parse(
        window.sessionStorage.getItem(sessionKey)
      ).draftPlaybook,
      copiedShared: [
        'lobby-card-2-intro',
        'lobby-card-3-intro',
        'lobby-card-4-intro',
        'lobby-card-5-intro'
      ].every(targetId => {
        const preset = targets[targetId].preset;
        return preset.path.releaseHeight ===
            source.path.releaseHeight &&
          preset.path.apexHeight === source.path.apexHeight &&
          preset.path.flightMs === source.path.flightMs &&
          preset.rotation.xTurns === source.rotation.xTurns &&
          preset.rotation.releaseRollDeg ===
            source.rotation.releaseRollDeg &&
          preset.scale.mode === source.scale.mode &&
          preset.scale.apex === source.scale.apex;
      }),
      second: {
        delayMs: targets['lobby-card-2-intro'].delayMs,
        directionDeg:
          targets['lobby-card-2-intro'].preset.path.directionDeg,
        distancePx:
          targets['lobby-card-2-intro'].preset.path.distancePx,
        curvePx:
          targets['lobby-card-2-intro'].preset.path.curvePx
      },
      third: {
        delayMs: targets['lobby-card-3-intro'].delayMs,
        directionDeg:
          targets['lobby-card-3-intro'].preset.path.directionDeg,
        distancePx:
          targets['lobby-card-3-intro'].preset.path.distancePx,
        curvePx:
          targets['lobby-card-3-intro'].preset.path.curvePx
      },
      windUnchanged:
        JSON.stringify(targets[
          'lobby-hand-gentle-wind-exit'
        ]) === JSON.stringify(
          controller.api.playbook.defaults.targets[
            'lobby-hand-gentle-wind-exit'
          ]
        )
    };
  }, {
    playbookKey: PLAYBOOK_STORAGE_KEY,
    sessionKey: STUDIO_SESSION_KEY
  });
  expect(copied.storedPlaybook).toBeNull();
  expect(copied.application).not.toBe(copied.draft);
  expect(copied.sessionDraft).toBe(copied.draft);
  expect(copied.copiedShared).toBe(true);
  expect(copied.second).toEqual({
    delayMs: 165,
    directionDeg: -44,
    distancePx: 350,
    curvePx: 85
  });
  expect(copied.third).toEqual({
    delayMs: 320,
    directionDeg: 52,
    distancePx: 620,
    curvePx: -75
  });
  expect(copied.windUnchanged).toBe(true);

  await page.locator('#motionstudio-target').selectOption(
    'lobby-hand-gentle-wind-exit'
  );
  await expect(page.locator(
    '#motionstudio .motion-studio-intro-copy'
  )).toBeHidden();
  await page.locator('#motionstudio .motion-studio-back').click();
  await openMotionStudio(page);
  await page.locator('#motionstudio-target').selectOption(
    'lobby-card-2-intro'
  );
  await expect(page.locator(
    '#motionstudio input[type="number"]' +
      '[data-motion-field="path.releaseHeight"]'
  )).toHaveValue('219');
  await expect(page.locator(
    '#motionstudio input[type="number"]' +
      '[data-motion-field="entry.delayMs"]'
  )).toHaveValue('165');
});

test('Apply & Preview runs the production Gentle Wind exit and restores the Legacy preference', async ({page}) => {
  const modernRequests = [];
  page.on('request', request => {
    if (request.url().includes('/js/modern/purett-modern-graphics.min.js')) {
      modernRequests.push(request.url());
    }
  });

  await loginWithLegacyGraphics(page);
  await page.evaluate(() => {
    window.__motionStudioLegacyCards =
      gh.manager.menu.hand.map(card => card.node);
  });
  await openMotionStudio(page);
  await page.locator('#motionstudio-auto-replay').uncheck();

  await page.locator('#motionstudio-target').selectOption(
    'lobby-card-2-intro'
  );
  const introDirection = await page.evaluate(() => (
    gh.manager.motionstudio.preset.path.directionDeg + 29
  ));
  await page.locator(
    '#motionstudio input[type="number"]' +
      '[data-motion-field="path.directionDeg"]'
  ).fill(String(introDirection));

  await page.locator('#motionstudio-target').selectOption(
    'lobby-hand-gentle-wind-exit'
  );
  await expect(page.locator('#motionstudio')).toHaveClass(
    /motion-studio-exit-target/
  );
  await expect(page.locator(
    '#motionstudio .motion-studio-wind-tools'
  )).toBeVisible();
  await expect(page.locator(
    '#motionstudio .motion-studio-preview-hint'
  )).toContainText('lobby origin is locked');
  await expect(page.locator(
    '#motionstudio input[type="number"]' +
      '[data-motion-field="entry.delayMs"]'
  )).toHaveAttribute('aria-label', 'Pickup cadence value');
  await page.locator('#motionstudio-lock-wind-seed').check();
  const seed = await page.locator(
    '#motionstudio-wind-seed'
  ).textContent();
  expect(seed.trim()).not.toBe('');

  const beforeApply = await page.evaluate(({playbookKey}) => ({
    requestedMode: gh.manager.graphics.requestedMode,
    effectiveMode: gh.manager.graphics.effectiveMode,
    storedMode: window.localStorage.getItem('purett.graphicsMode.v1'),
    storedPlaybook: window.localStorage.getItem(playbookKey),
    revision: gh.manager.graphics.playbookRevision,
    applicationDirection:
      gh.manager.graphics.getLobbyPlaybook().targets[
        'lobby-card-2-intro'
      ].preset.path.directionDeg,
    draftDirection:
      gh.manager.motionstudio.playbook.targets[
        'lobby-card-2-intro'
      ].preset.path.directionDeg
  }), {playbookKey: PLAYBOOK_STORAGE_KEY});
  expect(beforeApply).toMatchObject({
    requestedMode: 'legacy',
    effectiveMode: 'legacy',
    storedMode: null,
    storedPlaybook: null,
    revision: 0,
    draftDirection: introDirection
  });
  expect(beforeApply.applicationDirection).not.toBe(
    beforeApply.draftDirection
  );

  await page.locator(
    '#motionstudio .motion-studio-apply-preview'
  ).click();
  await expect(page.locator('#motionstudio')).toBeHidden();
  await expect.poll(() => page.evaluate(() => {
    const state = gh.manager.graphics.getState();
    const batch = state.surface && state.surface.lastPlaybookBatch;
    return Boolean(
      gh.manager.motionstudio.opened &&
      !gh.manager.motionstudio.previewingLobby &&
      state.motionStudioOpen &&
      state.motionStudio &&
      state.motionStudio.ready &&
      state.requestedMode === 'legacy' &&
      state.effectiveMode === 'legacy' &&
      batch &&
      batch.sequence === 'exit' &&
      batch.outcome !== 'running'
    );
  }), {
    timeout: 20000
  }).toBe(true);
  await expect(page.locator('#motionstudio')).toBeVisible();
  await expect(page.locator('#motionstudio-target')).toHaveValue(
    'lobby-hand-gentle-wind-exit'
  );

  const restored = await page.evaluate(({playbookKey}) => {
    const state = gh.manager.graphics.getState();
    const batch = state.surface.lastPlaybookBatch;
    const stored = JSON.parse(
      window.localStorage.getItem(playbookKey)
    );
    const legacyCards = document.querySelectorAll(
      '.legacy-menu-hand-card'
    );
    return {
      requestedMode: state.requestedMode,
      effectiveMode: state.effectiveMode,
      storedMode: window.localStorage.getItem(
        'purett.graphicsMode.v1'
      ),
      revision: state.playbookRevision,
      storedDirection:
        stored.targets['lobby-card-2-intro']
          .preset.path.directionDeg,
      preview: state.lobbyPreview,
      batch,
      cards: state.surface.cards.map(card => ({
        phase: card.phase,
        exited: card.exited,
        playbookAnimating: card.playbookAnimating,
        transform: card.transform
      })),
      status:
        document.querySelector(
          '#motionstudio .motion-studio-control-status'
        ).textContent,
      legacyCardsIntact:
        legacyCards.length === 5 &&
        window.__motionStudioLegacyCards.every((node, index) => (
          node === legacyCards[index] &&
          node.isConnected &&
          node.getAttribute('aria-hidden') === 'false'
        ))
    };
  }, {playbookKey: PLAYBOOK_STORAGE_KEY});
  expect(restored).toMatchObject({
    requestedMode: 'legacy',
    effectiveMode: 'legacy',
    storedMode: null,
    revision: 1,
    storedDirection: introDirection,
    preview: null,
    batch: {
      sequence: 'exit',
      trigger: 'motion-studio-preview'
    },
    legacyCardsIntact: true
  });
  expect([
    'completed-exit',
    'skipped-reduced-motion'
  ]).toContain(restored.batch.outcome);
  expect(restored.batch.plans).toHaveLength(5);
  expect(Array.from(new Set(
    restored.batch.plans.map(plan => plan.targetId)
  ))).toEqual(['lobby-hand-gentle-wind-exit']);
  expect(new Set(
    restored.batch.plans.map(plan => plan.seed)
  ).size).toBe(5);
  expect(new Set(
    restored.batch.plans.map(plan => (
      `${Math.round(plan.endpoint.x)}:${Math.round(plan.endpoint.y)}`
    ))
  ).size).toBe(5);
  expect(restored.batch.plans.every(plan => (
    plan.endpoint.x < 0 &&
    plan.endpoint.y > plan.anchor.y
  ))).toBe(true);
  expect(restored.cards.every(card => (
    card.phase === 'idle' &&
    card.exited === false &&
    card.playbookAnimating === false &&
    card.transform.z === 0 &&
    card.transform.scale === 1
  ))).toBe(true);
  expect(restored.status).not.toContain('ended with');
  expect(modernRequests).toHaveLength(1);

  await page.locator('#motionstudio .motion-studio-back').click();
  await expect(page.locator('#motionstudio')).toBeHidden();
  await expect(page.locator('ul.mainmenu li.play')).toBeVisible();
});
