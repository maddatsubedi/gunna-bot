const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

const commands = [];

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandSubfolders = fs.readdirSync(commandsPath);

	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const subfolder of commandSubfolders) {
		const commandFiles = fs.readdirSync(path.join(commandsPath, subfolder)).filter(file => file.endsWith('.js'));
		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, subfolder, file);
			const command = require(filePath);
			if ('data' in command && 'execute' in command) {
				commands.push(command.data.toJSON());
			} else {
				console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
			}
		}
	}
}

const msgCmdFoldersPath = path.join(__dirname, 'messageCommands');
const msgCommandFolders = fs.readdirSync(msgCmdFoldersPath);

const messageCommands = [];

for (const folder of msgCommandFolders) {
	const commandsPath = path.join(msgCmdFoldersPath, folder);
	const commandSubfolders = fs.readdirSync(commandsPath);

	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const subfolder of commandSubfolders) {
		const commandFiles = fs.readdirSync(path.join(commandsPath, subfolder)).filter(file => file.endsWith('.js'));
		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, subfolder, file);
			const command = require(filePath);
			if ('name' in command && 'execute' in command) {
				messageCommands.push(command);
			} else {
				console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
			}
		}
	}
}

const rest = new REST().setToken(token);

(async () => {
	try {

		console.log(`Started refreshing ${commands.length} application (/) commands and ${messageCommands.length} message commands.`);

		const data = await rest.put(
			// Routes.applicationCommands(clientId), // To deploy global commands
			Routes.applicationGuildCommands(clientId, guildId), // To deploy guild commands
			// Routes.applicationGuildCommands(clientId, '1320070407990280222'), // To deploy guild commands (ATB)
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data?.length} application (/) commands and ${messageCommands.length} message commands.`);
	} catch (error) {
		console.error(error);
	}
})();