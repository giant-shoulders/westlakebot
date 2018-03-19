import { arrayRandom } from '../../utils';

const REPLIES = [
  `You rang, sir? :bowtie:`,
  `Did I do that? :urkel:`,
  `AYYYY, WHERE THE PARTY @?! :dickbutt:`,
  `Ello chap! Top 'o the mornin to yeh! :tophat:`,
  `Oh! Such popular I is. :grin:`,
];

const skill = ({ controller }) => {
  const salute = (bot, message) => {
    bot.reply(message, arrayRandom(REPLIES));
  };

  controller.on('mention', salute);
  controller.on('direct_mention', (bot, message) => {
    if (message.text.length === 0) { salute(bot, message); }
  });
};

export default skill;
