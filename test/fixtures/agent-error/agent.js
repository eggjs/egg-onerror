'use strict';

module.exports = function(agent) {
  const done = agent.readyCallback();
  setTimeout(() => {
    done(new Error('emit error'));
  }, 500);
};
