/**
 * ============================================================================
 * js/photo-lightbox.js — PHOTOGRAPHY STREAMING, COLOR ENGINE & LIGHTBOX
 * ============================================================================
 * Load order in index.html:
 *   1. js/utils-3d.js
 *   2. js/projects.js
 *   3. js/photo-lightbox.js (this file)
 *   4. script.js
 */

let photographyLoaded = false;
let photographyLoadingPromise = null;
let sharedSamplerCtx = null;

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

/**
 * ============================================================================
 * TAB 3: STREAMING DUAL-SET PHOTOGRAPHY ENGINE
 * ============================================================================
 */
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
    const isMobileDevice = typeof IS_MOBILE !== "undefined" ? IS_MOBILE : false;

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
      { rootMargin: isMobileDevice ? "220px 0px" : "450px 0px" }
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
          if (window.currentTabIndex === 2) scheduleAverageColorUpdate();
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

window.loadAndRenderPhotography = loadAndRenderPhotography;

/**
 * ============================================================================
 * INSTANT CACHED AVERAGE COLOR ENGINE
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
  if (window.currentTabIndex !== 2) return;

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

window.scheduleAverageColorUpdate = scheduleAverageColorUpdate;
window.resetToCadTheme = resetToCadTheme;

/**
 * ============================================================================
 * UNIVERSAL LIGHTBOX, IMAGE ZOOM/PAN & 3D VIEWER
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
  const isMobileDevice = typeof IS_MOBILE !== "undefined" ? IS_MOBILE : false;

  if (!lbRenderer) {
    lbScene = new THREE.Scene();
    lbCamera = new THREE.PerspectiveCamera(42, 16 / 10, 0.1, 4000);
    lbRenderer = new THREE.WebGLRenderer({
      antialias: !isMobileDevice,
      alpha: true,
      powerPreference: "high-performance"
    });
    lbRenderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileDevice ? 1.5 : 2));
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

  document.documentElement.classList.add("lightbox-lock");
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

  const isMobileDevice = typeof IS_MOBILE !== "undefined" ? IS_MOBILE : false;
  if (isMobileDevice && lbRenderer) {
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

  // Keep html & body scroll lock active if the Project Detail Modal is still open underneath
  const projDetailModal = document.getElementById("project-detail-modal");
  const isProjModalOpen = projDetailModal && projDetailModal.classList.contains("open");
  if (!isProjModalOpen) {
    document.documentElement.classList.remove("lightbox-lock");
    document.body.classList.remove("lightbox-lock");
  }

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

function initLightboxEventListeners() {
  window.addEventListener(
    "scroll",
    () => { if (window.currentTabIndex === 2) scheduleAverageColorUpdate(); },
    { passive: true }
  );

  window.addEventListener(
    "resize",
    () => {
      if (window.currentTabIndex === 2) scheduleAverageColorUpdate();
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
  if (!lightboxModal) return;

  lightboxModal.addEventListener("click", (e) => {
    if (e.target === lightboxModal || e.target.id === "lightbox-stage-viewport") {
      closeLightbox();
    }
  });

  const closeBtn = document.getElementById("lightbox-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeLightbox();
    });
  }

  const prevBtn = document.getElementById("lightbox-prev");
  if (prevBtn) {
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      stepLightbox(-1);
    });
  }

  const nextBtn = document.getElementById("lightbox-next");
  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      stepLightbox(1);
    });
  }

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
}

window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.initLightboxEventListeners = initLightboxEventListeners;