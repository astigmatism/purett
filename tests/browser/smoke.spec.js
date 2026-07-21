'use strict';

const {test, expect} = require('@playwright/test');

const fields = {
  gameId: 'oiuwqnlaskjodwksjdlappw',
  userId: 'bdjiauhjhduqijshckjhaii',
  turns: 'ppqowifoqneocmoqiiowuoieiw',
  playerHand: 'mnzbxcnbmncbzmxnbcmnbzxmnb',
  computerHand: 'kjhsadjhkaskjhdkjhasjhdasd',
  board: 'uyeiqowiutoiqyweiuyqwoiyro',
  token: 'iiiooioooiooioioiiiiioioioooi',
  openingAi: 'ppqoowoieoiqpoipieoicojqpojow',
  cardId: 'jjkaooijslakjdiwjkalsjkkk',
  owner: 'ffjklaksjidlkmjaiwnnmnalk',
  claim: 'ewoicujonadsincoqinokcnvbzkak',
  humanMove: 'ppqoowoieoiqpoipieoicojqpojuu',
  aiMove: 'ppqoowoieoiqpoipieoicojqpojow'
};

async function api(page, path, data) {
  return page.evaluate(async ({path, data}) => {
    const body = new URLSearchParams();
    Object.keys(data || {}).forEach(key => body.append(key, String(data[key])));
    const response = await fetch(path, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'X-CSRF-Token': window.gh.data.csrf,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: body.toString()
    });
    const text = await response.text();
    let payload;
    try { payload = JSON.parse(text); } catch (error) { payload = {raw: text}; }
    if (!response.ok) throw new Error(`${path} returned ${response.status}: ${text.slice(0, 300)}`);
    return payload;
  }, {path, data: data || {}});
}

function hasCompletion(details) {
  if (!details) return false;
  if (Array.isArray(details)) return details.length > 0;
  return Object.keys(details).length > 0;
}

function computerCardIds(state) {
  const cards = [];
  for (const card of state[fields.computerHand] || []) {
    if (Number(card[fields.owner]) === 1) cards.push(Number(card[fields.cardId]));
  }
  for (const card of state[fields.board] || []) {
    if (Number(card[fields.owner]) === 1 && card[fields.cardId]) cards.push(Number(card[fields.cardId]));
  }
  return [...new Set(cards)];
}

async function finishClaim(page, state, fallbackIds) {
  let remaining = Number(state[fields.claim] || 0);
  const candidates = [...new Set([...computerCardIds(state), ...(fallbackIds || [])])];
  while (remaining > 0) {
    const cardId = candidates.shift();
    if (!cardId) throw new Error('claim phase exposed fewer opponent cards than required');
    const result = await api(page, '/index/claim', {
      kkjdoqijwoijofijoqiwoiueioqiw: state[fields.gameId],
      iqowijdoicqkwjklcnmknbfguttgo: cardId
    });
    remaining = Number(result.remaining);
  }
}

async function completeStaleGame(page, state) {
  const knownComputerCards = computerCardIds(state);
  let completion = null;

  for (let iteration = 0; iteration < 30 && !completion; iteration += 1) {
    const hand = state[fields.playerHand] || [];
    const card = hand[0];
    const position = (state[fields.board] || []).findIndex(slot => !slot[fields.cardId]);
    if (!card || position < 0) break;
    const result = await api(page, '/index/me', {
      yasidhnqwkjnsljdansflcknaslksjdlan: card[fields.cardId],
      woaijsdlkjqwpoijdlksjalwjdjkaclskd: position,
      toiueniowineoimowekorurioieqppwodo: state[fields.token]
    });
    completion = hasCompletion(result[fields.humanMove].gameover)
      ? result[fields.humanMove].gameover
      : (result[fields.aiMove] && hasCompletion(result[fields.aiMove].gameover)
        ? result[fields.aiMove].gameover : null);
    if (!completion) {
      state = await api(page, '/index/game', {});
      for (const id of computerCardIds(state)) knownComputerCards.push(id);
    }
  }

  if (!completion) throw new Error('could not clean up the previously interrupted game');
  if (Number(completion.claim || 0) > 0) {
    state[fields.claim] = Number(completion.claim);
    await finishClaim(page, state, knownComputerCards);
  }
}

async function dismissGameDialogs(page) {
  for (let count = 0; count < 12; count += 1) {
    const button = page.locator('.ui-dialog:visible .ui-dialog-buttonpane button:visible').first();
    if (await button.count() === 0) return;
    // jQuery UI replaces some dialog nodes as chained rule messages advance.
    // Bound a detached-node retry so Playwright cannot spend the entire test
    // timeout waiting on a button that no longer belongs to the document.
    try {
      await button.click({timeout: 1500});
    } catch (error) {
      // Re-resolve the current dialog button on the next bounded iteration.
    }
    await page.waitForTimeout(150);
  }
  throw new Error('game dialog sequence did not terminate');
}

async function ensurePlayableHand(page) {
  const size = await page.evaluate(() => gh.data.hand.length);
  if (size === 5) return;

  await page.locator('ul.mainmenu li.deck').click();
  await expect(page.locator('ul.deckmenu')).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(
    gh.manager.deck && gh.manager.deck.deck && gh.manager.deck.deck.length
  ))).toBe(true);

  const target = await page.evaluate(() => {
    const cards = gh.manager.deck.deck;
    const ordinary = cards.find(card => Number(card.purchased) === 0);
    const card = ordinary || cards[0];
    return {level: Number(card.level), purchased: Number(card.purchased)};
  });
  if (target.purchased === 1) {
    await page.locator('ul.deckmenu li.own').click();
    await expect.poll(() => page.evaluate(() => gh.manager.deck.menu)).toBe('own');
  } else {
    await page.locator('ul.deckmenu li.lvl').filter({hasText: String(target.level)}).click();
  }
  await expect.poll(() => page.evaluate(() => Boolean(
    gh.manager.deck.deckobjs && gh.manager.deck.deckobjs.some(item =>
      item.card && item.card.node && item.card.node.isConnected
    )
  ))).toBe(true);

  while (await page.evaluate(() => gh.manager.deck.sortedHand.filter(card => card.cardid).length) < 5) {
    const before = await page.evaluate(() => gh.manager.deck.sortedHand.filter(card => card.cardid).length);
    const cardHandle = await page.evaluateHandle(() => {
      const card = gh.manager.deck.deckobjs.find(item =>
        item.card && item.card.node && item.card.node.isConnected
      );
      return card && card.card.node;
    });
    const cardElement = cardHandle.asElement();
    if (!cardElement) throw new Error('deck did not expose a card to complete the active hand');
    await cardElement.click({force: true});
    await expect.poll(() => page.evaluate(() => (
      gh.manager.deck.sortedHand.filter(card => card.cardid).length
    ))).toBe(before + 1);
  }

  if (await page.evaluate(() => gh.manager.deck.menu === 'own')) {
    await page.locator('ul.deckmenu li.back').click();
    await expect.poll(() => page.evaluate(() => gh.manager.deck.menu)).toBe('main');
  }

  const saveResponse = page.waitForResponse(response =>
    response.url().includes('/index/set-hand') && response.request().method() === 'POST'
  );
  await page.locator('ul.deckmenu li.back').click();
  expect((await saveResponse).ok(), 'deck hand save failed').toBeTruthy();
  await expect(page.locator('ul.mainmenu li.play')).toBeVisible();
  await expect.poll(() => page.evaluate(() => gh.data.hand.length)).toBe(5);
}

async function ensureSmokeTurns(page) {
  if (await page.evaluate(() => Number(gh.data.turns)) >= 40) return;

  const key = `smoke:turns:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 12)}`;
  const purchase = await api(page, '/purchase', {
    type: 'turn',
    id: 10,
    idempotency_key: key
  });
  expect(purchase.result.status).toBe('settled');
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(
    window.gh && gh.manager && document.querySelector('ul.mainmenu li.play')
  ))).toBe(true);
  await expect.poll(() => page.evaluate(() => Number(gh.data.turns))).toBeGreaterThanOrEqual(100);
}

async function waitForHumanTurnOrGameOver(page, pageErrors) {
  for (let count = 0; count < 300; count += 1) {
    if (pageErrors.length > 0) {
      throw new Error(`browser page error: ${pageErrors[0]}`);
    }
    await dismissGameDialogs(page);
    const state = await page.evaluate(() => {
      const game = window.gh && gh.manager && gh.manager.game;
      if (!game) return {ready: false, over: false};
      // The first hand card always has an exposed strip at its top edge.
      const card = game.p1h && game.p1h.length ? game.p1h[0] : null;
      const open = game.pb && game.pb.find(item => item.rect && item.rect.node);
      const enabled = card && card.card && card.card.node &&
        card.card.node.getAttribute('pointer-events') !== 'none';
      const boardEnabled = open && open.rect.node.getAttribute('pointer-events') !== 'none';
      return {
        ready: Boolean(game.isMyTurn && !game.dragging && card && boardEnabled && enabled),
        over: Boolean(game.gameover || Number(gh.data.ingame) === 0)
      };
    });
    if (state.ready || state.over) return state;
    await page.waitForTimeout(250);
  }
  throw new Error('timed out waiting for the AI or the next playable turn');
}

async function placeCardThroughUi(page, pageErrors) {
  const ready = await waitForHumanTurnOrGameOver(page, pageErrors);
  if (ready.over) return null;

  const cardHandle = await page.evaluateHandle(() => {
    const hand = gh.manager.game.p1h;
    return hand[0].card.node;
  });
  const cardElement = cardHandle.asElement();
  if (!cardElement) throw new Error('rendered player card was not an element');
  const cardBox = await cardElement.boundingBox();
  if (!cardBox) throw new Error('rendered player card had no clickable bounds');
  // Dispatch on the Raphael node itself. Legacy stacked SVG hit-testing differs
  // between headed and headless Chromium, while this still exercises the real
  // jQuery click handler, grab animation, drop handler, and HTTP move request.
  await cardElement.dispatchEvent('click', {
    bubbles: true,
    cancelable: true,
    clientX: cardBox.x + (cardBox.width / 2),
    clientY: cardBox.y + Math.min(6, Math.max(1, cardBox.height / 4))
  });
  await expect.poll(() => page.evaluate(() => gh.manager.game.isDroppable === true)).toBe(true);

  const boardHandle = await page.evaluateHandle(() => {
    const slot = gh.manager.game.pb.find(item => item.rect && item.rect.node);
    return slot && slot.rect.node;
  });
  const boardElement = boardHandle.asElement();
  if (!boardElement) throw new Error('rendered open board cell was not an element');
  const boardBox = await boardElement.boundingBox();
  if (!boardBox) throw new Error('rendered open board cell had no clickable bounds');

  const responsePromise = page.waitForResponse(response =>
    response.url().includes('/index/me') && response.request().method() === 'POST'
  );
  await boardElement.dispatchEvent('click', {
    bubbles: true,
    cancelable: true,
    clientX: boardBox.x + (boardBox.width / 2),
    clientY: boardBox.y + (boardBox.height / 2)
  });
  const response = await responsePromise;
  expect(response.ok(), 'SVG card placement request failed').toBeTruthy();
  return response.json();
}

test('bundled Spinnaker renders without a third-party request', async ({page, baseURL}) => {
  const externalRequests = [];
  const baseOrigin = new URL(baseURL).origin;
  page.on('request', request => {
    const url = request.url();
    if (/^(data|blob|about):/.test(url)) return;
    if (new URL(url).origin !== baseOrigin) externalRequests.push(url);
  });

  await page.goto('/auth/login');
  await page.locator('input[name="username"]').fill('demo');
  await page.locator('input[name="password"]').fill('TripleTriad!');
  await Promise.all([
    page.waitForURL(url => url.pathname === '/'),
    page.locator('button[type="submit"]').click()
  ]);

  const typography = await page.evaluate(async () => {
    await document.fonts.ready;
    return {
      available: document.fonts.check('13px "Spinnaker"', 'Pure Triple Triad'),
      bodyFamily: getComputedStyle(document.body).fontFamily,
      titleFamily: getComputedStyle(document.querySelector('#title')).fontFamily,
      fetched: performance.getEntriesByType('resource').some(entry => (
        new URL(entry.name).pathname === '/fonts/spinnaker/Spinnaker-Regular.ttf'
      ))
    };
  });

  expect(typography.available, 'Spinnaker is not available to the document').toBeTruthy();
  expect(typography.bodyFamily).toContain('Spinnaker');
  expect(typography.titleFamily).toContain('Spinnaker');
  expect(typography.fetched, 'browser did not fetch the bundled Spinnaker face').toBeTruthy();
  expect(externalRequests, `unexpected third-party requests: ${externalRequests.join(', ')}`).toEqual([]);
});

test('standalone player journey works without third-party requests', async ({page, baseURL}) => {
  const externalRequests = [];
  const pageErrors = [];
  const baseOrigin = new URL(baseURL).origin;
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('request', request => {
    const url = request.url();
    if (/^(data|blob|about):/.test(url)) return;
    if (new URL(url).origin !== baseOrigin) externalRequests.push(url);
  });

  await page.goto('/auth/login');
  await expect(page.locator('h1')).toContainText('Pure Triple Triad');
  await page.locator('input[name="username"]').fill('demo');
  await page.locator('input[name="password"]').fill('TripleTriad!');
  await Promise.all([
    page.waitForURL(url => url.pathname === '/'),
    page.locator('button[type="submit"]').click()
  ]);
  await expect(page.locator('#account-strip')).toHaveCount(0);
  await expect(page.locator('#coins .coin-balance')).toHaveText(/\d+/);
  await expect.poll(() => page.evaluate(() => Boolean(
    window.gh && gh.manager && gh.manager.menu && document.querySelector('ul.mainmenu li.play')
  ))).toBe(true);
  await expect(page.locator('ul.mainmenu li.play')).toBeVisible();

  await ensureSmokeTurns(page);

  await page.locator('ul.mainmenu li.tutorials').click();
  await expect(page.locator('ul.mainmenu li.basics')).toBeVisible();
  await expect(page.locator('ul.mainmenu li.same')).toBeVisible();
  await expect(page.locator('ul.mainmenu li.plus')).toBeVisible();
  await expect(page.locator('ul.mainmenu li.elemental')).toBeVisible();
  await page.locator('ul.mainmenu li.back').click();
  await expect(page.locator('ul.mainmenu li.play')).toBeVisible();

  if (await page.evaluate(() => Number(gh.data.ingame) > 0)) {
    const existing = await api(page, '/index/game', {});
    if (existing[fields.claim]) await finishClaim(page, existing, computerCardIds(existing));
    else await completeStaleGame(page, existing);
    await page.reload();
    await expect.poll(() => page.evaluate(() => Boolean(
      window.gh && gh.manager && document.querySelector('ul.mainmenu li.play')
    ))).toBe(true);
  }

  // A prior Take-rule loss can legitimately move an active card out of the
  // hand while leaving replacements in the collection. Rebuild the required
  // five-card hand through the real deck UI before starting the next game.
  await ensurePlayableHand(page);

  const gameRequest = page.waitForResponse(response =>
    response.url().includes('/index/game') && response.request().method() === 'POST'
  );
  await page.locator('ul.mainmenu li.play').click();
  const uiStartResponse = await gameRequest;
  expect(uiStartResponse.ok()).toBeTruthy();
  await expect(page.locator('#game-wrapper')).toBeVisible();

  await dismissGameDialogs(page);
  let state = await api(page, '/index/game', {});
  const gameId = Number(state[fields.gameId]);
  const initialTurns = Number(state[fields.turns]);
  let humanMoves = 0;
  let aiMoves = state[fields.openingAi] && state[fields.openingAi].u === 1 ? 1 : 0;
  let finished = false;
  let completion = null;
  const knownComputerCards = computerCardIds(state);

  for (let iteration = 0; iteration < 6 && !finished; iteration += 1) {
    const result = await placeCardThroughUi(page, pageErrors);
    if (!result) break;
    humanMoves += 1;
    expect(Number(result[fields.humanMove].u)).toBe(Number(state[fields.userId]));
    if (result[fields.aiMove] && Number(result[fields.aiMove].u) === 1) aiMoves += 1;
    completion = hasCompletion(result[fields.humanMove].gameover)
      ? result[fields.humanMove].gameover
      : (result[fields.aiMove] && hasCompletion(result[fields.aiMove].gameover)
        ? result[fields.aiMove].gameover : null);
    if (completion) {
      finished = true;
      break;
    }
    state = await api(page, '/index/game', {});
    for (const id of computerCardIds(state)) knownComputerCards.push(id);
  }

  expect(finished, 'game did not reach a result').toBeTruthy();
  expect(aiMoves, 'AI never responded').toBeGreaterThanOrEqual(1);
  expect(humanMoves, 'no human turns were submitted').toBeGreaterThanOrEqual(4);
  expect(initialTurns - humanMoves, 'turn counter did not decrease once per human move').toBeGreaterThanOrEqual(0);

  if (completion && Number(completion.claim || 0) > 0) {
    state[fields.claim] = Number(completion.claim);
    await finishClaim(page, state, knownComputerCards);
  }

  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(
    window.gh && gh.manager && document.querySelector('ul.mainmenu')
  ))).toBe(true);
  await expect.poll(() => page.evaluate(() => Number(gh.data.turns))).toBe(initialTurns - humanMoves);
  await expect(page.locator('ul.mainmenu li.shop')).toBeVisible();
  await page.locator('ul.mainmenu li.shop').click();
  await expect(page.locator('ul.shopmenu')).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(
    gh.manager.shop && gh.manager.shop.stock && gh.manager.shop.stock.length > 0
  ))).toBe(true);
  const coinsBefore = await page.evaluate(() => Number(gh.data.coins));
  const purchaseResponse = page.waitForResponse(response =>
    response.url().endsWith('/purchase') && response.request().method() === 'POST'
  );
  const buy = page.locator('#shop .buybar .buy:visible').first();
  await expect(buy).toBeVisible();
  await buy.click();
  const purchaseHttpResponse = await purchaseResponse;
  expect(purchaseHttpResponse.ok(), 'visible BUY control request failed').toBeTruthy();
  const purchase = await purchaseHttpResponse.json();
  expect(purchase.result.status).toBe('settled');
  expect(Number(purchase.result.balance)).toBeLessThan(coinsBefore);
  await expect(page.locator('#coins .coin-balance')).toHaveText(String(purchase.result.balance));
  const persistedBalance = Number(purchase.result.balance);

  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(
    window.gh && gh.manager && document.querySelector('ul.mainmenu li.deck')
  ))).toBe(true);
  await page.locator('ul.mainmenu li.deck').click();
  await expect(page.locator('ul.deckmenu')).toBeVisible();

  const replayResponse = page.waitForResponse(response => response.url().includes('/index/review?gameid='));
  await page.goto(`/replay?gameid=${gameId}`);
  await expect.poll(() => page.evaluate(() => Number(gh.data.requestedReplay || 0))).toBe(gameId);
  expect((await replayResponse).ok()).toBeTruthy();

  await page.locator('#title-icon').click();
  await expect(page.locator('#contextmenu')).toBeVisible();
  await page.locator('#contextmenu li.logout').click();
  await page.waitForURL(url => url.pathname === '/auth/login');
  await page.locator('input[name="username"]').fill('demo');
  await page.locator('input[name="password"]').fill('TripleTriad!');
  await Promise.all([
    page.waitForURL(url => url.pathname === '/'),
    page.locator('button[type="submit"]').click()
  ]);
  await expect(page.locator('#coins .coin-balance')).toHaveText(/\d+/);
  await expect.poll(() => page.evaluate(() => Number(gh.data.coins))).toBe(persistedBalance);
  await expect.poll(() => page.evaluate(() => Number(gh.data.latestReplay || 0))).toBe(gameId);

  expect(externalRequests, `unexpected third-party requests: ${externalRequests.join(', ')}`).toEqual([]);
  expect(pageErrors, `browser page errors: ${pageErrors.join(', ')}`).toEqual([]);
});
