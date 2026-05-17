#!/usr/bin/env python3
"""Read-only Supabase remote health check for flowya-app legacy project.

Reads SUPABASE_DB_URL from the environment (supports passwords wrapped in []).
Outputs JSON to stdout or --out. Does not print secrets.

Usage:
  set -a && source .env && set +a
  python3 scripts/supabase/remote_health_check.py
  python3 scripts/supabase/remote_health_check.py --out docs/ops/SUPABASE_HEALTH_SNAPSHOT.json
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone
from typing import Any


def parse_db_url(raw: str) -> tuple[str, str, str, int, str]:
    m = re.match(
        r"^postgres(?:ql)?://([^:]+):(.+)@([^:/]+)(?::(\d+))?/(.+)$",
        raw.strip(),
    )
    if not m:
        raise ValueError("SUPABASE_DB_URL has unexpected format")
    user, password, host, port, dbname = m.groups()
    return user, password.strip("[]"), host, int(port or "5432"), dbname


def connect():
    try:
        import psycopg2
    except ImportError as exc:
        raise SystemExit(
            "psycopg2 is required. Install with: pip3 install psycopg2-binary"
        ) from exc

    raw = os.environ.get("SUPABASE_DB_URL", "").strip()
    if not raw:
        raise SystemExit("SUPABASE_DB_URL is not set")

    user, password, host, port, dbname = parse_db_url(raw)
    conn = psycopg2.connect(
        host=host,
        port=port,
        dbname=dbname,
        user=user,
        password=password,
        sslmode="require",
    )
    return conn, host


def table_exists(cur, name: str) -> bool:
    cur.execute(
        """
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = %s
        """,
        (name,),
    )
    return cur.fetchone() is not None


def count_table(cur, name: str) -> int | None:
    if not table_exists(cur, name):
        return None
    cur.execute(f'SELECT count(*)::int FROM public."{name}"')
    return int(cur.fetchone()[0])


def rls_enabled(cur, name: str) -> bool | None:
    if not table_exists(cur, name):
        return None
    cur.execute(
        """
        SELECT c.relrowsecurity
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = %s
        """,
        (name,),
    )
    row = cur.fetchone()
    return bool(row[0]) if row else None


def run_check() -> dict[str, Any]:
    conn, host = connect()
    cur = conn.cursor()

    watch = [
        "geo_countries",
        "geo_regions",
        "geo_cities",
        "geo_aliases",
        "geo_external_refs",
        "user_geo_marks",
        "flows",
        "flow_stops",
        "spots",
        "pins",
        "profiles",
        "spot_images",
        "spot_personal_images",
        "user_tags",
        "pin_tags",
        "feedback",
    ]
    present = [t for t in watch if table_exists(cur, t)]
    absent = [t for t in watch if t not in present]

    geo_keys = [
        "geo_countries",
        "geo_regions",
        "geo_cities",
        "geo_aliases",
        "geo_external_refs",
        "user_geo_marks",
    ]
    geo_counts = {k: count_table(cur, k) for k in geo_keys}

    core_counts: dict[str, Any] = {
        "spots_total": count_table(cur, "spots"),
        "pins": count_table(cur, "pins"),
        "profiles": count_table(cur, "profiles"),
        "spot_images": count_table(cur, "spot_images"),
        "spot_personal_images": count_table(cur, "spot_personal_images"),
        "user_tags": count_table(cur, "user_tags"),
        "pin_tags": count_table(cur, "pin_tags"),
        "feedback": count_table(cur, "feedback"),
    }
    if table_exists(cur, "spots"):
        cur.execute("SELECT count(*)::int FROM spots WHERE is_hidden = false")
        core_counts["spots_visible"] = int(cur.fetchone()[0])
        cur.execute("SELECT count(*)::int FROM spots WHERE is_hidden = true")
        core_counts["spots_hidden"] = int(cur.fetchone()[0])

    pins_to_visit = pins_visited = None
    if table_exists(cur, "pins"):
        cur.execute(
            "SELECT count(*)::int FROM pins WHERE saved = true AND visited = false"
        )
        pins_to_visit = int(cur.fetchone()[0])
        cur.execute("SELECT count(*)::int FROM pins WHERE visited = true")
        pins_visited = int(cur.fetchone()[0])

    cur.execute(
        "SELECT schemaname, tablename FROM pg_tables WHERE tablename = 'schema_migrations' ORDER BY 1"
    )
    schema_migrations = [{"schema": r[0], "table": r[1]} for r in cur.fetchall()]

    cur.execute(
        """
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'pins'
        ORDER BY policyname
        """
    )
    pins_policies = [r[0] for r in cur.fetchall()]

    spots_invalid_bbox = spots_with_bbox = spots_geo_like_visible = None
    has_bbox_backup = table_exists(cur, "spots_mapbox_bbox_cleanup_034_backup")
    if table_exists(cur, "spots"):
        cur.execute("SELECT count(*)::int FROM spots WHERE mapbox_bbox IS NOT NULL")
        spots_with_bbox = int(cur.fetchone()[0])
        cur.execute(
            """
            SELECT count(*)::int FROM spots
            WHERE mapbox_bbox IS NOT NULL
              AND (
                latitude IS NULL OR longitude IS NULL
                OR NOT (
                  (mapbox_bbox->>'west')::float <= longitude
                  AND longitude <= (mapbox_bbox->>'east')::float
                  AND (mapbox_bbox->>'south')::float <= latitude
                  AND latitude <= (mapbox_bbox->>'north')::float
                )
              )
            """
        )
        spots_invalid_bbox = int(cur.fetchone()[0])
        cur.execute(
            """
            SELECT count(*)::int FROM spots
            WHERE is_hidden = false
              AND (
                linked_place_kind IN ('country','region','place','locality','neighborhood')
                OR mapbox_feature_type IN ('country','region','place','locality','neighborhood')
              )
            """
        )
        spots_geo_like_visible = int(cur.fetchone()[0])

    geo_rls = {t: rls_enabled(cur, t) for t in geo_keys}

    flows = {
        "flows": count_table(cur, "flows"),
        "flow_stops": count_table(cur, "flow_stops"),
    }

    cur.close()
    conn.close()

    return {
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "environment": "flowya-app Supabase remote (legacy/reference)",
        "connection": {"host": host, "method": "psycopg2 via SUPABASE_DB_URL"},
        "tables_present": present,
        "tables_absent": absent,
        "geo_counts": geo_counts,
        "core_counts": core_counts,
        "pins_to_visit": pins_to_visit,
        "pins_visited": pins_visited,
        "flows": flows,
        "schema_migrations_visibility": schema_migrations,
        "security": {
            "rls": geo_rls,
            "pins_policies": pins_policies,
            "pins_select_public_removed": "pins_select_public" not in pins_policies,
        },
        "data_quality": {
            "spots_with_bbox": spots_with_bbox,
            "spots_invalid_bbox": spots_invalid_bbox,
            "spots_geo_like_visible": spots_geo_like_visible,
            "has_bbox_backup_table_034": has_bbox_backup,
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", help="Write JSON to this path instead of stdout")
    args = parser.parse_args()

    payload = run_check()
    text = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"
    if args.out:
        with open(args.out, "w", encoding="utf-8") as fh:
            fh.write(text)
        print(f"Wrote {args.out}", file=sys.stderr)
    else:
        sys.stdout.write(text)


if __name__ == "__main__":
    main()
