'use strict';

const fs = require('fs');
const pedding = require('pedding');
const request = require('supertest');
const mm = require('egg-mock');
const rimraf = require('rimraf');
const path = require('path');
const assert = require('assert');


describe('test/lib/plugins/onerror.test.js', () => {
  let app;
  before(() => {
    mm.env('local');
    app = mm.app({ baseDir: 'onerror' });
    return app.ready();
  });

  after(() => app.close());

  afterEach(mm.restore);

  it('should handle error not in the req/res cycle with no ctx', function* () {
    const app = mm.app({
      baseDir: 'mock-test-error',
    });
    yield app.ready();
    const err = new Error('mock test error');
    app.emit('error', err, null);
    err.status = 400;
    app.emit('error', err, null);
    app.close();
  });

  it('should handle status:-1 as status:500', () => {
    return request(app.callback())
    .get('/?status=-1')
    .expect(/<h1 class="box">Error in \/\?status=-1<\/h1>/)
    .expect(500);
  });

  it('should handle status:undefined as status:500', () => {
    return request(app.callback())
    .get('/')
    .expect(/<div class="context">test error<\/div>/)
    .expect(500);
  });

  it('should handle escape xss', () => {
    return request(app.callback())
    .get('/?message=<script></script>')
    .expect(/&lt;script&gt;&lt;\/script&gt;/)
    .expect(500);
  });

  it('should handle status:1 as status:500', () => {
    return request(app.callback())
    .get('/?status=1')
    .expect(/<div class="context">test error<\/div>/)
    .expect(500);
  });

  it('should handle status:400', () => {
    return request(app.callback())
    .get('/?status=400')
    .expect(/<div class="context">test error<\/div>/)
    .expect(400);
  });

  it('should return err.stack', () => {
    return request(app.callback())
    .get('/user.json')
    .set('Accept', 'application/json')
    .expect(/"message":"test error","stack":/)
    .expect(500);
  });

  it('should support custom accpets return err.stack', () => {
    mm(app.config.onerror, 'accepts', ctx => {
      if (ctx.get('x-request-with') === 'XMLHttpRequest') return 'json';
      return 'html';
    });
    return request(app.callback())
    .get('/user.json')
    .set('x-request-with', 'XMLHttpRequest')
    .expect(/"message":"test error","stack":/)
    .expect(500);
  });

  it('should return err.stack when unittest', () => {
    mm(app.config, 'env', 'unittest');
    return request(app.callback())
    .get('/user.json')
    .set('Accept', 'application/json')
    .expect(/"message":"test error","stack":/)
    .expect(500);
  });

  it('should return err status message', () => {
    mm(app.config, 'env', 'prod');
    return request(app.callback())
    .get('/user.json')
    .set('Accept', 'application/json')
    .expect({ message: 'Internal Server Error' })
    .expect(500);
  });

  it('should return err.errors', () => {
    return request(app.callback())
    .get('/user.json?status=400&errors=test')
    .set('Accept', 'application/json')
    .expect(/test/)
    .expect(400);
  });

  it('should return parsing json error', () => {
    return request(app.callback())
    .post('/test?status=400')
    .send({ test: 1 })
    .set('Content-Type', 'application/json')
    .expect(/Problems parsing JSON/)
    .expect(400);
  });

  it('should redirect to error page', () => {
    mm(app.config, 'env', 'test');
    return request(app.callback())
    .get('/?status=500')
    .expect('Location', 'https://eggjs.com/500.html?real_status=500')
    .expect(302);
  });

  it('should handle err code', () => {
    mm(app.config, 'env', 'prod');
    return request(app.callback())
    .get('/?status=400&code=3')
    .expect('Location', 'https://eggjs.com/500.html?real_status=400')
    .expect(302);
  });

  if (process.platform !== 'win32') {
    it('should log warn 4xx', function* () {
      rimraf.sync(path.join(__dirname, 'fixtrues/onerror/logs'));

      const app = mm.app({
        baseDir: 'onerror',
      });
      yield app.ready();
      yield request(app.callback())
      .post('/body_parser')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({ foo: new Buffer(1024 * 100).fill(1).toString() })
      .expect(/request entity too large/)
      .expect(413);
      app.close();

      const warnLog = path.join(__dirname, 'fixtures/onerror/logs/onerror/onerror-web.log');
      assert(/POST \/body_parser] nodejs\.Error: request entity too large/.test(fs.readFileSync(warnLog, 'utf8')));
    });
  }

  describe('no errorpage', () => {
    let app;
    before(() => {
      app = app = mm.app({
        baseDir: 'onerror-no-errorpage',
      });
      return app.ready();
    });
    after(() => app.close());

    it('should display 500 Internal Server Error', () => {
      mm(app.config, 'env', 'prod');
      return request(app.callback())
      .get('/?status=500')
      .expect(500)
      .expect(/Internal Server Error, real status: 500/);
    });
  });

  describe('app.errorpage.url=/500', () => {
    let app;
    before(() => {
      app = app = mm.app({
        baseDir: 'onerror-custom-500',
      });
      return app.ready();
    });
    after(() => app.close());

    it('should redirect to error page', function* () {
      mm(app.config, 'env', 'prod');

      yield request(app.callback())
      .get('/mockerror')
      .expect('Location', '/500?real_status=500')
      .expect(302);

      yield request(app.callback())
      .get('/mock4xx')
      .expect('Location', '/500?real_status=400')
      .expect(302);

      yield request(app.callback())
      .get('/500')
      .expect('hi, this custom 500 page')
      .expect(500);
    });
  });

  describe('onerror.ctx.error', () => {
    let app;
    before(() => {
      app = mm.app({
        baseDir: 'onerror-ctx-error',
      });
      return app.ready();
    });
    after(() => app.close());

    it('should 500', () => {
      return request(app.callback())
      .get('/error')
      .expect(500)
      .expect(/you can`t get userId\./);
    });
  });

  describe('appErrorFilter', () => {
    let app;
    before(() => {
      app = mm.app({
        baseDir: 'custom-listener-onerror',
      });
      return app.ready();
    });
    after(() => app.close());

    it('should ignore error log', () => {
      mm(app.logger, 'log', () => {
        throw new Error('should not excute');
      });

      return request(app.callback())
      .get('/?name=IgnoreError')
      .expect(500);
    });

    it('should custom log error log', done => {
      done = pedding(done, 2);
      mm(app.logger, 'error', err => {
        assert.equal(err, 'error happened');
        done();
      });

      request(app.callback())
      .get('/?name=CustomError')
      .expect(500)
      .then(() => done(), done);
    });

    it('should default log error', done => {
      done = pedding(done, 2);
      mm(app.logger, 'log', (LEVEL, args) => {
        assert.equal(args[0].name, 'OtherError');
        done();
      });

      request(app.callback())
      .get('/?name=OtherError')
      .expect(500)
      .then(() => done(), done);
    });
  });

  describe('agent emit error', () => {
    let app;
    before(done => {
      app = mm.cluster({
        baseDir: 'agent-error',
      });
      setTimeout(done, 5000);
    });
    after(() => app.close());

    it('should log error', () => {
      assert(/nodejs.Error: emit error/.test(app.stderr));
    });
  });
});
