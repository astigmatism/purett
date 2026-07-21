# Migration from Facebook

## Result

The active runtime now uses local accounts and local infrastructure. The Facebook SDK is not initialized, identity is not fetched from the Graph API, purchases do not use signed callbacks or real money, and the browser does not need any third-party network request. Historical integration files are retained only under an excluded archive when they are useful for provenance; they are not copied into the runtime image.

## File-by-file removal inventory

This is the migration disposition for every known integration point in the former active application:

| Former path or symbol | Disposition |
| --- | --- |
| `library/Facebook/Controller/Action.php` and `Facebook_Controller_Action` | Removed from active autoload/deployment; replaced by `library/Standalone/Controller/Action.php` |
| `library/Facebook/` PHP SDK | Moved to the excluded historical archive; no active controller loads it |
| `application/controllers/IndexController.php` | Rewritten around the authenticated local user, CSRF-protected POST mutations, local shop/feedback, and authorized replay |
| `application/controllers/PurchaseController.php` | Signed-request/Credits callback replaced by authenticated, idempotent local-coin purchase POST |
| `application/controllers/ReplayController.php` | Caller-supplied profile identity replaced by session identity and `gamehistory` authorization |
| `application/controllers/UninstallController.php` | Facebook deauthorization endpoint removed from active routing; account deletion moved to `AccountController` |
| `application/views/layouts/facebook.phtml` and the former `game.phtml` | Removed from active layouts; `standalone.phtml` and `auth.phtml` load only local assets |
| `application/configs/game.ini` | App ID/key/secret, Canvas host/path, permissions, and historical service settings removed; only standalone game policy remains |
| `public/js/gh.facebook.js` | Removed from active assets; local calls use `public/js/gh.platform.js` |
| `public/js/default/index.js` | Like/page/invite/Credits actions replaced by local account, coin, replay, and menu actions |
| `public/js/plugins/gh.menu.js` | Graph name/photo lookups and invite item replaced by fully populated local leaderboard rows |
| `public/js/plugins/gh.shop.js` | `FB.ui` purchase calls and Credits balance replaced by `gh.platform.purchase()` and coins |
| `FB.init`, `FB.api`, `FB.ui`, `FB.Canvas`, `apprequests`, Like markup, Graph/profile URLs, `signed_request`, and Credits symbols | Removed from active PHP/view/JavaScript code rather than shimmed |
| Classic Google Analytics and remote Google Fonts/CDN URLs | Removed from active layouts; scripts, styles, images, and audio are local |
| WordPress Simple Facebook Connect under `public/wordpress/` | Preserved as unrelated archival material but excluded from the image and denied by Apache |

## Dependency replacement map

| Former dependency or behavior | Standalone replacement |
| --- | --- |
| Facebook PHP SDK and platform-authenticated base controller | `Standalone_Controller_Action`, backed by a server-side `Zend_Session` and `local_accounts` |
| Canvas login, signed requests, OAuth redirects, access tokens, and permissions | Username/password registration and login using `password_hash()` / `password_verify()` |
| JavaScript SDK initialization and Canvas resizing | Local `gh.platform` browser adapter and the normal standalone page layout |
| Facebook Graph profile lookup | `local_accounts.display_name` and the numeric local user ID |
| Remote profile pictures | CSS/local initials supplied in leaderboard data |
| App requests and invitation dialogs | Deliberately removed; no external replacement is required to play |
| Like widget and hosted product-page links used as game controls | Deliberately removed; account, coin, replay, and logout controls are local |
| Facebook Credits UI and signed purchase callback | Authenticated `POST /purchase`, CSRF protection, server catalog prices, and local test coins |
| Hosted balance lookup | Transactional `wallets` row and `coin_transactions` ledger |
| Hosted uninstall/deauthorization callback | Password-confirmed local account deletion |
| Leaderboard identity enrichment through a graph API | Three-day SQL aggregation over local accounts; Redis caches the complete browser-ready result |
| Replay URLs containing a caller-supplied user identity | Session-derived identity plus database authorization of the game-history record |
| Classic analytics and remote font/CDN assets | Remote requests removed; the original Spinnaker face is bundled locally and system fallbacks remain available |
| Browser-triggered optimizer and arbitrary file list | Removed from the request path; source assets are served from a fixed local set |
| Application IDs, secrets, Canvas URLs, and platform configuration sent to JavaScript | Removed; browser boot data contains only game state, local profile fields, coins, turns, CSRF token, and leaderboard data |
| WordPress social-connection code | The unrelated `public/wordpress/` archive is excluded from the image and explicitly denied by Apache |

The active controllers for games, deck management, colors, feedback, purchases, replay, and account settings derive ownership from the authenticated session. The computer continues to use numeric user ID 1; local human IDs start at 2 so the game engine's long-standing opponent invariant is preserved.

## Schema changes

The original application's missing deployable schema was reconstructed in `database/schema.sql`, with reference and demo data in `database/seed-cards.sql`, `database/seed-reference.sql`, and `database/seed.sql`.

Standalone identity and economy add:

- `local_accounts` for normalized usernames, display names, password hashes, and disabled state
- `wallets` for the current coin balance
- `coin_transactions` for grants and atomic purchase ledger entries
- `user_turns` for deterministic turn balance and regeneration timestamps
- `shopitems` for server-authoritative colors and turn bundles
- `purchases` for fulfillment state, result snapshots, and idempotency keys
- `feedback_reports` for local bug reports and feedback
- `schema_migrations` for an installed-schema marker

The game tables retain the numeric keys and field shapes expected by the legacy engine: `users`, `cards`, `usercards`, `games`, `rules`, `gamerules`, `gamecards`, `gamehistory`, `options`, and `useroptions`. `gamehistory` now stores a validated relative `log_path`, an explicit public flag, and an optional tutorial slug. The `usercards.purchased` flag is retained for protocol compatibility, but in the standalone product it means a locally acquired protected card rather than a real-money purchase.

Fresh registration is one transaction that creates the user and account, a 200-coin wallet and initial ledger entry, a 30-turn balance, and exactly five starting cards. No historical user is imported.

## Behavior changes

- A username, display name, password, and optional email replace hosted identity. Passwords must be 10–128 characters; usernames have a restricted normalized format.
- Login regenerates the session ID. Logout and account deletion are POST-only and require CSRF validation; deletion also requires the password.
- Coins have no monetary value. Card prices are calculated from the server-side card level, while color and turn prices come from `shopitems`.
- Purchases lock the wallet, apply balance deduction and item grant in one database transaction, and return the stored result for a repeated idempotency key.
- Newly acquired shop cards retain the old protected-card behavior without implying a cash purchase.
- New accounts begin at the natural cap of 30 turns. A human move consumes one turn. One turn regenerates every five minutes up to 30; turn bundles may temporarily raise the balance above 30.
- The misleading former leaderboard window is now consistently a genuine three-day window. Results include local ID, display name, win/loss/draw counts, games played, average points, score, rank, and initials.
- Daily shop card ordering is deterministic for a UTC date and safely returns fewer items if the eligible catalog is smaller than the requested stock size.
- New replay logs are JSON Lines files under `var/gamehistory/`, separate from preserved historical logs. Private logs require ownership; only explicitly seeded tutorial records are public.
- Bug reports and feedback are stored locally rather than sent to a hosted page or third party.

## Deliberately removed features

- Hosted-platform login, account linking, permissions, and friend graph
- Canvas embedding and resize APIs
- Likes, invitations/app requests, and social-page controls
- Remote profile images
- Real-money or hosted-credit payments and signed callbacks
- Deauthorization webhooks
- Classic analytics and remote third-party font/CDN requests
- Browser-invoked asset optimization, debug, phpinfo, card-grant, and static-code admin endpoints

None of these has been replaced with a no-op `FB` or `gh.facebook` compatibility object. Their active call sites and layouts were replaced with local concepts.

## Compatibility retained intentionally

The migration preserves Zend Framework 1.11.4, the server-side `PureTripleTriad` game classes, the jQuery/Raphael UI, existing card-image naming, dialog/audio assets, and several opaque JSON field names used by the original client/server game protocol. These protocol names are not credentials or identity adapters.

The vendored Facebook-era source may remain in `archive/legacy-platform/` solely as a historical reference. That directory, along with `purettv2/`, documentation, historical logs, tests, and the unrelated WordPress tree, is excluded by the Docker build allowlist/ignore rules and cannot be autoloaded by the running application. No Facebook compatibility adapter is retained in the active runtime.
