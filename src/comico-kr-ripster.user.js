// ==UserScript==
// @name         comico-kr-ripster
// @namespace    http://tampermonkey.net/
// @version      0.2.1
// @description  rips images from comico.kr
// @author       zeen3
// @match        http://comico.kr/titles/*/chapters/*
// @match        https://comico.kr/titles/*/chapters/*
// @connect      comico-img.toastoven.net
// @run-at       document-body
// @grant        GM_notification
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @require      https://ripsters.zeen3.xyz/ripster-shared.js
// ==/UserScript==


const nt = self[self['next-tick']].suicide()

nt.registerGMDL(o => console.log(o, GM_download(o)))
const dlAll = async imgs => {
	await nt.__downloadFile__(new File([location.href], 'placement.txt', {type: 'text/plain', name: 'placement.txt'}))
	let i = 0
	while (i < imgs.length) await nt.__downloadFile__(...(await imgs[i++]))
}

console.log('running')
fetch(location.href, {cache: 'force-cache'}).then(async res => {
	console.log('run')
	const dom = new DOMParser().parseFromString(await res.text(), 'text/html'),
		  _imgs = [], imgs = [];
	console.log('ran')
	let i = dom.images.length
	while (--i !== -1) dom.images[i].classList.contains('_image') && _imgs.push(dom.images[i])
	i = _imgs.length
	const after = ({response, responseHeaders, context}) => {
		console.log(context.i/*, finalUrl*/)
		console.debug(responseHeaders)
		if ('string' === typeof responseHeaders) {
			try{responseHeaders = responseHeaders.split(/\r?\n/g)
				.map(a => [a.slice(0, a.indexOf(':')).toLowerCase().trim(),
						   a.slice(a.indexOf(':') + 1).trim()]).filter(([a,b]) => a && b)
				responseHeaders = new Headers(responseHeaders)
			   }catch(e){console.error(e); console.log(responseHeaders); responseHeaders = new Map(responseHeaders)}
		}
		const type = responseHeaders.get('content-type')
		const name = context.i.toString().padStart(4,'0') + '.' + (type.slice(type.indexOf('/') + 1))
		const file = new File([response], name, {type, name})
		console.log(file)
		return [file, name]
	}
	const wl = (onload, onerror) => {
		let {src} = _imgs[i]
		GM_xmlhttpRequest({
			url: src,
			context: {i: imgs.length + 1},
			method: 'GET',
			onload,
			onerror,
			ontimeout: onerror,
			responseType: 'arraybuffer'
		})
	}
	while (--i !== -1) imgs.push(new Promise(wl).then(after))
	nt.mkClickToStart(dlAll)
	GM_notification('comico.kr ripster ready; click to start', `${imgs.length} images to download ready`, null, () => dlAll(imgs))
})
