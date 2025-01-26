const { PermissionFlagsBits } = require("discord.js");
const { simpleEmbed } = require("../../../embeds/generalEmbeds");

module.exports = {
    name: 'ban',
    description: 'Ban a user from the server',
    isAdmin: true,
    args: [
        {
            name: 'user',
            description: 'The user to ban',
            required: true,
            type: 'USER',
        },
        {
            name: 'reason',
            description: 'The reason for the ban',
            required: false,
            type: 'STRING',
        },
    ],
    async execute(message, args) {
        try {
            if (message.mentions.users.size < 1) {
                const embed = simpleEmbed({ description: 'Please mention a user to ban', color: 'Red' });
                return await message.reply({ embeds: [embed] });
            }

            if (message.mentions.users.size > 1) {
                const embed = simpleEmbed({ description: 'Please mention only one user to ban', color: 'Red' });
                return await message.reply({ embeds: [embed] });
            }

            if (args.length < 1 || args.length > 2) {
                const embed = simpleEmbed({ description: 'Command is not valid', color: 'Red' }).addFields(
                    {
                        name: 'Usage',
                        value: '`?ban <user> <reason (optional)>`',
                    }
                );
                return await message.reply({ embeds: [embed] });
            }

            const user = message.mentions.users.first();
            const reason = args[1] || null;

            const member = message.guild.members.cache.get(user.id);
            if (!member) {
                const embed = simpleEmbed({ description: 'User not found in this server', color: 'Red' });
                return await message.reply({ embeds: [embed] });
            }

            if (!member.bannable) {
                const embed = simpleEmbed({ description: `I cannot ban <@${user.id}>. Make sure I have the necessary permissions.`, color: 'Red' });
                return await message.reply({ embeds: [embed] });
            }

            await member.ban({ reason }).catch((error) => {
                console.error(`Error banning user: ${error}`);
                const embed = simpleEmbed({ description: 'Something went wrong while banning the user. Please try again.', color: 'Red' });
                return message.reply({ embeds: [embed] });
            });

            const embed = simpleEmbed({
                title: 'User Banned',
                color: 'Green',
                footer: `${message.guild.name} | Moderation`,
            }).addFields(
                { name: 'User', value: `<@${user.id}>` },
                { name: 'Reason', value: reason || 'No reason provided' }
            ).setThumbnail(user.avatarURL());

            return await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`Error banning user: ${error}`);
            const embed = simpleEmbed({ description: 'Something went wrong. Please try again later.', color: 'Red' });
            return await message.reply({ embeds: [embed] });
        }
    },
};
