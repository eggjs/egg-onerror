'use strict';
const path = require('path');

exports.onerror = {
  // 5xx error will redirect to ${errorPageUrl}
  // won't redirect in local env
  errorPageUrl: '',
  // will excute `appErrorFilter` when emit an error in `app`
  // If `appErrorFilter` return false, egg-onerror won't log this error.
  // You can logging in `appErrorFilter` and return false to override the default error logging.
  appErrorFilter: null,
  // default template path
  templatePath: path.join(__dirname, '../lib/onerror_page.mustache'),
  // handler your error response
  errorHandler: {
    enable: false,
    json: (ctx, err) => {
      ctx.status = err.status || 500;
      ctx.body = {
        code: err.code,
        message: err.message,
      };
    },
    text: (ctx, err) => {
      ctx.status = err.status || 500;
      ctx.body = err.message;
    },
    html: (ctx, err) => {
      ctx.status = err.status || 500;
      ctx.body = `<h2>${err.code}</h2>\n<div>${err.message}</div>`;
    },
    any: null,
  },
};
