/**
 * ============================================================================
 * js/utils-3d.js — FILE HELPERS, 2D GRID CONTROLS, 1x1 JOYSTICK & 3D ENGINE
 * ============================================================================
 * Load order in index.html:
 *   1. js/utils-3d.js (this file)
 *   2. js/projects.js
 *   3. js/photo-lightbox.js
 *   4. script.js
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
  "↑": { tokenName: "UP", label: "↑", key: "ArrowUp", keyCode: 38 },
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

window.lightboxVirtualCursorState = lightboxVirtualCursorState;

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
  const cols = typeof GRID_COLS !== "undefined" ? GRID_COLS : 8;
  const rows = typeof GRID_ROWS !== "undefined" ? GRID_ROWS : 4;

  const entries = keysString.split(",").map((s) => s.trim()).filter(Boolean);
  const rawButtons = [];

  entries.forEach((entry) => {
    let coordCol = null;
    let coordRow = null;
    let cleanEntry = entry;

    const coordMatch = entry.match(/@(\d+)\s*[:x,]\s*(\d+)$/i);
    if (coordMatch) {
      coordCol = Math.max(0, Math.min(cols - 1, parseInt(coordMatch[1], 10)));
      coordRow = Math.max(0, Math.min(rows - 1, parseInt(coordMatch[2], 10)));
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
        if (nextCol >= cols) {
          nextCol = 0;
          nextRow = Math.min(rows - 1, nextRow + 1);
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
 * PROPORTIONAL GAME & SIM VIEWPORT SCALER + VIRTUAL CURSOR
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

function bindVirtualJoystick(joyEl) {
  if (!joyEl || joyEl.dataset.bound === "true") return;
  joyEl.dataset.bound = "true";

  const stickEl = joyEl.querySelector(".vjoy-stick");
  const activeDirs = new Set();
  let isDragging = false;
  let activeTouchId = null;
  let repeatTimer = null;

  function updateActiveDirections(nextDirs) {
    for (const dir of Array.from(activeDirs)) {
      if (!nextDirs.has(dir)) {
        activeDirs.delete(dir);
        joyEl.classList.remove(`dir-${dir.toLowerCase()}`);
        triggerSyntheticKeyEvent("keyup", WASD_DIRECTION_SPECS[dir]);
      }
    }

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
 * UNIFIED 3D ENGINE (STL / GLB WITH DRACO & RESPONSIVE PREVIEW)
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

  const isMobileDevice = typeof IS_MOBILE !== "undefined" ? IS_MOBILE : false;

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

          if (isMobileDevice && modelCache.size >= 2) {
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

          if (isMobileDevice && modelCache.size >= 2) {
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
  badge.textContent = `3D ${type.toUpperCase()} // TAP TO INSPECT`;
  container.appendChild(badge);

  const isMobileDevice = typeof IS_MOBILE !== "undefined" ? IS_MOBILE : false;

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
          antialias: !isMobileDevice,
          alpha: true,
          powerPreference: "low-power"
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileDevice ? 1.25 : 2));
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
        } else if (isMobileDevice) {
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