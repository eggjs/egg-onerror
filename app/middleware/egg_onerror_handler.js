'use strict';

const { EggError, ErrorType, InternalServerErrorError } = require('egg-errors');
const accepts = require('accepts');

class UnknownError extends InternalServerErrorError {
  constructor(message) {
    super(message);
    this.message = message;
    this.code = 'UNKNOWN_ERROR';
  }
}

module.exports = (_, app) => {
  const errorHandler = app.config.onerror.errorHandler;
  const acceptFn = app.config.onerror.accepts ||
    ((ctx, ...args) => accepts(ctx.req).type(args));

  return async function onerrorBizHandler(ctx, next) {
    try {
      await next();
    } catch (e) {
      let err = e;
      const errorType = EggError.getType(err);
      switch (errorType) {
        case ErrorType.ERROR: break;
        // if error is an EggError Exception, it will pring error log
        case ErrorType.EXCEPTION: {
          ctx.logger.error(err);
          // force set error status
          err.status = 500;
          break;
        }
        // if error is not recognized by EggError,
        // it will be converted to UnknownError
        case ErrorType.BUILTIN: {
          err = UnknownError.from(err);
          ctx.logger.error(err);
          break;
        }
        // getType not work
        default:
          throw err;
      }

      // handle the error
      const contentType = acceptFn(ctx, 'html', 'text', 'json');

      if (contentType === 'json' && errorHandler.json) {
        await errorHandler.json(ctx, err);
      } else if (contentType === 'text' && errorHandler.text) {
        await errorHandler.text(ctx, err);
      } else if (contentType === 'html' && errorHandler.html) {
        await errorHandler.html(ctx, err);
      } else if (errorHandler.any) {
        await errorHandler.any(ctx, err);
      }
    }
  };
};
