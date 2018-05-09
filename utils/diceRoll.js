module.exports = ({ count = 1, sides = 6 }) => {
  const rolls = [];

  for (let i = 0; i < count; i += 1) {
    rolls.push(Math.floor(Math.random() * sides) + 1);
  }

  return rolls;
};
