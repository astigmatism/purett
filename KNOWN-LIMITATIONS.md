# Known limitations

## Runtime support window

The application intentionally preserves PHP 5.6, Zend Framework 1.11.4, jQuery 1.7, Raphael 1.5, Predis 0.7, and Redis 3.2 to minimize changes to the game engine and presentation. Every one of these components is obsolete. This edition is a reproducible archival/test environment, not a supported public production platform.

The PHP image relies on archived Debian Stretch repositories. It is pinned to `linux/amd64`; ARM64 machines normally run it through emulation and may start or execute browser tests more slowly.

MariaDB 10.5 is selected as the practical reproducible MySQL-compatible service. It is newer than the original database era, so strict SQL settings and the integration suite—not historical environment equivalence—are the compatibility contract.

## VM coverage

The Vagrant definition targets `ubuntu/jammy64` and configures VirtualBox resources. Provider installation, virtualization support, and box availability remain host responsibilities. Direct Docker Compose exercises the same application/service topology but does not validate a host's Vagrant provider or port-forward implementation.

Rsync-backed Vagrant folders do not update continuously. Run `vagrant rsync` after changing source, then rebuild/restart the guest stack when a changed file is baked into the image.

## Browser and UI fidelity

The original fixed-size desktop interface, keyboard/mouse assumptions, audio formats, and legacy animation libraries are retained. Modern Chromium is the smoke-test target. Small/mobile viewports, touch-only navigation, assistive-technology behavior, Safari/Firefox quirks, and browser autoplay restrictions may differ from the archival hosted presentation.

The standalone shell adds login, account, coin, replay, and logout controls. Removed social widgets leave minor spacing and wording differences. Local initials replace remote profile pictures. Invitations, likes, social sharing, friend discovery, and real-money checkout are intentionally absent.

## Reference data and tutorials

The 110-card catalog, including directional ranks, level, element, image key, name, and derived strength, was recovered from the archived read-only MDF reference and exported into `database/seed-cards.sql`. It is not inferred placeholder data. All 110 seeded image keys resolve in each of the 14 retained color/protected-card variant directories (1,540 catalog images). The runtime has no MDF, SQL Server, ASP.NET, or `purettv2/` dependency.

The thirteen rule rows and deck-color catalog are seeded separately. Rule IDs remain fixed because they are part of the client/game protocol. Card image variants are preserved as opaque legacy filenames; changing those names would break the existing renderer.

The four public tutorials use separately sanitized fixture logs. They preserve moves needed to explain Basic, Same, Plus, and Elemental play, but historical account/session identifiers are deliberately not preserved. Consequently they are behaviorally faithful demonstrations, not byte-for-byte archival replays.

## Game and data semantics

- The historical `purchased` field remains in database and client payloads for compatibility. It now means locally acquired/protected; coins have no cash value.
- Daily shop stock is deterministic per UTC date and player eligibility but may contain fewer than ten cards for a very small eligible catalog.
- The three-day leaderboard is intentionally local and includes only completed games linked to enabled local accounts. Seeded tutorial rows do not appear as human competitors.
- Redis is a disposable leaderboard cache; account, game, and economy state remain authoritative in MariaDB.
- Account deletion permanently cascades local relational data and removes that account's new runtime replay files. There is no undo, export, soft-delete recovery UI, or cross-store atomic rollback.
- Feedback is stored in the local database. SMTP delivery and an administrative feedback UI are not configured.
- There is no historical-user import path by design.

## Operational gaps for non-local use

TLS termination, a supported PHP runtime, hardened session storage, rate limiting, account recovery, monitoring, backups, email delivery, high availability, accessibility certification, and internet-scale load testing are outside this local revival. See `SECURITY-NOTES.md` before changing the loopback-only network boundary.

Test success is environment-specific. Run `./scripts/health-check.sh`, `./scripts/test.sh`, and `./scripts/smoke-test.sh` on the exact checkout being evaluated; do not infer a pass from this document.
