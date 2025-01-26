function checkRole(member, roleId) {
    return member.roles.cache.has(roleId);
}

function checkRolesFromList(member, roleIds) {
    return roleIds.some(roleId => member.roles.cache.has(roleId));
}

const generateRandomHexColor = () => {
    return `${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
};

const countDuplicatesInArray = (array) => {
    if (!Array.isArray(array)) {
        throw new Error('Input must be an array');
    }

    const counts = {};
    const duplicates = {};

    array.forEach(item => {
        counts[item] = (counts[item] || 0) + 1;
    });

    for (const [item, count] of Object.entries(counts)) {
        if (count > 1) {
            duplicates[item] = count;
        }
    }

    return duplicates;
};

function formatTime(ms) {
    let seconds = Math.floor(ms / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    seconds = seconds % 60;
    minutes = minutes % 60;

    let timeString = '';
    if (hours > 0) timeString += `${hours} hr : `;
    if (minutes > 0 || hours > 0) timeString += `${minutes} min : `;
    timeString += `${seconds} sec`;

    return timeString.trim();
}

const parseTimeToMilliseconds = (timeStr) => {
    const timeParts = timeStr.match(/(\d+)\s*(hr|min|sec)/g) || [];
    let totalMilliseconds = 0;

    timeParts.forEach(part => {
        const [_, value, unit] = part.match(/(\d+)\s*(hr|min|sec)/);
        const timeValue = parseInt(value, 10);
        switch (unit) {
            case 'hr': totalMilliseconds += timeValue * 3600000; break;
            case 'min': totalMilliseconds += timeValue * 60000; break;
            case 'sec': totalMilliseconds += timeValue * 1000; break;
        }
    });

    return totalMilliseconds;
};

const validateLowerCase = (string) => {
    if (!string) {
        return false;
    }
    return string === string.toLowerCase();
}

const getTimeRemaining = (end_at) => {
    const now = new Date();
    const endTime = new Date(end_at);

    const diff = endTime - now; // Difference in milliseconds

    if (diff <= 0) {
        return 'Mute expired'; // If the mute has expired
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m ` : ''}${seconds}s`;
};

module.exports = {
    checkRole,
    checkRolesFromList,
    generateRandomHexColor,
    countDuplicatesInArray,
    parseTimeToMilliseconds,
    validateLowerCase,
    formatTime,
    getTimeRemaining,
};