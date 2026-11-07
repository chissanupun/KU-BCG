#!/usr/bin/env bash
# Install Elasticsearch without Docker or root, under $ES_HOME.
# Idempotent: the download is skipped when present, config is rewritten every run.
set -euo pipefail

ES_HOME="${ES_HOME:-$HOME/es-kg}"
ES_VERSION="${ES_VERSION:-8.19.23}"
ES_HTTP_PORT="${ES_HTTP_PORT:-19200}"
ES_TRANSPORT_PORT="${ES_TRANSPORT_PORT:-19300}"
ES_HEAP="${ES_HEAP:-512m}"

mkdir -p "$ES_HOME/bin" "$ES_HOME/downloads" "$ES_HOME/data" "$ES_HOME/logs" "$ES_HOME/tmp"
cd "$ES_HOME"

if [ ! -x elasticsearch/bin/elasticsearch ]; then
  echo "==> Elasticsearch $ES_VERSION"
  if ! tar -tzf downloads/elasticsearch.tar.gz >/dev/null 2>&1; then
    curl -fsSL -o downloads/elasticsearch.tar.gz \
      "https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-${ES_VERSION}-linux-x86_64.tar.gz"
  fi
  mkdir -p elasticsearch
  tar -xzf downloads/elasticsearch.tar.gz -C elasticsearch --strip-components=1
fi

echo "==> elasticsearch.yml"
# Shared host: localhost only, and security stays on because other local
# accounts can reach 127.0.0.1. Single node, so no transport TLS is needed.
cat >elasticsearch/config/elasticsearch.yml <<CONF
# Written by es-install.sh.
cluster.name: ku-phumpanya
node.name: ku-1
discovery.type: single-node
network.host: 127.0.0.1
http.port: ${ES_HTTP_PORT}
transport.port: ${ES_TRANSPORT_PORT}
path.data: ${ES_HOME}/data
path.logs: ${ES_HOME}/logs
xpack.security.enabled: true
xpack.security.http.ssl.enabled: false
xpack.security.transport.ssl.enabled: false
xpack.ml.enabled: false
xpack.watcher.enabled: false
ingest.geoip.downloader.enabled: false
action.destructive_requires_name: true
CONF

# The host has ~4 GB shared with Neo4j and Apache; direct memory would otherwise
# default to half the heap on top of it.
cat >elasticsearch/config/jvm.options.d/heap.options <<JVM
-Xms${ES_HEAP}
-Xmx${ES_HEAP}
-XX:MaxDirectMemorySize=128m
JVM

if [ ! -f .env ]; then
  echo "==> credentials"
  password="$(head -c 24 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 24)"
  [ -f elasticsearch/config/elasticsearch.keystore ] || elasticsearch/bin/elasticsearch-keystore create >/dev/null
  printf '%s' "$password" | elasticsearch/bin/elasticsearch-keystore add -x -f bootstrap.password >/dev/null
  umask 077
  cat >.env <<ENV
ES_URL=http://127.0.0.1:${ES_HTTP_PORT}
ES_USERNAME=elastic
ES_PASSWORD=${password}
ENV
fi
chmod 600 .env

install -m 755 app/deploy/es-ku/es-ctl.sh bin/es-ctl.sh

echo "==> cron (boot + 10 min watchdog)"
{
  crontab -l 2>/dev/null | grep -v 'es-kg/bin/es-ctl.sh' || true
  echo "@reboot $ES_HOME/bin/es-ctl.sh start >/dev/null 2>&1"
  echo "*/10 * * * * $ES_HOME/bin/es-ctl.sh ensure >/dev/null 2>&1"
} | crontab -

bin/es-ctl.sh start
echo "==> installed: Elasticsearch $ES_VERSION on 127.0.0.1:$ES_HTTP_PORT"
