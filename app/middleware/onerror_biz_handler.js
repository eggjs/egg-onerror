'use strict';

const { EggError, ErrorType } = require('egg-errors');
const { accepts } = require('./lib/utils');

module.exports = (_, app) => {
  const biz = app.config.onerror.biz;

  return async function onerrorBizHandler(ctx, next) {
    try {
      await next();
    } catch (err) {
      const fn = app.config.onerror.accepts || accepts;
      const contentType = fn(ctx);

      const type = EggError.getType(err);
      switch (type) {
        case ErrorType.ERROR: {
          ctx.status = err.status || 500;
          ctx.body = format(err, contentType);
          break;
        }

        case ErrorType.EXCEPTION: {
          ctx.logger.error(err);
          err.status = 500;
          ctx.body = format(err, contentType);
          break;
        }

        case ErrorType.BUILTIN:
        default:
          throw err;
      }
    }

    function format(err, contentType) {
      if (contentType === 'json' && biz.formatJSON) {
        ctx.body = biz.formatJSON(err);
      if (contentType === 'text' && biz.formatText) {
        ctx.body = biz.formatText(err);
      if (contentType === 'html' && biz.formatHtml) {
        ctx.body = biz.formatHtml(err);
      } else {
        ctx.body = defaultFormat(err);
      }
    }
  };

};

function defaultFormat(err) {
  return {
    code: err.code,
    message: err.message,
  };
}
