const matchers = require('./helpers/matchers');

module.exports = robot =>
  robot.hear(new RegExp(`tell ([@#]?${matchers.name}) (.*)`, 'i'), res => {
    const [,nameOrChannel, message] = res.match;
    robot.messageRoom(nameOrChannel, message);
  });
