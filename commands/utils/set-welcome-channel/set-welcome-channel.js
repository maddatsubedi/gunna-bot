const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const { getConfig, setConfig, deleteConfig, resetConfig } = require('../../../database/models/config');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-welcome-channel')
        .setDescription('Set welcome channel for the server')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to set as welcome')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)),
    isAdmin: true,
    async execute(interaction) {

        const channel = interaction.options.getChannel('channel');
        const channelID = channel.id;

        setConfig('welcomeChannelID', channelID);

        const embed = simpleEmbed(
            {
                footer: `${interaction.guild.name} | Config`,
                title: 'Welcome Channel Changed',
                color: 'Random',
            }
        ).addFields(
            { name: 'Welcome Channel', value: `> <#${channelID}>`, inline: true },
        );

        return await interaction.reply({ embeds: [embed] });

    },
};