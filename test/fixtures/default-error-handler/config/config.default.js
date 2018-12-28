'use strict';

exports.onerror = {
  errorHandler: {
    enable: true,
    any: (ctx, err) => {
      ctx.status = err.status;
      ctx.body = {
        code: err.code,
        message: 'any ' + err.message,
      };
    },
  },
};

exports.keys = 'foo,bar';
