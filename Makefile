.PHONY: vm-up vm-down up down health test unit smoke reset grant-coins graphics-install graphics-build graphics-check

vm-up:
	vagrant up

vm-down:
	vagrant halt

up:
	./run-local.sh

down:
	docker compose down

health:
	./scripts/health-check.sh

test:
	./scripts/test.sh

unit:
	./scripts/test.sh unit

smoke:
	./scripts/smoke-test.sh

graphics-install:
	npm --prefix frontend ci

graphics-build:
	npm --prefix frontend run build:graphics

graphics-check:
	npm --prefix frontend run check:graphics

reset:
	./scripts/reset-local.sh

grant-coins:
	./scripts/grant-coins.sh demo 200
