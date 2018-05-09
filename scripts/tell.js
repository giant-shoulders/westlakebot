const matchers = require('./helpers/matchers');

module.exports = robot => {
  // const room = 'giantbots';

  robot.hear(new RegExp(`tell ([@#]${matchers.name}) (.*)`, 'i'), res => {
    const [,nameOrChannel, message] = res.match;
    console.log({ nameOrChannel, message });
    robot.messageRoom(nameOrChannel, message);
  })
}