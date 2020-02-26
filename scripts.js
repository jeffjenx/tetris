// jQuery style QuerySelector
function $(selector, base = document) {
	let elements = base.querySelectorAll(selector)
	return elements.length === 1 ? elements[0] : elements
}

// Multi-element, multi-event attachment
function on(elements = document, events, listener, options) {
	events = events.split(" ")
	if (elements instanceof NodeList === false)
		elements = [elements]

	for (let event of events)
		for (let element of elements)
			element.addEventListener(event, listener, options)
}

// Mouse
let Mouse = undefined
on(document, "mousemove", (event) => {
	if (!Mouse) Mouse = {}
	let update = (event) => {
		Mouse.x = Math.round(event.clientX / window.innerWidth * 100) / 100,
		Mouse.y = Math.round(event.clientY / window.innerHeight * 100) / 100
	}
	update(event)
	on(document, "click mousemove", update)
},	{ once: true })

// Keyboard
let Keyboard = undefined
on(document, "keydown", (event) => {
	if (!Keyboard) Keyboard = new Proxy({}, {
		set: (obj, prop, value) => { obj[prop] = value; return true },
		deleteProperty(obj, prop) { if (prop in obj) { delete obj[prop] } }
	})
	let animationFrameTimer
	let update = (event) => {
		if (event) {
			if (event.type === "keydown") Keyboard[event.code] = true
			else delete Keyboard[event.code]
		}

		if (Object.keys(Keyboard).length === 0)
			return cancelAnimationFrame(animationFrameTimer)
		animationFrameTimer = requestAnimationFrame(() => update())
	}
	update(event)
	on(document, "keydown keyup", update)
	on(window, "blur", () => { for (let key of Object.keys(Keyboard)) delete Keyboard[key] })
}, { once: true })

const $tetris = $(".tetris__article")
const $header = $(".tetris__articleHeader")
const $boxArts = $(".tetris__image.boxArt")
const $boxArtLinks = $(".tetris__imageLink.boxArt")

// 3-D Layered Box Art
on(window, "load", () => { setTimeout(() => $tetris.classList.add("loaded"), 500) }) // simulate loading
on($header, "mousemove", () => {
	if (!Mouse) return
	$tetris.style.setProperty("--x", Mouse.x)
	$tetris.style.setProperty("--y", Mouse.y)
})

setTimeout(() => { localStorage.setItem("tetris", true) }, 4500)
if (localStorage.getItem("tetris")) $tetris.classList.add("visited")

// Delay the mouse events for box art
let headerMouseTimeout
for (const $boxArt of $boxArts)
	on($boxArt, "mouseenter mouseleave", event => {
		if (headerMouseTimeout) clearTimeout(headerMouseTimeout)
		headerMouseTimeout = setTimeout(
			() => $header.classList.toggle("focused", event.type === "mouseenter"),
			event.type === "mouseenter" ? 0 : 1000)
	})

on($boxArtLinks, "click", (event) => {
	let normalize = (value, range) => (value * 2 - range) / range
	let normalizedLayerX = normalize(event.layerX, event.target.offsetWidth)
	if (Math.abs(normalizedLayerX) < 0.5) return

	event.preventDefault()
	for (let $boxArt of $boxArtLinks)
		$boxArt.classList.toggle("flipped")
})

// Television Commercial
let $television = $(".tetris__imageLink.commercial")
let television = {
	channel: 0,
	volume: 50,
	player: null,
	guide: [
		{ id: "E-ej_8XBwmI", channelID: "3", publication: "YouTube", title: "Game Boy: <em>Portable</em> Power", type: "Television Advertisement", publisher: "Nintendo", year: "1989" },
		{ id: "x1tn4lk", channelID: "4", publication: "DailyMotion", title: "Teenage Mutant Ninja Turtles", type: "Animated Series", publisher: "Mirage Studios", year: "1987" },
	],
	states: "loading buffering cued end ended pause paused playing start unstarted video_start video_end waiting",
	isOff() { return $television.classList.contains("off") },
	isPlaying() { return $television.classList.contains("playing") },
	isYouTube() { return this.guide[this.channel].publication.toLowerCase() === "youtube" },
	toggle() {
		if (this.isOff()) return
		if (!this.player) return this.programChange()
		if (this.isPlaying()) return this.pause()
		else return this.play()
	},
	play() {
		this.player[this.isYouTube() ? "playVideo" : "play"]()
	},
	pause() {
		this.player[this.isYouTube() ? "pauseVideo" : "pause"]()
	},
	channelChange(direction) {
		if (this.isOff()) return

		this.channel += direction
		if (this.channel >= this.guide.length) this.channel = 0
		else if (this.channel < 0) this.channel = this.guide.length - 1

		this.programChange()
		$(".tetris__videoDisplay", $television).setAttribute("data-channel", this.guide[this.channel].channelID)
		setTimeout(() => this.clearDisplay("channel"), 5000)
		this.updateCitation()
	},
	channelDown() { return this.channelChange(-1) },
	channelUp() { return this.channelChange(+1) },
	updateCitation() {
		$(".tetris__caption.commercial").innerHTML = `
			<span class="tetris__citeTitle">${this.guide[this.channel].title}</span> ${this.guide[this.channel].type},
			<cite class="tetris__citePublication">${this.guide[this.channel].publisher},</cite>
			<time class="tetris__citeDate" datetime="${this.guide[this.channel].year}">${this.guide[this.channel].year}.</time>`
	},
	volumeChange(amount) {
		if (this.isOff()) return

		this.volume += (amount * 10)
		this.volume = Math.min(this.volume, 100)
		this.volume = Math.max(this.volume, 0)

		if (this.player) this.player.setVolume(this.volume)
		if (!amount) return

		$(".tetris__videoDisplay", $television).setAttribute("data-volume", this.volume)
		setTimeout(() => this.clearDisplay("volume"), 5000)
	},
	volumeDown() { return this.volumeChange(-1) },
	volumeUp() { return this.volumeChange(+1) },
	clearDisplay(display) {
		$(".tetris__videoDisplay", $television).removeAttribute(`data-${display}`)
	},
	power() {
		if (this.isPlaying())
			this.pause()
		$television.classList.toggle("off")
	},
	programChange() {
		let program = this.guide[this.channel]
		$(".tetris__video.commercial").outerHTML = "<div class='tetris__video commercial' id='player'></div>"

		this.player = null
		this.stateChange("loading")
		if (this.isYouTube())
			this.player = new YT.Player("player", {
				videoId: program.id,
				width: "512", height: "384",
				playerVars: { "controls": 0, "modestbranding": 1,"autoplay": 1 },
				events: {
					onReady(event) { $television.classList.remove("loading"); television.volumeChange(0) },
					onStateChange(event) { return television.stateChange.bind(television)(event) }
				}
			})
		else {
			this.player = DM.player("player", {
				video: program.id,
				width: "512", height: "384",
				params: { autoplay: true, mute: false, controls: false, "queue-enable": false }
			})
			on(program.player, "playing pause end start video_start video_end waiting", event => television.stateChange.bind(television)(event))
		}
	},
	stateChange(event) {
		let state
		for (state of this.states.split(" "))
			$television.classList.toggle(state, false)
		if (typeof(event) === "string")
			state = event
		else
			state = this.isYouTube()
					? Object.keys(YT.PlayerState).find(state => YT.PlayerState[state] === event.data).toLowerCase()
					: event.type
		$television.classList.toggle(state, true)
	}
}
on(window, "load resize", event => {
	let $map = $('map[name="television"]')
	let $static = $('[usemap="#television"]')
	let areas = [
		{ click: "toggle",
		  shape: "rect", coords: "9.38%,10.29%,74.80%,76.04%" },
		{ click: "channelDown",
		  shape: "rect", coords: "81.64%,20.70%,87.89%,24.87%" },
		{ click: "channelUp",
		  shape: "rect", coords: "87.89%,20.70%,94.14%,24.87%" },
		{ click: "volumeDown",
		  shape: "rect", coords: "81.64%,24.87%,87.89%,29.04%" },
		{ click: "volumeUp",
		  shape: "rect", coords: "87.89%,24.87%,94.14%,29.04%" },
		{ click: "power",
		  shape: "rect", coords: "87.89%,29.04%,94.14%,35.00%" }
	]
	
	$map.innerHTML = ""
	for (area of areas) {
		let coords = area.coords.split(",").map((coord, index) => {
			if (coord.indexOf("%"))
				return Math.floor($static[index % 2 ? "height" : "width"] * parseFloat(coord) / 100)
			return coord
		}).join(",")
		let $area = document.createElement("area")
		$area.setAttribute("href", "javascript:;")
		$area.setAttribute("shape", area.shape)
		$area.setAttribute("coords", coords)
		$area.addEventListener("click", television[area.click].bind(television))
		$map.appendChild($area)
	}
})

// Scoring Table Toggle
function updateScoringTable(highSpeedScoring) {
	for (level = 0; level < 10; level++) {
		for (lineIndex = 0; lineIndex < 5; lineIndex++) {
			let name = `level${level}__lines${lineIndex}`
			let $output = $(`.tetris__table.scoring output[name="level${level}__lines${lineIndex}"]`)
			if ($output.length === 0) {
				$output = document.createElement("output")
				$output.name = name

				$cell = document.createElement(lineIndex === 0 ? "th" : "td")
				if (lineIndex === 0)
					$(".tetris__table.scoring thead tr").appendChild($cell)
				else
					$(`.tetris__table.scoring tbody tr:nth-child(${lineIndex})`).appendChild($cell)
				$cell.appendChild($output)
			}

			let value = [1,40,100,300,1200][lineIndex] * (level + (lineIndex ? 1 : 0))
			if (lineIndex === 0) {
				let $heart = document.createElement("small")
				$heart.textContent = "♥︎"
				$output.value = value
				if (highSpeedScoring)
					setTimeout(() => { $output.appendChild($heart) }, level * 25)
				else {
					$output.appendChild($heart)
					setTimeout(() => { $heart.remove() }, (10 - level) * 25)
				}
				continue
			}

			if (highSpeedScoring)
				value = [1,40,100,300,1200][lineIndex] * (level + 10 + (lineIndex ? 1 : 0))
			animateValue($output, $output.value, value, 500)
		}
	}
}
updateScoringTable()

function animateValue(element, start, end, duration) {
	let range = end - start
	let endTime = Date.now() + duration
	let updateTimer = requestAnimationFrame(updateValue)
	function updateValue() {
		let now = Date.now()
		let remaining = Math.max((endTime - now) / duration, 0)
		let value = Math.round(end - (remaining * range))
		element.innerHTML = value
		if (value == end)
			cancelAnimationFrame(updateTimer)
		updateTimer = requestAnimationFrame(updateValue)
	}
}

animateValue("value", 100, 25, 5000);

let $toggleScoring = $(".tetris__toggle.scoring input")
on($toggleScoring, "change", event => {
	event.target.classList.toggle("active")
	updateScoringTable($toggleScoring.checked)
})

// Color Scheme Toggle
let $toggleColorScheme = $(".tetris__toggle.colorScheme input")
on($toggleColorScheme, "change", event => {
	event.target.classList.toggle("active")
	$tetris.classList.toggle("color-scheme-inverted") })
on(window, "load", event => {
	if (window.matchMedia("(prefers-color-scheme: dark)"))
		$tetris.classList.toggle("color-scheme-inverted", true)
})

// Global site tag (gtag.js) - Google Analytics
window.dataLayer = window.dataLayer || []
function gtag(){ dataLayer.push(arguments) }
gtag('js', new Date())
gtag('config', 'UA-155363758-1')