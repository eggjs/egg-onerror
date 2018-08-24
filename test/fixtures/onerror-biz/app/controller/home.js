'use strict';

const { Controller } = require('egg');
const { EggError, EggException } = require('egg-errors');


class HomeController extends Controller {
  async throwError() {
    throw new Error('error');
  }

  async throwEggError() {
    throw new EggError('egg error');
  }

  async throwEggException() {
    throw new EggException('egg exception');
  }

}

module.exports = HomeController;
