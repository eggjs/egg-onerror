'use strict';

const fs = require('fs');
const should = require('should');
const pedding = require('pedding');
const request = require('supertest');
const mm = require('egg-mock');
const rimraf = require('rimraf');
const path = require('path');

describe('test/lib/plugins/onerror.test.js', () => {
  let app;
  before(done => {
    mm(process.env, 'EGG_SERVER_ENV', 'local');
    app = mm.app({ baseDir: 'onerror' });
    app.ready(done);
  });

  afterEach(mm.restore);

  it('should handle status:-1 as status:500', done => {
    request(app.callback())
    .get('/?status=-1')
    .expect(/<h1 class="box">Error in \/\?status=\-1<\/h1>/)
    .expect(500, done);
  });

  it('should handle status:undefined as status:500', done => {
    request(app.callback())
    .get('/')
    .expect(/<div class="context">test error<\/div>/)
    .expect(500, done);
  });

  it('should handle escape xss', done => {
    request(app.callback())
    .get('/?message=<script></script>')
    .expect(/&lt;script&gt;&lt;\/script&gt;/)
    .expect(500, done);
  });

  it('should handle status:1 as status:500', done => {
    request(app.callback())
    .get('/?status=1')
    .expect(/<div class="context">test error<\/div>/)
    .expect(500, done);
  });

  it('should handle status:400', done => {
    request(app.callback())
    .get('/?status=400')
    .expect(/<div class="context">test error<\/div>/)
    .expect(400, done);
  });

  it('should return err.stack', done => {
    request(app.callback())
    .get('/user.json')
    .expect(/"message":"test error","stack":/)
    .expect(500, done);
  });

  it('should return err.stack when unittest', done => {
    mm(app.config, 'env', 'unittest');
    request(app.callback())
    .get('/user.json')
    .expect(/"message":"test error","stack":/)
    .expect(500, done);
  });

  it('should return err status message', done => {
    mm(app.config, 'env', 'prod');
    request(app.callback())
    .get('/user.json')
    .expect({ message: 'Internal Server Error' })
    .expect(500, done);
  });

  it('should return err.errors', done => {
    request(app.callback())
    .get('/user.json?status=400&errors=test')
    .expect(/test/)
    .expect(400, done);
  });

  it('should return parsing json error', done => {
    request(app.callback())
    .post('/test?status=400')
    .send({ test: 1 })
    .set('Content-Type', 'application/json')
    .expect(/Problems parsing JSON/)
    .expect(400, done);
  });

  it('should redirect to error page', done => {
    mm(app.config, 'env', 'test');
    request(app.callback())
    .get('/?status=500')
    .expect('Location', 'http://alipay.com/500.html?real_status=500')
    .expect(302, done);
  });

  it('should handle err code', done => {
    mm(app.config, 'env', 'prod');
    request(app.callback())
    .get('/?status=400&code=3')
    .expect('Location', 'http://alipay.com/500.html?real_status=400')
    .expect(302, done);
  });

  it('should log warn 4xx', done => {
    rimraf.sync(path.join(__dirname, 'fixtrues/onerror/logs'));

    const app = mm.app({
      baseDir: 'onerror',
    });
    request(app.callback())
    .post('/body_parser')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({ foo: new Buffer(1024 * 100).fill(1).toString() })
    .expect(/request entity too large/)
    .expect(413, function(err) {
      should.not.exists(err);

      const warnLog = path.join(__dirname, 'fixtures/onerror/logs/onerror/onerror-web.log');
      fs.readFileSync(warnLog, 'utf8').should.match(/POST \/body_parser] nodejs.Error: request entity too large/);

      done();
    });
  });

  it('should handle error not in the req/res cycle with no ctx', () => {
    const err = new Error('test error');
    app.emit('error', err, null);
    err.status = 400;
    app.emit('error', err, null);
  });

  describe('no errorpage', () => {
    let app;
    before(done => {
      app = app = mm.app({
        baseDir: 'onerror-no-errorpage',
      });
      app.ready(done);
    });
    it('should display 500 Internal Server Error', done => {
      mm(app.config, 'env', 'prod');
      request(app.callback())
      .get('/?status=500')
      .expect(500)
      .expect(/Internal Server Error/, done);
    });
  });

  describe('app.errorpage.url=/500', () => {
    let app;
    before(done => {
      app = app = mm.app({
        baseDir: 'onerror-custom-500',
      });
      app.ready(done);
    });

    it('should redirect to error page', done => {
      done = pedding(3, done);
      mm(app.config, 'env', 'prod');

      request(app.callback())
      .get('/mockerror')
      .expect('Location', '/500?real_status=500')
      .expect(302, done);

      request(app.callback())
      .get('/mock4xx')
      .expect('Location', '/500?real_status=400')
      .expect(302, done);

      request(app.callback())
      .get('/500')
      .expect('hi, this custom 500 page')
      .expect(500, done);
    });
  });

  describe('onerror.ctx.error', () => {
    let app;
    before(done => {
      app = mm.app({
        baseDir: 'onerror-ctx-error',
      });
      app.ready(done);
    });

    it('should 500', done => {
      request(app.callback())
      .get('/error')
      .expect(500)
      .end((err, res) => {
        should.not.exist(err);
        res.text.should.containEql('you can`t get userId.');
        done();
      });
    });
  });

  describe('appErrorFilter', () => {
    let app;
    before(done => {
      app = mm.app({
        baseDir: 'custom-listener-onerror',
      });
      app.ready(done);
    });

    it('should ignore error log', done => {
      mm(app.logger, 'log', () => {
        throw new Error('should not excute');
      });

      request(app.callback())
      .get('/?name=IgnoreError')
      .expect(500, done);
    });

    it('should custom log error log', done => {
      done = pedding(done, 2);
      mm(app.logger, 'error', err => {
        err.should.equal('error happened');
        done();
      });

      request(app.callback())
      .get('/?name=CustomError')
      .expect(500, done);
    });

    it('should default log error', done => {
      done = pedding(done, 2);
      mm(app.logger, 'log', (LEVEL, args) => {
        args[0].name.should.equal('OtherError');
        done();
      });

      request(app.callback())
      .get('/?name=OtherError')
      .expect(500, done);
    });
  });
});
