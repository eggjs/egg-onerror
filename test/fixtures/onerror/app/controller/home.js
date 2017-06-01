'use strict';

exports.index = function* () {
  const err = new Error('test error');
  if (this.query.code) {
    err.code = this.query.code;
  }
  if (this.query.status) {
    err.status = Number(this.query.status);
  }
  if (this.query.message) {
    err.message = this.query.message;
  }
  throw err;
};

exports.csrf = function* () {
  this.set('x-csrf', this.csrf);
  this.body = 'test';
};

exports.test = function* () {
  const err = new SyntaxError('syntax error');
  if (this.query.status) {
    err.status = Number(this.query.status);
  }
  throw err;
};
