module.exports = robot => {
  const logChannel = process.env.HUBOT_LOG_CHANNEL;

  if (logChannel) {
    robot.listenerMiddleware((context, next, done) => {
      const { user, text } = context.response.message;
      robot.messageChannel(logChannel, `${user.name}: ${text}`);
      next();
    });
  }
};
