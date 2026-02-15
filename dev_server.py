#!/usr/bin/env python3

import http.server
import socketserver
from urllib.parse import urlsplit


class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Serve the portfolio entry at `/` to avoid directory listing.
        parsed = urlsplit(self.path)
        if parsed.path == "/":
            self.path = "/html/index.html"
        elif parsed.path == "/html":
            # Normalize to directory URL.
            self.send_response(301)
            self.send_header("Location", "/html/")
            self.end_headers()
            return

        super().do_GET()

    def end_headers(self):
        # Strongly discourage caching during local dev.
        self.send_header(
            "Cache-Control",
            "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        )
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Portfolio dev server (no-cache)")
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()

    with socketserver.ThreadingTCPServer(("", args.port), NoCacheHTTPRequestHandler) as httpd:
        httpd.allow_reuse_address = True
        print(f"Serving (no-cache) on http://127.0.0.1:{args.port}/")
        print("Root `/` serves `/html/index.html`")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
