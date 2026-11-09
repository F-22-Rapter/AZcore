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
      { label: "LOCATION", value: "Illinois Institute of Technology" },
      { label: "FOCUS", value: "CAD / Fabrication / Photography" },
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
 * 2. FILE HELPERS, 2D GRID CONTROLS, 1x1 WASD JOYSTICK & HEIC DECODING
 * ============================================================================
 */
const verifiedUrlCache = new Map();
const heicBlobCache = new Map();

const FALLBACK_RUN_SVG_URI = `data:image/svg+xml;utf8,${encodeURIComponent(
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

const KEY_SPEC_MAP = {
  JOYSTICK: { tokenName: "JOYSTICK", label: "WASD", key: "__JOYSTICK__", code: "VirtualJoystick", keyCode: 0, isJoystick: true },
  STICK: { tokenName: "JOYSTICK", label: "WASD", key: "__JOYSTICK__", code: "VirtualJoystick", keyCode: 0, isJoystick: true },
  WASD_STICK: { tokenName: "JOYSTICK", label: "WASD", key: "__JOYSTICK__", code: "VirtualJoystick", keyCode: 0, isJoystick: true },
  WASD: { tokenName: "JOYSTICK", label: "WASD", key: "__JOYSTICK__", code: "VirtualJoystick", keyCode: 0, isJoystick: true },
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
  ENTER: { tokenName: "ENTER", label: "ENTER", key: "Enter", keyCode: 13 },
  TAB: { tokenName: "TAB", label: "TAB", key: "Tab", code: "Tab", keyCode: 9 },
  ESC: { tokenName: "ESC", label: "ESC", key: "Escape", code: "Escape", keyCode: 27 },
  ESCAPE: { tokenName: "ESC", label: "ESC", key: "Escape", code: "Escape", keyCode: 27 }
};

const WASD_DIRECTION_SPECS = {
  W: { key: "w", code: "KeyW", keyCode: 87 },
  A: { key: "a", code: "KeyA", keyCode: 65 },
  S: { key: "s", code: "KeyS", keyCode: 83 },
  D: { key: "d", code: "KeyD", keyCode: 68 }
};

const lightboxVirtualCursorState = {
  enabled: false,
  controlsActive: false,
  xRatio: 0.5,
  yRatio: 0.5,
  isDragging: false,
  isMouseDownHold: false
};

const lightboxZoomState = {
  scale: 1,
  minScale: 1,
  maxScale: 5,
  panX: 0,
  panY: 0,
  isPanning: false,
  startX: 0,
  startY: 0,
  initialPinchDist: 0,
  initialPinchScale: 1,
  lastTapTime: 0
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
  return /^(https?:\/\/|mailto:|tel:|\/|\.)/i.test(cleaned) ? cleaned : "https://" + cleaned;
}

function getFallbackRunSvgDataUri() {
  return FALLBACK_RUN_SVG_URI;
}

function getAssetType(filename) {
  if (!filename) return "file";
  const { baseToken } = splitAssetTokenAndThumb(filename);
  const trimmed = baseToken.trim();
  if (/^(app|embed)\s*:/i.test(trimmed)) return "itch";
  if (/^itch\s*:/i.test(trimmed) || /<iframe/i.test(trimmed) || /itch\.io\/embed/i.test(trimmed)) return "itch";
  if (/^(run|link|url)\s*:/i.test(trimmed)) return "link";

  const ext = getFileExtension(trimmed);
  if (ext === "html" || ext === "htm") return "itch";
  if (ext === "glb" || ext === "gltf") return "glb";
  if (ext === "stl") return "stl";
  if (["mp4", "webm", "mov", "m4v", "ogg", "ogv", "mkv", "avi"].includes(ext)) return "video";
  if (["mp3", "wav", "m4a", "flac", "aac"].includes(ext)) return "audio";
  if (ext === "pdf") return "pdf";
  if (ext === "heic" || ext === "heif") return "heic";
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

  const promise = (async () => {
    const res = await fetch(url);
    const blob = await res.blob();
    const converted = await heic2any({ blob, toType: "image/jpeg", quality: 0.88 });
    const finalBlob = Array.isArray(converted) ? converted[0] : converted;
    return URL.createObjectURL(finalBlob);
  })();

  heicBlobCache.set(url, promise);
  return promise;
}

function resolveKeySpec(rawToken) {
  const upper = String(rawToken || "").trim().toUpperCase();
  if (KEY_SPEC_MAP[upper]) return KEY_SPEC_MAP[upper];

  if (upper.length === 1) {
    const codeNum = upper.charCodeAt(0);
    return {
      tokenName: upper,
      label: upper,
      key: upper.toLowerCase(),
      code: /[0-9]/.test(upper) ? `Digit${upper}` : `Key${upper}`,
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
 * Expands control strings into 2D grid items.
 * Both `JOYSTICK` and `WASD` (or automatically detected W+A+S+D sets) become a single 1x1 WASD Joystick box.
 */
function expandVirtualKeysList(keysString) {
  if (!keysString || !keysString.trim()) return [];
  const entries = keysString.split(",").map((s) => s.trim()).filter(Boolean);
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

    if (upperKey === "WASD" || upperKey === "JOYSTICK" || upperKey === "STICK" || upperKey === "WASD_STICK") {
      rawButtons.push({
        ...resolveKeySpec("JOYSTICK"),
        desc: actionDesc || "Move",
        col: coordCol,
        row: coordRow
      });
    } else if (upperKey === "ARROWS" || upperKey === "ARROWKEYS") {
      [
        { dir: "UP", c: 2, r: 0 },
        { dir: "LEFT", c: 1, r: 1 },
        { dir: "DOWN", c: 2, r: 1 },
        { dir: "RIGHT", c: 3, r: 1 }
      ].forEach((item) => {
        rawButtons.push({ ...resolveKeySpec(item.dir), desc: actionDesc || "Move", col: item.c, row: item.r });
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

  // Automatically collapse separate W, A, S, D Move keys into a single 1x1 WASD Joystick item
  const moveWasdIndices = [];
  rawButtons.forEach((b, idx) => {
    if (
      ["W", "A", "S", "D"].includes(b.tokenName) &&
      (!b.desc || /^move$/i.test(b.desc.trim()))
    ) {
      moveWasdIndices.push(idx);
    }
  });

  if (moveWasdIndices.length === 4) {
    const firstWasd = rawButtons[moveWasdIndices[0]];
    const joyCol = firstWasd.col !== null ? firstWasd.col : 1;
    const joyRow = firstWasd.row !== null ? firstWasd.row : 0;
    const filtered = rawButtons.filter((_, idx) => !moveWasdIndices.includes(idx));
    filtered.unshift({
      ...resolveKeySpec("JOYSTICK"),
      desc: firstWasd.desc || "Move",
      col: joyCol,
      row: joyRow
    });
    rawButtons.length = 0;
    rawButtons.push(...filtered);
  }

  const occupied = new Set();
  rawButtons.forEach((b) => {
    if (b.col !== null && b.row !== null) occupied.add(`${b.col}:${b.row}`);
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
 * ============================================================================
 * PROPORTIONAL GAME & SIM VIEWPORT SCALER
 * ============================================================================
 */
function fitEmbeddedAppToStage() {
  const frame = document.getElementById("lightbox-itch-frame");
  const viewport = document.getElementById("lightbox-stage-viewport");
  if (!frame || !viewport || frame.style.display === "none") return;

  const availW = viewport.clientWidth || window.innerWidth * 0.94;
  const availH = viewport.clientHeight || window.innerHeight * 0.82;

  if (availW < 920) {
    const baseW = 1280;
    const baseH = 720;
    const scale = Math.min(availW / baseW, availH / baseH);

    frame.style.width = `${baseW}px`;
    frame.style.height = `${baseH}px`;
    frame.style.transform = `scale(${scale})`;
    frame.style.transformOrigin = "center center";
  } else {
    frame.style.width = "100%";
    frame.style.height = "100%";
    frame.style.transform = "none";
  }

  try {
    if (frame.contentWindow) {
      frame.contentWindow.dispatchEvent(new Event("resize"));
    }
  } catch (e) {}
}

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
      (evtName) => doc.addEventListener(evtName, blockRealPointerIfVirtualActive, true)
    );
  } catch (e) {}
}

function dispatchVirtualCursorToLightboxIframe(xRatio, yRatio, eventType = "mousemove", isPressed = false) {
  const frame = document.getElementById("lightbox-itch-frame");
  if (!frame || !frame.contentWindow) return;
  try {
    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    const target = (doc && (doc.querySelector("canvas") || doc.body || doc.documentElement)) || null;
    if (!target) return;

    const targetW = target.clientWidth || frame.clientWidth || 1280;
    const targetH = target.clientHeight || frame.clientHeight || 720;

    const clientX = xRatio * targetW;
    const clientY = yRatio * targetH;

    win.__azcoreVirtualCursorActive = true;
    if (typeof win.mouseX === "number") win.mouseX = clientX;
    if (typeof win.mouseY === "number") win.mouseY = clientY;
    if (typeof win.pmouseX === "number") win.pmouseX = clientX;
    if (typeof win.pmouseY === "number") win.pmouseY = clientY;
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
    const wrapRect = stageWrap.getBoundingClientRect();
    const frameRect =
      frame && frame.style.display !== "none" ? frame.getBoundingClientRect() : wrapRect;

    const frameOffsetLeft = frameRect.left - wrapRect.left;
    const frameOffsetTop = frameRect.top - wrapRect.top;
    const w = frameRect.width || stageWrap.clientWidth || 800;
    const h = frameRect.height || stageWrap.clientHeight || 600;

    cursorEl.style.left = `${frameOffsetLeft + lightboxVirtualCursorState.xRatio * w}px`;
    cursorEl.style.top = `${frameOffsetTop + lightboxVirtualCursorState.yRatio * h}px`;

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

  let startX = 0, startY = 0, grabOffsetX = 0, grabOffsetY = 0, moved = false;

  const onPointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    lightboxVirtualCursorState.isDragging = true;
    moved = false;
    const pt = e.touches ? e.touches[0] : e;
    startX = pt.clientX;
    startY = pt.clientY;

    const cursorRect = cursorEl.getBoundingClientRect();
    grabOffsetX = pt.clientX - (cursorRect.left + cursorRect.width / 2);
    grabOffsetY = pt.clientY - (cursorRect.top + cursorRect.height / 2);

    cursorEl.classList.add("dragging");
  };

  const onPointerMove = (e) => {
    if (!lightboxVirtualCursorState.isDragging) return;
    e.preventDefault();
    const pt = e.touches ? e.touches[0] : e;
    if (Math.hypot(pt.clientX - startX, pt.clientY - startY) > 5) moved = true;

    const rect =
      frame && frame.style.display !== "none"
        ? frame.getBoundingClientRect()
        : stageWrap.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    lightboxVirtualCursorState.xRatio = Math.max(0, Math.min(1, (pt.clientX - grabOffsetX - rect.left) / rect.width));
    lightboxVirtualCursorState.yRatio = Math.max(0, Math.min(1, (pt.clientY - grabOffsetY - rect.top) / rect.height));
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

function makeHudPopoverDraggable(popoverEl) {
  if (!popoverEl || popoverEl.dataset.dragBound === "true") return;
  popoverEl.dataset.dragBound = "true";

  let isDraggingHud = false, offsetX = 0, offsetY = 0;

  const onStart = (e) => {
    if (!e.target.closest(".keys-hud-drag-handle")) return;
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

    const newLeft = Math.max(4, Math.min(parentRect.width - popoverEl.offsetWidth - 4, pt.clientX - parentRect.left - offsetX));
    const newTop = Math.max(4, Math.min(parentRect.height - popoverEl.offsetHeight - 4, pt.clientY - parentRect.top - offsetY));

    popoverEl.style.left = `${Math.round(newLeft)}px`;
    popoverEl.style.top = `${Math.round(newTop)}px`;
  };

  const onEnd = () => { isDraggingHud = false; };

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
  if (!buttons.length) return "";

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
    <div class="keys-pad-grid" style="grid-template-columns: repeat(${colSpan}, minmax(58px, auto)); grid-template-rows: repeat(${rowSpan}, 58px);">
      ${buttons
        .map((b) => {
          const gridStyle = `grid-column: ${b.col - minCol + 1}; grid-row: ${b.row - minRow + 1};`;

          if (b.isJoystick) {
            return `
              <div
                role="slider"
                aria-label="WASD Joystick (${b.desc || "Move"})"
                tabindex="-1"
                class="virtual-key-btn vkey-joystick-box"
                style="${gridStyle}"
                data-joystick="true"
              >
                <span class="vjoy-dir vjoy-w">W</span>
                <span class="vjoy-dir vjoy-a">A</span>
                <span class="vjoy-dir vjoy-s">S</span>
                <span class="vjoy-dir vjoy-d">D</span>
                <div class="vjoy-base">
                  <div class="vjoy-stick"></div>
                </div>
              </div>
            `;
          }

          return `
            <div
              role="button"
              tabindex="-1"
              class="virtual-key-btn ${b.isCursorToggle ? "vkey-cursor-toggle" : ""}"
              style="${gridStyle}"
              data-key="${b.key}"
              data-code="${b.code}"
              data-keycode="${b.keyCode}"
              data-cursor-toggle="${b.isCursorToggle ? "true" : "false"}"
              data-mouse-click="${b.isMouseClick ? "true" : "false"}"
            >
              <span class="vkey-main">${b.isCursorToggle ? "+ " + b.label : b.label}</span>
              ${b.desc ? `<span class="vkey-sub">${b.desc}</span>` : ""}
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

/**
 * Binds the 1x1 WASD Joystick box so dragging inside it dispatches W/A/S/D keydown & keyup events
 */
function bindVirtualJoystick(joyEl) {
  if (!joyEl || joyEl.dataset.bound === "true") return;
  joyEl.dataset.bound = "true";

  const stickEl = joyEl.querySelector(".vjoy-stick");
  const activeDirs = new Set();
  let isDragging = false;
  let activeTouchId = null;
  let repeatTimer = null;

  function updateActiveDirections(nextDirs) {
    // Release any WASD keys no longer held
    for (const dir of Array.from(activeDirs)) {
      if (!nextDirs.has(dir)) {
        activeDirs.delete(dir);
        joyEl.classList.remove(`dir-${dir.toLowerCase()}`);
        triggerSyntheticKeyEvent("keyup", WASD_DIRECTION_SPECS[dir]);
      }
    }

    // Press any newly activated WASD keys
    for (const dir of nextDirs) {
      if (!activeDirs.has(dir)) {
        activeDirs.add(dir);
        joyEl.classList.add(`dir-${dir.toLowerCase()}`);
        triggerSyntheticKeyEvent("keydown", WASD_DIRECTION_SPECS[dir]);
      }
    }

    if (activeDirs.size > 0 && !repeatTimer) {
      repeatTimer = setInterval(() => {
        activeDirs.forEach((dir) => {
          triggerSyntheticKeyEvent("keydown", WASD_DIRECTION_SPECS[dir]);
        });
      }, 65);
    } else if (activeDirs.size === 0 && repeatTimer) {
      clearInterval(repeatTimer);
      repeatTimer = null;
    }
  }

  function handleMoveAtPoint(clientX, clientY) {
    const rect = joyEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxRadius = Math.max(12, Math.min(rect.width, rect.height) * 0.32);

    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    const clampedDist = Math.min(dist, maxRadius);
    const offsetX = Math.cos(angle) * clampedDist;
    const offsetY = Math.sin(angle) * clampedDist;

    if (stickEl) {
      stickEl.style.transform = `translate3d(${offsetX.toFixed(1)}px, ${offsetY.toFixed(1)}px, 0)`;
    }

    const deadzone = maxRadius * 0.28;
    const nextDirs = new Set();

    if (dist > deadzone) {
      const normX = dx / dist;
      const normY = dy / dist;
      // 8-way directional threshold (sin(22.5 deg) ≈ 0.38)
      if (normY < -0.38) nextDirs.add("W");
      if (normY > 0.38) nextDirs.add("S");
      if (normX < -0.38) nextDirs.add("A");
      if (normX > 0.38) nextDirs.add("D");
    }

    updateActiveDirections(nextDirs);
  }

  function resetJoystick() {
    isDragging = false;
    activeTouchId = null;
    joyEl.classList.remove("pressed");
    if (stickEl) {
      stickEl.style.transform = "translate3d(0px, 0px, 0)";
    }
    updateActiveDirections(new Set());
  }

  joyEl.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging = true;
    joyEl.classList.add("pressed");
    handleMoveAtPoint(e.clientX, e.clientY);
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging || activeTouchId !== null) return;
    e.preventDefault();
    handleMoveAtPoint(e.clientX, e.clientY);
  });

  window.addEventListener("mouseup", () => {
    if (!isDragging || activeTouchId !== null) return;
    resetJoystick();
  });

  joyEl.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const touch = e.changedTouches[0];
      if (!touch) return;
      isDragging = true;
      activeTouchId = touch.identifier;
      joyEl.classList.add("pressed");
      handleMoveAtPoint(touch.clientX, touch.clientY);
    },
    { passive: false }
  );

  window.addEventListener(
    "touchmove",
    (e) => {
      if (!isDragging || activeTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouchId) {
          e.preventDefault();
          handleMoveAtPoint(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
          break;
        }
      }
    },
    { passive: false }
  );

  const onTouchEnd = (e) => {
    if (!isDragging || activeTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchId) {
        resetJoystick();
        break;
      }
    }
  };

  window.addEventListener("touchend", onTouchEnd);
  window.addEventListener("touchcancel", onTouchEnd);
  joyEl.addEventListener("contextmenu", (e) => e.preventDefault());
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

  containerEl.querySelectorAll(".virtual-key-btn").forEach((btn) => {
    if (btn.dataset.bound === "true") return;

    if (btn.dataset.joystick === "true") {
      bindVirtualJoystick(btn);
      return;
    }

    btn.dataset.bound = "true";

    if (btn.dataset.cursorToggle === "true") {
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

    if (btn.dataset.mouseClick === "true") {
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
        if (e) { e.preventDefault(); e.stopPropagation(); }
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
      repeatTimer = setInterval(() => triggerSyntheticKeyEvent("keydown", spec), 65);
    };

    const endPress = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
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
    popover.style.display = popover.style.display === "block" ? "none" : "block";
  });

  popover.addEventListener("click", (e) => e.stopPropagation());

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
  linkEl.addEventListener("click", (e) => e.stopPropagation());

  outer.appendChild(linkEl);
  if (!isStackItem) attachKeysOverlayIfPresent(outer, projectKeys);
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

  loadImageSourceWithHeicSupport(asset.previewSrc || getFallbackRunSvgDataUri()).then((url) => {
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
  if (!isStackItem) attachKeysOverlayIfPresent(outer, projectKeys);
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

function verifyFileExistsFast(url) {
  if (verifiedUrlCache.has(url)) return verifiedUrlCache.get(url);

  const probePromise = (async () => {
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
  })();

  verifiedUrlCache.set(url, probePromise);
  return probePromise;
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

async function resolveFirstExistingCandidate(candidates) {
  for (const candidate of candidates) {
    if (await verifyFileExistsFast(candidate)) return candidate;
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
  const fullExts = [...new Set([".jpg", ".JPG", ".jpeg", originalExt, ".png", ".webp", ".heic", ".HEIC"])];

  const [previewUrl, fullUrl] = await Promise.all([
    resolveFirstExistingCandidate(previewExts.map((ext) => `${normBase}${normPrev}${baseName}${ext}`)),
    resolveFirstExistingCandidate(fullExts.map((ext) => `${normBase}${normFull}${baseName}${ext}`))
  ]);

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
 * 3. UNIFIED 3D ENGINE (FIXED CONTAINER SIZING & MOBILE OVERFLOW)
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
            modelCache.delete(modelCache.keys().next().value);
          }
          modelCache.set(url, wrapper);
          resolve(wrapper.clone(true));
        },
        undefined,
        reject
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
            modelCache.delete(modelCache.keys().next().value);
          }
          modelCache.set(url, wrapper);
          resolve(wrapper.clone(true));
        },
        undefined,
        reject
      );
    }
  });
}

function mountAutoRotating3DPreview(container, modelUrl, type) {
  const badge = document.createElement("div");
  badge.className = "stl-badge-overlay";
  badge.textContent = `3D ${type.toUpperCase()} // TAP TO ORBIT`;
  container.appendChild(badge);

  let scene = null,
    camera = null,
    renderer = null,
    modelGroup = null,
    isVisible = false,
    animFrameId = null,
    isLoadingModel = false;

  function resizeRenderer() {
    if (!renderer || !camera) return;
    const rect = container.getBoundingClientRect();
    const w = Math.max(100, Math.floor(rect.width || container.clientWidth || 300));
    const h = Math.max(100, Math.floor(rect.height || container.clientHeight || 260));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  function animate() {
    if (!isVisible || !renderer) return;
    animFrameId = requestAnimationFrame(animate);
    if (modelGroup) modelGroup.rotation.y += 0.008;
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
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.display = "block";
        container.appendChild(renderer.domElement);

        scene.add(new THREE.HemisphereLight(0xffffff, 0x222830, 0.45));

        const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.45);
        dirLight1.position.set(65, 90, 75);
        scene.add(dirLight1);

        const grid = new THREE.GridHelper(120, 12, 0xd92804, 0x4b555d);
        grid.position.y = -28;
        scene.add(grid);

        modelGroup = obj;
        scene.add(modelGroup);
        camera.position.set(58, 40, 80);
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
        } else if (IS_MOBILE) {
          destroyContext();
        } else if (animFrameId) {
          cancelAnimationFrame(animFrameId);
          animFrameId = null;
        }
      });
    },
    { threshold: 0.05 }
  );
  observer.observe(container);

  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(() => {
      if (isVisible) resizeRenderer();
    });
    ro.observe(container);
  } else {
    window.addEventListener("resize", () => { if (isVisible) resizeRenderer(); }, { passive: true });
  }
}

/**
 * ============================================================================
 * 4. TAB 1: RENDER ABOUT ME
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

  const normAboutFolder = normalizeFolder(cfg.folder);
  const resumePath = cfg.resume.file.startsWith("http")
    ? cfg.resume.file
    : `${normAboutFolder}${cfg.resume.file}`;

  const navResumeTab = document.getElementById("nav-resume-tab");
  if (navResumeTab) navResumeTab.href = resumePath;

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
            .map((item) =>
              item === "new-row"
                ? `<div class="skill-row-break"></div>`
                : `<span class="skill-tag">${item}</span>`
            )
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

  const profileImg = document.getElementById("about-profile-img");

  (async () => {
    const resolvedProfile =
      (await resolveValidUrlWithCaseFallback(normAboutFolder, cfg.profileImage)) ||
      (await resolveValidUrlWithCaseFallback(normAboutFolder, "profile.jpg")) ||
      (await resolveValidUrlWithCaseFallback(normAboutFolder, "profile.png")) ||
      (await resolveValidUrlWithCaseFallback(normAboutFolder, "profile.heic"));

    if (resolvedProfile) {
      profileImg.src = await loadImageSourceWithHeicSupport(resolvedProfile);
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
  })();

  profileImg.addEventListener("click", () => {
    openLightbox(
      [
        {
          type: "image",
          file: cfg.profileImage,
          previewSrc: profileImg.src,
          fullSrc: profileImg.src,
          caption: cfg.name
        }
      ],
      0
    );
  });
}

/**
 * ============================================================================
 * 5. TAB 2: STREAMING / INCREMENTAL PROJECT SYSTEM
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
    if (thumbFile) data.assignedThumbFiles.add(thumbFile.toLowerCase());
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
        data.runLinks.push(`run:${normalizeExternalUrl(rawLink)}${thumbFile ? "|thumb=" + thumbFile : ""}`);
      }
    } else if (/^MAIN(_IMAGE|_STL|_MODEL|_GLB|_VIDEO|_FILE|_ITCH|_LINK|_APP)?\s*:/i.test(line)) {
      inDescription = false;
      const rawMain = line
        .replace(/^MAIN(_IMAGE|_STL|_MODEL|_GLB|_VIDEO|_FILE|_ITCH|_LINK|_APP)?\s*:\s*/i, "")
        .trim();
      registerThumbIfPresent(rawMain);
      const { thumbFile } = splitAssetTokenAndThumb(rawMain);
      if (/^<iframe/i.test(rawMain) || /itch\.io\/embed/i.test(rawMain)) {
        data.mainAsset = `itch:${extractItchEmbedUrl(rawMain)}${thumbFile ? "|thumb=" + thumbFile : ""}`;
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
    if (!data.assets.some((a) => splitAssetTokenAndThumb(a).baseToken.toLowerCase() === tBase)) {
      data.assets.push(token);
    }
  });

  if (data.mainAsset) {
    const mainBase = splitAssetTokenAndThumb(data.mainAsset).baseToken.toLowerCase();
    data.assets = [
      data.mainAsset,
      ...data.assets.filter((a) => splitAssetTokenAndThumb(a).baseToken.toLowerCase() !== mainBase)
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

async function resolveInteractiveCoverUrl(projFolder, thumbFile, fallbackNames) {
  if (thumbFile) {
    const customThumbUrl = await resolveValidUrlWithCaseFallback(projFolder, thumbFile);
    if (customThumbUrl) return customThumbUrl;
  }
  for (const name of fallbackNames) {
    const found = await resolveValidUrlWithCaseFallback(projFolder, name);
    if (found) return found;
  }
  return getFallbackRunSvgDataUri();
}

async function resolveProjectAsset(projFolder, rawToken) {
  const { baseToken, thumbFile } = splitAssetTokenAndThumb(rawToken);
  const isLocalHtmlApp = /^(app|embed)\s*:/i.test(baseToken) || /\.html?$/i.test(baseToken);
  const assetType = getAssetType(baseToken);

  if (assetType === "link") {
    const targetUrl = normalizeExternalUrl(baseToken);
    const runImgUrl = await resolveInteractiveCoverUrl(projFolder, thumbFile, [
      "run.webp",
      "run.png",
      "run.jpg"
    ]);

    return {
      type: "link",
      file: thumbFile || "WEB APP",
      previewSrc: runImgUrl,
      fullSrc: runImgUrl,
      targetUrl
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

    const optionalCover = await resolveInteractiveCoverUrl(projFolder, thumbFile, [
      "run.webp",
      "itch.webp",
      "cover.webp"
    ]);

    return {
      type: "itch",
      file: isLocalHtmlApp ? "WEB APP" : "ITCH.IO GAME",
      previewSrc: optionalCover,
      fullSrc: embedUrl,
      embedUrl
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

async function fetchSingleProjectFolder(normBase, folderName, textFileName) {
  const projFolder = `${normBase}${folderName}/`;
  const txtUrl = `${projFolder}${textFileName}`;

  try {
    const res = await fetch(txtUrl, { cache: "default" });
    if (!res.ok) return null;
    if ((res.headers.get("content-type") || "").includes("text/html")) return null;

    const rawText = await res.text();
    if (!rawText || !rawText.trim()) return null;

    const parsed = parseProjectTextFile(rawText, projFolder);
    if (!parsed.title && parsed.assets.length === 0) return null;

    const resolvedList = await runInBatches(parsed.assets, 6, (file) =>
      resolveProjectAsset(projFolder, file)
    );

    const verifiedAssets = resolvedList.filter(Boolean);
    if (!verifiedAssets.length) return null;

    parsed.verifiedAssets = verifiedAssets;
    return parsed;
  } catch (e) {
    return null;
  }
}

function createProjectCardElement(proj, idx) {
  const card = document.createElement("article");
  card.className = "project-card stream-in-item";
  const drawerId = `drawer-proj-${idx}`;
  const mainAsset = proj.verifiedAssets[0];
  const stackPreview = proj.verifiedAssets.slice(0, 3);
  const isImageMain = isImageAsset(mainAsset.type);

  const stackVisualHtml = stackPreview
    .map((item) => {
      if (is3DAsset(item.type)) {
        return `<div class="stack-card-3d">[3D ${item.type.toUpperCase()}]</div>`;
      }
      if (item.type === "itch" || item.type === "link") {
        return `<img class="stack-card-img" src="${item.previewSrc}" loading="lazy" decoding="async" alt="Run preview" />`;
      }
      if (item.type === "image" || item.type === "heic") {
        return `<img class="stack-card-img" src="${item.previewSrc}" loading="lazy" decoding="async" alt="Stack preview" />`;
      }
      const ext = getFileExtension(item.file).toUpperCase() || item.type.toUpperCase();
      return `<div class="stack-card-badge">[${ext}]</div>`;
    })
    .join("");

  card.innerHTML = `
    <div class="project-top-layout">
      <div class="project-main-stage-cell">
        <div class="project-main-img-wrap ${isImageMain ? "is-image-wrap" : "is-interactive-wrap"}" id="main-wrap-${idx}"></div>
      </div>

      <div class="project-info-col">
        <div>
          <div class="project-code">${proj.code}</div>
          <h2 class="project-title">${proj.title}</h2>
          <p class="project-desc">${proj.description}</p>
          <div class="project-tags">
            ${proj.tags.map((t) => `<span class="skill-tag">${t}</span>`).join("")}
          </div>
        </div>

        <div class="photo-stack-trigger" role="button" tabindex="0" aria-expanded="false">
          <span class="corner-tick tl"></span>
          <span class="corner-tick tr"></span>
          <span class="corner-tick bl"></span>
          <span class="corner-tick br"></span>
          <div class="stack-visual">${stackVisualHtml}</div>
          <div class="stack-meta">
            <span class="stack-title">// PROJECT MEDIA STACK [${proj.verifiedAssets.length}]</span>
            <span class="stack-subtitle">TAP TO EXPAND GALLERY &#8595;</span>
          </div>
        </div>
      </div>
    </div>

    <div id="${drawerId}" class="project-expanded-drawer">
      <div class="project-gallery-grid"></div>
    </div>
  `;

  const lightboxList = proj.verifiedAssets.map((asset) => ({
    type: asset.type,
    file: asset.file,
    previewSrc: asset.previewSrc,
    fullSrc: asset.fullSrc,
    embedUrl: asset.embedUrl,
    targetUrl: asset.targetUrl,
    keys: proj.keys
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

    const drawerFrag = document.createDocumentFragment();

    proj.verifiedAssets.forEach((asset, assetIdx) => {
      const itemWrap = document.createElement("div");
      itemWrap.className = "project-gallery-item";

      if (is3DAsset(asset.type)) {
        const box3d = document.createElement("div");
        box3d.className = "stl-preview-container";
        if (IS_MOBILE) {
          box3d.style.display = "flex";
          box3d.style.alignItems = "center";
          box3d.style.justifyContent = "center";
          box3d.innerHTML = `<div class="stl-badge-overlay" style="position:static;">TAP TO OPEN 3D ${asset.type.toUpperCase()}</div>`;
          itemWrap.appendChild(box3d);
        } else {
          itemWrap.appendChild(box3d);
          mountAutoRotating3DPreview(box3d, asset.fullSrc, asset.type);
        }
        itemWrap.addEventListener("click", () => openLightbox(lightboxList, assetIdx));
      } else if (asset.type === "link") {
        itemWrap.appendChild(createRunLinkCard(asset, proj.keys, true));
      } else if (asset.type === "itch") {
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

      drawerFrag.appendChild(itemWrap);
    });

    galleryGrid.appendChild(drawerFrag);
  }

  const stackTrigger = card.querySelector(".photo-stack-trigger");
  const subtitleEl = stackTrigger.querySelector(".stack-subtitle");
  const drawer = card.querySelector(`#${drawerId}`);

  stackTrigger.addEventListener("click", () => {
    populateDrawerGrid();
    const isOpen = drawer.classList.toggle("open");
    stackTrigger.setAttribute("aria-expanded", String(isOpen));
    if (subtitleEl) {
      subtitleEl.innerHTML = isOpen
        ? "TAP TO COLLAPSE GALLERY &#8593;"
        : "TAP TO EXPAND GALLERY &#8595;";
    }
  });

  return card;
}

async function loadAndRenderProjects() {
  if (projectsLoaded) return;
  if (projectsLoadingPromise) return projectsLoadingPromise;

  projectsLoadingPromise = (async () => {
    const container = document.getElementById("projects-container");
    const countBadge = document.getElementById("projects-count-badge");
    const { baseFolder, textFileName, foldersToCheck } = PORTFOLIO_CONFIG.projectsConfig;
    const normBase = normalizeFolder(baseFolder);

    container.innerHTML = "";
    countBadge.textContent = "STREAMING PROJECTS...";

    const slots = foldersToCheck.map(() => {
      const slot = document.createElement("div");
      slot.className = "project-stream-slot";
      container.appendChild(slot);
      return slot;
    });

    let loadedCount = 0;

    await Promise.all(
      foldersToCheck.map(async (folderName, idx) => {
        const proj = await fetchSingleProjectFolder(normBase, folderName, textFileName);
        if (!proj) {
          slots[idx].remove();
          return;
        }
        loadedCount++;
        countBadge.textContent = `LOADED: ${loadedCount} PROJECT${loadedCount === 1 ? "" : "S"}`;
        const cardEl = createProjectCardElement(proj, idx);
        slots[idx].replaceWith(cardEl);
      })
    );

    if (loadedCount === 0) {
      container.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-state-title">// 0 PROJECT TEXT FILES DETECTED</div>
          <div class="empty-state-desc">
            No valid <code>project.txt</code> files with linked assets were found inside <code>${normBase}</code>.
          </div>
        </div>
      `;
    }

    projectsLoaded = true;
  })();

  return projectsLoadingPromise;
}

/**
 * ============================================================================
 * 6. TAB 3: STREAMING DUAL-SET PHOTOGRAPHY ENGINE
 * ============================================================================
 */
let photographyLoaded = false;
let photographyLoadingPromise = null;
let sharedSamplerCtx = null;

function cacheSingleImageColorOnce(img, card) {
  if (card.dataset.colorCached === "true") return;
  try {
    if (!sharedSamplerCtx) {
      const canvas = document.getElementById("color-sampler-canvas");
      if (!canvas) return;
      sharedSamplerCtx = canvas.getContext("2d", { willReadFrequently: true });
    }
    sharedSamplerCtx.clearRect(0, 0, 24, 24);
    sharedSamplerCtx.drawImage(img, 0, 0, 24, 24);
    const data = sharedSamplerCtx.getImageData(0, 0, 24, 24).data;

    let r = 0, g = 0, b = 0, count = 0;
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

async function discoverAndStreamPhotographyAssets(onPhotoDiscovered) {
  const { folder, previewSubfolder, fullSubfolder, maxNumberedProbe } =
    PORTFOLIO_CONFIG.photographyConfig;
  const normFolder = normalizeFolder(folder);
  const discoveredItems = [];
  const seenNames = new Set();

  try {
    const txtRes = await fetch(`${normFolder}photos.txt`, { cache: "default" });
    if (txtRes.ok && !(txtRes.headers.get("content-type") || "").includes("text/html")) {
      const text = await txtRes.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

      await runInBatches(lines, 6, async (fileName) => {
        if (seenNames.has(fileName)) return null;
        const dual = await resolveDualImageUrls(
          normFolder,
          previewSubfolder,
          fullSubfolder,
          fileName
        );
        if (dual && !seenNames.has(fileName)) {
          seenNames.add(fileName);
          const item = { fileName, ...dual };
          discoveredItems.push(item);
          if (onPhotoDiscovered) onPhotoDiscovered(item, discoveredItems.length - 1);
        }
        return dual;
      });
    }
  } catch (e) {}

  if (discoveredItems.length === 0) {
    const indices = Array.from({ length: maxNumberedProbe }, (_, i) => i + 1);
    await runInBatches(indices, 6, async (i) => {
      const pad = String(i).padStart(2, "0");
      const candidateNames = [
        `Image (${i}).webp`,
        `Image (${i}).jpg`,
        `${pad}.webp`,
        `${pad}.jpg`,
        `${i}.webp`,
        `${i}.jpg`
      ];
      for (const fileName of candidateNames) {
        if (seenNames.has(fileName)) continue;
        const dual = await resolveDualImageUrls(
          normFolder,
          previewSubfolder,
          fullSubfolder,
          fileName
        );
        if (dual) {
          seenNames.add(fileName);
          const item = { fileName, ...dual };
          discoveredItems.push(item);
          if (onPhotoDiscovered) onPhotoDiscovered(item, discoveredItems.length - 1);
          break;
        }
      }
    });
  }

  return discoveredItems;
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

    grid.innerHTML = "";
    grid.style.display = "grid";
    countBadge.textContent = "STREAMING GALLERY...";

    const lightboxItems = [];

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
      { rootMargin: IS_MOBILE ? "220px 0px" : "450px 0px" }
    );

    function appendSinglePhotoCard(item, idx) {
      const lbEntry = {
        type: getAssetType(item.fullUrl),
        file: item.fileName,
        previewSrc: item.previewUrl,
        fullSrc: item.fullUrl
      };
      lightboxItems.push(lbEntry);

      countBadge.textContent = `FOLDER COUNT: ${lightboxItems.length} IMAGE${
        lightboxItems.length === 1 ? "" : "S"
      }`;

      const card = document.createElement("div");
      card.className = "insta-card stream-in-item";

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
      card.addEventListener("click", () => openLightbox(lightboxItems, idx));

      grid.appendChild(card);
      lazyObserver.observe(card);
    }

    const photoItems = await discoverAndStreamPhotographyAssets(appendSinglePhotoCard);

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
    }

    photographyLoaded = true;
  })();

  return photographyLoadingPromise;
}

/**
 * ============================================================================
 * 7. INSTANT CACHED AVERAGE COLOR ENGINE
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
}

function updatePhotographyAverageColor() {
  if (currentTabIndex !== 2) return;

  const cards = document.querySelectorAll(".insta-card[data-color-cached='true']");
  if (!cards.length) return;

  let totalR = 0, totalG = 0, totalB = 0, counted = 0;
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

    const bgLayer = document.getElementById("bg-canvas-layer");
    if (bgLayer) {
      bgLayer.style.backgroundColor = `rgb(${avgR}, ${avgG}, ${avgB})`;
      bgLayer.style.backgroundImage = `radial-gradient(circle at 50% 30%, rgba(${Math.min(
        255,
        avgR + 45
      )}, ${Math.min(255, avgG + 45)}, ${Math.min(255, avgB + 45)}, 0.38), rgba(18, 21, 24, 0.88))`;
    }
  }
}

/**
 * ============================================================================
 * 8. TAB NAVIGATION
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
 * 9. UNIVERSAL LIGHTBOX, IMAGE ZOOM/PAN & VIRTUAL CROSSHAIR CURSOR
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

function applyLightboxImageTransform() {
  const imgEl = document.getElementById("lightbox-img");
  if (!imgEl) return;

  if (lightboxZoomState.scale <= 1.01) {
    lightboxZoomState.scale = 1;
    lightboxZoomState.panX = 0;
    lightboxZoomState.panY = 0;
  } else {
    const maxPanX = ((imgEl.clientWidth || 300) * (lightboxZoomState.scale - 1)) / 2;
    const maxPanY = ((imgEl.clientHeight || 300) * (lightboxZoomState.scale - 1)) / 2;
    lightboxZoomState.panX = Math.max(-maxPanX, Math.min(maxPanX, lightboxZoomState.panX));
    lightboxZoomState.panY = Math.max(-maxPanY, Math.min(maxPanY, lightboxZoomState.panY));
  }

  imgEl.style.transform = `translate3d(${lightboxZoomState.panX}px, ${lightboxZoomState.panY}px, 0) scale(${lightboxZoomState.scale})`;
  imgEl.classList.toggle("is-zoomed", lightboxZoomState.scale > 1);
  imgEl.classList.toggle("is-panning", lightboxZoomState.isPanning);

  const resetZoomBtn = document.getElementById("lightbox-zoom-reset-btn");
  if (resetZoomBtn) {
    resetZoomBtn.textContent = `${Math.round(lightboxZoomState.scale * 100)}%`;
  }
}

function resetLightboxImageZoom() {
  lightboxZoomState.scale = 1;
  lightboxZoomState.panX = 0;
  lightboxZoomState.panY = 0;
  lightboxZoomState.isPanning = false;
  applyLightboxImageTransform();
}

function adjustLightboxZoom(deltaScale) {
  const nextScale = Math.max(
    lightboxZoomState.minScale,
    Math.min(lightboxZoomState.maxScale, +(lightboxZoomState.scale + deltaScale).toFixed(2))
  );
  lightboxZoomState.scale = nextScale;
  applyLightboxImageTransform();
}

function setupLightboxImageZoomPan() {
  const imgEl = document.getElementById("lightbox-img");
  const zoomInBtn = document.getElementById("lightbox-zoom-in-btn");
  const zoomOutBtn = document.getElementById("lightbox-zoom-out-btn");
  const zoomResetBtn = document.getElementById("lightbox-zoom-reset-btn");

  if (!imgEl || imgEl.dataset.zoomBound === "true") return;
  imgEl.dataset.zoomBound = "true";

  if (zoomInBtn) {
    zoomInBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      adjustLightboxZoom(0.5);
    });
  }
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      adjustLightboxZoom(-0.5);
    });
  }
  if (zoomResetBtn) {
    zoomResetBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      resetLightboxImageZoom();
    });
  }

  imgEl.addEventListener(
    "wheel",
    (e) => {
      if (imgEl.style.display === "none") return;
      e.preventDefault();
      e.stopPropagation();
      const step = e.deltaY < 0 ? 0.35 : -0.35;
      adjustLightboxZoom(step);
    },
    { passive: false }
  );

  imgEl.addEventListener("dblclick", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (lightboxZoomState.scale > 1) {
      resetLightboxImageZoom();
    } else {
      lightboxZoomState.scale = 2.5;
      applyLightboxImageTransform();
    }
  });

  imgEl.addEventListener("mousedown", (e) => {
    if (lightboxZoomState.scale <= 1) return;
    e.preventDefault();
    e.stopPropagation();
    lightboxZoomState.isPanning = true;
    lightboxZoomState.startX = e.clientX - lightboxZoomState.panX;
    lightboxZoomState.startY = e.clientY - lightboxZoomState.panY;
    applyLightboxImageTransform();
  });

  window.addEventListener("mousemove", (e) => {
    if (!lightboxZoomState.isPanning) return;
    e.preventDefault();
    lightboxZoomState.panX = e.clientX - lightboxZoomState.startX;
    lightboxZoomState.panY = e.clientY - lightboxZoomState.startY;
    applyLightboxImageTransform();
  });

  window.addEventListener("mouseup", () => {
    if (!lightboxZoomState.isPanning) return;
    lightboxZoomState.isPanning = false;
    applyLightboxImageTransform();
  });

  imgEl.addEventListener(
    "touchstart",
    (e) => {
      if (imgEl.style.display === "none") return;
      if (e.touches.length === 2) {
        e.preventDefault();
        e.stopPropagation();
        lightboxZoomState.isPanning = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lightboxZoomState.initialPinchDist = Math.hypot(dx, dy);
        lightboxZoomState.initialPinchScale = lightboxZoomState.scale;
      } else if (e.touches.length === 1) {
        const now = Date.now();
        if (now - lightboxZoomState.lastTapTime < 280) {
          e.preventDefault();
          e.stopPropagation();
          if (lightboxZoomState.scale > 1) {
            resetLightboxImageZoom();
          } else {
            lightboxZoomState.scale = 2.5;
            applyLightboxImageTransform();
          }
          lightboxZoomState.lastTapTime = 0;
          return;
        }
        lightboxZoomState.lastTapTime = now;

        if (lightboxZoomState.scale > 1) {
          e.preventDefault();
          e.stopPropagation();
          lightboxZoomState.isPanning = true;
          lightboxZoomState.startX = e.touches[0].clientX - lightboxZoomState.panX;
          lightboxZoomState.startY = e.touches[0].clientY - lightboxZoomState.panY;
        }
      }
    },
    { passive: false }
  );

  imgEl.addEventListener(
    "touchmove",
    (e) => {
      if (imgEl.style.display === "none") return;
      if (e.touches.length === 2 && lightboxZoomState.initialPinchDist > 0) {
        e.preventDefault();
        e.stopPropagation();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const ratio = dist / lightboxZoomState.initialPinchDist;
        lightboxZoomState.scale = Math.max(
          lightboxZoomState.minScale,
          Math.min(lightboxZoomState.maxScale, lightboxZoomState.initialPinchScale * ratio)
        );
        applyLightboxImageTransform();
      } else if (e.touches.length === 1 && lightboxZoomState.isPanning && lightboxZoomState.scale > 1) {
        e.preventDefault();
        e.stopPropagation();
        lightboxZoomState.panX = e.touches[0].clientX - lightboxZoomState.startX;
        lightboxZoomState.panY = e.touches[0].clientY - lightboxZoomState.startY;
        applyLightboxImageTransform();
      }
    },
    { passive: false }
  );

  imgEl.addEventListener("touchend", (e) => {
    if (e.touches.length < 2) {
      lightboxZoomState.initialPinchDist = 0;
    }
    if (e.touches.length === 0) {
      lightboxZoomState.isPanning = false;
      applyLightboxImageTransform();
    }
  });
}

function preventBackgroundScroll(e) {
  if (
    e.target &&
    (e.target.closest("#lightbox-3d-stage") ||
      e.target.closest(".keys-hud-popover") ||
      e.target.closest("#lightbox-img"))
  ) {
    return;
  }
  e.preventDefault();
}

function resizeLightbox3D() {
  if (!lbRenderer || !lbCamera) return;
  const stage = document.getElementById("lightbox-3d-stage");
  if (!stage || stage.style.display === "none") return;
  const rect = stage.getBoundingClientRect();
  const w = Math.max(200, Math.floor(rect.width || window.innerWidth * 0.9));
  const h = Math.max(200, Math.floor(rect.height || window.innerHeight * 0.78));
  lbCamera.aspect = w / h;
  lbCamera.updateProjectionMatrix();
  lbRenderer.setSize(w, h, false);
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
    lbRenderer.domElement.style.width = "100%";
    lbRenderer.domElement.style.height = "100%";
    lbRenderer.domElement.style.display = "block";
    stage.appendChild(lbRenderer.domElement);

    lbControls = new THREE.OrbitControls(lbCamera, lbRenderer.domElement);
    lbControls.enableDamping = true;
    lbControls.dampingFactor = 0.06;

    lbScene.add(new THREE.HemisphereLight(0xffffff, 0x222830, 0.45));

    const dir1 = new THREE.DirectionalLight(0xffffff, 0.45);
    dir1.position.set(100, 140, 120);
    lbScene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0xffffff, 0.15);
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

  resizeLightbox3D();

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
      resizeLightbox3D();
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
  const contentWrapper = document.getElementById("lightbox-content-wrapper");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  if (contentWrapper) contentWrapper.classList.remove("is-app-mode");

  activeFullImageRequestToken++;
  resetLightboxImageZoom();
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
    itchFrame.style.transform = "none";
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
    item.file || "Project Asset";
  document.getElementById("lightbox-generic-desc").textContent =
    message || "Preview not available in browser for this file format.";
  genericStage.style.display = "flex";
}

function updateLightboxSlide() {
  if (!currentLightboxList.length) return;
  const item = currentLightboxList[currentLightboxIndex];
  const requestToken = ++activeFullImageRequestToken;

  const contentWrapper = document.getElementById("lightbox-content-wrapper");
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
  const zoomControls = document.getElementById("lightbox-zoom-controls");
  const loaderOverlay = document.getElementById("lightbox-loader");
  const loaderText = document.getElementById("lightbox-loader-text");

  const isFullAppOr3D = item.type === "itch" || is3DAsset(item.type) || item.type === "pdf";
  if (contentWrapper) {
    contentWrapper.classList.toggle("is-app-mode", isFullAppOr3D);
  }

  imgEl.style.display = "none";
  videoEl.style.display = "none";
  audioStage.style.display = "none";
  stage3d.style.display = "none";
  if (itchFrame) {
    itchFrame.src = "";
    itchFrame.style.display = "none";
    itchFrame.style.transform = "none";
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
  if (zoomControls) zoomControls.style.display = "none";
  loaderOverlay.style.display = "none";

  resetLightboxImageZoom();
  setupLightboxImageZoomPan();

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
    requestAnimationFrame(() => initOrUpdateLightbox3D(item.fullSrc, item.type));
  } else if (item.type === "itch") {
    itchFrame.style.display = "block";
    itchFrame.src = item.embedUrl || item.fullSrc;
    requestAnimationFrame(() => fitEmbeddedAppToStage());

    itchFrame.onload = () => {
      try {
        fitEmbeddedAppToStage();
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
    if (zoomControls) zoomControls.style.display = "inline-flex";

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
 * 10. INITIALIZATION & PROGRESSIVE STREAMING BOOT
 * ============================================================================
 */
window.addEventListener("DOMContentLoaded", () => {
  renderAboutSection();
  document.getElementById("page-loader").classList.add("loaded");
  document.body.classList.add("page-ready");

  if (!IS_MOBILE) {
    const startDeferredBackgroundLoading = () => {
      loadAndRenderProjects();
      loadAndRenderPhotography();
    };

    if ("requestIdleCallback" in window) {
      requestIdleCallback(startDeferredBackgroundLoading, { timeout: 1500 });
    } else {
      setTimeout(startDeferredBackgroundLoading, 600);
    }
  }

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
      if (!e.target.closest(".site-header")) closeMobileMenu();
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

  const sidePrevBtn = document.getElementById("side-nav-prev");
  const sideNextBtn = document.getElementById("side-nav-next");

  sidePrevBtn.addEventListener("click", (e) => {
    e.currentTarget.blur();
    switchTab((currentTabIndex - 1 + TABS.length) % TABS.length);
  });

  sideNextBtn.addEventListener("click", (e) => {
    e.currentTarget.blur();
    switchTab((currentTabIndex + 1) % TABS.length);
  });

  window.addEventListener(
    "scroll",
    () => { if (currentTabIndex === 2) scheduleAverageColorUpdate(); },
    { passive: true }
  );

  window.addEventListener(
    "resize",
    () => {
      if (currentTabIndex === 2) scheduleAverageColorUpdate();
      const lightboxModal = document.getElementById("lightbox-modal");
      if (lightboxModal && lightboxModal.classList.contains("open")) {
        fitEmbeddedAppToStage();
        resizeLightbox3D();
        updateLightboxVirtualCursorVisibilityAndPosition();
      }
    },
    { passive: true }
  );

  const lightboxModal = document.getElementById("lightbox-modal");
  lightboxModal.addEventListener("click", (e) => {
    if (e.target === lightboxModal || e.target.id === "lightbox-stage-viewport") {
      closeLightbox();
    }
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

  const lbKeysBtn = document.getElementById("lightbox-keys-btn");
  const lbKeysPopover = document.getElementById("lightbox-keys-popover");
  if (lbKeysBtn && lbKeysPopover) {
    lbKeysBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const nowOpen = lbKeysPopover.style.display !== "block";
      lbKeysPopover.style.display = nowOpen ? "block" : "none";
      lightboxVirtualCursorState.controlsActive = nowOpen;
      if (!nowOpen) lightboxVirtualCursorState.enabled = false;
      updateLightboxVirtualCursorVisibilityAndPosition();
    });
    lbKeysPopover.addEventListener("click", (e) => e.stopPropagation());
  }

  window.addEventListener("keydown", (e) => {
    if (lightboxModal.classList.contains("open")) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") stepLightbox(-1);
      if (e.key === "ArrowRight") stepLightbox(1);
      if (e.key === "+" || e.key === "=") adjustLightboxZoom(0.5);
      if (e.key === "-" || e.key === "_") adjustLightboxZoom(-0.5);
      if (e.key === "0") resetLightboxImageZoom();
    }
  });
});