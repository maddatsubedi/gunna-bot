const { checkRole } = require('../utils/helpers');
const { getConfig } = require('../database/models/config');
const { simpleEmbed } = require('../embeds/generalEmbeds');
const { guildId } = require('../config.json');

const validateAdminInteraction = async (interaction) => {
    const adminRoleID = getConfig('adminRoleID');
    const errorEmbed = simpleEmbed({ description: '⚠️ \u200b You do not have permission to run this command', color: 'Red' });
    const command = interaction.client.commands.get(interaction.commandName);

    if (command.isAdmin && !checkRole(interaction.member, adminRoleID)) {
        return {
            error: true,
            embed: errorEmbed
        };
    }
}

const validateGuildInteraction = async (interaction) => {
    const errorEmbed = simpleEmbed({ description: '⚠️ \u200b You cannot use this bot in this server', color: 'Red' });
    if (interaction.guildId !== guildId) {
        return {
            error: true,
            embed: errorEmbed
        };
    }
}

const validateAdminAndGuildInteraction = async (interaction) => {
    return await validateGuildInteraction(interaction) ||
    await validateAdminInteraction(interaction)
}

const validateAdminMessage = async (message, _command) => {
    const adminRoleID = getConfig('adminRoleID');
    const errorEmbed = simpleEmbed({ description: '⚠️ \u200b You do not have permission to run this command', color: 'Red' });
    const command = message.client.messageCommands.get(_command.name);

    if (command.isAdmin && !checkRole(message.member, adminRoleID)) {
        return {
            error: true,
            embed: errorEmbed
        };
    }
}

const validateGuildMessage = async (message, command) => {
    const errorEmbed = simpleEmbed({ description: '⚠️ \u200b You cannot use this bot in this server', color: 'Red' });
    if (message.guild.id !== guildId) {
        return {
            error: true,
            embed: errorEmbed
        };
    }
}

const validateAdminAndGuildMessage = async (message, command) => {
    return await validateGuildMessage(message, command) ||
    await validateAdminMessage(message, command)
}

module.exports = {
    validateAdminInteraction,
    validateGuildInteraction,
    validateAdminAndGuildInteraction,
    validateAdminMessage,
    validateGuildMessage,
    validateAdminAndGuildMessage
}
