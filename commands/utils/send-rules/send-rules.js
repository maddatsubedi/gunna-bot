const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType, MessageFlags } = require('discord.js');
const { getConfig, setConfig, deleteConfig, resetConfig } = require('../../../database/models/config');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { generateRandomHexColor } = require('../../../utils/helpers');
const wait = require('node:timers/promises').setTimeout;
const path = require('path');

const MAX_FIELDS_PER_EMBED = 10;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('send-rules')
        .setDescription('Send rules to the specified channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to send the rules')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText))
        .addStringOption(option =>
            option.setName('message-id')
                .setDescription('Message ID of the rules message')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('source-channel')
                .setDescription('Channel to get the rules message from')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)),
    isAdmin: true,
    async execute(interaction) {

        const sendChannel = interaction.options.getChannel('channel');
        const messageID = interaction.options.getString('message-id');
        const sourceChannel = interaction.options.getChannel('source-channel');

        await interaction.deferReply();

        let flag = false;
        const rulesMessage = await sourceChannel.messages.fetch(messageID).catch(async () => {
            const embed = simpleEmbed({
                description: `**Message not found**`,
                color: 'Red',
            });
            flag = true;
            await interaction.editReply({ embeds: [embed] });
        });

        if (flag) return;

        if (!rulesMessage || !rulesMessage.content) {
            const embed = simpleEmbed({
                description: `**Message does not contain valid content**`,
                color: 'Red',
            });
            return await interaction.editReply({ embeds: [embed] });
        }

        const messageContent = rulesMessage.content;

        const rulesEmbedData = messageContent.split('\n\n').map((item) => {
            const [title, description] = item.split('\n');
            return {
                title: title || 'No title provided',
                description: description || 'No description provided',
            };
        });

        const ruleEmbeds = [];
        const randomHex = generateRandomHexColor();

        for (let i = 0; i < rulesEmbedData.length; i += MAX_FIELDS_PER_EMBED) {
            const currentBatch = rulesEmbedData.slice(i, i + MAX_FIELDS_PER_EMBED);

            const embed = new EmbedBuilder()
                .setColor(randomHex)
                .setFooter({ text: `Page ${Math.floor(i / MAX_FIELDS_PER_EMBED) + 1} of ${Math.ceil(rulesEmbedData.length / MAX_FIELDS_PER_EMBED)}` });

            let description = '';

            if (i === 0) {
                embed.setTitle('📜 Server Rules')
                description = '```Please read and follow the rules below to ensure a positive experience for everyone.```\n';
            }

            currentBatch.forEach((rule, index) => {
                description += `> **${i + index + 1}. ${rule.title}**${rule.description}\n\n`;
            });

            embed.setDescription(description);
            ruleEmbeds.push(embed);
        }

        const lastEmbed = ruleEmbeds[ruleEmbeds.length - 1];
        lastEmbed.setImage("attachment://rules.png")

        const attachmentPath = path.join(__dirname, './assets/rules.png');

        for (const embed of ruleEmbeds) {
            await sendChannel.send({
                embeds: [embed],
                files: [{
                    attachment: attachmentPath,
                    name: 'rules.png'
                }]
            });
        }

        // const lastEmbed = new EmbedBuilder()
        //     .setImage("attachment://rules.png")
        //     .setColor(randomHex)

        // await sendChannel.send({
        //     embeds: [lastEmbed],
        //     files: [{
        //         attachment: attachmentPath,
        //         name: 'rules.png'
        //     }]
        // })

        const successEmbed = simpleEmbed({
            description: `✅ Rules have been sent to <#${sendChannel.id}>`,
            color: 'Green',
        });

        return await interaction.editReply({ embeds: [successEmbed] });
    },
};