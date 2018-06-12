'use strict';

const fs = require('fs');
const pedding = require('pedding');
const mm = require('egg-mock');
const rimraf = require('rimraf');
const path = require('path');
const assert = require('assert');

describe('test/onerror.test.js', () => {
  let app;
  before(() => {
    mm.env('local');
    mm.consoleLevel('NONE');
    app = mm.app({ baseDir: 'onerror' });
    return app.ready();
  });
  after(() => app.close());

  afterEach(mm.restore);

  it('should handle error not in the req/res cycle with no ctx', function* () {
    mm.consoleLevel('NONE');
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
    return app.httpRequest()
      .get('/?status=-1')
      .expect(/<h1 class="box">Error in &#x2F;\?status&#x3D;-1<\/h1>/)
      .expect(500);
  });

  it('should handle status:undefined as status:500', () => {
    return app.httpRequest()
      .get('/')
      .expect(/<div class="context">test error<\/div>/)
      .expect(500);
  });

  it('should handle escape xss', () => {
    return app.httpRequest()
      .get('/?message=<script></script>')
      .expect(/&lt;script&gt;&lt;&#x2F;script&gt;/)
      .expect(500);
  });

  it('should handle status:1 as status:500', () => {
    return app.httpRequest()
      .get('/?status=1')
      .expect(/<div class="context">test error<\/div>/)
      .expect(500);
  });

  it('should handle status:400', () => {
    return app.httpRequest()
      .get('/?status=400')
      .expect(/<div class="context">test error<\/div>/)
      .expect(400);
  });

  it('should return error json format when Accept is json', () => {
    return app.httpRequest()
      .get('/user')
      .set('Accept', 'application/json')
      .expect(res => {
        assert(res.body);
        assert(res.body.message === 'test error');
        assert(res.body.stack.includes('Error: test error'));
        // should not includes error detail
        assert(!res.body.frames);
      })
      .expect(500);
  });

  it('should return error json format when request path match *.json', () => {
    return app.httpRequest()
      .get('/user.json')
      .expect(res => {
        assert(res.body);
        assert(res.body.message === 'test error');
        assert(res.body.stack.includes('Error: test error'));
        assert(res.body.status === 500);
        assert(res.body.name === 'Error');
      })
      .expect(500);
  });

  it('should support custom accpets return err.stack', () => {
    mm(app.config.onerror, 'accepts', ctx => {
      if (ctx.get('x-requested-with') === 'XMLHttpRequest') return 'json';
      return 'html';
    });
    return app.httpRequest()
      .get('/user.json')
      .set('x-requested-with', 'XMLHttpRequest')
      .expect(/"message":"test error"/)
      .expect(/"stack":/)
      .expect(500);
  });

  it('should return err.stack when unittest', () => {
    mm(app.config, 'env', 'unittest');
    return app.httpRequest()
      .get('/user.json')
      .set('Accept', 'application/json')
      .expect(/"message":"test error"/)
      .expect(/"stack":/)
      .expect(500);
  });

  it('should return err status message', () => {
    mm(app.config, 'env', 'prod');
    return app.httpRequest()
      .get('/user.json')
      .set('Accept', 'application/json')
      .expect({ message: 'Internal Server Error' })
      .expect(500);
  });

  it('should return err.errors', () => {
    return app.httpRequest()
      .get('/user.json?status=400&errors=test')
      .set('Accept', 'application/json')
      .expect(/test/)
      .expect(400);
  });

  it('should return err json at prod env', () => {
    mm(app.config, 'env', 'prod');
    return app.httpRequest()
      .get('/user.json?status=400&errors=test')
      .set('Accept', 'application/json')
      .expect(/test/)
      .expect({
        errors: 'test',
        message: 'test error',
      })
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(400);
  });

  it('should return 4xx html at prod env', () => {
    mm(app.config, 'env', 'prod');
    return app.httpRequest()
      .post('/test?status=400&errors=test')
      .set('Accept', 'text/html')
      .expect('<h2>400 Bad Request</h2>')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(400);
  });

  it('should return 500 html at prod env', () => {
    mm(app.config, 'env', 'prod');
    mm(app.config.onerror, 'errorPageUrl', '');
    return app.httpRequest()
      .post('/test?status=502&errors=test')
      .set('Accept', 'text/html')
      .expect('<h2>Internal Server Error, real status: 502</h2>')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(500);
  });

  it('should return err json at non prod env', () => {
    return app.httpRequest()
      .get('/user.json?status=400&errors=test')
      .set('Accept', 'application/json')
      .expect(/test/)
      .expect({
        errors: 'test',
        message: 'test error',
      })
      .expect(400);
  });

  it('should return parsing json error on html response', () => {
    return app.httpRequest()
      .post('/test?status=400')
      .send({ test: 1 })
      .set('Content-Type', 'application/json')
      .expect(/Problems parsing JSON/)
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(400);
  });

  it('should return parsing json error on json response', () => {
    return app.httpRequest()
      .post('/test?status=400')
      .send({ test: 1 })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect({
        message: 'Problems parsing JSON',
      })
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(400);
  });

  it('should redirect to error page', () => {
    mm(app.config, 'env', 'test');
    return app.httpRequest()
      .get('/?status=500')
      .expect('Location', 'https://eggjs.com/500.html?real_status=500')
      .expect(302);
  });

  it('should handle 403 err', () => {
    mm(app.config, 'env', 'prod');
    return app.httpRequest()
      .get('/?status=403&code=3')
      .expect('<h2>403 Forbidden</h2>')
      .expect(403);
  });

  it('should return jsonp style', () => {
    mm(app.config, 'env', 'prod');
    return app.httpRequest()
      .get('/jsonp?callback=fn')
      .expect('content-type', 'application/javascript; charset=utf-8')
      .expect('/**/ typeof fn === \'function\' && fn({"message":"Internal Server Error"});')
      .expect(500);
  });

  describe('customize', () => {
    let app;
    before(() => {
      mm.consoleLevel('NONE');
      app = mm.app({
        baseDir: 'onerror-customize',
      });
      return app.ready();
    });
    after(() => app.close());

    it('should support customize json style', () => {
      mm(app.config, 'env', 'prod');
      return app.httpRequest()
        .get('/user.json')
        .expect('content-type', 'application/json; charset=utf-8')
        .expect({ msg: 'error' })
        .expect(500);
    });

    it('should return jsonp style', () => {
      mm(app.config, 'env', 'prod');
      return app.httpRequest()
        .get('/jsonp?callback=fn')
        .expect('content-type', 'application/javascript; charset=utf-8')
        .expect('/**/ typeof fn === \'function\' && fn({"msg":"error"});')
        .expect(500);
    });

    it('should handle html by default', () => {
      mm(app.config, 'env', 'test');
      return app.httpRequest()
        .get('/?status=500')
        .expect('Location', 'https://eggjs.com/500.html?real_status=500')
        .expect(302);
    });
  });

  if (process.platform !== 'win32') {
    it('should log warn 4xx', function* () {
      rimraf.sync(path.join(__dirname, 'fixtrues/onerror-4xx/logs'));
      const app = mm.app({
        baseDir: 'onerror-4xx',
      });
      yield app.ready();
      yield app.httpRequest()
        .post('/body_parser')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({ foo: new Buffer(1024 * 100).fill(1).toString() })
        .expect(/request entity too large/)
        .expect(413);
      yield app.close();

      const warnLog = path.join(__dirname, 'fixtures/onerror-4xx/logs/onerror-4xx/onerror-4xx-web.log');
      assert(/POST \/body_parser] nodejs\..*?Error: request entity too large/.test(fs.readFileSync(warnLog, 'utf8')));
    });
  }

  describe('no errorpage', () => {
    let app;
    before(() => {
      mm.consoleLevel('NONE');
      app = app = mm.app({
        baseDir: 'onerror-no-errorpage',
      });
      return app.ready();
    });
    after(() => app.close());

    it('should display 500 Internal Server Error', () => {
      mm(app.config, 'env', 'prod');
      return app.httpRequest()
        .get('/?status=500')
        .expect(500)
        .expect(/Internal Server Error, real status: 500/);
    });
  });

  describe('app.errorpage.url=/500', () => {
    let app;
    before(() => {
      mm.consoleLevel('NONE');
      app = app = mm.app({
        baseDir: 'onerror-custom-500',
      });
      return app.ready();
    });
    after(() => app.close());

    it('should redirect to error page', function* () {
      mm(app.config, 'env', 'prod');

      yield app.httpRequest()
        .get('/mockerror')
        .expect('Location', '/500?real_status=500')
        .expect(302);

      yield app.httpRequest()
        .get('/mock4xx')
        .expect('<h2>400 Bad Request</h2>')
        .expect(400);

      yield app.httpRequest()
        .get('/500')
        .expect('hi, this custom 500 page')
        .expect(500);

      yield app.httpRequest()
        .get('/special')
        .expect('Location', '/specialerror?real_status=500')
        .expect(302);
    });
  });

  describe('onerror.ctx.error env=local', () => {
    let app;
    before(() => {
      mm.env('local');
      mm.consoleLevel('NONE');
      app = mm.app({
        baseDir: 'onerror-ctx-error',
      });
      return app.ready();
    });
    after(() => app.close());

    it('should 500 full html', () => {
      return app.httpRequest()
        .get('/error')
        .expect(500)
        .expect(/you can&#x60;t get userId\./);
    });
  });

  describe('onerror.ctx.error env=unittest', () => {
    let app;
    before(() => {
      mm.consoleLevel('NONE');
      app = mm.app({
        baseDir: 'onerror-ctx-error',
      });
      return app.ready();
    });
    after(() => app.close());

    it('should 500 simple html', () => {
      return app.httpRequest()
        .get('/error')
        .expect(500)
        .expect(/you can`t get userId\./);
    });
  });

  describe('appErrorFilter', () => {
    let app;
    before(() => {
      mm.consoleLevel('NONE');
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

      return app.httpRequest()
        .get('/?name=IgnoreError')
        .expect(500);
    });

    it('should custom log error log', done => {
      done = pedding(done, 2);
      mm(app.logger, 'error', err => {
        assert.equal(err, 'error happened');
        done();
      });

      app.httpRequest()
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

      app.httpRequest()
        .get('/?name=OtherError')
        .expect(500)
        .then(() => done(), done);
    });
  });

  describe('agent emit error', () => {
    let app;
    before(() => {
      app = mm.cluster({
        baseDir: 'agent-error',
      });
      app.debug();
      return app.ready();
    });
    after(() => app.close());

    it('should log error', function* () {
      console.log('app.stderr: %j', app.stderr);
      console.log(app.stdout);
      yield app.close();
      assert(/nodejs.Error: emit error/.test(app.stderr));
    });
  });

  describe('replace onerror default template', () => {

    let app = null;
    before(() => {
      mm.consoleLevel('NONE');
      app = mm.app({
        baseDir: 'onerror-custom-template',
      });
      return app.ready();
    });

    after(() => app.close());

    afterEach(mm.restore);

    it('should use custom template', () => {
      mm(app.config, 'env', 'local');
      return app.httpRequest()
        .get('/')
        .expect(/custom template/)
        .expect(500);
    });

  });
});
