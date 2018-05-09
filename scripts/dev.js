module.exports = robot => {
  robot.hear(/channel id/i, res => {
    res.reply(res.envelope.room);
  });

  robot.hear(/my id/i, res => {
    res.reply(res.envelope.user.id);
  });
};
