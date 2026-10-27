#!/usr/bin/env bash
# Install Neo4j Community without Docker or root, under $KG_HOME.
# Idempotent: downloads are skipped when present, config is rewritten every run.
set -euo pipefail

KG_HOME="${KG_HOME:-$HOME/neo4j-kg}"
NEO4J_VERSION="${NEO4J_VERSION:-5.26.31}"
KG_BOLT_PORT="${KG_BOLT_PORT:-17687}"
KG_HTTP_PORT="${KG_HTTP_PORT:-17474}"

mkdir -p "$KG_HOME/bin" "$KG_HOME/downloads"
cd "$KG_HOME"

if [ ! -x jre/bin/java ]; then
  echo "==> JRE 21"
  curl -fsSL -o downloads/jre.tar.gz \
    "https://api.adoptium.net/v3/binary/latest/21/ga/linux/x64/jre/hotspot/normal/eclipse"
  mkdir -p jre
  tar -xzf downloads/jre.tar.gz -C jre --strip-components=1
fi

if [ ! -x neo4j/bin/neo4j ]; then
  echo "==> Neo4j $NEO4J_VERSION"
  # dist.neo4j.org is unreliable from the KU network; deploy-ku.sh uploads the tarball.
  if ! tar -tzf downloads/neo4j.tar.gz >/dev/null 2>&1; then
    curl -fsSL -o downloads/neo4j.tar.gz \
      "https://dist.neo4j.org/neo4j-community-${NEO4J_VERSION}-unix.tar.gz"
  fi
  mkdir -p neo4j
  tar -xzf downloads/neo4j.tar.gz -C neo4j --strip-components=1
  mkdir -p neo4j/data neo4j/logs neo4j/run neo4j/plugins
fi

export JAVA_HOME="$KG_HOME/jre"
export PATH="$JAVA_HOME/bin:$PATH"

# Keep an existing read-only flag so a reinstall does not unlock a live database.
READ_ONLY=true
if [ -f neo4j/conf/neo4j.conf ] && grep -q '^server.databases.default_to_read_only=false' neo4j/conf/neo4j.conf; then
  READ_ONLY=false
fi

echo "==> neo4j.conf"
cat >neo4j/conf/neo4j.conf <<CONF
# Written by ku-install.sh. Shared host: localhost only, small memory footprint.
server.default_listen_address=127.0.0.1
server.bolt.listen_address=127.0.0.1:${KG_BOLT_PORT}
server.http.listen_address=127.0.0.1:${KG_HTTP_PORT}
server.http.enabled=true
server.https.enabled=false
server.memory.heap.initial_size=512m
server.memory.heap.max_size=512m
server.memory.pagecache.size=256m
dbms.memory.transaction.total.max=256m
db.transaction.timeout=15s
server.databases.default_to_read_only=${READ_ONLY}
server.directories.logs=logs
db.logs.query.enabled=OFF
CONF

if [ ! -f .env ]; then
  echo "==> credentials"
  password="$(head -c 24 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 24)"
  neo4j/bin/neo4j-admin dbms set-initial-password "$password" >/dev/null
  umask 077
  cat >.env <<ENV
NEO4J_URI=bolt://127.0.0.1:${KG_BOLT_PORT}
NEO4J_USER=neo4j
NEO4J_PASSWORD=${password}
KG_HTTP_PORT=${KG_HTTP_PORT}
ENV
fi
chmod 600 .env

echo "==> python venv (verify report)"
# No python3-venv (ensurepip) on the host and no root to install it: bootstrap pip.
if [ ! -x venv/bin/pip ]; then
  rm -rf venv
  python3 -m venv --without-pip venv
  curl -fsSL -o downloads/get-pip.py https://bootstrap.pypa.io/get-pip.py
  venv/bin/python downloads/get-pip.py -q
fi
venv/bin/pip install -q 'neo4j>=5.20,<6'

install -m 755 app/deploy/neo4j-ku/kg-ctl.sh bin/kg-ctl.sh

echo "==> cron (boot + 10 min watchdog)"
{
  crontab -l 2>/dev/null | grep -v 'neo4j-kg/bin/kg-ctl.sh' || true
  echo "@reboot $KG_HOME/bin/kg-ctl.sh start >/dev/null 2>&1"
  echo "*/10 * * * * $KG_HOME/bin/kg-ctl.sh ensure >/dev/null 2>&1"
} | crontab -

bin/kg-ctl.sh start
echo "==> installed: $("$KG_HOME/neo4j/bin/neo4j" version 2>/dev/null | tail -1)"
