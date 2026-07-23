'use strict';

const path = require('path');
const {test, expect} = require('@playwright/test');

const projectRoot = path.resolve(__dirname, '../..');

async function useWorkspaceScripts(page, scripts) {
  for (const script of scripts) {
    await page.route(`**/js/plugins/${script}*`, route => route.fulfill({
      path: path.join(projectRoot, 'public/js/plugins', script),
      contentType: 'application/javascript'
    }));
  }
}

async function login(page) {
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
}

test('title music starts once during initialization and crossfade', async ({page}) => {
  await useWorkspaceScripts(page, ['gh.audio.js']);
  await page.addInitScript(() => {
    window.__mainMenuPlayCalls = 0;
    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function(...args) {
      const isMainMenu = Array.from(this.querySelectorAll('source')).some(source => (
        /\/audio\/main\.mp3$/.test(source.getAttribute('src') || '')
      ));
      if (isMainMenu) window.__mainMenuPlayCalls += 1;
      return originalPlay.apply(this, args);
    };
  });

  await login(page);
  expect(await page.evaluate(() => window.__mainMenuPlayCalls)).toBe(1);

  const crossfadeCalls = await page.evaluate(() => {
    window.__mainMenuPlayCalls = 0;
    gh.audio.mainmenu.pause();
    gh.audio.crossfade(gh.audio.game, gh.audio.mainmenu);
    return window.__mainMenuPlayCalls;
  });
  expect(crossfadeCalls).toBe(1);
});

test('all-protected loss displays the blocked take before finishing', async ({page}) => {
  await useWorkspaceScripts(page, ['gh.game.js', 'gh.endgame.js']);
  await login(page);

  await page.evaluate(() => {
    if (!gh.manager.endgame) {
      gh.manager.endgame = new gh.endgame($('#content'));
    }
    window.__protectedTakeCompletions = 0;

    const game = gh.manager.game;
    game.enableHand = function() {};
    game.enableBoard = function() {};
    game.p1 = 42;
    game.p2 = 1;
    game.gameid = 9001;
    game.scores = [{score: 4}, {score: 6}];
    game.p1h = [];
    for (let index = 0; index < 5; index += 1) {
      game.p1h.push({
        owner: 42,
        gameCardId: index + 1,
        purchased: 1,
        image: `p${gh.data.color}/517633546449245348473e22582333307c3c252f3c6b5d3f375e27797c`
      });
    }
    game.p2h = [];
    game.pb = [];
    game.gameData = {};
    game.onFinish = function(options) {
      gh.manager.endgame.go(options, function() {
        window.__protectedTakeCompletions += 1;
      });
    };
    game.onGameover({
      claim: 0,
      taken: [],
      won: [],
      given: [],
      hand: gh.data.hand,
      deckcount: gh.data.deckcount,
      nextrules: gh.data.nextrules,
      own: [],
      takeBlockedByProtection: true,
      coinsAwarded: 0,
      coins: gh.data.coins
    });
  });

  const result = page.locator('#content div.victory');
  await expect(page.locator('#end-game')).toBeVisible();
  await expect(result).toHaveText("YOUR OPPONENT CAN'T TAKE ANY CARDS - ALL FIVE ARE PROTECTED", {timeout: 12000});
  await expect(result).toBeVisible();
  await expect(page.locator('#end-game')).toBeHidden({timeout: 10000});
  await expect.poll(() => page.evaluate(() => window.__protectedTakeCompletions)).toBe(1);
});

test('awarded-coins victory keeps the claim title inside its scaled banner', async ({page}) => {
  await useWorkspaceScripts(page, ['gh.endgame.js']);
  await login(page);

  await page.locator('#title-icon').click();
  await page.locator('#contextmenu button[data-scale="1.5"]').click();

  await page.evaluate(() => {
    gh.manager.endgame = new gh.endgame($('#content'));
    gh.manager.endgame.go({
      victory: 1,
      score: '6 - 4',
      coinsAwarded: 1,
      coins: Number(gh.data.coins) + 1,
      coinBalanceStart: Number(gh.data.coins),
      claim: 1,
      p1h: [],
      p2h: [{
        gameCardId: 9001,
        image: 'red/517633546449245348473e22582333307c3c252f3c6b5d3f375e27797c'
      }],
      own: [{gcid9001: 0}],
      won: [],
      taken: [],
      given: [],
      userid: 42,
      gameid: 9001
    }, function() {});
  });

  const title = page.locator('#content div.victory');
  await expect(title).toHaveText("CLAIM 1 OF YOUR OPPONENT'S CARDS", {timeout: 12000});
  await expect(title).toBeVisible();

  const geometry = await page.evaluate(() => {
    const endgame = gh.manager.endgame;
    const titleBox = document.querySelector('#content div.victory').getBoundingClientRect();
    const bannerBox = endgame.claimbar.node.getBoundingClientRect();
    return {
      titleClasses: document.querySelector('#content div.victory').className,
      titleCenter: titleBox.top + (titleBox.height / 2),
      bannerCenter: bannerBox.top + (bannerBox.height / 2)
    };
  });

  expect(geometry.titleClasses.split(/\s+/)).not.toContain('with-award');
  expect(Math.abs(geometry.titleCenter - geometry.bannerCenter)).toBeLessThan(1);
});
