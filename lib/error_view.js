'use strict';

// modify from https://github.com/poppinss/youch/blob/develop/src/Youch/index.js

const fs = require('fs');
const path = require('path');
const cookie = require('cookie');
const Mustache = require('mustache');
const stackTrace = require('stack-trace');
const util = require('util');

const { detectErrorMessage } = require('./utils');

const startingSlashRegex = /\\|\//;
const VIEW_PATH = '../onerror_page.mustache';
const viewTemplate = fs.readFileSync(path.join(__dirname, VIEW_PATH), 'utf8');

class ErrorView {
  constructor(ctx, error) {
    this.codeContext = 5;
    this._filterHeaders = [ 'cookie', 'connection' ];

    this.ctx = ctx;
    this.error = error;
    this.request = ctx.request;
    this.app = ctx.app;
    this.assets = new Map();
  }

  /**
   * get json error
   *
   * @return {Object} error object
   *
   * @memberOf ErrorView
   */
  toJSON() {
    const stack = this.parseError();
    const data = this.serializeData(stack, (frame, index) => {
      return this.serializeFrame(frame);
    });
    return {
      error: data,
    };
  }

  /**
   * get html error page
   *
   * @return {String} html page
   *
   * @memberOf ErrorView
   */
  toHTML() {
    const stack = this.parseError();
    const data = this.serializeData(stack, (frame, index) => {
      const serializedFrame = this.serializeFrame(frame);
      serializedFrame.classes = this.getDisplayClasses(frame, index);
      return serializedFrame;
    });

    data.request = this.serializeRequest();
    data.appInfo = this.serializeAppInfo();

    return this.complieView(viewTemplate, data);
  }

  isNode(frame) {
    if (frame.isNative()) {
      return true;
    }
    const filename = frame.getFileName() || '';
    return !path.isAbsolute(filename) && filename[0] !== '.';
  }

  isApp(frame) {
    if (this.isNode(frame)) {
      return false;
    }
    return !((frame.getFileName() || '').indexOf('node_modules' + path.sep) > -1);
  }

  setAssets(key, value) {
    this.assets.set(key, value);
  }

  getAssets(key) {
    this.assets.get(key);
  }

  getFrameSource(frame) {
    const filename = frame.getFileName();
    const lineNumber = frame.getLineNumber();
    let contents = this.getAssets(filename);
    if (!contents) {
      contents = fs.readFileSync(filename, 'utf8');
      this.setAssets(filename, contents);
    }
    const lines = contents.split(/\r?\n/);

    return {
      pre: lines.slice(Math.max(0, lineNumber - (this.codeContext + 1)), lineNumber - 1),
      line: lines[lineNumber - 1],
      post: lines.slice(lineNumber, lineNumber + this.codeContext),
    };
  }

  parseError() {
    const stack = stackTrace.parse(this.error);
    return stack.map(frame => {
      if (!this.isNode(frame)) {
        frame.context = this.getFrameSource(frame);
      }
      return frame;
    });
  }

  getContext(frame) {
    if (!frame.context) {
      return {};
    }

    return {
      start: frame.getLineNumber() - (frame.context.pre || []).length,
      pre: frame.context.pre.join('\n'),
      line: frame.context.line,
      post: frame.context.post.join('\n'),
    };
  }

  getDisplayClasses(frame, index) {
    const classes = [];
    if (index === 0) {
      classes.push('active');
    }

    if (!this.isApp(frame)) {
      classes.push('native-frame');
    }

    return classes.join(' ');
  }

  complieView(view, data) {
    return Mustache.render(view, data);
  }

  serializeFrame(frame) {
    const filename = frame.getFileName();
    const relativeFileName = filename.indexOf(process.cwd()) > -1
      ? filename.replace(process.cwd(), '').replace(startingSlashRegex, '')
      : filename;
    const extname = path.extname(filename).replace('.', '');

    return {
      extname,
      file: relativeFileName,
      method: frame.getFunctionName(),
      line: frame.getLineNumber(),
      column: frame.getColumnNumber(),
      context: this.getContext(frame),
    };
  }

  serializeData(stack, fomatter) {
    const code = this.error.code || this.error.type;
    let message = detectErrorMessage(this.ctx, this.error);
    if (code) {
      message = `${message} (code: ${code})`;
    }
    return {
      message,
      name: this.error.name,
      status: this.error.status,
      frames: stack instanceof Array ? stack.filter(frame => frame.getFileName()).map(fomatter) : [],
    };
  }

  serializeRequest() {
    const headers = [];

    Object.keys(this.request.headers).forEach(key => {
      if (this._filterHeaders.indexOf(key) > -1) {
        return;
      }
      headers.push({
        key,
        value: this.request.headers[key],
      });
    });

    const parsedCookies = cookie.parse(this.request.headers.cookie || '');
    const cookies = Object.keys(parsedCookies).map(key => {
      return { key, value: parsedCookies[key] };
    });

    return {
      url: this.request.url,
      httpVersion: this.request.httpVersion,
      method: this.request.method,
      connection: this.request.headers.connection,
      headers,
      cookies,
    };
  }

  serializeAppInfo() {
    return {
      baseDir: this.app.config.baseDir,
      config: util.inspect(this.app.config),
    };
  }
}

module.exports = ErrorView;
