const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getConfig, setConfig, getAllConfigs } = require('../../../database/models/config');
const db = require('../../../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    async execute(interaction) {
        await interaction.deferReply();

        // await interaction.channel.send('');
        return await interaction.editReply('Pong!');
    },
};