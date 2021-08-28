// ==UserScript==
// @name         ganganonline-ripster
// @namespace    http://tampermonkey.net/
// @version      0.5.1
// @description  rips images from gangan online
// @author       zeen3
// @match        https://www.ganganonline.com/viewer/player/viewer.html?*
// @connect      ganganonline.com
// @connect      www.ganganonline.com
// @connect      cache1.ganganonline.com
// @connect      cache2.ganganonline.com
// @connect      herokuapp.com
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @run-at       document-end
// @require      https://ripsters.zeen3.xyz/ripster-shared.js
// ==/UserScript==
try {
	const { __downloadFile__: dl, aPush, xhr, clone_sync, praf, ric, delay, nt } = self[self['next-tick']].suicide()
	nt.registerGMXHR(GM_xmlhttpRequest)
	const {drawImage} = CanvasRenderingContext2D.prototype
	const OSC = OffscreenCanvas
	const {apply, get, construct} = Reflect;
	const {isArray} = Array
	const {isFrozen, defineProperty} = Object
	const proxy = Proxy
	const wmr = new WeakMap();
	const wm = new WeakMap();
	const fns = new WeakMap();
	const fnsr = new WeakMap();
	const consts = new WeakMap()
	const constsr = new WeakMap();
	const IMGS = new Map();
	const BMS = new WeakMap();
	const _OSCS = new WeakMap();
	const BLOBS = new Map();
	const BOOKS = new Set();
	const PAGES = [];
	const path = new WeakMap
	const dpath = (o, k, p) => path.set(o, [...path.get(p), k])
	let url = '', dir = 'rtl', pages = 0, book = '', renderer = null, pageSliderCounter = null
	const wms = Object.defineProperties(nt.mkClickToStart(dlAll), Object.getOwnPropertyDescriptors({
		wmr, wm, fns, fnsr, consts, constsr,
		IMGS, BMS, _OSCS, BLOBS, BOOKS, PAGES, path,
		get info(){return {url, dir, pages, renderer}}
	}))
	const setImg = src => IMGS.set(src, xhr(src, {as: 'bitmap'}))
	let applyCount = 0, constructCount = 0, tMo = 0
	async function dlAll() {
		await dl(new File([JSON.stringify(book)], 'placement.json', {type: 'application/json'}))
		let i = 0
		renderer || (renderer = document.getElementById('renderer'))
		pageSliderCounter || (pageSliderCounter = document.getElementById('pageSliderCounter'))
		const next = [new CustomEvent('keydown', {bubbles: true, detail: dir !== 'ltr' ? 37 : 39}),
			new CustomEvent('keyup', {bubbles: true, detail: dir !== 'ltr' ? 37 : 39})]
		const prev = [new CustomEvent('keydown', {bubbles: true, detail: dir !== 'rtl' ? 37 : 39}),
			new CustomEvent('keyup', {bubbles: true, detail: dir !== 'rtl' ? 37 : 39})]
		for (const a of [next, prev]) for (const e of a) Object.defineProperties(e, {which: {value: e.detail, enumerable: true}, })
		console.log([...next, ...prev])
		while (i < pages) {
			if (!(await BLOBS.get(url + PAGES[i]))) {
				const page = parseInt(pageSliderCounter.textContent, 10)
				if (page < i) {
					console.log('move %O: %O; %s, %f, %s (%i -> %i)', next, renderer,
					            renderer.dispatchEvent(next[0]),
					            await praf(),
					            renderer.dispatchEvent(next[1]),
					            page, i)
				} else {
					console.log('move %O: %O; %s, %f, %s, (%i -> %i)', next, renderer,
					            renderer.dispatchEvent(prev[0]),
					            await praf(),
					            renderer.dispatchEvent(prev[1]),
					            page, i)
				}
				await delay(1000)
			} else {
				await dl(BLOBS.get(url + PAGES[i++]), i.toString(10).padStart(4,'0') + '.png')
			}
		}
	}
	const oprox = {
		get(self, prop) {
			const X = self[prop]
			// isNullOrUndefined
			if (
				X == null ||
				X instanceof Element ||
				X instanceof CanvasRenderingContext2D
			) return X
			let prx = wm.get(X)
			if (prx) return prx
			switch (typeof X) {
				case 'object':
				case 'function':
					dpath(X, prop, self)
					prx = new proxy(X, oprox)
					wm.set(X, prx).set(prx, X)
					return prx
			}
			return X
		},
		apply(fn, self, args) {
			const R = apply(fn, self, args)
			if (
				R == null ||
				R instanceof HTMLCanvasElement
			) return R
			if (R instanceof Image) {
				!IMGS.has(R.src) && setImg(R.src)
				return R
			}
			let prx = wm.get(R)
			if (prx) return prx
			switch (typeof R) {
				case 'function':
				case 'object':
					if (!(path in R)) {
						const d = {into_str: `(...${args.length} args)`, toString() {return this.into_str}}
						for (const i in args) d[i] = args[i]
						dpath(R, d, fn)
					}
					prx = new proxy(R, oprox)
					wm.set(R, prx).set(prx, R)
					return prx
			}
			return R
		},
		construct(or, args) {
			const self = construct(or, args)
			switch (path.get(or).join('.')) {
				case 'NFBR.a6i.Book':
					BOOKS.add(self)
					url = args[0]
					;(function ff() {
						let c = self.content[`${args[1][0]}_${args[2][0]}`]
						if (c == null) return setTimeout(ff, 17)
						pages = c.files.length
						book = clone_sync(self)
						book.search = location.search
						let d = (wm.get(c) || c)['page-progression-direction']
						d && (dir = d)
					}())
					break
				case 'NFBR.a6i.Page':
					if (args[1] !== -1) {
						PAGES[args[1]] = args[0]
						setImg(url + args[0])
					}
					break
			}
			if (or.name !== '' ||
				isFrozen(self.prototype) ||
				self instanceof Element ||
				self instanceof XMLHttpRequestEventTarget
			) return self
			try {
				dpath(self, 'new()', or)
				const prox = new proxy(self, oprox)
				wm.set(self, prox).set(prox, self)
				return prox
			} catch (e) {
				console.error(e)
				return self
			}
		}
	}
	const gs = (m, k, v) => (m.set(k, v), v)
	CanvasRenderingContext2D.prototype.drawImage = new proxy(CanvasRenderingContext2D.prototype.drawImage, {
		apply(fn, self, args) {
			apply(fn, self, args)
			let {width, height} = self.canvas
			let src = args[0].src
			if (args[0] instanceof Image &&
				IMGS.has(args[0].src)) IMGS
				.get(args[0].src)
				.then(bm => {
					const osc = BMS.get(bm) ||
						gs(BMS, bm, new OSC(width, height).getContext('2d'))
					osc.drawImage(bm, ...args.slice(1))
					_OSCS.has(osc) || _OSCS.set(osc, requestIdleCallback(() => {
						BLOBS.set(src, osc.canvas.convertToBlob())
						console.log(BLOBS)
						Promise.all(BLOBS.values())
							.then(console.log)
							.then(nt.praf)
							.then(() => nt.mkClickToStart(dlAll))
					}))
				})
		}
	})
	{
		console.time('Connect to NFBR object')
		let r = function r() {
			if (typeof NFBR === 'undefined') {
				setTimeout(r, 1)
				return r
			}
			path.set(NFBR, ['NFBR'])
			NFBR = new proxy(NFBR, oprox)
			console.timeEnd('Connect to NFBR object')
			console.info('proxy installed on NFBR object as %O with extra info on %O', NFBR, wms)
		}()
	}
} catch(e) {
	alert(e.stack)
}
