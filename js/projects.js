/**
 * ============================================================================
 * js/projects.js — 2-WIDE PROJECT GRID, DETAIL MODAL & CATEGORY FILTER
 * ============================================================================
 * Load order in index.html:
 *   1. js/utils-3d.js
 *   2. js/projects.js (this file)
 *   3. js/photo-lightbox.js
 *   4. script.js
 */

let projectsLoaded = false;
let projectsLoadingPromise = null;
let allLoadedProjects = [];
let pendingProjectFilter = null;
let currentActiveCategory = "";

function parseProjectTextFile(rawText, folderPath) {
  const lines = rawText.replace(/\r\n/g, "\n").split("\n");
  const data = {
    title: "",
    code: "PRJ // ARCHIVE",
    subName: "",
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
      const slashMatch = data.code.match(/\/\/\s*(.+)$/);
      if (slashMatch && !data.subName) {
        data.subName = slashMatch[1].trim().toUpperCase();
      }
    } else if (/^(SUBNAME|SUB_NAME|SECTION|CATEGORY)\s*:/i.test(line)) {
      inDescription = false;
      data.subName = line
        .replace(/^(SUBNAME|SUB_NAME|SECTION|CATEGORY)\s*:\s*/i, "")
        .trim()
        .toUpperCase();
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

  if (!data.subName) {
    data.subName =
      typeof window.extractProjectSubName === "function"
        ? window.extractProjectSubName(data.code)
        : "ARCHIVE";
  }

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

/**
 * Finds the best visual thumbnail for the 2-wide grid card
 */
function resolveBestGridCardPreview(proj) {
  const mainAsset = proj.verifiedAssets[0];
  if (!mainAsset) return { type: "none", src: getFallbackRunSvgDataUri(), mainAsset: null };

  if (isImageAsset(mainAsset.type) || mainAsset.type === "itch" || mainAsset.type === "link") {
    return {
      type: mainAsset.type,
      src: mainAsset.previewSrc || mainAsset.fullSrc,
      mainAsset
    };
  }

  const firstImg = proj.verifiedAssets.find((a) => isImageAsset(a.type));
  return {
    type: mainAsset.type,
    src: firstImg ? firstImg.previewSrc : null,
    mainAsset
  };
}

/**
 * Creates a compact 2-wide grid card showing ONLY the main visual and title.
 * Clicking anywhere on the card opens the full Project Detail Modal.
 */
function createCompactProjectGridCard(proj, idx) {
  const card = document.createElement("article");
  card.className = "project-grid-card stream-in-item";
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.setAttribute("aria-label", `Open project ${proj.title}`);

  const previewInfo = resolveBestGridCardPreview(proj);

  card.innerHTML = `
    <span class="corner-tick tl"></span>
    <span class="corner-tick tr"></span>
    <span class="corner-tick bl"></span>
    <span class="corner-tick br"></span>
    <div class="project-grid-thumb" id="proj-grid-thumb-${idx}"></div>
    <div class="project-grid-title-bar">
      <h2 class="project-grid-title">${proj.title}</h2>
      <span class="project-grid-open-icon" aria-hidden="true">&#8599;</span>
    </div>
  `;

  const thumbWrap = card.querySelector(`#proj-grid-thumb-${idx}`);

  if (previewInfo.src) {
    const img = document.createElement("img");
    img.className = "project-grid-img";
    img.loading = "lazy";
    img.decoding = "async";
    img.alt = proj.title;
    thumbWrap.appendChild(img);

    loadImageSourceWithHeicSupport(previewInfo.src).then((url) => {
      img.src = url;
      img.classList.add("img-loaded");
    });

    if (is3DAsset(previewInfo.type)) {
      const badge = document.createElement("div");
      badge.className = "stl-badge-overlay";
      badge.textContent = `3D ${previewInfo.type.toUpperCase()}`;
      thumbWrap.appendChild(badge);
    } else if (previewInfo.type === "itch" || previewInfo.type === "link") {
      const badge = document.createElement("div");
      badge.className = "stl-badge-overlay";
      badge.textContent = "INTERACTIVE APP";
      thumbWrap.appendChild(badge);
    }
  } else if (previewInfo.mainAsset && is3DAsset(previewInfo.mainAsset.type)) {
    const stage3d = document.createElement("div");
    stage3d.className = "stl-preview-container";
    stage3d.style.height = "100%";
    stage3d.style.minHeight = "100%";
    thumbWrap.appendChild(stage3d);
    mountAutoRotating3DPreview(stage3d, previewInfo.mainAsset.fullSrc, previewInfo.mainAsset.type);
  } else if (previewInfo.mainAsset) {
    thumbWrap.appendChild(createUniversalAssetCard(previewInfo.mainAsset));
  }

  const openModalHandler = (e) => {
    e.preventDefault();
    openProjectDetailModal(proj);
  };

  card.addEventListener("click", openModalHandler);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      openModalHandler(e);
    }
  });

  return card;
}

/**
 * Prevents background page scrolling when the Project Detail Modal is open,
 * while allowing internal scrolling inside #pmodal-body.
 */
function preventProjectModalBackgroundScroll(e) {
  const modal = document.getElementById("project-detail-modal");
  if (!modal || !modal.classList.contains("open")) return;

  const lbModal = document.getElementById("lightbox-modal");
  if (lbModal && lbModal.classList.contains("open")) return;

  const bodyEl = document.getElementById("pmodal-body");
  if (bodyEl && bodyEl.contains(e.target)) {
    return;
  }
  e.preventDefault();
}

/**
 * Ensures the Full Project Detail Modal exists in the DOM
 */
function ensureProjectDetailModalExists() {
  let modal = document.getElementById("project-detail-modal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "project-detail-modal";
  modal.className = "project-detail-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-hidden", "true");

  modal.innerHTML = `
    <div class="project-detail-dialog">
      <div class="project-detail-topbar">
        <div class="project-detail-topbar-left">
          <span class="project-detail-code" id="pmodal-code">PRJ // ARCHIVE</span>
        </div>
        <button type="button" class="mini-action-btn lightbox-exit-btn" id="pmodal-close-btn">&#10005; CLOSE</button>
      </div>
      <div class="project-detail-body" id="pmodal-body"></div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeBtn = modal.querySelector("#pmodal-close-btn");
  closeBtn.addEventListener("click", closeProjectDetailModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeProjectDetailModal();
  });

  window.addEventListener("keydown", (e) => {
    const lbModal = document.getElementById("lightbox-modal");
    const lbOpen = lbModal && lbModal.classList.contains("open");
    if (e.key === "Escape" && modal.classList.contains("open") && !lbOpen) {
      closeProjectDetailModal();
    }
  });

  return modal;
}

function closeProjectDetailModal() {
  const modal = document.getElementById("project-detail-modal");
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");

  const lbModal = document.getElementById("lightbox-modal");
  const isLbOpen = lbModal && lbModal.classList.contains("open");
  if (!isLbOpen) {
    document.documentElement.classList.remove("lightbox-lock");
    document.body.classList.remove("lightbox-lock");
  }

  window.removeEventListener("wheel", preventProjectModalBackgroundScroll);
  window.removeEventListener("touchmove", preventProjectModalBackgroundScroll);

  const bodyEl = modal.querySelector("#pmodal-body");
  if (bodyEl) bodyEl.innerHTML = "";
}

/**
 * Opens the full project details (main stage, full description, category & skills, and full media gallery)
 */
function openProjectDetailModal(proj) {
  const modal = ensureProjectDetailModalExists();
  const codeEl = modal.querySelector("#pmodal-code");
  const bodyEl = modal.querySelector("#pmodal-body");

  codeEl.textContent = proj.code || "PRJ // ARCHIVE";

  const mainAsset = proj.verifiedAssets[0];
  const isImageMain = isImageAsset(mainAsset.type);

  const lightboxList = proj.verifiedAssets.map((asset) => ({
    type: asset.type,
    file: asset.file,
    previewSrc: asset.previewSrc,
    fullSrc: asset.fullSrc,
    embedUrl: asset.embedUrl,
    targetUrl: asset.targetUrl,
    keys: proj.keys
  }));

  const iitUrl =
    window.PORTFOLIO_CONFIG &&
    window.PORTFOLIO_CONFIG.about &&
    window.PORTFOLIO_CONFIG.about.iitUrl
      ? window.PORTFOLIO_CONFIG.about.iitUrl
      : "https://www.iit.edu/";

  const rawDesc = proj.description || "";
  const formattedDesc =
    typeof window.linkifyIITText === "function"
      ? window.linkifyIITText(rawDesc, iitUrl)
      : rawDesc
          .replace(
            /Illinois Inst(?:i|e)tute of Technology/gi,
            (match) => `<a href="${iitUrl}" target="_blank" rel="noopener noreferrer" class="iit-link">${match}</a>`
          )
          .replace(
            /\bIIT\b/gi,
            (match) => `<a href="${iitUrl}" target="_blank" rel="noopener noreferrer" class="iit-link">${match}</a>`
          );

  bodyEl.innerHTML = `
    <div class="project-top-layout">
      <div class="project-main-stage-cell">
        <div class="project-main-img-wrap ${isImageMain ? "is-image-wrap" : "is-interactive-wrap"}" id="pmodal-main-stage"></div>
      </div>

      <div class="project-info-col">
        <div>
          <h2 class="project-title">${proj.title}</h2>
          <p class="project-desc">${formattedDesc}</p>

          <div class="project-detail-attr-group">
            <div class="skill-group-title">// CATEGORY &amp; SKILLS</div>
            <div class="project-tags" id="pmodal-attr-tags">
              ${
                proj.subName
                  ? `<button type="button" class="skill-tag subname-tag-pill" data-category="${proj.subName}" title="Filter by ${proj.subName}">// ${proj.subName}</button>`
                  : ""
              }
              ${proj.tags
                .map((t) => `<span class="skill-tag">${t}</span>`)
                .join("")}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="project-detail-gallery-section">
      <div class="panel-header" style="margin-bottom: 14px;">
        <span class="panel-title">// PROJECT MEDIA &amp; INTERACTIVE ASSETS [${proj.verifiedAssets.length}]</span>
      </div>
      <div class="project-gallery-grid" id="pmodal-gallery-grid"></div>
    </div>
  `;

  // Populate Main Stage inside Modal
  const mainWrap = bodyEl.querySelector("#pmodal-main-stage");
  if (is3DAsset(mainAsset.type)) {
    const stage3d = document.createElement("div");
    stage3d.className = "stl-preview-container";
    mainWrap.appendChild(stage3d);
    mountAutoRotating3DPreview(stage3d, mainAsset.fullSrc, mainAsset.type);
    mainWrap.addEventListener("click", () => openLightbox(lightboxList, 0));
  } else if (mainAsset.type === "link") {
    mainWrap.style.cursor = "pointer";
    mainWrap.appendChild(createRunLinkCard(mainAsset, proj.keys, false));
  } else if (mainAsset.type === "itch") {
    mainWrap.style.cursor = "pointer";
    mainWrap.appendChild(
      createItchEmbedCard(mainAsset, () => openLightbox(lightboxList, 0), proj.keys, false)
    );
  } else if (isImageAsset(mainAsset.type)) {
    const mainImg = document.createElement("img");
    mainImg.className = "interactive-img project-main-img";
    mainImg.decoding = "async";
    mainImg.alt = proj.title;
    mainWrap.appendChild(mainImg);
    loadImageSourceWithHeicSupport(mainAsset.previewSrc).then((url) => {
      mainImg.src = url;
    });
    mainWrap.addEventListener("click", () => openLightbox(lightboxList, 0));
  } else {
    mainWrap.appendChild(createUniversalAssetCard(mainAsset));
    mainWrap.addEventListener("click", () => openLightbox(lightboxList, 0));
  }

  // Clicking the category pill inside the modal filters the project grid by that category
  bodyEl.querySelectorAll(".subname-tag-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      const category = btn.dataset.category;
      closeProjectDetailModal();
      window.filterProjectsByAttribute({ category });
    });
  });

  // Populate Media Gallery Grid inside Modal
  const galleryGrid = bodyEl.querySelector("#pmodal-gallery-grid");
  const galleryFrag = document.createDocumentFragment();

  proj.verifiedAssets.forEach((asset, assetIdx) => {
    const itemWrap = document.createElement("div");
    itemWrap.className = "project-gallery-item";

    if (is3DAsset(asset.type)) {
      const box3d = document.createElement("div");
      box3d.className = "stl-preview-container";
      const isMobileDevice = typeof IS_MOBILE !== "undefined" ? IS_MOBILE : false;
      if (isMobileDevice) {
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
        createItchEmbedCard(asset, () => openLightbox(lightboxList, assetIdx), proj.keys, true)
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

    galleryFrag.appendChild(itemWrap);
  });

  galleryGrid.appendChild(galleryFrag);

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.documentElement.classList.add("lightbox-lock");
  document.body.classList.add("lightbox-lock");
  window.addEventListener("wheel", preventProjectModalBackgroundScroll, { passive: false });
  window.addEventListener("touchmove", preventProjectModalBackgroundScroll, { passive: false });
}

/**
 * Global function to filter the Projects grid by Category
 */
window.filterProjectsByAttribute = function (options = {}) {
  if (!projectsLoaded) {
    pendingProjectFilter = options;
    loadAndRenderProjects();
    return;
  }

  const filterBar = document.getElementById("project-filter-bar");
  const category = options.category || options.subName || "";
  applyCategoryFilter(category);

  if (filterBar) {
    filterBar.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

function applyCategoryFilter(rawCategory) {
  const cleanCat = (rawCategory || "").trim().toLowerCase();
  currentActiveCategory = cleanCat;

  // Update Category pills
  document.querySelectorAll("#category-pills-container .filter-pill").forEach((pill) => {
    const pillCat = (pill.dataset.category || "").toLowerCase();
    const isMatch = (!cleanCat && pillCat === "") || (cleanCat && pillCat === cleanCat);
    pill.classList.toggle("active", Boolean(isMatch));
  });

  // Update mobile dropdown active readout label
  const activeReadout = document.getElementById("categories-active-readout");
  if (activeReadout) {
    activeReadout.textContent = cleanCat ? `// ${rawCategory.trim().toUpperCase()}` : "// ALL";
  }

  let visibleCount = 0;

  allLoadedProjects.forEach(({ card, proj }) => {
    if (!cleanCat) {
      card.style.display = "";
      visibleCount++;
      return;
    }

    const matches = (proj.subName || "").toLowerCase() === cleanCat;
    card.style.display = matches ? "" : "none";
    if (matches) visibleCount++;
  });

  const countBadge = document.getElementById("projects-count-badge");
  if (countBadge) {
    countBadge.textContent = cleanCat
      ? `SHOWING: ${visibleCount} / ${allLoadedProjects.length} PROJECTS`
      : `LOADED: ${allLoadedProjects.length} PROJECT${allLoadedProjects.length === 1 ? "" : "S"}`;
  }
}

/**
 * Sets up the mobile-mode Categories dropdown ("// CATEGORIES ▾")
 */
function setupMobileCategoriesDropdown(filterBar) {
  if (!filterBar) return;
  const header = filterBar.querySelector("#categories-dropdown-header");
  if (!header || header.dataset.dropdownBound === "true") return;

  header.dataset.dropdownBound = "true";

  const isMobileViewport = window.matchMedia("(max-width: 860px)").matches;
  if (isMobileViewport) {
    filterBar.classList.add("mobile-categories-collapsed");
    header.setAttribute("aria-expanded", "false");
  } else {
    header.setAttribute("aria-expanded", "true");
  }

  const toggleDropdown = (e) => {
    if (!window.matchMedia("(max-width: 860px)").matches) return;
    e.preventDefault();
    const isNowCollapsed = filterBar.classList.toggle("mobile-categories-collapsed");
    header.setAttribute("aria-expanded", String(!isNowCollapsed));
  };

  header.addEventListener("click", toggleDropdown);
  header.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      toggleDropdown(e);
    }
  });
}

async function loadAndRenderProjects() {
  if (projectsLoaded) return;
  if (projectsLoadingPromise) return projectsLoadingPromise;

  projectsLoadingPromise = (async () => {
    const container = document.getElementById("projects-container");
    const countBadge = document.getElementById("projects-count-badge");
    const {
      gridColumns,
      baseFolder,
      textFileName,
      foldersToCheck
    } = PORTFOLIO_CONFIG.projectsConfig;
    const normBase = normalizeFolder(baseFolder);

    document.documentElement.style.setProperty("--project-grid-cols", gridColumns || 2);

    container.innerHTML = "";
    countBadge.textContent = "STREAMING PROJECTS...";

    const results = await Promise.all(
      foldersToCheck.map(async (folderName) => {
        const proj = await fetchSingleProjectFolder(normBase, folderName, textFileName);
        if (proj && (!proj.subName || proj.subName === "ARCHIVE")) {
          proj.subName = folderName
            .replace(/pt\d+$/i, "")
            .replace(/[-_]/g, " ")
            .trim()
            .toUpperCase();
        }
        return { folderName, proj };
      })
    );

    const validProjects = results.filter((r) => r.proj !== null).map((r) => r.proj);

    if (validProjects.length === 0) {
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

    // Collect unique Categories across all projects
    const categoriesSet = new Set();
    validProjects.forEach((proj) => {
      if (proj.subName) categoriesSet.add(proj.subName);
    });

    // Build Categories Bar (with mobile dropdown support)
    const filterBar = document.createElement("div");
    filterBar.id = "project-filter-bar";
    filterBar.className = "project-filter-bar";
    filterBar.innerHTML = `
      <div class="panel-header categories-dropdown-header" id="categories-dropdown-header" role="button" tabindex="0" aria-expanded="true">
        <span class="panel-title">// CATEGORIES <span class="categories-dropdown-arrow" aria-hidden="true">&#9662;</span></span>
        <span class="categories-active-readout" id="categories-active-readout">// ALL</span>
      </div>
      <div class="filter-bar-inner" id="categories-dropdown-body">
        <div class="filter-group-row">
          <span class="filter-group-label desktop-categories-label">// CATEGORIES:</span>
          <div class="filter-pills" id="category-pills-container">
            <button type="button" class="filter-pill subname-pill active" data-category="">// ALL</button>
            ${Array.from(categoriesSet)
              .map(
                (cat) =>
                  `<button type="button" class="filter-pill subname-pill" data-category="${cat}">// ${cat}</button>`
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
    container.appendChild(filterBar);

    setupMobileCategoriesDropdown(filterBar);

    // Build the 2-wide Project Grid
    const gridEl = document.createElement("div");
    gridEl.id = "projects-grid";
    gridEl.className = "projects-grid";
    container.appendChild(gridEl);

    allLoadedProjects = [];
    validProjects.forEach((proj, idx) => {
      const cardEl = createCompactProjectGridCard(proj, idx);
      gridEl.appendChild(cardEl);
      allLoadedProjects.push({ card: cardEl, proj });
    });

    countBadge.textContent = `LOADED: ${validProjects.length} PROJECT${validProjects.length === 1 ? "" : "S"}`;

    // Bind Category Pill click events
    document.querySelectorAll("#category-pills-container .filter-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        const cat = pill.dataset.category;
        if (cat && currentActiveCategory === cat.toLowerCase()) {
          applyCategoryFilter("");
        } else {
          applyCategoryFilter(cat);
        }

        // Collapse mobile dropdown after selecting a category
        if (window.matchMedia("(max-width: 860px)").matches) {
          filterBar.classList.add("mobile-categories-collapsed");
          const hdr = filterBar.querySelector("#categories-dropdown-header");
          if (hdr) hdr.setAttribute("aria-expanded", "false");
        }
      });
    });

    projectsLoaded = true;

    if (pendingProjectFilter) {
      const queued = pendingProjectFilter;
      pendingProjectFilter = null;
      window.filterProjectsByAttribute(queued);
    }
  })();

  return projectsLoadingPromise;
}

window.loadAndRenderProjects = loadAndRenderProjects;