'use strict';

exports.onerror = {
  isProd(app) { return app.env === 'prod'; },
};

exports.keys = 'foo,bar';

exports.logger = {
  level: 'NONE',
  consoleLevel: 'NONE',
};
