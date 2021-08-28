// ==UserScript==
// @name         kuaikan-manhua-ripster
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  anuses
// @author       zeen3
// @match        https://www.kuaikanmanhua.com/web/comic/*
// @connect      kkmh.com
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @require      https://ripsters.zeen3.xyz/ripster-shared.js
// ==/UserScript==

try {
	const {nt, ntp, xhr} = self[self['next-tick']].suicide()
	nt.registerGMXHR(GM_xmlhttpRequest);
	function get_name() {
		return String(this.pid) +
			'_' +
			String(this.i).padStart(4, '0') +
			'.' +
			this.type.slice(6)
	}
	const fetch_img = (src, i, pid, {signal} = {}) => xhr(src, {
		as: 'file',
		signal,
		context: Object.defineProperty({i, pid}, 'name', {get: get_name})
	})

	async function fetcher(imgs, productId, as = {}) {
		let l = imgs.length
		const files = Array(l)
		let limit = {then:v=>v()}
		for (let i = 0; i < l; ++i) {
			const file = imgs[i];
			// limit and require to wait
			const pst = files[i-6] || ntp(), g = limit;
			limit = limit.then(_ => pst);
			const url = new URL(file, location.href);
			files[i] = g.then(_ => fetch_img(url.href, i, productId, as));
		}
		await nt.__downloadFile__(new File(
			[JSON.stringify(window.__NUXT__, null, '\t')], productId + '_placement.json', {type: 'application/json'}));
		let file; while (file = await files.shift()) await nt.__downloadFile__(await file)
	}

	async function extract() {
		for (const {imgs, pid} of __NUXT__.data.map(v => ({
			imgs: v.comicInfo.comicImages.map(v => v.url),
			pid: v.comicInfo.id
		}))) await fetcher(imgs, pid)
	}

	const raf = requestAnimationFrame.bind(null)
	raf(function loop() {
		try {
			__NUXT__
			nt.mkClickToStart(extract, 'download chapter')
			GM_notification(`KuaikanManhua ripster ready to rip ${location.pathname}, click to start`,
							'RIPSter ready',
							null, extract)
		} catch (e) {
			console.error(e)
			console.count('raf')
			raf(loop)
		}
	})
} catch (e) {
	console.error(e)
} finally {
	console.info('ripster running')
}