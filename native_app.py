"""
Colloquia Erasmi — native macOS app launcher.
Serves the built dist-local folder and opens it in a native webview window.
"""
import http.server
import threading
import os
import sys
import socket

import webview

PORT = 8470
DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist')


def find_free_port(start=8470, end=8490):
    """Find a free port in the given range."""
    for port in range(start, end):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.bind(('127.0.0.1', port))
            s.close()
            return port
        except OSError:
            continue
    return start


UNREGISTER_SW = b"""\
// Local mode: unregister any cached service worker so updates appear immediately.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(regs) {
    regs.forEach(function(r) { r.unregister(); });
  });
  caches.keys().then(function(names) {
    names.forEach(function(n) { caches.delete(n); });
  });
}
"""


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP handler that prevents caching so updates take effect immediately."""

    def do_GET(self):
        # Intercept service worker registration — return unregister script instead
        if self.path in ('/registerSW.js', '/sw.js'):
            self.send_response(200)
            self.send_header('Content-Type', 'application/javascript')
            self.send_header('Content-Length', len(UNREGISTER_SW))
            self.end_headers()
            self.wfile.write(UNREGISTER_SW)
            return
        super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        pass  # Suppress log output


def start_server(port):
    """Start a simple HTTP server for the dist-local folder."""
    os.chdir(DIST)
    httpd = http.server.HTTPServer(('127.0.0.1', port), NoCacheHandler)
    httpd.serve_forever()


def main():
    if not os.path.isdir(DIST):
        print(f'Error: dist folder not found at {DIST}')
        print('Run: cd ~/erasmus-reader && npm run build:local')
        sys.exit(1)

    port = find_free_port()

    # Start HTTP server in background thread
    server_thread = threading.Thread(target=start_server, args=(port,), daemon=True)
    server_thread.start()

    # Open native window
    window = webview.create_window(
        'Latin Reader',
        f'http://127.0.0.1:{port}/',
        width=1000,
        height=800,
        min_size=(600, 400),
    )

    def enable_zoom(w):
        """Enable trackpad pinch-to-zoom via the underlying WKWebView."""
        try:
            from webview.platforms.cocoa import BrowserView
            browser = BrowserView.instances[w.uid]
            browser.webkit.setAllowsMagnification_(True)
        except Exception:
            pass

    window.events.shown += enable_zoom
    webview.start()


if __name__ == '__main__':
    main()
