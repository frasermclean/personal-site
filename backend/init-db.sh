#!/bin/bash
set -euo pipefail

psql_cmd() {
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres "$@"
}

init_database() {
  local user="$1"
  local password="$2"
  local database="$3"

  psql_cmd <<-SQL
    SELECT 'CREATE USER "${user}" WITH PASSWORD ''${password}'''
    WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${user}')
    \gexec

    SELECT 'CREATE DATABASE "${database}" OWNER "${user}"'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${database}')
    \gexec

    GRANT ALL PRIVILEGES ON DATABASE "${database}" TO "${user}";
SQL
  echo "Database '$database' with user '$user' is ready."
}

echo "Initializing databases..."

init_database "$UMAMI_DB_USER" "$UMAMI_DB_PASSWORD" "$UMAMI_DB_NAME"
