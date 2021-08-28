// ==UserScript==
// @name yomonga-ripster
// @namespace https://ripsters.zeen3.xyz
// @version 1.0.0-prerelease
// @description rips images off of yomonga.com
// @grant GM_notification
// @run-at document-start
// @require https://ripsters.zeen3.xyz/ripster-shared.js
// @require https://ripsters.zeen3.xyz/protobuf.js
// @match https://www.yomonga.com/*
// ==/UserScript==
"use strict";
try {
    const fetch_orig = fetch;
    const {protobuf} = window;
    Reflect.deleteProperty(window, 'protobuf');
    if (!navigator.userAgent.includes('Mobile') && location.pathname === '/pc/') {
        throw new class UserError extends Error {
            constructor() {
                super("Use mobile UA for first load");
                this.name = "UserError";
            }
        };
    }
    const { nt } = self[self['next-tick']].suicide();
    const {addEventListener} = XMLHttpRequest.prototype;
    const {apply} = Reflect;

    const yomonga = new protobuf.Root().addJSON({
        updates: {
            nested: {
                UpdatesResponse: {
                    fields: {
                        titles: { rule: "repeated", type: "title.Summary", id: 1 },
                        isFirstTitleHighlighted: { type: "bool", id: 2 } } },
                UpdatesRequest: {
                    fields: {
                        day: { type: "Day", id: 1 } },
                    nested: {
                        Day: { values: { MON: 0, TUE: 1, WED: 2, THU: 3, FRI: 4, SAT: 5, SUN: 6 } } } } } },
        title: {
            nested: {
                Summary: {
                    fields: {
                        id: { type: "uint32", id: 1 },
                        thumbnailUrl: { type: "string", id: 2 },
                        name: { type: "string", id: 3 },
                        authorName: { type: "string", id: 4 },
                        catchCopy: { type: "string", id: 5 },
                        description: { type: "string", id: 6 },
                        isRecentlyUpdate: { type: "bool", id: 101 },
                        bookmarkCount: { type: "uint32", id: 102 },
                        ticketInfo: { type: "common.TicketInfo", id: 103 },
                        remainingRentalTime: { type: "uint32", id: 201 } } },
                DetailResponse: {
                    fields: {
                        id: { type: "uint32", id: 1 },
                        coverImageUrl: { type: "string", id: 2 },
                        name: { type: "string", id: 3 },
                        authorName: { type: "string", id: 4 },
                        updateInfo: { type: "string", id: 5 },
                        tags: { rule: "repeated", type: "common.Tag", id: 6 },
                        description: { type: "string", id: 7 },
                        notification: { type: "string", id: 8 },
                        bookmarkCount: { type: "uint32", id: 101 },
                        ticketInfo: { type: "common.TicketInfo", id: 102 },
                        externalLinks: { rule: "repeated", type: "ExternalLink", id: 103 },
                        chapters: { rule: "repeated", type: "chapter.Summary", id: 200 },
                        currency: { type: "common.Currency", id: 300 } },
                    nested: {
                        ExternalLink: {
                            fields: {
                                description: { type: "string", id: 1 },
                                imageUrl: { type: "string", id: 2 },
                                externalLinkUrl: { type: "string", id: 3 } } } } },
                ChunkResponse: {
                    fields: {
                        subject: { type: "string", id: 1 },
                        titles: { rule: "repeated", type: "Summary", id: 2 } } },
                Request: {
                    fields: {
                        titleId: { type: "uint32", id: 1 } } },
                RequestChunk: {
                    fields: {
                        type: { type: "Type", id: 1 },
                        id: { type: "uint32", id: 2 } },
                    nested: {
                        Type: { values: { TAG: 0, SECTION: 1 } } } } } },
        common: {
            nested: {
                Currency: {
                    fields: {
                        bonusCoins: { type: "int32", id: 1 },
                        paidCoins: { type: "int32", id: 2 } } },
                MoveTo: {
                    fields: {
                        title: { type: "uint32", id: 1 },
                        titlesWithTag: { type: "Tag", id: 2 },
                        url: { type: "string", id: 3 },
                        sectionId: { type: "uint32", id: 4 } } },
                Tag: {
                    fields: {
                        id: { type: "uint32", id: 1 },
                        name: { type: "string", id: 2 } } },
                TicketInfo: {
                    fields: {
                        nextRecoveryDate: { type: "string", id: 1 } } } } },
        chapter: {
            nested: {
                ViewerResponse: {
                    fields: {
                        detail: { type: "Detail", id: 1 },
                        error: { type: "Error", id: 2 } },
                    nested: {
                        Detail: {
                            fields: {
                                pages: { rule: "repeated", type: "Page", id: 1 },
                                name: { type: "string", id: 2 },
                                titleId: { type: "uint32", id: 3 },
                                isVerticalScrollView: { type: "bool", id: 4 } },
                            nested: {
                                Page: {
                                    fields: {
                                        image: { type: "Image", id: 1 },
                                        last: { type: "Last", id: 2 } },
                                    nested: {
                                        Image: {
                                            fields: {
                                                url: { type: "string", id: 1 },
                                                descriptionKey: { type: "string", id: 2 } } },
                                        Last: {
                                            fields: {
                                                next: { type: "Summary", id: 1 },
                                                recommendedTitles: { rule: "repeated", type: "title.Summary", id: 2 },
                                                isBookmarked: { type: "bool", id: 101 },
                                                tickedInfo: { type: "common.TicketInfo", id: 102 },
                                                currency: { type: "common.Currency", id: 103 } } } } } } },
                        Error: {
                            fields: {
                                info: { type: "Info", id: 1 },
                                summary: { type: "Summary", id: 2 } },
                            nested: {
                                Info: { values: { LOGGIN_NEEDED: 0, NOT_PURCHASED: 1 } } } } } },
                Summary: {
                    fields: {
                        id: { type: "uint32", id: 1 },
                        thumbnailUrl: { type: "string", id: 2 },
                        name: { type: "string", id: 3 },
                        publishDate: { type: "string", id: 4 },
                        consumption: { type: "Consumption", id: 5 },
                        price: { type: "uint32", id: 6 },
                        isRecentlyUpdated: { type: "bool", id: 102 },
                        purchaseDate: { type: "uint32", id: 201 },
                        isRead: { type: "bool", id: 202 } },
                    nested: {
                        Consumption: { values: { FREE: 0, TICKET: 1, COIN: 2, ADVANCE: 3 } } } },
                Request: {
                    fields: {
                        id: { type: "uint32", id: 1 } } } } },
        search: {
            nested: {
                SearchResponse: {
                    fields: {
                        genres: { rule: "repeated", type: "Genre", id: 1 },
                        keywords: { rule: "repeated", type: "common.Tag", id: 2 } },
                    nested: {
                        Genre: {
                            fields: {
                                tag: { type: "common.Tag", id: 1 },
                                iconImageUrl: { type: "string", id: 2 } } } } },
                ResultResponse: {
                    fields: {
                        titles: { rule: "repeated", type: "title.Summary", id: 1 } } },
                SearchRequest: {
                    fields: {
                        words: { type: "string", id: 1 } } } } },
        home: {
            nested: {
                CodeResponse: {
                    fields: {
                        code: { type: "string", id: 1 } } },
                MyPageResponse: {
                    fields: {
                        currency: { type: "Currency", id: 1 },
                        bookmarkedTitles: { rule: "repeated", type: "title.Summary", id: 2 },
                        historyTitles: { rule: "repeated", type: "title.Summary", id: 3 },
                        rewardUrl: { type: "string", id: 4 } } },
                SetFavourite: {
                    fields: {
                        titleId: { type: "uint32", id: 1 } } },
                HomeResponse: {
                    fields: {
                        banners: { rule: "repeated", type: "Banner", id: 1 },
                        sections: { rule: "repeated", type: "Section", id: 2 },
                        notification: { type: "Notification", id: 101 } },
                    nested: {
                        Banner: {
                            fields: {
                                imageUrl: { type: "string", id: 1 },
                                name: { type: "string", id: 2 },
                                moveTo: { type: "common.MoveTo", id: 3 } } },
                        Section: {
                            fields: {
                                header: { type: "string", id: 1 },
                                titles: { type: "Titles", id: 3 },
                                ranking: { type: "Ranking", id: 4 },
                                singleBanner: { type: "Banner", id: 5 },
                                loginInduction: { type: "LoginInduction", id: 10 },
                                moreLink: { type: "common.MoveTo", id: 6 },
                                bgColour: { type: "string", id: 7 },
                                subjectAndNameTextColour: { type: "string", id: 8 },
                                descriptionTextColour: { type: "string", id: 9 } },
                            nested: {
                                Ranking: {
                                    fields: {
                                        categories: { rule: "repeated", type: "Category", id: 1 } },
                                    nested: {
                                        Category: {
                                            fields: {
                                                name: { type: "string", id: 1 },
                                                titles: { rule: "repeated", type: "title.Summary", id: 2 } } } } },
                                LoginInduction: {
                                    fields: {
                                        imageUrl: { type: "string", id: 1 } } },
                                Titles: {
                                    fields: {
                                        titles: { rule: "repeated", type: "title.Summary", id: 1 },
                                        layout: { type: "Layout", id: 2 } },
                                    nested: {
                                        Layout: { values: { SMALL: 0, LARGE: 1, SMALL_WITH_TICKET_INFO: 2 } } } },
                                Notification: {
                                    fields: {
                                        simpleMessage: { type: "SimpleMessage", id: 1 },
                                        rewardAd: { type: "RewardAd", id: 2 } },
                                    nested: {
                                        RewardAd: {
                                            fields: {
                                                rewardAmount: { type: "uint32", id: 1 },
                                                url: { type: "string", id: 2 } } },
                                        SimpleMessage: {
                                            fields: {
                                                subject: { type: "string", id: 1 },
                                                body: { type: "string", id: 2 } } } } } } } } } } },
        ranking: {
            nested: {
                RankingResponse: {
                    fields: {
                        genres: { rule: "repeated", type: "Genre", id: 1 } },
                    nested: {
                        Genre: {
                            fields: {
                                name: { type: "string", id: 1 },
                                titles: { rule: "repeated", type: "title.Summary", id: 2 } } } } } } },
        purchase: {
            nested: {
                AquisitionHistoryResponse: {
                    fields: {
                        entries: { rule: "repeated", type: "Entry", id: 1 } },
                    nested: {
                        Entry: {
                            fields: {
                                subject: { type: "string", id: 1 },
                                date: { type: "string", id: 2 },
                                paidCoinsAmount: { type: "uint32", id: 3 },
                                bonusCoinsAmount: { type: "uint32", id: 4 } } } } },
                PurchaseProductsResponse: {
                    fields: {
                        currency: { type: "common.Currency", id: 1 },
                        products: { rule: "repeated", type: "Product", id: 2 } },
                    nested: {
                        Product: {
                            fields: {
                                id: { type: "uint32", id: 1 },
                                amount: { type: "uint32", id: 2 },
                                bonusAmount: { type: "uint32", id: 3 },
                                price: { type: "uint32", id: 4 },
                                url: { type: "string", id: 5 } } } } },
                PurchaseChapterRequest: {
                    fields: {
                        chapterId: { type: "uint32", id: 1 },
                        consumption: { type: "Consumption", id: 2 } },
                    nested: {
                        Consumption: {
                            values: { WAITFREE: 0, COIN: 1 } } } } } } });
    const noop = {decode() {return null}};
    const updates = yomonga.lookup('updates.UpdatesResponse');
    const chapter = yomonga.lookup('chapter.ViewerResponse');
    const title = yomonga.lookup('title.DetailResponse');
    const titles = yomonga.lookup('title.ChunkResponse');
    const home = yomonga.lookup('home.HomeResponse');
    const ranking = yomonga.lookup('ranking.RankingResponse');
    const search = yomonga.lookup('search.ResultResponse');
    const mypage = yomonga.lookup('mypage.MyPageResponse');
    const search_page = yomonga.lookup('search.SearchResponse');
    const code = yomonga.lookup('mypage.CodeResponse');
    const purchases_items = yomonga.lookup('purchase.PurchaseProductsResponse');
    const items_history = yomonga.lookup('purchase.AquisitionHistroyResponse');
    console.debug({yomonga, chapter, title, titles, home, ranking, search, mypage, search_page, code, purchases_items, items_history});

    const current_data_path = [];
    const api_data_map = new Map();
    const drm_url_map = new Map();
    const drm_removed_files = new Map();
    const decoded_placement_file = new WeakMap();
    console.debug({current_data_path, api_data_map, drm_url_map, drm_removed_files})

    const get_decoder = url => {
            switch (url.pathname.slice(5)) {
                case 'updates': return updates;
                case 'chapter': return chapter;
                case 'title': return title;
                case 'titles': return titles;
                case 'home': return home;
                case 'ranking': return ranking;
                case 'search': return search;
                case 'search_page': return search_page;
                case 'mypage': return mypage;
                case 'code': return code;
                case 'purchases_items': return purchases_items;
                case 'items_history': return items_history;
                default: throw `no decoder for ${url}`;
            }
    }
    let is_request = false;
    const decode_url = (api, response) => {
        api instanceof URL || (api = new URL(api, location.href));
        const decoder = get_decoder(api);
        let decoded = api_data_map.get(api.href);
        if (!decoded) {
            decoded = decoder.decode(new Uint8Array(response));
            api_data_map.set(api.href, decoded);
        }
        const file = name => decoded_placement_file.set(decoded, new File(
            [JSON.stringify(decoded, null, '\t')],
            `${name} - placement.json`,
            {"type": "application/json"}
        ));

        if (decoder === chapter) {
            const id = api.searchParams.get('id') >>> 0;
            let manga;
            if (manga = api_data_map.get(`${location.origin}/api/title?title_id=${decoded.detail.titleId}`)) manga = manga.name;
            else {
                manga = String(decoded.detail.titleId);
                nt.ric().then(async () => {
                    await maybe_fetch_api(`/api/title?title_id=${manga}`);
                    decode_url(api, new ArrayBuffer(0));
                });
            }
            let title = `${manga} - ${decoded.detail.name}`
            file(title);
            for (const [id, {image}] of decoded.detail.pages.entries()) {
                if (!image) continue;
                let {descriptionKey, url} = image;
                let i = descriptionKey.length >>> 1;
                let data = new Uint8Array(i);
                while (i--) data[i] = parseInt(descriptionKey.slice(i << 1, (i + 1) << 1), 16);
                url = new URL(url, location.href).href;
                drm_url_map.set(url, [`${title} - ${String(id + 1).padStart(8, '0')}`, data]);
            }
            if (is_request) {
                const call = (id => async () => await dl_all(get_chapter_files(id)))(id)
                GM_notification(`Click to download ${decoded.detail.name} - ${manga}`, 'ripster::yomonga::chapter', null, call);
                nt.mkClickToStart(call, `download chapter ${decoded.detail.name} - ${manga}`)
            }
        } else if (decoder === title) {
            file(decoded.name);
            if (is_request) {
                const call = (id => async () => await dl_all(get_title_files(id)))(decoded.id)
                GM_notification(`Click to download ${decoded.name}`, 'ripster::yomonga::title', null, call);
                nt.mkClickToStart(call, `download title ${decoded.name}`)
            }
        }
        return decoded;
    }
	function XHRLogger() {
		if (this.responseType === 'arraybuffer') {
			console.group('api xhr resp');
			try {
                is_request = true;
                const decoded = decode_url(this.responseURL, this.response);
                console.dir(decoded);
                let idx = current_data_path.indexOf(decoded);
                current_data_path.push(idx !== -1 ? {idx} : decoded);
            } catch(e) {
                console.error(e);
            } finally {
                is_request = false;
                console.groupEnd('api xhr resp');
            }
		}
	};
	const XHRLoad = Object.freeze(['load', XHRLogger, {once: true}]);
	XMLHttpRequest.prototype.open = new Proxy(XMLHttpRequest.prototype.open, {
		apply(fn, self, args) {
			apply(fn, self, args);
			if (String(args[1]).startsWith(`/api/`)) {
				console.trace('api call');
				apply(addEventListener, self, XHRLoad);
			}
		}
	})
    async function* read_body(body) {
        let reader;
        try {
            reader = body.body.getReader();
            while (1) {
                const {value, done} = await reader.read();
                if (done) break;
                yield value;
            }
        } finally {
            if (reader) reader.releaseLock();
        }
    }
    const read_drm64 = async (body, drm64) => {
        let data = [new Uint8Array(0)], i = 0;
        for await (const chunk of read_body(body)) {
            for (let offset = 0, len = chunk.byteLength; offset < len; ++offset, ++i) {
                i &= 63;
                chunk[offset] ^= drm64[i];
            }
            data.push(chunk);
        }
        return data;
    }
    const read_drm_arb = async (body, drm) => {
        let data = [], i = 0, dl = drm.length;
        for await (const chunk of read_body(body)) {
            for (let offset = 0, len = chunk.byteLength; offset < len; ++offset, ++i) {
                i %= dl;
                chunk[offset] ^= drm[i];
            }
            data.push(chunk);
        }
        return data;
    }
    async function read_drm(name, drm, res) {
        res = await res;
        const type = res.headers.get('content-type'), lastModified = Date.parse(res.headers.get('last-modified'));
        switch (type) {
            case 'image/jpeg': name += '.jpg'; break;
            case 'image/png': name += '.png'; break;
            case 'image/gif': name += '.gif'; break;
            case 'image/webp': name += '.webp'; break;
            default: name += '.blob';
        }
        let data = new File(await(drm.length === 64 ? read_drm64(res, drm) : read_drm_arb(res, drm)), name, {"type": type, "lastModified": lastModified});
        console.debug(data);
        return data;
    }
    window.fetch = new Proxy(fetch, {
        async apply(fn, self, args) {
            const res = await apply(fn, self, args);
            const {href} = new URL(res.url, location.href);
            maybe_fetch_drm(href, res);
            return res;
        }
    });
    const maybe_fetch_drm = async (href, res) => {
        // don't do more work than necessary.
        let file = drm_removed_files.get(href);
        let drm = drm_url_map.get(href);
        if (drm) {
            if (!file) {
                file = read_drm(drm[0], drm[1], res ? res.clone() : fetch_orig(href));
            } else {
                let _file = await file;
                if (!file.name.startsWith(drm[0])) file = nt.promres(new File([_file], drm[0], _file));
            }
            drm_removed_files.set(href, file);
        } else throw new URIError('Unrecognised URL');
        return await file;
    }
    const maybe_fetch_api = async href => api_data_map.get(href = new URL(href, location.href).href) ||
          await(fetch_orig(href).then(async r => decode_url(r.url, await r.arrayBuffer())));
    async function* get_chapter_files(id) {
        const data = await maybe_fetch_api(`/api/chapter?id=${id}`);
        let pages = [];
        for (const [i, {image}] of data.detail.pages.entries()) image && pages.push(nt.promres(pages[i - 3]).then(() => maybe_fetch_drm(image.url, null)));
        let json = decoded_placement_file.get(data);
        yield json;
        yield* pages;
    }
    async function* get_title_files(id) {
        const data = await maybe_fetch_api(`/api/title?title_id=${id}`);
        let chapters = [];
        for (const [i, {id}] of data.chapters.entries()) id && chapters.push(nt.promres(chapters[i - 2]).then(() => get_chapter_files(id)));
        let json = decoded_placement_file.get(data);
        yield json;
        for await (const chapter of chapters) yield* chapter;
    }
    async function dl_all(generator) {
        for await (const file of generator) await nt.__downloadFile__(await file)
    }
    console.log({fetch: window.fetch, open: XMLHttpRequest.prototype.open, read_drm, dl_all, get_chapter_files, get_title_files});
} catch (e) {
    alert(e.stack || e)
    console.error(e)
}
