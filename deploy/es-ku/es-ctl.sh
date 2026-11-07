#!/usr/bin/env bash
# Control the Elasticsearch node installed by es-install.sh.
#
# Usage: es-ctl.sh start|stop|restart|status|ensure
#   ensure  start Elasticsearch if it is not running (cron watchdog)
set -euo pipefail

ES_HOME="${ES_HOME:-$HOME/es-kg}"
ES_BIN="$ES_HOME/elasticsearch/bin/elasticsearch"
PID_FILE="$ES_HOME/es.pid"
export ES_TMPDIR="$ES_HOME/tmp"

set -a
# shellcheck disable=SC1091
. "$ES_HOME/.env"
set +a

running() {
  [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null
}

healthy() {
  curl -s -o /dev/null -m 3 -w '%{http_code}' -u "$ES_USERNAME:$ES_PASSWORD" "$ES_URL/" | grep -q '^200$'
}

wait_ready() {
  for _ in $(seq 1 90); do
    if healthy; then
      return 0
    fi
    sleep 2
  done
  echo "Elasticsearch did not become ready; see $ES_HOME/logs/ku-phumpanya.log" >&2
  return 1
}

start() {
  running || "$ES_BIN" -d -p "$PID_FILE" >/dev/null
  wait_ready
}

stop() {
  if running; then
    kill "$(cat "$PID_FILE")"
    for _ in $(seq 1 30); do
      running || break
      sleep 1
    done
  fi
  rm -f "$PID_FILE"
}

case "${1:-status}" in
  start) start ;;
  stop) stop ;;
  restart) stop; start ;;
  status)
    if running && healthy; then
      echo "Elasticsearch is running at pid $(cat "$PID_FILE")"
    else
      echo "Elasticsearch is not running"
      exit 3
    fi
    ;;
  ensure)
    if ! running; then
      echo "$(date -Is) elasticsearch not running, starting" >>"$ES_HOME/watchdog.log"
      "$ES_BIN" -d -p "$PID_FILE" >/dev/null
    fi
    ;;
  *)
    echo "usage: $0 start|stop|restart|status|ensure" >&2
    exit 2
    ;;
esac
