"""
Records incoming HTTP requests to a JSON log file.

This Flask route handler listens for all HTTP methods (GET, POST, PUT, DELETE, PATCH) on the root path and any subpaths. It saves the details of each incoming request, including the HTTP method, URL, headers, and request body, to a JSON log file located at 'saved_requests/requests.json'.

The logged request data can be used for debugging, testing, or other purposes that require a record of the requests made to the application.
"""
from flask import Flask, request
import json

app = Flask(__name__)
LOG_FILE = 'saved_requests/requests.json'

@app.route('/', defaults={'path': ''}, methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
@app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
def record_request(path):
    # Save request details
    request_data = {
        "method": request.method,
        "url": f"/{path}",  # Path without the host
        "headers": dict(request.headers),
        "body": request.get_data(as_text=True)
    }
    # Append to log file
    with open(LOG_FILE, 'a') as log_file:
        log_file.write(json.dumps(request_data) + '\n')
    return "Request recorded!", 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
