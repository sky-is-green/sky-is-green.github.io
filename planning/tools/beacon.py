#!/usr/bin/env python3
"""Log every request's query string to /tmp/opencode/beacon.log (port 8771).

A probe page can then report measurements back as text — as an <img> beacon,
which needs no CORS — instead of my having to read numbers out of screenshots.
"""
import datetime
import http.server
import socketserver
import urllib.parse

LOG = '/tmp/opencode/beacon.log'


class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        with open(LOG, 'a') as fh:
            fh.write(datetime.datetime.now().strftime('%H:%M:%S')
                     + ' ' + urllib.parse.unquote(self.path) + '\n')
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

    def log_message(self, *args):
        pass


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


if __name__ == '__main__':
    Server(('127.0.0.1', 8771), Handler).serve_forever()
