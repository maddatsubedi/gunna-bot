const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const { getConfig, setConfig, deleteConfig, resetConfig } = require('../../../database/models/config');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-ticket')
        .setDescription('Setup ticket system for the server')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to send the ticket message')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText))
        .addRoleOption(option =>
            option.setName('ticket-support-role')
                .setDescription('Role to manage tickets')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('ticket-category')
                .setDescription('Category to create ticket channels')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildCategory)),
    isAdmin: true,
    async execute(interaction) {

        await interaction.deferReply();

        const channel = interaction.options.getChannel('channel');
        const ticketSupportRole = interaction.options.getRole('ticket-support-role');
        const ticketCategory = interaction.options.getChannel('ticket-category');

        setConfig('ticketChannelID', channel.id);
        setConfig('ticketSupportRoleID', ticketSupportRole.id);
        setConfig('ticketCategoryID', ticketCategory.id);

        await ticketCategory.permissionOverwrites.edit(ticketSupportRole, {
            ViewChannel: true,
            SendMessages: true,
        });

        await ticketCategory.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            ViewChannel: false,
            SendMessages: false,
        });

        await channel.permissionOverwrites.edit(ticketSupportRole, {
            ViewChannel: true,
            SendMessages: true,
        });

        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            ViewChannel: true,
            SendMessages: false,
        });

        const ticketEmbed = new EmbedBuilder()
            .setTitle('🎫 Need Support?')
            .setDescription(
                'If you need assistance, click the button below to create a ticket. Our support team will respond as soon as possible!' +
                '\n\n```Please provide as much information as possible to help us assist you better```'
            )
            .setColor('Blue')
            .setFooter({ text: `${interaction.guild.name} | Tickets`, iconURL: interaction.guild.iconURL() });

        const button = new ButtonBuilder()
            .setCustomId('create-ticket')
            .setLabel('Create Ticket')
            .setEmoji('🎫')
            .setStyle(ButtonStyle.Primary);

        const actionRow = new ActionRowBuilder().addComponents(button);

        await channel.send({ embeds: [ticketEmbed], components: [actionRow] });

        const confirmationEmbed  = simpleEmbed(
            {
                footer: `${interaction.guild.name} | Config`,
                title: 'Ticket System Setup',
                color: 'Random',
            }
        ).addFields(
            { name: 'Ticket Message Channel', value: `> <#${channel.id}>`, inline: true },
            { name: 'Ticket Support Role', value: `> <@&${ticketSupportRole.id}>`, inline: true },
            { name: 'Ticket Category', value: `> <#${ticketCategory.id}>`, inline: true },
        );

        return await interaction.editReply({ embeds: [confirmationEmbed ] });

    },
};