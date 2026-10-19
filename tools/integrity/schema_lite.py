"""Validate JSON against a JSON Schema. Uses the `jsonschema` package when importable; otherwise a small stdlib
validator covering the keywords our schemas use (type, const, enum, required, properties, additionalProperties,
items, minItems, maxItems, minLength, minimum, pattern). Unsupported keywords raise, so a schema can't be silently ignored."""
import re
try:
    import jsonschema as _js
except Exception:
    _js = None
BACKEND = 'jsonschema' if _js else 'schema_lite (stdlib subset)'
_IGNORED = {'$schema', 'title', 'description'}
_SUPPORTED = {'type', 'const', 'enum', 'required', 'properties', 'additionalProperties', 'items', 'minItems', 'maxItems', 'minLength', 'minimum', 'pattern'} | _IGNORED
_T = {'object': dict, 'array': list, 'string': str, 'boolean': bool, 'null': type(None)}

def _ok_type(v, t):
    if t == 'integer': return isinstance(v, int) and not isinstance(v, bool)
    if t == 'number': return isinstance(v, (int, float)) and not isinstance(v, bool)
    return isinstance(v, _T[t])

def _check(v, s, path, errs):
    for k in s:
        if k not in _SUPPORTED: raise ValueError('unsupported schema keyword %r at %s' % (k, path))
    if 'type' in s and not _ok_type(v, s['type']): errs.append('%s: expected %s' % (path, s['type'])); return
    if 'const' in s and v != s['const']: errs.append('%s: expected %r' % (path, s['const']))
    if 'enum' in s and v not in s['enum']: errs.append('%s: not in enum' % path)
    if isinstance(v, str):
        if len(v) < s.get('minLength', 0): errs.append('%s: too short' % path)
        if 'pattern' in s and not re.search(s['pattern'], v): errs.append('%s: does not match %s' % (path, s['pattern']))
    if isinstance(v, (int, float)) and not isinstance(v, bool) and 'minimum' in s and v < s['minimum']: errs.append('%s: below minimum' % path)
    if isinstance(v, list):
        if len(v) < s.get('minItems', 0): errs.append('%s: too few items' % path)
        if len(v) > s.get('maxItems', 1 << 60): errs.append('%s: too many items' % path)
        if 'items' in s:
            for i, x in enumerate(v): _check(x, s['items'], '%s[%d]' % (path, i), errs)
    if isinstance(v, dict):
        for r in s.get('required', []):
            if r not in v: errs.append('%s: missing %r' % (path, r))
        props = s.get('properties', {}); ap = s.get('additionalProperties', True)
        for k, x in v.items():
            if k in props: _check(x, props[k], '%s.%s' % (path, k), errs)
            elif ap is False: errs.append('%s: unexpected key %r' % (path, k))
            elif isinstance(ap, dict): _check(x, ap, '%s.%s' % (path, k), errs)

def validate(value, schema):
    """Return a list of error strings (empty = valid)."""
    if _js:
        return ['%s: %s' % ('/'.join(map(str, e.path)) or '$', e.message[:120]) for e in _js.Draft202012Validator(schema).iter_errors(value)]
    errs = []; _check(value, schema, '$', errs); return errs
