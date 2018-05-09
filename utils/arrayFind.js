module.exports = (array, key, item) =>
  array.find(single => single[key] === item);
