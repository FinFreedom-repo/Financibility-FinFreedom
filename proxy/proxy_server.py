#!/usr/bin/env python3
"""
Simple proxy server to forward requests from mobile app to Django backend
"""
import http.server
import socketserver
import urllib.request
import urllib.parse
import json
import sys

class ProxyHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.proxy_request('GET')
    
    def do_POST(self):
        self.proxy_request('POST')
    
    def do_PUT(self):
        self.proxy_request('PUT')
    
    def do_DELETE(self):
        self.proxy_request('DELETE')
    
    def proxy_request(self, method):
        try:
            # Forward to Django backend
            django_url = f"http://127.0.0.1:8000{self.path}"
            
            # Prepare request
            if method in ['POST', 'PUT']:
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
            else:
                post_data = None
            
            # Create request
            req = urllib.request.Request(django_url, data=post_data, method=method)
            
            # Copy headers (exclude problematic ones)
            for header, value in self.headers.items():
                if header.lower() not in ['host', 'content-length', 'connection', 'upgrade']:
                    req.add_header(header, value)
            
            # Set proper content type for JSON
            if post_data and 'application/json' in self.headers.get('Content-Type', ''):
                req.add_header('Content-Type', 'application/json')
            
            # Make request
            with urllib.request.urlopen(req) as response:
                # Send response
                self.send_response(response.status)
                
                # Copy response headers
                for header, value in response.headers.items():
                    if header.lower() not in ['content-length', 'transfer-encoding']:
                        self.send_header(header, value)
                
                self.end_headers()
                
                # Copy response body
                self.wfile.write(response.read())
                
        except Exception as e:
            print(f"Proxy error: {e}")
            self.send_error(500, f"Proxy error: {str(e)}")

if __name__ == "__main__":
    PORT = 8001
    
    with socketserver.TCPServer(("0.0.0.0", PORT), ProxyHandler) as httpd:
        print(f"Proxy server running on port {PORT}")
        print(f"Forwarding requests to http://127.0.0.1:8000")
        print(f"Mobile app should use: http://192.168.18.224:{PORT}")
        httpd.serve_forever()
