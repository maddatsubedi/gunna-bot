const db = require('../db');

const createMutesTable = () => {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS mutes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL UNIQUE,
            duration TEXT NOT NULL,
            reason TEXT,
            end_at TEXT NOT NULL
        )
    `).run();
};

const muteUser = (user_id, duration, reason = null) => {

    const now = new Date();

    const durationMatch = duration.match(/(?:(\d+)h)?(?::)?(?:(\d+)m)?/);

    if (!durationMatch) {
        return {
            error: 'Invalid duration format',
        }
    }

    const hours = parseInt(durationMatch[1] || 0, 10);
    const minutes = parseInt(durationMatch[2] || 0, 10);

    if (hours) now.setHours(now.getHours() + hours);
    if (minutes) now.setMinutes(now.getMinutes() + minutes);
    const end_at = now.toUTCString();

    db.prepare(`
        INSERT INTO mutes (user_id, duration, reason, end_at)
        VALUES (?, ?, ?, ?)
    `).run(user_id, duration, reason, end_at);

    // console.log(`User ${user_id} has been muted for duration: ${duration}.`);
};


const getAllMutes = () => {
    return db.prepare('SELECT * FROM mutes').all();
};

const getActiveMutes = () => {
    const now = new Date().toUTCString();
    return db.prepare('SELECT * FROM mutes WHERE end_at > ?').all(now);
};

const unmuteEndedMutes = () => {

    const currentTime = new Date();
    const mutes = getAllMutes();

    const endedMutes = mutes.filter(mute => new Date(mute.end_at) < currentTime);
    const deletedMutes = [];

    endedMutes.forEach(mute => {
        removeMuteByUserId(mute.user_id);
        deletedMutes.push(mute);
    });

    return {
        endedMutes,
        deletedMutes
    };
};

const removeMuteByUserId = (user_id) => {
    const result = db.prepare('DELETE FROM mutes WHERE user_id = ?').run(user_id);
    return result.changes > 0;
};

const isUserMuted = (user_id) => {
    const mute = db.prepare('SELECT * FROM mutes WHERE user_id = ?').get(user_id);
    return mute || null;
};

const isUserMutedStrict = (user_id) => {
    const now = new Date().toUTCString();
    const mute = db.prepare('SELECT * FROM mutes WHERE user_id = ? AND end_at > ?').get(user_id, now);
    return mute || null;
};


module.exports = {
    muteUser,
    getAllMutes,
    getActiveMutes,
    unmuteEndedMutes,
    removeMuteByUserId,
    isUserMuted,
    createMutesTable,
    isUserMutedStrict
};
