#!/usr/bin/env python3
"""
Proxy server to forward mobile app requests to Django development server.
This is needed because Django's runserver only binds to localhost (127.0.0.1),
but mobile devices need to connect from external IP addresses.
"""

import http.server
import socketserver
import requests
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PORT = 8001
DJANGO_HOST = 'http://127.0.0.1:8000'

class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        self.proxy_request('GET')

    def do_POST(self):
        self.proxy_request('POST')

    def do_PUT(self):
        self.proxy_request('PUT')

    def do_DELETE(self):
        self.proxy_request('DELETE')

    def do_OPTIONS(self):
        # Handle CORS preflight requests
        self.send_response(200, "OK")
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.end_headers()

    def proxy_request(self, method):
        url = f"{DJANGO_HOST}{self.path}"
        headers = {k: v for k, v in self.headers.items()}
        
        # Handle Content-Length for POST/PUT requests
        data = None
        if method in ['POST', 'PUT']:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                data = self.rfile.read(content_length)
                headers['Content-Length'] = str(content_length)

        try:
            logger.info(f"Proxying {method} {self.path} to {url}")
            response = requests.request(method, url, headers=headers, data=data, verify=False)
            
            self.send_response(response.status_code)
            
            # Copy response headers (excluding problematic ones)
            for k, v in response.headers.items():
                if k.lower() not in ['content-encoding', 'transfer-encoding', 'content-length']:
                    self.send_header(k, v)
            
            # Add CORS headers
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
            self.send_header('Access-Control-Allow-Credentials', 'true')
            
            self.end_headers()
            self.wfile.write(response.content)
            logger.info(f"Successfully proxied {method} {self.path} - Status: {response.status_code}")

        except requests.exceptions.ConnectionError as e:
            logger.error(f"Proxy connection error: {e}")
            self.send_error(503, f"Proxy connection error: {e}")
        except Exception as e:
            logger.error(f"Proxy error: {e}")
            self.send_error(500, f"Proxy error: {e}")

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), ProxyHandler) as httpd:
        logger.info(f"🚀 Proxy server running on port {PORT}")
        logger.info(f"📡 Forwarding requests to Django at {DJANGO_HOST}")
        logger.info(f"📱 Mobile app should connect to: http://192.168.18.224:{PORT}")
        logger.info("Press Ctrl+C to stop the proxy server")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            logger.info("🛑 Proxy server stopped")
            httpd.shutdown()