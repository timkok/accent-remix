"""Bounded retries for build-time audio transfers; TLS and checksums stay required."""
import http.client
import time
import urllib.error
import urllib.request


def download(request, timeout=60):
    for attempt in range(5):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            if error.code not in (408, 429, 500, 502, 503, 504):
                raise
            if attempt == 4:
                raise
        except (urllib.error.URLError, ConnectionError, TimeoutError,
                http.client.IncompleteRead):
            if attempt == 4:
                raise
        time.sleep(2 ** attempt)
