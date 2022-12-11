module.exports = () => {
  return async function(next) {
    await next();
    this.logger.info('log something, then error happend.');
  };
};
