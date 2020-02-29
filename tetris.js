width = 12
height = 18
field = Array(width * height).fill(0)
for (y=0; y<height; y++)
	for (x=0; x<width; x++) {
		field[y * width + x] = 0
		if (x === 0 || x === width - 1) field[y * width + x] = 13
		if (y === height - 1) field[y * width + x] = 15
		if (x === 0 && y == height - 1) field[y * width + x] = 14
		if (x === width - 1 && y == height - 1) field[y * width + x] = 16
	}

tetrads = []
tetrads[0] =
"  ▩ " +
"  ▩ " +
"  ▩ " +
"  ▩ "

tetrads[1] =
"  ▥ " +
" ▥▥ " +
" ▥  " +
"    "

tetrads[2] =
" ▤  " +
" ▤▤ " +
"  ▤ " +
"    "
tetrads[3] =
"    " +
" ▦▦ " +
" ▦▦ " +
"    "

tetrads[4] =
"  ▣ " +
" ▣▣ " +
"  ▣ " +
"    "

tetrads[5] =
"  ▨ " +
"  ▨ " +
" ▨▨ " +
"    "

tetrads[6] =
" ▧  " +
" ▧  " +
" ▧▧ " +
"    "

function rotate(x, y, r) {
	switch (r % 4) {
		case 0: return y * 4 + x      // 0
		case 1: return 12 + y - x * 4 // 90
		case 2: return 15 - y * 4 - x // 180
		case 3: return 3 - y + x * 4  // 270
	}
	return 0
}

function doesPieceFit(tetrad, rotation, posX, posY) {
	for (x = 0; x < 4; x++)
		for (y = 0; y < 4; y++)
		{
			indexPiece = rotate(x, y, rotation)
			indexField = (posY + y) * width + (posX + x)

			if (posX + x >= 0 && posX + x < width) {
				if (posY + y >= 0 && posY + y < height) {
					if (tetrads[tetrad][indexPiece] !== " " && field[indexField] !== 0)
						return false
				}
			}
		}
	return true
}

function nextPiece() {
	return Math.floor(Math.random() * 7) % 7
}

started = false
gameOver = false
screen = Array(width * height).fill(' ')
currentPiece = nextPiece()
currentRotation = 0
currentX = width / 2 - 2
currentY = 0
rotateHold = false
forceDown = false
clearLines = false
piecesPlaced = 0
counter = 0
speed = 1
score = 0
lines = []

input = []
input[0] = 0
input[1] = 0
input[2] = 0
input[3] = 0
input[4] = 0

keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyD", "KeyF", "KeyZ", "KeyX", "Space"]
function handleInput(event) {
	if (keys.indexOf(event.code) > -1) {
		input[keys.indexOf(event.code)] = event.type === "keydown" ? 1 : 0
		event.preventDefault()
	}
}
document.addEventListener("keydown", handleInput)
document.addEventListener("keyup", handleInput)

function end() {
	sScore = score.toString()
	length = sScore.length
	console.clear()
	console.log("╓─┄┈  𝐓 𝐄 𝐓 𝐑 𝐈 𝐒  ┈┄─╖" + 
		"\n║                     ║".repeat(4) + 
		"\n║   ┏╼╾╼╾╼╾╼╾╼╾╼╾╼┓   ║" + 
		"\n╠═══╡ 𝔾𝔸𝕄𝔼  𝕆𝕍𝔼ℝ ╞═══╣" + 
		"\n║   ┗╼╾╼╾╼╾╼╼╾╼╾╾╼┛   ║" + 
		"\n║                     ║".repeat(10) + 
		renderScore())
}

function renderScore() {
	length = sScore.length
	even = length % 2 === 0
	padding = width - length / 2 - (even ? 3 : 2)
	return `\n╚═════════╤${even ? '╤═' : '═╤'}═════════╝`+
		`\n${` `.repeat(padding)}╭${`─`.repeat(Math.min(width-3,length/2))}┘${even?'└':' └'}${`─`.repeat(Math.min(width-3,length/2))}╮`+
		`\n${` `.repeat(padding)}│ ${sScore.replace(/\d/g, digit => String.fromCharCode(8320+Number(digit)))} │`+
		`\n${` `.repeat(padding)}╰${`─`.repeat(Math.min(width*2-3,length % 2 === 1 ? length + 2 : length + 2))}╯`
}

function loop() {
	if (gameOver) return end()

	counter++
	forceDown = counter === (10 - speed)
	clearLines = lines.length

	for (y = 0; y < height; y++)
		for (x = 0; x < width; x++)
			screen[y * width + x] = " ▩▥▤▦▣▨▧█▓▒░ ║╚═╝"[field[y * width + x]]

	 for (y = 0; y < 4; y++)
	 	for (x = 0; x < 4; x++)
	 		if (tetrads[currentPiece][rotate(x, y, currentRotation)] !== " ")
	 			screen[(currentY + y) * width + (currentX + x)] = tetrads[currentPiece][rotate(x, y, currentRotation)]
	
	if (input[keys.indexOf("ArrowLeft")])
		if (doesPieceFit(currentPiece, currentRotation, currentX - 1, currentY))
			currentX--
	if (input[keys.indexOf("ArrowRight")])
		if (doesPieceFit(currentPiece, currentRotation, currentX + 1, currentY))
			currentX++
	if (input[keys.indexOf("ArrowDown")])
		if (doesPieceFit(currentPiece, currentRotation, currentX, currentY + 1))
			currentY++
	if (input[keys.indexOf("KeyD")] || input[keys.indexOf("KeyZ")]) {
	 	if (!rotateHold && doesPieceFit(currentPiece, currentRotation + 1, currentX, currentY))
	 		currentRotation--
		rotateHold = true
	} else if (input[keys.indexOf("KeyF")] || input[keys.indexOf("KeyX")] || input[keys.indexOf("Space")]) {
	 	if (!rotateHold && doesPieceFit(currentPiece, currentRotation + 1, currentX, currentY))
	 		currentRotation++
		rotateHold = true
	} else rotateHold = false
	if (currentRotation < 0) currentRotation = 3
	else if (currentRotation > 3) currentRotation = 0

	if (forceDown && !clearLines) {
		if (doesPieceFit(currentPiece, currentRotation, currentX, currentY + 1))
			currentY++
		else  {
			for (y = 0; y < 4; y++)
				for (x = 0; x < 4; x++)
					if (tetrads[currentPiece][rotate(x, y, currentRotation)] !== " ")
						field[(currentY + y) * width + (currentX + x)] = currentPiece + 1

			for (y = 0; y < 4; y++)
				if (currentY + y < height - 1) {
					line = true
					for (x = 1; x < width - 1; x++)
						line &= field[(currentY + y) * width + x] != 0
					if (line) {
						for (x = 1; x < width - 1; x++)
							field[(currentY + y) * width + x] = 8
						lines.push(currentY + y)
					}
				}

			currentX = width / 2 - 2
			currentY = 0
			currentRotation = 0
			currentPiece = nextPiece()
			score += 5
			piecesPlaced++
			if (piecesPlaced % 10 === 0) {
				if (speed < 9)
					speed++
			}

			gameOver = !doesPieceFit(currentPiece, currentRotation, currentX, currentY)
		}
		counter = 0
	}

	if (clearLines) {
		if (counter > 4) {
			for (line of lines)
				for (y = line; y >= 0; y--)
					for (x = 1; x < width - 1; x++) {
						if  (y > 0) field[y * width + x] = field[(y - 1) * width + x]
						else field[x] = 0
					}
			score += (1 << (lines.length - 1)) * 50
			lines = []
			counter = 0
		} else
			for (y of lines)
				for (x = 1; x < width - 1; x++)
					field[y * width + x] = counter > 3 ? 12 : counter > 2 ? 11 : counter > 1 ? 10 : counter > 0 ? 9 : 8
	}

	sScore = score.toString()
	length = sScore.length
	if (length > 18) { gameOver = true; score = "9".repeat(19) }
	console.clear()
	console.log(
		"╓─┄┈  𝐓 𝐄 𝐓 𝐑 𝐈 𝐒  ┈┄─╖ \n" + 
		(screen.join("").substring(0,screen.length - width).replace(/./g, (match, index) => {
			if (match === "╚") return "╚═"
			else if (match === "═") return "══"
			else return match + ' '
		}))
		.match(new RegExp(`.{1,${width*2}}`, 'g')).join("\n") + renderScore())

	setTimeout(loop, 125)
}
function start() { started = true; loop() }
document.addEventListener("keyup", event => { if (!started && event.ctrlKey && event.code === "KeyT") start() })