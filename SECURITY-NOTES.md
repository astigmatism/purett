# Security notes

## Intended exposure

This is an isolated revival of an end-of-life PHP/Zend application. The supplied configuration binds direct local use to `127.0.0.1` and the VM forward to host loopback. Keep it on a trusted workstation or private test network.

**Do not expose this stack directly to the public internet without replacing or isolating the end-of-life runtime, adding TLS and a hardened reverse proxy, performing an independent security review, and addressing the remaining risks below.**

## Secrets and configuration

- Deployable configuration contains no hosted-platform application credentials and does not require access tokens, signed-request secrets, historical database credentials, or external service endpoints.
- `run-local.sh` generates random MariaDB application/root passwords into a local `.env` with a restrictive creation umask. It does not print them.
- Containers receive database/cache settings through environment variables. The browser receives no connection settings, filesystem paths, server configuration object, or server secret.
- MariaDB and Redis do not publish host ports. The local web port binds to loopback by default.
- `.env` is excluded from the Docker build context. Treat it as a secret local file: do not display it in issue reports, attach it to logs, or commit it.
- Historical credentials, if present in preserved material, must never be used to contact any service. This migration neither validates nor reuses them.

## Document-root and deployment policy

Apache serves only `/var/www/app/public`, with directory indexes disabled. Rewrite rules send application routes to the Zend front controller and deny dot paths, source/configuration extensions, and `/wordpress`. Security headers include content-type sniffing protection, clickjacking protection, no-referrer policy, a restrictive permissions policy, and a same-origin content security policy.

The Docker context/image excludes repository metadata, local secrets, archives, historical logs, documentation, tests, optimization/debug tools, `purettv2/`, and `public/wordpress/`. Database SQL and application configuration stay outside the document root. The root-level `.htaccess` is a defense-in-depth denial for an accidental broader Apache configuration; it is not a substitute for the supplied virtual host.

## Historical and archival data

- `data/logs/gamehistory/` is preserved byte-for-byte but is neither imported nor deployed. New installations do not create accounts from it.
- `purettv2/` is a read-only reference source and never a runtime dependency.
- `public/wordpress/` is an unrelated archived application. It is excluded from the image and explicitly denied at the route level.
- Platform-era PHP/JavaScript may be retained only under `archive/legacy-platform/`, which is excluded from the build and autoload paths.
- Public tutorial fixtures are separate sanitized files under the new runtime tree. Their database records are explicitly marked public; private historical identifiers and session-like values are not copied.
- New game logs omit passwords, email, CSRF values, and server configuration. Their database-selected relative paths are validated before use.

## Authentication and sessions

- Human IDs start at 2; ID 1 is permanently reserved for the computer and cannot authenticate.
- Usernames are normalized to lowercase and restricted to a small ASCII character set. Display name, email, and password lengths/formats are checked server-side.
- Passwords use `password_hash()` and `password_verify()` rather than plaintext or legacy hashes.
- Login returns the same generic failure for an unknown username, disabled account, or wrong password and adds a small fixed delay.
- The session ID is regenerated after authentication. Session files live outside `public/`; strict mode, cookie-only sessions, HttpOnly, and SameSite=Lax are enabled. The Secure cookie flag is enabled when HTTPS is detected.
- Logout is POST-only, validates CSRF, destroys server state, and expires the browser cookie.
- Account deletion is POST-only, validates CSRF and the account password, cascades owned database state, and removes only the numeric local-user runtime replay directory.

## CSRF and request validation

Each session has a cryptographically random CSRF token. HTML forms send it as `csrf_token`; browser API calls may use `X-CSRF-Token`. State-changing game, hand, color, purchase, feedback, logout, claim, and deletion operations require POST and constant-time token comparison.

Controllers reject malformed numeric IDs, positions, move tokens, usernames, catalog types, idempotency keys, and replay IDs before invoking domain code. Production error pages are generic; detailed exceptions go to `var/log/` with display errors and Zend exception display disabled.

## Authorization

- The standalone base controller derives the current user solely from the server-side session and rejects missing, disabled, or deleted accounts.
- Deck/hand changes query cards owned by the current account and enforce exactly five distinct owned card instances.
- Moves are scoped to the current active game, validate the move token and turn, and reject an occupied board position or a card not owned in that game.
- Claims validate the game, game-card ownership, and claim state under transaction/row locks.
- Purchases ignore client user identity, price, balance, and ownership claims. Server catalog values and the authenticated user are authoritative.
- Private replay/review access requires `gamehistory.userid` to match the session. The only exception is a record explicitly flagged public for a sanitized tutorial.
- Feedback is always attributed to the authenticated user; optional game linkage comes from that user's active game state.

## Database and transaction controls

Application SQL is parameterized through Zend Db, with validated bounded integers only where SQL syntax prevents a placeholder (for example the scheduler limit/window). UTF-8 settings and strict MariaDB modes are enabled.

Transactions and row locks cover account bootstrap, exact hand replacement, move/game result state, wallet deduction plus grant plus ledger entry, coin grants, turn decrement/regeneration, and protected-card claims. Game IDs use `lastInsertId()` from the inserting connection. Purchase order IDs and coin references have uniqueness constraints for idempotency.

## Remaining legacy risks

- PHP 5.6, Zend Framework 1.11.4, jQuery 1.7, and Redis 3.2 are end-of-life and receive no upstream security fixes.
- The archived Debian package sources needed to build the PHP image are not a supported security-update channel.
- The CSP must allow inline script/style for the preserved UI. This is weaker than a nonce/hash-only policy.
- Local HTTP has no transport encryption and therefore cannot set a useful Secure session cookie. The loopback bind is a required part of the default trust boundary.
- Authentication has no account lockout, configurable rate limiter, multifactor authentication, password reset, or email verification. The fixed login delay is not sufficient for internet exposure.
- The public health endpoint reveals service-ready booleans and a schema identifier. Restrict or remove it behind a production reverse proxy.
- Runtime directories are made broadly writable in the local container/VM workflow for cross-host compatibility. A production deployment should use a dedicated UID/GID and narrower permissions.
- Account deletion combines a cascading database delete with best-effort filesystem cleanup; those two storage systems cannot share one atomic transaction.
- The legacy game protocol uses opaque field names and holds active-game state across several relational rows. Fuzzing and concurrency/load testing should precede any broader exposure.
- The default container runs HTTP without a reverse proxy, request-size/rate controls beyond PHP defaults, centralized audit retention, or backup/restore automation.

These constraints are acceptable only for the documented local, isolated use case.

