const path = require('path');
const { Events } = require('discord.js');
const { getConfig } = require('../../database/models/config');
const { createCanvas, loadImage } = require('canvas');

const BACKGROUND_IMAGE_PATH_RELATIVE = './assets/image.png';
const BACKGROUND_IMAGE_PATH = path.join(__dirname, BACKGROUND_IMAGE_PATH_RELATIVE);

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {

        try {

            const welcomeChannel = getConfig('welcomeChannelID');

            const channel = member.guild.channels.cache.get(welcomeChannel);

            if (!channel) return;

            const background = await loadImage(BACKGROUND_IMAGE_PATH);

            const canvas = createCanvas(background.width, background.height);
            const ctx = canvas.getContext('2d');

            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

            const avatar = await loadImage(member.user.displayAvatarURL({ extension: 'png', size: 256 }));
            const avatarSize = 205;
            const borderSize = 12.5;
            const avatarX = canvas.width / 2 - avatarSize * 1.5 - 145;
            const avatarY = canvas.height / 2 - avatarSize / 2 + 112.5;
            const centerX = avatarX + avatarSize / 2;
            const centerY = avatarY + avatarSize / 2;

            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, avatarSize / 2 + borderSize, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.closePath();
            ctx.restore();

            ctx.save();
            ctx.beginPath();
            ctx.arc(
                avatarX + avatarSize / 2,
                avatarY + avatarSize / 2,
                avatarSize / 2,
                0,
                Math.PI * 2
            );
            ctx.closePath();
            ctx.clip();

            ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
            ctx.restore();

            const usernameFontSize = 100;
            ctx.font = `${usernameFontSize}px Arial`;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            const usernameX = canvas.width / 2;
            const usernameY = 160;
            ctx.fillText(member.displayName, usernameX, usernameY);

            const attachment = canvas.toBuffer('image/png');

            const messageContent = `Welcome ${member.user} to the **${member.guild.name}**!`;

            return await channel.send({ content: messageContent, files: [attachment] });

        } catch (error) {
            console.log("Error in guildMemberAdd: ", error);
        }
    },
};
