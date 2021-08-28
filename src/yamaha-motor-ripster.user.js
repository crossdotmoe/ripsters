// ==UserScript==
// @name         yamaha-motor-ripster
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  rips comics from yamaha-motor.co.jp/mc/lineup/
// @author       zeen3
// @match        https://www.yamaha-motor.co.jp/mc/lineup/*/*/*
// @grant        GM_download
// @grant        GM_notification
// @run-at       document-idle
// ==/UserScript==

const gdl = (url, name) => new Promise((onload, onerror) => GM_download({url, name, headers: {'X-Requested-With': 'XMLHttpRequest'},
																		 saveAs: true, onload, onerror, ontimeout: onerror}))
let i = 0
requestIdleCallback(async function eggdk() {
	try {
		const dlAll = async () => {
			for (const a of comicImageList) {
				for (const {id, src} of a) {
					await gdl(new URL(src, location.href).href,
							  prompt('Filename (esc to cancel):',
									 id + src.slice(src.lastIndexOf('.'))))
				}
			}
		}
		GM_notification(`ripster ready to download ${comicImageList.reduce((a, {length}) => a + length, 0)} images, click to start`,
						'yamaha-motor ripster ready to download', null, dlAll)
		console.dir({get click_dots_to_start_downloading() {return dlAll()}})
	} catch (e) {
		console.error(e)
		if (i++ > 10) throw e
		requestIdleCallback(eggdk)
		window.comicImageList = comicImageList
	}
});