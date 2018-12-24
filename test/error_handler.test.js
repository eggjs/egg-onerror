'use strict';

const fs = require('fs');
const pedding = require('pedding');
const mm = require('egg-mock');
const rimraf = require('rimraf');
const path = require('path');
const assert = require('assert');

describe.only('test/error_handler.test.js', () => {
  describe.only('default error handler', () => {
    let app;
    before(() => {
      app = mm.app({
        baseDir: 'default-error-handler',
      });
      return app.ready();
    });
    after(() => app.close());

    describe('error', () => {
      it('should handler error when accept json', async () => {
        await app.httpRequest()
          .get('/error')
          .set('Accept', 'application/json')
          .expect({
            code: 'UNKNOWN_ERROR',
            message: 'error',
          })
          .expect(500);
      });

      it('should handler error when accept text', async () => {
        await app.httpRequest()
          .get('/error')
          .set('Accept', 'text/plain')
          .expect('error')
          .expect(500);
      });

      it('should handler error when accept html', async () => {
        await app.httpRequest()
          .get('/error')
          .set('Accept', 'text/html')
          .expect('error')
          .expect(500);
      });
    });

    describe('egg error', () => {
      it('should handler egg error when accept json', async () => {
        await app.httpRequest()
          .get('/egg-error')
          .set('Accept', 'application/json')
          .expect({
            code: 'CUSTOM_ERROR',
            message: 'egg error',
          })
          .expect(422);
      });

      it('should handler egg error when accept text', async () => {
        await app.httpRequest()
          .get('/egg-error')
          .set('Accept', 'text/plain')
          .expect('egg error')
          .expect(422);
      });

      it('should handler egg error when accept html', async () => {
        await app.httpRequest()
          .get('/egg-error')
          .set('Accept', 'text/html')
          .expect('<h2>CUSTOM_ERROR</h2>\n<div>egg error</div>')
          .expect(422);
      });
    });

    describe('egg exception', () => {
      it('should handler egg exception when accept json', async () => {
        await app.httpRequest()
          .get('/egg-exception')
          .set('Accept', 'application/json')
          .expect({
            code: 'CUSTOM_EXCEPTION',
            message: 'egg exception',
          })
          .expect(500);
      });

      it('should handler egg exception when accept text', async () => {
        await app.httpRequest()
          .get('/egg-exception')
          .set('Accept', 'text/plain')
          .expect('egg exception')
          .expect(500);
      });

      it('should handler egg exception when accept html', async () => {
        await app.httpRequest()
          .get('/egg-exception')
          .set('Accept', 'text/html')
          .expect('<h2>CUSTOM_EXCEPTION</h2>\n<div>egg exception</div>')
          .expect(500);
      });
    });

  });

  describe('default error handler', () => {
    let app;
    before(() => {
      app = mm.app({
        baseDir: 'custom-error-handler',
      });
      return app.ready();
    });
    after(() => app.close());

    it('should format error', async () => {
      await app.httpRequest()
        .get('/error')
        .set('Accept', 'application/json')
        .expect({

        })
        .expect(200);
    });
  });
});
