# Standalone architecture

## Runtime topology

```text
Browser
  │ HTTP on 127.0.0.1:8080
  ▼
Vagrant port forward (VM workflow only)
  │
  ▼
Apache 2.4 + PHP 5.6 + Zend Framework 1
  ├── MariaDB 10.5  — authoritative state
  ├── Redis 3.2     — three-day leaderboard cache
  └── var/          — sessions, logs, and new replay JSONL

Scheduler container
  ├── every minute  — bounded turn regeneration
  └── hourly         — refresh three-day leaderboard cache
```

`docker-compose.yml` defines `web`, `scheduler`, `db`, and `redis`. Only the web service publishes a host port. MariaDB and Redis are reachable only on the Compose network. The web and scheduler services use the same PHP 5.6 image and share the host's `var/` runtime mount; database and cache state use named volumes.

The Vagrant workflow adds an Ubuntu 22.04 isolation boundary and forwards host loopback port 8080 to the guest. `scripts/provision-vm.sh` installs Docker/Compose and invokes `run-local.sh` inside `/opt/purett`. The direct Compose workflow uses the identical images and service definitions without the VM wrapper.

## Deployment boundary

Apache's only document root is `/var/www/app/public`. The PHP image copies an allowlisted application set: `application/`, required libraries, `public/` without excluded subtrees, dialogs, cron commands, CLI commands, and the scheduler script.

The following are not part of the deployed image:

- `purettv2/`
- `public/wordpress/`
- `data/logs/`
- `docs/`
- `tests/`
- repository metadata, local `.env`, and archived platform source

Application configuration, SQL, replay logs, and repository files are outside the document root. Apache also denies dotfiles, directory listings, the WordPress route, and common source/configuration extensions.

## Request flow

1. Apache serves existing static assets or rewrites the request to `public/index.php`.
2. Zend Framework bootstraps runtime paths, the view/layout system, locale, session policy, and baseline response headers.
3. Public authentication and health controllers extend the generic Gamehouse controller. All account/game controllers extend `Standalone_Controller_Action`.
4. The standalone controller opens the `purett` session, resolves `session.userid` to an enabled local account, and either supplies `PureTripleTriad_User` or returns an HTML redirect / JSON 401.
5. State-changing actions call `requireCsrf()`, which requires POST and validates the form or `X-CSRF-Token` value with `hash_equals()`.
6. Controllers validate request shapes and call the existing game domain classes. `PureTripleTriad_Database` performs bound SQL and transactional mutations.
7. JSON endpoints return only the client protocol payload. The page layout embeds boot data with JSON hex escaping rather than building JavaScript from unescaped profile text.

## Authentication flow

Registration normalizes and validates the username, validates display name/password/email, hashes the password with PHP's password API, and calls a single transactional account constructor. That transaction allocates a human user ID at 2 or above, creates the local account, wallet, transaction ledger row, turn row, and five-card starting hand.

Login fetches by normalized username, rejects disabled/deleted accounts, verifies the password hash, regenerates the session ID, rotates the CSRF token, and redirects to the game. Logout requires POST plus CSRF and invalidates the session and cookie. Account deletion additionally verifies the password, cascades owned database state from `users`, removes that account's new runtime replay directory, and destroys the session.

## Game flow

1. The main page receives current hand/deck counts, record, turns, next rules, coins, colors, local profile, and leaderboard data.
2. `POST /index/game` requires authentication and CSRF. The engine resumes the player's active game or creates one using the selected five-card hand, rule progression, board elements, a cryptographically random move token, and user ID 1 as the computer.
3. The server-side AI chooses and plays the computer hand. Client moves are POSTed with a game-card ID, board position 0–8, and the current move token.
4. The engine rejects an unowned card, occupied/out-of-range square, stale token, or move made out of turn. A valid human move consumes one turn.
5. Capture evaluation remains in `PureTripleTriad_Game`: Basic, Same, Plus, Combo, Same Wall, and positive/negative Elemental effects. Open/Closed, Random, Sudden Death, and the four reward modes remain protocol-level rules.
6. Completion updates the record, card transfers/rewards, game-history metadata, and active-game removal transactionally. A protected locally acquired card is not lost through an ordinary transfer.
7. Review/replay retrieves the database-approved relative log path and streams the sanitized JSONL event sequence to the existing Raphael client.

An active game is unique per human (`games.p1`). Inserted game IDs come from the current connection's `lastInsertId()`, not a race-prone maximum query.

## Persistence responsibilities

### MariaDB: source of truth

- Local identity, password hashes, account state, and lifetime record
- Card catalog, collection, exact active hand, and protected-card state
- Active games, rules, board cards, scores, move token, and claim state
- Completed-game index and replay authorization metadata
- Wallet balance, coin ledger, catalog, purchase results, and idempotency
- Turn balance and regeneration timestamp
- User colors/options, local feedback, and schema version
- Three-day leaderboard source rows

All application-facing queries use bound parameters or validated numeric limits. Shared database construction avoids reconnecting once per card within a request.

### Redis: rebuildable cache

Redis stores one JSON value at `leaderboard:three-day` with a one-hour TTL. A cache miss rebuilds it from MariaDB. Turns are deliberately database-backed: row locks and timestamps make consumption, purchased bundles, restart recovery, and deterministic regeneration easier to test than the former ephemeral per-user keys. Redis loss therefore does not lose accounts, games, turns, or coins.

### Filesystem: runtime-only artifacts

- `var/sessions/`: server-side PHP sessions
- `var/log/`: Apache and PHP error/access logs
- `var/gamehistory/<local-user>/<game>.jsonl`: newly completed private game logs
- `var/gamehistory/tutorials/`: sanitized public tutorial fixtures

Only a database `gamehistory.log_path` that passes path validation can be opened. Raw request path components are never concatenated into a replay filename. `var/` is outside `public/` and is not copied into static assets.

## Turn regeneration

Turn policy is coherent across registration, requests, and scheduled work:

- Start at 30 turns.
- Consume one on each accepted human move.
- Earn one every 300 seconds while below 30.
- Stop natural regeneration at 30.
- Purchased turn bundles may exceed 30; the timer resumes only after play drops below the natural cap.

`regenerateTurns()` locks one `user_turns` row and accepts an explicit timestamp for deterministic tests. `regenerateAllTurns()` selects at most 500 eligible rows per scheduler pass; it does not scan Redis with `KEYS`.

## Local economy

The currency is test-only. A purchase request carries a catalog type, item ID, and idempotency key—not a trusted price or user ID. The server locks the authenticated user's wallet, looks up/calculates price, verifies funds, grants the card/color/turns, updates the balance, and writes both purchase result and coin ledger entry in one transaction. A repeated order key for the same account returns its original stored result instead of granting twice.

Cards cost twice their level. The seeded color catalog includes green, purple, orange, black, and white; the seeded turn catalog includes 5, 10, 20, 50, and 100-turn bundles. `PURETT_FREE_ECONOMY=1` is an explicit development-only mode that grants catalog items without deducting coins while still recording the transaction.

## Leaderboard

The leaderboard covers completed games from the preceding three days. MariaDB aggregates wins, losses, draws, games played, and average player score per enabled local account, calculates a stable score, sorts deterministically, and returns the first five with rank and local initials. Redis caches that complete result; the browser never needs a profile service.

