// ==UserScript==
// @name         lq-alphapolis-ripster
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  rips images from alphapolis
// @author       zeen3
// @match        https://www.alphapolis.co.jp/*
// @grant        GM_notification
// @grant        GM_xmlhttpRequest
// @connect      cdn-image.alphapolis.co.jp
// @require      https://ripsters.zeen3.xyz/ripster-shared.js
// @run-at       document-start
// ==/UserScript==

const {__downloadFile__, xhr, registerGMXHR} = self[self["next-tick"]].suicide();
registerGMXHR(GM_xmlhttpRequest)
document.addEventListener('DOMContentLoaded', async function() {
	const page_list = [];
	{
		const pager = /^[\t\x20]*_pages\.push\("(h.*?)"\);\s*?$/gm;
		const ps = Array.from(document.scripts, v => (v.id || v.src || v.type) ? '' : v.innerHTML).find(v => v && v.includes("_pages"));
		while (1) {
			const x = pager.exec(ps);
			if (!x) break;
			page_list.push(x[1]);
		}
	}
	let abcd = Array(page_list.length);
	for (const [i, v] of page_list.entries()) {
		const f = () => xhr(v, {as: 'file', context: {name: i.toString().padStart(4, '0') + '.jpg'}});
		abcd[i] = Promise.resolve(abcd[i - 4]).then(f);
	}
	await __downloadFile__(new File([JSON.stringify(page_list, null, 2)], 'placement.json'));
	for await (const file of abcd) await __downloadFile__(file)
}, {"once": true});
