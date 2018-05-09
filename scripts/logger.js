module.exports = robot => {
  const logChannel = process.env.HUBOT_LOG_CHANNEL;

  if (logChannel) {
    robot.listenerMiddleware((context, next, done) => {
      const { user, text } = context.response.message;
      const [, ...commandParts] = text.split(' ');
      const command = commandParts.join(' ');

      context.response.messageChannel(logChannel, `${user.name}: ${command}`);

      next();
    });
  }
};
