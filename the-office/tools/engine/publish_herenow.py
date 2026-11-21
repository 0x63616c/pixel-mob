"""Anonymous here.now publish of a folder. usage: publish_herenow.py DIR OUT.json"""
import json, os, sys, mimetypes, urllib.request
d, out = sys.argv[1], sys.argv[2]
mimetypes.add_type('application/wasm', '.wasm'); mimetypes.add_type('text/javascript', '.js')
files = []
for root, _, fs in os.walk(d):
    for f in fs:
        if f == '_headers': continue
        p = os.path.join(root, f); rel = os.path.relpath(p, d)
        files.append({'path': rel, 'size': os.path.getsize(p), 'contentType': mimetypes.guess_type(f)[0] or 'application/octet-stream'})
def call(url, body, method='POST'):
    r = urllib.request.Request(url, data=json.dumps(body).encode(), method=method, headers={'Content-Type': 'application/json'})
    return json.load(urllib.request.urlopen(r))
res = call('https://here.now/api/v1/publish', {'files': files})
json.dump(res, open(out, 'w'))
for u in res['upload']['uploads']:
    data = open(os.path.join(d, u['path']), 'rb').read()
    r = urllib.request.Request(u['url'], data=data, method=u.get('method', 'PUT'), headers=u.get('headers') or {})
    urllib.request.urlopen(r).read()
fin = call(res['upload']['finalizeUrl'], {'versionId': res['upload']['versionId']})
print(json.dumps({'siteUrl': res['siteUrl'], 'claimUrl': res.get('claimUrl'), 'files': len(files), 'final': {k: fin.get(k) for k in ('status', 'isLive', 'warnings')}}))
