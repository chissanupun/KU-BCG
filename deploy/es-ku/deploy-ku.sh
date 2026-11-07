#!/usr/bin/env bash
# Local: install Elasticsearch on the KU host and load the corpus snapshot into it.
#
# The KU account has no docker group or sudo, so Elasticsearch runs from a tarball
# under ~/es-kg, bound to localhost with password auth. The host has no Node.js, so
# the index is created and filled from this machine through an SSH tunnel, with the
# same setup-index.ts and restore-snapshot.ts the Docker stack uses.
#
# Usage (from anywhere):
#   bash deploy/es-ku/deploy-ku.sh
# Optional: KU_SSH_HOST=ppyku@phumpanya.ku.ac.th  ES_TUNNEL_PORT=19200
set -euo pipefail

KU_SSH_HOST="${KU_SSH_HOST:-ppyku@phumpanya.ku.ac.th}"
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
REMOTE=es-kg/app
TUNNEL_PORT="${ES_TUNNEL_PORT:-19200}"

echo "==> sync scripts to $KU_SSH_HOST:~/$REMOTE"
ssh "$KU_SSH_HOST" "mkdir -p ~/$REMOTE/deploy"
rsync -az --delete "$REPO/deploy/es-ku/" "$KU_SSH_HOST:$REMOTE/deploy/es-ku/"

echo "==> install"
ssh "$KU_SSH_HOST" "bash ~/$REMOTE/deploy/es-ku/es-install.sh"

echo "==> index corpus through an SSH tunnel"
ssh -f -N -o ExitOnForwardFailure=yes -L "$TUNNEL_PORT:127.0.0.1:19200" "$KU_SSH_HOST"
trap 'pkill -f "ssh -f -N -o ExitOnForwardFailure=yes -L $TUNNEL_PORT:127.0.0.1:19200" || true' EXIT

ES_PASSWORD="$(ssh "$KU_SSH_HOST" "grep '^ES_PASSWORD=' ~/es-kg/.env | cut -d= -f2-")"
export ES_NODE="http://127.0.0.1:$TUNNEL_PORT" ES_USERNAME=elastic ES_PASSWORD

cd "$REPO"
npx tsx elastic-search/setup-index.ts
npx tsx elastic-search/restore-snapshot.ts
