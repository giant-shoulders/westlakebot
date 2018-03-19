import changeCase from 'change-case';
import feedReader from 'feed-read';
import moment from 'moment';
import { arrayFind, matchers } from '../../utils';

// CONSTANTS CONFIG
const EXPIRE_DAYS = 14; // Days to cache read posts
const MULTI_ARTICLE_DELAY = 3 * 1000; // Delay to wait between posting multiple articles (3 seconds default)
const POLL_DELAY = 10 * 60 * 1000; // Delay to check polls (10 mins default)

// Add / Remove Feed Admins - Future Feature
// const triggerAddAdmin = `^!feed addAdmin(?: (${matchers.USER_TAG}))$`;
// const triggerRemoveAdmin = `^!feed removeAdmin(?: (${matchers.USER_TAG}))$`;

// Help / Add / Remove / List Feeds
const triggerHelpFeed = `^!feed(?: help)?$`;
const triggerAddFeed = `^!feed (?:add|a)(?: ([a-zA-Z-_]+) (?:${matchers.CHANNEL_TAG}) (?:${matchers.URL}))$`;
const triggerRemoveFeed = `^!feed (?:remove|rm)(?: ([a-zA-Z-_]+))$`;
const triggerListFeed = `^!feed (?:list|ls)$`;

// Skill Source
const sources = ['ambient'];

// Helpers
let running = false;
let timer;

// Get all channel storage and concat feeds for checking uniqueness
const getAllFeeds = (controller) => {
  const promise = new Promise((resolve, reject) => {
    controller.storage.channels.all((err, data = []) => {
      if (err) { return reject(`Something went wrong getting the feeds. :face_with_head_bandage:`); }

      const feeds = data.reduce((result, channel) => (
        result.concat(channel.feeds || [])
      ), []);

      return resolve(feeds);
    });
  });

  return promise;
};

// Send feed poll to it's specific channel
const sendPoll = (feed, article, bot) => (
  () => {
    const author = (article.author) ? article.author : 'Unknown Author';
    let publishedDate = (article.published) ? moment(article.published) : moment();
    publishedDate = publishedDate.format('MMMM Do YYYY h:mm a');

    bot.say({
      text: `
*New Article* _from_ *${changeCase.title(article.feed.name || feed.id)} (${feed.id})*:
_*${article.title}*_
_${publishedDate} - ${author}_
${article.link}
      `,
      channel: feed.channelId,
    });
  }
);

// Update link of article to most recent polled article
const updateMostRecent = (controller, feed, articles) => {
  const promise = new Promise((resolve, reject) => {
    controller.storage.channels.get(feed.channelId, (getErr, data = {}) => {
      if (getErr) { reject(`Something went wrong getting the feed for *${feed.id}* :face_with_head_bandage:`); return; }

      const feeds = data.feeds || [];
      const currentFeed = feeds.find(curr => curr.id === feed.id);
      const currentFeedIndex = feeds.indexOf(currentFeed);

      // Couldn't find feed by id, error out
      if (!currentFeed) { reject(`Something went wrong getting the feed for *${feed.id}* :face_with_head_bandage:`); return; }

      let updatedReads = currentFeed.readArticles;

      // Kill any expired (14 days) read posts to save space
      updatedReads = updatedReads.filter(readArticle => {
        const readDate = moment(readArticle.expires);
        return moment().diff(readDate) < 0;
      });

      // Add new ones
      articles.forEach(article => {
        updatedReads.push({
          id: article.link,
          expires: moment().add(EXPIRE_DAYS, 'days').toISOString(),
        });
      });

      // Update Most Recent Article
      currentFeed.readArticles = updatedReads;
      feeds[currentFeedIndex] = currentFeed;

      controller.storage.channels.save({ id: feed.channelId, feeds }, (saveErr) => {
        if (saveErr) { reject(`Something went wrong getting the feed for *${feed.id}* :face_with_head_bandage:`); return; }
        resolve();
      });
    });
  });

  return promise;
};

// Polling feeds
const pollAllFeeds = (controller, bot) => {
  let delay = 0;

  const pollFeeds = (feeds) => {
    if (timer) { clearTimeout(timer); }

    feeds.forEach(feed => {
      feedReader(feed.url, (err, articles) => {
        if (err) { bot.say({ text: `Something went wrong getting the feed for *${feed.id}* :face_with_head_bandage:`, channel: feed.channelId }); }

        const allArticles = articles;
        let unreadArticles = [];

        allArticles.forEach(article => {
          if (!arrayFind(feed.readArticles, 'id', article.link)) {
            unreadArticles.push(article);
          }
        });

        // Save Most Recent Link
        if (unreadArticles.length) {
          // Update Most Recent as first item
          updateMostRecent(controller, feed, unreadArticles).then(() => {
            // Reverse from new -> old to old -> new
            unreadArticles = unreadArticles.reverse();

            // Set Timeouts
            unreadArticles.forEach(article => {
              setTimeout(sendPoll(feed, article, bot), delay);
              delay += MULTI_ARTICLE_DELAY;
            });
          }).catch(updateErr => bot.say({ text: updateErr, channel: feed.channelId }));
        }
      });
    });

    // Set our timer
    timer = setTimeout(() => {
      pollAllFeeds(controller, bot);
    }, POLL_DELAY);
  };

  getAllFeeds(controller)
    .then(pollFeeds);
};

//
//
// Our Skill
const skill = ({ controller }) => {
  //
  //
  // Get any new feeds on app start and setup timeout
  controller.middleware.receive.use((bot, message, next) => {
    if (!running) {
      running = true;
      pollAllFeeds(controller, bot);
    }

    next();
  });

  //
  //
  // Feed Help
  controller.hears(triggerHelpFeed, sources, (bot, message) => {
    const formattedCommands = [];

    formattedCommands.push(`\n*Add New Feed*\n\`!feed add feed-name #channel http://feed.com/feed.xml\`\n_Aliases: add, a_`);
    formattedCommands.push(`\n*Remove Existing Feed*\n\`!feed remove feed-name\`\n_Aliases: remove, rm_`);
    formattedCommands.push(`\n*List All Feeds*\n\`!feed list\`\n_Aliases: list, ls_`);

    bot.reply(message, {
      attachments: [{
        fallback: 'Feed Help - Listed Commands',
        title: 'Feed Help',
        text: `Here's my commands so far:\n${formattedCommands.join('\n')}`,
        color: '#439FE0',
        mrkdwn_in: ['text'],
      }],
    });
  });

  //
  //
  // Add Feed - !feed add feedName #channel-name http://feed.com/feed.xml
  controller.hears(triggerAddFeed, sources, (bot, message) => {
    const { user } = message;
    const [, feedId, channelId, feedUrl] = message.match;

    const checkValidity = (response) => {
      const feeds = response;

      const foundFeedId = feeds.find(feed => feed.id === feedId);
      const foundFeedUrl = feeds.find(feed => feed.url === feedUrl);

      // Feed ID Already Exists
      if (foundFeedId) {
        return Promise.reject(`Sorry, a feed with that name already exists! :raging:\n*${foundFeedId.id}* - ${foundFeedId.url}`);
      }

      // Feed URL Already Exists
      if (foundFeedUrl) {
        return Promise.reject(`Sorry, a feed with that url already exists! :raging:\n*${foundFeedUrl.id}* - ${foundFeedUrl.url}`);
      }

      return feeds;
    };

    const createFeed = (response) => {
      const promise = new Promise((resolve, reject) => {
        controller.storage.channels.get(channelId, (getErr, data = {}) => {
          const feeds = data.feeds || [];

          feeds.push({
            id: feedId,
            url: feedUrl,
            channelId,
            user,
            createdDate: moment().toISOString(),
            readArticles: [],
          });

          controller.storage.channels.save({ id: channelId, feeds }, (saveErr) => {
            if (saveErr) { return reject(`Something went wrong getting the feeds. :face_with_head_bandage:`); }

            bot.reply(message, {
              attachments: [{
                fallback: `Feed Added - ${feedId}`,
                title: 'Feed Added Successfully! :partyparrot:',
                text: `The feed *${feedId}* was successfully added to the channel <#${channelId}> and is being sourced from the feed at <${feedUrl}>.`,
                color: 'good',
                mrkdwn_in: ['text'],
              }],
            });

            return resolve(response);
          });
        });
      });

      return promise;
    };

    const repollFeeds = () => (
      pollAllFeeds(controller, bot)
    );

    getAllFeeds(controller)
      .then(checkValidity)
      .then(createFeed)
      .then(repollFeeds)
      .catch(error => bot.reply(message, error));
  });

  //
  //
  // Remove Feed - !feed remove feedName
  controller.hears(triggerRemoveFeed, sources, (bot, message) => {
    const [, feedId] = message.match;

    const checkValidity = (response) => {
      const feeds = response;
      const foundFeed = feeds.find(feed => feed.id === feedId);

      if (!foundFeed) {
        return Promise.reject(`Sorry, I couldn't find a feed with that name! :raging:`);
      }

      return foundFeed;
    };

    const removeFeed = (response) => {
      const foundFeed = response;

      const promise = new Promise((resolve, reject) => {
        controller.storage.channels.get(foundFeed.channelId, (getErr, data = {}) => {
          let feedsUpdate = data.feeds || [];
          feedsUpdate = feedsUpdate.filter(feed => feed.id !== feedId);

          controller.storage.channels.save({ id: foundFeed.channelId, feeds: feedsUpdate }, (saveErr) => {
            if (saveErr) { return reject(`Something went wrong with removing that feed. :face_with_head_bandage:`); }

            bot.reply(message, {
              attachments: [{
                fallback: `Feed Removed - ${feedId}`,
                title: 'Feed Removed Successfully! :sadparrot:',
                text: `The feed *${feedId}* was removed successfully!`,
                color: 'danger',
                mrkdwn_in: ['text'],
              }],
            });

            return resolve(response);
          });
        });
      });

      return promise;
    };

    getAllFeeds(controller)
      .then(checkValidity)
      .then(removeFeed)
      .catch(error => bot.reply(message, error));
  });

  //
  //
  // List Feeds - !feed list
  controller.hears(triggerListFeed, sources, (bot, message) => {
    const listFeeds = (response) => {
      const feeds = response;
      const formattedFeeds = [];

      feeds.forEach(feed => {
        let createdDate = moment(feed.createdDate);
        createdDate = createdDate.year() < moment().year() ? createdDate.format('MMMM Do, YYYY') : createdDate.format('MMMM Do');
        formattedFeeds.push(`\n*${feed.id}* in *<#${feed.channelId}>* via *<@${feed.user}>*\n_Created on ${createdDate}_\n${feed.url}`);
      });

      if (!feeds.length) {
        formattedFeeds.push(`\n*None! Why not add some?!*`);
      }

      bot.reply(message, {
        attachments: [{
          fallback: 'Atom/RSS Feed Directory Listed',
          title: 'Atom/RSS Feed Directory Listing',
          text: `Here's all the feeds that I'm aware of so far, you may have to click 'Show more...' to view them all:\n${formattedFeeds.join('\n')}`,
          color: '#439FE0',
          mrkdwn_in: ['text'],
        }],
      });

      return response;
    };

    getAllFeeds(controller)
      .then(listFeeds)
      .catch(err => bot.reply(message, err));
  });
};

export default skill;
