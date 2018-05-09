String.prototype.format = function format(...args) {
  let self = this.toString();

  if (!args.length) {
    return self;
  }

  const replacers = args.shift();
  if (typeof replacers !== 'object') {
    throw new Error('String.format expected an object as the first parameter');
  }

  Object.keys(replacers).forEach(key => {
    self = self.replace(new RegExp(`\{${key}\}`, 'gi'), replacers[key]);
  });

  return self;
};
