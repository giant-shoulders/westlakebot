
const skill = ({ controller }) => {
  controller.on('user_channel_join', (bot, message) => {
    const { user } = message;
    bot.reply(message, `<!channel> - Gentlemen, say hello to <@${user}>!`);
  });
};

export default skill;
