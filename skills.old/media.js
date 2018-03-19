import request from 'request-promise';

const API_ROUTE = `http://www.omdbapi.com/?t={title}&type={type}&plot=full&tomatoes=true`;
const COLOR = '#00a388';

const triggerMovie = `^!(?:movie|imdb|film)(?: (.+))$`;
const triggerTelevision = `^!(?:tv|show)(?: (.+))$`;
const sources = ['ambient'];

const skill = ({ controller }) => {
  const error = (bot, message) => {
    bot.reply(message, `Couldn't find that one, sorry. :face_with_head_bandage:`);
  };

  const search = (title, type) => {
    const args = {
      method: 'GET',
      uri: API_ROUTE.format({ title, type }),
      json: true,
    };

    return request(args);
  };

  controller.hears(triggerMovie, sources, (bot, message) => {
    if (!message.match[1]) { bot.reply(message, `Supply me a title, bunhead! :neutral_face:`); return; }

    const { user } = message;
    const [, title] = message.match;

    search(title, 'movie').then(response => {
      if (!response || response.Response === 'False') { error(bot, message); return; }

      const timestamp = Math.floor(Date.now() / 1000);

      const attachment = {
        fallback: `Movie Search for "${title}" - Release Date: ${response.Released} - Runtime: ${response.Runtime}`,
        color: COLOR,
        author_name: `Open Movie Database`,
        author_link: `http://www.omdbapi.com/`,
        author_icon: `http://www.omdbapi.com/favicon.ico`,
        title: `${response.Title} (${response.Rated}, ${response.Year})`,
        pretext: `*Movie search for "${title}" via <@${user}>*`,
        text: response.Plot,
        thumb_url: response.Poster,
        ts: timestamp,
        fields: [{
          title: 'Release Date',
          value: response.Released,
          short: true,
        }, {
          title: 'Runtime',
          value: response.Runtime,
          short: true,
        }, {
          title: 'Production',
          value: response.Production,
          short: true,
        }, {
          title: 'Genre',
          value: response.Genre,
          short: true,
        }, {
          title: 'Language',
          value: response.Language,
          short: true,
        }, {
          title: 'IMDb Rating',
          value: response.imdbRating,
          short: true,
        }, {
          title: 'IMDb Votes',
          value: response.imdbVotes,
          short: true,
        }, {
          title: 'Tomato Meter',
          value: response.tomatoMeter,
          short: true,
        }, {
          title: 'Tomato User Meter',
          value: response.tomatoUserMeter,
          short: true,
        }, {
          title: 'Tomato URL',
          value: response.tomatoURL,
          short: false,
        }],
        mrkdwn_in: ['pretext'],
      };

      bot.reply(message, {
        attachments: [attachment],
      });
    });
  });

  controller.hears(triggerTelevision, sources, (bot, message) => {
    if (!message.match[1]) { bot.reply(message, `Supply me a title, bunhead! :neutral_face:`); return; }

    const { user } = message;
    const [, title] = message.match;

    search(title, 'series').then(response => {
      if (!response || response.Response === 'False') { error(bot, message); return; }

      const timestamp = Math.floor(Date.now() / 1000);

      const attachment = {
        fallback: `Television Search for "${title}" - Release Date: ${response.Released} - Total Season: ${response.totalSeasons}`,
        color: COLOR,
        author_name: `Open Movie Database`,
        author_link: `http://www.omdbapi.com/`,
        author_icon: `http://www.omdbapi.com/favicon.ico`,
        title: `${response.Title} (${response.Rated}, ${(response.Year.endsWith('–')) ? `${response.Year}Ongoing` : response.Year})`,
        pretext: `*Television search for "${title}" via <@${user}>*`,
        text: response.Plot,
        thumb_url: response.Poster,
        ts: timestamp,
        fields: [{
          title: 'Release Date',
          value: response.Released,
          short: true,
        }, {
          title: 'Total Seasons',
          value: response.totalSeasons,
          short: true,
        }, {
          title: 'Runtime',
          value: response.Runtime,
          short: true,
        }, {
          title: 'Genre',
          value: response.Genre,
          short: true,
        }, {
          title: 'Language',
          value: response.Language,
          short: true,
        }, {
          title: 'IMDb Rating',
          value: response.imdbRating,
          short: true,
        }, {
          title: 'IMDb Votes',
          value: response.imdbVotes,
          short: true,
        }],
        mrkdwn_in: ['pretext'],
      };

      bot.reply(message, {
        attachments: [attachment],
      });
    });
  });
};

export default skill;
