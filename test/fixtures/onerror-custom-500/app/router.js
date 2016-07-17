module.exports = function(app) {
  app.get('/mockerror', function*() {
    hi.foo();
  });

  app.get('/mock4xx', function*() {
    const err = new Error('4xx error');
    err.status = 400;
    throw err;
  });

  app.get('/500', function*() {
    this.status = 500;
    this.body = 'hi, this custom 500 page';
  });
};
