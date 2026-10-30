-- Private D1 storage. No IP addresses, cookies, User-Agent or permanent player IDs.
CREATE TABLE IF NOT EXISTS telemetry_events (
 event_id TEXT PRIMARY KEY,
 recorded_at INTEGER NOT NULL,
 session_id TEXT NOT NULL,
 event_type TEXT NOT NULL CHECK(event_type IN ('snapshot','finish')),
 build TEXT NOT NULL,
 difficulty INTEGER,
 elapsed_sec REAL,
 device_category TEXT,
 avg_fps REAL,
 min_fps REAL,
 frame_p95_ms REAL,
 score INTEGER,
 data_json TEXT NOT NULL,
 details_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_relict_recorded_at ON telemetry_events(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_relict_type ON telemetry_events(event_type);
CREATE INDEX IF NOT EXISTS idx_relict_session ON telemetry_events(session_id);
