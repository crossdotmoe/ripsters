// ==UserScript==
// @name         drawimage-catcher
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       zeen3
// @match        */*
// @grant        none
// @run-at       document-start
// ==/UserScript==
console.log('drawImage catcher');
let img = null,// HTMLImageElement | SVGImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap
	oc2 = null // OffscreenCanvasRenderingContext2D
const drawImage = OffscreenCanvasRenderingContext2D.prototype.drawImage,
      getContext = Function.prototype.call.bind(OffscreenCanvas.prototype.getContext),
      {apply} = Reflect,
      osc = OffscreenCanvas,
      mwm = new WeakMap, mget = mwm.get.bind(mwm), mset = mwm.set.bind(mwm)
const get = (cis, cv) => {
	oc2 = mget(cis)
	if (oc2) return oc2
	img = cis
	oc2 = getContext(new osc(cv.width, cv.height), '2d')
	mset(cis, oc2)
}

CanvasRenderingContext2D.prototype.drawImage = new Proxy(CanvasRenderingContext2D.prototype.drawImage, {
	apply(fn, self, args) {
		apply(fn, self, args)
		debugger
		img === args[0] || get(args[0], self.canvas)
		apply(drawImage, oc2, args)
	}
})