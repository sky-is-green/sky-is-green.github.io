#!/bin/sh
# One firefox run of the site, measured by a _probe.html in the site root.
#
#   planning/tools/probe.sh <W,H> <out.png> <query> [root]
#
#     planning/tools/probe.sh 1300,1000 /tmp/opencode/shot.png "quick=1&shot=1&sec=open"
#
# It does the boilerplate the tools README describes, in the order that works:
# free the three ports, drop Firefox's cache (nocache_server sends no-store, but
# a warm profile will still answer from disk and every measurement is then
# fiction), start beacon/slow/nocache, run headless Firefox against the probe,
# then print the beacon log with its `||` separators broken onto their own lines
# so a long report is readable.
#
# It does NOT write or delete _probe.html: the probe is yours to write for the
# question at hand, and never committed. Remember the hold-open image: the
# screenshot fires at load, so `load` has to outlast everything the probe does.
set -e

W="$1"; OUT="$2"; Q="$3"
ROOT="${4:-/run/media/penis/cbfa1404-241a-484e-9136-de07ee2fa8ad/work/sky-is-green.github.io}"
TMP=/tmp/opencode

cd "$TMP"
rm -rf "$TMP/ffprof/cache2"
fuser -k 8770/tcp 8771/tcp 8766/tcp 2>/dev/null || true
sleep 0.3
rm -f "$TMP/beacon.log"

python3 "$ROOT/planning/tools/beacon.py" >/dev/null 2>&1 &
python3 "$ROOT/planning/tools/nocache_server.py" "$ROOT" 8766 >/dev/null 2>&1 &
python3 "$ROOT/planning/tools/slow.py" >/dev/null 2>&1 &
sleep 0.8

timeout 200 firefox --headless --no-remote --profile "$TMP/ffprof" \
  --window-size="$W" --screenshot "$OUT" \
  "http://127.0.0.1:8766/_probe.html?$Q" >/dev/null 2>&1 || true
sleep 0.4

python3 - "$TMP/beacon.log" <<'PY'
import sys
try:
    lines = open(sys.argv[1]).read().splitlines()
except FileNotFoundError:
    sys.exit('no beacon log — the probe never reported: see the traps in this '
             'folder’s README (load is the deadline; a thrown step aborts the rest)')
for line in lines:
    for part in line.split('  ||  '):
        print(part.rstrip())
    print('---')
PY

fuser -k 8770/tcp 8771/tcp 8766/tcp 2>/dev/null || true
