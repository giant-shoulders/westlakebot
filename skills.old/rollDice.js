import { diceRoll } from '../../utils';
import * as messages from '../../messages';

const triggers = ['^!roll(?: ?([0-9]+)?(?:[d ]?([0-9]+))?)?$'];
const sources = ['ambient', 'direct_mention', 'direct_message'];

const skill = ({ controller }) => {
  controller.hears(triggers, sources, (bot, message) => {
    const { user, match: [, _count = 1, _sides = 6] } = message;
    const count = parseInt(_count, 10);
    const sides = parseInt(_sides, 10);

    if (count === 0 || count > 15 || sides < 3 || sides > 120) {
      bot.reply(message, messages.impossible(user));
      return;
    }

    const results = diceRoll({ count, sides });
    const total = results.reduce((a, b) => a + b, 0);

    const pretext = [`<@${user}> rolled`];
    const text = [];

    if (count !== 1) {
      pretext.push(count);
      if (sides !== 6) pretext.push(`${sides}-sided`);
      pretext.push('dice');
      text.push(`${results.join(', ')} — total`);
    }

    text.push(`${total.toLocaleString('en-US')}`);

    bot.reply(message, {
      attachments: [{
        pretext: `${pretext.join(' ')}:`,
        text: text.join(' '),
      }],
    });
  });
};

export default skill;
