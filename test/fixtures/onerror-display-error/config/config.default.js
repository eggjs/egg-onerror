'use strict';

exports.keys = 'foo,bar';
exports.onerror = {
  displayErrors: process.env.SHOW_ERRORS - 1 === 0,
};
