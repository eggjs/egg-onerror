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

  _isNode(frame) {
    if (frame.isNative()) {
      return true;
    }
    const filename = frame.getFileName() || '';
    return !path.isAbsolute(filename) && filename[0] !== '.';
  }

  _isApp(frame) {
    if (this._isNode(frame)) {
      return false;
    }
    return !((frame.getFileName() || '').indexOf('node_modules' + path.sep) > -1);
  }

  _setAssets(key, value) {
    this.assets.set(key, value);
  }

  _getAssets(key) {
    this.assets.get(key);
  }

  _getFrameSource(frame) {
    const filename = frame.getFileName();
    const lineNumber = frame.getLineNumber();
    let contents = this._getAssets(filename);
    if (!contents) {
      contents = fs.readFileSync(filename, 'utf8');
      this._setAssets(filename, contents);
    }
    const lines = contents.split(/\r?\n/);

    return {
      pre: lines.slice(Math.max(0, lineNumber - (this.codeContext + 1)), lineNumber - 1),
      line: lines[lineNumber - 1],
      post: lines.slice(lineNumber, lineNumber + this.codeContext),
    };
  }

  _parseError() {
    const stack = stackTrace.parse(this.error);
    return stack.map(frame => {
      if (!this._isNode(frame)) {
        frame.context = this._getFrameSource(frame);
      }
      return frame;
    });
  }

  _getContext(frame) {
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

  _getDisplayClasses(frame, index) {
    const classes = [];
    if (index === 0) {
      classes.push('active');
    }

    if (!this._isApp(frame)) {
      classes.push('native-frame');
    }

    return classes.join(' ');
  }

  _complieView(view, data) {
    return Mustache.render(view, data);
  }

  _serializeFrame(frame) {
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
      context: this._getContext(frame),
    };
  }

  _serializeData(stack, callback) {
    callback = callback || this._serializeFrame.bind(this);
    return {
      message: detectErrorMessage(this.ctx, this.error),
      name: this.error.name,
      status: this.error.status,
      frames: stack instanceof Array === true ? stack.filter(frame => frame.getFileName()).map(callback) : [],
    };
  }

  _serializeRequest() {
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

  _serializeAppInfo() {
    return {
      baseDir: this.app.config.baseDir,
      config: util.inspect(this.app.config),
    };
  }

  toJSON() {
    const stack = this._parseError();
    const data = this._serializeData(stack);
    return {
      error: data,
    };
  }

  toHTML() {
    const stack = this._parseError();
    const data = this._serializeData(stack, (frame, index) => {
      const serializedFrame = this._serializeFrame(frame);
      serializedFrame.classes = this._getDisplayClasses(frame, index);
      return serializedFrame;
    });

    data.request = this._serializeRequest();
    data.appInfo = this._serializeAppInfo();

    return this._complieView(viewTemplate, data);
  }
}

module.exports = ErrorView;
