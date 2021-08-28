// ==UserScript==
// @name         rbinb-ripster
// @namespace    http://tampermonkey.net/
// @version      1.0.4
// @description  rips images from speedbinb based sites
// @author       zeen3
// @require      https://ripsters.zeen3.xyz/ripster-shared.js
// @match        https://r.binb.jp/epm/*
// @match        https://booklive.jp/bviewer/s/*
// @match        https://booklive.jp/bviewer/*
// @match        https://binb.bricks.pub/contents/*
// @match        https://gammaplus.takeshobo.co.jp/manga/*/_files/*/
// @match        http://gammaplus.takeshobo.co.jp/manga/*/_files/*/
// @match        https://comic-meteor.jp/ptdata/*/*/
// @match        https://www.youngjump.world/reader/reader.html?*
// @match        https://comic-trail.jp/pt/*
// @grant        GM_notification
// @run-at       document-start
// ==/UserScript==


try {
	GM_notification({
		title: 'Waiting for load...',
		text: 'rbinb ripster waiting for load'
	})
	const nt = window[window['next-tick']].suicide()
	const mwm = new WeakMap(),
		  wget = mwm.get.bind(mwm),
		  wset = mwm.set.bind(mwm),
		  wdel = mwm.delete.bind(mwm),
		  parseDOM = (p => (...args) => p.parseFromString(...args))(new DOMParser()),
		  odi = OffscreenCanvasRenderingContext2D.prototype.drawImage;
	const {apply} = Reflect;
	let max = 0, is_downloading = false;
	let dl_data;
	let json_data = '';
	let imgs_list = []
	let title = ''
	/**
	* @this {XMLHttpRequest}
	*/
	async function XHRLogger() {
		try {
			console.log(this)
			const data = await new Response(this.responseText).json();
			if (typeof data.SBCVersion === 'string' && data.ConverterType === 'ypub+epub') {
				json_data = data
				let all = parseDOM(data.ttx, 'text/html');
				imgs_list = Array.from(all.querySelectorAll('t-case t-img'), item => ({
					id: item.getAttribute('id'),
					src: item.getAttribute('src'),
					width: parseInt(item.getAttribute('orgwidth'), 10),
					height: parseInt(item.getAttribute('orgheight'), 10),
				}));
				title = all.title;
				console.log({all, title, imgs_list, json_data})
				dl_data = {title, imgs_list, json_data}
				GM_notification({
					title: 'RIPSter ready',
					text: 'rbinb ripster ready, click to start',
					onclick: ready,
					timeout: 0
				})
				nt.mkClickToStart(ready)
				max = imgs_list.length + 1;
			}
		} catch(e) {
			console.error(e)
		}
	}
	CanvasRenderingContext2D.prototype.drawImage = new Proxy(CanvasRenderingContext2D.prototype.drawImage, {
		apply(fn, self, args) {
			const osctx = wget(args[0])
			osctx && apply(odi, osctx, args)
			apply(fn, self, args)
		}
	});
	const {addEventListener} = EventTarget.prototype
	const XHRLoad = Object.freeze(['load', XHRLogger, {once: true}])
	XMLHttpRequest.prototype.open = new Proxy(XMLHttpRequest.prototype.open, {
		apply(fn, self, args) {
			apply(fn, self, args)
			try {
				console.log(self)
				apply(addEventListener, self, XHRLoad)
			} catch(e) {
				console.log(e)
			}
		}
	})
	let ntt = 0, _ntt = () => {ntt = 0; console.groupEnd('add event listeners')}
	EventTarget.prototype.addEventListener = new Proxy(EventTarget.prototype.addEventListener, {
		apply(fn, self, args) {
			if (!ntt) {
				ntt = nt(_ntt)
				console.group('add event listeners')
			}
			let arg1 = args[1]
			args[1] === arg1 || (wset(args[1], arg1), args[1] = arg1)
			return apply(fn, self, args)
		}
	});
	let ntr = 0, _ntr = () => {ntr = 0; console.groupEnd('remove event listeners')}
	EventTarget.prototype.removeEventListener = new Proxy(EventTarget.prototype.removeEventListener, {
		apply(fn, self, args) {
			if (!ntt) {
				ntr = nt(_ntr)
				console.group('remove event listeners')
			}
			let w
			if (w = wget(args[1])) args[1] = w
			return apply(fn, self, args)
		}
	});
	const // Downloading info
	dlPlace = () => nt.__downloadFile__(new File(
		[JSON.stringify(dl_data, null, '\t')],
		dl_data.title + '_placement.json',
		{type: 'application/json'}
	)),
		  ke = KeyboardEvent,
		  awwr = {bubbles: true, cancelable: true, composed: true, },
		  moveRight = {...awwr, key: 'ArrowRight', code: 'ArrowRight', keyCode: 39, which: 39},
		  moveLeft = {...awwr, key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37, which: 37};
	async function ready() {
		if (document.body.classList.contains('sd_vert')) document.getElementById('menu_change_vh').click()
		const sliderv = document.getElementById('menu_slidercaption');
		const getSliderv = () => parseInt(sliderv.textContent.slice(0, sliderv.textContent.indexOf('/')), 10);
		const moveNext = document.body.classList.contains('rtl') ? moveLeft : moveRight;
		const movePrev = document.body.classList.contains('ltr') ? moveLeft : moveRight;
		while (getSliderv() > 1) {
			document.dispatchEvent(new ke('keydown', movePrev))
			await nt();
			document.dispatchEvent(new ke('keyup', movePrev))
			document.dispatchEvent(new ke('keypress', movePrev))
			await nt.delay(666)
		}
		let prev = dlPlace();
		let i = 0;
		while (i < imgs_list.length) {
			const img = imgs_list[i++]
			let imgs = document.querySelector('#content-p' + i);
			let blob = await dl_img(imgs, moveNext, getSliderv, img);
			let file = new File([blob], title + '_' + String(i).padStart(4, '0') + '.png', blob);
			await prev
			prev = nt.__downloadFile__(file)
		}
	}
	const dl_img = async (imgs, moveNext, sliderV, img) => {
		const v = parseInt(imgs.id.slice(9), 10)
		while (v - sliderV() > 2) {
			document.dispatchEvent(new ke('keydown', moveNext))
			await nt();
			document.dispatchEvent(new ke('keyup', moveNext))
			document.dispatchEvent(new ke('keypress', moveNext))
			await nt.delay(666)
		}
		while (imgs.querySelector('img') === null) await nt.praf()
		// console.log({ppw, pph})
		const ctx = new OffscreenCanvas(img.width, img.height).getContext('2d')
		let _i = imgs.querySelectorAll('img')
		for (const i of _i) {
			// console.log(i)
			await nt.iloadprom(i)
			let im = i.computedStyleMap().get('transform').toMatrix(),
				pm = i.parentElement.computedStyleMap().get('transform').toMatrix()

			ctx.drawImage(i, 0, Math.round(pm.f / im.a))
		}
		return ctx.canvas.convertToBlob()
	}
} catch (e) {
	console.error(e)
}
