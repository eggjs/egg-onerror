'use strict';

exports.logger = {
  level: 'NONE',
  consoleLevel: 'NONE',
};

exports.keys = 'foo,bar';

exports.security = {
  csrf: false,
};

exports.onerror = {
  accepts(ctx, ...args) {
    console.log(ctx.type, ctx.headers);
    const a = ctx.accepts(...args);
    console.log(a, ...args);
    return a;
  },
  application: {
    formatJSON(err) {
      return {
        message: err.message,
        code: err.code,
        status: err.status,
        data: err.data,
      };
    },
    formatText(err) {
      return err.message;
    },
    formatHtml(err) {
      return '<h2>' + err.message + '</h2>';
    },
  },
};
