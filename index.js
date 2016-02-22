'use strict';

const BrowserWindow = require('electron').BrowserWindow;
const ipcMain = require('electron').ipcMain;
const path = require('path');
const objectAssign = require('object-assign');

module.exports = function (options, callback) {
	function log (text) {
			console.log(options.url, ']', text);
	}
	
	if (process.env.NODESCREENSHOT_SHOW === '1') {
		options.show = true;
	}

	let popupWindow = new BrowserWindow(objectAssign(
		// Defaults
		{
			show: false,
			nodeIntegration: false,
			transparent: false,
      			useContentSize: true
		},
		// User values
		options,
		// Force these values
		{
			x: 0,
			y: 0,
			frame: false,
			enableLargerThanScreen: true,
			skipTaskbar: true,
			directWrite: true,
			// Used to load the ipc module into $$electronIpc`
			preload: path.join(__dirname, 'preload.js'),
			webPreferences: {
				webSecurity: (options.security === undefined || options.security),
				defaultEncoding: 'utf-8',
				webaudio: false
			}
		})
	);

	const cleanup = () => {
		log('cleanup');
		clearTimeout(timeout);
		popupWindow.removeAllListeners();
		popupWindow.webContents.removeAllListeners();
		setTimeout(() => {
			if (popupWindow) {
				popupWindow.destroy();
				popupWindow = null;
			}
		}, 100);
	};

	let loadTimeout;
	const resetTimeout = func => {
		clearTimeout(loadTimeout);
		loadTimeout = setTimeout(func, options.timeout || 2000);
	};
	
	
	let makingScreenshot = false;
	const makeScreenshot = () => {
		if(makingScreenshot === true) {
			      console.log('======= already making screenshot ======');
		}
		makingScreenshot = true;
		
		log('making screenshot');
		// Remove any loadTimeout
		clearTimeout(loadTimeout);
		
		if(makingScreenshot === true) {
			return;
		}
		makingScreenshot = true;

		const loadEvent = `Loaded-${popupWindow.id}`;
		const custloadEvent = `CustomLoaded-${popupWindow.id}`;
		const sizeEvent = `Size-${popupWindow.id}`;

		const loadEventName = (options.loadevent) ? custloadEvent : loadEvent;

		// Register the IPC load event once
		ipcMain.once(loadEventName, (e, meta) => {
			log('load event');
			// Delay the screenshot
			setTimeout(() => {
				log('delay over');
				const cb = data => {
					log('took screenshot');
					const obj = {
						data: ((options.format === 'jpeg') ? data.toJpeg((options.quality ? options.quality : 80)) : data.toPng()),
						size: data.getSize()
					};

					obj.size.devicePixelRatio = meta.devicePixelRatio;

					callback(undefined, obj, cleanup);
				};

				if (typeof options.crop === 'object') {
					popupWindow.capturePage(options.crop, cb);
				} else {
					popupWindow.capturePage(cb);
				}
			}, options.delay);
		});

		// Register the IPC sizeEvent once
		ipcMain.once(sizeEvent, (e, data) => {
      			log('size event');
			// Don't be smaller than options.width, options.height
			popupWindow.setSize(Math.max(options.width, data.width), Math.max(options.height, data.height));
			popupWindow.webContents.executeJavaScript('window["$$electron__loaded"]()');
      			console.log(data);
		});

		// requestAnimationFrame will call the function before the next repaint.
		// This way it is ensured that at least on paint has happend.
		popupWindow.webContents.executeJavaScript(`
			var $$electron__ra = window.requestAnimationFrame;
			function $$electron__load(){$$electronIpc.send("${loadEvent}", { devicePixelRatio: window.devicePixelRatio });};
			function $$electron__size(){var w = window,d = document,e = d.documentElement,g = d.body,
			width = Math.max(w.innerWidth, e.clientWidth, g.clientWidth),
			height = Math.max(w.innerHeight, e.clientHeight, g.clientHeight, e.scrollHeight);
			$$electronIpc.send("${sizeEvent}",{width: width, height: height});
			};
			function $$electron__loaded(){
				$$electron__ra(function(){
					// Take screenshot at offset
					document.body.scrollTop=' + (options.pageOffset || 0) + ';
					$$electron__ra($$electron__load);
				});
			}
            document.addEventListener("${options.loadevent}", function() {
                document.body.scrollTop=' + (options.pageOffset || 0) + ';
			    $$electron__ra(function(){
				   $$electronIpc.send("${custloadEvent}", { devicePixelRatio: window.devicePixelRatio });
				});
			});`);

		if (options.page) {
			popupWindow.webContents.executeJavaScript('window["$$electron__size"]()');
		} else {
			popupWindow.webContents.executeJavaScript('window["$$electron__loaded"]()');
		}
	};

	popupWindow.webContents.on('did-fail-load', (e, errorCode, errorDescription) => {
		if (errorCode === -3) {
			// Ignore user abort
			return;
		}
		callback(new Error(`[${errorCode}] ${errorDescription}`));
		cleanup();
	});

	popupWindow.webContents.on('did-get-redirect-request', function (event, oldUrl, newUrl, isMainFrame, httpResponseCode, requestMethod, referer, headers) {
	if(isMainFrame) {
    console.log('-- redirect --');
    console.log('oldUrl', oldUrl);
    console.log('newUrl', newUrl);
    console.log('isMainFrame', isMainFrame);
    console.log('httpResponseCode', httpResponseCode);
    console.log('requestMethod', requestMethod);
    console.log('referer', referer);
    cleanup();
    options.url = newUrl;
    return module.exports(options, callback);
  }
	});

	popupWindow.webContents.on('crashed', () => {
		callback(new Error('Render process crashed'));
		cleanup();
	});

	if (options.css !== undefined) {
		popupWindow.webContents.on('dom-ready', () => {
			// Inject custom CSS if necessary
			popupWindow.webContents.insertCSS(options.css);
		});
	}

	let asked = false;
	popupWindow.webContents.on('did-stop-loading', () => {
		log('did-stop-loading');
		resetTimeout(makeScreenshot);

		// Shortcut for pages without any iframes
		if (!asked) {
			ipcMain.once('frame-count', (e, count) => {
				log('frame count ' + count);
				// Call it directly
				if (count === 0) {
					makeScreenshot();
				}
			});
			popupWindow.webContents.executeJavaScript('$$electronIpc.send("frame-count", window.frames.length)');
			asked = true;
		}
	});

	// Start loading the URL
	popupWindow.loadURL(options.url);
	
	var timeout = setTimeout(function () {
		if(makingScreenshot === false) {
			log('timeout finished');
			makeScreenshot();
		}
	}, 25000);
	
};
