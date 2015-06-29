# gradual

> Automated progressive enhancement for `<form>` elements when using Taunus

# Install

```shell
npm install gradual --save
```

# Setup

Use `gradual.configure` to give `gradual` a reference of your `taunus` object to set it up. You can also set a `qs` option that will be used to construct a query string appended to each AJAX form request.

```js
gradual.configure({
  taunus: taunus,
  qs: function (form) {
    return {
      foo: 'bar'
    };
  }
});
```

# Usage

Gradual is a progressive enhancement facility for Taunus that allows you to seamlessly submit plain old HTML forms via AJAX and handle the response in a conventional manner.

Gradual exposes an event emitter that has three additional methods.

### `gradual.hijack(e)`

Exactly as you would expect, this method will submit a `<form>` asynchronously and prevent the default browser form submission mechanism. See [formium][3] for details.

```js
form.addEventListener('submit', gradual.hijack);
```

### `gradual.submit(options, done?)`

This method can be used to submit an HTML `<form>` at will. You can also make AJAX submissions through `gradual.submit` with plain JavaScript object definitions, but still get the [conventions](#conventions).

##### Using `<form>` elements

In this case, the form submission will be identical as the form submissions hijacked by [`gradual.hijack`](#gradualhijack).

```js
gradual.submit({ form: form }, done);
```

##### Using plain objects

This use case is very similar to using a raw `taunus.xhr` call, except that you'll get the [conventions](#conventions) from `gradual`. Events will be fired, and the response will be handled just like with [`gradual.hijack`](#gradualhijack).

```js
gradual.submit({
  method: 'POST',
  action: '/foo',
  data: {
    bar: 'baz'
  }
}, done);
```

Note that `data` will be passed directly to [formulario][1], meaning you could easily set `data` to a `<form>` but submit it to an endpoint of your choosing.

### `gradual.transform(fn)`

This method allows you to register a `fn(form)` callback that gets called whenever a `form` is submitted. You can prepare the form for submission in any way you want. You can optionally return a callback that restores the form to its original state.

The use case for gradual transforms is for those cases when you have a UX enhancement that breaks the state of the form, say if you were using [insignia][2]. In those cases, you can turn the field's value into something plain, and restore the more complex [insignia][2] tag editor right afterwards.

```js
gradual.transform(function fix (form) {
  $(form).find('.nsg-input').forEach(function (input) {
    input.attr('data-prev', input.value());
    input.value(insignia(input).value());
  });
  return function restore () {
    $(form).find('.nsg-input').forEach(function (input) {
      input.value(input.attr('data-prev'));
    });
  };
});
```

## Events

Whenever a response includes a Taunus redirect command (e.g the server-side response ended in a `taunus.redirect` call), or otherwise returns a form validation payload, `gradual` will respond to that accordingly.

Gradual always emits two of three events whenever a `<form>` submission gets its results back.

- `error` is emitted with `(err)` if there was an error generating or processing the response
- `data` is emitted with `(data)` if the response was successfully generated and processed
- `response` is **always** emitted with `(err, data)`

## Custom Validation

Taunus'es `gradual` defines a flexible validation format where special responses will be captured and handled by `gradual`. Taunus looks for validation messages in all of the following fields JSON responses.

- `validation`
- `messages`
- `model.validation`
- `model.messages`
- `flash.validation`
- `flash.messages`
- `flash.model.validation`
- `flash.model.messages`

The validation model must be a non-empty array or any truthy value. If a validation model is found, a `partials/form-validation` partial view  will be passed the validation model and rendered using Taunus.

# License

MIT

[1]: https://github.com/bevacqua/formulario
[2]: https://github.com/bevacqua/insignia
[3]: https://github.com/taunus/formium
