import { matchers, getUserInfo } from '../../utils';

const trigger = `tell (?:${matchers.USER_TAG}|(?:${matchers.CHANNEL_TAG})) (.*)`;
const sources = ['direct_message', 'direct_mention'];

const skill = ({ controller }) => {
  controller.hears(trigger, sources, (bot, message) => {
    const [, user, channel, text] = message.match;

    if (channel) {
      bot.say({ channel, text });
    } else if (user) {
      getUserInfo(bot, user)
        .then(userInfo => {
          bot.api.chat.postMessage({ channel: `@${userInfo.name}`, text, as_user: true });
        });
    }
  });
};

export default skill;
