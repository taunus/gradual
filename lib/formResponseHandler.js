'use strict';

var $ = require('dominus');
var state = require('./state');

function noop () {}

function formResponseHandler (err, data, form, done) {
  var end = done || noop;
  if (err) {
    end(err); return;
  }
  var host = getNotificationHost(data);
  if (host) {
    messages(form, host);
  } else if (data.redirect) {
    data.redirect.force = true;
    state.taunus.redirect(data.redirect); return;
  }
  end(null, data);
}

function hasItems (host, prop) {
   return Array.isArray(host[prop]) ? host[prop].length : host[prop];
}

function getNotificationHost (host) {
  if (!host) {
    return false;
  }
  if (hasItems(host, 'errors') || hasItems(host, 'validation') || hasItems(host, 'messages')) {
    return host;
  }
  return getNotificationHost(host.model) || getNotificationHost(host.flash);
}

function messages (form, model) {
  var partial = 'partials/form-validation';
  var dialog = $('<div>');
  var dialogElement = dialog[0];
  var show = form ? attachToForm : displayInDialog;

  $('.fv-dialog').remove();

  if (form) {
    $('.ss-container,.fv-container', form).remove();
  }

  state.taunus.partial(dialogElement, partial, model).on('render', show);

  function attachToForm () {
    var contents = dialog.children();
    $(form).addClass('ff-validated').prepend(contents);
    dialog.remove();
  }

  function displayInDialog () {
    var body = $(document.body);

    $('<button>')
      .appendTo(dialog.find('.fv-header'))
      .addClass('fv-dialog-dismiss')
      .attr('aria-label', 'Click here to dismiss this message')
      .on('click', dialogClose);
    dialog.appendTo(body).addClass('fv-dialog');
    body.on('click', dialogClose);
  }

  function dialogClose (e) {
    var body = $(document.body);
    var target = $(e.target);
    if (target.is('.fv-dialog-dismiss') || (target.is('.fv-dialog') === false && target.parents('.fv-dialog').length === 0)) {
      body.off('click', dialogClose);
      dialog.remove();
    }
  }
}

module.exports = formResponseHandler;
