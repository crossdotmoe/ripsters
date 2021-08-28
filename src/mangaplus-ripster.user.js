// ==UserScript==
// @name         mangaplus-ripster
// @namespace    http: //tampermonkey.net/
// @version      0.5.2
// @description  rips protobuf stuff out of mangaplus
// @author       zeen3
// @match        https://mangaplus.shueisha.co.jp/*
// @grant        GM_notification
// @require      https://ripsters.zeen3.xyz/ripster-shared.js
// @require      https://ripsters.zeen3.xyz/protobuf.js
// ==/UserScript==

// inline uuidgenv4
// variant of https://zeen3.gitlab.io/uuidgen4/uuidgen4-browser.mjs

//const H = Array.from('0123456789abcdef', s => s.charCodeAt(0))
//const H = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 97, 98, 99, 100, 101, 102]
//Object.freeze(H)
/**@inline*/
const H = v => v + (v < 10 ? 48 : 87)
const rnd = new Uint8Array(16)
const uuid = () => {
	crypto.getRandomValues(rnd);
	rnd[6] = (rnd[6] & 0x0F) | 0x40;
	rnd[8] = (rnd[8] & 0x3F) | 0x80;
	return String.fromCodePoint(
		// 8-4-4-4-12
		H(rnd[0] >>> 4), H(rnd[0] & 15), H(rnd[1] >>> 4), H(rnd[1] & 15),
		H(rnd[2] >>> 4), H(rnd[2] & 15), H(rnd[3] >>> 4), H(rnd[3] & 15), 0x2D,
		H(rnd[4] >>> 4), H(rnd[4] & 15), H(rnd[5] >>> 4), H(rnd[5] & 15), 0x2D,
		H(rnd[6] >>> 4), H(rnd[6] & 15), H(rnd[7] >>> 4), H(rnd[7] & 15), 0x2D,
		H(rnd[8] >>> 4), H(rnd[8] & 15), H(rnd[9] >>> 4), H(rnd[9] & 15), 0x2D,
		H(rnd[10]>>> 4), H(rnd[10]& 15), H(rnd[11]>>> 4), H(rnd[11]& 15),
		H(rnd[12]>>> 4), H(rnd[12]& 15), H(rnd[13]>>> 4), H(rnd[13]& 15),
		H(rnd[14]>>> 4), H(rnd[14]& 15), H(rnd[15]>>> 4), H(rnd[15]& 15),
	)
}

try {
	const nt = self[self['next-tick']].suicide()
	const protobuf = window.protobuf || protobuf
	const mangaplus = protobuf.Root.fromJSON({
		nested: {
			reader: {
				nested: {
					Popup: {
						fields: {
							osDefault: { type: "OSDefault", id: 1 },
							appDefault: { type: "AppDefault", id: 2 } },
						nested: {
							AppDefault: {
								fields: {
									imageUrl: { type: "string", id: 1 },
									action: { type: "TransitionAction", id: 2 } } },
							Button: {
								fields: {
									text: { type: "string", id: 1 },
									action: { type: "TransitionAction", id: 2 } } },
							OSDefault: {
								fields: {
									subject: { type: "string", id: 1 },
									body: { type: "string", id: 2 },
									okButton: { type: "Button", id: 3 },
									neautralButton: { type: "Button", id: 4 },
									cancelButton: { type: "Button", id: 5 } } } } },
					HomeView: {
						fields: {
							topBanners: { rule: "repeated", type: "Banner", id: 1 },
							groups: { rule: "repeated", type: "UpdatedTitleGroup", id: 2 },
							popup: { type: "Popup", id: 9 } } },
					Feedback: {
						fields: {
							timeStamp: { type: "uint32", id: 1 },
							body: { type: "string", id: 2 },
							responseType: { type: "ResponseType", id: 3 } },
						nested: {
							ResponseType: { values: { QUESTION: 0, ANSWER: 1 } } } },
					FeedbackView: {
						fields: {
							feedbackList: { rule: "repeated", type: "Feedback", id: 1 } } },
					RegistrationData: {
						fields: {
							deviceSecret: { type: "string", id: 1 } } },
					Sns: {
						fields: {
							body: { type: "string", id: 1 },
							url: { type: "string", id: 2 } } },
					Chapter: {
						fields: {
							titleId: { type: "uint32", id: 1 },
							chapterId: { type: "uint32", id: 2 },
							name: { type: "string", id: 3 },
							subTitle: { type: "string", id: 4 },
							thumbnailUrl: { type: "string", id: 5 },
							startTimeStamp: { type: "uint32", id: 6 },
							endTimeStamp: { type: "uint32", id: 7 },
							alreadyViewed: { type: "bool", id: 8 },
							isVerticalOnly: { type: "bool", id: 9 } } },
					AdNetwork: {
						oneofs: {
							Network: { oneof: [ "facebook", "admob", "adsense" ] } },
						fields: {
							facebook: { type: "Facebook", id: 1 },
							admob: { type: "Admob", id: 2 },
							adsense: { type: "Adsense", id: 3 } },
						nested: {
							Facebook: {
								fields: {
									placementID: { type: "string", id: 1 } } },
							Admob: {
								fields: {
									unitID: { type: "string", id: 1 } } },
							Adsense: {
								fields: {
									unitID: { type: "string", id: 1 } } } } },
					AdNetworkList: {
						fields: {
							adNetworks: { rule: "repeated", type: "AdNetwork", id: 1 } } },
					Page: {
						oneofs: {
							data: { oneof: [ "mangaPage", "bannerList", "lastPage", "advertisement" ] } },
						fields: {
							mangaPage: { type: "MangaPage", id: 1 },
							bannerList: { type: "BannerList", id: 2 },
							lastPage: { type: "LastPage", id: 3 },
							advertisement: { type: "AdNetworkList", id: 4 } },
						nested: {
							PageType: { values: { SINGLE: 0, LEFT: 1, RIGHT: 2, DOUBLE: 3 } },
							ChapterType: { values: { LATEST: 0, SEQUENCE: 1, NOSEQUENCE: 2 } },
							BannerList: {
								fields: {
									bannerTitle: { type: "string", id: 1 },
									banners: { rule: "repeated", type: "Banner", id: 2 } } },
							MangaPage: {
								fields: {
									imageUrl: { type: "string", id: 1 },
									width: { type: "uint32", id: 2 },
									height: { type: "uint32", id: 3 },
									type: { type: "PageType", id: 4 },
									encryptionKey: { type: "string", id: 5 } } },
							LastPage: {
								fields: {
									currentChapter: { type: "Chapter", id: 1 },
									nextChapter: { type: "Chapter", id: 2 },
									topComments: { rule: "repeated", type: "Comment", id: 3 },
									isSubscribed: { type: "bool", id: 4 },
									nextTimeStamp: { type: "uint32", id: 5 },
									chapterType: { type: "int32", id: 6 } } } } },
					MangaViewer: {
						fields: {
							pages: { rule: "repeated", type: "Page", id: 1 },
							chapterId: { type: "uint32", id: 2 },
							chapters: { rule: "repeated", type: "Chapter", id: 3 },
							sns: { type: "Sns", id: 4 },
							titleName: { type: "string", id: 5 },
							chapterName: { type: "string", id: 6 },
							numberOfComments: { type: "int32", id: 7 },
							isVerticalOnly: { type: "bool", id: 8 },
							titleId: { type: "uint32", id: 9 },
							startFromRight: { type: "bool", id: 10 } } },
					Title: {
						fields: {
							titleId: { type: "uint32", id: 1 },
							name: { type: "string", id: 2 },
							author: { type: "string", id: 3 },
							portaitImageUrl: { type: "string", id: 4 },
							landscapeImageUrl: { type: "string", id: 5 },
							viewCount: { type: "uint32", id: 6 },
							language: { type: "Language", id: 7 } },
						nested: {
							Language: {
								values: { ENGLISH: 0, SPANISH: 1 } } } },
					TitleDetailView: {
						fields: {
							title: { type: "Title", id: 1 },
							titleImageUrl: { type: "string", id: 2 },
							overview: { type: "string", id: 3 },
							backgroundImageUrl: { type: "string", id: 4 },
							nextTimeStamp: { type: "uint32", id: 5 },
							updateTiming: { type: "UpdateTiming", id: 6 },
							viewingPeriodDescription: { type: "string", id: 7 },
							nonAppearanceInfo: { type: "string", id: 8 },
							firstChapterList: { rule: "repeated", type: "Chapter", id: 9 },
							lastChapterList: { rule: "repeated", type: "Chapter", id: 10 },
							banners: { rule: "repeated", type: "Banner", id: 11 },
							recommendedTitleList: { rule: "repeated", type: "Title", id: 12 },
							sns: { type: "Sns", id: 13 },
							isSimulReleased: { type: "bool", id: 14 },
							isSubscribed: { type: "bool", id: 15 },
							rating: { type: "Rating", id: 16 },
							chaptersDescending: { type: "bool", id: 17 },
							numberOfViews: { type: "uint32", id: 18 } },
						nested: {
							Rating: {
								values: { ALLAGE: 0, TEEN: 1, TEENPLUS: 2, MATURE: 3 } },
							UpdateTiming: {
								values: {
									NOT_REGULARLY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3,
									THURSDAY: 4, FRIDAY: 5, SATURDAY: 6, SUNDAY: 7, DAY: 8 } } } },
					UpdatedTitle: {
						fields: {
							title: { type: "Title", id: 1 },
							chapterId: { type: "uint32", id: 2 },
							chapterName: { type: "string", id: 3 },
							chapterSubTitle: { type: "string", id: 4 },
							isLatest: { type: "bool", id: 5 },
							isVerticalOnly: { type: "bool", id: 6 } } },
					UpdateProfileResultView: {
						fields: {
							result: { type: "Result", id: 1 } },
						nested: {
							Result: {
								values: { SUCCESS: 0, DUPLICATED: 1, NG_WORD: 2 } } } },
					UpdatedTitleGroup: {
						fields: {
							groupName: { type: "string", id: 1 },
							titles: { rule: "repeated", type: "UpdatedTitle", id: 2 } } },
					TransitionAction: {
						fields: {
							method: { type: "PresentationMethod", id: 1 },
							url: { type: "string", id: 2 } },
						nested: {
							PresentationMethod: { values: { PUSH: 0, MODAL: 1, EXTERNAL: 2 } } } },
					Banner: {
						fields: {
							imageUrl: { type: "string", id: 1 },
							action: { type: "TransitionAction", id: 2 },
							id: { type: "uint32", id: 3 } } },
					WebHomeView: {
						fields: {
							topBanners: { rule: "repeated", type: "Banner", id: 1 },
							groups: { rule: "repeated", type: "UpdatedTitleGroup", id: 2 },
							ranking: { rule: "repeated", type: "Title", id: 3 } } },
					TitleList: {
						fields: {
							listName: { type: "string", id: 1 },
							featuredTitles: { rule: "repeated", type: "Title", id: 2 } } },
					FeaturedTitlesView: {
						fields: {
							mainBanner: { type: "Banner", id: 1 },
							subBanner_1: { type: "Banner", id: 2 },
							subBanner_2: { type: "Banner", id: 3 },
							contents: { rule: "repeated", type: "Contents", id: 4 } },
						nested: {
							Contents: {
								oneofs: {
									data: { oneof: [ "banner", "titleList" ] } },
								fields: {
									banner: { type: "Banner", id: 1 },
									titleList: { type: "TitleList", id: 2 } } } } },
					ProfileSettingsView: {
						fields: {
							iconList: { rule: "repeated", type: "CommentIcon", id: 1 },
							userName: { type: "string", id: 2 },
							myIcon: { type: "CommentIcon", id: 3 } } },
					Comment: {
						fields: {
							id: { type: "uint32", id: 1 },
							index: { type: "uint32", id: 2 },
							userName: { type: "string", id: 3 },
							iconUrl: { type: "string", id: 4 },
							isMyComment: { type: "bool", id: 6 },
							alreadyLiked: { type: "bool", id: 7 },
							numberOfLikes: { type: "uint32", id: 9 },
							body: { type: "string", id: 10 },
							created: { type: "uint32", id: 11 } } },
					CommentIcon: {
						fields: {
							id: { type: "uint32", id: 1 },
							imageUrl: { type: "string", id: 2 } } },
					CommentListView: {
						fields: {
							comments: { rule: "repeated", type: "Comment", id: 1 },
							ifSetUserName: { type: "bool", id: 2 } } },
					InitialView: {
						fields: {
							gdprAgreementRequired: { type: "bool", id: 1 },
							englishTitlesCount: { type: "uint32", id: 2 },
							spanishTitlesCount: { type: "uint32", id: 3 } } },
					SettingsView: {
						fields: {
							myIcon: { type: "CommentIcon", id: 1 },
							userName: { type: "string", id: 2 },
							noticeOfNewsAndEvents: { type: "bool", id: 3 },
							noticeOfUpdatesOfSubscribedTitles: { type: "bool", id: 4 },
							englishTitlesCount: { type: "uint32", id: 5 },
							spanishTitlesCount: { type: "uint32", id: 6 } } },
					TitleRankingView: {
						fields: {
							titles: { rule: "repeated", type: "Title", id: 1 } } },
					AllTitlesView: {
						fields: {
							titles: { rule: "repeated", type: "Title", id: 1 } } },
					SubscribedTitlesView: {
						fields: {
							titles: { rule: "repeated", type: "Title", id: 1 } } },
					ServiceAnnouncement: {
						fields: {
							title: { type: "string", id: 1 },
							body: { type: "string", id: 2 },
							date: { type: "int32", id: 3 } } },
					ServiceAnnouncementsView: {
						fields: {
							serviceAnnouncements: { rule: "repeated", type: "ServiceAnnouncement", id: 1 } } },
					SuccessResult: {
						oneofs: {
							data: { oneof: [
								"registerationData",  "homeView",  "featuredTitlesView",  "allTitlesView",
								"titleRankingView",  "subscribedTitlesView",  "titleDetailView",  "commentListView",
								"mangaViewer", "webHomeView", "settingsView", "profileSettingsView", "updateProfileResultView",
								"serviceAnnouncementsView", "initialView", "feedbackView" ] } },
						fields: {
							isFeaturedUpdated: { type: "bool", id: 1 },
							registerationData: { type: "RegistrationData", id: 2 },
							homeView: { type: "HomeView", id: 3 },
							featuredTitlesView: { type: "FeaturedTitlesView", id: 4 },
							allTitlesView: { type: "AllTitlesView", id: 5 },
							titleRankingView: { type: "TitleRankingView", id: 6 },
							subscribedTitlesView: { type: "SubscribedTitlesView", id: 7 },
							titleDetailView: { type: "TitleDetailView", id: 8 },
							commentListView: { type: "CommentListView", id: 9 },
							mangaViewer: { type: "MangaViewer", id: 10 },
							webHomeView: { type: "WebHomeView", id: 11 },
							settingsView: { type: "SettingsView", id: 12 },
							profileSettingsView: { type: "ProfileSettingsView", id: 13 },
							updateProfileResultView: { type: "UpdateProfileResultView", id: 14 },
							serviceAnnouncementsView: { type: "ServiceAnnouncementsView", id: 15 },
							initialView: { type: "InitialView", id: 16 },
							feedbackView: { type: "FeedbackView", id: 17 } } },
					ErrorResult: {
						fields: {
							action: { type: "Action", id: 1 },
							englishPopup: { type: "Popup.OSDefault", id: 2 },
							spanishPopup: { type: "Popup.OSDefault", id: 3 },
							debugInfo: { type: "string", id: 4 } },
						nested: {
							Action: { values: { DEFAULT: 0, UNAUTHORIZED: 1, MAINTAINENCE: 2, GEOIP_BLOCKING: 3 } } } },
					Response: {
						oneofs: { data: { oneof: [ "success", "error" ] } },
						fields: {
							success: { type: "SuccessResult", id: 1 },
							error: { type: "ErrorResult", id: 2 } } } } } } });
	mangaplus.name = 'mangaplus'
	const ok = mangaplus.lookupType('SuccessResult')
	const resp = mangaplus.lookupType('Response')
	async function* iter_chain(...iters) { for await (const iter of iters) yield* iter != null ? iter : [] }
	const dlAll = async files => { focus(); for await (const file of files) await nt.__downloadFile__(file) }
	const rdeal = (page, name) => async res => {
		// Could be done in a serviceworker which is actually far more annoying
		// I do it in a stream because it is a little bit simpler for me (and faster, since it's usually len <= 0x10000)
		// Was going to run in a ReadableStream but sadly not possible
		const len = Math.ceil(page.encryptionKey.length / 2)
		const key = new Uint8Array(len)
		for (let i = 0; i < len; ++i) key[i] = Number.parseInt(page.encryptionKey.slice(i << 1, 2 + (i << 1)), 16)
		const reader = res.body.getReader(), pieces = [], type = res.headers.get('content-type') || 'image/jpeg'
		//const max = +res.headers.get('content-length')
		let off = 0, iters = 0
		while (++iters) {
			let {done, value} = await reader.read()
			if (done) break

			if (ArrayBuffer.isView(value)) value = new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
			else value = new Uint8Array(value)

			for (let i = 0, l = value.byteLength; i < l; ++i) {
				value[i] ^= key[off]
				if (++off === len) off = 0
			}
			pieces.push(value)
		}
		//console.log(`Took %d iters for %d bytes (${'%d, '.repeat(pieces.length).slice(0, -2)} lengths) on %s`,
		//            iters, max, ...pieces.map(v=>v.length), res.url)
		return new File(pieces, `${name}.${type.slice(6)}`, {type})
	}
	const fetchPage = async (cid, UUID = uuid()) => {
		const d = await fetchData(`manga_viewer?chapter_id=${+cid}&split=yes&img_quality=high`, UUID)
		const files = [
			new File(
				[JSON.stringify(d, null, '\t')],
				`ch-${cid}_placement.json`,
				{type: 'application/json'}
			)
		]
		let n = 0
		for (const {mangaPage: page} of d.mangaViewer.pages) {
			if (page == null) continue
			files.push(
				fetch(page.imageUrl, {headers: {'SESSION-TOKEN': UUID}, cache: 'force-cache'})
				.then(rdeal(page, `${cid}_${String(++n).padStart(4, '0')}`))
			)
			await nt.ntp()
		}
		return files
	};
	const fetchTitle = async (tid, UUID = uuid()) => {
		const d = await fetchData(`title_detail?title_id=${+tid}`, UUID)
		let last = dlAll([new File([JSON.stringify(d, null, '\t')], `title-${tid}_placement.json`, {type: 'application/json'})])
		for await (const chapter of iter_chain(d.titleDetailView.firstChapterList, d.titleDetailView.lastChapterList)) {
			const files = await fetchPage(chapter.chapterId, UUID)
			await last; last = dlAll(files)
		}
	}
	const fetchData = async (u, UUID = uuid()) => {
		const f = await fetch('https://jumpg-webapi.tokyo-cdn.com/api/' + u, {
			headers: {
				'SESSION-TOKEN': UUID,
				Accept: 'application/json, text/plain, */*'
			},
			cache: 'force-cache'
		})
		const d = resp.decode(new Uint8Array(await f.arrayBuffer()))
		console.assert(d.success != null, 'return successfully for %O', d)
		d.success ? console.dir(d.success) : console.error(d.error)
		return d.success || Promise.reject(d.error)
	}
	let prev
	const upprev = () => {
		if (prev !== location.pathname) {
			prev = location.pathname
			let u = prev.slice(1).split('/')
			switch (u[0]) {
				case 'viewer':
					GM_notification(`Click to download chapter id ${u[1]}`, 'mangaplus-ripster', null, () => fetchPage(u[1]).then(dlAll))
					nt.mkClickToStart(() => fetchPage(u[1]), `Click dots to dl chapter id ${u[1]}`)
					break
				case 'titles':
					GM_notification(`Click to download available for title id ${u[1]}`, 'mangaplus-ripster', null, () => fetchTitle(u[1]))
					nt.mkClickToStart(() => fetchTitle(u[1]), `Click dots to dl available for title id ${u[1]}`)
			}
		}
	}
	setInterval(upprev, 1023)
	requestAnimationFrame(upprev)
	//let _uuid
	//const fetchDataURL = async u => {await fetchData(u, _uuid || (_uuid = uuid()))}
	//console.log(
	//	'Call %O after storing as global with a dataUrl to get info (returns a promise, logs a success/errorresult to the console)',
	//	fetchDataURL
	//)
	console.log({mangaplus, resp, fetchData})
	const {apply} = Reflect
	const {addEventListener} = EventTarget.prototype
	function XHRLogger() {
		if (this.responseType === 'arraybuffer') {
			let {response} = this
			console.group('api xhr resp')
			try { console.dir(resp.decode(new Uint8Array(response))) }
			catch(e) { console.error(e) }
			finally { console.groupEnd('api xhr resp') }
		}
	}
	const XHRLoad = Object.freeze(['load', XHRLogger, {once: true}])
	XMLHttpRequest.prototype.open = new Proxy(XMLHttpRequest.prototype.open, {
		apply(fn, self, args) {
			apply(fn, self, args)
			if (args[1].startsWith(`https://jumpg-webapi.tokyo-cdn.com/api/`)) {
				console.trace('api call')
				apply(addEventListener, self, XHRLoad)
			}
		}
	})
} catch (e) {
	console.error(e)
} finally {
	Reflect.deleteProperty(window, 'protobuf')
}
