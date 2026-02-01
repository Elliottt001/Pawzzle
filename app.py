import os
import shutil
import subprocess
from http.server import BaseHTTPRequestHandler, HTTPServer

HOST = "0.0.0.0"
PORT = 7860


def start_fallback_server(reason: str) -> None:
    message = (
        "Pawzzle backend is a Spring Boot service.\n"
        "The Python entrypoint could not start the Java backend.\n"
        f"Reason: {reason}\n"
    )

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write(message.encode("utf-8"))

        def log_message(self, format, *args):
            return

    HTTPServer((HOST, PORT), Handler).serve_forever()


def main() -> None:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    mvnw_path = os.path.join(base_dir, "backend", "mvnw")
    backend_dir = os.path.join(base_dir, "backend")

    if not os.path.exists(mvnw_path):
        start_fallback_server("backend/mvnw not found")
        return

    if shutil.which("java") is None:
        start_fallback_server("Java runtime not found")
        return

    try:
        if not os.access(mvnw_path, os.X_OK):
            os.chmod(mvnw_path, 0o755)
        subprocess.run([mvnw_path, "spring-boot:run"], cwd=backend_dir, check=True)
    except Exception as exc:
        start_fallback_server(f"Failed to start backend: {exc}")


if __name__ == "__main__":
    main()
