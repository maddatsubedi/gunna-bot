const userMentionRegex = /^<@!?(\d{17,20})>$/;
const muteTimeRegex =  /^(\d+h(:\d+m)?)$|^(\d+m)$/;
const ticketChannelRegex = /^ticket-\d{17,19}(-closed)?$/;

module.exports = {
    userMentionRegex,
    muteTimeRegex,
    ticketChannelRegex
};