#!/usr/bin/env python3
"""Static file server with caching turned off.

usage: nocache_server.py <root> <port>

Why not `python3 -m http.server`: it sends Last-Modified but no Cache-Control,
so browsers apply heuristic freshness and silently serve a stale app.js on a
plain reload — which makes a whole round of measurements meaningless.
"""
import http.server
import os
import sys


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, *args):
        pass


def main():
    root = sys.argv[1]
    port = int(sys.argv[2])
    os.chdir(root)
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    http.server.ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()


if __name__ == '__main__':
    main()
