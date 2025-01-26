const { deleteConfig } = require("./database/models/config");
const db = require('./database/db');

// deleteConfig('muteRoleID');

// db.prepare('DROP TABLE IF EXISTS mutes').run();

const regex = /^ticket-\d{17,19}(-closed)?$/;

console.log(regex.test('ticket-12345678901234563-closed'));