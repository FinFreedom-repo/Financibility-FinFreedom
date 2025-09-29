#!/usr/bin/env python3
"""
Simple HTTP proxy server to forward requests from external IP to localhost Django server.
This solves the issue where Django development server only binds to localhost.
"""

import http.server
import socketserver
import urllib.request
import urllib.parse
import json
from urllib.error import URLError

class ProxyHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.proxy_request()
    
    def do_POST(self):
        self.proxy_request()
    
    def do_PUT(self):
        self.proxy_request()
    
    def do_DELETE(self):
        self.proxy_request()
    
    def do_OPTIONS(self):
        self.proxy_request()
    
    def proxy_request(self):
        try:
            # Forward request to localhost Django server
            target_url = f"http://127.0.0.1:8000{self.path}"
            
            # Prepare headers
            headers = dict(self.headers)
            headers['Host'] = '127.0.0.1:8000'
            
            # Get request body for POST/PUT requests
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length) if content_length > 0 else None
            
            # Create request
            req = urllib.request.Request(target_url, data=post_data, headers=headers, method=self.command)
            
            # Make request to Django server
            with urllib.request.urlopen(req) as response:
                # Send response headers
                self.send_response(response.status)
                for header, value in response.headers.items():
                    if header.lower() not in ['connection', 'transfer-encoding']:
                        self.send_header(header, value)
                
                # Add CORS headers
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
                self.send_header('Access-Control-Allow-Credentials', 'true')
                
                self.end_headers()
                
                # Send response body
                self.wfile.write(response.read())
                
        except URLError as e:
            print(f"Proxy error: {e}")
            self.send_error(502, f"Bad Gateway: {e}")
        except Exception as e:
            print(f"Unexpected error: {e}")
            self.send_error(500, f"Internal Server Error: {e}")
    
    def log_message(self, format, *args):
        print(f"[PROXY] {format % args}")

def start_proxy_server(port=8001):
    """Start the proxy server on the specified port"""
    with socketserver.TCPServer(("0.0.0.0", port), ProxyHandler) as httpd:
        print(f"🚀 Proxy server started on 0.0.0.0:{port}")
        print(f"📡 Forwarding requests to http://127.0.0.1:8000")
        print("Press Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Proxy server stopped")

if __name__ == "__main__":
    start_proxy_server()
