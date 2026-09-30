#!/usr/bin/env bash
# Local: push the knowledge-graph code + source data to the KU host, install, import.
#
# Usage (from anywhere):
#   bash knowledge-graph/deploy/deploy-ku.sh
# Optional: KU_SSH_HOST=ppyku@phumpanya.ku.ac.th
set -euo pipefail

KU_SSH_HOST="${KU_SSH_HOST:-ppyku@phumpanya.ku.ac.th}"
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
REMOTE=neo4j-kg/app

echo "==> sync code and data to $KU_SSH_HOST:~/$REMOTE"
ssh "$KU_SSH_HOST" "mkdir -p ~/$REMOTE/elastic-search/data"
rsync -az --delete \
  --exclude .venv --exclude __pycache__ --exclude reports \
  "$REPO/knowledge-graph/" "$KU_SSH_HOST:$REMOTE/knowledge-graph/"
rsync -az "$REPO/elastic-search/seed-data.json" "$KU_SSH_HOST:$REMOTE/elastic-search/"
rsync -az \
  "$REPO/elastic-search/data/all_docs.json" \
  "$REPO/elastic-search/data/ku-forest-faculty-researchers.json" \
  "$KU_SSH_HOST:$REMOTE/elastic-search/data/"

NEO4J_VERSION="${NEO4J_VERSION:-5.26.31}"
CACHE="${XDG_CACHE_HOME:-$HOME/.cache}/neo4j-kg"
TARBALL="$CACHE/neo4j-community-${NEO4J_VERSION}-unix.tar.gz"
if ! tar -tzf "$TARBALL" >/dev/null 2>&1; then
  echo "==> download Neo4j $NEO4J_VERSION locally (KU cannot reach dist.neo4j.org)"
  mkdir -p "$CACHE"
  if ! curl -fL --connect-timeout 20 -o "$TARBALL" "https://dist.neo4j.org/neo4j-community-${NEO4J_VERSION}-unix.tar.gz"; then
    # The docker image ships the same pure-Java distribution, with x86_64 native jars.
    CONTAINER="${NEO4J_CONTAINER:-ku-bcg-neo4j-1}"
    echo "==> download failed; packaging Neo4j from container $CONTAINER"
    docker exec "$CONTAINER" neo4j --version | grep -qx "$NEO4J_VERSION"
    docker exec "$CONTAINER" tar -czf - -C /var/lib \
      --exclude=neo4j/data --exclude=neo4j/logs --exclude=neo4j/run --exclude=neo4j/.cache \
      --exclude=neo4j/packaging_info --exclude='neo4j/plugins/*' neo4j >"$TARBALL"
  fi
fi
ssh "$KU_SSH_HOST" "mkdir -p ~/neo4j-kg/downloads"
rsync -az "$TARBALL" "$KU_SSH_HOST:neo4j-kg/downloads/neo4j.tar.gz"

echo "==> install"
ssh "$KU_SSH_HOST" "bash ~/$REMOTE/knowledge-graph/deploy/ku-install.sh"

echo "==> import"
ssh "$KU_SSH_HOST" "~/neo4j-kg/bin/kg-ctl.sh import"
