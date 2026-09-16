-- Dedupe alert log: same kind + window + AOI + result may only be logged once
ALTER TABLE environmental_alerts ADD COLUMN fingerprint TEXT;
CREATE UNIQUE INDEX idx_alerts_fingerprint ON environmental_alerts (fingerprint);
