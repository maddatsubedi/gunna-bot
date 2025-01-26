const db = require('../db');

const createConfigTable = () => {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    `).run();
};

const setConfig = (key, value) => {
    db.prepare(`
        INSERT INTO config (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, value);
};

const setIfNotExists = (key, value) => {
    const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key);
    if (!row) {
        setConfig(key, value);
    }
}

const getConfig = (key) => {
    const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key);
    return row ? row.value : null;
};

const getAllConfigs = () => {
    return db.prepare('SELECT * FROM config').all();
};

const deleteConfig = (key) => {
    const result = db.prepare('DELETE FROM config WHERE key = ?').run(key);
    return result.changes > 0;
};

const resetConfig = () => {
    db.prepare('DELETE FROM config').run();
};


module.exports = {
    setConfig,
    getConfig,
    getAllConfigs,
    deleteConfig,
    resetConfig,
    createConfigTable,
    setIfNotExists
};