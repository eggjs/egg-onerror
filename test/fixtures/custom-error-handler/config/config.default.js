'use strict';

exports.onerror = {
  errorHandler: {
    enable: true,
    json: (ctx, err) => {
      ctx.status = err.status || 500;
      ctx.body = {
        code: err.code,
        message: 'custom ' + err.message,
      };
    },
    text: (ctx, err) => {
      ctx.status = err.status || 500;
      ctx.body = 'custom ' + err.message;
    },
    html: (ctx, err) => {
      ctx.status = err.status || 500;
      ctx.body = `<h2>${err.code}</h2>\n<div>custom ${err.message}</div>`;
    },
    any: null,
  },
};

exports.keys = 'foo,bar';
