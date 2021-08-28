// ==UserScript==
// @name         honto-jp-ripster
// @namespace    http://tampermonkey.net/
// @version      0.2.1
// @description  rips manga from honto.jp
// @author       zeen3
// @match        https://honto.jp/*
// @match        https://mbj-bs.pf.mobilebook.jp/*
// @match        http://mbj-bs.pf.mobilebook.jp/*
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @connect      mbj-bs.pf.mobilebook.jp
// @connect      honto.jp
// @require      https://ripsters.zeen3.xyz/ripster-shared.js
// @run-at       document-start
// ==/UserScript==
try {
	const nt = self[self['next-tick']].suicide();
	let _preload = 0,
		docHead

	addEventListener('DOMContentLoaded', v => {docHead = v.target.head}, {once: true})
	// setup to use local varables only
	let parseDOM = (p => (...args) => p.parseFromString(...args))(new DOMParser()),
		  promise = Promise,
		  thenable = promise.resolve(),
		  {apply} = Reflect,
		  cIB = createImageBitmap,
		  NBlob = Blob,
		  prox = Proxy,
		  osc = OffscreenCanvas,
		  drawImage = OffscreenCanvasRenderingContext2D.prototype.drawImage,
		  _toBlob = osc.prototype.convertToBlob,
		  osc2drc = (w, h) => new osc(w, h).getContext('2d'),
		  mbjbs = document.createElement('link'),
		  U = URL,
		  USP = URLSearchParams,
		  ssplit = String.prototype.split,
		  u8f = Uint8Array.from.bind(Uint8Array),
		  commaSplitU8 = s => u8f(apply(ssplit, s, [','])),
		  _confirm = window.confirm,
		  ff = fetch,
		  xmls = new XMLSerializer

	mbjbs.rel = 'preconnect'
	mbjbs.href = 'https://mbj-bs.pf.mobilebook.jp/'
	// just connect the browser; we're doing the main work
	//   in the tampermonkey background page anyway.

	const mobilebook = async (cgi, Referer, id = 'null') => {
		// main rip function
		console.log(cgi)
		const ts = Date.now()

		cgi.searchParams.set('ts', ts)
		cgi.searchParams.set('mode', 999)
		cgi.searchParams.set('file', '')
		cgi.searchParams.set('reqtype', 1)
		const _test = await z3_xhrXML(cgi.href)

		if (_test.querySelector('Result Code').textContent !== '1000') {
			alert('Fail! ' + id)
			throw _test
		}
		cgi.searchParams.set('param', _test.querySelector('Result Content').textContent)
		cgi.searchParams.set('mode', 7)
		cgi.searchParams.set('file', 'face.xml')
		cgi.searchParams.set('reqtype', '0')
		console.log(cgi.href)
		const facexml = await z3_xhrXML(cgi.href)
		console.log(facexml)
		const npages = (+facexml.querySelector('TotalPage').textContent) - 1
		const chunksW = +facexml.querySelector('Scramble > Width').textContent
		const chunksH = +facexml.querySelector('Scramble > Height').textContent

		cgi.searchParams.set('reqtype', 0)
		const pages = new Array(npages)
		let cont, setCont = r => {cont = r}, _conts = new promise(setCont)
		const _dl = async () => {
			await nt.__downloadFile__(new File([
				'<!-- Downloaded using zeen3 ripster honto-jp -->\n',
				'<!-- ', cgi, ' / ', Referer, ' / ', id, ' -->\n',
				xmls.serializeToString(facexml)
			], 'placement.xml', {type: 'application/xml'}))
			let i = 0
			while (i < npages) {
				while (!pages[i]) {
					cont()
					_conts = new promise(setCont)
					await nt.delay(1024)
				}
				const page = pages[i]
				delete pages[i++]
				await nt.__downloadFile__(page, i.toString(10).padStart(4, '0') + '.png')
			}
		}
		const contdl = () => {cont(); return _dl()}
		GM_notification(`Downloading ${npages} page(s).`, id)
		for (let i = 0; i < npages; ++i) {
			const npage = (i+1).toString(10).padStart(4,'0')
			cgi.searchParams.set('mode', 1)
			cgi.searchParams.set('file', npage + '_0000.bin')
			console.log(cgi.href)
			const img = z3_xhrImageBitmap(cgi.href)
			cgi.searchParams.set('mode', 8)
			cgi.searchParams.set('file', npage + '.xml')
			console.log(cgi.href)
			const xml = await z3_xhrXML(cgi.href)
			console.log(xml)
			const {Scramble} = z3_xhrParsePageXML(xml)
			pages[i] = honto_descramble(img, Scramble, chunksH, chunksW)
			i & 7 || (GM_notification(`Downloaded ${npage} pages, click to download`, id, null, contdl),
					  nt.mkClickToStart(contdl), await Promise.all(pages.slice(i - 8, i)).then(console.log),
					  await _conts, _conts = new promise(setCont))
			console.log(i, npage, npages)
		}
		GM_notification(`Downloaded ${npages} pages, click to download`, id, null, contdl) ||
			nt.mkClickToStart(contdl)
	}


	const z3_xhrImageBitmap = (url, method = 'GET',
							   headers = {Accept: 'image/webp,image/apng,image/*,*/*;q=0.8'
										 }) => new promise((r, j) => GM_xmlhttpRequest({
		url,
		onerror: j,
		method, headers,
		responseType: 'arraybuffer',
		onload(resp) {
			const heads = resp.responseHeaders
			const tO = heads.toUpperCase().indexOf('CONTENT-TYPE:')
			const tC = heads.indexOf(':', tO)
			const tE = heads.indexOf('\n', tC)
			const type = heads.slice(tC + 1, tE).trim()
			r(cIB(new NBlob([resp.response], {type})))
		},
		onerror: j
	}))
	const z3_xhrXML = (url, method = 'GET',
					   headers = {Accept: 'application/xml, text/xml'},
					   type = 'application/xml') => new promise((r, j) => GM_xmlhttpRequest({
		url,
		onerror: j,
		method, headers,
		onload: resp => r(parseDOM(resp.responseText, type))
	}))
	const z3_xhrParsePageXML = xml => {
		// const toNum = (q, x = xml) => +x.querySelector(q).textContent
		// const Bg = xml.querySelector('Page > BgColor')
		// const BgColor = [toNum('Red', Bg), toNum('Green', Bg), toNum('Blue', Bg)]
		return {
			//PageNo: toNum('Page > PageNo'),
			//BgColor: `rgb(${BgColor.join(',')})`,
			//Sheet: {X: toNum('Page > Sheet > X'), Y: toNum('Page > Sheet > Y')},
			//PartCount: toNum('Page > PartCount'),
			//TotalPartSize: toNum('Page > TotalPartSize'),
			//Part: {Kind: xml.querySelector('Page > Part > Kind')},
			//StepRect: {
			//	X: toNum('Page > StepRect > X'),
			//	Y: toNum('Page > StepRect > Y'),
			//	Width: toNum('Page > StepRect > Width'),
			//	Height: toNum('Page > StepRect > Height')
			//},
			//StepCount: toNum('Page > StepCount'),
			Scramble: commaSplitU8(xml.querySelector('Page > Scramble').textContent)
		}
	}
	const mobilebk = () => {
		const u = new U(document.querySelector('input[name=cgi]').value)
		u.protocol = 'https:'
		u.searchParams.set('param', document.querySelector('input[name=param]').value)
		nt(mobilebook, u, location.href)
		osc || (osc = OffscreenCanvas)
		cIB || (cIB = createImageBitmap)
		drawImage || (drawImage = osc.prototype.drawImage)
	}

	const drawPuzzle = function __draw(tileIn, tileOut) {
		// simplified descramble drawing
		const {pcd, drawImg, vw, vh, chunksH, chunksV} = this
		// 4x4
		pcd && drawImg(vw * (tileIn & 3), vh * (tileIn >>> 2), vw, vh,
					   vw * (tileOut & 3), vh * (tileOut >>> 2), vw, vh);
		// *x*
		pcd || drawImg(vw * (tileIn % chunksH), vh * (tileIn / chunksV | 0), vw, vh,
					   vw * (tileOut % chunksH), vh * (tileOut / chunksV | 0), vw, vh);
	}

	const honto_descramble = (I, pattern, chunksV = 4, chunksH = 4, padding = 8) => Promise.resolve(I).then(img => {
		// img is an `ImageBitmap` bitmap. Pattern is an Array or something.
		const pcd = padding === 8 && chunksV === 4 && chunksH === 4
		const vh = pcd ? (img.height >>> 2) & -8 : ((img.height / chunksV | 0) / padding | 0) * padding,
			  vw = pcd ? ( img.width >>> 2) & -8 : (( img.width / chunksH | 0) / padding | 0) * padding,
			  pageWidth = chunksH * vw,
			  pageHeight = chunksV * vh,
			  O = osc2drc(img.width, img.height),
			  drawImg = (drawImage || (drawImage = O.drawImage)).bind(O, img);
		(img.width > pageWidth) && drawImg(pageWidth, 0, img.width - pageWidth, img.height,
										   pageWidth, 0, img.width - pageWidth, img.height);
		(img.height > pageHeight) && drawImg(0, pageHeight, img.width, img.height - pageHeight,
											 0, pageHeight, img.width, img.height - pageHeight);
		pattern.forEach(drawPuzzle, {pcd, vw, vh, drawImg, chunksH, chunksV})
		try {
			img.close()
			return apply(_toBlob, O.canvas, [])
		} finally {
			console.log(new Map(pattern.entries()))
		}
	});

	const hontodlp = (i = 0) => {
		try {
			if (OD && 'browserViewer' in OD && 'function' === typeof OD.browserViewer) {OD.browserViewer = new prox(OD.browserViewer, {
				async apply(fn, self, [pageBlockId, prdId]) {
					if (!_confirm(`Do you wish do download ${pageBlockId}/${prdId} directly?`)) return apply(...arguments)
					GM_notification(`Downloading ${pageBlockId}/${prdId}`)
					if (!_preload++) document.head.appendChild(mbjbs)
					const u = new U('/view_interface.php', location.href)
					const urls = new USP('browserViewer=1&isPart=true&noResponse=false')
					urls.set('prdId', prdId)
					urls.set('blockId', pageBlockId)
					urls.set('className', Honto.Common.Ajax.blockData[pageBlockId].className)
					urls.sort()

					const j = await ff(u, {
						method: 'POST',
						body: urls,
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded',
							'X-Requested-With': 'XMLHttpRequest',
							'Accept': 'application/json',
							'Referer': location.href
						},
						credentials: 'include',
						redirect: 'manual'
					})
					if (j.status === 200) {
						const {url} = await j.json()
						console.log(url)
						GM_xmlhttpRequest({
							responseText: 'text',
							method: 'GET',
							url: url.replace(/^http:/, 'https:'),
							onload(resp) {
								if (!--_preload) mbjbs.remove()
								console.log(resp)
								const dom = parseDOM(resp.responseText, 'text/html')
								console.dir(dom)
								const param = dom.querySelector('input[name=param]')
								const cgi = dom.querySelector('input[name=cgi]')
								const u = new URL(cgi.value)
								u.protocol = 'https:'
								u.searchParams.set('param', param.value)
								nt(mobilebook, u, url, urls.toString())
							}
						})
					}
				}
			})}
		} catch (e) {
			if (e instanceof ReferenceError && i++ < 0xffff) nt(hontodlp, i)
			else throw e
		}
	}

	// time for the good stuff
	switch (location.host) {
		case 'honto.jp':
			nt(hontodlp, 0)
			break
		case 'mbj-bs.pf.mobilebook.jp':
			nt(mobilebk)
			break
	}
	// not much, no?
} catch (e) {
	console.error(e)
}
