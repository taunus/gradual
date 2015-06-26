'use strict';

// jshint scripturl:true

var $ = require('dominus');
var queso = require('queso');
var safeson = require('safeson');
var emitter = require('contra.emitter');
var formulario = require('formulario');
var formResponseHandler = require('./lib/formResponseHandler');
var state = require('./lib/state');
var transformers = [];
var gradual = emitter({
  hijack: hijack,
  transform: transform,
  submit: submit,
  configure: state.configure
});

function noop () {}

function hijack (e) {
  var form = e.target;
  submitForm(form);
  e.preventDefault();
}

function transform (fn) {
  transformers.push(fn);
}

/* AJAX form submissions use an intermediary <iframe> to help browsers remember
 * autocompletion suggestions. We submit the form against the <iframe> and then
 * grab the response as plain-text JSON that we need to parse into JSON.
 * Afterwards we can hand that JSON to the response handler, business as usual.
 * Since we've submitted the form "organically", the browser stores suggestions.
 */
function frame (form) {
  var name = 'ff-' + new Date().valueOf();
  $(form)
    .attr('autocomplete', 'on')
    .attr('target', name);
  return $('<iframe>')
    .css('display', 'none')
    .attr('id', name)
    .attr('name', name)
    .attr('src', 'javascript:void 0')
    .afterOf(form);
}

function submitForm (form, done) {
  var textareaCloneValue = 'data-clone-value';
  var iframe = frame(form);
  var content = iframe[0].contentWindow;
  var restore = transformers.map(run);
  var textareas = $('textarea', form);
  textareas.forEach(preserveValue);
  var formClone = form.cloneNode(true);
  var textareaClones = $('textarea', formClone);
  disable(form);
  $('button', form).forEach(disable);
  $('[autofocus]', formClone).attr('autofocus', null);
  textareaClones.forEach(updateValue);
  textareas.forEach(restoreTextarea);
  var formCloneId = 'f' + iframe[0].id;
  formClone.id = formCloneId;
  iframe.once('load', grabResponse);
  content.document.body.appendChild(formClone);
  var frameForm = content.document.getElementById(formCloneId);
  var prefix = frameForm.action.indexOf('?') === -1 ? '?' : '&';
  frameForm.action += prefix + 'json&as-text' + queso(state.qs(form), true);
  frameForm.onsubmit = null;
  frameForm.submit();
  restore.forEach(run);
  function preserveValue (textarea) {
    var ta = $(textarea);
    ta.attr(textareaCloneValue, ta.value());
  }
  function updateValue (textarea) {
    var ta = $(textarea);
    ta.value(ta.attr(textareaCloneValue)).attr(textareaCloneValue, null);
  }
  function restoreTextarea (textarea) {
    $(textarea).attr(textareaCloneValue, null);
  }
  function grabResponse () {
    var html = readResponse(content);
    if (!html) {
      gotResponse(new Error('Internal Server Error')); return;
    }
    var json = decodeResponse(html);
    var err = json ? null : new Error('Malformed response');
    gotResponse(err, json);
    function gotResponse (err, data) {
      $('button', form).forEach(enable);
      enable(form);
      iframe.remove();
      raise(err, data, form, done);
    }
  }
  function readResponse (content) {
    try {
      return content.document.body.innerHTML;
    } catch (e) { // failure to read (most likely) means server crashed or response timed out
    }
  }
  function decodeResponse (html) {
    try {
      return safeson.decode(html);
    } catch (e) {
    }
  }
  function run (fn) {
    return (fn || noop)(form);
  }
  function disable (el) {
    el.disabled = true;
  }
  function enable (el) {
    el.disabled = false;
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
