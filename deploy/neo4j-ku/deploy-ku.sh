#!/usr/bin/env bash
# Local: install Neo4j on the KU host and load elastic-search/neo4j_import.cypher into it.
#
# The KU account has no docker group or sudo, so Neo4j runs from a tarball under
# ~/neo4j-kg, bound to localhost, read-only except while importing. The /graph page of
# ku-phumpanya reads it through the HTTP API.
#
# Usage (from anywhere):
#   bash deploy/neo4j-ku/deploy-ku.sh
# Optional: KU_SSH_HOST=ppyku@phumpanya.ku.ac.th
set -euo pipefail

KU_SSH_HOST="${KU_SSH_HOST:-ppyku@phumpanya.ku.ac.th}"
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
REMOTE=neo4j-kg/app

echo "==> sync scripts and cypher to $KU_SSH_HOST:~/$REMOTE"
ssh "$KU_SSH_HOST" "mkdir -p ~/$REMOTE/elastic-search ~/$REMOTE/deploy"
rsync -az --delete "$REPO/deploy/neo4j-ku/" "$KU_SSH_HOST:$REMOTE/deploy/neo4j-ku/"
rsync -az \
  "$REPO/elastic-search/neo4j_import.cypher" \
  "$REPO/elastic-search/neo4j_verify.cypher" \
  "$KU_SSH_HOST:$REMOTE/elastic-search/"

NEO4J_VERSION="${NEO4J_VERSION:-5.26.31}"
if ! ssh "$KU_SSH_HOST" "test -x ~/neo4j-kg/neo4j/bin/neo4j"; then
  CACHE="${XDG_CACHE_HOME:-$HOME/.cache}/neo4j-kg"
  TARBALL="$CACHE/neo4j-community-${NEO4J_VERSION}-unix.tar.gz"
  if ! tar -tzf "$TARBALL" >/dev/null 2>&1; then
    echo "==> download Neo4j $NEO4J_VERSION locally (KU cannot reach dist.neo4j.org)"
    mkdir -p "$CACHE"
    curl -fL --connect-timeout 20 -o "$TARBALL" \
      "https://dist.neo4j.org/neo4j-community-${NEO4J_VERSION}-unix.tar.gz"
  fi
  ssh "$KU_SSH_HOST" "mkdir -p ~/neo4j-kg/downloads"
  rsync -az "$TARBALL" "$KU_SSH_HOST:neo4j-kg/downloads/neo4j.tar.gz"
fi

echo "==> install"
ssh "$KU_SSH_HOST" "bash ~/$REMOTE/deploy/neo4j-ku/ku-install.sh"

echo "==> import"
ssh "$KU_SSH_HOST" "~/neo4j-kg/bin/kg-ctl.sh import"
