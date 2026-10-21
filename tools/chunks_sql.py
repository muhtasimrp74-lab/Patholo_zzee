"""Write the SQL that loads every chunk into D1 table chunk_parts (parts under D1's statement limit), after checking hashes."""
import json, hashlib, os, sys
man, src, out = sys.argv[1], sys.argv[2], sys.argv[3]
PART = 45000  # characters; quotes are doubled, so a statement stays well under 100 KB
with open(out, 'w', encoding='utf8') as f:
    f.write('DELETE FROM chunk_parts;\n')
    for cid, meta in sorted(json.load(open(man))['chunks'].items()):
        b = open(os.path.join(src, cid + '.json'), 'rb').read()
        assert hashlib.sha256(b).hexdigest() == meta['sha256'], cid
        t = b.decode('utf8')
        for n in range(0, len(t), PART):
            f.write("INSERT INTO chunk_parts (id, part, body) VALUES ('%s', %d, '%s');\n" % (cid, n // PART, t[n:n + PART].replace("'", "''")))
