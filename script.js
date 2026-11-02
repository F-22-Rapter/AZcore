/**
 * ============================================================================
 * 1. MODULAR PORTFOLIO CONFIGURATION & DEVICE DETECTION
 * ============================================================================
 */
const IS_MOBILE =
  window.matchMedia("(max-width: 768px)").matches ||
  navigator.maxTouchPoints > 0 ||
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const GRID_COLS = 8;
const GRID_ROWS = 4;

const PORTFOLIO_CONFIG = {
  brandName: "AZCORE",

  // -------------------- TAB 1: ABOUT ME & RESUME CONFIG --------------------
  about: {
    name: "ALEXANDER ZHUK",
    headline: "ENGINEERING, FABRICATION & VISUAL DESIGN",
    folder: "assets/about/",
    profileImage: "profile.webp",
    resume: {
      file: "resume.pdf",
      title: "ALEXANDER_ZHUK_RESUME.PDF",
      subtitle: ""
    },
    bioParagraphs: [
      "I am a Civil Engineering student, fabricator, and photographer based in Chicago. My work sits at the intersection of structural systems, custom mechanical/electrical fabrication, and architectural & night-sky photography.",
      "Whether leading tractive battery accumulator design and thermal simulation, machining custom drivetrain mounts on a manual lathe, or capturing high-resolution panoramic astrophotography, I approach every project with precision CAD workflows and hands-on execution."
    ],
    quickSpecs: [
      { label: "DISCIPLINE", value: "Civil & Structural Engineering" },
      { label: "LOCATION", value: "IIT - Chicago, IL" },
      { label: "FOCUS", value: "CAD / CFD / Fabrication" },
      { label: "CAMERA SYSTEM", value: "Canon EOS 90D <br> Canon 17-55mm f/2.8" }
    ],
    skills: [
      {
        category: "CAD & SIMULATION",
        items: ["SolidWorks", "AutoCAD", "Revit", "Ansys Fluent CFD", "Inventor", "Blender", "Unity"]
      },
      {
        category: "FABRICATION & HARDWARE",
        items: ["Manual Lathe Machining", "Manual Mill Machining", "Li-Ion Pack Assembly", "3D Printing", "Metal Working", "Soldering"]
      },
      {
        category: "DIGITAL MEDIA",
        items: ["Lightroom Classic", "DaVinci Resolve", "Photoshop", "Microsoft 365"]
      },
      {
        category: "LANGUAGES & DEVELOPMENT",
        items: ["English", "Ukrainian", "Russian", "new-row", "Python", "C#", "MATLAB", "Javascript"]
      }
    ],
    socials: [
      { platform: "EMAIL", handle: "contact@azcore.studio", url: "mailto:contact@azcore.studio" },
      { platform: "LINKEDIN", handle: "linkedin zhuk-alex", url: "https://www.linkedin.com/in/zhuk-alex" },
      { platform: "INSTAGRAM", handle: "@az.__.gallery", url: "https://www.instagram.com/az.__.gallery/" }
    ]
  },

  // -------------------- TAB 2: PROJECTS FOLDER CONFIG --------------------
  projectsConfig: {
    baseFolder: "assets/projects/",
    textFileName: "project.txt",
    foldersToCheck: ["LARP", "fabrication", "Ansys sim aero", "Powertrain mounting", "Coin hunter", "particle sim"]
  },

  // -------------------- TAB 3: PHOTOGRAPHY FOLDER CONFIG --------------------
  photographyConfig: {
    gridColumns: 5,
    folder: "assets/photography/",
    previewSubfolder: "preview/",
    fullSubfolder: "full/",
    maxNumberedProbe: 80
  }
};

/**
 * ============================================================================
 * 2. FILE HELPERS, 2D GRID CONTROLS, CROSSHAIR CURSOR & HEIC DECODING
 * ============================================================================
 */
const verifiedUrlCache = new Map();
const heicBlobCache = new Map();

// Runtime state for the Lightbox Virtual Crosshair Cursor (always starts OFF)
const lightboxVirtualCursorState = {
  enabled: false,
  controlsActive: false,
  xRatio: 0.5,
  yRatio: 0.5,
  isDragging: false,
  isMouseDownHold: false
};

function normalizeFolder(path) {
  if (!path) return "";
  return path.endsWith("/") ? path : path + "/";
}

function getFileExtension(filename) {
  if (!filename) return "";
  const clean = filename.split("|")[0].split("?")[0].split("#")[0];
  const dot = clean.lastIndexOf(".");
  return dot !== -1 ? clean.slice(dot + 1).toLowerCase() : "";
}

function splitAssetTokenAndThumb(rawToken) {
  const parts = String(rawToken || "").split("|thumb=");
  return {
    baseToken: parts[0].trim(),
    thumbFile: parts[1] ? parts[1].trim() : ""
  };
}

function extractItchEmbedUrl(rawInput) {
  if (!rawInput) return "";
  const { baseToken } = splitAssetTokenAndThumb(rawInput);
  const trimmed = baseToken.trim().replace(/^itch\s*:\s*/i, "").trim();
  const iframeSrcMatch = trimmed.match(/src\s*=\s*["']([^"']+)["']/i);
  let url = iframeSrcMatch && iframeSrcMatch[1] ? iframeSrcMatch[1].trim() : trimmed;

  if (/^\/\//.test(url)) url = "https:" + url;
  if (!/^https?:\/\//i.test(url) && url.includes("itch.io")) {
    url = "https://" + url;
  }
  return url;
}

function normalizeExternalUrl(rawUrl) {
  if (!rawUrl) return "#";
  const { baseToken } = splitAssetTokenAndThumb(rawUrl);
  const cleaned = baseToken.trim().replace(/^(run|link|url)\s*:\s*/i, "").trim();
  if (/^(https?:\/\/|mailto:|tel:|\/|\.)/i.test(cleaned)) return cleaned;
  return "https://" + cleaned;
}

function getFallbackRunSvgDataUri() {
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
      <rect width="800" height="500" fill="#14181c"/>
      <g stroke="rgba(255,255,255,0.06)" stroke-width="1">
        <line x1="0" y1="100" x2="800" y2="100"/><line x1="0" y1="200" x2="800" y2="200"/>
        <line x1="0" y1="300" x2="800" y2="300"/><line x1="0" y1="400" x2="800" y2="400"/>
        <line x1="160" y1="0" x2="160" y2="500"/><line x1="320" y1="0" x2="320" y2="500"/>
        <line x1="480" y1="0" x2="480" y2="500"/><line x1="640" y1="0" x2="640" y2="500"/>
      </g>
      <line x1="0" y1="250" x2="800" y2="250" stroke="rgba(217,40,4,0.35)" stroke-width="1" stroke-dasharray="6,6"/>
      <line x1="400" y1="0" x2="400" y2="500" stroke="rgba(217,40,4,0.35)" stroke-width="1" stroke-dasharray="6,6"/>
      <text x="28" y="468" fill="#9aa4ae" font-family="monospace" font-size="15">LAUNCH APPLICATION</text>
    </svg>`
  )}`;
}

function getAssetType(filename) {
  if (!filename) return "file";
  const { baseToken } = splitAssetTokenAndThumb(filename);
  const trimmed = baseToken.trim();
  if (/^(app|embed)\s*:/i.test(trimmed)) {
    return "itch";
  }
  if (/^itch\s*:/i.test(trimmed) || /<iframe/i.test(trimmed) || /itch\.io\/embed/i.test(trimmed)) {
    return "itch";
  }
  if (/^(run|link|url)\s*:/i.test(trimmed)) {
    return "link";
  }
  const ext = getFileExtension(trimmed);
  if (["html", "htm"].includes(ext)) return "itch";
  if (["glb", "gltf"].includes(ext)) return "glb";
  if (ext === "stl") return "stl";
  if (["mp4", "webm", "mov", "m4v", "ogg", "ogv", "mkv", "avi"].includes(ext)) return "video";
  if (["mp3", "wav", "m4a", "flac", "aac"].includes(ext)) return "audio";
  if (ext === "pdf") return "pdf";
  if (["heic", "heif"].includes(ext)) return "heic";
  if (["jpg", "jpeg", "png", "webp", "gif", "bmp", "svg", "avif"].includes(ext)) return "image";
  return "file";
}

function is3DAsset(type) {
  return type === "glb" || type === "stl";
}

function isImageAsset(type) {
  return type === "image" || type === "heic";
}

async function loadImageSourceWithHeicSupport(url) {
  if (!/\.heic$|\.heif$/i.test(url)) return url;
  if (heicBlobCache.has(url)) return heicBlobCache.get(url);

  if (typeof heic2any === "undefined") return url;
  const res = await fetch(url);
  const blob = await res.blob();
  const converted = await heic2any({ blob, toType: "image/jpeg", quality: 0.88 });
  const finalBlob = Array.isArray(converted) ? converted[0] : converted;
  const objectUrl = URL.createObjectURL(finalBlob);
  heicBlobCache.set(url, objectUrl);
  return objectUrl;
}

/**
 * Maps control tokens to key specs or virtual crosshair cursor / click actions
 */
function resolveKeySpec(rawToken) {
  const upper = String(rawToken || "").trim().toUpperCase();
  const map = {
    CURSOR: { tokenName: "CURSOR", label: "CURSOR", key: "__CURSOR__", code: "VirtualCursor", keyCode: 0, isCursorToggle: true },
    MOUSE: { tokenName: "CURSOR", label: "CURSOR", key: "__CURSOR__", code: "VirtualCursor", keyCode: 0, isCursorToggle: true },
    POINTER: { tokenName: "CURSOR", label: "CURSOR", key: "__CURSOR__", code: "VirtualCursor", keyCode: 0, isCursorToggle: true },
    CLICK: { tokenName: "CLICK", label: "L-CLICK", key: "__CLICK__", code: "MouseLeft", keyCode: 1, isMouseClick: true },
    LMB: { tokenName: "CLICK", label: "L-CLICK", key: "__CLICK__", code: "MouseLeft", keyCode: 1, isMouseClick: true },
    SPACE: { tokenName: "SPACE", label: "SPACE", key: " ", code: "Space", keyCode: 32 },
    SPACEBAR: { tokenName: "SPACE", label: "SPACE", key: " ", code: "Space", keyCode: 32 },
    UP: { tokenName: "UP", label: "↑", key: "ArrowUp", code: "ArrowUp", keyCode: 38 },
    ARROWUP: { tokenName: "UP", label: "↑", key: "ArrowUp", code: "ArrowUp", keyCode: 38 },
    "↑": { tokenName: "UP", label: "↑", key: "ArrowUp", code: "ArrowUp", keyCode: 38 },
    DOWN: { tokenName: "DOWN", label: "↓", key: "ArrowDown", code: "ArrowDown", keyCode: 40 },
    ARROWDOWN: { tokenName: "DOWN", label: "↓", key: "ArrowDown", code: "ArrowDown", keyCode: 40 },
    "↓": { tokenName: "DOWN", label: "↓", key: "ArrowDown", code: "ArrowDown", keyCode: 40 },
    LEFT: { tokenName: "LEFT", label: "←", key: "ArrowLeft", code: "ArrowLeft", keyCode: 37 },
    ARROWLEFT: { tokenName: "LEFT", label: "←", key: "ArrowLeft", code: "ArrowLeft", keyCode: 37 },
    "←": { tokenName: "LEFT", label: "←", key: "ArrowLeft", code: "ArrowLeft", keyCode: 37 },
    RIGHT: { tokenName: "RIGHT", label: "→", key: "ArrowRight", code: "ArrowRight", keyCode: 39 },
    ARROWRIGHT: { tokenName: "RIGHT", label: "→", key: "ArrowRight", code: "ArrowRight", keyCode: 39 },
    "→": { tokenName: "RIGHT", label: "→", key: "ArrowRight", code: "ArrowRight", keyCode: 39 },
    SHIFT: { tokenName: "SHIFT", label: "SHIFT", key: "Shift", code: "ShiftLeft", keyCode: 16 },
    CTRL: { tokenName: "CTRL", label: "CTRL", key: "Control", code: "ControlLeft", keyCode: 17 },
    CONTROL: { tokenName: "CTRL", label: "CTRL", key: "Control", code: "ControlLeft", keyCode: 17 },
    ALT: { tokenName: "ALT", label: "ALT", key: "Alt", code: "AltLeft", keyCode: 18 },
    ENTER: { tokenName: "ENTER", label: "ENTER", key: "Enter", code: "Enter", keyCode: 13 },
    TAB: { tokenName: "TAB", label: "TAB", key: "Tab", code: "Tab", keyCode: 9 },
    ESC: { tokenName: "ESC", label: "ESC", key: "Escape", code: "Escape", keyCode: 27 },
    ESCAPE: { tokenName: "ESC", label: "ESC", key: "Escape", code: "Escape", keyCode: 27 }
  };

  if (map[upper]) return map[upper];

  if (upper.length === 1) {
    const codeNum = upper.charCodeAt(0);
    const isDigit = /[0-9]/.test(upper);
    return {
      tokenName: upper,
      label: upper,
      key: upper.toLowerCase(),
      code: isDigit ? `Digit${upper}` : `Key${upper}`,
      keyCode: codeNum
    };
  }

  return {
    tokenName: upper,
    label: upper,
    key: rawToken.trim(),
    code: upper,
    keyCode: 0
  };
}

/**
 * Expands CONTROLS strings including optional @col:row 2D grid coordinates
 */
function expandVirtualKeysList(keysString) {
  if (!keysString || !keysString.trim()) return [];
  const entries = keysString
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const rawButtons = [];

  entries.forEach((entry) => {
    let coordCol = null;
    let coordRow = null;
    let cleanEntry = entry;

    const coordMatch = entry.match(/@(\d+)\s*[:x,]\s*(\d+)$/i);
    if (coordMatch) {
      coordCol = Math.max(0, Math.min(GRID_COLS - 1, parseInt(coordMatch[1], 10)));
      coordRow = Math.max(0, Math.min(GRID_ROWS - 1, parseInt(coordMatch[2], 10)));
      cleanEntry = entry.slice(0, coordMatch.index).trim();
    }

    const parts = cleanEntry.split(":");
    const rawKeyPart = parts[0].trim();
    const actionDesc = parts.length >= 2 ? parts.slice(1).join(":").trim() : "";
    const upperKey = rawKeyPart.toUpperCase().replace(/\s+/g, "");

    if (upperKey === "WASD") {
      const wasdDefaults = [
        { ch: "W", c: 2, r: 0 },
        { ch: "A", c: 1, r: 1 },
        { ch: "S", c: 2, r: 1 },
        { ch: "D", c: 3, r: 1 }
      ];
      wasdDefaults.forEach((item) => {
        rawButtons.push({
          ...resolveKeySpec(item.ch),
          desc: actionDesc || "Move",
          col: item.c,
          row: item.r
        });
      });
    } else if (upperKey === "ARROWS" || upperKey === "ARROWKEYS") {
      const arrowDefaults = [
        { dir: "UP", c: 2, r: 0 },
        { dir: "LEFT", c: 1, r: 1 },
        { dir: "DOWN", c: 2, r: 1 },
        { dir: "RIGHT", c: 3, r: 1 }
      ];
      arrowDefaults.forEach((item) => {
        rawButtons.push({
          ...resolveKeySpec(item.dir),
          desc: actionDesc || "Move",
          col: item.c,
          row: item.r
        });
      });
    } else if (rawKeyPart.includes("/")) {
      rawKeyPart
        .split("/")
        .map((k) => k.trim())
        .filter(Boolean)
        .forEach((k) => {
          rawButtons.push({ ...resolveKeySpec(k), desc: actionDesc, col: null, row: null });
        });
    } else {
      rawButtons.push({
        ...resolveKeySpec(rawKeyPart),
        desc: actionDesc,
        col: coordCol,
        row: coordRow
      });
    }
  });

  // Assign non-colliding grid slots for any keys without explicit @col:row
  const occupied = new Set();
  rawButtons.forEach((b) => {
    if (b.col !== null && b.row !== null) {
      occupied.add(`${b.col}:${b.row}`);
    }
  });

  let nextCol = 0;
  let nextRow = 0;
  rawButtons.forEach((b) => {
    if (b.col === null || b.row === null) {
      while (occupied.has(`${nextCol}:${nextRow}`)) {
        nextCol++;
        if (nextCol >= GRID_COLS) {
          nextCol = 0;
          nextRow = Math.min(GRID_ROWS - 1, nextRow + 1);
        }
      }
      b.col = nextCol;
      b.row = nextRow;
      occupied.add(`${b.col}:${b.row}`);
    }
  });

  return rawButtons;
}

/**
 * Dispatches virtual crosshair cursor coordinate events directly into iframe games
 */


function setLightboxIframeVirtualCursorFlag(isActive) {
  const frame = document.getElementById("lightbox-itch-frame");
  if (!frame || !frame.contentWindow) return;
  try {
    frame.contentWindow.__azcoreVirtualCursorActive = Boolean(isActive);
  } catch (e) {}
}

function installRealMouseBlockerInLightboxIframe() {
  const frame = document.getElementById("lightbox-itch-frame");
  if (!frame || !frame.contentDocument) return;
  try {
    const doc = frame.contentDocument;
    if (doc.__azcoreMousePrioritizerInstalled) return;
    doc.__azcoreMousePrioritizerInstalled = true;

    const blockRealPointerIfVirtualActive = (e) => {
      if (
        lightboxVirtualCursorState.controlsActive &&
        lightboxVirtualCursorState.enabled &&
        !e.__azcoreSynthetic &&
        e.isTrusted
      ) {
        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();
      }
    };

    ["mousemove", "pointermove", "mousedown", "mouseup", "touchstart", "touchmove", "touchend"].forEach(
      (evtName) => {
        doc.addEventListener(evtName, blockRealPointerIfVirtualActive, true);
      }
    );
  } catch (e) {}
}
/**
 * Dispatches virtual crosshair cursor coordinate events directly into iframe games
 */
function dispatchVirtualCursorToLightboxIframe(xRatio, yRatio, eventType = "mousemove", isPressed = false) {
  const frame = document.getElementById("lightbox-itch-frame");
  if (!frame || !frame.contentWindow) return;
  try {
    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    const target = (doc && (doc.querySelector("canvas") || doc.body || doc.documentElement)) || null;
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const targetW = rect.width || frame.clientWidth || 800;
    const targetH = rect.height || frame.clientHeight || 600;

    // Exact pixel inside the canvas/iframe corresponding to the center of the '+'
    const clientX = rect.left + xRatio * targetW;
    const clientY = rect.top + yRatio * targetH;
    const offsetX = xRatio * targetW;
    const offsetY = yRatio * targetH;

    win.__azcoreVirtualCursorActive = true;
    if (typeof win.mouseX === "number") win.mouseX = offsetX;
    if (typeof win.mouseY === "number") win.mouseY = offsetY;
    if (typeof win.pmouseX === "number") win.pmouseX = offsetX;
    if (typeof win.pmouseY === "number") win.pmouseY = offsetY;
    if (eventType === "mousedown") win.mouseIsPressed = true;
    if (eventType === "mouseup") win.mouseIsPressed = false;

    const mouseInit = {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: win,
      clientX,
      clientY,
      screenX: clientX,
      screenY: clientY,
      button: 0,
      buttons: isPressed ? 1 : 0
    };

    const mEvt = new MouseEvent(eventType, mouseInit);
    mEvt.__azcoreSynthetic = true;
    target.dispatchEvent(mEvt);
    doc.dispatchEvent(mEvt);
    win.dispatchEvent(mEvt);

    if (typeof PointerEvent !== "undefined") {
      const pType =
        eventType === "mousedown"
          ? "pointerdown"
          : eventType === "mouseup"
          ? "pointerup"
          : "pointermove";
      const pEvt = new PointerEvent(pType, {
        ...mouseInit,
        pointerId: 1,
        pointerType: "mouse",
        isPrimary: true
      });
      pEvt.__azcoreSynthetic = true;
      target.dispatchEvent(pEvt);
    }
  } catch (e) {}
}

function updateLightboxVirtualCursorVisibilityAndPosition() {
  const cursorEl = document.getElementById("lightbox-virtual-cursor");
  const stageWrap = document.getElementById("lightbox-content-wrapper");
  const frame = document.getElementById("lightbox-itch-frame");
  if (!cursorEl || !stageWrap) return;

  const active = Boolean(lightboxVirtualCursorState.controlsActive && lightboxVirtualCursorState.enabled);
  cursorEl.style.display = active ? "flex" : "none";
  stageWrap.classList.toggle("virtual-cursor-priority", active);
  setLightboxIframeVirtualCursorFlag(active);

  const pop = document.getElementById("lightbox-keys-popover");
  if (pop) {
    const toggleBtn = pop.querySelector('.virtual-key-btn[data-cursor-toggle="true"]');
    if (toggleBtn) toggleBtn.classList.toggle("pressed", active);
  }

  if (active) {
    // Measure directly against the iframe so the top caption bar never offsets the '+'
    const wrapRect = stageWrap.getBoundingClientRect();
    const frameRect =
      frame && frame.style.display !== "none" ? frame.getBoundingClientRect() : wrapRect;

    const frameOffsetLeft = frameRect.left - wrapRect.left;
    const frameOffsetTop = frameRect.top - wrapRect.top;
    const w = frameRect.width || stageWrap.clientWidth || 800;
    const h = frameRect.height || stageWrap.clientHeight || 600;

    const px = frameOffsetLeft + lightboxVirtualCursorState.xRatio * w;
    const py = frameOffsetTop + lightboxVirtualCursorState.yRatio * h;

    cursorEl.style.left = `${px}px`;
    cursorEl.style.top = `${py}px`;

    installRealMouseBlockerInLightboxIframe();
    dispatchVirtualCursorToLightboxIframe(
      lightboxVirtualCursorState.xRatio,
      lightboxVirtualCursorState.yRatio,
      "mousemove",
      lightboxVirtualCursorState.isMouseDownHold
    );
  }
}

function setupLightboxVirtualCursorDrag() {
  const cursorEl = document.getElementById("lightbox-virtual-cursor");
  const stageWrap = document.getElementById("lightbox-content-wrapper");
  const frame = document.getElementById("lightbox-itch-frame");
  if (!cursorEl || !stageWrap || cursorEl.dataset.bound === "true") return;
  cursorEl.dataset.bound = "true";

  let startX = 0;
  let startY = 0;
  let grabOffsetX = 0;
  let grabOffsetY = 0;
  let moved = false;

  const onPointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    lightboxVirtualCursorState.isDragging = true;
    moved = false;
    const pt = e.touches ? e.touches[0] : e;
    startX = pt.clientX;
    startY = pt.clientY;

    // Preserve where on the crosshair you grabbed so the center of '+' never jumps
    const cursorRect = cursorEl.getBoundingClientRect();
    const cursorCenterX = cursorRect.left + cursorRect.width / 2;
    const cursorCenterY = cursorRect.top + cursorRect.height / 2;
    grabOffsetX = pt.clientX - cursorCenterX;
    grabOffsetY = pt.clientY - cursorCenterY;

    cursorEl.classList.add("dragging");
  };

  const onPointerMove = (e) => {
    if (!lightboxVirtualCursorState.isDragging) return;
    e.preventDefault();
    const pt = e.touches ? e.touches[0] : e;
    if (Math.hypot(pt.clientX - startX, pt.clientY - startY) > 5) {
      moved = true;
    }

    const rect =
      frame && frame.style.display !== "none"
        ? frame.getBoundingClientRect()
        : stageWrap.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const exactCenterX = pt.clientX - grabOffsetX;
    const exactCenterY = pt.clientY - grabOffsetY;

    lightboxVirtualCursorState.xRatio = Math.max(0, Math.min(1, (exactCenterX - rect.left) / rect.width));
    lightboxVirtualCursorState.yRatio = Math.max(0, Math.min(1, (exactCenterY - rect.top) / rect.height));
    updateLightboxVirtualCursorVisibilityAndPosition();
  };

  const onPointerUp = (e) => {
    if (!lightboxVirtualCursorState.isDragging) return;
    e.preventDefault();
    lightboxVirtualCursorState.isDragging = false;
    cursorEl.classList.remove("dragging");

    if (!moved) {
      cursorEl.classList.add("clicking");
      setTimeout(() => cursorEl.classList.remove("clicking"), 150);
      dispatchVirtualCursorToLightboxIframe(lightboxVirtualCursorState.xRatio, lightboxVirtualCursorState.yRatio, "mousedown", true);
      dispatchVirtualCursorToLightboxIframe(lightboxVirtualCursorState.xRatio, lightboxVirtualCursorState.yRatio, "mouseup", false);
      dispatchVirtualCursorToLightboxIframe(lightboxVirtualCursorState.xRatio, lightboxVirtualCursorState.yRatio, "click", false);
    }
  };

  cursorEl.addEventListener("mousedown", onPointerDown);
  cursorEl.addEventListener("touchstart", onPointerDown, { passive: false });
  window.addEventListener("mousemove", onPointerMove, { passive: false });
  window.addEventListener("touchmove", onPointerMove, { passive: false });
  window.addEventListener("mouseup", onPointerUp);
  window.addEventListener("touchend", onPointerUp);
}

/**
 * Makes any Controls HUD Popover box freely draggable via its header bar
 */
function makeHudPopoverDraggable(popoverEl) {
  if (!popoverEl || popoverEl.dataset.dragBound === "true") return;
  popoverEl.dataset.dragBound = "true";

  let isDraggingHud = false;
  let offsetX = 0;
  let offsetY = 0;

  const onStart = (e) => {
    const handle = e.target.closest(".keys-hud-drag-handle");
    if (!handle) return;
    e.preventDefault();
    e.stopPropagation();
    isDraggingHud = true;

    const rect = popoverEl.getBoundingClientRect();
    const parentRect = popoverEl.offsetParent
      ? popoverEl.offsetParent.getBoundingClientRect()
      : { left: 0, top: 0 };
    const pt = e.touches ? e.touches[0] : e;

    popoverEl.style.left = `${rect.left - parentRect.left}px`;
    popoverEl.style.top = `${rect.top - parentRect.top}px`;
    popoverEl.style.bottom = "auto";
    popoverEl.style.transform = "none";

    offsetX = pt.clientX - rect.left;
    offsetY = pt.clientY - rect.top;
  };

  const onMove = (e) => {
    if (!isDraggingHud) return;
    e.preventDefault();
    const pt = e.touches ? e.touches[0] : e;
    const parentRect = popoverEl.offsetParent
      ? popoverEl.offsetParent.getBoundingClientRect()
      : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };

    let newLeft = pt.clientX - parentRect.left - offsetX;
    let newTop = pt.clientY - parentRect.top - offsetY;

    newLeft = Math.max(4, Math.min(parentRect.width - popoverEl.offsetWidth - 4, newLeft));
    newTop = Math.max(4, Math.min(parentRect.height - popoverEl.offsetHeight - 4, newTop));

    popoverEl.style.left = `${Math.round(newLeft)}px`;
    popoverEl.style.top = `${Math.round(newTop)}px`;
  };

  const onEnd = () => {
    isDraggingHud = false;
  };

  popoverEl.addEventListener("mousedown", onStart);
  popoverEl.addEventListener("touchstart", onStart, { passive: false });
  window.addEventListener("mousemove", onMove, { passive: false });
  window.addEventListener("touchmove", onMove, { passive: false });
  window.addEventListener("mouseup", onEnd);
  window.addEventListener("touchend", onEnd);
}

function triggerSyntheticKeyEvent(eventType, spec) {
  const eventInit = {
    key: spec.key,
    code: spec.code,
    keyCode: spec.keyCode,
    which: spec.keyCode,
    bubbles: true,
    cancelable: true,
    composed: true
  };

  const createEvt = () => {
    const ev = new KeyboardEvent(eventType, eventInit);
    try {
      Object.defineProperty(ev, "keyCode", { get: () => spec.keyCode });
      Object.defineProperty(ev, "which", { get: () => spec.keyCode });
    } catch (e) {}
    return ev;
  };

  window.dispatchEvent(createEvt());
  document.dispatchEvent(createEvt());

  const iframes = document.querySelectorAll("#lightbox-itch-frame, #dev-fs-iframe, iframe");
  iframes.forEach((frame) => {
    if (!frame || frame.style.display === "none") return;

    try {
      frame.focus();
      if (frame.contentWindow) {
        frame.contentWindow.focus();
        frame.contentWindow.dispatchEvent(createEvt());
      }
      if (frame.contentDocument) {
        frame.contentDocument.dispatchEvent(createEvt());
        const canvas = frame.contentDocument.querySelector("canvas");
        if (canvas) canvas.dispatchEvent(createEvt());
      }
    } catch (e) {}

    try {
      if (frame.contentWindow) {
        frame.contentWindow.postMessage(
          {
            type: "AZCORE_KEY_EVENT",
            eventType,
            key: spec.key,
            code: spec.code,
            keyCode: spec.keyCode
          },
          "*"
        );
      }
    } catch (e) {}
  });
}

function buildKeysHudContentHtml(keysString) {
  const buttons = expandVirtualKeysList(keysString);
  if (buttons.length === 0) return "";

  const minCol = Math.min(...buttons.map((b) => b.col));
  const maxCol = Math.max(...buttons.map((b) => b.col));
  const minRow = Math.min(...buttons.map((b) => b.row));
  const maxRow = Math.max(...buttons.map((b) => b.row));
  const colSpan = Math.max(1, maxCol - minCol + 1);
  const rowSpan = Math.max(1, maxRow - minRow + 1);

  return `
    <div class="keys-hud-title keys-hud-drag-handle" title="Drag to reposition controls">
      <span>&#9783; DRAG PAD</span>
      <span>TAP / HOLD KEYS</span>
    </div>
    <div class="keys-pad-grid" style="grid-template-columns: repeat(${colSpan}, minmax(54px, auto)); grid-template-rows: repeat(${rowSpan}, 50px);">
      ${buttons
        .map(
          (b) => `
        <div
          role="button"
          tabindex="-1"
          class="virtual-key-btn ${b.isCursorToggle ? "vkey-cursor-toggle" : ""}"
          style="grid-column: ${b.col - minCol + 1}; grid-row: ${b.row - minRow + 1};"
          data-key="${b.key}"
          data-code="${b.code}"
          data-keycode="${b.keyCode}"
          data-cursor-toggle="${b.isCursorToggle ? "true" : "false"}"
          data-mouse-click="${b.isMouseClick ? "true" : "false"}"
        >
          <span class="vkey-main">${b.isCursorToggle ? "+ " + b.label : b.label}</span>
          ${b.desc ? `<span class="vkey-sub">${b.desc}</span>` : ""}
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

function bindInteractiveVirtualKeys(containerEl) {
  if (!containerEl) return;
  makeHudPopoverDraggable(containerEl);

  containerEl.addEventListener("mousedown", (e) => {
    if (!e.target.closest(".keys-hud-drag-handle")) e.preventDefault();
  });
  containerEl.addEventListener(
    "touchstart",
    (e) => {
      if (!e.target.closest(".keys-hud-drag-handle")) e.preventDefault();
    },
    { passive: false }
  );

  const btns = containerEl.querySelectorAll(".virtual-key-btn");

  btns.forEach((btn) => {
    if (btn.dataset.bound === "true") return;
    btn.dataset.bound = "true";

    const isCursorToggle = btn.dataset.cursorToggle === "true";
    const isMouseClick = btn.dataset.mouseClick === "true";

    if (isCursorToggle) {
      const toggleCursor = (e) => {
        e.preventDefault();
        e.stopPropagation();
        lightboxVirtualCursorState.enabled = !lightboxVirtualCursorState.enabled;
        updateLightboxVirtualCursorVisibilityAndPosition();
      };
      btn.addEventListener("mousedown", toggleCursor);
      btn.addEventListener("touchstart", toggleCursor, { passive: false });
      return;
    }

    if (isMouseClick) {
      const downClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.add("pressed");
        lightboxVirtualCursorState.isMouseDownHold = true;
        dispatchVirtualCursorToLightboxIframe(
          lightboxVirtualCursorState.xRatio,
          lightboxVirtualCursorState.yRatio,
          "mousedown",
          true
        );
      };
      const upClick = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (!btn.classList.contains("pressed")) return;
        btn.classList.remove("pressed");
        lightboxVirtualCursorState.isMouseDownHold = false;
        dispatchVirtualCursorToLightboxIframe(
          lightboxVirtualCursorState.xRatio,
          lightboxVirtualCursorState.yRatio,
          "mouseup",
          false
        );
        dispatchVirtualCursorToLightboxIframe(
          lightboxVirtualCursorState.xRatio,
          lightboxVirtualCursorState.yRatio,
          "click",
          false
        );
      };
      btn.addEventListener("mousedown", downClick);
      btn.addEventListener("touchstart", downClick, { passive: false });
      btn.addEventListener("mouseup", upClick);
      btn.addEventListener("mouseleave", upClick);
      btn.addEventListener("touchend", upClick);
      return;
    }

    const spec = {
      key: btn.dataset.key || "",
      code: btn.dataset.code || "",
      keyCode: Number(btn.dataset.keycode || 0)
    };

    let repeatTimer = null;

    const startPress = (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.add("pressed");
      triggerSyntheticKeyEvent("keydown", spec);

      if (repeatTimer) clearInterval(repeatTimer);
      repeatTimer = setInterval(() => {
        triggerSyntheticKeyEvent("keydown", spec);
      }, 65);
    };

    const endPress = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (!btn.classList.contains("pressed")) return;
      btn.classList.remove("pressed");
      if (repeatTimer) {
        clearInterval(repeatTimer);
        repeatTimer = null;
      }
      triggerSyntheticKeyEvent("keyup", spec);
    };

    btn.addEventListener("mousedown", startPress);
    btn.addEventListener("touchstart", startPress, { passive: false });
    btn.addEventListener("mouseup", endPress);
    btn.addEventListener("mouseleave", endPress);
    btn.addEventListener("touchend", endPress);
    btn.addEventListener("touchcancel", endPress);
    btn.addEventListener("contextmenu", (e) => e.preventDefault());
  });
}

function attachKeysOverlayIfPresent(containerEl, keysString) {
  if (!keysString || !keysString.trim()) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "keys-trigger-badge";
  btn.innerHTML = "&#9000; CONTROLS";

  const popover = document.createElement("div");
  popover.className = "keys-hud-popover";
  popover.style.display = "none";
  popover.innerHTML = buildKeysHudContentHtml(keysString);
  bindInteractiveVirtualKeys(popover);

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isVisible = popover.style.display === "block";
    popover.style.display = isVisible ? "none" : "block";
  });

  popover.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  containerEl.appendChild(btn);
  containerEl.appendChild(popover);
}

function createRunLinkCard(asset, projectKeys = "", isStackItem = false) {
  const outer = document.createElement("div");
  outer.className = "run-card-outer-wrap" + (isStackItem ? " stack-run-only" : "");

  const linkEl = document.createElement("a");
  linkEl.className = "run-link-card";
  linkEl.href = asset.targetUrl;
  linkEl.target = "_blank";
  linkEl.rel = "noopener noreferrer";
  linkEl.title = `Launch ${asset.targetUrl}`;

  const img = document.createElement("img");
  img.className = "run-base-img";
  img.loading = "lazy";
  img.decoding = "async";
  img.alt = "Run Application";

  loadImageSourceWithHeicSupport(asset.previewSrc).then((url) => {
    img.src = url;
  });

  const overlay = document.createElement("div");
  overlay.className = "run-overlay";
  overlay.innerHTML = `
    <div class="run-btn-pill">
      <span class="run-btn-icon">&#9654;</span>
      <span class="run-btn-label">Run</span>
    </div>
  `;

  linkEl.appendChild(img);
  if (!isStackItem) {
    const badge = document.createElement("div");
    badge.className = "stl-badge-overlay";
    badge.innerHTML = "WEB APPLICATION // CLICK TO LAUNCH &#8599;";
    linkEl.appendChild(badge);
  }
  linkEl.appendChild(overlay);

  linkEl.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  outer.appendChild(linkEl);
  if (!isStackItem) {
    attachKeysOverlayIfPresent(outer, projectKeys);
  }
  return outer;
}

function createItchEmbedCard(asset, onOpenLightboxModal, projectKeys = "", isStackItem = false) {
  const outer = document.createElement("div");
  outer.className = "run-card-outer-wrap" + (isStackItem ? " stack-run-only" : "");

  const card = document.createElement("div");
  card.className = "run-link-card";
  card.title = "Click Run to launch";

  const bgImg = document.createElement("img");
  bgImg.className = "run-base-img";
  bgImg.loading = "lazy";
  bgImg.decoding = "async";
  bgImg.alt = "Run Application";

  const thumbToLoad = asset.previewSrc || getFallbackRunSvgDataUri();
  loadImageSourceWithHeicSupport(thumbToLoad).then((url) => {
    bgImg.src = url;
  });

  const overlay = document.createElement("div");
  overlay.className = "run-overlay";
  overlay.innerHTML = `
    <div class="run-btn-pill">
      <span class="run-btn-icon">&#9654;</span>
      <span class="run-btn-label">Run</span>
    </div>
  `;

  card.appendChild(bgImg);
  if (!isStackItem) {
    const badge = document.createElement("div");
    badge.className = "stl-badge-overlay";
    badge.textContent = "INTERACTIVE APPLICATION // CLICK RUN TO LAUNCH";
    card.appendChild(badge);
  }
  card.appendChild(overlay);

  card.addEventListener("click", (e) => {
    e.stopPropagation();
    if (onOpenLightboxModal) onOpenLightboxModal();
  });

  outer.appendChild(card);
  if (!isStackItem) {
    attachKeysOverlayIfPresent(outer, projectKeys);
  }
  return outer;
}

function createUniversalAssetCard(asset) {
  const ext = getFileExtension(asset.file).toUpperCase() || "FILE";
  const wrap = document.createElement("div");
  wrap.className = "universal-asset-card";

  let badgeText = `${ext} // CLICK TO VIEW`;
  let centerIcon = `.${ext}`;

  if (asset.type === "video") {
    badgeText = `VIDEO (${ext}) // CLICK TO STREAM`;
    centerIcon = "&#9654;";
  } else if (asset.type === "audio") {
    badgeText = `AUDIO (${ext}) // CLICK TO PLAY`;
    centerIcon = "&#9835;";
  } else if (asset.type === "pdf") {
    badgeText = "PDF DOCUMENT // CLICK TO VIEW";
    centerIcon = "PDF";
  }

  wrap.innerHTML = `
    <div class="stl-badge-overlay">${badgeText}</div>
    <div class="universal-asset-icon">${centerIcon}</div>
    <div class="universal-asset-label">${asset.file}</div>
  `;
  return wrap;
}

async function runInBatches(items, batchSize, asyncFn) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(asyncFn));
    results.push(...batchResults);
  }
  return results;
}

async function verifyFileExistsFast(url) {
  if (verifiedUrlCache.has(url)) return verifiedUrlCache.get(url);
  try {
    const res = await fetch(url, { method: "HEAD", cache: "default" });
    if (!res.ok) {
      verifiedUrlCache.set(url, false);
      return false;
    }
    const contentType = res.headers.get("content-type") || "";
    const isHtmlFileRequest = /\.html?(\?|$)/i.test(url);
    const isValid = isHtmlFileRequest ? true : !contentType.includes("text/html");
    verifiedUrlCache.set(url, isValid);
    return isValid;
  } catch (e) {
    verifiedUrlCache.set(url, false);
    return false;
  }
}

async function resolveValidUrlWithCaseFallback(baseFolder, fileName) {
  if (!fileName) return null;
  const primary = `${baseFolder}${fileName}`;
  if (await verifyFileExistsFast(primary)) return primary;

  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex !== -1) {
    const namePart = fileName.slice(0, dotIndex);
    const extPart = fileName.slice(dotIndex);
    const toggledExt =
      extPart === extPart.toUpperCase() ? extPart.toLowerCase() : extPart.toUpperCase();
    const altUrl = `${baseFolder}${namePart}${toggledExt}`;
    if (await verifyFileExistsFast(altUrl)) return altUrl;
  }
  return null;
}

async function resolveDualImageUrls(baseFolder, previewSub, fullSub, fileName) {
  const normBase = normalizeFolder(baseFolder);
  const normPrev = normalizeFolder(previewSub);
  const normFull = normalizeFolder(fullSub);

  const dotIdx = fileName.lastIndexOf(".");
  const baseName = dotIdx !== -1 ? fileName.slice(0, dotIdx) : fileName;
  const originalExt = dotIdx !== -1 ? fileName.slice(dotIdx) : ".webp";

  const previewExts = [...new Set([".webp", originalExt, ".jpg", ".JPG", ".png", ".heic", ".HEIC"])];
  let previewUrl = null;
  for (const ext of previewExts) {
    const candidate = `${normBase}${normPrev}${baseName}${ext}`;
    if (await verifyFileExistsFast(candidate)) {
      previewUrl = candidate;
      break;
    }
  }

  const fullExts = [...new Set([".jpg", ".JPG", ".jpeg", originalExt, ".png", ".webp", ".heic", ".HEIC"])];
  let fullUrl = null;
  for (const ext of fullExts) {
    const candidate = `${normBase}${normFull}${baseName}${ext}`;
    if (await verifyFileExistsFast(candidate)) {
      fullUrl = candidate;
      break;
    }
  }

  if (!previewUrl && !fullUrl) {
    const directUrl = await resolveValidUrlWithCaseFallback(normBase, fileName);
    if (!directUrl) return null;
    return { previewUrl: directUrl, fullUrl: directUrl };
  }

  return {
    previewUrl: previewUrl || fullUrl,
    fullUrl: fullUrl || previewUrl
  };
}

/**
 * ============================================================================
 * 3. UNIFIED 3D ENGINE
 * ============================================================================
 */
const modelCache = new Map();
let sharedDracoLoader = null;

function getSharedDracoLoader() {
  if (!sharedDracoLoader && typeof THREE !== "undefined" && THREE.DRACOLoader) {
    sharedDracoLoader = new THREE.DRACOLoader();
    sharedDracoLoader.setDecoderPath(
      "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/"
    );
  }
  return sharedDracoLoader;
}

function load3DModelObject(url, type) {
  if (modelCache.has(url)) {
    return Promise.resolve(modelCache.get(url).clone(true));
  }

  return new Promise((resolve, reject) => {
    if (type === "glb") {
      if (typeof THREE === "undefined" || !THREE.GLTFLoader) {
        reject(new Error("THREE loaders missing"));
        return;
      }

      const loader = new THREE.GLTFLoader();
      const draco = getSharedDracoLoader();
      if (draco) loader.setDRACOLoader(draco);

      loader.load(
        url,
        (gltf) => {
          const root = gltf.scene || gltf.scenes[0];
          const box = new THREE.Box3().setFromObject(root);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const scale = 62 / maxDim;

          const wrapper = new THREE.Group();
          root.position.sub(center);
          wrapper.add(root);
          wrapper.scale.set(scale, scale, scale);

          if (IS_MOBILE && modelCache.size >= 2) {
            const oldestKey = modelCache.keys().next().value;
            modelCache.delete(oldestKey);
          }
          modelCache.set(url, wrapper);
          resolve(wrapper.clone(true));
        },
        undefined,
        (err) => reject(err)
      );
    } else {
      if (typeof THREE === "undefined" || !THREE.STLLoader) {
        reject(new Error("THREE.STLLoader not loaded"));
        return;
      }
      const loader = new THREE.STLLoader();
      loader.load(
        url,
        (geometry) => {
          geometry.computeVertexNormals();
          geometry.computeBoundingBox();
          geometry.center();
          geometry.computeBoundingSphere();

          const material = new THREE.MeshStandardMaterial({
            color: 0xd8dee4,
            metalness: 0.35,
            roughness: 0.42
          });
          const mesh = new THREE.Mesh(geometry, material);
          const radius = geometry.boundingSphere.radius || 1;
          const scale = 38 / radius;
          mesh.scale.set(scale, scale, scale);

          const wrapper = new THREE.Group();
          wrapper.add(mesh);

          if (IS_MOBILE && modelCache.size >= 2) {
            const oldestKey = modelCache.keys().next().value;
            modelCache.delete(oldestKey);
          }
          modelCache.set(url, wrapper);
          resolve(wrapper.clone(true));
        },
        undefined,
        (err) => reject(err)
      );
    }
  });
}

function mountAutoRotating3DPreview(container, modelUrl, type) {
  const badge = document.createElement("div");
  badge.className = "stl-badge-overlay";
  badge.textContent = `3D ${type.toUpperCase()} // TAP TO ORBIT`;
  container.appendChild(badge);

  let scene = null;
  let camera = null;
  let renderer = null;
  let modelGroup = null;
  let isVisible = false;
  let animFrameId = null;
  let isLoadingModel = false;

  function resizeRenderer() {
    if (!renderer || !camera) return;
    const w = container.clientWidth || 320;
    const h = container.clientHeight || 240;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function animate() {
    if (!isVisible || !renderer) return;
    animFrameId = requestAnimationFrame(animate);
    if (modelGroup) {
      modelGroup.rotation.y += 0.008;
    }
    renderer.render(scene, camera);
  }

  function initContext() {
    if (renderer || isLoadingModel) return;
    isLoadingModel = true;

    load3DModelObject(modelUrl, type)
      .then((obj) => {
        isLoadingModel = false;
        if (!isVisible) return;

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(40, 16 / 10, 0.1, 2000);
        renderer = new THREE.WebGLRenderer({
          antialias: !IS_MOBILE,
          alpha: true,
          powerPreference: "low-power"
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, IS_MOBILE ? 1.25 : 2));
        renderer.outputEncoding = THREE.sRGBEncoding;
        container.appendChild(renderer.domElement);

        scene.add(new THREE.HemisphereLight(0xffffff, 0x222830, 0.35));

        const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.35);
        dirLight1.position.set(65, 90, 75);
        scene.add(dirLight1);

        const grid = new THREE.GridHelper(120, 12, 0xd92804, 0x4b555d);
        grid.position.y = -28;
        scene.add(grid);

        modelGroup = obj;
        scene.add(modelGroup);
        camera.position.set(55, 38, 75);
        camera.lookAt(0, 0, 0);

        resizeRenderer();
        animate();
      })
      .catch(() => {
        isLoadingModel = false;
        badge.textContent = `${type.toUpperCase()} LOAD ERROR`;
      });
  }

  function destroyContext() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    if (renderer) {
      renderer.dispose();
      if (renderer.forceContextLoss) renderer.forceContextLoss();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer = null;
    }
    scene = null;
    camera = null;
    modelGroup = null;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          initContext();
        } else {
          if (IS_MOBILE) {
            destroyContext();
          } else if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
          }
        }
      });
    },
    { threshold: 0.05 }
  );
  observer.observe(container);

  window.addEventListener(
    "resize",
    () => {
      if (isVisible) resizeRenderer();
    },
    { passive: true }
  );
}

/**
 * ============================================================================
 * 4. POST-BOOT DEFERRED BACKGROUND PRE-WARM
 * ============================================================================
 */
function backgroundPrewarmPreviewImages(previewUrls) {
  if (IS_MOBILE || !previewUrls || previewUrls.length === 0) return;

  let currentIndex = 0;
  function loadNextChunk() {
    if (currentIndex >= previewUrls.length) return;
    const chunkLimit = Math.min(currentIndex + 3, previewUrls.length);

    for (let i = currentIndex; i < chunkLimit; i++) {
      if (/\.heic$|\.heif$/i.test(previewUrls[i])) continue;
      const bgImg = new Image();
      bgImg.crossOrigin = "anonymous";
      bgImg.decoding = "async";
      bgImg.src = previewUrls[i];
    }

    currentIndex = chunkLimit;
    if (currentIndex < previewUrls.length) {
      setTimeout(loadNextChunk, 350);
    }
  }

  loadNextChunk();
}

/**
 * ============================================================================
 * 5. TAB 1: RENDER ABOUT ME
 * ============================================================================
 */
async function renderAboutSection() {
  const cfg = PORTFOLIO_CONFIG.about;
  document.getElementById("nav-brand-name").textContent = PORTFOLIO_CONFIG.brandName;
  document.getElementById("about-headline").textContent = cfg.headline;
  document.getElementById("about-name-caption").textContent = cfg.name;

  document.documentElement.style.setProperty(
    "--photo-grid-cols",
    PORTFOLIO_CONFIG.photographyConfig.gridColumns || 5
  );

  const profileImg = document.getElementById("about-profile-img");
  const normAboutFolder = normalizeFolder(cfg.folder);
  const resolvedProfile =
    (await resolveValidUrlWithCaseFallback(normAboutFolder, cfg.profileImage)) ||
    (await resolveValidUrlWithCaseFallback(normAboutFolder, "profile.jpg")) ||
    (await resolveValidUrlWithCaseFallback(normAboutFolder, "profile.png")) ||
    (await resolveValidUrlWithCaseFallback(normAboutFolder, "profile.heic"));

  if (resolvedProfile) {
    const finalProfileUrl = await loadImageSourceWithHeicSupport(resolvedProfile);
    profileImg.src = finalProfileUrl;
  } else {
    profileImg.src = `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750">
        <rect width="600" height="750" fill="#181b1e"/>
        <line x1="0" y1="375" x2="600" y2="375" stroke="#d92804" stroke-width="1"/>
        <line x1="300" y1="0" x2="300" y2="750" stroke="#d92804" stroke-width="1"/>
        <text x="40" y="700" fill="#9aa4ae" font-family="monospace" font-size="16">PLACE IMAGE AT: ${normAboutFolder}${cfg.profileImage}</text>
      </svg>`
    )}`;
  }

  profileImg.addEventListener("click", () => {
    openLightbox(
      [
        {
          type: "image",
          file: cfg.profileImage,
          previewSrc: profileImg.src,
          fullSrc: profileImg.src,
          caption: `${cfg.name}`
        }
      ],
      0
    );
  });

  const resumePath = cfg.resume.file.startsWith("http")
    ? cfg.resume.file
    : `${normAboutFolder}${cfg.resume.file}`;

  const navResumeTab = document.getElementById("nav-resume-tab");
  if (navResumeTab) {
    navResumeTab.href = resumePath;
  }

  document.getElementById("about-specs-list").innerHTML = cfg.quickSpecs
    .map(
      (s) => `
      <div class="spec-row">
        <span class="spec-label">${s.label}</span>
        <span class="spec-val">${s.value}</span>
      </div>`
    )
    .join("");

  const bioContainer = document.getElementById("about-bio-content");
  const savedBio = localStorage.getItem("azcore_custom_bio");
  bioContainer.innerHTML = savedBio
    ? savedBio
    : cfg.bioParagraphs.map((p) => `<p>${p}</p>`).join("");

  document.getElementById("about-skills-grid").innerHTML = cfg.skills
    .map(
      (group) => `
      <div class="skill-group">
        <div class="skill-group-title">${group.category}</div>
        <div class="skill-tags">
          ${group.items
            .map((item) => {
              if (item === "new-row") {
                return `<div class="skill-row-break"></div>`;
              }
              return `<span class="skill-tag">${item}</span>`;
            })
            .join("")}
        </div>
      </div>`
    )
    .join("");

  document.getElementById("about-socials-grid").innerHTML = cfg.socials
    .map(
      (soc) => `
      <a class="social-card" href="${soc.url}" target="_blank" rel="noopener noreferrer">
        <span class="social-platform">${soc.platform}</span>
        <span class="social-handle">${soc.handle}</span>
      </a>`
    )
    .join("");
}

/**
 * ============================================================================
 * 6. TAB 2: PROJECT SYSTEM
 * ============================================================================
 */
let projectsLoaded = false;
let projectsLoadingPromise = null;

function parseProjectTextFile(rawText, folderPath) {
  const lines = rawText.replace(/\r\n/g, "\n").split("\n");
  const data = {
    title: "",
    code: "PRJ // ARCHIVE",
    tags: [],
    keys: "",
    mainAsset: "",
    assets: [],
    localApps: [],
    itchEmbeds: [],
    runLinks: [],
    assignedThumbFiles: new Set(),
    description: "",
    folder: folderPath
  };

  let inDescription = false;
  const descLines = [];

  function registerThumbIfPresent(rawToken) {
    const { thumbFile } = splitAssetTokenAndThumb(rawToken);
    if (thumbFile) {
      data.assignedThumbFiles.add(thumbFile.toLowerCase());
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (/^TITLE\s*:/i.test(line)) {
      inDescription = false;
      data.title = line.replace(/^TITLE\s*:\s*/i, "").trim();
    } else if (/^CODE\s*:/i.test(line)) {
      inDescription = false;
      data.code = line.replace(/^CODE\s*:\s*/i, "").trim();
    } else if (/^TAGS\s*:/i.test(line)) {
      inDescription = false;
      data.tags = line
        .replace(/^TAGS\s*:\s*/i, "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    } else if (/^(KEYS|CONTROLS|CONTROLLS)\s*:/i.test(line)) {
      inDescription = false;
      data.keys = line.replace(/^(KEYS|CONTROLS|CONTROLLS)\s*:\s*/i, "").trim();
    } else if (/^(APP|LOCAL_APP|WEB_APP)\s*:/i.test(line)) {
      inDescription = false;
      const rawApp = line.replace(/^(APP|LOCAL_APP|WEB_APP)\s*:\s*/i, "").trim();
      registerThumbIfPresent(rawApp);
      const { baseToken, thumbFile } = splitAssetTokenAndThumb(rawApp);
      const cleanAppPath = baseToken.replace(/^app\s*:\s*/i, "").trim();
      if (cleanAppPath) {
        data.localApps.push(`app:${cleanAppPath}${thumbFile ? "|thumb=" + thumbFile : ""}`);
      }
    } else if (/^ITCH(_EMBED|_GAME|_URL)?\s*:/i.test(line)) {
      inDescription = false;
      const rawItch = line.replace(/^ITCH(_EMBED|_GAME|_URL)?\s*:\s*/i, "").trim();
      registerThumbIfPresent(rawItch);
      const { thumbFile } = splitAssetTokenAndThumb(rawItch);
      const embedUrl = extractItchEmbedUrl(rawItch);
      if (embedUrl) {
        data.itchEmbeds.push(`itch:${embedUrl}${thumbFile ? "|thumb=" + thumbFile : ""}`);
      }
    } else if (/^(LINK|RUN|RUN_LINK|URL|WEBSITE)\s*:/i.test(line)) {
      inDescription = false;
      const rawLink = line.replace(/^(LINK|RUN|RUN_LINK|URL|WEBSITE)\s*:\s*/i, "").trim();
      registerThumbIfPresent(rawLink);
      const { thumbFile } = splitAssetTokenAndThumb(rawLink);
      if (rawLink) {
        data.runLinks.push(
          `run:${normalizeExternalUrl(rawLink)}${thumbFile ? "|thumb=" + thumbFile : ""}`
        );
      }
    } else if (/^MAIN(_IMAGE|_STL|_MODEL|_GLB|_VIDEO|_FILE|_ITCH|_LINK|_APP)?\s*:/i.test(line)) {
      inDescription = false;
      const rawMain = line
        .replace(/^MAIN(_IMAGE|_STL|_MODEL|_GLB|_VIDEO|_FILE|_ITCH|_LINK|_APP)?\s*:\s*/i, "")
        .trim();
      registerThumbIfPresent(rawMain);
      const { thumbFile } = splitAssetTokenAndThumb(rawMain);
      if (/^<iframe/i.test(rawMain) || /itch\.io\/embed/i.test(rawMain)) {
        data.mainAsset = `itch:${extractItchEmbedUrl(rawMain)}${
          thumbFile ? "|thumb=" + thumbFile : ""
        }`;
      } else {
        data.mainAsset = rawMain;
      }
    } else if (/^(IMAGES|FILES|ASSETS|MODELS|VIDEOS)\s*:/i.test(line)) {
      inDescription = false;
      const items = line
        .replace(/^(IMAGES|FILES|ASSETS|MODELS|VIDEOS)\s*:\s*/i, "")
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean);
      items.forEach(registerThumbIfPresent);
      data.assets.push(...items);
    } else if (/^DESCRIPTION\s*:/i.test(line)) {
      inDescription = true;
      const firstLineDesc = line.replace(/^DESCRIPTION\s*:\s*/i, "").trim();
      if (firstLineDesc) descLines.push(firstLineDesc);
    } else if (inDescription) {
      descLines.push(rawLine);
    }
  }

  data.description = descLines.join("\n").trim();

  [...data.localApps, ...data.runLinks, ...data.itchEmbeds].forEach((token) => {
    const tBase = splitAssetTokenAndThumb(token).baseToken.toLowerCase();
    if (
      !data.assets.some(
        (a) => splitAssetTokenAndThumb(a).baseToken.toLowerCase() === tBase
      )
    ) {
      data.assets.push(token);
    }
  });

  if (data.mainAsset) {
    const mainBase = splitAssetTokenAndThumb(data.mainAsset).baseToken.toLowerCase();
    data.assets = [
      data.mainAsset,
      ...data.assets.filter(
        (a) => splitAssetTokenAndThumb(a).baseToken.toLowerCase() !== mainBase
      )
    ];
  }

  const hasInteractiveItem = data.assets.some((a) => {
    const t = getAssetType(a);
    return t === "itch" || t === "link";
  });

  data.assets = data.assets.filter((item) => {
    const { baseToken } = splitAssetTokenAndThumb(item);
    const lower = baseToken.toLowerCase();
    if (data.assignedThumbFiles.has(lower)) return false;
    if (hasInteractiveItem && /^run\.(webp|png|jpg|jpeg)$/i.test(lower)) return false;
    return true;
  });

  return data;
}

async function resolveProjectAsset(projFolder, rawToken) {
  const { baseToken, thumbFile } = splitAssetTokenAndThumb(rawToken);
  const isLocalHtmlApp =
    /^(app|embed)\s*:/i.test(baseToken) || /\.html?$/i.test(baseToken);
  const assetType = getAssetType(baseToken);

  if (assetType === "link") {
    const targetUrl = normalizeExternalUrl(baseToken);
    const customThumbUrl = thumbFile
      ? await resolveValidUrlWithCaseFallback(projFolder, thumbFile)
      : null;
    const runImgUrl =
      customThumbUrl ||
      (await resolveValidUrlWithCaseFallback(projFolder, "run.webp")) ||
      (await resolveValidUrlWithCaseFallback(projFolder, "run.png")) ||
      (await resolveValidUrlWithCaseFallback(projFolder, "run.jpg")) ||
      getFallbackRunSvgDataUri();

    return {
      type: "link",
      file: thumbFile || "WEB APP",
      previewSrc: runImgUrl,
      fullSrc: runImgUrl,
      targetUrl: targetUrl
    };
  }

  if (isLocalHtmlApp || assetType === "itch") {
    let embedUrl = "";
    if (isLocalHtmlApp) {
      const cleanRel = baseToken.replace(/^(app|embed)\s*:\s*/i, "").trim();
      embedUrl = /^https?:\/\//i.test(cleanRel) ? cleanRel : `${projFolder}${cleanRel}`;
    } else {
      embedUrl = extractItchEmbedUrl(baseToken);
    }
    if (!embedUrl) return null;

    const customThumbUrl = thumbFile
      ? await resolveValidUrlWithCaseFallback(projFolder, thumbFile)
      : null;
    const optionalCover =
      customThumbUrl ||
      (await resolveValidUrlWithCaseFallback(projFolder, "run.webp")) ||
      (await resolveValidUrlWithCaseFallback(projFolder, "itch.webp")) ||
      (await resolveValidUrlWithCaseFallback(projFolder, "cover.webp")) ||
      getFallbackRunSvgDataUri();

    return {
      type: "itch",
      file: isLocalHtmlApp ? "WEB APP" : "ITCH.IO GAME",
      previewSrc: optionalCover,
      fullSrc: embedUrl,
      embedUrl: embedUrl
    };
  }

  const resolvedUrl = await resolveValidUrlWithCaseFallback(projFolder, baseToken);
  if (!resolvedUrl) return null;

  return {
    type: assetType,
    previewSrc: resolvedUrl,
    fullSrc: resolvedUrl,
    file: baseToken
  };
}

async function loadAndRenderProjects() {
  if (projectsLoaded) return;
  if (projectsLoadingPromise) return projectsLoadingPromise;

  projectsLoadingPromise = (async () => {
    const container = document.getElementById("projects-container");
    const countBadge = document.getElementById("projects-count-badge");
    const { baseFolder, textFileName, foldersToCheck } = PORTFOLIO_CONFIG.projectsConfig;
    const normBase = normalizeFolder(baseFolder);

    const loadedProjects = [];

    for (const folderName of foldersToCheck) {
      const projFolder = `${normBase}${folderName}/`;
      const txtUrl = `${projFolder}${textFileName}`;

      try {
        const res = await fetch(txtUrl, { cache: "default" });
        if (!res.ok) continue;
        if ((res.headers.get("content-type") || "").includes("text/html")) continue;

        const rawText = await res.text();
        if (!rawText || !rawText.trim()) continue;

        const parsed = parseProjectTextFile(rawText, projFolder);
        if (!parsed.title && parsed.assets.length === 0) continue;

        const resolvedList = await runInBatches(parsed.assets, 6, (file) =>
          resolveProjectAsset(projFolder, file)
        );

        const verifiedAssets = resolvedList.filter(Boolean);
        if (verifiedAssets.length > 0) {
          parsed.verifiedAssets = verifiedAssets;
          loadedProjects.push(parsed);
        }
      } catch (e) {}
    }

    countBadge.textContent = `LOADED: ${loadedProjects.length} PROJECT${
      loadedProjects.length === 1 ? "" : "S"
    }`;

    if (loadedProjects.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-state-title">// 0 PROJECT TEXT FILES DETECTED</div>
          <div class="empty-state-desc">
            No valid <code>project.txt</code> files with linked assets were found inside <code>${normBase}</code>.
          </div>
        </div>
      `;
      projectsLoaded = true;
      return;
    }

    container.innerHTML = "";

    loadedProjects.forEach((proj, idx) => {
      const card = document.createElement("article");
      card.className = "project-card";
      const drawerId = `drawer-proj-${idx}`;
      const mainAsset = proj.verifiedAssets[0];
      const stackPreview = proj.verifiedAssets.slice(0, 3);

      const stackVisualHtml = stackPreview
        .map((item) => {
          if (is3DAsset(item.type)) {
            return `<div class="stack-card-3d">[3D ${item.type.toUpperCase()}]</div>`;
          }
          if (item.type === "itch" || item.type === "link") {
            return `<img class="stack-card-img" src="${item.previewSrc}" loading="lazy" decoding="async" alt="Run preview" />`;
          }
          if (item.type === "image") {
            return `<img class="stack-card-img" src="${item.previewSrc}" loading="lazy" decoding="async" alt="Stack preview" />`;
          }
          const ext = getFileExtension(item.file).toUpperCase() || item.type.toUpperCase();
          return `<div class="stack-card-badge">[${ext}]</div>`;
        })
        .join("");

      card.innerHTML = `
        <div class="project-top-layout">
          <div class="project-main-img-wrap" id="main-wrap-${idx}"></div>

          <div class="project-info-col">
            <div>
              <div class="project-code">${proj.code}</div>
              <h2 class="project-title">${proj.title}</h2>
              <p class="project-desc">${proj.description}</p>
              <div class="project-tags">
                ${proj.tags.map((t) => `<span class="skill-tag">${t}</span>`).join("")}
              </div>
            </div>

            <div class="photo-stack-trigger">
              <div class="stack-visual">${stackVisualHtml}</div>
              <div class="stack-meta">
                <span class="stack-title">PROJECT STACK (${proj.verifiedAssets.length} LINKED)</span>
                <span class="stack-subtitle">Click stack to reveal full project grid &#8595;</span>
              </div>
            </div>
          </div>
        </div>

        <div id="${drawerId}" class="project-expanded-drawer">
          <div class="drawer-header">
            <span>// LINKED FROM ${proj.folder}project.txt (${proj.verifiedAssets.length} ITEMS)</span>
            <span>CLICK ANY ASSET FOR FULL VIEW OR LAUNCH</span>
          </div>
          <div class="project-gallery-grid"></div>
        </div>
      `;

      container.appendChild(card);

      const lightboxList = proj.verifiedAssets.map((asset, i) => ({
        type: asset.type,
        file: asset.file,
        previewSrc: asset.previewSrc,
        fullSrc: asset.fullSrc,
        embedUrl: asset.embedUrl,
        targetUrl: asset.targetUrl,
        keys: proj.keys,
        caption: `${proj.title} (${asset.file}) // [${i + 1}/${proj.verifiedAssets.length}]`
      }));

      const mainWrap = card.querySelector(`#main-wrap-${idx}`);
      if (is3DAsset(mainAsset.type)) {
        const stage3d = document.createElement("div");
        stage3d.className = "stl-preview-container";
        mainWrap.prepend(stage3d);
        mountAutoRotating3DPreview(stage3d, mainAsset.fullSrc, mainAsset.type);
        mainWrap.addEventListener("click", () => openLightbox(lightboxList, 0));
      } else if (mainAsset.type === "link") {
        mainWrap.style.cursor = "pointer";
        mainWrap.prepend(createRunLinkCard(mainAsset, proj.keys, false));
      } else if (mainAsset.type === "itch") {
        mainWrap.style.cursor = "pointer";
        mainWrap.prepend(
          createItchEmbedCard(mainAsset, () => openLightbox(lightboxList, 0), proj.keys, false)
        );
      } else if (isImageAsset(mainAsset.type)) {
        const mainImg = document.createElement("img");
        mainImg.className = "interactive-img project-main-img";
        mainImg.loading = "lazy";
        mainImg.decoding = "async";
        mainImg.alt = proj.title;
        mainWrap.prepend(mainImg);
        loadImageSourceWithHeicSupport(mainAsset.previewSrc).then((url) => {
          mainImg.src = url;
        });
        mainWrap.addEventListener("click", () => openLightbox(lightboxList, 0));
      } else {
        mainWrap.prepend(createUniversalAssetCard(mainAsset));
        mainWrap.addEventListener("click", () => openLightbox(lightboxList, 0));
      }

      const galleryGrid = card.querySelector(".project-gallery-grid");
      let drawerPopulated = false;

      function populateDrawerGrid() {
        if (drawerPopulated) return;
        drawerPopulated = true;

        proj.verifiedAssets.forEach((asset, assetIdx) => {
          const itemWrap = document.createElement("div");
          itemWrap.className = "project-gallery-item";

          if (is3DAsset(asset.type)) {
            if (IS_MOBILE) {
              const box3d = document.createElement("div");
              box3d.className = "stl-preview-container";
              box3d.style.display = "flex";
              box3d.style.alignItems = "center";
              box3d.style.justifyContent = "center";
              box3d.innerHTML = `<div class="stl-badge-overlay" style="position:static;">TAP TO OPEN 3D ${asset.type.toUpperCase()}</div>`;
              itemWrap.appendChild(box3d);
            } else {
              const box3d = document.createElement("div");
              box3d.className = "stl-preview-container";
              itemWrap.appendChild(box3d);
              mountAutoRotating3DPreview(box3d, asset.fullSrc, asset.type);
            }
            itemWrap.addEventListener("click", () => openLightbox(lightboxList, assetIdx));
          } else if (asset.type === "link") {
            // Project Stack item: shows ONLY the Run button
            itemWrap.appendChild(createRunLinkCard(asset, proj.keys, true));
          } else if (asset.type === "itch") {
            // Project Stack item: shows ONLY the Run button
            itemWrap.appendChild(
              createItchEmbedCard(
                asset,
                () => openLightbox(lightboxList, assetIdx),
                proj.keys,
                true
              )
            );
          } else if (isImageAsset(asset.type)) {
            const img = document.createElement("img");
            img.className = "interactive-img";
            img.loading = "lazy";
            img.decoding = "async";
            img.alt = `${proj.title} item ${assetIdx + 1}`;
            itemWrap.appendChild(img);
            loadImageSourceWithHeicSupport(asset.previewSrc).then((url) => {
              img.src = url;
            });
            itemWrap.addEventListener("click", () => openLightbox(lightboxList, assetIdx));
          } else {
            itemWrap.appendChild(createUniversalAssetCard(asset));
            itemWrap.addEventListener("click", () => openLightbox(lightboxList, assetIdx));
          }

          galleryGrid.appendChild(itemWrap);
        });
      }

      const stackTrigger = card.querySelector(".photo-stack-trigger");
      const drawer = card.querySelector(`#${drawerId}`);
      stackTrigger.addEventListener("click", () => {
        populateDrawerGrid();
        const isOpen = drawer.classList.toggle("open");
        stackTrigger.querySelector(".stack-subtitle").innerHTML = isOpen
          ? "Click stack to collapse project grid &#8593;"
          : "Click stack to reveal full project grid &#8595;";
      });
    });

    projectsLoaded = true;
  })();

  return projectsLoadingPromise;
}

/**
 * ============================================================================
 * 7. TAB 3: DUAL-SET PHOTOGRAPHY ENGINE
 * ============================================================================
 */
let photographyLoaded = false;
let photographyLoadingPromise = null;

async function discoverPhotographyDualAssets() {
  const { folder, previewSubfolder, fullSubfolder, maxNumberedProbe } =
    PORTFOLIO_CONFIG.photographyConfig;
  const normFolder = normalizeFolder(folder);
  const discoveredItems = [];
  const seenNames = new Set();

  try {
    const txtRes = await fetch(`${normFolder}photos.txt`, { cache: "default" });
    if (txtRes.ok && !(txtRes.headers.get("content-type") || "").includes("text/html")) {
      const text = await txtRes.text();
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      const resolvedBatch = await runInBatches(lines, 6, async (fileName) => {
        const dual = await resolveDualImageUrls(
          normFolder,
          previewSubfolder,
          fullSubfolder,
          fileName
        );
        return dual ? { fileName, ...dual } : null;
      });

      resolvedBatch.filter(Boolean).forEach((item) => {
        if (!seenNames.has(item.fileName)) {
          seenNames.add(item.fileName);
          discoveredItems.push(item);
        }
      });
    }
  } catch (e) {}

  if (discoveredItems.length === 0) {
    const candidates = [];
    for (let i = 1; i <= maxNumberedProbe; i++) {
      const pad = String(i).padStart(2, "0");
      candidates.push(
        `Image (${i}).webp`,
        `Image (${i}).jpg`,
        `${pad}.webp`,
        `${pad}.jpg`,
        `${i}.webp`,
        `${i}.jpg`
      );
    }

    const results = await runInBatches(candidates, 8, async (fileName) => {
      const dual = await resolveDualImageUrls(
        normFolder,
        previewSubfolder,
        fullSubfolder,
        fileName
      );
      return dual ? { fileName, ...dual } : null;
    });

    results.filter(Boolean).forEach((item) => {
      if (!seenNames.has(item.fileName)) {
        seenNames.add(item.fileName);
        discoveredItems.push(item);
      }
    });
  }

  return discoveredItems;
}

function cacheSingleImageColorOnce(img, card) {
  if (card.dataset.colorCached === "true") return;
  try {
    const canvas = document.getElementById("color-sampler-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.clearRect(0, 0, 24, 24);
    ctx.drawImage(img, 0, 0, 24, 24);
    const data = ctx.getImageData(0, 0, 24, 24).data;

    let r = 0,
      g = 0,
      b = 0,
      count = 0;
    for (let i = 0; i < data.length; i += 16) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }
    if (count > 0) {
      card.dataset.r = Math.round(r / count);
      card.dataset.g = Math.round(g / count);
      card.dataset.b = Math.round(b / count);
      card.dataset.colorCached = "true";
    }
  } catch (e) {}
}

async function loadAndRenderPhotography() {
  if (photographyLoaded) return;
  if (photographyLoadingPromise) return photographyLoadingPromise;

  photographyLoadingPromise = (async () => {
    const grid = document.getElementById("photography-grid");
    const countBadge = document.getElementById("photo-count-badge");

    document.documentElement.style.setProperty(
      "--photo-grid-cols",
      PORTFOLIO_CONFIG.photographyConfig.gridColumns || 5
    );

    const photoItems = await discoverPhotographyDualAssets();

    backgroundPrewarmPreviewImages(photoItems.map((item) => item.previewUrl));

    countBadge.textContent = `FOLDER COUNT: ${photoItems.length} IMAGE${
      photoItems.length === 1 ? "" : "S"
    }`;

    if (photoItems.length === 0) {
      grid.style.display = "block";
      grid.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-state-title">// 0 IMAGES IN PHOTOGRAPHY FOLDER</div>
          <div class="empty-state-desc">
            No images were found in <code>${PORTFOLIO_CONFIG.photographyConfig.folder}preview/</code> or <code>${PORTFOLIO_CONFIG.photographyConfig.folder}</code>.
          </div>
        </div>
      `;
      photographyLoaded = true;
      return;
    }

    grid.style.display = "grid";
    grid.innerHTML = "";

    const lightboxItems = photoItems.map((item, i) => ({
      type: getAssetType(item.fullUrl),
      file: item.fileName,
      previewSrc: item.previewUrl,
      fullSrc: item.fullUrl,
      caption: `${item.fileName} // [${i + 1} / ${photoItems.length}]`
    }));

    const lazyObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const card = entry.target;
          const img = card.querySelector("img");
          if (img && img.dataset.src) {
            const rawUrl = img.dataset.src;
            img.removeAttribute("data-src");
            loadImageSourceWithHeicSupport(rawUrl).then((url) => {
              img.src = url;
            });
          }
          obs.unobserve(card);
        });
      },
      { rootMargin: IS_MOBILE ? "180px 0px" : "400px 0px" }
    );

    photoItems.forEach((item, idx) => {
      const card = document.createElement("div");
      card.className = "insta-card";

      const img = document.createElement("img");
      img.className = "photo-grid-img";
      img.crossOrigin = "anonymous";
      img.decoding = "async";
      img.loading = "lazy";
      img.dataset.src = item.previewUrl;
      img.alt = item.fileName;

      img.addEventListener("load", () => {
        img.classList.add("img-loaded");
        requestAnimationFrame(() => {
          cacheSingleImageColorOnce(img, card);
          if (currentTabIndex === 2) scheduleAverageColorUpdate();
        });
      });

      card.innerHTML = `
        <div class="insta-overlay">
          <span class="insta-title">${item.fileName}</span>
        </div>
      `;
      card.prepend(img);
      grid.appendChild(card);

      lazyObserver.observe(card);

      card.addEventListener("click", () => {
        openLightbox(lightboxItems, idx);
      });
    });

    photographyLoaded = true;
  })();

  return photographyLoadingPromise;
}

/**
 * ============================================================================
 * 8. INSTANT CACHED AVERAGE COLOR ENGINE
 * ============================================================================
 */
let colorUpdateRaf = null;

function scheduleAverageColorUpdate() {
  if (colorUpdateRaf) return;
  colorUpdateRaf = requestAnimationFrame(() => {
    colorUpdateRaf = null;
    updatePhotographyAverageColor();
  });
}

function resetToCadTheme() {
  const bgLayer = document.getElementById("bg-canvas-layer");
  if (bgLayer) {
    bgLayer.style.backgroundColor = "#1f2326";
    bgLayer.style.backgroundImage = "none";
  }
  const swatchDot = document.getElementById("swatch-dot");
  const swatchHex = document.getElementById("swatch-hex");
  if (swatchDot) swatchDot.style.backgroundColor = "#1f2326";
  if (swatchHex) swatchHex.textContent = "#1F2326";
}

function updatePhotographyAverageColor() {
  if (currentTabIndex !== 2) return;

  const cards = document.querySelectorAll(".insta-card[data-color-cached='true']");
  if (cards.length === 0) return;

  let totalR = 0,
    totalG = 0,
    totalB = 0,
    counted = 0;
  const viewportH = window.innerHeight;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const rect = card.getBoundingClientRect();
    if (rect.bottom > 68 && rect.top < viewportH) {
      totalR += Number(card.dataset.r);
      totalG += Number(card.dataset.g);
      totalB += Number(card.dataset.b);
      counted++;
    }
  }

  if (counted > 0) {
    const avgR = Math.round((totalR / counted) * 0.65);
    const avgG = Math.round((totalG / counted) * 0.65);
    const avgB = Math.round((totalB / counted) * 0.65);

    const hex =
      "#" +
      [avgR, avgG, avgB]
        .map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();

    const bgLayer = document.getElementById("bg-canvas-layer");
    if (bgLayer) {
      bgLayer.style.backgroundColor = `rgb(${avgR}, ${avgG}, ${avgB})`;
      bgLayer.style.backgroundImage = `radial-gradient(circle at 50% 30%, rgba(${Math.min(
        255,
        avgR + 45
      )}, ${Math.min(255, avgG + 45)}, ${Math.min(255, avgB + 45)}, 0.38), rgba(18, 21, 24, 0.88))`;
    }

    const swatchDot = document.getElementById("swatch-dot");
    const swatchHex = document.getElementById("swatch-hex");
    if (swatchDot) swatchDot.style.backgroundColor = hex;
    if (swatchHex) swatchHex.textContent = hex;
  }
}

/**
 * ============================================================================
 * 9. TAB NAVIGATION
 * ============================================================================
 */
const TABS = ["about", "projects", "photography"];
const TAB_LABELS = ["ABOUT ME", "PROJECTS", "PHOTOGRAPHY"];
let currentTabIndex = 0;

function switchTab(targetIndex) {
  if (targetIndex === currentTabIndex) return;

  if (targetIndex === 1 && !projectsLoaded) loadAndRenderProjects();
  if (targetIndex === 2 && !photographyLoaded) loadAndRenderPhotography();

  const direction = targetIndex > currentTabIndex ? "right" : "left";
  const isWrapAroundNext = currentTabIndex === 2 && targetIndex === 0;
  const isWrapAroundPrev = currentTabIndex === 0 && targetIndex === 2;
  const slideClass =
    isWrapAroundNext || (!isWrapAroundPrev && direction === "right")
      ? "slide-in-right"
      : "slide-in-left";

  currentTabIndex = targetIndex;

  document.querySelectorAll(".tab-btn[data-index]").forEach((btn, idx) => {
    btn.classList.toggle("active", idx === currentTabIndex);
  });

  document.querySelectorAll(".tab-section").forEach((sec, idx) => {
    sec.classList.remove("active-section", "slide-in-right", "slide-in-left");
    if (idx === currentTabIndex) {
      sec.classList.add("active-section", slideClass);
    }
  });

  const prevIndex = (currentTabIndex - 1 + TABS.length) % TABS.length;
  const nextIndex = (currentTabIndex + 1) % TABS.length;
  document.getElementById("prev-tab-label").textContent = TAB_LABELS[prevIndex];
  document.getElementById("next-tab-label").textContent = TAB_LABELS[nextIndex];

  window.scrollTo(0, 0);

  if (currentTabIndex === 2) {
    document.body.classList.add("photo-theme-active");
    scheduleAverageColorUpdate();
  } else {
    document.body.classList.remove("photo-theme-active");
    resetToCadTheme();
  }
}

/**
 * ============================================================================
 * 10. UNIVERSAL LIGHTBOX & VIRTUAL CROSSHAIR CURSOR SYSTEM
 * ============================================================================
 */
let currentLightboxList = [];
let currentLightboxIndex = 0;
let activeFullImageRequestToken = 0;

let lbScene = null,
  lbCamera = null,
  lbRenderer = null,
  lbControls = null,
  lbModelGroup = null,
  lbAnimId = null;

function preventBackgroundScroll(e) {
  if (
    e.target &&
    (e.target.closest("#lightbox-3d-stage") || e.target.closest(".keys-hud-popover"))
  ) {
    return;
  }
  e.preventDefault();
}

function initOrUpdateLightbox3D(modelUrl, type) {
  const stage = document.getElementById("lightbox-3d-stage");
  const resetBtn = document.getElementById("model-reset-btn");
  const loaderOverlay = document.getElementById("lightbox-loader");
  const loaderText = document.getElementById("lightbox-loader-text");

  if (!lbRenderer) {
    lbScene = new THREE.Scene();
    lbCamera = new THREE.PerspectiveCamera(42, 16 / 10, 0.1, 4000);
    lbRenderer = new THREE.WebGLRenderer({
      antialias: !IS_MOBILE,
      alpha: true,
      powerPreference: "high-performance"
    });
    lbRenderer.setPixelRatio(Math.min(window.devicePixelRatio, IS_MOBILE ? 1.5 : 2));
    lbRenderer.outputEncoding = THREE.sRGBEncoding;
    stage.appendChild(lbRenderer.domElement);

    lbControls = new THREE.OrbitControls(lbCamera, lbRenderer.domElement);
    lbControls.enableDamping = true;
    lbControls.dampingFactor = 0.06;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x222830, 0.4);
    lbScene.add(hemi);

    const dir1 = new THREE.DirectionalLight(0xffffff, 0.4);
    dir1.position.set(100, 140, 120);
    lbScene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0xffffff, 0.1);
    dir2.position.set(-100, -80, -90);
    lbScene.add(dir2);

    const grid = new THREE.GridHelper(180, 18, 0xd92804, 0x4b555d);
    grid.position.y = -42;
    lbScene.add(grid);

    resetBtn.addEventListener("click", () => {
      if (!lbControls) return;
      lbControls.reset();
      lbCamera.position.set(70, 50, 95);
      lbControls.update();
    });
  }

  const w = stage.clientWidth || window.innerWidth * (IS_MOBILE ? 0.94 : 0.78);
  const h = stage.clientHeight || window.innerHeight * (IS_MOBILE ? 0.68 : 0.74);
  lbCamera.aspect = w / h;
  lbCamera.updateProjectionMatrix();
  lbRenderer.setSize(w, h);

  if (lbModelGroup) {
    lbScene.remove(lbModelGroup);
    lbModelGroup = null;
  }

  loaderText.textContent = `LOADING 3D ${type.toUpperCase()} GEOMETRY...`;
  loaderOverlay.style.display = "flex";

  load3DModelObject(modelUrl, type)
    .then((obj) => {
      loaderOverlay.style.display = "none";
      lbModelGroup = obj;
      lbScene.add(lbModelGroup);
      lbControls.reset();
      lbCamera.position.set(70, 50, 95);
      lbControls.update();
    })
    .catch(() => {
      loaderText.textContent = `ERROR LOADING 3D ${type.toUpperCase()} FILE`;
    });

  if (lbAnimId) cancelAnimationFrame(lbAnimId);
  function animateLb() {
    lbAnimId = requestAnimationFrame(animateLb);
    if (lbControls) lbControls.update();
    if (lbRenderer && lbScene && lbCamera) {
      lbRenderer.render(lbScene, lbCamera);
    }
  }
  animateLb();
}

function openLightbox(items, startIndex = 0) {
  currentLightboxList = items;
  currentLightboxIndex = startIndex;

  const modal = document.getElementById("lightbox-modal");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");

  document.body.classList.add("lightbox-lock");
  window.addEventListener("wheel", preventBackgroundScroll, { passive: false });
  window.addEventListener("touchmove", preventBackgroundScroll, { passive: false });

  updateLightboxSlide();
}

function closeLightbox() {
  if (document.activeElement && typeof document.activeElement.blur === "function") {
    document.activeElement.blur();
  }

  const modal = document.getElementById("lightbox-modal");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");

  activeFullImageRequestToken++;
  lightboxVirtualCursorState.controlsActive = false;
  lightboxVirtualCursorState.enabled = false;
  updateLightboxVirtualCursorVisibilityAndPosition();

  if (lbAnimId) {
    cancelAnimationFrame(lbAnimId);
    lbAnimId = null;
  }

  if (IS_MOBILE && lbRenderer) {
    lbRenderer.dispose();
    if (lbRenderer.forceContextLoss) lbRenderer.forceContextLoss();
    if (lbRenderer.domElement && lbRenderer.domElement.parentNode) {
      lbRenderer.domElement.parentNode.removeChild(lbRenderer.domElement);
    }
    lbRenderer = null;
    lbScene = null;
    lbCamera = null;
    lbControls = null;
    lbModelGroup = null;
  }

  const imgEl = document.getElementById("lightbox-img");
  if (imgEl) imgEl.src = "";

  const videoEl = document.getElementById("lightbox-video");
  if (videoEl) {
    videoEl.pause();
    videoEl.removeAttribute("src");
    videoEl.load();
    videoEl.style.display = "none";
  }

  const audioEl = document.getElementById("lightbox-audio");
  if (audioEl) {
    audioEl.pause();
    audioEl.removeAttribute("src");
    audioEl.load();
  }

  const itchFrame = document.getElementById("lightbox-itch-frame");
  if (itchFrame) {
    itchFrame.src = "";
    itchFrame.style.display = "none";
  }

  const linkStage = document.getElementById("lightbox-link-stage");
  if (linkStage) {
    linkStage.innerHTML = "";
    linkStage.style.display = "none";
  }

  const keysPop = document.getElementById("lightbox-keys-popover");
  if (keysPop) keysPop.style.display = "none";

  document.getElementById("lightbox-pdf-frame").src = "";
  document.getElementById("lightbox-loader").style.display = "none";

  document.body.classList.remove("lightbox-lock");
  window.removeEventListener("wheel", preventBackgroundScroll);
  window.removeEventListener("touchmove", preventBackgroundScroll);
}

function showGenericFileFallback(item, message) {
  const genericStage = document.getElementById("lightbox-generic-stage");
  const ext = getFileExtension(item.file || item.fullSrc).toUpperCase() || "FILE";
  document.getElementById("lightbox-generic-ext").textContent = `.${ext}`;
  document.getElementById("lightbox-generic-name").textContent =
    item.file || item.caption || "Project Asset";
  document.getElementById("lightbox-generic-desc").textContent =
    message || "Preview not available in browser for this file format.";
  genericStage.style.display = "flex";
}

function updateLightboxSlide() {
  if (!currentLightboxList.length) return;
  const item = currentLightboxList[currentLightboxIndex];
  const requestToken = ++activeFullImageRequestToken;

  const imgEl = document.getElementById("lightbox-img");
  const videoEl = document.getElementById("lightbox-video");
  const audioStage = document.getElementById("lightbox-audio-stage");
  const audioEl = document.getElementById("lightbox-audio");
  const stage3d = document.getElementById("lightbox-3d-stage");
  const itchFrame = document.getElementById("lightbox-itch-frame");
  const linkStage = document.getElementById("lightbox-link-stage");
  const pdfFrame = document.getElementById("lightbox-pdf-frame");
  const genericStage = document.getElementById("lightbox-generic-stage");
  const resetBtn = document.getElementById("model-reset-btn");
  const externalBtn = document.getElementById("lightbox-external-btn");
  const keysBtn = document.getElementById("lightbox-keys-btn");
  const keysPopover = document.getElementById("lightbox-keys-popover");
  const loaderOverlay = document.getElementById("lightbox-loader");
  const loaderText = document.getElementById("lightbox-loader-text");

  imgEl.style.display = "none";
  videoEl.style.display = "none";
  audioStage.style.display = "none";
  stage3d.style.display = "none";
  if (itchFrame) {
    itchFrame.src = "";
    itchFrame.style.display = "none";
  }
  if (linkStage) {
    linkStage.innerHTML = "";
    linkStage.style.display = "none";
  }
  pdfFrame.style.display = "none";
  genericStage.style.display = "none";
  resetBtn.style.display = "none";
  if (externalBtn) externalBtn.style.display = "none";
  if (keysBtn) keysBtn.style.display = "none";
  if (keysPopover) keysPopover.style.display = "none";
  loaderOverlay.style.display = "none";

  // Controls & Virtual Cursor ALWAYS start turned OFF when opening a slide
  lightboxVirtualCursorState.xRatio = 0.5;
  lightboxVirtualCursorState.yRatio = 0.5;
  lightboxVirtualCursorState.controlsActive = false;
  lightboxVirtualCursorState.enabled = false;

  if (item.keys && item.keys.trim() && keysBtn && keysPopover) {
    keysBtn.style.display = "inline-block";
    keysPopover.innerHTML = buildKeysHudContentHtml(item.keys);
    bindInteractiveVirtualKeys(keysPopover);
    keysPopover.style.display = "none";
  }
  updateLightboxVirtualCursorVisibilityAndPosition();
  setupLightboxVirtualCursorDrag();

  if (videoEl) {
    videoEl.pause();
    videoEl.removeAttribute("src");
    videoEl.load();
  }
  if (audioEl) {
    audioEl.pause();
    audioEl.removeAttribute("src");
    audioEl.load();
  }

  if (lbAnimId) {
    cancelAnimationFrame(lbAnimId);
    lbAnimId = null;
  }

  if (is3DAsset(item.type)) {
    stage3d.style.display = "block";
    resetBtn.style.display = "inline-block";
    initOrUpdateLightbox3D(item.fullSrc, item.type);
  } else if (item.type === "itch") {
    itchFrame.style.display = "block";
    itchFrame.src = item.embedUrl || item.fullSrc;
    itchFrame.onload = () => {
      try {
        itchFrame.focus();
        if (itchFrame.contentWindow) itchFrame.contentWindow.focus();
        updateLightboxVirtualCursorVisibilityAndPosition();
      } catch (e) {}
    };
    if (externalBtn) {
      externalBtn.href = item.embedUrl || item.fullSrc;
      externalBtn.style.display = "inline-block";
    }
  } else if (item.type === "link") {
    linkStage.style.display = "flex";
    linkStage.appendChild(createRunLinkCard(item, item.keys, false));
    if (externalBtn) {
      externalBtn.href = item.targetUrl;
      externalBtn.style.display = "inline-block";
    }
  } else if (item.type === "video") {
    videoEl.style.display = "block";
    loaderText.textContent = "LOADING VIDEO STREAM...";
    loaderOverlay.style.display = "flex";

    videoEl.onloadeddata = () => {
      if (requestToken !== activeFullImageRequestToken) return;
      loaderOverlay.style.display = "none";
      videoEl.play().catch(() => {});
    };

    videoEl.onerror = () => {
      if (requestToken !== activeFullImageRequestToken) return;
      loaderOverlay.style.display = "none";
      videoEl.style.display = "none";
      showGenericFileFallback(
        item,
        "This video codec cannot be decoded directly by this browser."
      );
    };

    videoEl.src = item.fullSrc;
    videoEl.load();
  } else if (item.type === "audio") {
    audioStage.style.display = "flex";
    document.getElementById("lightbox-audio-title").textContent = item.file || "AUDIO TRACK";
    audioEl.src = item.fullSrc;
    audioEl.load();
    audioEl.play().catch(() => {});
  } else if (item.type === "pdf") {
    pdfFrame.style.display = "block";
    pdfFrame.src = item.fullSrc;
  } else if (isImageAsset(item.type)) {
    imgEl.style.display = "block";
    const previewUrl = item.previewSrc || item.fullSrc;
    const fullUrl = item.fullSrc || item.previewSrc;

    imgEl.classList.add("loading-blur");
    loaderText.textContent =
      item.type === "heic" ? "CONVERTING HEIC PHONE IMAGE..." : "LOADING FULL-RESOLUTION IMAGE...";
    loaderOverlay.style.display = "flex";

    loadImageSourceWithHeicSupport(previewUrl).then((resolvedPreview) => {
      if (requestToken !== activeFullImageRequestToken) return;
      imgEl.src = resolvedPreview;
    });

    loadImageSourceWithHeicSupport(fullUrl)
      .then((resolvedFull) => {
        if (requestToken !== activeFullImageRequestToken) return;
        const highResLoader = new Image();
        highResLoader.decoding = "async";
        highResLoader.onload = () => {
          if (requestToken !== activeFullImageRequestToken) return;
          imgEl.src = resolvedFull;
          imgEl.classList.remove("loading-blur");
          loaderOverlay.style.display = "none";
        };
        highResLoader.onerror = () => {
          if (requestToken !== activeFullImageRequestToken) return;
          imgEl.classList.remove("loading-blur");
          loaderOverlay.style.display = "none";
        };
        highResLoader.src = resolvedFull;
      })
      .catch(() => {
        if (requestToken !== activeFullImageRequestToken) return;
        loaderOverlay.style.display = "none";
        imgEl.style.display = "none";
        showGenericFileFallback(item, "Browser could not decode this image format directly.");
      });
  } else {
    showGenericFileFallback(item);
  }

  document.getElementById("lightbox-caption").textContent = item.caption || "";
}

function stepLightbox(delta) {
  if (!currentLightboxList.length) return;
  currentLightboxIndex =
    (currentLightboxIndex + delta + currentLightboxList.length) %
    currentLightboxList.length;
  updateLightboxSlide();
}

/**
 * ============================================================================
 * 11. INITIALIZATION & MOBILE-AWARE DEFERRED LOADING
 * ============================================================================
 */
window.addEventListener("DOMContentLoaded", async () => {
  await renderAboutSection();

  setTimeout(() => {
    document.getElementById("page-loader").classList.add("loaded");
    document.body.classList.add("page-ready");

    if (!IS_MOBILE) {
      const startDeferredBackgroundLoading = async () => {
        await loadAndRenderProjects();
        await loadAndRenderPhotography();
      };

      if ("requestIdleCallback" in window) {
        requestIdleCallback(() => startDeferredBackgroundLoading(), { timeout: 2000 });
      } else {
        setTimeout(startDeferredBackgroundLoading, 1200);
      }
    }
  }, 300);

  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mainTabNav = document.getElementById("main-tab-nav");

  function closeMobileMenu() {
    if (!mobileMenuBtn || !mainTabNav) return;
    mobileMenuBtn.classList.remove("open");
    mobileMenuBtn.setAttribute("aria-expanded", "false");
    mainTabNav.classList.remove("mobile-open");
  }

  if (mobileMenuBtn && mainTabNav) {
    mobileMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = mainTabNav.classList.toggle("mobile-open");
      mobileMenuBtn.classList.toggle("open", isOpen);
      mobileMenuBtn.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".site-header")) {
        closeMobileMenu();
      }
    });
  }

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.index !== undefined) {
        switchTab(parseInt(btn.dataset.index, 10));
      }
      closeMobileMenu();
    });
  });

  document.getElementById("side-nav-prev").addEventListener("click", () => {
    switchTab((currentTabIndex - 1 + TABS.length) % TABS.length);
  });

  document.getElementById("side-nav-next").addEventListener("click", () => {
    switchTab((currentTabIndex + 1) % TABS.length);
  });

  window.addEventListener(
    "scroll",
    () => {
      if (currentTabIndex === 2) scheduleAverageColorUpdate();
    },
    { passive: true }
  );
  window.addEventListener(
    "resize",
    () => {
      if (currentTabIndex === 2) scheduleAverageColorUpdate();
    },
    { passive: true }
  );

  const lightboxModal = document.getElementById("lightbox-modal");
  lightboxModal.addEventListener("click", (e) => {
    if (e.target === lightboxModal) closeLightbox();
  });
  document.getElementById("lightbox-close").addEventListener("click", (e) => {
    e.stopPropagation();
    closeLightbox();
  });
  document.getElementById("lightbox-prev").addEventListener("click", (e) => {
    e.stopPropagation();
    stepLightbox(-1);
  });
  document.getElementById("lightbox-next").addEventListener("click", (e) => {
    e.stopPropagation();
    stepLightbox(1);
  });

  // Lightbox Controls Toggle: turns OFF the virtual cursor whenever controls are closed
  const lbKeysBtn = document.getElementById("lightbox-keys-btn");
  const lbKeysPopover = document.getElementById("lightbox-keys-popover");
  if (lbKeysBtn && lbKeysPopover) {
    lbKeysBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const nowOpen = lbKeysPopover.style.display !== "block";
      lbKeysPopover.style.display = nowOpen ? "block" : "none";
      lightboxVirtualCursorState.controlsActive = nowOpen;
      if (!nowOpen) {
        lightboxVirtualCursorState.enabled = false;
      }
      updateLightboxVirtualCursorVisibilityAndPosition();
    });
    lbKeysPopover.addEventListener("click", (e) => e.stopPropagation());
  }

  window.addEventListener("keydown", (e) => {
    if (lightboxModal.classList.contains("open")) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") stepLightbox(-1);
      if (e.key === "ArrowRight") stepLightbox(1);
    }
  });
});