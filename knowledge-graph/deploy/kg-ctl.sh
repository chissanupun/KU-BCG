#!/usr/bin/env bash
# Control the Neo4j knowledge graph installed by ku-install.sh.
#
# Usage: kg-ctl.sh start|stop|restart|status|ensure|import
#   ensure  start Neo4j if it is not running (cron watchdog)
#   import  unlock the database, rebuild the graph, lock it again, run the validators
set -euo pipefail

KG_HOME="${KG_HOME:-$HOME/neo4j-kg}"
export JAVA_HOME="$KG_HOME/jre"
export PATH="$JAVA_HOME/bin:$PATH"
NEO4J="$KG_HOME/neo4j/bin/neo4j"
CONF="$KG_HOME/neo4j/conf/neo4j.conf"
APP="$KG_HOME/app/knowledge-graph"
PYTHON="$KG_HOME/venv/bin/python"

set -a
# shellcheck disable=SC1091
. "$KG_HOME/.env"
set +a

running() {
  "$NEO4J" status >/dev/null 2>&1
}

wait_ready() {
  for _ in $(seq 1 90); do
    if curl -s -o /dev/null -m 2 "http://127.0.0.1:${KG_HTTP_PORT}/"; then
      return 0
    fi
    sleep 2
  done
  echo "Neo4j did not become ready; see $KG_HOME/neo4j/logs/neo4j.log" >&2
  return 1
}

set_read_only() {
  sed -i "s/^server.databases.default_to_read_only=.*/server.databases.default_to_read_only=$1/" "$CONF"
}

restart() {
  if running; then "$NEO4J" stop >/dev/null; fi
  "$NEO4J" start >/dev/null
  wait_ready
}

case "${1:-status}" in
  start)
    running || "$NEO4J" start >/dev/null
    wait_ready
    ;;
  stop)
    "$NEO4J" stop
    ;;
  restart)
    restart
    ;;
  status)
    "$NEO4J" status
    ;;
  ensure)
    if ! running; then
      echo "$(date -Is) neo4j not running, starting" >>"$KG_HOME/watchdog.log"
      "$NEO4J" start >/dev/null
    fi
    ;;
  import)
    # Always re-lock, even when the build fails half way.
    trap 'set_read_only true; restart' EXIT
    set_read_only false
    restart
    cd "$APP"
    "$PYTHON" build_graph.py
    trap - EXIT
    set_read_only true
    restart
    "$PYTHON" validate_graph.py >/dev/null && echo "validate_graph: PASS" || echo "validate_graph: FAIL (see reports/)"
    "$PYTHON" validate_owl.py --self-test >/dev/null && echo "validate_owl: PASS" || echo "validate_owl: FAIL (see reports/)"
    # PHP's open_basedir only allows ~/html, and app deploys replace the app directory.
    publish="${KG_REPORTS_PUBLISH_DIR:-$HOME/html/kg-reports}"
    mkdir -p "$publish"
    cp reports/*.md reports/*.json "$publish/"
    echo "reports published to $publish"
    ;;
  *)
    echo "usage: $0 start|stop|restart|status|ensure|import" >&2
    exit 2
    ;;
esac
