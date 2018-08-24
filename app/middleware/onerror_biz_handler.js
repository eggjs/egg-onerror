'use strict';

const { EggError, ErrorType } = require('egg-errors');
const { accepts } = require('../../lib/utils');

module.exports = (_, app) => {
  const application = app.config.onerror.application;

  return async function onerrorBizHandler(ctx, next) {
    try {
      await next();
    } catch (err) {
      const fn = app.config.onerror.accepts || accepts;
      const contentType = fn(ctx, 'html', 'text', 'json');
      console.info(contentType);
      const type = EggError.getType(err);
      console.log(type);
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
      if (contentType === 'json' && application.formatJSON) {
        ctx.body = application.formatJSON(err);
      } else if (contentType === 'text' && application.formatText) {
        ctx.body = application.formatText(err);
      } else if (contentType === 'html' && application.formatHtml) {
        ctx.body = application.formatHtml(err);
      } else {
        throw err;
      }
    }
  };

};
