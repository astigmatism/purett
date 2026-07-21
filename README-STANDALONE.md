# Pure Triple Triad — standalone edition

This repository runs the original Zend Framework 1 / PHP game as a local, self-contained application. Identity, sessions, purchases, profiles, and leaderboards are local; no social-network account, SDK, API, payment system, or externally hosted browser asset is required.

## Quick start

The requested deployment unit is the Vagrant VM. It installs Docker inside Ubuntu and starts the same pinned Compose stack used by direct local development.

### Prerequisites for the VM

- Vagrant 2.3 or newer
- VirtualBox 7 or another Vagrant provider compatible with the `ubuntu/jammy64` box
- At least 3 GB of free memory and 2 CPU cores for the guest
- TCP port `127.0.0.1:8080` available on the host
- Internet access on the first launch to obtain the Vagrant box and container images

Launch it from the repository root:

```sh
vagrant up
```

When provisioning finishes, open <http://127.0.0.1:8080/>.

Demo account:

- Username: `demo`
- Password: `TripleTriad!`

The demo account starts with five cards in its active hand and 3 coins. The credentials are intentionally public demo data; do not reuse the password for another account or service.

### Direct Docker Compose launch

For a faster development cycle without Vagrant, install Docker Desktop or Docker Engine with the Compose v2 plugin, plus `openssl`, `curl`, and a POSIX shell. Then run:

```sh
./run-local.sh
```

The script checks its prerequisites, creates a private local `.env` with randomly generated database passwords on first use, prepares writable runtime directories, builds the PHP image, starts the services, and waits for the health endpoint. It binds the web application to loopback at <http://127.0.0.1:8080/>. MariaDB and Redis have no host-published ports.

The service versions are:

- Ubuntu 22.04 (`ubuntu/jammy64`) as the VM wrapper
- Apache 2.4 and PHP 5.6.40 in the `php:5.6.40-apache` image
- vendored Zend Framework 1.11.4 and Predis 0.7.0
- MariaDB 10.5.27 with strict transactional settings
- Redis 3.2.12

The PHP image is pinned to `linux/amd64`. Docker Desktop can emulate it on Apple Silicon and other ARM64 hosts, although the first build and startup will be slower.

## Health and tests

The PHP/unit/integration test runner uses the application container. The browser smoke test is host-side and additionally requires Node.js 18 or newer and npm. On its first run, `scripts/smoke-test.sh` installs the declared Playwright dependencies when needed; if a browser binary cannot be installed automatically, it reports the required npm/Playwright install command. First-time installation requires network access.

For repeatability, the browser smoke command restores only the documented `demo` fixture before it opens Chromium. Running it deletes that demo account's current cards, purchases, record, and new replay files, then recreates the seeded demo state. It never resets another local account or any preserved archival material.

With the direct Compose stack running:

```sh
./scripts/health-check.sh
./scripts/test.sh
./scripts/smoke-test.sh
```

Equivalent Make targets are:

```sh
make health
make test
make smoke
```

For a Vagrant-managed stack, execute the container-dependent PHP suite in the guest, then run the browser test on the host against the forwarded URL:

```sh
vagrant ssh -c 'cd /opt/purett && ./scripts/test.sh'
./scripts/smoke-test.sh
```

The host-side health check likewise works through the forwarded port:

```sh
./scripts/health-check.sh
```

The health endpoint checks application boot, the database, Redis, the installed schema version, and writable runtime log/history directories. A command's exit status and output are authoritative; this document does not substitute for running it on the current checkout.

## VM and service lifecycle

```sh
vagrant up                 # create/provision or start the VM
vagrant rsync              # copy later source changes into the rsync guest folder
vagrant provision          # rerun provisioning
vagrant ssh                # open a guest shell
vagrant halt               # stop the VM without deleting it
vagrant destroy            # permanently delete the VM after confirmation
```

For direct Compose use:

```sh
docker compose ps
docker compose logs -f web scheduler db redis
docker compose down        # stop services; preserve named data volumes
./run-local.sh             # rebuild/start again
```

`scheduler` refreshes the genuine three-day leaderboard cache hourly.

## Resetting local data

The following command deletes the local MariaDB and Redis named volumes, then initializes a fresh schema and seed set. It permanently removes locally registered accounts and play history held in those volumes. It does not modify the preserved historical archive.

```sh
./scripts/reset-local.sh
```

Inside the VM, run:

```sh
vagrant ssh -c 'cd /opt/purett && ./scripts/reset-local.sh'
```

## Granting test coins

Grant a positive number of local, non-monetary test coins by username:

```sh
./scripts/grant-coins.sh demo 200
```

Inside the VM:

```sh
vagrant ssh -c 'cd /opt/purett && ./scripts/grant-coins.sh demo 200'
```

The grant is validated server-side, limited to 1–1,000,000 coins per invocation, and recorded in `coin_transactions` with a unique reference.

## Troubleshooting

### Docker is unavailable

If `run-local.sh` reports that the daemon is unavailable, start Docker Desktop or the Docker Engine service and rerun it. Use `docker info` and `docker compose version` to distinguish a stopped daemon from a missing Compose plugin.

### Port 8080 is already in use

Stop the conflicting process. For direct Compose only, set `PURETT_HTTP_PORT` in the generated `.env` to another unused port and use that port for health checks. The Vagrant definition intentionally fixes the forwarded host port to 8080.

### The stack starts but does not become healthy

Inspect service state and logs without printing `.env`:

```sh
docker compose ps
docker compose logs web db redis scheduler
```

Typical causes are an incomplete first image download, insufficient Docker memory, or a stale database volume created from an older schema. If the local data can be discarded, use `./scripts/reset-local.sh`.

### Permission errors under `var/`

`run-local.sh` prepares `var/gamehistory`, `var/log`, and `var/sessions`. Run it from the repository root. Do not move these directories under `public/`.

### Vagrant provisioning fails

Confirm that virtualization is enabled, the `ubuntu/jammy64` box supports the selected provider, and port 8080 is free. After fixing a transient package or network failure, run `vagrant provision`. On ARM hosts, direct Docker Desktop is often quicker for development because the VM definition targets the widely available amd64 Ubuntu box.

### Reset did not load changed seed SQL

MariaDB applies files under `database/` only when its data directory is new. `docker compose down` preserves that volume; use the explicit reset script when you intentionally want a clean reseed.

## More documentation

- [Architecture](ARCHITECTURE-STANDALONE.md)
- [Migration from the former platform](MIGRATION-FROM-FACEBOOK.md)
- [Security notes](SECURITY-NOTES.md)
- [Known limitations](KNOWN-LIMITATIONS.md)
