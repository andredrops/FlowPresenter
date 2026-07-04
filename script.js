const slides = [
  { title: "Capa", file: "Slide 01 UX Capa.png", type: "capa" },
  { title: "UX vs UI", file: "Slide 02 UX vs IU.png", type: "introdução" },
  { title: "Pecado 01", file: "UX Pecado 01.png", type: "pecado" },
  { title: "Pecado 02", file: "UX Pecado 02.png", type: "pecado" },
  { title: "Pecado 03", file: "UX Pecado 03.png", type: "pecado" },
  { title: "Pecado 04", file: "UX Pecado 04.png", type: "pecado" },
  { title: "Pecado 05", file: "UX Pecado 05.png", type: "pecado" },
  { title: "Pecado 06", file: "UX Pecado 06.png", type: "pecado" },
  { title: "Pecado 07", file: "UX Pecado 07.png", type: "pecado" },
  { title: "Pecado 08", file: "UX Pecado 08.png", type: "pecado" },
  { title: "Pecado 09", file: "UX Pecado 09.png", type: "pecado" },
  { title: "Pecado 10", file: "UX Pecado 10.png", type: "pecado" },
  { title: "Final", file: "UX Slide Final.png", type: "final" },
  {
    title: "Missão Concluída",
    type: "encerramento",
    text: "Missão Finalizada com Sucesso!",
    subtitle: "UX mais claro, decisões melhores e usuários menos perdidos pelo caminho.",
    icon: "🚀",
  },
];

const state = {
  currentSlide: 0,
  zoomMode: false,
  pointerMode: false,
  penMode: false,
  zoomed: false,
  panning: false,
  zoomScale: 1,
  panX: 0,
  panY: 0,
  panStart: null,
  imagePointerStart: null,
  imagePointerMoved: false,
  drawing: false,
  selecting: false,
  selectionStart: null,
};

const mapView = document.querySelector("#mapView");
const stageView = document.querySelector("#stageView");
const mapPath = document.querySelector("#mapPath");
const startButton = document.querySelector("#startButton");
const stageCanvas = document.querySelector("#stageCanvas");
const slideFrame = document.querySelector("#slideFrame");
const slideImage = document.querySelector("#slideImage");
const drawCanvas = document.querySelector("#drawCanvas");
const selectionBox = document.querySelector("#selectionBox");
const slideCounter = document.querySelector("#slideCounter");
const slideTitle = document.querySelector("#slideTitle");
const laserPointer = document.querySelector("#laserPointer");

const buttons = {
  previous: document.querySelector("#prevButton"),
  next: document.querySelector("#nextButton"),
  map: document.querySelector("#mapButton"),
  zoom: document.querySelector("#zoomButton"),
  resetZoom: document.querySelector("#resetZoomButton"),
  pointer: document.querySelector("#pointerButton"),
  pen: document.querySelector("#penButton"),
  clear: document.querySelector("#clearButton"),
  fullscreen: document.querySelector("#fullscreenButton"),
};

const drawingContext = drawCanvas.getContext("2d");

function imageCandidates(file) {
  return [`imagens/${file}`, file, `../${file}`];
}

function imagePath(file, candidateIndex = 0) {
  return encodeURI(imageCandidates(file)[candidateIndex]);
}

function buildMap() {
  const tilts = [-3, 2, -1, 3, 1, -2, 2, -3, 3, -1, 2, -2, 1];
  const lifts = [0, 18, -8, 12, -14, 8, 20, -6, 10, -16, 4, 18, -10];
  const mapSlides = slides.filter((slide) => slide.file);

  mapPath.innerHTML = mapSlides
    .map((slide, index) => `
      <button class="map-card" type="button" data-index="${index}" style="--tilt: ${tilts[index]}deg; --lift: ${lifts[index]}px" aria-label="Abrir ${slide.title}">
        <img src="${imagePath(slide.file)}" data-candidate="0" alt="Miniatura: ${slide.title}" />
        <span>${String(index + 1).padStart(2, "0")} • ${slide.title}</span>
      </button>
    `)
    .join("");

  mapPath.querySelectorAll(".map-card").forEach((card) => {
    card.addEventListener("click", () => openSlide(Number(card.dataset.index)));
  });

  mapPath.querySelectorAll("img").forEach((image) => {
    image.addEventListener("error", () => {
      const slide = slides[Number(image.closest(".map-card").dataset.index)];
      const nextCandidate = Number(image.dataset.candidate) + 1;
      if (nextCandidate < imageCandidates(slide.file).length) {
        image.dataset.candidate = String(nextCandidate);
        image.src = imagePath(slide.file, nextCandidate);
        return;
      }

      image.style.display = "none";
      image.parentElement.classList.add("image-missing");
    });
  });
}

function openSlide(index = 0) {
  state.currentSlide = Math.max(0, Math.min(index, slides.length - 1));
  renderSlide();
  setPointerMode(true);
  mapView.classList.add("is-zooming-out");
  stageView.classList.add("is-zooming-in");

  window.setTimeout(() => {
    mapView.classList.remove("is-active");
    stageView.classList.add("is-active");
    stageView.setAttribute("aria-hidden", "false");
    mapView.setAttribute("aria-hidden", "true");
    stageView.classList.remove("is-zooming-in");
  }, 120);
}

function showMap() {
  resetZoom();
  disableTools();
  clearDrawing();
  stageView.classList.add("is-zooming-in");
  mapView.classList.add("is-active");
  mapView.classList.remove("is-zooming-out");
  mapView.setAttribute("aria-hidden", "false");
  stageView.setAttribute("aria-hidden", "true");

  window.setTimeout(() => {
    stageView.classList.remove("is-active", "is-zooming-in");
  }, 360);
}

function renderSlide() {
  const slide = slides[state.currentSlide];
  resetZoom();
  clearDrawing();
  slideFrame.querySelector(".missing-image")?.remove();
  slideFrame.querySelector(".success-slide")?.remove();
  slideFrame.classList.toggle("is-text-slide", !slide.file);
  slideImage.hidden = !slide.file;

  if (slide.file) {
    slideImage.alt = `${slide.title} — ${slide.type}`;
    slideImage.dataset.candidate = "0";
    slideImage.src = imagePath(slide.file);
  } else {
    slideImage.removeAttribute("src");
    slideImage.alt = "";
    slideFrame.insertAdjacentHTML(
      "afterbegin",
      `<div class="success-slide">
        <div class="success-orb" aria-hidden="true">${slide.icon}</div>

        <h2>${slide.text}</h2>
        <p>${slide.subtitle}</p>
      </div>`
    );
  }

  slideCounter.textContent = `${state.currentSlide + 1} / ${slides.length}`;
  slideTitle.textContent = slide.title;
  buttons.previous.disabled = state.currentSlide === 0;
  buttons.next.disabled = state.currentSlide === slides.length - 1;
  buttons.zoom.disabled = !slide.file;
}

function nextSlide() {
  if (state.currentSlide < slides.length - 1) {
    state.currentSlide += 1;
    renderSlide();
  }
}

function previousSlide() {
  if (state.currentSlide > 0) {
    state.currentSlide -= 1;
    renderSlide();
  }
}

function syncCanvasSize() {
  const rect = slideFrame.getBoundingClientRect();
  const scale = state.zoomScale || 1;
  const width = rect.width / scale;
  const height = rect.height / scale;
  const ratio = window.devicePixelRatio || 1;
  drawCanvas.width = Math.max(1, Math.round(width * ratio));
  drawCanvas.height = Math.max(1, Math.round(height * ratio));
  drawCanvas.style.width = `${width}px`;
  drawCanvas.style.height = `${height}px`;
  drawingContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawingContext.lineCap = "round";
  drawingContext.lineJoin = "round";
  drawingContext.strokeStyle = "#ff334e";
  drawingContext.lineWidth = 4;
}

function clearDrawing() {
  syncCanvasSize();
  drawingContext.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
}

function setPenMode(enabled) {
  state.penMode = enabled;
  document.body.classList.toggle("pen-active", state.penMode);
  buttons.pen.classList.toggle("is-active", state.penMode);
  buttons.pen.classList.toggle("is-hidden", state.penMode);
  buttons.clear.classList.toggle("is-hidden", !state.penMode);
  buttons.clear.classList.toggle("is-danger", state.penMode);
}

function clearPenAndDisable() {
  clearDrawing();
  setPenMode(false);
}

function setPointerMode(enabled) {
  state.pointerMode = enabled;
  document.body.classList.toggle("pointer-active", state.pointerMode);
  buttons.pointer.classList.toggle("is-active", state.pointerMode);
}

function disableTools() {
  state.zoomMode = false;
  state.penMode = false;
  state.panning = false;
  document.body.classList.remove("zoom-active", "zoomed", "is-panning", "pointer-active", "pen-active");
  buttons.zoom.classList.remove("is-active", "is-hidden");
  setPointerMode(false);
  setPenMode(false);
  buttons.resetZoom.classList.add("is-hidden");
}

function toggleZoomMode() {
  if (state.zoomMode || state.zoomed) {
    resetZoom();
    return;
  }

  state.zoomMode = true;
  state.penMode = false;
  document.body.classList.add("zoom-active");
  document.body.classList.remove("pen-active");
  buttons.zoom.classList.add("is-active", "is-hidden");
  setPenMode(false);
  buttons.resetZoom.textContent = "Desligar Zoom";
  buttons.resetZoom.title = "Desliga o zoom e limpa rabiscos";
  buttons.resetZoom.classList.remove("is-hidden");
  buttons.resetZoom.classList.add("is-danger");
}

function togglePointerMode() {
  setPointerMode(!state.pointerMode);
}

function togglePenMode() {
  const shouldEnablePen = !state.penMode;
  if (shouldEnablePen && (state.zoomMode || state.zoomed)) {
    resetZoom();
  }

  state.panning = false;
  document.body.classList.remove("zoom-active", "is-panning");
  buttons.zoom.classList.remove("is-active");
  setPenMode(shouldEnablePen);
}

function resetZoom() {
  const shouldClearDrawing = state.zoomMode || state.zoomed;
  state.zoomMode = false;
  state.zoomed = false;
  state.panning = false;
  state.zoomScale = 1;
  state.panX = 0;
  state.panY = 0;
  state.panStart = null;
  setStageTransform();
  document.body.classList.remove("zoom-active", "zoomed", "is-panning");
  buttons.zoom.classList.remove("is-active", "is-hidden");
  buttons.resetZoom.textContent = "Voltar ao normal";
  buttons.resetZoom.title = "Volta ao tamanho normal";
  buttons.resetZoom.classList.remove("is-danger");
  buttons.resetZoom.classList.add("is-hidden");

  if (shouldClearDrawing) {
    clearDrawing();
  }
}

function setStageTransform() {
  stageCanvas.style.setProperty("--zoom-scale", state.zoomScale.toFixed(3));
  stageCanvas.style.setProperty("--pan-x", `${state.panX.toFixed(1)}px`);
  stageCanvas.style.setProperty("--pan-y", `${state.panY.toFixed(1)}px`);
}

function getLocalPoint(event) {
  const visualRect = slideFrame.getBoundingClientRect();
  const scale = state.zoomScale || 1;
  const rect = {
    left: visualRect.left,
    top: visualRect.top,
    width: visualRect.width / scale,
    height: visualRect.height / scale,
  };

  return {
    x: Math.max(0, Math.min((event.clientX - visualRect.left) / scale, rect.width)),
    y: Math.max(0, Math.min((event.clientY - visualRect.top) / scale, rect.height)),
    rect,
  };
}

function startSelection(event) {
  if (!state.zoomMode || event.button !== 0) return;
  applyPointZoom(getLocalPoint(event), 2);
}

function updateSelection(event) {
  if (!state.selecting) return;
  updateSelectionBox(state.selectionStart, getLocalPoint(event));
}

function finishSelection(event) {
  if (!state.selecting) return;
  const end = getLocalPoint(event);
  const start = state.selectionStart;
  state.selecting = false;
  selectionBox.classList.remove("is-visible");

  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  if (width < 24 || height < 24) {
    applyPointZoom(end, 2);
    return;
  }

  const rect = slideFrame.getBoundingClientRect();
  const centerX = Math.min(start.x, end.x) + width / 2;
  const centerY = Math.min(start.y, end.y) + height / 2;
  const scale = Math.min(4.8, Math.max(1.35, Math.min(rect.width / width, rect.height / height) * 0.86));
  applyPointZoom({ x: centerX, y: centerY, rect }, scale);
}

function applyPointZoom(point, scale = 2) {
  const rect = point.rect || slideFrame.getBoundingClientRect();

  state.zoomMode = false;
  state.zoomed = true;
  state.zoomScale = scale;
  state.panX = (rect.width / 2 - point.x) * scale;
  state.panY = (rect.height / 2 - point.y) * scale;
  setStageTransform();
  document.body.classList.remove("zoom-active");
  document.body.classList.add("zoomed");
  buttons.zoom.classList.add("is-active", "is-hidden");
  buttons.resetZoom.textContent = "Desligar Zoom";
  buttons.resetZoom.title = "Desliga o zoom e limpa rabiscos";
  buttons.resetZoom.classList.remove("is-hidden");
  buttons.resetZoom.classList.add("is-danger");
}

function canInteractWithImage(event) {
  return event.button === 0 && slides[state.currentSlide].file && !state.penMode;
}

function startImageInteraction(event) {
  if (!canInteractWithImage(event)) return;

  state.imagePointerStart = {
    x: event.clientX,
    y: event.clientY,
    point: getLocalPoint(event),
    wasZoomed: state.zoomed,
  };
  state.imagePointerMoved = false;

  if (state.zoomed) {
    startPan(event);
  }
}

function updateImageInteraction(event) {
  if (!state.imagePointerStart) return;

  const distance = Math.hypot(
    event.clientX - state.imagePointerStart.x,
    event.clientY - state.imagePointerStart.y
  );

  if (distance > 6) {
    state.imagePointerMoved = true;
  }

  updatePan(event);
}

function finishImageInteraction() {
  if (!state.imagePointerStart) return;

  const interaction = state.imagePointerStart;
  const moved = state.imagePointerMoved;
  state.imagePointerStart = null;
  state.imagePointerMoved = false;

  if (!moved && interaction.wasZoomed) {
    resetZoom();
  } else if (!moved) {
    applyPointZoom(interaction.point, 2);
  }

  stopPan();
}

function cancelImageInteraction() {
  state.imagePointerStart = null;
  state.imagePointerMoved = false;
  stopPan();
}

function startPan(event) {
  if (!state.zoomed || state.penMode || event.button !== 0) return;
  state.panning = true;
  state.panStart = {
    x: event.clientX,
    y: event.clientY,
    panX: state.panX,
    panY: state.panY,
  };
  document.body.classList.add("is-panning");
}

function updatePan(event) {
  if (!state.panning || !state.panStart) return;
  state.panX = state.panStart.panX + event.clientX - state.panStart.x;
  state.panY = state.panStart.panY + event.clientY - state.panStart.y;
  setStageTransform();
}

function stopPan() {
  state.panning = false;
  state.panStart = null;
  document.body.classList.remove("is-panning");
}

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      return;
    }

    await document.exitFullscreen();
  } catch {
    alert("Seu navegador bloqueou a tela cheia. Use F11 como alternativa.");
  }
}

function syncFullscreenButton() {
  const isFullscreen = Boolean(document.fullscreenElement);
  buttons.fullscreen.textContent = isFullscreen ? "🗗" : "⛶";
  buttons.fullscreen.title = isFullscreen ? "Sair da tela cheia" : "Entrar em tela cheia";
  buttons.fullscreen.setAttribute(
    "aria-label",
    isFullscreen ? "Sair da tela cheia" : "Maximizar apresentação"
  );
  buttons.fullscreen.classList.toggle("is-active", isFullscreen);
}

function updateSelectionBox(start, end) {
  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  selectionBox.style.left = `${left}px`;
  selectionBox.style.top = `${top}px`;
  selectionBox.style.width = `${width}px`;
  selectionBox.style.height = `${height}px`;
  selectionBox.classList.add("is-visible");
}

function startDrawing(event) {
  const isRightButton = event.button === 2;
  const isLeftPenButton = state.penMode && event.button === 0;

  if ((!isRightButton && !isLeftPenButton) || !slides[state.currentSlide].file) return;

  if (isRightButton) {
    event.preventDefault();
  }

  state.drawing = true;
  const point = getLocalPoint(event);
  drawingContext.beginPath();
  drawingContext.moveTo(point.x, point.y);
}

function draw(event) {
  if (!state.drawing) return;
  const point = getLocalPoint(event);
  drawingContext.lineTo(point.x, point.y);
  drawingContext.stroke();
}

function stopDrawing() {
  state.drawing = false;
}

function updateLaserPointer(event) {
  if (!state.pointerMode) return;
  laserPointer.style.left = `${event.clientX}px`;
  laserPointer.style.top = `${event.clientY}px`;
}

function handleKeyboard(event) {
  const tag = document.activeElement?.tagName?.toLowerCase();
  if (["input", "textarea", "select"].includes(tag)) return;

  if (event.key === "ArrowRight" || event.key === " ") {
    event.preventDefault();
    nextSlide();
  }

  if (event.key === "ArrowLeft") previousSlide();
  if (event.key === "Escape") showMap();
  if (event.key.toLowerCase() === "z") toggleZoomMode();
  if (event.key.toLowerCase() === "p") togglePointerMode();
  if (event.key.toLowerCase() === "l") togglePenMode();
  if (event.key.toLowerCase() === "c") clearPenAndDisable();
  if (event.key.toLowerCase() === "f") toggleFullscreen();
}

function attachEvents() {
  startButton.addEventListener("click", () => openSlide(0));
  buttons.previous.addEventListener("click", previousSlide);
  buttons.next.addEventListener("click", nextSlide);
  buttons.map.addEventListener("click", showMap);
  buttons.zoom.addEventListener("click", toggleZoomMode);
  buttons.resetZoom.addEventListener("click", resetZoom);
  buttons.pointer.addEventListener("click", togglePointerMode);
  buttons.pen.addEventListener("click", togglePenMode);
  buttons.clear.addEventListener("click", clearPenAndDisable);
  buttons.fullscreen.addEventListener("click", toggleFullscreen);

  slideFrame.addEventListener("pointerdown", (event) => {
    slideFrame.setPointerCapture(event.pointerId);
    startImageInteraction(event);
    startDrawing(event);
  });
  slideFrame.addEventListener("pointermove", (event) => {
    updateImageInteraction(event);
    draw(event);
  });
  slideFrame.addEventListener("pointerup", () => {
    finishImageInteraction();
    stopDrawing();
  });
  slideFrame.addEventListener("pointercancel", () => {
    state.selecting = false;
    selectionBox.classList.remove("is-visible");
    cancelImageInteraction();
    stopDrawing();
  });
  slideFrame.addEventListener("contextmenu", (event) => event.preventDefault());

  document.addEventListener("mousemove", updateLaserPointer);
  document.addEventListener("keydown", handleKeyboard);
  document.addEventListener("fullscreenchange", syncFullscreenButton);
  window.addEventListener("resize", clearDrawing);
  slideImage.addEventListener("load", clearDrawing);
  slideImage.addEventListener("error", () => {
    const slide = slides[state.currentSlide];
    if (!slide.file) return;

    const nextCandidate = Number(slideImage.dataset.candidate) + 1;
    if (nextCandidate < imageCandidates(slide.file).length) {
      slideImage.dataset.candidate = String(nextCandidate);
      slideImage.src = imagePath(slide.file, nextCandidate);
      return;
    }

    slideFrame.querySelector(".missing-image")?.remove();
    slideFrame.insertAdjacentHTML(
      "beforeend",
      `<div class="missing-image">Imagem não encontrada:<br><strong>${slide.file}</strong><br><small>Coloque este arquivo em outputs ou na pasta do projeto.</small></div>`
    );
  });
}

buildMap();
renderSlide();
attachEvents();


