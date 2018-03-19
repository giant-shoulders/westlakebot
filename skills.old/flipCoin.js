import crypto from 'crypto';
import * as messages from '../../messages';

const triggers = ['^!flip(?: ([0-9]*))?$'];
const sources = ['ambient', 'direct_mention', 'direct_message'];

const skill = ({ controller }) => {
  controller.hears(triggers, sources, (bot, message) => {
    const { user } = message;
    const [, _flips = 1] = message.match;
    const flips = parseInt(_flips, 10);

    if (flips > 100) {
      bot.reply(message, messages.impossible(user));
      return;
    }

    const details = {
      heads: 0,
      tails: 0,
      sequences: [],
    };

    let currentSequence = { face: null, length: 0 };

    const rng = crypto.randomBytes(flips);
    const results = Array.prototype.map.call(rng, number => {
      const face = number % 2 ? 'heads' : 'tails';

      if (flips > 10) {
        details[face] += 1;

        if (face !== currentSequence.face) {
          if (currentSequence.length >= 2) details.sequences.push(currentSequence);
          currentSequence = { face, length: 1 };
        } else {
          currentSequence.length += 1;
        }
      }

      return `:coin-${face}:`;
    });

    const plural = (count, s, p) => (
      count > 1 ? p : s
    );

    const reply = [results.join(' ')];
    const timestamp = Math.floor(Date.now() / 1000);

    const attachment = {
      fallback: `Results for ${flips} Coin ${plural(flips, 'Flip', 'Flips')} - Heads: ${details.heads} - Tails: ${details.tails}`,
      author_name: 'Coin Flipper',
      title: `Results for ${flips} Coin ${plural(flips, 'Flip', 'Flips')}`,
      pretext: `*<@${user}> flipped ${plural(flips, 'a coin', `${flips} coins`)}*`,
      text: reply.join(''),
      ts: timestamp,
      fields: [],
      mrkdwn_in: ['pretext'],
    };

    if (flips > 10) {
      const sequence = details.sequences.sort((a, b) => {
        if (b.length > a.length) return 1;
        if (b.length < a.length) return -1;
        return 0;
      })[0];

      attachment.fields.push({
        title: 'Total Heads',
        value: `${details.heads} × :coin-heads:`,
        short: true,
      }, {
        title: 'Total Tails',
        value: `${details.tails} × :coin-tails:`,
        short: true,
      }, {
        title: 'Longest Sequence',
        value: `${sequence.length} × :coin-${sequence.face}: in a row!`,
        short: true,
      });
    }

    bot.reply(message, {
      attachments: [attachment],
    });
  });
};

export default skill;
