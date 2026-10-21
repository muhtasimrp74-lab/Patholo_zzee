-- Gated chunks stored in D1 (no KV/R2 permission needed), split into parts below D1's statement size limit.
CREATE TABLE chunk_parts (
  id TEXT NOT NULL,
  part INTEGER NOT NULL,
  body TEXT NOT NULL,
  PRIMARY KEY (id, part)
);
