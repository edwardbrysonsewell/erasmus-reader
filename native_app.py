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
DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist-local')


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


def start_server(port):
    """Start a simple HTTP server for the dist-local folder."""
    os.chdir(DIST)
    handler = http.server.SimpleHTTPRequestHandler
    httpd = http.server.HTTPServer(('127.0.0.1', port), handler)
    httpd.serve_forever()


def main():
    if not os.path.isdir(DIST):
        print(f'Error: dist-local folder not found at {DIST}')
        print('Run: cd ~/erasmus-reader && npm run build:local')
        sys.exit(1)

    port = find_free_port()

    # Start HTTP server in background thread
    server_thread = threading.Thread(target=start_server, args=(port,), daemon=True)
    server_thread.start()

    # Open native window
    webview.create_window(
        'Colloquia Erasmi',
        f'http://127.0.0.1:{port}/',
        width=1000,
        height=800,
        min_size=(600, 400),
    )
    webview.start()


if __name__ == '__main__':
    main()
