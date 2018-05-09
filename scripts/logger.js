module.exports = robot => {
  const logChannel = process.env.HUBOT_LOG_CHANNEL;

  if (logChannel) {
    robot.receiveMiddleware((context, next, done) => {
      const { user, text, room } = context.response.message;

      if (text && room !== logChannel && text.match(robot.respondPattern(''))) {
        robot.messageRoom(
          logChannel,
          `<@${user.id}>: ${text
            .split(' ')
            .slice(1)
            .join(' ')}`
        );
      }

      next();
    });
  }
};
