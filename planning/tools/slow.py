#!/usr/bin/env python3
"""A 1x1 gif that takes 5s (or ?d=<seconds>) to answer, on port 8770.

Firefox's `--screenshot` captures the page when its load event fires, which is
before any post-load JSON fetch has resolved — so anything built from fetched
data (the project drum) is missing from the capture. Referencing this image from
a probe page holds the load event open long enough for the page to finish and
for the probe's own delayed report to land in the DOM.
"""
import http.server
import socketserver
import time
import urllib.parse

GIF = bytes.fromhex(
    '47494638396101000100800000ffffff00000021f90401000000002c00000000010001000002024401003b'
)


class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        q = urllib.parse.urlparse(self.path).query
        delay = 5
        for part in q.split('&'):
            if part.startswith('d='):
                try:
                    delay = float(part[2:])
                except ValueError:
                    pass
        time.sleep(delay)
        self.send_response(200)
        self.send_header('Content-Type', 'image/gif')
        self.send_header('Content-Length', str(len(GIF)))
        self.end_headers()
        self.wfile.write(GIF)

    def log_message(self, *args):
        pass


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


if __name__ == '__main__':
    Server(('127.0.0.1', 8770), Handler).serve_forever()
