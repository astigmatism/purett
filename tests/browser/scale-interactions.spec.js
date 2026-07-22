'use strict';

const {test, expect} = require('@playwright/test');

test('lifted cards track the pointer at a scaled game size', async ({page}) => {
  await page.goto('/auth/login');
  await page.locator('input[name="username"]').fill('demo');
  await page.locator('input[name="password"]').fill('TripleTriad!');
  await Promise.all([
    page.waitForURL(url => url.pathname === '/'),
    page.locator('button[type="submit"]').click()
  ]);
  await expect.poll(() => page.evaluate(() => Boolean(
    window.gh && gh.manager && gh.manager.menu && gh.manager.game
  ))).toBe(true);

  await page.locator('#title-icon').click();
  await page.locator('#contextmenu button[data-scale="2"]').click();

  await page.evaluate(() => {
    const game = gh.manager.game;
    const gameWrapper = document.querySelector('#game-wrapper');
    gameWrapper.classList.remove('hide');
    gameWrapper.style.display = 'block';
    gameWrapper.style.zIndex = '50';

    game.buildCanvas();
    game.buildPositions();
    game.p1h = [];
    game.dragging = null;
    game.isDroppable = false;
    game.isreplay = false;
    const origin = game.p1p[1];
    const card = game.canvas.rect(origin.x, origin.y, 117, 146).attr({
      fill: '#fff',
      stroke: '#000'
    });
    const item = {card, x: origin.x, y: origin.y};
    card.node.id = 'scale-drag-probe';
    game.p1h.push(item);
    game.playerOneCardClick(item);
  });

  const card = page.locator('#scale-drag-probe');
  const board = page.locator('#svgBoard');
  await expect(card).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const matrix = document.querySelector('#svgBoard svg').getScreenCTM();
    return matrix && matrix.a;
  })).toBeCloseTo(2, 5);

  const initialBox = await card.boundingBox();
  await card.click({position: {x: initialBox.width / 2, y: initialBox.height / 2}});
  await expect.poll(() => page.evaluate(() => gh.manager.game.isDroppable)).toBe(true);

  const liftedBox = await card.boundingBox();
  const liftedCenter = {
    x: liftedBox.x + liftedBox.width / 2,
    y: liftedBox.y + liftedBox.height / 2
  };
  const target = {
    x: liftedCenter.x + 160,
    y: liftedCenter.y + 90
  };
  await page.mouse.move(target.x, target.y);

  const movedBox = await card.boundingBox();
  const movedCenter = {
    x: movedBox.x + movedBox.width / 2,
    y: movedBox.y + movedBox.height / 2
  };
  expect(Math.abs(movedCenter.x - target.x)).toBeLessThan(2);
  expect(Math.abs(movedCenter.y - target.y)).toBeLessThan(2);

  const boardBox = await board.boundingBox();
  await board.click({position: {
    x: target.x - boardBox.x,
    y: target.y - boardBox.y
  }});
  await expect.poll(() => page.evaluate(() => gh.manager.game.dragging)).toBe(null);
  await expect.poll(async () => {
    const returnedBox = await card.boundingBox();
    const returnedCenter = {
      x: returnedBox.x + returnedBox.width / 2,
      y: returnedBox.y + returnedBox.height / 2
    };
    return Math.hypot(
      returnedCenter.x - liftedCenter.x,
      returnedCenter.y - liftedCenter.y
    );
  }).toBeLessThan(2);
});
