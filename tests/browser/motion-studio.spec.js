'use strict';

const {test, expect} = require('@playwright/test');

async function loginWithLegacyGraphics(page) {
  await page.goto('/auth/login');
  await page.evaluate(() => {
    window.localStorage.removeItem('purett.graphicsMode.v1');
    window.sessionStorage.removeItem('purett.motionStudio.v1');
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

test('authors one card without changing Legacy graphics and restores the intact lobby', async ({page}) => {
  const modernRequests = [];
  page.on('request', request => {
    if (request.url().includes('/js/modern/purett-modern-graphics.min.js')) {
      modernRequests.push(request.url());
    }
  });

  await loginWithLegacyGraphics(page);

  const initial = await page.evaluate(() => {
    window.__motionStudioLegacyCards = gh.manager.menu.hand.map(
      card => card.node
    );
    let nextFrameId = 1;
    const queuedFrames = new Map();
    window.__motionStudioFrameHarness = {
      queuedFrames,
      originalRequestAnimationFrame: window.requestAnimationFrame,
      originalCancelAnimationFrame: window.cancelAnimationFrame
    };
    window.requestAnimationFrame = callback => {
      const frameId = nextFrameId;
      nextFrameId += 1;
      queuedFrames.set(frameId, callback);
      return frameId;
    };
    window.cancelAnimationFrame = frameId => {
      queuedFrames.delete(frameId);
    };
    return {
      graphics: gh.manager.graphics.getState(),
      storedMode: window.localStorage.getItem('purett.graphicsMode.v1')
    };
  });
  expect(initial.graphics).toMatchObject({
    requestedMode: 'legacy',
    effectiveMode: 'legacy',
    motionStudioOpen: false,
    motionStudio: null
  });
  expect(initial.storedMode).toBeNull();

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
      state.motionStudio.playing &&
      window.__motionStudioFrameHarness.queuedFrames.size === 1
    );
  })).toBe(true);

  const opened = await page.evaluate(() => ({
    graphics: gh.manager.graphics.getState(),
    storedMode: window.localStorage.getItem('purett.graphicsMode.v1'),
    controllerOpen: gh.manager.motionstudio.opened,
    canvasCount: document.querySelectorAll(
      '#motionstudio-canvas-host canvas.motion-studio-canvas'
    ).length,
    queuedFrames: window.__motionStudioFrameHarness.queuedFrames.size
  }));
  expect(opened.graphics).toMatchObject({
    requestedMode: 'legacy',
    effectiveMode: 'legacy',
    surfaceKind: null,
    motionStudioOpen: true,
    motionStudio: {
      surface: 'motion-studio',
      ready: true,
      disposed: false,
      playing: true,
      rafActive: true,
      canvasCount: 1
    }
  });
  expect(opened.storedMode).toBeNull();
  expect(opened.controllerOpen).toBe(true);
  expect(opened.canvasCount).toBe(1);
  expect(opened.queuedFrames).toBe(1);
  expect(modernRequests).toHaveLength(1);
  expect(await page.locator('#title-icon').evaluate(element => (
    getComputedStyle(element).pointerEvents
  ))).toBe('none');
  await expect(page.locator('#contextmenu')).toBeHidden();

  await page.locator('#motionstudio-auto-replay').uncheck();
  const scrubValue = await page.evaluate(() => {
    const state = gh.manager.graphics.getState().motionStudio;
    const flightElapsed =
      state.plan.timing.delayMs + (state.plan.timing.flightMs * 0.42);
    return Math.max(
      1,
      Math.min(
        999,
        Math.round((flightElapsed / state.durationMs) * 1000)
      )
    );
  });
  await page.locator('#motionstudio-timeline').evaluate(
    (element, value) => {
      element.value = String(value);
      element.dispatchEvent(new Event('input', {bubbles: true}));
    },
    scrubValue
  );

  const scrubbed = await page.evaluate(() => ({
    state: gh.manager.graphics.getState().motionStudio,
    queuedFrames: window.__motionStudioFrameHarness.queuedFrames.size
  }));
  expect(scrubbed.state).toMatchObject({
    ready: true,
    playing: false,
    rafActive: false
  });
  expect(scrubbed.state.elapsedMs).toBeGreaterThan(0);
  expect(scrubbed.state.elapsedMs).toBeLessThan(
    scrubbed.state.durationMs
  );
  expect(scrubbed.queuedFrames).toBe(0);

  const beforeEdit = await page.evaluate(() => {
    const controller = gh.manager.motionstudio;
    const state = gh.manager.graphics.getState().motionStudio;
    window.__motionStudioRecipeBefore = controller.preset;
    return {
      recipe: JSON.stringify(controller.preset),
      plan: JSON.stringify(state.plan),
      pose: JSON.stringify(state.pose),
      direction: controller.preset.path.directionDeg,
      frozen:
        Object.isFrozen(controller.preset) &&
        Object.isFrozen(controller.preset.path)
    };
  });
  expect(beforeEdit.frozen).toBe(true);

  const directionControl = page.locator(
    '#motionstudio input[type="number"]' +
      '[data-motion-field="path.directionDeg"]'
  );
  const editedDirection = beforeEdit.direction >= 135
    ? beforeEdit.direction - 35
    : beforeEdit.direction + 35;
  await directionControl.fill(String(editedDirection));
  await expect.poll(() => page.evaluate(() => (
    gh.manager.motionstudio.preset.path.directionDeg
  ))).toBe(editedDirection);

  const afterEdit = await page.evaluate(() => {
    const controller = gh.manager.motionstudio;
    const state = gh.manager.graphics.getState().motionStudio;
    return {
      activePresetName: controller.activePresetName,
      direction: controller.preset.path.directionDeg,
      newRecipe: controller.preset !== window.__motionStudioRecipeBefore,
      newRecipeFrozen:
        Object.isFrozen(controller.preset) &&
        Object.isFrozen(controller.preset.path),
      priorRecipe: JSON.stringify(window.__motionStudioRecipeBefore),
      plan: JSON.stringify(state.plan),
      pose: JSON.stringify(state.pose),
      playing: state.playing,
      rafActive: state.rafActive
    };
  });
  expect(afterEdit).toMatchObject({
    activePresetName: 'custom',
    direction: editedDirection,
    newRecipe: true,
    newRecipeFrozen: true,
    priorRecipe: beforeEdit.recipe,
    playing: false,
    rafActive: false
  });
  expect(afterEdit.plan).not.toBe(beforeEdit.plan);
  expect(afterEdit.pose).not.toBe(beforeEdit.pose);

  await page.locator('#motionstudio-preset').selectOption('casual-toss');
  const startHandle = page.locator(
    '#motionstudio .motion-studio-marker-start circle'
  );
  const startHandleBox = await startHandle.boundingBox();
  expect(startHandleBox).not.toBeNull();
  const beforeStartDrag = await page.evaluate(() => ({
    direction: gh.manager.motionstudio.preset.path.directionDeg,
    distance: gh.manager.motionstudio.preset.path.distancePx,
    landingX: gh.manager.motionstudio.preset.path.landingXPx,
    landingY: gh.manager.motionstudio.preset.path.landingYPx
  }));
  await page.mouse.move(
    startHandleBox.x + (startHandleBox.width / 2),
    startHandleBox.y + (startHandleBox.height / 2)
  );
  await page.mouse.down();
  await page.mouse.move(
    startHandleBox.x + (startHandleBox.width / 2) + 42,
    startHandleBox.y + (startHandleBox.height / 2) - 28,
    {steps: 5}
  );
  await page.mouse.up();
  const afterStartDrag = await page.evaluate(() => ({
    activePresetName: gh.manager.motionstudio.activePresetName,
    direction: gh.manager.motionstudio.preset.path.directionDeg,
    distance: gh.manager.motionstudio.preset.path.distancePx,
    landingX: gh.manager.motionstudio.preset.path.landingXPx,
    landingY: gh.manager.motionstudio.preset.path.landingYPx
  }));
  expect(afterStartDrag.activePresetName).toBe('custom');
  expect(afterStartDrag.direction).not.toBe(beforeStartDrag.direction);
  expect(afterStartDrag.distance).not.toBe(beforeStartDrag.distance);
  expect(afterStartDrag.landingX).toBe(beforeStartDrag.landingX);
  expect(afterStartDrag.landingY).toBe(beforeStartDrag.landingY);
  expect(Number.isInteger(afterStartDrag.direction)).toBe(true);
  expect(Number.isInteger(afterStartDrag.distance)).toBe(true);

  await page.locator(
    '#motionstudio input[type="number"]' +
      '[data-motion-field="scale.cardScale"]'
  ).fill('2');
  const apexBeforeUnsafeEdit = await page.evaluate(() => (
    gh.manager.motionstudio.preset.path.apexHeight
  ));
  await page.locator(
    '#motionstudio input[type="number"]' +
      '[data-motion-field="path.apexHeight"]'
  ).fill('400');
  await expect(page.locator(
    '#motionstudio .motion-studio-control-status'
  )).toContainText('too close to the camera');
  expect(await page.evaluate(() => (
    gh.manager.motionstudio.preset.path.apexHeight
  ))).toBe(apexBeforeUnsafeEdit);
  await expect(page.locator(
    '#motionstudio input[type="number"]' +
      '[data-motion-field="path.apexHeight"]'
  )).toHaveValue(String(apexBeforeUnsafeEdit));

  await page.locator('#motionstudio-actual-size').check();
  const actualSizePreview = await page.evaluate(() => {
    const preview = document.querySelector('#motionstudio-preview');
    const host = document.querySelector('#motionstudio-canvas-host');
    const hostRect = host.getBoundingClientRect();
    return {
      enabled: preview.classList.contains('actual-size'),
      width: hostRect.width,
      height: hostRect.height
    };
  });
  expect(actualSizePreview).toEqual({
    enabled: true,
    width: 755,
    height: 562
  });
  await page.locator('#motionstudio-actual-size').uncheck();

  await page.locator('#motionstudio-preset').selectOption('gentle-drop');
  await expect.poll(() => page.evaluate(() => (
    gh.manager.graphics.getState().motionStudio.preset.id
  ))).toBe('gentle-drop');
  const selectedPreset = await page.evaluate(() => ({
    activePresetName: gh.manager.motionstudio.activePresetName,
    presetId: gh.manager.motionstudio.preset.id,
    frozen:
      Object.isFrozen(gh.manager.motionstudio.preset) &&
      Object.isFrozen(gh.manager.motionstudio.preset.path),
    plan: JSON.stringify(
      gh.manager.graphics.getState().motionStudio.plan
    ),
    queuedFrames: window.__motionStudioFrameHarness.queuedFrames.size
  }));
  expect(selectedPreset).toMatchObject({
    activePresetName: 'gentle-drop',
    presetId: 'gentle-drop',
    frozen: true,
    queuedFrames: 1
  });
  expect(selectedPreset.plan).not.toBe(afterEdit.plan);

  await page.locator('#motionstudio-timeline').evaluate(element => {
    element.value = '500';
    element.dispatchEvent(new Event('input', {bubbles: true}));
  });
  await page.locator('details.motion-studio-json summary').click();
  const recipeBeforeInvalidImport = await page.evaluate(() => (
    JSON.stringify(gh.manager.motionstudio.preset)
  ));
  await page.locator('#motionstudio-json').fill('{"schemaVersion":1');
  await page.locator('#motionstudio .motion-studio-apply-json').click();
  await expect(
    page.locator('#motionstudio .motion-studio-json-status')
  ).toHaveClass(/error/);
  await expect(
    page.locator('#motionstudio .motion-studio-json-status')
  ).not.toHaveText('');
  expect(await page.evaluate(() => (
    JSON.stringify(gh.manager.motionstudio.preset)
  ))).toBe(recipeBeforeInvalidImport);

  const outsideAuthoringEnvelope = await page.evaluate(() => {
    const recipe = JSON.parse(
      gh.manager.motionstudio.api.serializePreset(
        gh.manager.motionstudio.preset
      )
    );
    recipe.path.distancePx = 1001;
    return JSON.stringify(recipe);
  });
  await page.locator('#motionstudio-json').fill(
    outsideAuthoringEnvelope
  );
  await page.locator('#motionstudio .motion-studio-apply-json').click();
  await expect(
    page.locator('#motionstudio .motion-studio-json-status')
  ).toContainText(
    'Motion Studio path.distancePx must be between 0 and 1000'
  );
  expect(await page.evaluate(() => (
    JSON.stringify(gh.manager.motionstudio.preset)
  ))).toBe(recipeBeforeInvalidImport);

  await page.evaluate(() => {
    window.__disposedMotionStudioSurface = gh.manager.motionstudio.surface;
  });
  await page.locator('#motionstudio-json').click();
  await page.locator('#motionstudio-json').press('Escape');
  await expect(page.locator('#motionstudio')).toBeHidden();
  await expect(page.locator('#motionstudio')).toHaveAttribute(
    'aria-hidden',
    'true'
  );
  await expect(
    page.locator('#motionstudio-canvas-host canvas')
  ).toHaveCount(0);

  const closed = await page.evaluate(() => {
    const legacyCards = document.querySelectorAll(
      '.legacy-menu-hand-card'
    );
    const result = {
      graphics: gh.manager.graphics.getState(),
      storedMode: window.localStorage.getItem('purett.graphicsMode.v1'),
      controllerOpen: gh.manager.motionstudio.opened,
      controllerSurface: gh.manager.motionstudio.surface,
      disposed: window.__disposedMotionStudioSurface.disposed,
      canvasConnected:
        window.__disposedMotionStudioSurface.canvas.isConnected,
      queuedFrames: window.__motionStudioFrameHarness.queuedFrames.size,
      activeElementId: document.activeElement.id,
      legacyCardsIntact:
        legacyCards.length === 5 &&
        window.__motionStudioLegacyCards.every((node, index) => (
          node === legacyCards[index] &&
          node.isConnected &&
          node.getAttribute('aria-hidden') === 'false' &&
          getComputedStyle(node).opacity !== '0'
        ))
    };
    window.requestAnimationFrame =
      window.__motionStudioFrameHarness.originalRequestAnimationFrame;
    window.cancelAnimationFrame =
      window.__motionStudioFrameHarness.originalCancelAnimationFrame;
    return result;
  });
  expect(closed.graphics).toMatchObject({
    requestedMode: 'legacy',
    effectiveMode: 'legacy',
    surfaceKind: null,
    motionStudioOpen: false,
    motionStudio: null
  });
  expect(closed).toMatchObject({
    storedMode: null,
    controllerOpen: false,
    controllerSurface: null,
    disposed: true,
    canvasConnected: false,
    queuedFrames: 0,
    activeElementId: 'title-icon',
    legacyCardsIntact: true
  });

  await page.locator('#title-icon').click();
  await page.locator('#contextmenu li.motion-studio > button').click();
  await expect(page.locator('#motionstudio')).toBeVisible();
  await expect.poll(() => page.evaluate(() => (
    gh.manager.graphics.getState().motionStudio.ready
  ))).toBe(true);
  await expect(page.locator('#motionstudio-preset')).toHaveValue(
    'gentle-drop'
  );
  await expect(page.locator('#motionstudio-auto-replay')).not.toBeChecked();
  await expect(
    page.locator('#motionstudio details.motion-studio-json')
  ).toHaveAttribute('open', '');
  expect(modernRequests).toHaveLength(1);
  await page.locator('#motionstudio .motion-studio-back').click();
  await expect(page.locator('#motionstudio')).toBeHidden();
  await expect(page.locator('#motionstudio-canvas-host canvas')).toHaveCount(
    0
  );

  await page.locator('#title-icon').click();
  await page.locator(
    '#contextmenu .graphics-mode-options ' +
      'button[data-graphics-mode="modern"]'
  ).click();
  await expect.poll(() => page.evaluate(() => {
    const state = gh.manager.graphics.getState();
    return Boolean(
      state.effectiveMode === 'modern' &&
      state.surfaceKind === 'lobby-hand' &&
      state.surface &&
      state.surface.ready
    );
  })).toBe(true);
  await page.evaluate(() => {
    window.__motionStudioModernLobbySurface =
      gh.manager.graphics.surface;
  });

  await page.locator('#title-icon').click();
  await page.locator('#contextmenu li.motion-studio > button').click();
  await expect.poll(() => page.evaluate(() => {
    const graphics = gh.manager.graphics;
    const state = graphics.getState();
    return Boolean(
      graphics.surface === window.__motionStudioModernLobbySurface &&
      state.motionStudio &&
      state.motionStudio.ready &&
      state.surface &&
      state.surface.suspended
    );
  })).toBe(true);
  await page.locator('#motionstudio .motion-studio-back').click();
  await expect.poll(() => page.evaluate(() => {
    const graphics = gh.manager.graphics;
    const state = graphics.getState();
    return Boolean(
      graphics.surface === window.__motionStudioModernLobbySurface &&
      state.effectiveMode === 'modern' &&
      state.surface &&
      !state.surface.suspended &&
      state.surface.interactive
    );
  })).toBe(true);
  expect(await page.evaluate(() => (
    window.localStorage.getItem('purett.graphicsMode.v1')
  ))).toBe('modern');
  expect(modernRequests).toHaveLength(1);

  await page.locator('#title-icon').click();
  await page.locator(
    '#contextmenu .graphics-mode-options ' +
      'button[data-graphics-mode="legacy"]'
  ).click();
  await expect.poll(() => page.evaluate(() => (
    gh.manager.graphics.getState().effectiveMode
  ))).toBe('legacy');
  await expect(page.locator('ul.mainmenu li.play')).toBeVisible();
});
