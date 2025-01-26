const { guildId } = require('../config.json');
const { getConfig } = require('../database/models/config');
const { unmuteEndedMutes } = require('../database/models/mutes');

const endedMutesRemovalInterval = 60000; // 1 minute

const removeMutedRoleFromUsers = async (client, expiredMutes) => {
    if (!expiredMutes || expiredMutes.deletedMutes.length ===0) return;
    if (expiredMutes.endedMutes.length !== expiredMutes.deletedMutes.length) {
        console.log('Some mutes were not removed from the database');
        console.log(expiredMutes);
    }

    const deletedMutes = expiredMutes.deletedMutes;
    const guild = await client.guilds.cache.get(guildId);

    if (!guild) {
        console.log(`Guild not found: ${guildId}`);
        return;
    }

    const members = await guild.members.cache;

    const muteRoleId = getConfig('muteRoleID');

    for (let i = 0; i < deletedMutes.length; i++) {
        const muteData = deletedMutes[i];

        const member = await members.get(muteData.user_id);

        if (!member) {
            console.log(`Member not found: ${muteData.user_id}`);
            continue;
        }

        const role = await guild.roles.cache.get(muteRoleId);

        if (!role) {
            console.log(`Role not found: ${muteRoleId}`);
            continue;
        }

        await member.roles.remove(role).catch((error) => {
            console.log(error);
            console.log(`Error removing role: ${role.name} from ${member.user.username}`);
        });
        console.log(`Muted role: ${role.name} removed from ${member.user.username}`);
    }
}


const runEndedMutesRemoval = async (client) => {
    const executeTask = async () => {
        try {
            const expiredMutes = await unmuteEndedMutes();
            await removeMutedRoleFromUsers(client, expiredMutes);
        } catch (error) {
            console.log("Error while processing expired mutes:", error);
        } finally {
            setTimeout(executeTask, endedMutesRemovalInterval);
        }
    };

    executeTask();
};

module.exports = {
    runEndedMutesRemoval
}