#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y docker.io docker-compose-v2 openssl curl || apt-get install -y docker.io docker-compose openssl curl
systemctl enable --now docker

mkdir -p /opt/purett/var/gamehistory/tutorials /opt/purett/var/log /opt/purett/var/sessions
chmod 0777 /opt/purett/var/gamehistory /opt/purett/var/gamehistory/tutorials /opt/purett/var/log /opt/purett/var/sessions

cd /opt/purett
PURETT_BIND_ADDRESS=0.0.0.0 ./run-local.sh
