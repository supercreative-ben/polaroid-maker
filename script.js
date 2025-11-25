let uploadedImage = null;
let canvas = null;
let ctx = null;
let imageOffsetX = 0;
let imageOffsetY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

const CANVAS_SIZE = 500; // Fixed square size for consistent exports

const elements = {
    upload: document.getElementById('upload'),
    uploadPlaceholder: document.getElementById('uploadPlaceholder'),
    frameColor: document.getElementById('frameColor'),
    borderWidth: document.getElementById('borderWidth'),
    bottomBorder: document.getElementById('bottomBorder'),
    rotation: document.getElementById('rotation'),
    shadowBlur: document.getElementById('shadowBlur'),
    shadowOpacity: document.getElementById('shadowOpacity'),
    imageScale: document.getElementById('imageScale'),
    caption: document.getElementById('caption'),
    captionSize: document.getElementById('captionSize'),
    captionFont: document.getElementById('captionFont'),
    downloadBtn: document.getElementById('downloadBtn'),
    resetBtn: document.getElementById('resetBtn'),
    polaroidContainer: document.getElementById('polaroidContainer'),
    previewArea: document.querySelector('.preview-area')
};

const defaultValues = {
    frameColor: '#ffffff',
    borderWidth: 20,
    bottomBorder: 60,
    rotation: 0,
    shadowBlur: 20,
    shadowOpacity: 0.3,
    imageScale: 1.0,
    caption: '',
    captionSize: 16,
    captionFont: "'Inter', system-ui, sans-serif"
};

function updateValueDisplay(id, value) {
    document.getElementById(id + 'Value').textContent = value;
}

function updateSliderBackground(slider) {
    const min = slider.min || 0;
    const max = slider.max || 100;
    const value = slider.value;
    const percentage = ((value - min) / (max - min)) * 100;
    slider.style.background = `linear-gradient(to right, #7b64ff 0%, #7b64ff ${percentage}%, #2a2a2a ${percentage}%, #2a2a2a 100%)`;
}

function setupEventListeners() {
    elements.upload.addEventListener('change', handleImageUpload);

    elements.frameColor.addEventListener('input', renderPolaroid);

    elements.borderWidth.addEventListener('input', (e) => {
        updateValueDisplay('borderWidth', e.target.value);
        updateSliderBackground(e.target);
        renderPolaroid();
    });

    elements.bottomBorder.addEventListener('input', (e) => {
        updateValueDisplay('bottomBorder', e.target.value);
        updateSliderBackground(e.target);
        renderPolaroid();
    });

    elements.rotation.addEventListener('input', (e) => {
        updateValueDisplay('rotation', e.target.value);
        updateSliderBackground(e.target);
        updateRotation();
    });

    elements.shadowBlur.addEventListener('input', (e) => {
        updateValueDisplay('shadowBlur', e.target.value);
        updateSliderBackground(e.target);
        updateShadow();
    });

    elements.shadowOpacity.addEventListener('input', (e) => {
        updateValueDisplay('shadowOpacity', e.target.value);
        updateSliderBackground(e.target);
        updateShadow();
    });

    elements.imageScale.addEventListener('input', (e) => {
        updateValueDisplay('imageScale', e.target.value);
        updateSliderBackground(e.target);
        renderPolaroid();
    });

    elements.caption.addEventListener('input', renderPolaroid);

    elements.captionSize.addEventListener('input', (e) => {
        updateValueDisplay('captionSize', e.target.value);
        updateSliderBackground(e.target);
        renderPolaroid();
    });

    elements.captionFont.addEventListener('change', renderPolaroid);

    elements.downloadBtn.addEventListener('click', downloadPolaroid);
    elements.resetBtn.addEventListener('click', resetControls);

    // Upload placeholder click handler
    if (elements.uploadPlaceholder) {
        elements.uploadPlaceholder.addEventListener('click', () => {
            elements.upload.click();
        });
        elements.uploadPlaceholder.style.cursor = 'pointer';
    }

    // Drag and drop functionality
    setupDragAndDrop();

    // Keyboard shortcuts
    setupKeyboardShortcuts();

    // Initialize slider backgrounds
    initializeSliders();

    // Setup canvas dragging
    setupCanvasDragging();
}

function setupCanvasDragging() {
    let canvasElement = null;

    const startDrag = (e) => {
        if (!canvas) return;
        isDragging = true;
        const rect = canvas.getBoundingClientRect();
        dragStartX = (e.clientX || e.touches[0].clientX) - rect.left;
        dragStartY = (e.clientY || e.touches[0].clientY) - rect.top;
        canvas.style.cursor = 'grabbing';
    };

    const drag = (e) => {
        if (!isDragging || !canvas) return;
        e.preventDefault();

        const rect = canvas.getBoundingClientRect();
        const currentX = (e.clientX || e.touches[0].clientX) - rect.left;
        const currentY = (e.clientY || e.touches[0].clientY) - rect.top;

        const deltaX = currentX - dragStartX;
        const deltaY = currentY - dragStartY;

        imageOffsetX += deltaX;
        imageOffsetY += deltaY;

        dragStartX = currentX;
        dragStartY = currentY;

        renderPolaroid();
    };

    const endDrag = () => {
        if (!canvas) return;
        isDragging = false;
        canvas.style.cursor = 'grab';
    };

    elements.polaroidContainer.addEventListener('mousedown', startDrag);
    elements.polaroidContainer.addEventListener('touchstart', startDrag);

    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, { passive: false });

    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
}

function initializeSliders() {
    const sliders = [
        elements.borderWidth,
        elements.bottomBorder,
        elements.rotation,
        elements.shadowBlur,
        elements.shadowOpacity,
        elements.imageScale,
        elements.captionSize
    ];

    sliders.forEach(slider => {
        if (slider) updateSliderBackground(slider);
    });
}

function setupDragAndDrop() {
    const dropZones = [elements.upload, elements.previewArea];

    dropZones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (zone === elements.upload) {
                zone.classList.add('drag-over');
            } else {
                const placeholder = zone.querySelector('.upload-placeholder');
                if (placeholder) placeholder.classList.add('drag-over');
            }
        });

        zone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (zone === elements.upload) {
                zone.classList.remove('drag-over');
            } else {
                const placeholder = zone.querySelector('.upload-placeholder');
                if (placeholder) placeholder.classList.remove('drag-over');
            }
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (zone === elements.upload) {
                zone.classList.remove('drag-over');
            } else {
                const placeholder = zone.querySelector('.upload-placeholder');
                if (placeholder) placeholder.classList.remove('drag-over');
            }

            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                handleImageFile(files[0]);
            }
        });
    });
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
            e.preventDefault();
            elements.upload.click();
        }

        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
            e.preventDefault();
            if (!elements.downloadBtn.disabled) {
                downloadPolaroid();
            }
        }

        if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
            e.preventDefault();
            resetControls();
        }
    });
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    handleImageFile(file);
}

function handleImageFile(file) {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            uploadedImage = img;
            createCanvas();
            renderPolaroid();
            elements.downloadBtn.disabled = false;
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function createCanvas() {
    if (canvas) {
        canvas.remove();
    }

    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
    canvas.style.cursor = 'grab';
    elements.polaroidContainer.innerHTML = '';
    elements.polaroidContainer.appendChild(canvas);

    // Reset image offset when new image is loaded
    imageOffsetX = 0;
    imageOffsetY = 0;
}

function renderPolaroid() {
    if (!uploadedImage || !canvas) return;

    const borderWidth = parseInt(elements.borderWidth.value);
    const bottomBorder = parseInt(elements.bottomBorder.value);
    const frameColor = elements.frameColor.value;
    const scale = parseFloat(elements.imageScale.value);
    const caption = elements.caption.value;
    const captionSize = parseInt(elements.captionSize.value);
    const captionFont = elements.captionFont.value;

    // Fixed square canvas size
    const imageAreaSize = CANVAS_SIZE;
    canvas.width = imageAreaSize + (borderWidth * 2);
    canvas.height = imageAreaSize + borderWidth + bottomBorder;

    // Fill frame background
    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate scaled image dimensions to fit in square
    const imgAspect = uploadedImage.width / uploadedImage.height;
    let drawWidth, drawHeight;

    if (imgAspect > 1) {
        // Landscape
        drawWidth = imageAreaSize * scale;
        drawHeight = (imageAreaSize / imgAspect) * scale;
    } else {
        // Portrait or square
        drawHeight = imageAreaSize * scale;
        drawWidth = (imageAreaSize * imgAspect) * scale;
    }

    // Center the image and apply offset
    const imgX = borderWidth + (imageAreaSize - drawWidth) / 2 + imageOffsetX;
    const imgY = borderWidth + (imageAreaSize - drawHeight) / 2 + imageOffsetY;

    // Clip to image area to prevent overflow
    ctx.save();
    ctx.rect(borderWidth, borderWidth, imageAreaSize, imageAreaSize);
    ctx.clip();

    ctx.drawImage(
        uploadedImage,
        imgX,
        imgY,
        drawWidth,
        drawHeight
    );

    ctx.restore();

    // Draw caption if provided
    if (caption.trim()) {
        ctx.fillStyle = '#333333';
        ctx.font = `${captionSize}px ${captionFont}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const captionY = imageAreaSize + borderWidth + (bottomBorder / 2);
        ctx.fillText(caption, canvas.width / 2, captionY);
    }

    updateRotation();
    updateShadow();
}

function updateRotation() {
    if (!canvas) return;

    const rotation = parseInt(elements.rotation.value);
    elements.polaroidContainer.style.transform = `rotate(${rotation}deg)`;
}

function updateShadow() {
    if (!canvas) return;

    const blur = parseInt(elements.shadowBlur.value);
    const opacity = parseFloat(elements.shadowOpacity.value);

    elements.polaroidContainer.style.boxShadow = `0 ${blur}px ${blur * 2}px rgba(0, 0, 0, ${opacity})`;
}

function downloadPolaroid() {
    if (!canvas) return;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    const padding = 100;
    const rotation = parseInt(elements.rotation.value) * Math.PI / 180;

    const rotatedWidth = Math.abs(canvas.width * Math.cos(rotation)) + Math.abs(canvas.height * Math.sin(rotation));
    const rotatedHeight = Math.abs(canvas.width * Math.sin(rotation)) + Math.abs(canvas.height * Math.cos(rotation));

    tempCanvas.width = rotatedWidth + padding * 2;
    tempCanvas.height = rotatedHeight + padding * 2;

    tempCtx.fillStyle = 'rgba(0, 0, 0, 0)';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    tempCtx.save();
    tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
    tempCtx.rotate(rotation);

    const blur = parseInt(elements.shadowBlur.value);
    const opacity = parseFloat(elements.shadowOpacity.value);
    tempCtx.shadowColor = `rgba(0, 0, 0, ${opacity})`;
    tempCtx.shadowBlur = blur;
    tempCtx.shadowOffsetX = 0;
    tempCtx.shadowOffsetY = blur;

    tempCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    tempCtx.restore();

    const link = document.createElement('a');
    link.download = 'polaroid-' + Date.now() + '.png';
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
}

function resetControls() {
    elements.frameColor.value = defaultValues.frameColor;
    elements.borderWidth.value = defaultValues.borderWidth;
    elements.bottomBorder.value = defaultValues.bottomBorder;
    elements.rotation.value = defaultValues.rotation;
    elements.shadowBlur.value = defaultValues.shadowBlur;
    elements.shadowOpacity.value = defaultValues.shadowOpacity;
    elements.imageScale.value = defaultValues.imageScale;
    elements.caption.value = defaultValues.caption;
    elements.captionSize.value = defaultValues.captionSize;
    elements.captionFont.value = defaultValues.captionFont;

    updateValueDisplay('borderWidth', defaultValues.borderWidth);
    updateValueDisplay('bottomBorder', defaultValues.bottomBorder);
    updateValueDisplay('rotation', defaultValues.rotation);
    updateValueDisplay('shadowBlur', defaultValues.shadowBlur);
    updateValueDisplay('shadowOpacity', defaultValues.shadowOpacity);
    updateValueDisplay('imageScale', defaultValues.imageScale);
    updateValueDisplay('captionSize', defaultValues.captionSize);

    // Reset image position
    imageOffsetX = 0;
    imageOffsetY = 0;

    // Update slider backgrounds
    initializeSliders();

    if (uploadedImage) {
        renderPolaroid();
    }
}

setupEventListeners();
