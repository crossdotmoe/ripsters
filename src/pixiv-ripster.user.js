// ==UserScript==
// @name         pixiv-ripster
// @namespace    http://tampermonkey.net/
// @version      0.3.1
// @description  rips images from pixiv, comic.pixiv
// @author       zeen3
// @match        https://www.pixiv.net/member_illust.php?*
// @match        https://pixiv.net/member_illust.php?*
// @match        https://comic.pixiv.net/viewer/stories/*
// @connect      i.pximg.net
// @connect      img-comic.pximg.net
// @grant        GM_notification
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// @require      https://ripsters.zeen3.xyz/ripster-shared.js
// ==/UserScript==

const nt = window[window['next-tick']].suicide();
// nt.registerGMDL(GM_download)
const member_illust = async (i = 0) => {
	if (!(typeof pixiv === 'object' && pixiv.context && pixiv.context.images.length)) return nt(member_illust, ++i)
	const imgs = pixiv.context.images
	const dlAll = async () => {
		await nt.__downloadFile__(new File([JSON.stringify(pixiv.context)], 'placement.json', {type: 'application/json'}))
		let j = 0
		do await nt.__downloadFile__(imgs[j], (j+1).toString(10).padStart(4, '0') +
									 (imgs[j].slice(imgs[j].lastIndexOf('.')) || '.jpg'),
									 {referer: 'https://www.pixiv.net', accept: 'image/apng,image/*,*/*;q=0.8'})
		while (++j < imgs.length);
	}
	nt(
		GM_notification,
		`ready to download ${imgs.length}`,
		`pixiv-ripster::illust: ready to download ${imgs.length} images`,
		null, dlAll
	)
	nt.mkClickToStart(dlAll, 'download images')
}
const srcrpl = s => s.replace(/q=\d+/g, 'q=100').replace(/f=(webp|jpeg)%3Ajpeg|f=jpeg|f=jpg/g, 'f=png')
const install_base_viewer_proxy = async (n = 1) => {
	if (typeof BaseViewer === 'undefined') return nt(install_base_viewer_proxy, ++n)
	BaseViewer.prototype.makeImage = new Proxy(BaseViewer.prototype.makeImage, {
		apply(fn, self, args) {
			const upsrc = srcrpl(args[0])
			console.debug(`BaseViewer.protoype.makeImage/%O applied on %O with %s, upgrading to %s.`, fn, self, args[0], upsrc)
			let it = im.get(upsrc) || new Image
			if (!g.size) nt(g, self)
			im.set(upsrc, it)
			if (!it.src) it.src = upsrc
			it.complete && nt(olf, it)
			return it
		}
	})
	const g = self => {
		for (const {pages} of self.pageInfo.contents) for (const {left, right} of pages) {left &&(left.data.url = srcrpl(left.data.url)); right && (right.data.url = srcrpl(right.data.url))}
	}, im = new Map(), olf = i => 'function' === typeof i.onload ?
		  Reflect.apply(i.onload, i, [new Event()]) : i.dispatchEvent(new Event('load'))
	}
const comic_viewer = async () => {
	nt(install_base_viewer_proxy)
	let vau = document.querySelector('meta[name="viewer-api-url"]')
	while (!vau) {vau = document.querySelector('meta[name="viewer-api-url"]'); await nt.praf()}
	const j = await fetch(vau.content, {
		cache: 'force-cache',
		headers:{'X-Requested-With': 'XMLHttpRequest'}
	}).then(r=>r.ok?r.json():Promise.reject(r))
	const _pages = (pages, {left, right}) => {
		right && pages.push(srcrpl(right.data.url))
		left && pages.push(srcrpl(left.data.url))
		return pages
	},
		  _contents = ({pages, title, sub_title}) => {
			  const pp = []
			  pp.title = title
			  pp.sub_title = sub_title
			  pp.name = `${title} - ${sub_title}`
			  return pages.reduce(_pages, pp)
		  }
	const contents = j.data.contents.map(_contents),
		  dlAll = async imga => {
			  for (const as of imga) {
				  await nt.__downloadFile__(new File([JSON.stringify(as)], 'placement.json', {type: 'application/json'}))
				  for (let i = 0; i < as.length;) {
					  await nt.__downloadFile__(as[i++], `${as.name} - ${i.toString(10).padStart(4, 0)}.png`, {
						  accept: 'image/webp,image/apng,image/*,*/*;q=0.8',
						  referer: 'https://comic.pixiv.net/'
					  })
				  }
			  }
		  },
		  notify = c => {
			  GM_notification(`ready to download ${c.map(a => a.name).join('; ')}`,
							  `pixiv-ripster::comic: ready to download ${c.reduce((s,a)=>s+a.length,0)} images`,
							  null, () => dlAll(c))
			  console.log({get click_to_download() {return dlAll(c)}})
			  console.log(c)
		  }
	nt(notify, contents)
}
switch (location.host) {
	case 'pixiv.net':
	case 'www.pixiv.net':
		member_illust()
		break
	case 'comic.pixiv.net':
		comic_viewer()
		break
}
