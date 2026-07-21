'use strict';

const http = require('http');
const https = require('https');

const baseUrl = new URL(process.env.PURETT_BASE_URL || 'http://127.0.0.1:8080');
let assertions = 0;

function assert(condition, message) {
  assertions += 1;
  if (!condition) throw new Error(message);
}

class Session {
  constructor() {
    this.cookies = {};
  }

  cookie(name) {
    return this.cookies[name] || null;
  }

  request(path, options = {}) {
    const target = new URL(path, baseUrl);
    const body = options.body || '';
    const headers = Object.assign({}, options.headers || {});
    const cookie = Object.keys(this.cookies).map(name => `${name}=${this.cookies[name]}`).join('; ');
    if (cookie) headers.Cookie = cookie;
    if (body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }
    if (body) headers['Content-Length'] = Buffer.byteLength(body);

    const transport = target.protocol === 'https:' ? https : http;
    return new Promise((resolve, reject) => {
      const request = transport.request({
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port,
        path: target.pathname + target.search,
        method: options.method || 'GET',
        headers
      }, response => {
        const chunks = [];
        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => {
          const setCookies = response.headers['set-cookie'] || [];
          for (const item of setCookies) {
            const pair = item.split(';', 1)[0];
            const separator = pair.indexOf('=');
            const name = pair.slice(0, separator);
            const value = pair.slice(separator + 1);
            if (value && value !== 'deleted') this.cookies[name] = value;
            else delete this.cookies[name];
          }
          resolve({
            status: response.statusCode,
            headers: response.headers,
            body: Buffer.concat(chunks).toString('utf8')
          });
        });
      });
      request.on('error', reject);
      if (body) request.write(body);
      request.end();
    });
  }

  post(path, fields, headers = {}) {
    return this.request(path, {
      method: 'POST',
      headers,
      body: new URLSearchParams(fields).toString()
    });
  }
}

function csrfFromHtml(html) {
  const match = html.match(/name="csrf_token"\s+value="([^"]+)"/);
  if (!match) throw new Error('CSRF field was not found in HTML');
  return match[1].replace(/&amp;/g, '&');
}

async function run() {
  const unauthenticated = new Session();
  let response = await unauthenticated.request('/index/deck-manage', {
    headers: {Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest'}
  });
  assert(response.status === 401, `unauthenticated JSON API returned ${response.status}, expected 401`);
  assert(response.headers['content-type'].includes('application/json'), 'unauthenticated API did not return JSON');

  const sensitivePaths = [
    '/wordpress/',
    '/tools/',
    '/.git/config',
    '/application/configs/game.ini',
    '/data/logs/gamehistory/2/1.txt',
    '/purettv2/',
    '/docs/',
    '/database/schema.sql'
  ];
  for (const sensitivePath of sensitivePaths) {
    response = await unauthenticated.request(sensitivePath);
    assert(
      response.status === 403 || response.status === 404,
      `sensitive or archival path ${sensitivePath} returned ${response.status}, expected 403 or 404`
    );
  }

  const session = new Session();
  response = await session.request('/auth/register');
  assert(response.status === 200, 'registration page did not load');
  assert(!/https?:\/\//i.test(response.body), 'registration page references an external URL');
  const csrf = csrfFromHtml(response.body);
  const anonymousSessionId = session.cookie('PHPSESSID');
  assert(Boolean(anonymousSessionId), 'registration page did not establish a session');

  const username = `web_${Date.now().toString(36)}_${process.pid}`.slice(0, 31).toLowerCase();
  const password = 'WebContractPassword42!';
  const validRegistration = {
    username,
    display_name: 'HTTP Contract Player',
    password,
    email: 'http-contract@example.invalid',
    csrf_token: csrf
  };

  response = await session.post('/auth/register', Object.assign({}, validRegistration, {csrf_token: 'invalid'}));
  assert(response.status === 403, `invalid registration CSRF returned ${response.status}, expected 403`);

  response = await session.post('/auth/register', Object.assign({}, validRegistration, {
    username: "x' OR 1=1--",
    display_name: '<script>alert(1)</script>'
  }));
  assert(response.status === 200, 'SQL-shaped registration input did not fail as a validation response');
  assert(response.body.includes('Username must be'), 'SQL-shaped username did not trigger username validation');
  assert(!response.body.includes('<script>alert(1)</script>'), 'registration form reflected executable markup');

  response = await session.post('/auth/register', validRegistration);
  assert(response.status === 302, `valid registration returned ${response.status}, expected redirect`);
  assert(response.headers.location === '/', 'registration did not redirect to the game');
  const authenticatedSessionId = session.cookie('PHPSESSID');
  assert(Boolean(authenticatedSessionId) && authenticatedSessionId !== anonymousSessionId, 'registration did not regenerate the session ID');

  response = await session.request('/');
  assert(response.status === 200, 'new account could not open the game');
  assert(response.body.includes('HTTP Contract Player'), 'local display name is absent from game boot data');
  assert(!/https?:\/\//i.test(response.body), 'game document references an external runtime URL');
  assert(!/(facebook|fbcdn|google-analytics|fonts\.googleapis)/i.test(response.body), 'game document contains a prohibited platform reference');

  response = await session.request('/purchase?type=turn&id=6&idempotency_key=contract-invalid-get');
  assert(response.status === 405, `state-changing purchase GET returned ${response.status}, expected 405`);
  response = await session.post('/purchase', {
    type: 'turn', id: '6', idempotency_key: 'contract-invalid-csrf-0001'
  }, {'X-CSRF-Token': 'wrong'});
  assert(response.status === 403, `invalid purchase CSRF returned ${response.status}, expected 403`);

  response = await session.request('/index/review-data?gameid=..%2F..%2Fetc%2Fpasswd', {
    headers: {Accept: 'application/json'}
  });
  assert(response.status === 400, `traversal-shaped replay ID returned ${response.status}, expected 400`);

  response = await session.request('/account');
  assert(response.status === 200, 'account settings did not load');
  const accountCsrf = csrfFromHtml(response.body);
  const beforeLogout = session.cookie('PHPSESSID');
  response = await session.post('/auth/logout', {csrf_token: accountCsrf});
  assert(response.status === 302, 'logout did not redirect');
  response = await session.request('/');
  assert(response.status === 302 && response.headers.location === '/auth/login', 'logged-out session still opened the game');

  response = await session.request('/auth/login');
  assert(response.status === 200, 'login page did not load after logout');
  const loginCsrf = csrfFromHtml(response.body);
  const beforeLogin = session.cookie('PHPSESSID');
  response = await session.post('/auth/login', {username, password: 'not-the-password', csrf_token: loginCsrf});
  assert(response.status === 401, 'wrong password was not rejected');
  response = await session.post('/auth/login', {username, password, csrf_token: loginCsrf});
  assert(response.status === 302 && response.headers.location === '/', 'valid login did not redirect to the game');
  assert(session.cookie('PHPSESSID') !== beforeLogin && session.cookie('PHPSESSID') !== beforeLogout, 'login did not regenerate the session ID');

  response = await session.request('/');
  assert(response.status === 200 && response.body.includes('HTTP Contract Player'), 'account state did not persist across logout/login');
  response = await session.request('/account');
  const deletionCsrf = csrfFromHtml(response.body);
  response = await session.post('/account/delete', {password}, {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-Token': 'wrong'
  });
  assert(response.status === 403, 'account deletion accepted an invalid CSRF token');
  response = await session.post('/account/delete', {password}, {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-Token': deletionCsrf
  });
  assert(response.status === 200, `account deletion returned ${response.status}`);
  assert(JSON.parse(response.body).deleted === true, 'account deletion response is incomplete');

  const fresh = new Session();
  response = await fresh.request('/auth/login');
  const afterDeleteCsrf = csrfFromHtml(response.body);
  response = await fresh.post('/auth/login', {username, password, csrf_token: afterDeleteCsrf});
  assert(response.status === 401, 'deleted local account can still log in');

  console.log(`ok - HTTP auth/session/CSRF/authorization contract (${assertions} assertions)`);
}

run().catch(error => {
  console.error(`not ok - HTTP contract: ${error.message}`);
  process.exitCode = 1;
});
