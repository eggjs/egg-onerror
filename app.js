'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const util = require('util');
const onerror = require('koa-onerror');
const escapeHTML = require('escape-html');

module.exports = app => {
  // logging error
  const config = app.config.onerror;
  app.on('error', (err, ctx) => {
    ctx = ctx || app.createAnonymousContext();
    if (config.appErrorFilter && !config.appErrorFilter(err, ctx)) return;

    const status = detectStatus(err);
    // 5xx
    if (status >= 500) {
      try {
        ctx.logger.error(err);
      } catch (ex) {
        app.logger.error(err);
        app.logger.error(ex);
      }
      return;
    }

    // 4xx
    try {
      ctx.logger.warn(err);
    } catch (ex) {
      app.logger.warn(err);
      app.logger.error(ex);
    }
  });

  onerror(app, {
    // support customize accepts function
    accepts() {
      const fn = config.accepts || accepts;
      return fn(this);
    },

    html(err) {
      const status = detectStatus(err);
      const code = err.code || err.type;
      let message = detectErrorMessage(this, err);
      const errorPageUrl = config.errorPageUrl;
      // keep the real response status
      this.realStatus = status;
      if (code) {
        message = `${message} (code: ${code})`;
      }
      // don't respond any error message in production env
      if (isProd(app)) {
        if (errorPageUrl) {
          const statusQuery = (errorPageUrl.indexOf('?') > 0 ? '&' : '?') + `real_status=${status}`;
          return this.redirect(errorPageUrl + statusQuery);
        }
        this.status = 500;
        this.body = `<h2>Internal Server Error, real status: ${status}</h2>`;
        return;
      }
      // provide detail error message in local env
      const locals = {
        title: err.name,
        url: this.url,
        message,
        errStack: err.stack,
        hostname: this.hostname,
        ip: this.ip,
        query: util.inspect(this.query),
        userAgent: this.header['user-agent'],
        accept: this.header.accept,
        cookie: util.inspect(this.header.cookie),
        session: '',
        coreName: this.app.poweredBy,
        baseDir: this.app.config.baseDir,
        config: util.inspect(this.app.config),
      };
      const errorPagePath = path.join(__dirname, 'onerror_page.html');
      const errorPage = fs.readFileSync(errorPagePath, 'utf8');
      this.body = errorPage.replace(/{{ (\w+) }}/g, (_, key) => {
        return escapeHTML(String(locals[key]));
      });
    },

    json(err) {
      const status = detectStatus(err);
      const code = err.code || err.type;
      const message = detectErrorMessage(this, err);
      this.status = status;

      this.body = {
        code,
        message,
      };

      // 5xx server side error
      if (status >= 500) {
        if (isProd(app)) {
          // don't respond any error message in production env
          this.body.message = http.STATUS_CODES[status];
        } else {
          // provide detail error stack in local env
          this.body.stack = err.stack;
        }
        return;
      }

      // 4xx client side error
      // addition `errors`
      this.body.errors = err.errors;
    },
  });
};

function detectErrorMessage(ctx, err) {
  // detect json parse error
  if (err.status === 400 &&
      err.name === 'SyntaxError' &&
      ctx.request.is('application/json', 'application/vnd.api+json', 'application/csp-report')) {
    return 'Problems parsing JSON';
  }
  return err.message;
}

function detectStatus(err) {
  // detect status
  let status = err.status || 500;
  if (status < 200) {
    // invalid status consider as 500, like urllib will return -1 status
    status = 500;
  }
  return status;
}

function accepts(ctx) {
  if (ctx.acceptJSON) return 'json';
  return 'html';
}

function isProd(app) {
  return app.config.env !== 'local' && app.config.env !== 'unittest';
}
