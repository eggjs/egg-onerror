'use strict';

exports.index = async () => {
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

exports.csrf = async () => {
  this.set('x-csrf', this.csrf);
  this.body = 'test';
};

exports.test = async () => {
  const err = new SyntaxError('syntax error');
  if (this.query.status) {
    err.status = Number(this.query.status);
  }
  throw err;
};

exports.jsonp = async () => {
  throw new Error('jsonp error');
};
