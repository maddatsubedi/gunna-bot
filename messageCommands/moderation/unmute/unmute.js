const { simpleEmbed } = require("../../../embeds/generalEmbeds");
const { removeMuteByUserId, isUserMuted } = require("../../../database/models/mutes");

module.exports = {
    name: 'unmute',
    description: 'Unmute a user',
    isAdmin: true,
    args: [
        {
            name: 'user',
            description: 'The user to unmute',
            required: true,
            type: 'USER',
        },
        {
            name: 'reason',
            description: 'The reason for unmuting the user',
            required: false,
            type: 'STRING',
        }
    ],
    async execute(message, args) {
        try {
            // Check if a user is mentioned
            if (message.mentions.users.size < 1) {
                const embed = simpleEmbed({ description: 'Please mention a user to unmute', color: 'Red' });
                return await message.reply({ embeds: [embed] });
            }

            if (message.mentions.users.size > 1) {
                const embed = simpleEmbed({ description: 'Please mention only one user to unmute', color: 'Red' });
                return await message.reply({ embeds: [embed] });
            }

            const user = message.mentions.users.first();

            // Check if the user is muted
            const muteRecord = isUserMuted(user.id);

            if (!muteRecord) {
                const embed = simpleEmbed({
                    description: `User <@${user.id}> is not muted`,
                    color: 'Red',
                });
                return await message.reply({ embeds: [embed] });
            }

            // Fetch mute role ID from config
            const muteRoleId = await require("../../../database/models/config").getConfig("muteRoleID");

            if (!muteRoleId) {
                const embed = simpleEmbed({
                    description: 'Mute role not found. Please ensure a mute role exists.',
                    color: 'Red',
                });
                return await message.reply({ embeds: [embed] });
            }

            // Check if the user has the mute role
            const member = message.guild.members.cache.get(user.id);

            if (!member) {
                const embed = simpleEmbed({
                    description: `User <@${user.id}> is not in this server`,
                    color: 'Red',
                });
                return await message.reply({ embeds: [embed] });
            }

            if (!member.roles.cache.has(muteRoleId)) {
                const embed = simpleEmbed({
                    description: `User <@${user.id}> does not have the mute role`,
                    color: 'Red',
                });
                return await message.reply({ embeds: [embed] });
            }

            // Remove mute role
            await member.roles.remove(muteRoleId).catch(async (error) => {
                console.error(`Error removing mute role: ${error}`);
                const embed = simpleEmbed({
                    description: 'I could not remove the mute role. Ensure I have the necessary permissions.',
                    color: 'Red',
                });
                return await message.reply({ embeds: [embed] });
            });

            // Remove mute record from database
            const success = removeMuteByUserId(user.id);

            if (!success) {
                const embed = simpleEmbed({
                    description: 'Failed to remove mute record from the database. Please try again.',
                    color: 'Red',
                });
                return await message.reply({ embeds: [embed] });
            }

            // Send success message
            const embed = simpleEmbed({
                title: 'User Unmuted',
                color: 'Green',
                footer: `${message.guild.name} | Moderation`,
            })
                .addFields(
                    { name: 'User', value: `<@${user.id}>` },
                    // { name: 'Reason', value: 'Mute has been lifted' }
                )
                .setThumbnail(user.avatarURL());

            return await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`Error unmuting user: ${error}`);
            const embed = simpleEmbed({
                description: 'Something went wrong. Please try again later.',
                color: 'Red',
            });
            return await message.reply({ embeds: [embed] });
        }
    },
};
