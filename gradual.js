'use strict';

var emitter = require('contra/emitter');
var formium = require('formium');
var formulario = require('formulario');
var formResponseHandler = require('./lib/formResponseHandler');
var state = require('./lib/state');
var transformers = [];
var gradual = emitter({
  hijack: hijack,
  transform: formium.transform,
  submit: submit,
  configure: state.configure
});

function noop () {}

function hijack (e) {
  var form = e.target;
  submitForm(form);
  e.preventDefault();
}

function submitForm (form, done) {
  formium.submit(form, handler);
  function handler (err, data) {
    raise(err, data, form, done);
  }
}

function submit (options, done) {
  var form = options.form;
  if (form) {
    submitForm(form, done); return;
  }
  var formData = formulario(options.data);
  var req = {
    method: options.method,
    headers: formData.headers,
    body: formData.body
  };
  return state.taunus.xhr(options.action, req, handler);
  function handler (err, data) {
    raise(err, data, null, done);
  }
}

function raise (err, data, context, done) {
  if (err) {
    gradual.emit.call(context, 'error', err);
  } else {
    gradual.emit.call(context, 'data', data);
  }
  gradual.emit.call(context, 'response', err, data);
  formResponseHandler(err, data, context, done);
}

module.exports = gradual;
