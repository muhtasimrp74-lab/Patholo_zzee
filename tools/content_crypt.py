#!/usr/bin/env python3
"""Encrypted overlay for private (paid) content edited after Stage 1.

The private sources are restored from the pre-Stage-1 commit (tools/restore_private.sh). Answers edited since then live here,
encrypted, so the public repository never holds readable paid text and the leak checks stay green:

  content/private.enc = b'ZZC1' + 12-byte nonce + AES-256-GCM(tar.gz of the files in tools/private_overlay.txt)

The key is 32 random bytes, base64, in the environment variable CONTENT_KEY (GitHub Actions secret CONTENT_KEY) or the file
/tmp/.content_key locally. Without the key, or without the file, `unpack` does nothing, so forks and old checkouts still build.

  python3 tools/content_crypt.py pack     # after editing answers: re-encrypt the overlay files
  python3 tools/content_crypt.py unpack   # restore: write the overlay files over the restored sources
"""
import base64, io, os, sys, tarfile
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENC = os.path.join(ROOT, 'content', 'private.enc')
LIST = os.path.join(ROOT, 'tools', 'private_overlay.txt')
MAGIC = b'ZZC1'


def key():
    k = os.environ.get('CONTENT_KEY', '').strip()
    if not k and os.path.exists('/tmp/.content_key'):
        k = open('/tmp/.content_key').read().strip()
    return base64.b64decode(k) if k else None


def files():
    return [l.strip() for l in open(LIST) if l.strip() and not l.startswith('#')]


def pack():
    k = key()
    if not k: sys.exit('content_crypt: no CONTENT_KEY')
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode='w:gz', format=tarfile.PAX_FORMAT) as t:
        for f in files():
            info = t.gettarinfo(os.path.join(ROOT, f), arcname=f); info.mtime = 0; info.uid = info.gid = 0; info.uname = info.gname = ''
            with open(os.path.join(ROOT, f), 'rb') as fh: t.addfile(info, fh)
    n = os.urandom(12)
    open(ENC, 'wb').write(MAGIC + n + AESGCM(k).encrypt(n, buf.getvalue(), MAGIC))
    print('content_crypt: packed %d files into content/private.enc' % len(files()))


def unpack():
    k = key()
    if not k or not os.path.exists(ENC):
        print('content_crypt: no key or no overlay, keeping the restored sources'); return
    b = open(ENC, 'rb').read()
    if b[:4] != MAGIC: sys.exit('content_crypt: not an overlay file')
    data = AESGCM(k).decrypt(b[4:16], b[16:], MAGIC)
    allowed = set(files())
    with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as t:
        for m in t.getmembers():
            if m.name not in allowed or not m.isfile(): sys.exit('content_crypt: unexpected entry ' + m.name)
            with open(os.path.join(ROOT, m.name), 'wb') as fh: fh.write(t.extractfile(m).read())
    print('content_crypt: unpacked %d files' % len(allowed))


if __name__ == '__main__':
    {'pack': pack, 'unpack': unpack}[sys.argv[1] if len(sys.argv) > 1 else 'unpack']()
