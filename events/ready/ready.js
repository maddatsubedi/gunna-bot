const { Events } = require('discord.js');
const { setIsPolling, unsetIsPolling } = require('../../database/models/config');
const { setupBotInit } = require('../../utils/setupBotInit');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		setupBotInit(client);
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};