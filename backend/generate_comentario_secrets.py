#!/usr/bin/env python3
"""Generate Comentario secrets YAML from .env variables."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


REQUIRED_KEYS = (
    "COMENTARIO_DB_USER",
    "COMENTARIO_DB_PASSWORD",
    "COMENTARIO_DB_NAME",
)


def parse_env_file(env_path: Path) -> dict[str, str]:
    values: dict[str, str] = {}

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue

        if line.startswith("export "):
            line = line[len("export ") :]

        if "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()

        if value and value[0] == value[-1] and value[0] in ('"', "'"):
            value = value[1:-1]

        values[key] = value

    return values


def yaml_string(value: str) -> str:
    # JSON string escaping is valid for YAML double-quoted scalars.
    return json.dumps(value)


def build_yaml(env_values: dict[str, str]) -> str:
    missing = [key for key in REQUIRED_KEYS if not env_values.get(key)]
    if missing:
        missing_keys = ", ".join(missing)
        raise ValueError(f"Missing required keys in .env: {missing_keys}")

    host = env_values.get("COMENTARIO_DB_HOST", "backend-database")
    port_str = env_values.get("COMENTARIO_DB_PORT", "5432")

    try:
        port = int(port_str)
    except ValueError as exc:
        raise ValueError("COMENTARIO_DB_PORT must be an integer") from exc

    return "\n".join(
        [
            "postgres:",
            f"  host: {yaml_string(host)}",
            f"  port: {port}",
            f"  database: {yaml_string(env_values['COMENTARIO_DB_NAME'])}",
            f"  username: {yaml_string(env_values['COMENTARIO_DB_USER'])}",
            f"  password: {yaml_string(env_values['COMENTARIO_DB_PASSWORD'])}",
            "",
        ]
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate Comentario secrets YAML from a .env file"
    )
    parser.add_argument(
        "--env-file",
        default=".env",
        help="Path to the .env file (default: .env in current directory)",
    )
    parser.add_argument(
        "--output",
        default="comentario-secrets.yml",
        help="Output YAML file path (default: comentario-secrets.yml)",
    )
    args = parser.parse_args()

    env_path = Path(args.env_file)
    if not env_path.is_file():
        raise FileNotFoundError(f".env file not found: {env_path}")

    env_values = parse_env_file(env_path)
    output_content = build_yaml(env_values)

    output_path = Path(args.output)
    output_path.write_text(output_content, encoding="utf-8")
    print(f"Generated {output_path} from {env_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
