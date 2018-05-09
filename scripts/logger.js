module.exports = robot =>
  robot.listenerMiddleware((context, next, done) => {
    const { user, text } = context.response.message;
    const [, ...commandParts] = text.split(' ');
    const command = commandParts.join(' ');
    robot.logger.info(`${user.name}: ${command}`);
    next();
  });
