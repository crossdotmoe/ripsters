// ==UserScript==
// @name         www-manga-club-ripster
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  rips manga from manga.club
// @author       zeen3
// @match        https://www.manga.club/*
// @match        https://www.sukima.me/*
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @run-at       document-start
// @connect      cloudfront.net
// @require      https://ripsters.zeen3.xyz/ripster-shared.js
// ==/UserScript==
try {
	const nt = self[self['next-tick']]
	nt.suicide()
	const odi = OffscreenCanvasRenderingContext2D.prototype.drawImage
	const processPage = async resp => {
		const rH = resp.responseHeaders,
			  off = rH.toUpperCase().indexOf('CONTENT-TYPE'),
			  type = rH.slice(rH.indexOf(':', off) + 1, rH.indexOf('\n', off + 1)).trim()
		const ib = await createImageBitmap(new Blob([resp.response], {type}))

		const {width, height} = ib
		const {dlable, _dl, map, sc, page} = resp.context
		const ctx = new OffscreenCanvas(width, height).getContext('2d')
		const draw = odi.bind(ctx, ib),
			  bl = sc.BLOCKLEN,
			  xs = Math.floor(width / bl),
			  ys = Math.floor(height / bl)
		draw(0, 0, width, height)
		let x, y, z = 0
		for (x = 0; x < xs; ++x) for (y = 0; y < ys; ++y) draw(x * bl, y * bl, bl, bl, map[z][0], map[z++][1], bl, bl)
		const d = dlable[page.page_number - 1] = ctx.canvas.convertToBlob().then(
			b => new File([b], `${sc.VOLUME_ID}_${page.page_number.toString(10).padStart(4, '0')}.png`, {type: b.type}))
		ib.close()
		;(page.page_number === sc.MAX_PAGE || !((page.page_number - 1) & 7)) &&
			GM_notification('mangaclub ripster: ready to download',
							`downloaded page ${page.page_number}/${sc.MAX_PAGE}, click to download`,
							null, _dl)
		console.timeEnd(sc.VOLUME_ID + ' ' + page.page_number)
	}

	const isUndefined = v => v === undefined
	const forEach = Function.prototype.call.bind(Array.prototype.forEach)
	const some = Function.prototype.call.bind(Array.prototype.some)
	const someElementIsUndefined = a => some(a, isUndefined)
	const txHTML = (d => x => d.parseFromString(x, 'text/html'))(new DOMParser);
	const pageinfojsony = (k, v) => k !== 'shuffle_map' ? v : JSON.parse(v)
	const rrtext = r => r.text()
	const rjsonparserpageinfojsony = r => JSON.parse(r, pageinfojsony)
	const _volid = (a, v, i) => {
		i || (a.VOLUME_ID = '')
		a.VOLUME_ID += v[0] === "'" ? v.slice(1, -1) : a[v]
		return a
	}
	const freeze = (o, depth = Infinity) => {
		if (depth > 0) for (const kay in o) o[kay] && 'object' === typeof o[kay] && freeze(o[kay], depth - 1)
		return Object.freeze(o)
	}
	const pc = () => 'page_count' in sessionStorage ? ++sessionStorage.page_count : (sessionStorage.page_count = 1)
	const cc = 'AbortController' in self ? AbortController : function aborter(){
		this.signal = new EventTarget
		this.signal.aborted = false
		let _onabort = null
		Object.defineProperty(this.signal, 'onabort', {
			get() {return _onabort},
			set(f) {
				if (f === null) _onabort = f
				if ('function' === typeof f) _onabort = f
			},
			enumerable: true,
			configurable: true
		})
		this.abort = () => {
			if (this.signal.aborted) return
			this.signal.aborted = true
			const e = new Event('abort')
			this.signal.dispatchEvent(e)
			_onabort && _onabort(e)
		}
		return this
	}
	const fcdl = (href, controller = new cc) => fetch(href, {cache: 'force-cache', signal: controller.signal}).then(rrtext).then(txHTML)
	const downloadManga = async (href, _doc = fcdl(href)) => {
		const doc = await _doc
		let sc = Object.create(null)
		for (const s of doc.scripts) {
			if (s.src || s.integrity ||
				!s.innerHTML.includes('/** initialize layout */')) continue
			if (s.innerHTML.includes('PAGES_INFO')) {
				const re = /([A-Z_]+)\s*=\s*([^;]+);/g
				const S = s.innerHTML
				let V, p = doc.createElement('p')
				while (V = re.exec(S)) {
					const [, k, v] = V
					switch (k) {
						case 'PAGES_INFO':
							sc[k] = JSON.parse(v.replace(/'/g, '"'), pageinfojsony)
							break
						case 'VOLUME_ID':
							v.split(' + ').reduce(_volid, sc)
							break
						case 'PAGEMAP':
							try {
								sc[k] = JSON.parse(v.replace(/(\d+):/g, '"$1":'))
							} catch (e) {console.error(e); console.log(k, v)}
							break
						case 'TITLE_NAME':
							if (v[0] !== v[v.length - 1]) {
								p.innerHTML = v.slice(1) + ';' +
									S.slice(re.lastIndex, S.indexOf('\n', re.lastIndex) - 2)
							} else p.innerHTML = v.slice(1, -1)
							sc[k] = p.innerText.trim()
							p.innerHTML = ''
							break
						case 'BASE_URL':
							sc[k] = new URL(JSON.parse('"' + v.slice(1, -1).replace(/"/g, '\\"') + '"'), href)
							continue
						default:
							if (v[0] === "'" && v[v.length - 1] === "'") {
								sc[k] = JSON.parse('"' + v.slice(1, -1).replace(/"/g, '\\"') + '"')
								continue
							}
							try {
								let j = JSON.parse(v)
								if (j == v) {
									sc[k] = j
									continue
								}
							} catch (e) {console.error(e); console.log(k, v)}
					}
				}
				break
			}
		}
		let p0 = 1, n0 = sc.PAGES_INFO.length
		const epp = page => page.page_number >= n0 && (sc.PAGES_INFO[page.page_number - 1] = page)
		while (sc.MAX_PAGE > sc.PAGES_INFO.length) {
			const j = await fetch(
				`${sc.BASE_URL}&page_number=${p0++}0&num_of_pages=10&server=${pc()}`,
				{headers: {'X-Requested-With': 'XMLHttpRequest'}}
			)
			.then(rrtext)
			.then(atob)
			.then(rjsonparserpageinfojsony);

			if ('pages' in j && Array.isArray(j.pages)) forEach(j.pages, epp)
		}
		freeze(sc)
		// sc.PAGES_INFO.sort((a, b) => a.page_number - b.page_number)
		const pg = sc.MAX_PAGE, dln = sc.VOLUME_ID + '_placement.json',
			  dlable = new Array(pg), _dl = async (i = 0) => {
				  await nt.__downloadFile__(new File([JSON.stringify(sc, null, '\t')],
													 dln, {type: 'application/json'}))
				  while (i < pg) {
					  if (i in dlable) {
						  const file = dlable[i]
						  delete dlable[i++]
						  await nt.__downloadFile__(await file)
					  } else await nt.praf()
				  }
				  for (const k in dlable) delete dlable[k]
				  alert('donekthksbye')
			  }
		GM_notification(`Downloading "${sc.TITLE_NAME}"`, `${pg} page${pg !== 1 ? 's' : ''}`, null, _dl)
		for (const page of sc.PAGES_INFO) {
			GM_xmlhttpRequest({
				context: {dlable, page, map: page.shuffle_map, _dl, sc},
				responseType: 'arraybuffer',
				onerror: console.error,
				onload: processPage,
				url: page.page_url,
				method: 'GET',
			})
			console.time(sc.VOLUME_ID + ' ' + page.page_number)
			await nt.praf()
		}
		while (await Promise.all(dlable).then(someElementIsUndefined)) await nt.delay(100)
		GM_notification(`mangaclub ripster: download ready`, `ready to download`,
						null, _dl)
		nt.mkClickToStart(_dl, 'evaluate to download files')
		return confirm(`Download ${pg} images (+1 info file)?`) && _dl()
	}
	const lset = {capture: true}
	function _clickbv (e) {
		const a = new cc
		const zz = fcdl(this.href, a)
		if (!confirm('Do you want to download this manga?')) return a.abort();

		e.preventDefault()
		const href = this.href
		downloadManga(href, zz).finally(() => {
			this.href = href
			this.addEventListener('click', _clickbv, lset)
		})
		this.blur()
		this.href = '#'
		this.removeEventListener('click', _clickbv, lset)
		nt(add)
	}

	let _l = false
	const _added = new WeakSet, add = () => {
		for (const bv of document.querySelectorAll('a[href^="/bv"]')) {
			if (_added.has(bv)) continue
			bv.addEventListener('click', _clickbv, lset)
			_added.add(bv)
		}
		_l || requestAnimationFrame(add)
	}
	addEventListener('load', add, {once: true})
	addEventListener('DOMContentLoaded', () => {_l = true}, {once: true})
	if (location.pathname.startsWith('/bv/')) nt(downloadManga, location.href)

	add()
	console.dir(nt)
	;(location.pathname === '/' || location.pathname.slice(1, 4) !== 'bv/') && addEventListener('load', () => {
		const qsa = document.querySelectorAll('div.col-10.col-md-11.mb-3 a.btn-primary')
		const aborts = Array(qsa.length)
		const tdl = (a, {href}, i) => {
			aborts[i] = new cc
			const ff = fcdl(href, aborts[i])
			const rt = a.then(() => downloadManga(href, ff))
			return (i - 1 === aborts.length) ? rt.catch(e => {
				aborts.forEach(a => a.abort())
				alert(e.stack || `Err in ripster: ${e}`)
			}) : rt
		}
		const dlall = Function.prototype.call.bind(Array.prototype.reduce, qsa, tdl, Promise.resolve(), null)

		GM_notification(`click to download ${qsa.length} manga(s)`, 'unknown total images', null, dlall)

		nt.mkClickToStart(dlall, `click to download ${qsa.length} chapters/volumes`)
	}, {once: true});
} catch (e) {
	console.error(e)
}
