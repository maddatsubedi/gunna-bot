const { PermissionFlagsBits } = require("discord.js");
const { simpleEmbed } = require("../../../embeds/generalEmbeds");

module.exports = {
    name: 'unban',
    description: 'Unban a user from the server',
    isAdmin: true,
    args: [
        {
            name: 'user_id',
            description: 'The ID of the user to unban',
            required: true,
            type: 'STRING',
        },
        {
            name: 'reason',
            description: 'The reason for the unban',
            required: false,
            type: 'STRING',
        },
    ],
    async execute(message, args) {
        try {
            if (args.length < 1) {
                const embed = simpleEmbed({
                    description: 'Please provide the User ID of the user to unban',
                    color: 'Red',
                }).addFields({
                    name: 'Usage',
                    value: '`?unban <user_id>`',
                });
                return await message.reply({ embeds: [embed] });
            }

            const userId = args[0];
            const reason = args[1] || null;

            const bannedUsers = await message.guild.bans.fetch();

            if (!bannedUsers.has(userId)) {
                const embed = simpleEmbed({
                    description: `No user with ID \`${userId}\` is banned in this server.`,
                    color: 'Red',
                });
                return await message.reply({ embeds: [embed] });
            }

            await message.guild.members.unban(userId, reason).catch((error) => {
                console.error(`Error unbanning user: ${error}`);
                const embed = simpleEmbed({
                    description: 'Something went wrong while unbanning the user. Please try again.',
                    color: 'Red',
                });
                return message.reply({ embeds: [embed] });
            });

            const embed = simpleEmbed({
                title: 'User Unbanned',
                color: 'Green',
                footer: `${message.guild.name} | Moderation`,
            }).addFields(
                { name: 'User ID', value: userId },
                { name: 'Reason', value: reason || 'No reason provided' }
            );

            return await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`Error unbanning user: ${error}`);
            const embed = simpleEmbed({
                description: 'Something went wrong. Please try again later.',
                color: 'Red',
            });
            return await message.reply({ embeds: [embed] });
        }
    },
};
