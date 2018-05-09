module.exports = robot =>
  robot.hear(/good bot/i, res =>
    res.send('/me [wiggles tail]'))