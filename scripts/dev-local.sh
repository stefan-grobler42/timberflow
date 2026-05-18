#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-timbertracker-postgres}"
API_PORT="${API_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

pids=()

cleanup() {
  for pid in "${pids[@]:-}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
}

trap cleanup EXIT INT TERM

port_is_listening() {
  local port="$1"
  lsof -iTCP:"$port" -sTCP:LISTEN -n -P >/dev/null 2>&1
}

wait_for_http() {
  local url="$1"
  local label="$2"
  local attempts="${3:-60}"

  for _ in $(seq 1 "$attempts"); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "$label is ready: $url"
      return 0
    fi
    sleep 1
  done

  echo "$label did not respond at $url" >&2
  return 1
}

ensure_docker() {
  if docker info >/dev/null 2>&1; then
    return 0
  fi

  if [[ "$(uname -s)" == "Darwin" ]]; then
    echo "Starting Docker Desktop..."
    open -a Docker >/dev/null 2>&1 || true
  fi

  for _ in $(seq 1 60); do
    if docker info >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done

  echo "Docker is not available. Start Docker Desktop and rerun this command." >&2
  return 1
}

ensure_postgres() {
  ensure_docker

  if ! docker inspect "$POSTGRES_CONTAINER" >/dev/null 2>&1; then
    echo "Postgres container '$POSTGRES_CONTAINER' was not found." >&2
    return 1
  fi

  local status
  status="$(docker inspect -f '{{.State.Status}}' "$POSTGRES_CONTAINER")"
  if [[ "$status" != "running" ]]; then
    echo "Starting Postgres container '$POSTGRES_CONTAINER'..."
    docker start "$POSTGRES_CONTAINER" >/dev/null
  fi

  for _ in $(seq 1 60); do
    local health
    health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}running{{end}}' "$POSTGRES_CONTAINER")"
    if [[ "$health" == "healthy" || "$health" == "running" ]]; then
      echo "Postgres is ready."
      return 0
    fi
    sleep 1
  done

  echo "Postgres container '$POSTGRES_CONTAINER' did not become healthy." >&2
  return 1
}

start_api() {
  if port_is_listening "$API_PORT"; then
    echo "API already appears to be running on port $API_PORT."
    return 0
  fi

  echo "Starting API on port $API_PORT..."
  ./scripts/dev-api.sh &
  pids+=("$!")
}

start_frontend() {
  if port_is_listening "$FRONTEND_PORT"; then
    echo "Frontend already appears to be running on port $FRONTEND_PORT."
    return 0
  fi

  echo "Starting frontend on port $FRONTEND_PORT..."
  ./scripts/dev-frontend.sh &
  pids+=("$!")
}

ensure_postgres
start_api
start_frontend

wait_for_http "http://127.0.0.1:${API_PORT}/swagger/index.html" "API"
wait_for_http "http://127.0.0.1:${FRONTEND_PORT}/" "Frontend"

echo
echo "Local dev server is running:"
echo "  Frontend: http://localhost:${FRONTEND_PORT}"
echo "  API:      http://localhost:${API_PORT}/swagger/index.html"
echo
echo "Press Ctrl+C to stop processes started by this action."

if ((${#pids[@]} > 0)); then
  wait "${pids[@]}"
else
  echo "No new processes were started; existing dev servers are already running."
fi
