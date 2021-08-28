// ==UserScript==
// @name         x-ripster-shared
// @namespace    http://tampermonkey.net/
// @version      0.7.4
// @description  utils to aid in ripping images
// @author       zeen3
// ==/UserScript==

try {
	const cbind = (fn, ...args) => args.length ? fn.bind(...args) : Function.prototype.call.bind(fn),
		prom = Promise,
		promres = cbind(prom.resolve, prom),
		courl = cbind(URL.createObjectURL, URL),
		rourl = cbind(URL.revokeObjectURL, URL),
		{isArray, from: ArrayFrom} = Array,
		aPush = cbind(Array.prototype.push),
		rfa = Reflect.apply,
		file = File, blob = Blob;
	const A = new prom(r => {
		try {
			r(document.createElement('a'))
		} catch (e) {
			addEventListener('load', e => {
				try {
					r(e.target.createElement('a'))
				} catch (x) {
					r(document.createElement('a'))
				}
			}, {once: true})
		}
	})
	let k = 0,
		clickDL = async (blob, filename, headers = {}) => {
			const a = await A
			let clean = false
			a.href = 'string' === typeof blob
				? blob
				: (clean = courl(blob))
			a.download = filename
			await ntp()
			a.click()
			await raf()
			if (clean) rourl(clean)
			a.remove()
			await raf()
		},
		_dl = clickDL,
		_xhr = null;
	// messagechannel is async, but yielding (task, not microtask).
	const {port1, port2} = new MessageChannel,
		pm1 = cbind(MessagePort.prototype.postMessage, port1),
		pm2 = cbind(MessagePort.prototype.postMessage, port2),
		st = setTimeout,
		FNs = new Array(1), // alignment
		ARGs = new Array(1), // alignment
		sy = Symbol('next-tick'),
		noop = async () => {},
		noopArray = Object.freeze([]),
		_ntp = res => {
			aPush(FNs, res)
			aPush(ARGs, noopArray)
			pm2(++k)
		},
		ntp = () => new prom(_ntp),
		nt = (fn, ...args) => 'function' === typeof fn
			? (aPush(FNs, fn), aPush(ARGs, args), pm2(++k), k)
			: ntp(),
		ntc = Nt => (delete FNs[Nt], delete ARGs[Nt], void 0),
		delay = d => new prom(r => st(r, d)),
		iloadprom = 'decode' in Image.prototype ? cbind(Image.prototype.decode) : l => new prom(
			r => l.addEventListener('load', () => r(), {once: true})
		),
		_raf = res => requestAnimationFrame(res),
		raf = () => new prom(_raf),
		_ric = res => requestIdleCallback(res),
		ric = () => new prom(_ric),
		__downloadFile__ = async (blob, name = blob.name, headers, args) => {
			let filename = prompt(
				`Downloading file with given name, clear to stop downloading; is this all right?`,
				(await blob, await name)
			)
			if (!filename)
				throw new RangeError('Unable to download without user agreement')
			await _dl(await blob, await filename, await headers, await args)
			return true
		},
		registerGMDL = GMDL => {
			if ('function' !== typeof GMDL) throw new TypeError(typeof GMDL)
			_dl = (file, name = file.name, headers = {}, args = {}, cancel) => new Promise((r, j) => {
				if (file instanceof Blob || file instanceof File ||
					('string' === typeof file && file.slice(0,5) === 'data:'))
					r(clickDL(file, name))
				else if ('string' === typeof file) {
					
					let g = GMDL({
						headers,
						onload: r,
						onerror: j,
						ontimeout: j,
						url: file,
						method: 'GET',
						saveAs: true,
						name,
						...args,
					})
					cancel && (cancel.onabort = g.abort)
				} else nt(() => j(file))
			})
			return true
		},
		respfile = resp => {
			const rh = resp.responseHeaders

			const ct = rh.toUpperCase().indexOf('CONTENT-TYPE')
			const type = ct < 0 ? 'application/octet-stream' : rh.slice(rh.indexOf(':', ct) + 1, rh.indexOf('\n', ct)).trim()

			const lm = rh.toUpperCase().indexOf('LAST-MODIFIED')
			const lastModified = lm < 0 ? Date.now() : Date.parse(rh.slice(rh.indexOf(':', lm) + 1, rh.indexOf('\n', lm)).trim())

			resp.context.type = type
			resp.context.lastModified = lastModified
			resp.context[sy].r(new file([resp.response], resp.context.name, {type, lastModified}))
			delete resp.context[sy]
		},
		headsplit = (a, s) => {
			let col = s.indexOf(':');
			if (col !== -1) a.push([
				s.slice(0, col).trim(), 
				s.slice(col + 1).trim()
			]);
			return a;
		},
		respres = resp => {
			const res = new Response(resp.response, {
				headers: resp.responseHeaders
				.split('\n')
				.reduce(headsplit, []),
				status: resp.status,
				url: resp.finalUrl
			})
			resp.context[sy].r(res)
			delete resp.context[sy]
		},
		respblob = resp => {
			const rh = resp.responseHeaders

			const ct = rh.toUpperCase().indexOf('CONTENT-TYPE')
			const type = ct < 0 ? 'application/octet-stream' : rh.slice(rh.indexOf(':', ct) + 1, rh.indexOf('\n', ct)).trim()

			resp.context[sy].r(new blob([resp.response], {type}))
			delete resp.context[sy]
		},
		respimg = resp => {
			const rh = resp.responseHeaders

			const ct = rh.toUpperCase().indexOf('CONTENT-TYPE')
			const type = ct < 0 ? 'application/octet-stream' : rh.slice(rh.indexOf(':', ct) + 1, rh.indexOf('\n', ct)).trim()

			createImageBitmap(new blob([resp.response], {type})).then(resp.context[sy].r, resp.context[sy].j)
			delete resp.context[sy];
		},
		resphtml = resp => {
			let text = resp.responseText || "";
			let dom = new DOMParser().parseFromString(text, 'text/html');
			resp.context[sy].r(dom);
			delete resp.context[sy];
		},
		respxml = resp => {
			resp.context[sy].r(resp.responseXML);
			delete resp.context[sy];
		},
		registerGMXHR = GMXHR => {
			if ('function' !== typeof GMXHR) throw new TypeError(typeof GMXHR)
			_xhr = (url, {as, method = 'GET', context = {}, signal, ...obj} = {}) => new Promise((r, j) => {
				let onload = r
				switch ('string' === typeof as && as.toUpperCase()) {
					case 'XML':
					case 'DOCUMENT':
						onload = respdoc;
						break;
					case 'HTML':
						onload = resphtml;
						break;
					case 'FILE': onload = respfile; as = 'arraybuffer'; break
					case 'BLOB': onload = respblob; as = 'arraybuffer'; break
					case 'IMAGEBITMAP':
					case 'BITMAP':
						onload = respimg
						as = 'arraybuffer'
						break
					case 'FETCH':
						onload = respres
						as = 'arraybuffer'
						break
				}
				if (context === null) context = {}
				context[sy] = {r, j}
				const x = GMXHR({
					url,
					method,
					onload,
					responseType: as,
					onerror: j,
					onabort: j,
					context,
					...obj
				})
				if (signal && typeof AbortController === 'function' &&
					s instanceof AbortSignal) signal.addEventListener('abort', function onceabort(e) {
						x.abort(e)
						this.removeEventListener('abort', onceabort)
					})
			})
		};

	let DC = 0
	const dcr = Array(1), deep_clone = data => new prom(res => {
		pm1({dc: ++DC, data})
		dcr[DC] = res
	})

	port1.onmessage = ({data}) => {
		if ('function' === typeof FNs[data] &&
			isArray(ARGs[data])) rfa(FNs[data], null, ARGs[data])
		ntc(data)
	}
	port2.onmessage = m => {
		const {dc, data} = m.data
		const f = dcr[dc]
		if (delete dcr[dc] &&
			'function' === typeof f) f(data)
	}

	const dcs = obj => {
		const r = {}
		for (const p in Object.getOwnPropertyDescriptors(obj)) switch (typeof obj[p]) {
			case 'object':
				r[p] = dcsp(obj[p])
				break
			case 'function': break
			default:
				r[p] = obj[p]
				break
		}
		return r
	}
	const dcsp = o => 'object' === typeof o?
		isArray(o) ?
		ArrayFrom(o, dcsp) :
		o && dcs(o)
		: o

	nt.nt = nt
	nt.deep_clone = deep_clone
	nt.deep_clone_sync = dcsp
	nt.clone_sync = dcsp
	nt.clone = deep_clone
	nt.clone_async = deep_clone
	nt.cancel = ntc
	nt.ntc = ntc
	nt.ntprom = ntp
	nt.ntp = ntp
	nt.delay = delay
	nt.iloadprom = iloadprom
	nt.raf = raf
	nt.praf = raf
	nt.ric = ric
	nt.pric = ric
	nt.__downloadFile__ = __downloadFile__
	nt.registerGMDL = registerGMDL
	nt.register_GM_download = registerGMDL
	nt.registerGMXHR = registerGMXHR
	nt.xhr = function(){return rfa(_xhr, null, arguments)}

	nt.sym = sy
	nt.noop = noop // literally
	nt.cbind = cbind
	nt.promres = promres
	nt.prom = prom
	nt.aPush = aPush

	const Downloadable = function OpenMeUpToDownload(cb, name = 'click_to_start', cancel = null, cname = 'cancel') {
		Object.defineProperty(this, name, {
			get: cb,
			enumerable: true,
			configurable: true
		})
		if ('function' === typeof cancel) Object.defineProperty(this, cname, {
			get: cancel,
			enumerable: true,
			configurable: true
		})
		return this
	}
	nt.mkClickToStart = (cb, name) => {
		const o = new Downloadable(cb, name)
		nt(console.dir, o)
		return o
	}

	// yep
	nt.suicide = (sym = sy) => (
		Reflect.deleteProperty(window, 'next-tick'),
		Reflect.deleteProperty(window, sym),
		nt
	)
	nt.attach = (sym = sy) => (
		Object.defineProperty(window, sym, {get() {return nt}, configurable: true}),
		Object.defineProperty(window, 'next-tick', {value: sym, configurable: true}),
		nt
	)
	nt.attach()
	const xhr = XMLHttpRequest
	const fetchdoc = (url, type = 'text/html', creds = true, headers = {}, method = 'GET', body = null) => new prom((r, j) => {
		const x = new xhr;
		x.open(`${method}`, `${url}`, true)
		x.overrideMimeType(type)
		x.withCredentials = creds
		for (const header in headers) x.setRequestHeader(header, headers[header])
		x.responseType = 'document'
		x.addEventListener('load', function() {
			r(this.response)
		})
		x.addEventListener('error', function(e) {
			j(e)
		})
		x.send(body)
	})
	nt.fetchdoc = fetchdoc
	/** Select the closest ancestor */
	const $closest = (sels, ctx, tp) => {
		let cls = tp || HTMLElement, el = ctx.closest(sels);
		if (el instanceof cls) return el;
		throw el ? 0 /* NOT_FOUND */ : 1 /* BAD_TYPE */;
	};
	/** Select at most 1 in a given context */
	const $ = (sels, ctx = document, tp) => {
		let cls = tp || HTMLElement, el = ctx.querySelector(sels);
		if (el instanceof cls) return el;
		throw el ? 0 /* NOT_FOUND */ : 1 /* BAD_TYPE */;
	};
	/** Select all matching in a given context */
	const $$ = (sels, ctx = document, tp) => {
		let cls = tp || HTMLElement, 
			els = ctx.querySelectorAll(sels), 
			i = 0, j = 0, l = els.length, rt = Array(l);
		do els[i] instanceof cls && (rt[j++] = els[i]);
		while (++i < l);
		rt.length = j;
		return rt;
	};
	/** Create element (with attributes) */
	const $ce = (el, o) => Object.assign(document.createElement(el), o);
	/** Create element (with children, attributes) */
	const $cec = (name, children, attrs) => {
		let container = $ce(name, (attrs || {})), el;
		if (children) for (el of children) el && container.append(el);
		return container;
	};

	nt.$ = $;
	nt.$$ = $$;
	nt.$ce = $ce;
	nt.$cec = $cec;
	nt.$closest = $closest;

	Object.freeze(nt) // prevent modifications
} catch (e) {
	console.error(e)
	alert(`Error in ripster-shared: ${e.stack || e}`)
}
