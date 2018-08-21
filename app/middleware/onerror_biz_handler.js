'use strict';

const { EggError, ErrorType } = require('egg-errors');

module.exports = (_, app) => {
  const formatError = app.config.onerror.formatError || defaultFormat;

  return async function onerrorBizHandler(ctx, next) {
    try {
      await next();
    } catch (err) {
      const type = EggError.getType(err);
      switch (type) {
        case ErrorType.ERROR:
          await handleError(ctx, err);
          break;

        case ErrorType.EXCEPTION:
          await handleException(ctx, err);
          break;

        case ErrorType.BUILTIN:
        default:
          throw err;
      }
    }
  };

  async function handleError(ctx, err) {
    ctx.status = err.status || 500;
    ctx.body = formatError(err);
  }

  async function handleException(ctx, err) {
    ctx.logger.error(err);
    err.status = 500;
    ctx.body = formatError(err);
  }

};

function defaultFormat(err) {
  return {
    code: err.code,
    message: err.message,
  };
}
