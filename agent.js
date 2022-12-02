'use strict';

module.exports = class {
  constructor(agent) {
    this.agent = agent;
  }
  configDidLoad() {
    // should watch error event
    this.agent.on('error', err => {
      this.agent.coreLogger.error(err);
    });
  }
};
