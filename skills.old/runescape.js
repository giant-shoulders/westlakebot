import request from 'request-promise';
import EXP_TABLE from './constants/RS_EXP_TABLE';

const API_ROUTE = `http://rs.christieman.com/api/index.php?username={username}`;

const sources = ['ambient'];
const trigger = `^!rs ([a-zA-Z0-9 ]+)$`;

const toCamel = (str) => (
  str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
    if (+match === 0) {
      return '';
    }
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  })
);

const getExperience = (level) => {
  const lvl = (level > 99) ? 99 : level;
  return EXP_TABLE.find(exp => exp.level === lvl);
};

const getLevelProgress = (level, exp) => {
  const currentLevel = getExperience(level) || 0;
  const nextLevel = getExperience(level + 1) || 0;

  return {
    needed: nextLevel.exp - exp,
    progress: (exp - currentLevel.exp) / ((nextLevel.exp - currentLevel.exp) * 100),
  };
};

const skill = ({ controller }) => {
  controller.hears(trigger, sources, (bot, message) => {
    if (!message.match[1]) {
      bot.reply(message, `Supply me a username, bunhead! :neutral_face:`);
      return;
    }

    const username = message.match[1];

    const parseStats = (stats) => {
      const statList = ['Overall', 'Attack', 'Defense', 'Strength', 'HP', 'Ranged', 'Prayer', 'Magic', 'Cooking', 'Woodcutting', 'Fletching', 'Fishing', 'Firemaking', 'Crafting', 'Smithing', 'Mining', 'Herblore', 'Agility', 'Thieving', 'Slayer', 'Farming', 'Runecrafting', 'Hunter', 'Construction'];
      const parsedStats = stats.split('\n').splice(0, statList.length);
      const results = [];

      const fixZeroOverall = (skills) => {
        let totalExp = 0;
        let totalLvl = 0;

        skills.forEach((sk) => {
          totalExp += sk.details.exp;
          totalLvl += sk.details.level;
        });

        return {
          rank: '',
          level: totalLvl,
          exp: totalExp,
        };
      };

      parsedStats.forEach((stat, i) => {
        const splits = stat.split(',');

        results.push({
          statName: statList[i],
          statKey: toCamel(statList[i]),
          details: {
            rank: (splits[0]) ? parseInt(splits[0].replace('-1', '0'), 10) : '',
            level: (splits[1]) ? parseInt(splits[1].replace('-1', '0'), 10) : '',
            exp: (splits[2]) ? parseInt(splits[2].replace('-1', '0'), 10) : '',
          },
        });
      });

      const overall = results.shift();
      overall.details = (overall.details.level === 0 && overall.details.exp === 0) ? fixZeroOverall(results) : overall.details;

      return {
        username,
        overall,
        stats: results,
      };
    };

    const respond = (s) => {
      const timestamp = Math.floor(Date.now() / 1000);
      const attachment = {
        fallback: `RuneScape Stats For '${username}'`,
        author_name: 'RuneScape Stats',
        author_link: 'http://runescape.com/',
        title: `${username}`,
        pretext: `*RuneScape Stats For '${username}'*`,
        text: `Here's a list of stats for ${username} that are recent as of the last time they logged off.`,
        ts: timestamp,
        fields: [{
          title: 'Overall',
          value: `${s.overall.details.level.toLocaleString('en-US')} (${s.overall.details.exp.toLocaleString('en-US')})`,
          short: false,
        }],
        mrkdwn_in: ['pretext', 'fields'],
      };

      s.stats.forEach(st => {
        const progress = getLevelProgress(st.details.level, st.details.exp);
        const nextLevel = getExperience(st.details.level + 1);
        attachment.fields.push({
          title: st.statName,
          value: `*${st.details.level.toLocaleString('en-US')}* _(${st.details.exp.toLocaleString('en-US')}/${nextLevel.exp.toLocaleString('en-US')})_\n*TO LEVEL:* ${(progress.needed > 0) ? progress.needed.toLocaleString('en-US') : 'MAX'}`,
          short: true,
        });
      });

      bot.reply(message, {
        attachments: [
          attachment,
        ],
      });
    };

    const args = {
      method: 'GET',
      uri: API_ROUTE.format({ username: encodeURIComponent(username) }),
    };

    request(args)
      .then(parseStats)
      .then(respond)
      .catch(() => bot.reply(message, `Something went wrong, or that user doesn't exist. :face_with_head_bandage:`));
  });
};

export default skill;
