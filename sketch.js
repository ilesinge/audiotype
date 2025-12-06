let fonts = {}
let builtInFonts = {
	'Compagnon': { file: 'fonts/Compagnon-Roman.otf', credit: 'Juliette Duhé, Léa Pradine, Valentin Papon, Chloé Lozano, Sébastien Riollier' },
	'Interlope': { file: 'fonts/Interlope-Regular.otf', credit: 'Gabriel Dubourg' },
	'Karrik': { file: 'fonts/Karrik-Regular.otf', credit: 'Jean-Baptiste Morizot & Lucas Le Bihan' },
	'Mess': { file: 'fonts/Mess.otf', credit: 'Tezzo Suzuki' },
	'Basteleur': { file: 'fonts/Basteleur-Bold.otf', credit: 'Keussel' },
	'Kaeru Kaeru': { file: 'fonts/kaerukaeru-Regular.otf', credit: 'Isabel Motz' }
}
let font, points
let sliders = {}
let labels = {}
let song, analyzeSong, fft
let bass, mid, treble
let uiElements = []
let uiVisible = true
let textInput, currentText
let peakDetect
let audioReactiveStrokeCheckbox, audioReactiveSizeCheckbox
let colorWaveOffsetCheckbox, filledCirclesCheckbox
let seekSlider, isSeeking = false
let panX = 0, panY = 0, zoomLevel = 1
let isDragging = false, lastMouseX, lastMouseY
let isRecording = false, recordStartFrame = 0
let recordButton
let fontSelect
let paletteSelect
let audioNameLabel
let playButton
let helpButton, infoBox
let colorPalettes = {
	'RGB': [[255, 0, 0], [0, 255, 0], [0, 0, 255]], // #FF0000 #00FF00 #0000FF
	'Monochrome': [[255, 255, 255], [150, 150, 150], [75, 75, 75]], // #FFFFFF #969696 #4B4B4B
	'Neon': [[255, 0, 255], [0, 255, 255], [255, 255, 0]], // #FF00FF #00FFFF #FFFF00
	'Retro': [[255, 111, 97], [255, 209, 102], [6, 214, 160]], // #FF6F61 #FFD166 #06D6A0
	'Pastel': [[255, 179, 186], [255, 223, 186], [186, 255, 201]], // #FFB3BA #FFDFBA #BAFFC9
	'Vaporwave': [[255, 113, 206], [1, 247, 161], [127, 199, 255]], // #FF71CE #01F7A1 #7FC7FF
	'Candy': [[255, 20, 147], [0, 255, 127], [255, 165, 0]], // #FF1493 #00FF7F #FFA500
	'Electric': [[148, 0, 211], [255, 0, 0], [0, 255, 0]], // #9400D3 #FF0000 #00FF00
	'Miami': [[255, 0, 128], [0, 255, 255], [255, 215, 0]], // #FF0080 #00FFFF #FFD700
	'Autumn': [[255, 69, 0], [218, 165, 32], [139, 0, 139]], // #FF4500 #DAA520 #8B008B
	'Twilight': [[72, 61, 139], [255, 105, 180], [255, 215, 0]], // #483D8B #FF69B4 #FFD700
	'Arctic': [[0, 191, 255], [230, 230, 250], [255, 0, 255]], // #00BFFF #E6E6FA #FF00FF
	'Desert': [[255, 69, 0], [255, 215, 0], [138, 43, 226]], // #FF4500 #FFD700 #8A2BE2
	'Toxic': [[0, 255, 0], [255, 255, 0], [255, 0, 255]] // #00FF00 #FFFF00 #FF00FF
}

function preload() {
	// Load all built-in fonts
	for (let name in builtInFonts) {
		fonts[name] = loadFont(builtInFonts[name].file);
	}
	// Load saved font or default to compagnon
	let savedFont = getItem('selectedFont');
	let fontName = savedFont !== null ? savedFont : 'compagnon';
	
	// If the saved font is not one of the preloaded ones, fallback to compagnon
	// The custom font will be loaded in setup() via loadSavedFont()
	if (!fonts[fontName]) {
		fontName = 'compagnon';
	}
	font = fonts[fontName];
}

function setup() {
	// Create WebGL canvas for GPU-accelerated rendering
	createCanvas(windowWidth, windowHeight, WEBGL)
	
	// WebGL rendering optimizations
	smooth();
	
	frameRate(30); // Set to 30fps for consistent GIF recording
	noFill()
	stroke(255)
	strokeWeight(1)
	
	// Load saved pan and zoom values
	let savedPanX = getItem('panX');
	let savedPanY = getItem('panY');
	let savedZoom = getItem('zoomLevel');
	if (savedPanX !== null) panX = parseFloat(savedPanX);
	if (savedPanY !== null) panY = parseFloat(savedPanY);
	if (savedZoom !== null) zoomLevel = parseFloat(savedZoom);
	
	// Add toggle button for UI visibility
	let toggleButton = createButton('▼');
	toggleButton.position(10, 10);
	toggleButton.style('color', 'white');
	toggleButton.style('background-color', 'black');
	toggleButton.style('border', 'none');
	toggleButton.mousePressed(() => toggleUI(toggleButton));
	
	// Add help button in top right
	helpButton = createButton('?');
	helpButton.position(windowWidth - 30, 10);
	helpButton.style('color', 'white');
	helpButton.style('background-color', '#222');
	helpButton.style('border', '1px solid #555');
	helpButton.style('font-family', 'monospace');
	helpButton.style('width', '24px');
	helpButton.style('height', '24px');
	helpButton.style('cursor', 'pointer');
	
	// Create info box (hidden by default)
	// Generate font credits from builtInFonts
	let fontCredits = Object.entries(builtInFonts)
		.map(([name, data]) => `${name.charAt(0).toUpperCase() + name.slice(1)} by ${data.credit}`)
		.join(' • ');
	
	infoBox = createDiv(`
		<h3 style="margin-top:0;">Audiotype</h3>
		<p>Audio-reactive tricolor typography</p>
		<hr style="border-color:#555;">
		<p><b>Controls:</b></p>
		<ul style="padding-left:20px; margin:5px 0;">
			<li>Drag to pan</li>
			<li>Scroll to zoom</li>
			<li>Mess with the values</li>
		</ul>
		<p><b>Tips:</b></p>
		<ul style="padding-left:20px; margin:5px 0;">
			<li>Upload MP3 for audio reactivity</li>
			<li>Upload custom OTF/TTF fonts</li>
		</ul>
		<hr style="border-color:#555;">
		<p style="font-size:11px;">Fonts distributed by <a href="https://velvetyne.fr/" target="_blank" style="color:#888;">Velvetyne</a>:<br/>
		${fontCredits}</p>
		<hr style="border-color:#555;">
		<p style="margin-bottom:0; font-size:11px;">by ilesinge · <a href="https://github.com/ilesinge/audiotype" target="_blank" style="color:#888;">source</a></p>
	`);
	infoBox.position(windowWidth - 270, 45);
	infoBox.style('color', 'white');
	infoBox.style('background-color', 'rgba(0,0,0,0.9)');
	infoBox.style('border', '1px solid #555');
	infoBox.style('padding', '15px');
	infoBox.style('font-family', 'monospace');
	infoBox.style('font-size', '12px');
	infoBox.style('width', '230px');
	infoBox.style('display', 'none');
	infoBox.style('z-index', '1000');
	
	helpButton.mousePressed(() => {
		if (infoBox.style('display') === 'none') {
			infoBox.style('display', 'block');
		} else {
			infoBox.style('display', 'none');
		}
	});
	
	// Add color palette selector
	let savedPalette = getItem('selectedPalette');
	let paletteName = savedPalette !== null ? savedPalette : 'Vaporwave';
	paletteSelect = createSelect();
	for (let name in colorPalettes) {
		paletteSelect.option(name);
	}
	paletteSelect.selected(paletteName);
	paletteSelect.position(50, 10);
	paletteSelect.style('color', 'white');
	paletteSelect.style('background-color', '#222');
	paletteSelect.style('border', '1px solid #555');
	paletteSelect.style('font-family', 'monospace');
	paletteSelect.changed(() => {
		storeItem('selectedPalette', paletteSelect.value());
	});

	// Add font selector
	let savedFont = getItem('selectedFont');
	let fontName = savedFont !== null ? savedFont : 'compagnon';
	fontSelect = createSelect();
	// Add built-in fonts
	for (let name in builtInFonts) {
		fontSelect.option(name);
	}
	// Add any custom fonts that were uploaded previously
	for (let name in fonts) {
		if (!(name in builtInFonts)) {
			fontSelect.option(name);
		}
	}
	fontSelect.selected(fontName);
	fontSelect.position(170, 10);
	fontSelect.style('color', 'white');
	fontSelect.style('background-color', '#222');
	fontSelect.style('border', '1px solid #555');
	fontSelect.style('font-family', 'monospace');
	fontSelect.changed(() => {
		font = fonts[fontSelect.value()];
		storeItem('selectedFont', fontSelect.value());
		genType();
	});

	// Add Record GIF button below selects for easy access
	recordButton = createButton('Record GIF');
	recordButton.position(10, 40);
	recordButton.style('color', 'white');
	recordButton.style('background-color', '#222');
	recordButton.style('border', '1px solid #555');
	recordButton.style('font-family', 'monospace');
	recordButton.mousePressed(() => {
		if (!isRecording) {
			startRecording();
		}
	});

	// Add font upload button
	let fontUploadButton = createFileInput(handleFontFile);
	fontUploadButton.style('display', 'none');
	uiElements.push(fontUploadButton);

	let fontUploadTrigger = createButton('Upload Font');
	fontUploadTrigger.position(10, 70);
	fontUploadTrigger.style('color', 'white');
	fontUploadTrigger.style('background-color', '#222');
	fontUploadTrigger.style('border', '1px solid #555');
	fontUploadTrigger.style('font-family', 'monospace');
	fontUploadTrigger.mousePressed(() => fontUploadButton.elt.click());
	uiElements.push(fontUploadTrigger);

	// Create sliders with saved values
	let yPos = 100;
	createSliderWithLabel('factor', 'Amount', 0, 1, 0.4, 0.01, yPos, genType);
	yPos += 25;
	createSliderWithLabel('size', 'Circle Size', 0, 800, 100, 1, yPos);
	yPos += 25;
	createSliderWithLabel('sinsize', 'Wave Size', 0, 50, 10, 1, yPos);
	yPos += 25;
	createSliderWithLabel('sinwidth', 'Wave Frequency', 0.01, 2, 0.1, 0.01, yPos);
	yPos += 25;
	createSliderWithLabel('sinspeed', 'Wave Speed', 0, 0.4, 0.05, 0.01, yPos);
	yPos += 25;
	createSliderWithLabel('textsize', 'Text Size', 1, 20, 2, 0.1, yPos, genType);
	yPos += 25;
	createSliderWithLabel('colorsep', 'Color Separation', 0.1, 20, 4, 0.1, yPos);
	yPos += 25;
	createSliderWithLabel('strokeweight', 'Stroke Weight', 0.1, 5, 1, 0.1, yPos);
	yPos += 25;
	createSliderWithLabel('audiosmooth', 'Audio Smooth', 0, 0.99, 0.1, 0.01, yPos);
	yPos += 25;
	createSliderWithLabel('timeoffset', 'Time Offset (ms)', -100, 100, -40, 1, yPos);
	yPos += 25;
	createSliderWithLabel('strokepower', 'Stroke Reactivity', 0.5, 10, 2, 0.1, yPos);
	yPos += 25;
	createSliderWithLabel('sizepower', 'Size Reactivity', 0.5, 10, 2, 0.1, yPos);
	yPos += 25;
	createSliderWithLabel('quantize', 'Quantize Audio (0=off)', 0, 20, 4, 1, yPos);
	yPos += 25;
	createSliderWithLabel('alpha', 'Alpha', 0, 1, 0.5, 0.01, yPos);

	// Initialize FFT for frequency analysis (128 bins for lower latency)
	fft = new p5.FFT(0.8, 128);
	
	yPos += 30;
	// Add file upload button for audio
	let audioUploadButton = createFileInput(handleAudioFile);
	audioUploadButton.style('display', 'none');
	audioUploadButton.attribute('accept', '.mp3,.wav,.ogg');
	uiElements.push(audioUploadButton);

	let audioUploadTrigger = createButton('Upload MP3');
	audioUploadTrigger.position(10, yPos);
	audioUploadTrigger.style('color', 'white');
	audioUploadTrigger.style('background-color', '#222');
	audioUploadTrigger.style('border', '1px solid #555');
	audioUploadTrigger.style('font-family', 'monospace');
	audioUploadTrigger.mousePressed(() => audioUploadButton.elt.click());
	uiElements.push(audioUploadTrigger);
	
	yPos += 25;
	// Add play/pause button
	playButton = createButton('▶');
	playButton.position(10, yPos);
	playButton.style('color', 'white');
	playButton.style('background-color', '#222');
	playButton.style('border', '1px solid #555');
	playButton.style('font-family', 'monospace');
	playButton.style('width', '40px');
	playButton.mousePressed(() => {
		if (song && song.isLoaded()) {
			if (song.isPlaying()) {
				song.pause();
				playButton.html('▶');
				if (analyzeSong && analyzeSong.isLoaded()) {
					analyzeSong.pause();
				}
			} else {
				song.loop();
				playButton.html('❚❚');
				// analyzeSong will sync in draw()
			}
		}
	});

	// Add label for audio filename
	audioNameLabel = createDiv('');
	audioNameLabel.position(60, yPos + 2);
	audioNameLabel.style('color', 'white');
	audioNameLabel.style('font-family', 'monospace');
	
	yPos += 30;
	// Add text input box
	textInput = createElement('textarea', 'play\nground');
	textInput.position(10, yPos);
	textInput.size(180, 32);
	textInput.style('color', 'white');
	textInput.style('background-color', '#222');
	textInput.style('border', '1px solid #555');
	textInput.style('font-family', 'monospace');
	textInput.style('padding', '5px');
	textInput.style('resize', 'vertical');
	textInput.style('text-align', 'right');
	textInput.input(() => {
		currentText = textInput.value();
		storeItem('textContent', currentText);
		genType();
	});
	// Load saved text or use default
	let savedText = getItem('textContent');
	if (savedText !== null) {
		textInput.value(savedText);
		currentText = savedText;
	} else {
		currentText = textInput.value();
	}
	
	yPos += 50;
	// Add audio reactive stroke checkbox
	let savedStrokeReactive = getItem('audioReactiveStroke');
	let defaultStrokeReactive = savedStrokeReactive !== null ? savedStrokeReactive === 'true' : false;
	audioReactiveStrokeCheckbox = createCheckbox('Audio Reactive Stroke', defaultStrokeReactive);
	audioReactiveStrokeCheckbox.position(10, yPos);
	audioReactiveStrokeCheckbox.style('color', 'white');
	audioReactiveStrokeCheckbox.style('font-family', 'monospace');
	audioReactiveStrokeCheckbox.changed(() => {
		storeItem('audioReactiveStroke', audioReactiveStrokeCheckbox.checked().toString());
	});
	
	yPos += 20;
	// Add audio reactive size checkbox
	let savedSizeReactive = getItem('audioReactiveSize');
	let defaultSizeReactive = savedSizeReactive !== null ? savedSizeReactive === 'true' : true;
	audioReactiveSizeCheckbox = createCheckbox('Audio Reactive Size', defaultSizeReactive);
	audioReactiveSizeCheckbox.position(10, yPos);
	audioReactiveSizeCheckbox.style('color', 'white');
	audioReactiveSizeCheckbox.style('font-family', 'monospace');
	audioReactiveSizeCheckbox.changed(() => {
		storeItem('audioReactiveSize', audioReactiveSizeCheckbox.checked().toString());
	});
	
	yPos += 20;
	// Add color wave offset checkbox
	let savedWaveOffset = getItem('colorWaveOffset');
	let defaultWaveOffset = savedWaveOffset !== null ? savedWaveOffset === 'true' : true;
	colorWaveOffsetCheckbox = createCheckbox('Color Wave Offset', defaultWaveOffset);
	colorWaveOffsetCheckbox.position(10, yPos);
	colorWaveOffsetCheckbox.style('color', 'white');
	colorWaveOffsetCheckbox.style('font-family', 'monospace');
	colorWaveOffsetCheckbox.changed(() => {
		storeItem('colorWaveOffset', colorWaveOffsetCheckbox.checked().toString());
	});
	
	yPos += 20;
	// Add filled circles checkbox
	let savedFilledCircles = getItem('filledCircles');
	let defaultFilledCircles = savedFilledCircles !== null ? savedFilledCircles === 'true' : false;
	filledCirclesCheckbox = createCheckbox('Filled Circles', defaultFilledCircles);
	filledCirclesCheckbox.position(10, yPos);
	filledCirclesCheckbox.style('color', 'white');
	filledCirclesCheckbox.style('font-family', 'monospace');
	filledCirclesCheckbox.changed(() => {
		storeItem('filledCircles', filledCirclesCheckbox.checked().toString());
	});
	
	yPos += 20;
	// Add seek slider for audio navigation
	seekSlider = createSlider(0, 100, 0, 0.1);
	seekSlider.position(10, yPos);
	seekSlider.style('width', '180px');
	seekSlider.input(() => {
		if (song && song.isLoaded()) {
			let seekTime = (seekSlider.value() / 100) * song.duration();
			song.jump(seekTime);
			if (analyzeSong && analyzeSong.isLoaded()) {
				analyzeSong.jump(seekTime);
			}
		}
	});
	
	
	// Store all UI elements for toggling
	uiElements.push(fontSelect);
	uiElements.push(paletteSelect);
	uiElements.push(audioNameLabel);
	uiElements.push(playButton);
	uiElements.push(textInput);
	uiElements.push(audioReactiveStrokeCheckbox);
	uiElements.push(audioReactiveSizeCheckbox);
	uiElements.push(colorWaveOffsetCheckbox);
	uiElements.push(filledCirclesCheckbox);
	uiElements.push(seekSlider);
	uiElements.push(recordButton);
	for (let name in sliders) {
		uiElements.push(sliders[name]);
		uiElements.push(labels[name]);
	}

	genType()
	
	// Check for saved audio and font
	loadSavedAudio();
	loadSavedFont();
}

function draw() {
	background(0)
	
	// Apply pan and zoom transformations
	push();
	translate(panX, panY);
	scale(zoomLevel);
	
	// Cache checkbox states (optimization #2)
	let isAudioReactiveStroke = audioReactiveStrokeCheckbox.checked();
	let isAudioReactiveSize = audioReactiveSizeCheckbox.checked();
	let isColorWaveOffset = colorWaveOffsetCheckbox.checked();
	let isFilledCircles = filledCirclesCheckbox.checked();
	
	// Update seek slider position if not actively seeking
	if (song && song.isLoaded() && !isSeeking) {
		let progress = (song.currentTime() / song.duration()) * 100;
		seekSlider.value(progress);
	}
	
	// Analyze audio frequencies
	if (song && song.isLoaded() && song.isPlaying() && 
		(isAudioReactiveStroke || isAudioReactiveSize)
	) {
		// Sync analyzeSong with playback song + time offset
		let offsetSeconds = sliders.timeoffset.value() / 1000;
		let targetTime = song.currentTime() + offsetSeconds;
		
		if (analyzeSong && analyzeSong.isLoaded()) {
			// Keep analyzeSong synchronized with offset
			if (!analyzeSong.isPlaying()) {
				analyzeSong.play();
			}
			
			// Sync position with offset
			let timeDiff = Math.abs(analyzeSong.currentTime() - targetTime);
			if (timeDiff > 0.05 && targetTime >= 0 && targetTime <= analyzeSong.duration()) {
				analyzeSong.jump(targetTime);
			}
		}
		
		// Set smoothing from slider (0 = no smoothing, 0.99 = max smoothing)
		fft.smooth(sliders.audiosmooth.value());
		fft.analyze();
		
		// Use getEnergy for frequency bins (more accurate than manual binning)
		// getEnergy returns 0-255 for the specified frequency range
		
		// Custom frequency ranges for electronic music
		// Bass: 20-140Hz (Kick & Sub)
		bass = fft.getEnergy(20, 199);
		
		// Mid: 200-3000Hz (Snare, Synths, Vocals)
		mid = fft.getEnergy(200, 2000);
		
		// Treble: 3000-14000Hz (Hi-hats, Cymbals)
		treble = fft.getEnergy(2000, 14000);
		
		// Map values to desired range
		bass = map(bass, 0, 255, 50, 255);
		mid = map(mid, 0, 255, 50, 255);
		// Boost high frequencies as they tend to have lower energy
		treble = map(treble, 0, 180, 50, 255);
		
		// Apply quantization if enabled
		let quantizeBins = sliders.quantize.value();
		if (quantizeBins > 0) {
			bass = quantizeValue(bass, 50, 255, quantizeBins);
			mid = quantizeValue(mid, 50, 255, quantizeBins);
			treble = quantizeValue(treble, 50, 255, quantizeBins);
		}
	} else {
		// Default colors when audio is not playing or checkbox unchecked
		bass = 255;
		mid = 255;
		treble = 255;
	}
	
	// WebGL is already centered, just apply the vertical offset
	translate(0, -200)
	
	// Cache slider values outside the loop
	let baseStrokeWeight = sliders.strokeweight.value();
	let baseSize = sliders.size.value() / 10;
	let sep = sliders.colorsep.value();
	let sinWidth = sliders.sinwidth.value();
	let sinSpeed = sliders.sinspeed.value();
	let sinSize = sliders.sinsize.value();
	let strokePower = sliders.strokepower.value();
	let sizePower = sliders.sizepower.value();
	let alphaValue = sliders.alpha.value();
	
	// Get current color palette
	let palette = colorPalettes[paletteSelect.value()];
	
	// Pre-compute colors with alpha
	let alpha255 = 255 * alphaValue;
	let color0 = color(palette[0][0], palette[0][1], palette[0][2], alpha255);
	let color1 = color(palette[1][0], palette[1][1], palette[1][2], alpha255);
	let color2 = color(palette[2][0], palette[2][1], palette[2][2], alpha255);
	
	// Phase offset: one third of a wavelength (2π/3) for each color (if enabled)
	let phaseOffset = isColorWaveOffset ? TWO_PI / 3 : 0;
	
	// Pre-compute frame-based sin component
	let framePhase = frameCount * sinSpeed;
	
	// Shared draw params object
	let params = {
		baseStrokeWeight,
		isAudioReactiveStroke,
		isAudioReactiveSize,
		isFilledCircles,
		isAudioPlaying: song && song.isPlaying(),
		strokePower,
		sizePower
	};
	
	// Draw all points
	let numPoints = points.length;
	for(let i = 0; i < numPoints; i++) {
		let p = points[i]
		
		push()

		// Draw three colored circles with frequency-based modulation
		// Blue/Color3 from treble
		s1 = baseSize + sin(i * sinWidth + framePhase) * sinSize
		drawCircle(p.x, p.y, s1, treble, color2, params);
		
		translate(-sep, 0)
		// Red/Color1 from bass (phase offset: +2π/3 if enabled)
		s2 = baseSize + sin(i * sinWidth + framePhase + phaseOffset) * sinSize
		drawCircle(p.x, p.y, s2, bass, color0, params);
		
		translate(0, -sep)
		// Green/Color2 from mid (phase offset: +4π/3 if enabled)
		s3 = baseSize + sin(i * sinWidth + framePhase + phaseOffset * 2) * sinSize
		drawCircle(p.x, p.y, s3, mid, color1, params);
		pop()
	}
	
	// End pan/zoom transformation
	pop();

}

// Draw a single colored circle with pre-computed values
function drawCircle(x, y, baseSize, freqValue, c, p) {
	// Apply audio-reactive stroke weight
	if (p.isAudioReactiveStroke && p.isAudioPlaying) {
		strokeWeight(map(freqValue, 50, 255, 0.1, p.baseStrokeWeight * p.strokePower));
	} else {
		strokeWeight(p.baseStrokeWeight);
	}
	
	// Apply audio-reactive size
	let circleSize = baseSize;
	if (p.isAudioReactiveSize && p.isAudioPlaying) {
		circleSize = baseSize * map(freqValue, 50, 255, 0.5, p.sizePower);
	}
	
	stroke(c);
	
	if (p.isFilledCircles) {
		fill(c);
	} else {
		noFill();
	}
	
	circle(x, y, circleSize);
}

function genType() {
	if (!font) return;
	
	txtSize = width / 16 * sliders.textsize.value()
	let lineSpacing = txtSize * 0.9;
	
	// Split text by actual newlines (from textarea)
	let texts = currentText.split('\n');
	//let texts = [currentText];
	textLeading(lineSpacing);
	textAlign(RIGHT);
	
	// Combine all points with spacing
	points = [];
	let yOffset = 0;
	
	for (let i = 0; i < texts.length; i++) {
		let bounds = font.textBounds(texts[i], 0, 0, txtSize)
		let textPoints = font.textToPoints(texts[i], -bounds.w / 2, bounds.h / 2 + yOffset, txtSize, {
			sampleFactor: map(sliders.factor.value(), 0, 1, 0, 0.8),
			simplifyThreshold: 0
		})
		points = points.concat(textPoints);
		yOffset += lineSpacing;
	}
}

// Handle uploaded audio file
function handleAudioFile(file) {
	if (file.type === 'audio') {
		// Update label
		if (audioNameLabel) audioNameLabel.html(file.name);

		// Save to DB if file object is available
		if (file.file) {
			saveAudioToDB(file.file);
		}
		
		loadAudioFromSource(file.data);
	} else {
		console.error('Please upload an audio file');
	}
}

// Handle uploaded font file
function handleFontFile(file) {
	if (file.type === 'font' || file.name.endsWith('.otf') || file.name.endsWith('.ttf')) {
		// Create a custom name from the filename (remove extension)
		let customName = file.name.replace(/\.(otf|ttf)$/i, '');
		
		// Save to DB if file object is available
		if (file.file) {
			saveFontToDB(file.file, customName);
		}
		
		// Load the font
		loadFont(file.data, (loadedFont) => {
			console.log('Custom font loaded successfully:', customName);
			
			// Store the font
			fonts[customName] = loadedFont;
			
			// Add to selector if not already there
			let optionExists = false;
			for (let i = 0; i < fontSelect.elt.options.length; i++) {
				if (fontSelect.elt.options[i].value === customName) {
					optionExists = true;
					break;
				}
			}
			if (!optionExists) {
				fontSelect.option(customName);
			}
			
			// Select and use the new font
			fontSelect.selected(customName);
			font = loadedFont;
			storeItem('selectedFont', customName);
			genType();
		}, (error) => {
			console.error('Error loading font:', error);
			alert('Error loading font. Please make sure it is a valid .otf or .ttf file.');
		});
	} else {
		console.error('Please upload a font file (.otf or .ttf)');
		alert('Please upload a font file (.otf or .ttf)');
	}
}

// Toggle UI visibility
function toggleUI(toggleButton) {
	uiVisible = !uiVisible;
	for (let element of uiElements) {
		if (uiVisible && element.elt.type !== 'file') {
			console.log(element);
			element.show();
		} else {
			element.hide();
		}
	}
	// Update button text
	toggleButton.html(uiVisible ? '▼' : '▲');
}

// Create slider with label - generalized function
function createSliderWithLabel(name, label, min, max, defaultValue, step, yPos, callback = null) {
	// Load saved value or use default
	let savedValue = getSliderValue(name + 'slider', defaultValue);
	
	console.log('Using saved value for', name, savedValue);
	
	// Create slider
	sliders[name] = createSlider(min, max, savedValue, step);
	sliders[name].position(10, yPos);
	sliders[name].style('width', '130px');
	sliders[name].input(() => {
		saveSliderValue(name + 'slider', sliders[name].value());
		updateLabels(); // Update labels on input
		if (callback) callback();
	});
	
	// Create label
	labels[name] = createDiv(label + ': ' + savedValue);
	labels[name].attribute('x-label', label);
	labels[name].position(150, yPos + 4);
	labels[name].style('color', 'white');
	labels[name].style('font-family', 'monospace');
}

// Update all labels in real-time
function updateLabels() {
	for (let name in sliders) {
		let labelText = labels[name].attribute('x-label');
		labels[name].html(labelText + ': ' + sliders[name].value());
	}
}

// Save slider value to localStorage
function saveSliderValue(name, value) {
	console.log('Saving', name, value);
	storeItem(name, value);
}

// Get slider value from localStorage
function getSliderValue(name, defaultValue) {
	let value = getItem(name);
	console.log('Loading', name, value);
	return value  === null ? defaultValue : parseFloat(value);
}

// Quantize a value into discrete bins
function quantizeValue(value, minVal, maxVal, numBins) {
	// Calculate bin size
	let binSize = (maxVal - minVal) / numBins;
	// Find which bin the value falls into
	let binIndex = floor((value - minVal) / binSize);
	// Clamp to valid range
	binIndex = constrain(binIndex, 0, numBins - 1);
	// Return the center value of that bin
	return minVal + (binIndex + 0.5) * binSize;
}

// Mouse pressed - start dragging if not over UI
function mousePressed() {
	// Don't pan if UI is visible and mouse is over UI area
	if (uiVisible && mouseX < 250) {
		return; // Let UI handle the interaction
	}
	isDragging = true;
	lastMouseX = mouseX;
	lastMouseY = mouseY;
}

// Mouse dragged - pan the view
function mouseDragged() {
	if (isDragging) {
		let dx = mouseX - lastMouseX;
		let dy = mouseY - lastMouseY;
		panX += dx;
		panY += dy;
		lastMouseX = mouseX;
		lastMouseY = mouseY;
	}
}

// Mouse released - stop dragging
function mouseReleased() {
	isDragging = false;
	// Save pan position
	storeItem('panX', panX);
	storeItem('panY', panY);
}

// Mouse wheel - zoom in/out
function mouseWheel(event) {
	// Don't zoom if UI is visible and mouse is over UI area
	if (uiVisible && mouseX < 250 && mouseY < 350) {
		return; // Let UI handle the interaction
	}
	
	// Zoom factor
	let zoomFactor = event.delta > 0 ? 0.95 : 1.05;
	let newZoom = zoomLevel * zoomFactor;
	
	// Clamp zoom level
	newZoom = constrain(newZoom, 0.1, 10);
	
	// Convert screen mouse coords to WebGL coords (origin at center)
	let mouseXGL = mouseX - width / 2;
	let mouseYGL = mouseY - height / 2;
	
	// Zoom towards mouse position
	let mouseXWorld = (mouseXGL - panX) / zoomLevel;
	let mouseYWorld = (mouseYGL - panY) / zoomLevel;
	
	panX = mouseXGL - mouseXWorld * newZoom;
	panY = mouseYGL - mouseYWorld * newZoom;
	
	zoomLevel = newZoom;
	
	// Save zoom and pan values
	storeItem('zoomLevel', zoomLevel);
	storeItem('panX', panX);
	storeItem('panY', panY);
	
	return false; // Prevent default scrolling
}

// Handle window resize
function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	genType(); // Regenerate text points for new canvas size
	// Reposition help button and info box
	if (helpButton) helpButton.position(windowWidth - 30, 10);
	if (infoBox) infoBox.position(windowWidth - 270, 45);
}

// Start recording a GIF for one complete sine wavelength
function startRecording() {
	isRecording = true;
	recordStartFrame = frameCount;
	recordButton.html('Recording...');
	
	// Calculate frames for one complete sine wave cycle
	// Period T = 2π / (sinspeed * frameRate)
	// Frames needed = T * frameRate = 2π / sinspeed
	let sinspeed = sliders.sinspeed.value();
	if (sinspeed === 0) {
		sinspeed = 0.001; // Avoid division by zero
	}
	let framesNeeded = ceil(TWO_PI / sinspeed);
	
	console.log('Recording', framesNeeded, 'frames for one complete wavelength');
	console.log('Duration:', (framesNeeded / 30).toFixed(2), 'seconds');
	
	// Use p5.js saveGif function
	// Record at reduced resolution to keep file size manageable
	saveGif('plgrnd-wave', framesNeeded / 30, {
		delay: 0,
		units: 'seconds',
		notificationDuration: 2
	});
	
	// Reset recording state after duration
	setTimeout(() => {
		isRecording = false;
		
		// Reset button text after 1 second
		setTimeout(() => {
			recordButton.html('Record GIF');
		}, 1000);
	}, (framesNeeded / 30) * 1000 + 1000); // Add 1000ms buffer
}

// Helper to load audio from a source (URL or data)
function loadAudioFromSource(source) {
	// Stop and remove previous songs if exist
	if (song) {
		song.stop();
	}
	if (analyzeSong) {
		analyzeSong.stop();
	}
	
	// Reset play button
	if (playButton) {
		playButton.html('▶');
	}
	
	// Load the audio file for playback
	song = loadSound(source, () => {
		console.log('Playback audio loaded successfully');
		song.amp(0.3); // Set volume for hearing
	});
	
	// Load the same audio file for FFT analysis
	analyzeSong = loadSound(source, () => {
		console.log('Analysis audio loaded successfully');
		analyzeSong.disconnect(); // Disconnect from output
		fft.setInput(analyzeSong); // Connect FFT to analysis song
	});
}

// IndexedDB helpers for saving audio and fonts
const DB_NAME = 'AudioTypeDB';
const DB_VERSION = 2;
const AUDIO_STORE_NAME = 'audioFiles';
const FONT_STORE_NAME = 'fontFiles';

function openDB() {
	return new Promise((resolve, reject) => {
		let request = indexedDB.open(DB_NAME, DB_VERSION);
		
		request.onerror = (event) => reject('IndexedDB error: ' + event.target.error);
		
		request.onupgradeneeded = (event) => {
			let db = event.target.result;
			if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
				db.createObjectStore(AUDIO_STORE_NAME);
			}
			if (!db.objectStoreNames.contains(FONT_STORE_NAME)) {
				db.createObjectStore(FONT_STORE_NAME);
			}
		};
		
		request.onsuccess = (event) => resolve(event.target.result);
	});
}

async function saveAudioToDB(fileData) {
	try {
		let db = await openDB();
		let tx = db.transaction(AUDIO_STORE_NAME, 'readwrite');
		let store = tx.objectStore(AUDIO_STORE_NAME);
		store.put(fileData, 'savedAudio');
		console.log('Audio saved to IndexedDB');
	} catch (err) {
		console.error('Error saving audio to DB:', err);
	}
}

async function getAudioFromDB() {
	try {
		let db = await openDB();
		return new Promise((resolve, reject) => {
			let tx = db.transaction(AUDIO_STORE_NAME, 'readonly');
			let store = tx.objectStore(AUDIO_STORE_NAME);
			let request = store.get('savedAudio');
			
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	} catch (err) {
		console.error('Error getting audio from DB:', err);
		return null;
	}
}

async function saveFontToDB(fileData, fontName) {
	try {
		let db = await openDB();
		let tx = db.transaction(FONT_STORE_NAME, 'readwrite');
		let store = tx.objectStore(FONT_STORE_NAME);
		// Save both the file data and the name
		store.put({ file: fileData, name: fontName }, 'savedFont');
		console.log('Font saved to IndexedDB');
	} catch (err) {
		console.error('Error saving font to DB:', err);
	}
}

async function getFontFromDB() {
	try {
		let db = await openDB();
		return new Promise((resolve, reject) => {
			let tx = db.transaction(FONT_STORE_NAME, 'readonly');
			let store = tx.objectStore(FONT_STORE_NAME);
			let request = store.get('savedFont');
			
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	} catch (err) {
		console.error('Error getting font from DB:', err);
		return null;
	}
}

async function loadSavedAudio() {
	let savedFile = await getAudioFromDB();
	if (savedFile) {
		console.log('Found saved audio in DB');
		if (audioNameLabel && savedFile.name) audioNameLabel.html(savedFile.name);
		let url = URL.createObjectURL(savedFile);
		loadAudioFromSource(url);
	}
}

async function loadSavedFont() {
	let savedFontData = await getFontFromDB();
	if (savedFontData) {
		console.log('Found saved font in DB:', savedFontData.name);
		let fontName = savedFontData.name;
		let fontFile = savedFontData.file;
		
		// Create a blob URL for the font
		let url = URL.createObjectURL(fontFile);
		
		// Load the font
		loadFont(url, (loadedFont) => {
			// Store the font
			fonts[fontName] = loadedFont;
			
			// Add to selector if not already there
			let optionExists = false;
			for (let i = 0; i < fontSelect.elt.options.length; i++) {
				if (fontSelect.elt.options[i].value === fontName) {
					optionExists = true;
					break;
				}
			}
			if (!optionExists) {
				fontSelect.option(fontName);
			}
			
			// Select and use the new font
			fontSelect.selected(fontName);
			font = loadedFont;
			storeItem('selectedFont', fontName);
			genType();
		});
	}
}