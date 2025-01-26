const { Events } = require('discord.js');
const { getConfig } = require('../../database/models/config');
const { simpleEmbed } = require('../../embeds/generalEmbeds');
const { validateAdminAndGuildMessage } = require('../../utils/discordValidators');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot || !message.guild) return;

        const prefix = getConfig('prefix');

        if (!prefix) return;

        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = message.client.messageCommands.get(commandName);

        if (!command) return;

        const validate = await validateAdminAndGuildMessage(message, command);

        if (validate && validate.error) {
			if (validate.embed) {
				await message.reply({embeds: [validate.embed]});
			}
            // await message.delete();
			return;
		}

        try {
            await command.execute(message, args);
            // await message.delete();
            return;
        } catch (error) {
            // console.error(error);

            const errorEmbed = simpleEmbed({
                description: 'Something went wrong. Please try again later.',
                color: 'Red',
            })
            console.error(`Error executing ${commandName}`);
            message.reply({ embeds: [errorEmbed] });
            // await message.delete();
            return;
        }
    },
};
