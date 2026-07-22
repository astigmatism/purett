'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
let assertions = 0;

function assert(condition, message) {
  assertions += 1;
  if (!condition) throw new Error(message);
}

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function walk(relative, extensions, output = []) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) return output;
  for (const entry of fs.readdirSync(absolute, {withFileTypes: true})) {
    if (entry.name === 'wordpress' || entry.name === 'node_modules' || entry.name === '.DS_Store') continue;
    const childRelative = path.join(relative, entry.name);
    if (entry.isDirectory()) walk(childRelative, extensions, output);
    else if (extensions.includes(path.extname(entry.name))) output.push(childRelative);
  }
  return output;
}

function assertNoPattern(files, pattern, description) {
  const matches = [];
  for (const file of files) {
    const text = read(file);
    if (pattern.test(text)) matches.push(file);
    pattern.lastIndex = 0;
  }
  assert(matches.length === 0, `${description}: ${matches.join(', ')}`);
}

try {
  const required = [
    'Vagrantfile', 'docker-compose.yml', 'run-local.sh',
    'database/schema.sql', 'database/seed-cards.sql', 'database/seed-reference.sql', 'database/seed.sql',
    'application/controllers/AuthController.php', 'application/controllers/AccountController.php',
    'application/controllers/IndexController.php', 'application/controllers/PurchaseController.php',
    'library/Standalone/Controller/Action.php', 'public/js/gh.platform.js',
    'public/css/fonts.css', 'public/fonts/spinnaker/Spinnaker-Regular.ttf',
    'public/fonts/spinnaker/OFL.txt'
  ];
  for (const file of required) assert(fs.existsSync(path.join(root, file)), `required standalone file is missing: ${file}`);

  const fontCss = read('public/css/fonts.css');
  const standaloneLayout = read('application/views/layouts/standalone.phtml');
  const spinnakerFont = fs.readFileSync(path.join(root, 'public/fonts/spinnaker/Spinnaker-Regular.ttf'));
  assert(/@font-face/.test(fontCss), 'local font stylesheet has no font-face definition');
  assert(/font-family:\s*['"]Spinnaker['"]/.test(fontCss), 'local font stylesheet does not define Spinnaker');
  assert(/url\(['"]?\/fonts\/spinnaker\/Spinnaker-Regular\.ttf['"]?\)/.test(fontCss), 'Spinnaker does not use the bundled font file');
  assert(spinnakerFont.length > 10000 && spinnakerFont.subarray(0, 4).toString('hex') === '00010000', 'bundled Spinnaker file is not a valid TrueType font');
  assert(standaloneLayout.includes('/css/fonts.css'), 'standalone layout does not load the local font stylesheet');

  const activeCode = [
    ...walk('application', ['.php', '.phtml', '.ini']),
    ...walk('library/PureTripleTriad', ['.php']),
    ...walk('library/Gamehouse', ['.php']),
    ...walk('library/Standalone', ['.php']),
    ...walk('public/js/default', ['.js']),
    ...walk('public/js/plugins', ['.js']),
    'public/js/gh.js', 'public/js/gh.platform.js',
    ...walk('public/css', ['.css'])
  ].filter((value, index, list) => list.indexOf(value) === index);

  assert(!fs.existsSync(path.join(root, 'library/Facebook')), 'active Facebook PHP SDK directory still exists');
  assertNoPattern(
    activeCode,
    /facebook|fbcdn|graph\.facebook|\bFB\s*\.|gh\.facebook|signed_request|credits_purchase|google-analytics|fonts\.googleapis/i,
    'prohibited identity/analytics runtime symbol remains active'
  );

  const loadedViews = [
    ...walk('application/views/layouts', ['.phtml']),
    ...walk('application/views/scripts/auth', ['.phtml']),
    ...walk('application/views/scripts/index', ['.phtml']),
    ...walk('application/views/scripts/account', ['.phtml'])
  ];
  assertNoPattern(loadedViews, /(?:src|href)\s*=\s*["']https?:\/\//i, 'view loads a third-party URL');

  for (const controller of ['IndexController.php', 'PurchaseController.php', 'ReplayController.php', 'AccountController.php']) {
    assert(/extends\s+Standalone_Controller_Action/.test(read(`application/controllers/${controller}`)), `${controller} does not use standalone authentication`);
  }
  for (const obsolete of ['AdminController.php', 'CronController.php', 'OptimizeController.php', 'UninstallController.php']) {
    assert(!fs.existsSync(path.join(root, 'application/controllers', obsolete)), `unsafe legacy controller remains active: ${obsolete}`);
  }

  const indexController = read('application/controllers/IndexController.php');
  for (const action of ['colorAction', 'meAction', 'gameAction', 'setHandAction', 'claimAction']) {
    const start = indexController.indexOf(`function ${action}`);
    assert(start >= 0, `state-changing action is missing: ${action}`);
    const body = indexController.slice(start, start + 500);
    assert(body.includes('requireCsrf'), `${action} does not enforce POST plus CSRF`);
  }
  assert(read('application/controllers/PurchaseController.php').includes('requireCsrf'), 'purchase endpoint does not enforce POST plus CSRF');
  assert(read('application/controllers/AccountController.php').includes('requireCsrf'), 'account deletion does not enforce POST plus CSRF');
  assert(/type:\s*['"]POST['"]/.test(read('public/js/default/index.js')), 'game frontend does not POST state changes');

  const database = read('library/PureTripleTriad/Database.php');
  assert(!/SELECT\s+MAX\s*\(\s*idgames\s*\)/i.test(database), 'game creation still uses SELECT MAX race');
  assert(database.includes('lastInsertId'), 'game/account creation does not use connection insert IDs');
  assert(database.includes('FOR UPDATE'), 'economy paths do not lock rows for atomic changes');
  assert(database.includes('reference_key'), 'coin transaction idempotency is absent');
  assert(!database.includes('user_turns'), 'removed turn balances remain in the database layer');
  assert(!database.includes('decrementTurn'), 'gameplay can still consume a turn balance');
  assert(/startingCoins\s*=\s*10/.test(read('application/configs/game.ini')), 'new accounts do not start with ten coins');
  assert(/gameConfig->startingCoins/.test(read('application/controllers/AuthController.php')), 'registration bypasses the configured starting balance');
  assert(/transaction_type'\s*=>\s*'match_reward'/.test(database), 'completed-match coin rewards are not recorded in the ledger');

  const game = read('library/PureTripleTriad/Game.php');
  assert(game.includes('GAMEHISTORY_PATH'), 'replays are not stored under the dedicated runtime path');
  assert(!game.includes('data/logs/gamehistory'), 'new replays still target historical logs');
  assert(/getAuthorizedGameHistory/.test(game), 'replay ownership authorization is absent');
  assert(/tutorials\/\[1245\]/.test(game), 'replay path allowlist does not constrain tutorial files');
  assert(/elementbonus\s*\*\s*-1/.test(game), 'negative Elemental mismatch modifier is absent');
  assert(/p1score\s*-\s*\$p2score/.test(game), 'victory coin rewards do not match the winning score difference');
  assert(!game.includes('ppqowifoqneocmoqiiowuoieiw'), 'game payload still exposes a turn balance');

  const shop = read('public/js/plugins/gh.shop.js');
  assert(shop.includes('DECK COLORS'), 'store does not label deck-wide colors clearly');
  assert(!shop.includes('class="turns"'), 'turns remain visible in the store menu');
  assert(!shop.includes("purchase('turn'"), 'store can still submit turn purchases');

  const schema = read('database/schema.sql');
  for (const table of ['users', 'local_accounts', 'wallets', 'coin_transactions', 'cards', 'usercards', 'games', 'gamerules', 'rules', 'gamecards', 'gamehistory', 'purchases', 'options', 'useroptions', 'shopitems']) {
    assert(new RegExp(`CREATE TABLE ${table}\\b`, 'i').test(schema), `schema table is missing: ${table}`);
  }
  assert(!/CREATE TABLE user_turns\b/i.test(schema), 'fresh schema still creates turn balances');
  assert(!/\bgrant_amount\b/i.test(schema), 'turn-bundle grant storage remains in the fresh schema');
  assert(!/['"]turn['"]/.test(read('database/seed-reference.sql')), 'reference seed still includes turn bundles');
  assert(/AUTO_INCREMENT=2/.test(schema), 'human user allocation is not reserved above computer ID 1');
  assert(/UNIQUE KEY uq_coin_transactions_reference/.test(schema), 'coin ledger reference is not unique');

  const cardsSeed = read('database/seed-cards.sql');
  const cardRows = [...cardsSeed.matchAll(/^\s*\((\d+),\s*\d+,\s*\d+,\s*\d+,\s*\d+,\s*\d+,\s*(?:NULL|\d+),\s*'([^']+)'/gm)];
  assert(cardRows.length === 110, `seed contains ${cardRows.length} cards instead of 110`);
  assert(new Set(cardRows.map(row => Number(row[1]))).size === 110, 'seed card IDs are not unique');
  const colorDirectories = fs.readdirSync(path.join(root, 'public/images/cards'), {withFileTypes: true})
    .filter(entry => entry.isDirectory()).map(entry => entry.name);
  assert(colorDirectories.length === 14, `expected 14 card image variants, found ${colorDirectories.length}`);
  for (const row of cardRows) {
    for (const directory of colorDirectories) {
      const image = path.join(root, 'public/images/cards', directory, `${row[2]}.png`);
      assert(fs.existsSync(image), `seeded card ${row[1]} is missing image variant ${directory}`);
    }
  }

  const dockerfile = read('docker/php56-apache.Dockerfile');
  for (const forbidden of ['purettv2', 'public/wordpress', 'data/logs', 'docs', 'database', '.git']) {
    assert(!new RegExp(`^COPY\\s+${forbidden.replace('/', '\\/')}`, 'm').test(dockerfile), `Docker image copies excluded material: ${forbidden}`);
  }
  const compose = read('docker-compose.yml');
  assert(!/^\s*ports:\s*$[\s\S]*?3306:/m.test(compose), 'database is published on a host port');
  assert(!/^\s*ports:\s*$[\s\S]*?6379:/m.test(compose), 'Redis is published on a host port');
  assert(compose.includes('127.0.0.1'), 'web service is not loopback-bound by default');
  assert(read('docker/apache/purett.conf').includes('/var/www/app/public'), 'Apache document root is not public/ only');

  console.log(`ok - repository security/deployment/catalog contract (${assertions} assertions)`);
} catch (error) {
  console.error(`not ok - repository contract: ${error.message}`);
  process.exitCode = 1;
}
