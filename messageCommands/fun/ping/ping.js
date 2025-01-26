const { simpleEmbed } = require("../../../embeds/generalEmbeds");
const { generateRandomHexColor } = require("../../../utils/helpers");

const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const BACKGROUND_IMAGE_PATH_RELATIVE = '../../../events/guildMemberAdd/assets/image.png';
const BACKGROUND_IMAGE_PATH = path.join(__dirname, BACKGROUND_IMAGE_PATH_RELATIVE);

module.exports = {
    name: 'ping',
    description: 'Ping!',
    // isAdmin: true,
    args: false,
    async execute(message, args) {

        const randomHex = generateRandomHexColor();

        const embed = simpleEmbed({ title: 'Pong!', color: randomHex });

        const m = await message.reply({ embeds: [embed] });

        const followUpEmbed = simpleEmbed({
            title: 'Pong!',
            description: `\`\`\`Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(message.client.ws.ping)}ms\`\`\``,
            color: randomHex,
        });

        return await m.edit({ embeds: [followUpEmbed] });
    },
};
