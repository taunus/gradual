'use strict';

var assign = require('assignment');
var formium = require('formium');
var state = {
  configure: configure
};

function configure (options) {
  formium.configure({ qs: qs });
  state.taunus = options.taunus;
  function qs (form) {
    var jsonText = { json: true, 'as-text': true };
    return assign(jsonText, (options.qs || noop)(form));
  }
}

function noop () {}

module.exports = state;
