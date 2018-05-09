module.exports = (bot, user) =>
  new Promise((resolve, reject) => {
    bot.api.users.info({ user }, (err, res) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(res.user);
    });
  });
