const diceRoll = require('../utils/diceRoll');
const messages = require('../messages');

module.exports = robot => {
  robot.hear(/!roll(?: ?([0-9]+)?(?:[d ]?([0-9]+))?)?/, res => {
    const { user } = res.message;
    const [, _count = 1, _sides = 6] = res.match;
    const count = parseInt(_count, 10);
    const sides = parseInt(_sides, 10);

    if (count === 0 || count > 15 || sides < 3 || sides > 120) {
      res.send(messages.impossible(user));
      return;
    }

    const results = diceRoll({ count, sides });
    const total = results.reduce((a, b) => a + b, 0);

    const pretext = [`<@${user.id}> rolled`];
    const text = [];

    if (count !== 1) {
      pretext.push(count);
      if (sides !== 6) pretext.push(`${sides}-sided`);
      pretext.push('dice');
      text.push(`${results.join(', ')} — total`);
    }

    text.push(`${total.toLocaleString('en-US')}`);

    res.send({
      attachments: [
        {
          pretext: `${pretext.join(' ')}:`,
          text: text.join(' ')
        }
      ]
    });
  });
};
