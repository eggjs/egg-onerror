'use strict';

module.exports = function* () {
  const err = new Error('test error');
  if (this.query.status) {
    err.status = Number(this.query.status);
  }
  if (this.query.errors) {
    err.errors = this.query.errors;
  }
  throw err;
};
