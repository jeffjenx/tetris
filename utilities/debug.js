let $debug = document.createElement("div")
$debug.id = "debug"
document.body.appendChild($debug)

on(window, "resize", debug)
on(document, "click mousemove keydown keyup scroll", debug)
on(document, "keyup", event => { if (event.ctrlKey && event.code === "KeyD") $debug.classList.toggle("enabled") })

function debug(event) {
	let printLine = (line) => $debug.innerHTML += `${line}<BR/>`
	$debug.innerHTML = ``

	let userAgentTokens = navigator.userAgent.match(/[^\/ ]*\/[^\/ ]*( \([^\)]*\))?/g)
	let platform = 'platform' in navigator ? navigator.platform : ''
	platform = userAgentTokens[0].match(/Mac OS X 10_1[2345](_\d*)?/)[0].replace(/_/g, '.').replace('Mac OS X', ' macOS')
	printLine(`Platform: ${platform}`)
	printLine(``)
	printLine(`Screen Size: ${'screen' in window ? window.screen.width : '?'}, ${'screen' in window ? window.screen.height : '?'}`)
	printLine(`Screen Color Depth: ${'screen' in window ? window.screen.colorDepth + '-bit' : '?'}`)
	printLine(`Screen Pixel Depth: ${'screen' in window ? window.screen.pixelDepth + '-bit' : '?'}`)
	printLine(``)
	printLine(`Window Size: ${'innerWidth' in window ? window.innerWidth : '?'}, ${'innerHeight' in window ? window.innerHeight : '?'}`)
	printLine(`Window Scroll: ${'scrollX' in window ? window.scrollX : '?'}, ${'scrollY' in window ? window.scrollY : '?'}`)
	printLine(``)
	if (Mouse) {
		let buttonMap = `┑Main ┰Auxiliary ┍Secondary`.split(" ")
		printLine(`Mouse Client: ${event && 'clientX' in event ? event.clientX + ', ' + event.clientY : ''}`)
		printLine(`Mouse Layer: ${event && 'layerX' in event ? event.layerX + ', ' + event.layerY : ''}`)
		printLine(`Mouse Page: ${event && 'pageX' in event ? event.pageX + ', ' + event.pageY : ''}`)
		printLine(`Mouse Screen: ${event && 'screenX' in event ? event.screenX + ', ' + event.screenY : ''}`)
		printLine(`Mouse Buttons: ${event ? buttonMap.filter((button, index) => (((event.type === "click" ? 1 : 0) << event.button) | event.buttons) & (1 << index)).map(button => button[0]) : ''}`)
		printLine(``)
	}

	let keys = ``
	if (Keyboard) {
		const larger = (text) => `<span style="line-height:0.67em; font-size:1.5em">${text}</span>`
		let displayMap = `⌘MetaLeft ⌘MetaRight ⌃ControlLeft ⌃ControlRight ⌥AltLeft ⌥AltRight [BracketLeft ]BracketRight \`Backquote \\Backslash /Slash .Period
		-Minus =Equal ,Comma ;Semicolon 'Quote ⎵Space ↵Enter ⌫Backspace ⌦Delete ⎋Escape →ArrowRight ←ArrowLeft ↑ArrowUp ↓ArrowDown ⇞PageUp ⇟PageDown ↖Home ↘End
		⇪CapsLock ⇧ShiftLeft ⇧ShiftRight ⇥Tab ⓪Numpad0 ①Numpad1 ②Numpad2 ③Numpad3 ④Numpad4 ⑤Numpad5 ⑥Numpad6 ⑦Numpad7 ⑧Numpad8 ⑨Numpad9 ⊜NumpadEqual 
		⨸NumpadDivide ⊗NumpadMultiply ⊝NumpadSubtract ⊕NumpadAdd ⏎NumpadEnter`
		keys = Object.keys(Keyboard).map(key => {
			let display = key.replace(/Digit|Key/g, '')
			if (displayMap.indexOf(key) > -1) display = displayMap[displayMap.indexOf(key) - 1]
			return display
		})
		printLine(`Keyboard: ${keys.length ? keys.join('') : ''}`)
	}
}
debug()