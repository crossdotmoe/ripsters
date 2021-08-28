// ==UserScript==
// @name         kakao-ripster
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  rip images from page.kakao.com
// @require      https://ripsters.zeen3.xyz/ripster-shared.js
// @author       zeen3
// @connect      page-edge.kakao.com
// @connect      api2-page.kakao.com
// @match        https://page.kakao.com/*
// @grant        GM_notification
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==
try {
	const {nt, ntp, praf} = self[self['next-tick']].suicide()
	nt.registerGMXHR(GM_xmlhttpRequest)
	let previousSearch = null,
		maySkip = false,
		ac = new AbortController
	const _downloader = skip => {
		previousSearch = location.search
		ac.abort()
		ac = new AbortController
		requestIdleCallback(changingSearch)
	}
	const changingSearch = () => (
		previousSearch !== location.search && location.pathname === '/viewer'
		? nt(_downloader, maySkip)
		: setTimeout(changingSearch, 666)
	)
	document.addEventListener('DOMContentLoaded', changingSearch, {once: true})
	const rready = d => new Promise(r => {
		GM_notification(`kakao ripster ready to rip ${d}, click to start`,
						'RIPSter ready',
						null, r)
		Object.defineProperties(nt.mkClickToStart(r, `dl product ${d}`), {
			'dl all available': {get: dlAllAPIResp, enumerable: true},
			'all available at current': {value: apir, enumerable: true}
		})
	})
	const apir = new Map()
	const dlAllAPIResp = async () => { for (const [productId, json] of apir) await dlAll(json, productId); }
	async function dlAll(json, productId) {
		apir.set(productId, json)
		const data = json.downloadData;
		const l = data.members.files.length;
		const files = Array(l);
		const server = data.members.sAtsServerUrl;
		let limit = {then:v=>v()};
		for (let i = 0; i < l; ++i) {
			const {secureUrl, no} = data.members.files[i];
			// limit and require to wait
			const pst = files[i-7] || ntp(), g = limit;
			limit = limit.then(_ => pst);
			const url = new URL(server + secureUrl, location.href);
			files[i] = g.then(() => nt.xhr(url.href, {
				as: 'file', credentials: 'include', cache: 'force-cache', anonymous: false, fetch: true,
				context: { name: `${productId}_${url.searchParams.get('filename')}` },
				headers: { Accept: 'image/*', Referer: location.origin },
			}));
		}
		await rready(productId);
		await nt.__downloadFile__(new File(
			[JSON.stringify({json, productId}, null, '\t')], productId + 'placement.json', {type: 'application/json'}));
		let file; while (file = await files.shift()) await nt.__downloadFile__(await file)
	}
	let sent = 0
	const ael = EventTarget.prototype.addEventListener
	XMLHttpRequest.prototype.send = new Proxy(XMLHttpRequest.prototype.send, {
		apply(fn, slf, args) {
			let send = ++sent;
			console.log('%d.send(this: %O, data: %O)', send, slf, JSON.stringify(args[0]));
			if (args[0] && args[0].startsWith('productId')) {
				const productId = new URLSearchParams(args[0]).get('productId')
				ael.call(slf, 'load', function() {
					this.responseURL.endsWith("-page.kakao.com/api/v1/inven/get_download_data/web")
					&& new Response(this.responseText).json().then(json => dlAll(json, productId)).catch(console.error)
				}, {once: true})
			}
			if (typeof args[0] === 'string') {
				ael.call(slf, 'load', function() {
					new Response(this.responseText).json().then(j => console.log('%d.send() -> %o', send, j), ()=>{});
				}, {once: true});
			}
			return Reflect.apply(fn, slf, args)
		}
	})
} catch (e) {
	console.error(e)
	alert(e.stack || `Error in ripster: ${e}`)
}
