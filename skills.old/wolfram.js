import Wolfram from 'node-wolfram';
import MAIN_CONFIG from '../../config';

const wolfram = new Wolfram(MAIN_CONFIG.WOLFRAM_KEY);
const COLORS = ['#ff6138', '#e2e28b', '#beeb9f', '#79bd8f', '#00a388'];

const sources = ['ambient'];
const trigger = `^!(?:wa|wolf|wolfram)(?: (.+))$`;

const skill = ({ controller }) => {
  controller.hears(trigger, sources, (bot, message) => {
    if (!message.match[1]) { bot.reply(message, `Supply me a query, bunhead! :neutral_face:`); return; }

    const error = () => {
      bot.reply(message, `I was unable to parse that query. :face_with_head_bandage:`);
    };

    const { user } = message;
    const [, equation] = message.match;

    wolfram.query(equation, (err, response) => {
      if (err || response.queryresult.$.numpods === '0') { error(); return; }

      let { queryresult: { pod: pods } } = response;

      // Error if pods array is empty
      if (!pods.length) { error(); return; }

      // Map results to get fields we care about
      pods = pods.map(pod => (
        {
          id: pod.$.id,
          title: pod.$.title,
          value: pod.subpod[0].plaintext[0],
          img: pod.subpod[0].img[0].$.src,
        }
      ));

      const attachments = [];

      pods.forEach((pod, i) => {
        const attachment = {
          fallback: `WolframAlpha - ${pod.title} - ${pod.value}`,
          author_name: 'WolframAlpha',
          author_link: 'http://www.wolframalpha.com/',
          author_icon: 'http://www.wolframalpha.com/favicon.ico',
          color: COLORS[i % COLORS.length],
          title: pod.title,
          image_url: pod.img,
        };

        // Swap image for text if no image exists
        if (!pod.img) {
          attachment.text = pod.value;
          delete attachment.image_url;
        }

        attachments.push(attachment);
      });

      bot.reply(message, {
        text: `*WolframAlpha results for "${equation}" via <@${user}>*`,
        attachments,
      });
    });
  });
};

export default skill;
