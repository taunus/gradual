'use strict';

var state = {
  configure: configure
};

function configure (options) {
  state.taunus = options.taunus;
  state.qs = options.qs;
}

module.exports = state;
