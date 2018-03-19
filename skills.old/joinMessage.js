
const skill = ({ controller }) => {
  controller.on('channel_joined', (bot, message) => {
    bot.say({
      channel: message.channel.id,
      text: 'I Superman.',
    });
  });
};

export default skill;
