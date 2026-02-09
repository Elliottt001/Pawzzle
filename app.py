import glob
import os
import shutil
import subprocess
import sys
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

HOST = "0.0.0.0"
PORT = 7860
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PG_DATA = os.path.expanduser("~/pgdata")
PG_LOG = os.path.expanduser("~/pglog/postgresql.log")


# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------

def find_pg_bin():
    """Return the newest PostgreSQL bin directory, or None."""
    candidates = sorted(glob.glob("/usr/lib/postgresql/*/bin"), reverse=True)
    return candidates[0] if candidates else None


def find_jar():
    """Return the path to the Spring Boot fat JAR, or None."""
    jars = glob.glob(os.path.join(BASE_DIR, "backend", "target", "*.jar"))
    for jar in jars:
        if not jar.endswith(("-original.jar", "-sources.jar")):
            return jar
    return None


def start_fallback_server(reason):
    """Serve a plain-text error page so the user sees *something*."""
    message = f"Pawzzle backend failed to start.\nReason: {reason}\n"

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write(message.encode("utf-8"))

        def log_message(self, fmt, *args):
            return

    print(f"[FALLBACK] {reason}", file=sys.stderr, flush=True)
    HTTPServer((HOST, PORT), Handler).serve_forever()


# ---------------------------------------------------------------------------
# PostgreSQL bootstrap
# ---------------------------------------------------------------------------

def start_postgresql():
    """Start the PostgreSQL server and create the pawzzle database."""
    pg_bin = find_pg_bin()
    if not pg_bin:
        return False, "PostgreSQL binaries not found"

    pg_ctl = os.path.join(pg_bin, "pg_ctl")
    createdb = os.path.join(pg_bin, "createdb")
    psql = os.path.join(pg_bin, "psql")

    # Make sure log directory exists
    os.makedirs(os.path.dirname(PG_LOG), exist_ok=True)

    # If data directory is empty, run initdb (fallback for first run)
    if not os.path.exists(os.path.join(PG_DATA, "PG_VERSION")):
        initdb = os.path.join(pg_bin, "initdb")
        r = subprocess.run(
            [initdb, "-D", PG_DATA, "--auth=trust"],
            capture_output=True, text=True,
        )
        if r.returncode != 0:
            return False, f"initdb failed: {r.stderr}"

    # Start PostgreSQL
    r = subprocess.run(
        [pg_ctl, "-D", PG_DATA, "-l", PG_LOG, "-o", "-p 5432", "start"],
        capture_output=True, text=True,
    )
    if r.returncode != 0:
        return False, f"pg_ctl start failed: {r.stderr}"

    # Wait until the server is ready (max 30 s)
    for i in range(30):
        chk = subprocess.run(
            [pg_ctl, "-D", PG_DATA, "status"],
            capture_output=True, text=True,
        )
        if chk.returncode == 0:
            break
        time.sleep(1)
    else:
        return False, "PostgreSQL did not become ready within 30 s"

    # Create database (ignore "already exists" errors)
    subprocess.run(
        [createdb, "-h", "/var/run/postgresql", "-p", "5432", "pawzzle"],
        capture_output=True, text=True,
    )

    # Enable pgvector extension
    subprocess.run(
        [psql, "-h", "/var/run/postgresql", "-p", "5432", "-d", "pawzzle",
         "-c", "CREATE EXTENSION IF NOT EXISTS vector;"],
        capture_output=True, text=True,
    )

    return True, "PostgreSQL started and pawzzle database ready"


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    # 1. Check Java
    if shutil.which("java") is None:
        start_fallback_server("Java runtime not found")
        return

    # 2. Start PostgreSQL
    ok, msg = start_postgresql()
    if not ok:
        start_fallback_server(f"Database error: {msg}")
        return
    print(f"[INFO] {msg}", flush=True)

    # 3. Export DB env vars so Spring Boot can connect
    os.environ.setdefault("DB_HOST", "127.0.0.1")
    os.environ.setdefault("DB_PORT", "5432")
    os.environ.setdefault("DB_USER", os.environ.get("USER", "user"))
    os.environ.setdefault("DB_PASSWORD", "")

    # 4. Start Java backend
    jar = find_jar()
    if jar:
        print(f"[INFO] Starting from JAR: {jar}", flush=True)
        try:
            subprocess.run(["java", "-jar", jar], cwd=BASE_DIR, check=True)
        except Exception as exc:
            start_fallback_server(f"java -jar failed: {exc}")
    else:
        mvnw = os.path.join(BASE_DIR, "backend", "mvnw")
        if not os.path.exists(mvnw):
            start_fallback_server("No JAR and backend/mvnw not found")
            return
        if not os.access(mvnw, os.X_OK):
            os.chmod(mvnw, 0o755)
        print("[INFO] Starting with mvnw spring-boot:run ...", flush=True)
        try:
            subprocess.run(
                [mvnw, "spring-boot:run"],
                cwd=os.path.join(BASE_DIR, "backend"),
                check=True,
            )
        except Exception as exc:
            start_fallback_server(f"mvnw spring-boot:run failed: {exc}")


if __name__ == "__main__":
    main()
