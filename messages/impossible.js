module.exports = user => {
  const message = ["I'm afraid I can't do that"];

  if (user) {
    message.push(`, <@${user}>.`);
  } else {
    message.push('.');
  }

  return message.join('');
};
