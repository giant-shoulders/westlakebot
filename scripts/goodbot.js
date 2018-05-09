module.exports = robot =>
  robot.hear(/good bot/i, res =>
    res.send('_[tail wiggles a bit]_'))