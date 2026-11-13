/**
 * ============================================================================
 * js/projects.js — 2-WIDE PROJECT GRID, DETAIL MODAL & ATTRIBUTE LOOKUP
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

  // If the main asset is a 3D model or video, check if there is an image in the stack to use as a thumbnail, or render a 3D preview
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
 * Ensures the Full Project Detail Modal exists in the DOM (auto-injects if missing)
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
  document.body.classList.remove("lightbox-lock");

  const bodyEl = modal.querySelector("#pmodal-body");
  if (bodyEl) bodyEl.innerHTML = "";
}

/**
 * Opens the full project details (main stage, full description, clickable sub-name & skill attributes, and full media gallery)
 */
function openProjectDetailModal(proj) {
  const modal = ensureProjectDetailModalExists();
  const codeEl = modal.querySelector("#pmodal-code");
  const subNameBtn = modal.querySelector("#pmodal-subname-btn");
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

  const formattedDesc = (proj.description || "").replace(
    /\bIIT\b/g,
    `<a href="${iitUrl}" target="_blank" rel="noopener noreferrer" class="iit-link">IIT</a>`
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
            <div class="skill-group-title">// SUB-NAME &amp; SKILL ATTRIBUTES (CLICK TO FILTER)</div>
            <div class="project-tags" id="pmodal-attr-tags">
              ${
                proj.subName
                  ? `<button type="button" class="skill-tag subname-tag-pill" data-subname="${proj.subName}">// ${proj.subName}</button>`
                  : ""
              }
              ${proj.tags
                .map(
                  (t) =>
                    `<button type="button" class="skill-tag project-skill-filter" data-skill="${t}">${t}</button>`
                )
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

  // Bind attribute tag clicks inside the modal so clicking a skill or sub-name filters the grid
  bodyEl.querySelectorAll(".project-skill-filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      const skill = btn.dataset.skill;
      closeProjectDetailModal();
      window.filterProjectsByAttribute({ skill });
    });
  });

  bodyEl.querySelectorAll(".subname-tag-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      const subName = btn.dataset.subname;
      closeProjectDetailModal();
      window.filterProjectsByAttribute({ subName });
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
  document.body.classList.add("lightbox-lock");
}

/**
 * Global function to filter the Projects grid by Skill Attribute, Sub-Name Attribute, or search query
 */
window.filterProjectsByAttribute = function (options = {}) {
  if (!projectsLoaded) {
    pendingProjectFilter = options;
    loadAndRenderProjects();
    return;
  }

  const searchInput = document.getElementById("project-filter-input");
  const filterBar = document.getElementById("project-filter-bar");

  if (options.skill) {
    if (searchInput) searchInput.value = options.skill;
    applyProjectLookupFilter({ type: "skill", value: options.skill });
  } else if (options.subName) {
    if (searchInput) searchInput.value = options.subName;
    applyProjectLookupFilter({ type: "subName", value: options.subName });
  } else if (typeof options.query === "string") {
    if (searchInput) searchInput.value = options.query;
    applyProjectLookupFilter({ type: "query", value: options.query });
  }

  if (filterBar) {
    filterBar.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

let currentActiveFilter = { type: "", value: "" };

function applyProjectLookupFilter(filterSpec) {
  const rawVal = (filterSpec && filterSpec.value ? filterSpec.value : "").trim();
  const lowerVal = rawVal.toLowerCase();
  currentActiveFilter = {
    type: rawVal ? filterSpec.type || "query" : "",
    value: lowerVal
  };

  // Update Sub-Name attribute pills
  document.querySelectorAll("#subname-pills-container .filter-pill").forEach((pill) => {
    const isMatch =
      currentActiveFilter.value &&
      pill.dataset.subname.toLowerCase() === currentActiveFilter.value;
    pill.classList.toggle("active", Boolean(isMatch));
  });

  // Update Skill attribute pills
  document.querySelectorAll("#skill-pills-container .filter-pill").forEach((pill) => {
    const isMatch =
      currentActiveFilter.value &&
      pill.dataset.skill.toLowerCase() === currentActiveFilter.value;
    pill.classList.toggle("active", Boolean(isMatch));
  });

  let visibleCount = 0;

  allLoadedProjects.forEach(({ card, proj }) => {
    if (!lowerVal) {
      card.style.display = "";
      visibleCount++;
      return;
    }

    let matches = false;
    if (currentActiveFilter.type === "subName") {
      matches = (proj.subName || "").toLowerCase() === lowerVal;
    } else if (currentActiveFilter.type === "skill") {
      matches = proj.tags.some((t) => t.toLowerCase() === lowerVal);
    } else {
      const inTitle = (proj.title || "").toLowerCase().includes(lowerVal);
      const inCode = (proj.code || "").toLowerCase().includes(lowerVal);
      const inSubName = (proj.subName || "").toLowerCase().includes(lowerVal);
      const inTags = proj.tags.some((t) => t.toLowerCase().includes(lowerVal));
      matches = inTitle || inCode || inSubName || inTags;
    }

    card.style.display = matches ? "" : "none";
    if (matches) visibleCount++;
  });

  const countBadge = document.getElementById("projects-count-badge");
  if (countBadge) {
    countBadge.textContent = lowerVal
      ? `SHOWING: ${visibleCount} / ${allLoadedProjects.length} PROJECTS`
      : `LOADED: ${allLoadedProjects.length} PROJECT${allLoadedProjects.length === 1 ? "" : "S"}`;
  }
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

    // Apply the 2-wide (or custom) CSS variable for the Projects grid
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

    // Collect unique Sub-Name attributes & Skill attributes across all projects
    const subNamesSet = new Set();
    const skillsSet = new Set();

    validProjects.forEach((proj) => {
      if (proj.subName) subNamesSet.add(proj.subName);
      proj.tags.forEach((t) => skillsSet.add(t));
    });

    // Build unified Attribute Lookup Bar (Search Input + Sub-Name Attributes + Skill Attributes)
    const filterBar = document.createElement("div");
    filterBar.id = "project-filter-bar";
    filterBar.className = "project-filter-bar";
    filterBar.innerHTML = `
      <div class="filter-bar-inner">
        <div class="filter-search-row">
          <input
            type="text"
            id="project-filter-input"
            class="project-filter-input"
            placeholder="Search projects by title, sub-name (e.g. FSAE ELECTRIC), or skill attribute..."
            autocomplete="off"
            spellcheck="false"
          />
          <button type="button" id="project-filter-clear-btn" class="mini-action-btn" title="Clear active filter">CLEAR</button>
        </div>

        <div class="filter-group-row">
          <span class="filter-group-label">// SUB-NAME ATTRIBUTES:</span>
          <div class="filter-pills" id="subname-pills-container">
            ${Array.from(subNamesSet)
              .map(
                (sub) =>
                  `<button type="button" class="filter-pill subname-pill" data-subname="${sub}">// ${sub}</button>`
              )
              .join("")}
          </div>
        </div>

        <div class="filter-group-row">
          <span class="filter-group-label">// SKILL ATTRIBUTES:</span>
          <div class="filter-pills" id="skill-pills-container">
            ${Array.from(skillsSet)
              .map(
                (skill) =>
                  `<button type="button" class="filter-pill skill-pill" data-skill="${skill}">${skill}</button>`
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
    container.appendChild(filterBar);

    // Build the 2-wide (variable) Project Grid
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

    // Bind Search & Attribute Pill events
    const filterInput = document.getElementById("project-filter-input");
    const clearBtn = document.getElementById("project-filter-clear-btn");

    filterInput.addEventListener("input", () => {
      applyProjectLookupFilter({ type: "query", value: filterInput.value });
    });

    clearBtn.addEventListener("click", () => {
      filterInput.value = "";
      applyProjectLookupFilter({ type: "", value: "" });
    });

    document.querySelectorAll("#subname-pills-container .filter-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        const subName = pill.dataset.subname;
        if (
          currentActiveFilter.value === subName.toLowerCase() &&
          currentActiveFilter.type === "subName"
        ) {
          filterInput.value = "";
          applyProjectLookupFilter({ type: "", value: "" });
        } else {
          filterInput.value = subName;
          applyProjectLookupFilter({ type: "subName", value: subName });
        }
      });
    });

    document.querySelectorAll("#skill-pills-container .filter-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        const skill = pill.dataset.skill;
        if (
          currentActiveFilter.value === skill.toLowerCase() &&
          currentActiveFilter.type === "skill"
        ) {
          filterInput.value = "";
          applyProjectLookupFilter({ type: "", value: "" });
        } else {
          filterInput.value = skill;
          applyProjectLookupFilter({ type: "skill", value: skill });
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