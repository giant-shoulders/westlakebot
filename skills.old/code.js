
const sources = ['ambient'];
const trigger = `^!code(?: (.*))?$`;

const skill = ({ controller }) => {
  controller.hears(trigger, sources, (bot, message) => {
    if (!message.match[1]) {
      bot.reply(message, `:codez:`);
      return;
    }

    const code = message.match[1].toUpperCase();
    bot.reply(message, `:lbracket: *${code}* :rbracket:`);
  });
};

export default skill;
