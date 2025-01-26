const { createConfigTable } = require("../models/config");
const { createMutesTable } = require("../models/mutes");

const dbSetup = () => {
    createConfigTable();
    createMutesTable();
}

module.exports = {
    dbSetup
}