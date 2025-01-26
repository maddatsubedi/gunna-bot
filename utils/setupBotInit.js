const { dbSetup } = require("../database/utils/dbSetup");
const { runEndedMutesRemoval } = require("./discordUtils");
const { defaultPrefix } = require("../config.json");
const { setIfNotExists } = require("../database/models/config");

const setupBotInit = async (client) => {

    setIfNotExists('prefix', defaultPrefix);
    dbSetup();
    runEndedMutesRemoval(client);

};

module.exports = {
    setupBotInit
}