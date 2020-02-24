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
let program
let channel = 0
let $television = $("#television")
let $commercials = $(".commercial")
on($television, "click", event => {
	let states = "buffering cued end ended pause paused playing start unstarted video_start video_end waiting"
	let updateTV = function (state) {
		for (let $commercial of $commercials) {
			for (let offState of states.split(" "))
				$commercial.classList.toggle(offState, false)
			$commercial.classList.toggle(state, true)
		}
	}

	if (!program || event.layerX > 400) {
		if (event.layerX > 400)
			channel = 1 - channel

		updateTV("waiting")
		program = Object.assign({
			play() {
				return this.player[`play${guide[channel].player.toLowerCase() === 'youtube' ? 'Video' : ''}`]()
			},
			pause() {
				return this.player[`pause${guide[channel].player.toLowerCase() === 'youtube' ? 'Video' : ''}`]()
			}
		}, guide[channel])

		let $player = document.createElement("div")
		$player.className = "tetris__video commercial"
		$player.id = "player"
		$("#player").replaceWith($player)

		switch (program.player.toLowerCase()) {
			case "youtube":
				program.player = new YT.Player("player", {
					height: "384",
					width: "512",
					videoId: program.id,
					playerVars: { "controls": 0, "modestbranding": 1,"autoplay": 1 },
					events: {
						"onStateChange": event => {
							updateTV(Object.keys(YT.PlayerState).find(state => YT.PlayerState[state] === event.data).toLowerCase())
						}
					}
				})
				break
			case "dailymail":
				program.player = DM.player($player, {
					video: program.id,
					width: "512",
					height: "384",
					params: { autoplay: true, mute: false, controls: false, "queue-enable": false }
				})
				on(program.player, "start", () => program.player.setMuted(0))
				on(program.player, "playing pause end start video_start video_end waiting", event => updateTV(event.type))
				break
		}
		return
	}

	if ($television.classList.contains("playing"))
		program.pause()
	else
		program.play()
})
let guide = [
	{ id: "E-ej_8XBwmI", player: "YouTube", title: "Game Boy: <em>Portable</em> Power", type: "Television Advertisement", publisher: "Nintendo", year: "1989" },
	{ id: "x1tn4lk", player: "DailyMail", title: "Teenage Mutant Ninja Turtles", type: "Animated Series", publisher: "Mirage Studios", year: "1987" }
]

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
				$output.value = value
				if (highSpeedScoring) $output.innerHTML += "<small>♥︎</small>"
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
	document.documentElement.classList.toggle("light")
})

// Global site tag (gtag.js) - Google Analytics
window.dataLayer = window.dataLayer || []
function gtag(){ dataLayer.push(arguments) }
gtag('js', new Date())
gtag('config', 'UA-155363758-1')