import http.server, socketserver, sys, os, functools
port=int(sys.argv[1]) if len(sys.argv)>1 else 8765
d=sys.argv[2] if len(sys.argv)>2 else '/workspace/pixel-office/dist'
class H(http.server.SimpleHTTPRequestHandler):
    extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.wasm':'application/wasm','.js':'text/javascript','.json':'application/json'}
    def log_message(self,*a): pass
    def end_headers(self):
        self.send_header('Cache-Control','no-store'); super().end_headers()
socketserver.TCPServer.allow_reuse_address=True
with socketserver.ThreadingTCPServer(('0.0.0.0',port),functools.partial(H,directory=d)) as s: s.serve_forever()
