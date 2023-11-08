DROP TABLE IF EXISTS peers;

CREATE TABLE
    peers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        public_key TEXT NOT NULL UNIQUE,
        preshared_key TEXT,
        endpoint_host TEXT NOT NULL,
        endpoint_port INTEGER NOT NULL,
        persistent_keepalive INTEGER,
        allowed_ips TEXT,
        friendly_name TEXT,
        friendly_json TEXT,
        last_handshake FLOAT rx_bytes INTEGER,
        tx_bytes INTEGER
    );