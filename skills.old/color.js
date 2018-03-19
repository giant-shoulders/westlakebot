import moment from 'moment';
import tinycolor from 'tinycolor2';
import { matchers } from '../../utils';

// Triggers for HEX, HSL, RBG
const triggerHelp = `^!color(?: help)?$`;
const triggerFromHex = `^!color(?: ${matchers.HEX})$`;
const triggerFromHsl = `^!color(?: ${matchers.HSL})$`;
const triggerFromRgb = `^!color(?: ${matchers.RGB})$`;

// Skill Source
const sources = ['ambient'];

// Helpers
const parseHsl = (h, s, l) => (
  {
    h: parseInt(h, 10),
    s: parseInt(s, 10),
    l: parseInt(l, 10),
  }
);

const parseRgb = (r, g, b) => (
  {
    r: parseInt(r, 10),
    g: parseInt(g, 10),
    b: parseInt(b, 10),
  }
);

const validHex = (value) => {
  const validKey = /[0-9a-f]/i;
  const hexPieces = value.replace('#', '').split();

  let valid = true;

  hexPieces.forEach((piece) => {
    if (!validKey.test(piece)) {
      valid = false;
    }
  });

  return valid;
};

const validHsl = (...values) => {
  const [h, s, l] = values;
  return !((h < 0 || h > 360) || (s < 0 || s > 100) || (l < 0 || l > 100));
};

const validRgb = (...values) => {
  let valid = true;

  values.forEach(value => {
    if (value < 0 || value > 255) {
      valid = false;
    }
  });

  return valid;
};

// Our Skill
const skill = ({ controller }) => {
  const replyError = (color, bot, message) => {
    bot.reply(message, `I had trouble parsing the color \`${color}\` :face_with_head_bandage:`);
  };

  const replyWithColor = (original, color, bot, message) => {
    const { user } = message;
    const attachment = {
      fallback: `Color Results - HEX: ${color.toHexString()} - HSL: ${color.toHslString()} - HEX: ${color.toRgbString()}`,
      author_name: 'Color Converter',
      title: `Color Conversion`,
      pretext: `*Color Conversion for \`${original}\` via <@${user}>*`,
      text: `Here's a fancy little conversion table for your color.`,
      ts: moment().format('X'),
      color: color.toHexString(),
      fields: [{
        title: 'HEX:',
        value: `\`${color.toHexString()}\``,
        short: true,
      }, {
        title: 'HSL:',
        value: `\`${color.toHslString()}\``,
        short: true,
      }, {
        title: 'RGB:',
        value: `\`${color.toRgbString()}\``,
        short: true,
      }],
      mrkdwn_in: ['text', 'pretext', 'fields'],
    };

    bot.reply(message, {
      attachments: [attachment],
    });
  };

  //
  //
  // Help
  controller.hears(triggerHelp, sources, (bot, message) => {
    const formattedCommands = [];

    formattedCommands.push(`\n*HEX*\n\`!color #ff00ff\`\n_Valid Formats: #000, #000000_`);
    formattedCommands.push(`\n*HSL*\n\`!color hsl(360, 0, 100)\`\n_Valid Range: hsl(0, 0, 0) - hsl(360, 100, 100)_`);
    formattedCommands.push(`\n*RGB*\n\`!color rgb(255, 0, 255)\`\n_Valid Range: rgb(0, 0, 0) - rgb(255, 255, 255)_`);

    bot.reply(message, {
      attachments: [{
        fallback: 'Color Help',
        title: 'Color Help',
        text: `Here are my commands so far:\n${formattedCommands.join('\n')}`,
        color: '#439FE0',
        mrkdwn_in: ['text'],
      }],
    });
  });

  //
  //
  // HEX
  controller.hears(triggerFromHex, sources, (bot, message) => {
    const [, hex] = message.match;

    if (!validHex(hex)) {
      replyError(hex, bot, message);
      return;
    }

    const color = tinycolor(hex);
    replyWithColor(hex, color, bot, message);
  });

  //
  //
  // HSL
  controller.hears(triggerFromHsl, sources, (bot, message) => {
    const [, hString, sString, lString] = message.match;
    const { h, s, l } = parseHsl(hString, sString, lString);

    if (!validHsl(h, s, l)) {
      replyError(`hsl(${h}, ${s}, ${l})`, bot, message);
      return;
    }

    const color = tinycolor(`hsl(${h}, ${s}%, ${l}%)`);
    replyWithColor(`hsl(${h}, ${s}, ${l})`, color, bot, message);
  });

  //
  //
  // RGB
  controller.hears(triggerFromRgb, sources, (bot, message) => {
    const [, rString, gString, bString] = message.match;
    const { r, g, b } = parseRgb(rString, gString, bString);

    if (!validRgb(r, g, b)) {
      replyError(`rgb(${r}, ${g}, ${b})`, bot, message);
      return;
    }

    const color = tinycolor({ r, g, b });
    replyWithColor(`rgb(${r}, ${g}, ${b})`, color, bot, message);
  });
};

export default skill;
