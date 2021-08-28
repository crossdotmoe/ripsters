// ==UserScript==
// @name         lq-comicwalker-ripster
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  rips comicwalker images
// @author       zeen3
// @match        https://comic-walker.com/viewer/?*
// @match        https://comic-walker.com/contents/detail/*
// @connect      https://ssl.seiga.nicovideo.jp/api/v1/comicwalker/episodes/*
// @connect      ssl.seiga.nicovideo.jp
// @connect      https://nicoseiga.cdn.nimg.jp/drm/image/*
// @connect      nicoseiga.cdn.nimg.jp
// @run-at       document-end
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @require      https://ripsters.zeen3.xyz/ripster-shared.js
// ==/UserScript==
const {__downloadFile__: dl, delay, nt, registerGMDL } = self[self['next-tick']].suicide()
//registerGMDL(o => console.log(o, GM_download(o), GM_download))
let then = Promise.resolve()
const files = {}
const onload = async ({context: {img, imgs, drm, res}, response}) => {
	const u64l = response.byteLength >>> 3, rem = response.byteLength & 7
	const drmd = new BigUint64Array(response, 0, u64l)
	const [udrm64] = new BigUint64Array(drm.buffer)
	let i = 0
	console.time(`${udrm64} / ${imgs}`)
	console.log('%i/%d: key %s iter %d+%d [%d]', img, imgs, udrm64.toString(16).padStart(16, '0'), u64l, rem, response.byteLength)
	while (i < u64l) drmd[i++] ^= udrm64
	const u8drmd = new Uint8Array(response, (u64l << 3) >>> 0, rem)
	i = 0
	while (i < rem) u8drmd[i] ^= drm[i++]
	const name = img.toString().padStart(4, '0') + '.jpg'
	const I = new File([response], name, {type: 'image/jpeg', name})
	console.log(I)
	then = then.then(() => dl(I))
	res(I)
	console.timeEnd(`${udrm64} / ${imgs}`)
	return I
}
const drmd = drm_hash => {
	const a = new ArrayBuffer(8)
	new DataView(a).setBigUint64(0, '0x' + drm_hash.slice(0,16))
	return new Uint8Array(a)
}
const getFrames = cid => `https://ssl.seiga.nicovideo.jp/api/v1/comicwalker/episodes/${cid}/frames`
const download = (cid, {ready} = {}, name = document.title) => console.log(GM_xmlhttpRequest({
	url: getFrames(cid),
	responseType: 'json',
	method: 'GET',
	fetch: true,
	async onload(resp) {
		let imgs = resp.response.data.result
		console.log(imgs)
		let i = 0
		const xhr = resolve => {
			if (imgs[i].meta.source_url in files) {resolve(); return dl(files[imgs[i].meta.source_url])}
			let res, rej
			files[imgs[i].meta.source_url] = new Promise((r, j) => {res = o => r(o); rej = k => j(k)})
			let x = GM_xmlhttpRequest({
				context: {img: i + 1, imgs: imgs.length, drm: drmd(imgs[i].meta.drm_hash), res, rej},
				responseType: 'arraybuffer',
				url: imgs[i].meta.source_url,
				method: 'GET',
				fetch: true,
				onloadstart(){resolve()},
				onprogress(){resolve()},
				onloadend(){resolve()},
				onload
			})
			setTimeout(resolve, 100)
		}
		await ready
		then = then.then(() => dl(new File([JSON.stringify({u: location.href, cid, imgs},
														   null, '\t')],
										   name + '-placement.json',
										   {type:'application/json'})))
		GM_notification(`Downloading ${imgs.length} files, please wait...`)
		do {
			await (files[imgs[i].meta.source_url] || (
				files[imgs[i].meta.source_url] = new Promise(xhr)))
		} while (++i < imgs.length);
	}
}))
if (location.pathname.startsWith('/viewer/')) {
	const cid = new URLSearchParams(location.search).get('cid')
	GM_notification('comic walker ripster ready to download; click to start',
					'comic ripster ready to download ' + cid,
					null, () => download(cid))
} else {
	const mkready = cid => {
		if (cid in files) return files[cid]
		let res, rej
		const ready = (files[cid] = new Promise((r, j) => {res = o => r(o); rej = k => j(k)}))
		if (!ready.res) ready.res = res
		if (!ready.rej) ready.rej = rej
		return ready
	}
	const {onclick} = {onclick(e) {
		const cid = new URLSearchParams(this.search).get('cid')
		const ready = mkready(cid)
		download(cid, {ready}, this.title.split(/\s+/g).join(' '))
		if (confirm(`Would you prefer to download cid ${cid} (text: ${this.innerText ||
					this.title}) instead of attempting to view it?`) &&
			(e.preventDefault(), 1)) return ready.res()
	}}
	let lns = []
	for (const a of document.links) if (a.pathname === '/viewer/') {a.addEventListener('click', onclick); lns.push(a)}
	console.log(lns)
	GM_notification(`ready to download following cids: ${lns.map(a => new URLSearchParams(a.search).get('cid')).join(', ')}`,
					`comic walker ripster init with ${lns.length} links downloadable`,
					null,
					() => {
		lns.forEach(a => a.click())
	})
}