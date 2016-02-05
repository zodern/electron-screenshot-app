# electron-screenshot-app [![Build Status](https://travis-ci.org/FWeinb/electron-screenshot-app.svg?branch=master)](https://travis-ci.org/FWeinb/electron-screenshot-app)

> Make screenshots


## Install

```sh
$ npm install electron-screenshot-app --save
```


## Usage

```js
var app = require('app');
var screenshot = require('electron-screenshot-app');

  app.on('ready', function(){
    screenshot({
      url: 'http://sassdoc.com',
      width: 1920,
      height: 1080
    },
    function(err, image){
      // image.data is a Node Buffer
      // image.size contains width and height
      // image.devicePixelRatio will contain window.devicePixelRatio
    })
  });
```


## API

### screenshot(options, callback(err, img))

Takes a screenshots with `options`. The callback is called with an img object like

```js
{
  data: <Buffer >
  size: {
    width: X
    height: N
  }
}
```

The screenshot is always saved as an png file.

#### options

#### url
*Required*
Type: `String`

##### delay

Type: `number` *(milliseconds)*  
Default: `0`

Useful when the site does things after load that you want to capture.

##### width

Type: `number`
Default: `0`

Specify the with of the browser window

##### height

Type: `number`
Default: `0`

Specify the height of the browser window

##### crop

Type: `Object`  
Default: `undefined`

A crop object may look like this:
```js
{
  x : 10,
  y : 10,
  width : 100,
  height : 100
}
```

##### css

Type: `String`  
Default: `undefined`

This css will be injected into the page before the screenshot is taken.

##### transparent

Type: `Boolean`  
Default: `false`

This will enable transparency. Keep in mind that most site do set a background color on the html/body tag.
You can overwrite this by using the `css` option using something like `html,body{ background-color: transparent !important;}`.

##### page

Type: `Boolean`  
Default: `false`

This will try to capture the whole page. `width` and `height` are considered the minimum size.

##### nodeIntegration

Type: `Boolean`
Default: `false`

This will enable node integration in the electron window, be careful because this can open up some
serious security issues.

##### secure

Type: `Boolean`
Default: `true`

This will enable/disable web security in the electron window.

##### loadevent

Type: `String`
Default: `undefined`

The name of a custom page side event which can be used to trigger the page capture. This can be useful for client heavy javascript sites which take much longer to initialise than the time take to load the DOM. Such sites can send an event in the following manner.

```js
    var evt = document.createEvent("Event");
    evt.initEvent("cust-loaded",true,true);
    document.dispatchEvent(evt);
```

##### format

Type: `String`
Default: `png`

format to encode the image. only `'jpeg'` or `'png'` are supported

##### quality

Type: `number`
Default: `80`

If format is `'jpeg'`, defines the quality of the image '0-100'



# Changelog

##### `2.2.0`

* Add support for `jpeg` using the `format` option.
* Add a custom [`loadevent`](#loadevent) that can be send by the page.
* Make it possible to disable webSecurity via `secure` option.

Thanks to [nealshail](https://github.com/nealshail) for these features. 

##### `2.1.0`

* Update to `electron@0.36.6`
* Allow all [options](http://electron.atom.io/docs/v0.36.5/api/browser-window/#new-browserwindow-options) to be passed to electron

##### `2.0.0`

* Update to `electron@0.36.5`

##### `1.1.2`

* Improve workaround introduced in `1.1.1`

##### `1.1.1`

* Add workaround for electron issue [#2510](https://github.com/atom/electron/issues/2610) in electron >= 0.30.6 on a Mac

##### `1.1.0`

* Use new `dom-ready` event (>electron@0.31.1) to inject custom css into page before screenshot is taken.
* Expose `cleanup` to callback to ensure that the window is closed after data was processed.

##### `1.0.0`

* Inital release
