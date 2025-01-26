const { PermissionFlagsBits, PermissionsBitField } = require("discord.js");
const { getConfig, setConfig } = require("../../../database/models/config");
const { simpleEmbed } = require("../../../embeds/generalEmbeds");
const { generateRandomHexColor, parseTimeToMilliseconds, getTimeRemaining } = require("../../../utils/helpers");
const { userMentionRegex, muteTimeRegex } = require("../../../utils/regex");
const { isUserMuted, muteUser } = require("../../../database/models/mutes");

const DEFAULT_MUTE_TIME = '10m';

module.exports = {
    name: 'mute',
    description: 'Mute a user',
    isAdmin: true,
    args: [
        {
            name: 'user',
            description: 'The user to mute',
            required: true,
            type: 'USER',
        },
        {
            name: 'time',
            description: 'The time for which the user should be muted',
            required: false,
            type: 'STRING',
        },
        {
            name: 'reason',
            description: 'The reason for muting the user',
            required: false,
            type: 'STRING',
        },
    ],
    async execute(message, args) {

        try {

            if (message.mentions.users.size < 1) {
                const embed = simpleEmbed({ description: 'Please mention a user to mute', color: 'Red' });
                return await message.reply({ embeds: [embed] });
            }

            if (message.mentions.users.size > 1) {
                const embed = simpleEmbed({ description: 'Please mention only one user to mute', color: 'Red' });
                return await message.reply({ embeds: [embed] });
            }

            if (args.length < 1 || args.length > 3) {
                const embed = simpleEmbed({ description: 'Command is not valid', color: 'Red' }).addFields(
                    {
                        name: 'Usage',
                        value: '`?mute <user> <time> <reason (optional)>`',
                    }
                );
                return await message.reply({ embeds: [embed] });
            }

            const isValidUser = userMentionRegex.test(args[0]);
            const isValidTime = muteTimeRegex.test(args[1] || DEFAULT_MUTE_TIME);

            if (!isValidUser) {
                const embed = simpleEmbed({ description: 'Please mention a valid user', color: 'Red' });
                return await message.reply({ embeds: [embed] });
            }

            if (!isValidTime) {
                const embed = simpleEmbed({ description: 'Please mention a valid time', color: 'Red' }).addFields(
                    {
                        name: 'Valid Time formats',
                        value: '`10m` | `10h` | `10h:10m`',
                    }
                );
                return await message.reply({ embeds: [embed] });
            }

            const user = message.mentions.users.first();
            let time = args[1] || DEFAULT_MUTE_TIME;
            let reason = args[2];

            const isTimeProvided = args[1] ? true : false;

            const durationMatch = time.match(/(?:(\d+)h)?(?::)?(?:(\d+)m)?/);

            if (!durationMatch) {
                const embed = simpleEmbed(
                    {
                        description: 'Something went wrong. Please try again later',
                        color: 'Red'
                    }
                )
                return await message.reply({ embeds: [embed] });
            }

            const hours = parseInt(durationMatch[1] || 0, 10);
            const minutes = parseInt(durationMatch[2] || 0, 10);

            if ((hours || 0) + (minutes || 0) === 0) {
                const embed = simpleEmbed({ description: 'Please mention a valid time', color: 'Red' }).addFields(
                    {
                        name: 'Valid Time formats',
                        value: '`10m` | `10h` | `10h:10m`',
                    }
                );
                return await message.reply({ embeds: [embed] });
            }

            if (user.bot) {
                const embed = simpleEmbed({ description: 'You cannot mute a bot', color: 'Red' });
                return await message.reply({ embeds: [embed] });
            }

            if (user.id === message.author.id) {
                const embed = simpleEmbed({ description: 'You cannot mute yourself', color: 'Red' });
                return await message.reply({ embeds: [embed] });
            }

            if (hours > 24) {
                const embed = simpleEmbed({ description: 'You cannot mute a user for more than 24 hours', color: 'Red' });
                return await message.reply({ embeds: [embed] });
            }

            let muteRoleId = await getConfig('muteRoleID');

            const isAlreadyMuted = isUserMuted(user.id);
            const hasMuteRole = message.guild.members.cache.get(user.id).roles.cache.has(muteRoleId);

            let guildMuteRole = message.guild.roles.cache.get(muteRoleId);

            // console.log(user);

            if (isAlreadyMuted && hasMuteRole) {
                const timeRemaining = getTimeRemaining(isAlreadyMuted.end_at);
                const embed = simpleEmbed({
                    title: 'User is already muted',
                    color: 'Red',
                    footer: `${message.guild.name} | Moderation`
                }).addFields(
                    { name: 'User', value: `<@${user.id}>` },
                    { name: 'Reason', value: isAlreadyMuted.reason || 'No reason provided' },
                    { name: 'Time Remaining', value: `\`${timeRemaining}\`` },
                ).setThumbnail(user.avatarURL());
                return await message.reply({ embeds: [embed] });
            }

            if (!guildMuteRole) {
                const role = await message.guild.roles.create({
                    name: 'Muted',
                    color: '#808080', // Grey color
                    permissions: [],
                    reason: 'Mute role for muting users',
                });

                setConfig('muteRoleID', role.id);
                muteRoleId = role.id;
                guildMuteRole = role;
            }

            message.guild.channels.cache.forEach(async (channel) => {
                await channel.permissionOverwrites.edit(muteRoleId, {
                    SendMessages: false,
                    Speak: false,
                    AddReactions: false,
                    Stream: false,
                    AttachFiles: false,
                    EmbedLinks: false,
                    UseApplicationCommands: false,
                });
            });

            if (!hasMuteRole) {

                let flag = false;
                await message.guild.members.cache.get(user.id).roles.add(muteRoleId).catch(async (error) => {
                    console.error(`Error adding mute role to user: ${error}`);
                    const embed = simpleEmbed(
                        {
                            description: `**I do not have necessary permissions to mute**\n\nMake sure the role: <@&${muteRoleId}> is below the bot role: <@&${message.guild.members.me.roles.highest.id}>`,
                            color: 'Red'
                        }
                    );
                    flag = true;
                    return await message.reply({ embeds: [embed] });
                });

                if (flag) return;

            }

            let timeRemaining;

            if (!isAlreadyMuted) {

                const muteResult = muteUser(user.id, time, reason);

                if (muteResult?.error) {
                    const embed = simpleEmbed({ description: 'Something went wrong. Please try again later', color: 'Red' });
                    return await message.reply({ embeds: [embed] });
                }

            } else {
                time = isAlreadyMuted.duration;
                reason = isAlreadyMuted.reason;
                timeRemaining = getTimeRemaining(isAlreadyMuted.end_at);
            }

            let description;

            if (!isAlreadyMuted && !hasMuteRole) {
                description = `User <@${user.id}> has been muted for ${time}`;
            }

            if (!isAlreadyMuted && hasMuteRole) {
                description = `User <@${user.id}>'s mute has been updated`;
            }

            if (isAlreadyMuted && !hasMuteRole) {
                description = `User <@${user.id}>'s mute has been reinstated`;
            }

            const successEmbed = simpleEmbed(
                {
                    title: 'User Muted',
                    color: 'Green',
                    footer: `${message.guild.name} | Moderation`
                }
            ).addFields(
                { name: 'User', value: `<@${user.id}>` },
                { name: 'Time', value: `\`${time} ${!isTimeProvided ? `(Default Time)` : ``}\`` },
                { name: 'Reason', value: reason || 'No reason provided' },
            ).setThumbnail(user.avatarURL());

            if (timeRemaining) {
                successEmbed.addFields(
                    { name: 'Time Remaining', value: `\`${timeRemaining}\`` },
                );
            }

            successEmbed.setDescription(description);

            return await message.reply({ embeds: [successEmbed] });

        } catch (error) {
            console.error(error);
            console.error(`Error muting user: ${error}`);
            const embed = simpleEmbed({ description: 'Something went wrong. Please try again later', color: 'Red' });
            return await message.reply({ embeds: [embed] });
        }
    },
};