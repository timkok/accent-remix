// @vitest-environment node
import {it, expect} from 'vitest';
import {execFileSync} from 'node:child_process';

it('recovers transient audio transfers, bounds retries and fails permanent HTTP errors', () => {
  const output = execFileSync('python3', ['-c', `
import sys, urllib.error, http.client
from unittest.mock import patch, MagicMock
sys.path.insert(0, 'scripts')
from audio_download import download
response = MagicMock()
response.__enter__.return_value.read.return_value = b'original audio bytes'
with patch('audio_download.urllib.request.urlopen', side_effect=[urllib.error.URLError(ConnectionResetError()), response]) as open_url, patch('audio_download.time.sleep') as sleep:
    assert download('https://example.com/pinned.mp3') == b'original audio bytes'
    assert open_url.call_count == 2
    sleep.assert_called_once_with(1)
with patch('audio_download.urllib.request.urlopen', side_effect=TimeoutError()) as open_url, patch('audio_download.time.sleep') as sleep:
    try: download('https://example.com/pinned.mp3')
    except TimeoutError: pass
    else: raise AssertionError('exhausted retries must fail')
    assert open_url.call_count == 5
    assert [call.args[0] for call in sleep.call_args_list] == [1, 2, 4, 8]
for code, attempts in [(404, 1), (403, 1), (429, 5), (503, 5)]:
    error = urllib.error.HTTPError('https://example.com/pinned.mp3', code, 'test', {}, None)
    with patch('audio_download.urllib.request.urlopen', side_effect=error) as open_url, patch('audio_download.time.sleep'):
        try: download(error.url)
        except urllib.error.HTTPError as caught: assert caught.code == code
        else: raise AssertionError('failed download must fail')
        assert open_url.call_count == attempts
print('download behavior verified')
`], {encoding: 'utf8'});
  expect(output).toContain('download behavior verified');
});
