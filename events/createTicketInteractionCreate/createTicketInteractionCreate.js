const { Events, PermissionsBitField, ChannelType, ButtonStyle, ButtonBuilder, ActionRowBuilder, MessageFlags } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { checkRole } = require('../../utils/helpers');
const { getConfig } = require('../../database/models/config');
const { simpleEmbed } = require('../../embeds/generalEmbeds');
const { validateAdminAndGuildInteraction } = require('../../utils/discordValidators');
const { ticketChannelRegex } = require('../../utils/regex');

const CUSTOM_IDS = ['create-ticket', 'close-ticket', 'delete-ticket', 'open-ticket'];

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {

		let interactionReplied = false;

		try {

			if (!interaction.isButton()) {
				return;
			}

			const customId = interaction.customId;

			if (!customId || !CUSTOM_IDS.includes(customId)) {
				return;
			}

			await interaction.deferReply({ flags: MessageFlags.Ephemeral });
			interactionReplied = true;

			const ticketChannelID = getConfig("ticketChannelID");
			const ticketSupportRoleID = getConfig("ticketSupportRoleID");
			const ticketCategoryID = getConfig("ticketCategoryID");

			if (!ticketChannelID || !ticketSupportRoleID || !ticketCategoryID) {
				const errorEmbed = simpleEmbed({
					description: `**Ticket system not setup**\n\n> Please contact support`,
					color: 'Red',
				});
				return await interaction.editReply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
			}

			const ticketChannelDb = interaction.guild.channels.cache.get(ticketChannelID);
			const ticketSupportRole = interaction.guild.roles.cache.get(ticketSupportRoleID);
			const ticketCategory = interaction.guild.channels.cache.get(ticketCategoryID);

			if (!ticketSupportRole || !ticketCategory || !ticketChannelDb) { 
				const errorEmbed = simpleEmbed({
					description: `**Ticket system not setup**\n\n> Please contact support`,
					color: 'Red',
				});
				return await interaction.editReply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
			}

			const user = interaction.user;

			const ticketChannel = interaction.channel;
			const ticketMessage = interaction.message;
			const ticketUserId = ticketChannel.name.split('-')[1];
			const ticketUser = await interaction.guild.members.fetch(ticketUserId).catch(() => null);

			const isInteractorSupport = checkRole(interaction.member, ticketSupportRoleID);

			const isValidTicketChannel = ticketChannelRegex.test(ticketChannel.name);
			const ticketClosed = ticketChannel.name.endsWith('-closed');

			if (!isValidTicketChannel && customId !== 'create-ticket') {
				const errorEmbed = simpleEmbed({
					description: `**Invalid ticket channel**\n\n> Please contact support`,
					color: 'Red',
				});
				return await interaction.editReply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
			}

			switch (customId) {

				case 'create-ticket': {

					const ticketChannelName = `ticket-${user.id}`;

					const ticketChannelExists = interaction.guild.channels.cache.find(channel => channel.name === ticketChannelName);

					if (ticketChannelExists) {
						const errorEmbed = simpleEmbed({
							description: `**Ticket already exists**\n\n> Please contact support`,
							color: 'Red',
						}).addFields(
							{ name: 'Ticket', value: `<#${ticketChannelExists.id}>` }
						);
						return await interaction.editReply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
					}

					const ticketChannelCreated = await interaction.guild.channels.create({
						type: ChannelType.GuildText,
						name: ticketChannelName,
						parent: ticketCategory,
						permissionOverwrites: [
							{
								id: interaction.guild.roles.everyone,
								deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
							},
							{
								id: ticketSupportRole,
								allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
							},
							{
								id: user.id,
								allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
							},
						],
					});

					const ticketMessage = simpleEmbed({
						title: '🎫 Need Support?',
						description: `Please describe your issue below`,
						color: 'Blue',
					}).addFields(
						{ name: 'User', value: `<@${user.id}>` }
					);

					const ticketMessageContent = `<@${user.id}> ${ticketSupportRole ? `<@&${ticketSupportRole.id}>` : ``}`;

					const ticketCloseButton = new ButtonBuilder()
						.setCustomId('close-ticket')
						.setLabel('Close Ticket')
						.setEmoji('🔒')
						.setStyle(ButtonStyle.Danger);

					const ticketActionRow = new ActionRowBuilder()
						.addComponents(ticketCloseButton);

					await ticketChannelCreated.send({
						content: ticketMessageContent,
						embeds: [ticketMessage],
						components: [ticketActionRow]
					});

					const ticketEmbed = simpleEmbed({
						title: '🎫 Ticket Created',
						description: `Ticket created successfully\n\n> <#${ticketChannelCreated.id}>`,
						color: 'Green',
					});

					return await interaction.editReply({
						embeds: [ticketEmbed],
						flags: MessageFlags.Ephemeral
					});
				}

				case ('close-ticket'): {

					const ticketClosed = ticketChannel.name.endsWith('-closed');

					if (ticketClosed) {
						const errorEmbed = simpleEmbed({
							description: `**Ticket already closed**`,
							color: 'Red',
						});
						return await interaction.editReply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
					}

					if (!isInteractorSupport && ticketUser?.id !== user.id) {
						const errorEmbed = simpleEmbed({
							description: `**You do not have permission to close this ticket**`,
							color: 'Red',
						});
						return await interaction.editReply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
					}

					const infoEmbed = simpleEmbed({
						description: `**Ticket closed by <@${user.id}>**`,
						color: 'Orange',
					});

					const followUpEmbed = simpleEmbed({
						description: '```Support Team Ticket Controls```',
						color: 'Purple',
					}).addFields(
						{ name: 'Ticket User', value: ticketUser ? `<@${ticketUser.id}>` : `\`${ticketUserId}\``, inline: true },
						{ name: 'Closed By', value: `<@${user.id}>`, inline: true },
					);

					const openButton = new ButtonBuilder()
						.setCustomId('open-ticket')
						.setLabel('Open Ticket')
						.setEmoji('🔓')
						.setStyle(ButtonStyle.Primary);

					const deleteButton = new ButtonBuilder()
						.setCustomId('delete-ticket')
						.setLabel('Delete Ticket')
						.setEmoji('🗑️')
						.setStyle(ButtonStyle.Secondary);

					const actionRow = new ActionRowBuilder()
						.addComponents(openButton, deleteButton);

					await ticketChannel.edit({ name: `${ticketChannel.name}-closed` });

					await ticketChannel.send({
						embeds: [infoEmbed],
					});

					await ticketChannel.send({
						embeds: [followUpEmbed],
						components: [actionRow]
					});

					if (ticketUser) {
						await ticketChannel.permissionOverwrites.delete(ticketUser.id);
					}

					const finalEmbed = simpleEmbed({
						description: `**Ticket closed successfully**`,
						color: 'Orange',
					})

					return await interaction.editReply({
						embeds: [finalEmbed],
						flags: MessageFlags.Ephemeral
					});
				}
				case ('open-ticket'): {

					if (!ticketClosed) {
						const errorEmbed = simpleEmbed({
							description: `**Ticket already open**`,
							color: 'Red',
						});
						return await interaction.editReply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
					}

					if (!isInteractorSupport) {
						const errorEmbed = simpleEmbed({
							description: `**You do not have permission to open this ticket**`,
							color: 'Red',
						});
						return await interaction.editReply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
					}

					if (ticketUser) {
						await ticketChannel.permissionOverwrites.edit(ticketUser.id, {
							ViewChannel: true,
							SendMessages: true,
						});
					}

					await ticketMessage.delete();

					const infoEmbed = simpleEmbed({
						description: `**Ticket opened by <@${user.id}>**`,
						color: 'Green',
					});

					await ticketChannel.edit({ name: ticketChannel.name.replace('-closed', '') });

					const finalEmbed = simpleEmbed({
						description: `**Ticket opened successfully**`,
						color: 'Green',
					})

					await ticketChannel.send({
						embeds: [infoEmbed],
					});

					return await interaction.editReply({
						embeds: [finalEmbed],
						flags: MessageFlags.Ephemeral
					});
				}

				case ('delete-ticket'): {

					if (!isInteractorSupport) {
						const errorEmbed = simpleEmbed({
							description: `**You do not have permission to delete this ticket**`,
							color: 'Red',
						});
						return await interaction.editReply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
					}

					const infoEmbed = simpleEmbed({
						description: `**Ticket will be deleted in 5 seconds by <@${user.id}>**`,
						color: 'Red',
					});

					const finalEmbed = simpleEmbed({
						description: `**Ticket will be deleted in 5 seconds**`,
						color: 'Red',
					})

					await interaction.editReply({
						embeds: [finalEmbed],
						flags: MessageFlags.Ephemeral
					});

					await ticketChannel.send({
						embeds: [infoEmbed],
					});

					await new Promise((resolve) => {
						setTimeout(resolve, 5000);
					});

					return await ticketChannel.delete();
				}
			}

		} catch (error) {
			console.error('Error creating ticket', error);
			const errorEmbed = simpleEmbed({
				description: `**Something went wrong**\n\n> Please contact support`,
				color: 'Red',
			});
			if (interactionReplied) {
				return await interaction.editReply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
			}
			return await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
		}
	},
};