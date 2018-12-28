'use strict';

// const fs = require('fs');
// const pedding = require('pedding');
const mm = require('egg-mock');
// const rimraf = require('rimraf');
// const path = require('path');
// const assert = require('assert');

describe('test/error_handler.test.js', () => {
  describe('default error handler', () => {
    let app;
    before(() => {
      app = mm.app({
        baseDir: 'default-error-handler',
      });
      return app.ready();
    });
    after(() => app.close());

    describe('error', () => {
      it('should handler error', async () => {
        await app.httpRequest()
          .get('/error')
          .set('Accept', 'application/json')
          .expect({
            code: 'UNKNOWN_ERROR',
            message: 'any error',
          })
          .expect(500);

        await app.httpRequest()
          .get('/error')
          .set('Accept', 'text/plain')
          .expect({
            code: 'UNKNOWN_ERROR',
            message: 'any error',
          })
          .expect(500);

        await app.httpRequest()
          .get('/error')
          .set('Accept', 'text/html')
          .expect({
            code: 'UNKNOWN_ERROR',
            message: 'any error',
          })
          .expect(500);

        await app.httpRequest()
          .get('/error')
          .expect({
            code: 'UNKNOWN_ERROR',
            message: 'any error',
          })
          .expect(500);
      });

    });

    describe('egg error', () => {
      it('should handler egg error', async () => {
        await app.httpRequest()
          .get('/egg-error')
          .set('Accept', 'application/json')
          .expect({
            code: 'CUSTOM_ERROR',
            message: 'any egg error',
          })
          .expect(422);

        await app.httpRequest()
          .get('/egg-error')
          .set('Accept', 'text/plain')
          .expect({
            code: 'CUSTOM_ERROR',
            message: 'any egg error',
          })
          .expect(422);

        await app.httpRequest()
          .get('/egg-error')
          .set('Accept', 'text/html')
          .expect({
            code: 'CUSTOM_ERROR',
            message: 'any egg error',
          })
          .expect(422);

        await app.httpRequest()
          .get('/egg-error')
          .expect({
            code: 'CUSTOM_ERROR',
            message: 'any egg error',
          })
          .expect(422);
      });
    });

    describe('egg exception', () => {
      it('should handler egg exception', async () => {
        await app.httpRequest()
          .get('/egg-exception')
          .set('Accept', 'application/json')
          .expect({
            code: 'CUSTOM_EXCEPTION',
            message: 'any egg exception',
          })
          .expect(500);

        await app.httpRequest()
          .get('/egg-exception')
          .set('Accept', 'text/plain')
          .expect({
            code: 'CUSTOM_EXCEPTION',
            message: 'any egg exception',
          })
          .expect(500);

        await app.httpRequest()
          .get('/egg-exception')
          .set('Accept', 'text/html')
          .expect({
            code: 'CUSTOM_EXCEPTION',
            message: 'any egg exception',
          })
          .expect(500);

        await app.httpRequest()
          .get('/egg-exception')
          .expect({
            code: 'CUSTOM_EXCEPTION',
            message: 'any egg exception',
          })
          .expect(500);
      });
    });

  });

  describe('custom error handler', () => {
    let app;
    before(() => {
      app = mm.app({
        baseDir: 'custom-error-handler',
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
            message: 'custom error',
          })
          .expect(500);
      });

      it('should handler error when accept text', async () => {
        await app.httpRequest()
          .get('/error')
          .set('Accept', 'text/plain')
          .expect('custom error')
          .expect(500);
      });

      it('should handler error when accept html', async () => {
        await app.httpRequest()
          .get('/error')
          .set('Accept', 'text/html')
          .expect('<h2>UNKNOWN_ERROR</h2>\n<div>custom error</div>')
          .expect(500);
      });

      it('should handler error without accept', async () => {
        await app.httpRequest()
          .get('/error')
          .expect('<h2>UNKNOWN_ERROR</h2>\n<div>custom error</div>')
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
            message: 'custom egg error',
          })
          .expect(422);
      });

      it('should handler egg error when accept text', async () => {
        await app.httpRequest()
          .get('/egg-error')
          .set('Accept', 'text/plain')
          .expect('custom egg error')
          .expect(422);
      });

      it('should handler egg error when accept html', async () => {
        await app.httpRequest()
          .get('/egg-error')
          .set('Accept', 'text/html')
          .expect('<h2>CUSTOM_ERROR</h2>\n<div>custom egg error</div>')
          .expect(422);
      });

      it('should handler egg error without accept', async () => {
        await app.httpRequest()
          .get('/egg-error')
          .set('Accept', 'text/html')
          .expect('<h2>CUSTOM_ERROR</h2>\n<div>custom egg error</div>')
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
            message: 'custom egg exception',
          })
          .expect(500);
      });

      it('should handler egg exception when accept text', async () => {
        await app.httpRequest()
          .get('/egg-exception')
          .set('Accept', 'text/plain')
          .expect('custom egg exception')
          .expect(500);
      });

      it('should handler egg exception when accept html', async () => {
        await app.httpRequest()
          .get('/egg-exception')
          .set('Accept', 'text/html')
          .expect('<h2>CUSTOM_EXCEPTION</h2>\n<div>custom egg exception</div>')
          .expect(500);
      });

      it('should handler egg exception without accept', async () => {
        await app.httpRequest()
          .get('/egg-exception')
          .expect('<h2>CUSTOM_EXCEPTION</h2>\n<div>custom egg exception</div>')
          .expect(500);
      });
    });
  });
});
