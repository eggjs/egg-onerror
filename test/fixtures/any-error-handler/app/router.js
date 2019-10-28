'use strict';

const { EggError, EggException } = require('egg-errors');

class CustomError extends EggError {
  constructor(message) {
    super(message);
    this.code = 'CUSTOM_ERROR';
    this.status = 422;
  }
}

class CustomException extends EggException {
  constructor(message) {
    super(message);
    this.code = 'CUSTOM_EXCEPTION';
    this.status = 422;
  }
}

module.exports = app => {
  app.get('/error', async () => {
    throw new Error('error');
  });

  app.get('/egg-error', async () => {
    throw new CustomError('egg error');
  });

  app.get('/egg-exception', async () => {
    throw new CustomException('egg exception');
  });
};
