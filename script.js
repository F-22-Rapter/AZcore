/**
 * ============================================================================
 * 1. MODULAR PORTFOLIO CONFIGURATION
 * ============================================================================
 */
const PORTFOLIO_CONFIG = {
  brandName: "AZCORE",

  // -------------------- TAB 1: ABOUT ME CONFIG --------------------
  about: {
    name: "ALEXANDER ZHUK",
    headline: "ENGINEERING, FABRICATION & VISUAL DESIGN",
    folder: "assets/about/",
    profileImage: "profile.jpg",
    bioParagraphs: [
      "I am a Civil Engineering student, fabricator, and photographer based in Chicago. My work sits at the intersection of structural systems, custom mechanical/electrical fabrication, and architectural & night-sky photography.",
      "Whether leading tractive battery accumulator design and thermal simulation, machining custom drivetrain mounts on a manual lathe, or capturing high-resolution panoramic astrophotography, I approach every project with precision CAD workflows and hands-on execution."
    ],
    quickSpecs: [
      { label: "DISCIPLINE", value: "Civil & Structural Engineering" },
      { label: "LOCATION", value: "Chicago, IL" },
      { label: "FOCUS", value: "CAD / CFD / Fabrication" },
      { label: "CAMERA SYSTEM", value: "Canon EOS 90D + Vintage Glass" }
    ],
    skills: [
      {
        category: "CAD & SIMULATION",
        items: ["SolidWorks", "AutoCAD", "Autodesk Revit", "Ansys Fluent CFD", "Inventor", "Blender"]
      },
      {
        category: "FABRICATION & HARDWARE",
        items: ["Manual Lathe & Mill", "MIG Welding", "Li-Ion Pack Assembly", "Composite Enclosures", "3D Printing"]
      },
      {
        category: "CODE & MEDIA",
        items: ["Python / OpenCV", "HTML / CSS / JS", "LaTeX", "Lightroom Classic", "DaVinci Resolve", "Hugin / Sequator"]
      }
    ],
    socials: [
      { platform: "EMAIL", handle: "alex@azcore.studio", url: "mailto:alex@azcore.studio" },
      { platform: "GITHUB", handle: "github.com/azcore", url: "https://github.com" },
      { platform: "LINKEDIN", handle: "linkedin.com/in/alexander-zhuk", url: "https://linkedin.com" },
      { platform: "INSTAGRAM", handle: "@azcore.studio", url: "https://instagram.com" }
    ]
  },

  // -------------------- TAB 2: PROJECTS FOLDER CONFIG --------------------
  // The script checks `projectsBaseFolder` for subfolders (auto-discovered or listed below).
  // A project ONLY appears if `<folder>/project.txt` exists inside it!
  projectsConfig: {
    baseFolder: "assets/projects/",
    textFileName: "project.txt",
    // Folder names to check for `project.txt` (you can add any folder names here,
    // and the script also auto-scans the directory if your server supports folder listing)
    foldersToCheck: [
      "project-01",
      "project-02",
      "project-03",
      "project-04",
      "battery-accumulator",
      "gokart-build",
      "solar-canopy",
      "aero-cfd"
    ]
  },

  // -------------------- TAB 3: PHOTOGRAPHY FOLDER CONFIG --------------------
  // The script checks `photographyConfig.folder` and ONLY displays the exact
  // images that actually exist inside that folder.
  photographyConfig: {
    folder: "assets/photography/",
    // Optional candidate filenames to probe if hosted on a static server (like GitHub Pages)
    // that disables automatic directory listing HTML. Only files that actually exist in the
    // folder will be shown!
    candidateFilesToProbe: [
      // You can list custom filenames here or use standard numbered files (01.jpg, 1.jpg, photo-01.jpg)
"Image (1).jpg", "Image (2).jpg", "Image (3).jpg", "Image (4).jpg", "Image (5).jpg", "Image (6).jpg", "Image (7).jpg", "Image (8).jpg", "Image (9).jpg", "Image (10).jpg", "Image (11).jpg", "Image (12).jpg", "Image (13).jpg", "Image (14).jpg", "Image (15).jpg", "Image (16).jpg", "Image (17).jpg", "Image (18).jpg", "Image (19).jpg", "Image (20).jpg", "Image (21).jpg", "Image (22).jpg", "Image (23).jpg", "Image (24).jpg", "Image (25).jpg", "Image (26).jpg", "Image (27).jpg", "Image (28).jpg", "Image (29).jpg", "Image (30).jpg", "Image (31).jpg", "Image (32).jpg", "Image (33).jpg", "Image (34).jpg", "Image (35).jpg", "Image (36).jpg", "Image (37).jpg", "Image (38).jpg", "Image (39).jpg", "Image (40).jpg", "Image (41).jpg", "Image (42).jpg", "Image (43).jpg", "Image (44).jpg", "Image (45).jpg"    ]
  }
};

/**
 * ============================================================================
 * 2. FILE & IMAGE EXISTENCE HELPERS
 * ============================================================================
 */
// Checks if an image file genuinely exists on disk/server
function verifyImageExists(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

// Normalizes a folder path to always end with "/"
function normalizeFolder(path) {
  return path.endsWith("/") ? path : path + "/";
}

/**
 * ============================================================================
 * 3. TAB 1: RENDER ABOUT ME
 * ============================================================================
 */
async function renderAboutSection() {
  const cfg = PORTFOLIO_CONFIG.about;
  document.getElementById("nav-brand-name").textContent = PORTFOLIO_CONFIG.brandName;
  document.getElementById("about-headline").textContent = cfg.headline;
  document.getElementById("about-name-caption").textContent = cfg.name;

  const profileImg = document.getElementById("about-profile-img");
  const fullProfilePath = `${normalizeFolder(cfg.folder)}${cfg.profileImage}`;
  const exists = await verifyImageExists(fullProfilePath);

  if (exists) {
    profileImg.src = fullProfilePath;
  } else {
    // Subtle CAD fallback ONLY for the About Me profile frame if not placed yet
    profileImg.src = `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750">
        <rect width="600" height="750" fill="#181b1e"/>
        <line x1="0" y1="375" x2="600" y2="375" stroke="#d92804" stroke-width="1"/>
        <line x1="300" y1="0" x2="300" y2="750" stroke="#d92804" stroke-width="1"/>
        <text x="40" y="700" fill="#9aa4ae" font-family="monospace" font-size="16">PLACE IMAGE AT: ${fullProfilePath}</text>
      </svg>`
    )}`;
  }

  profileImg.addEventListener("click", () => {
    openLightbox([{ src: profileImg.src, caption: `${cfg.name} // ${fullProfilePath}` }], 0);
  });

  // Quick Specs
  document.getElementById("about-specs-list").innerHTML = cfg.quickSpecs
    .map(
      (s) => `
      <div class="spec-row">
        <span class="spec-label">${s.label}</span>
        <span class="spec-val">${s.value}</span>
      </div>`
    )
    .join("");

  // Bio
  const bioContainer = document.getElementById("about-bio-content");
  const savedBio = localStorage.getItem("azcore_custom_bio");
  bioContainer.innerHTML = savedBio
    ? savedBio
    : cfg.bioParagraphs.map((p) => `<p>${p}</p>`).join("");

  // Skills
  document.getElementById("about-skills-grid").innerHTML = cfg.skills
    .map(
      (group) => `
      <div class="skill-group">
        <div class="skill-group-title">${group.category}</div>
        <div class="skill-tags">
          ${group.items.map((item) => `<span class="skill-tag">${item}</span>`).join("")}
        </div>
      </div>`
    )
    .join("");

  // Socials
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
 * 4. TAB 2: MODULAR TEXT-FILE DRIVEN PROJECTS ENGINE
 * ============================================================================
 * Parses `project.txt` inside each project folder and links the images
 * specified inside that text file. If no `project.txt` files exist, 0 projects
 * are shown.
 */
function parseProjectTextFile(rawText, folderPath) {
  const lines = rawText.replace(/\r\n/g, "\n").split("\n");
  const data = {
    title: "",
    code: "PRJ // ARCHIVE",
    tags: [],
    mainImage: "",
    images: [],
    description: "",
    folder: folderPath
  };

  let inDescription = false;
  const descLines = [];

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
    } else if (/^MAIN(_IMAGE)?\s*:/i.test(line)) {
      inDescription = false;
      data.mainImage = line.replace(/^MAIN(_IMAGE)?\s*:\s*/i, "").trim();
    } else if (/^IMAGES\s*:/i.test(line)) {
      inDescription = false;
      const imgs = line
        .replace(/^IMAGES\s*:\s*/i, "")
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean);
      data.images.push(...imgs);
    } else if (/^DESCRIPTION\s*:/i.test(line)) {
      inDescription = true;
      const firstLineDesc = line.replace(/^DESCRIPTION\s*:\s*/i, "").trim();
      if (firstLineDesc) descLines.push(firstLineDesc);
    } else if (inDescription) {
      descLines.push(rawLine);
    }
  }

  data.description = descLines.join("\n").trim();

  // Ensure mainImage and images list are linked cleanly
  if (!data.mainImage && data.images.length > 0) {
    data.mainImage = data.images[0];
  }
  if (data.mainImage && !data.images.includes(data.mainImage)) {
    data.images.unshift(data.mainImage);
  }

  return data;
}

async function discoverProjectFolders(baseFolder, configuredFolders) {
  const folderSet = new Set(configuredFolders);

  // Also try auto-discovering subfolders if server provides directory listing HTML
  try {
    const res = await fetch(baseFolder, { cache: "no-store" });
    if (res.ok) {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        doc.querySelectorAll("a").forEach((a) => {
          const href = a.getAttribute("href") || "";
          if (href.endsWith("/") && !href.startsWith("../") && !href.startsWith("/")) {
            folderSet.add(href.replace(/\/$/, ""));
          }
        });
      }
    }
  } catch (e) {
    // Ignore directory listing error on static hosts
  }

  return Array.from(folderSet);
}

async function loadAndRenderProjects() {
  const container = document.getElementById("projects-container");
  const countBadge = document.getElementById("projects-count-badge");
  const { baseFolder, textFileName, foldersToCheck } = PORTFOLIO_CONFIG.projectsConfig;
  const normBase = normalizeFolder(baseFolder);

  const candidateFolders = await discoverProjectFolders(normBase, foldersToCheck);
  const loadedProjects = [];

  for (const folderName of candidateFolders) {
    const projFolder = `${normBase}${folderName}/`;
    const txtUrl = `${projFolder}${textFileName}`;

    try {
      const res = await fetch(txtUrl, { cache: "no-store" });
      if (!res.ok) continue;

      // Guard against servers returning an HTML 404 fallback page
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/html")) continue;

      const rawText = await res.text();
      if (!rawText || !rawText.trim()) continue;

      const parsed = parseProjectTextFile(rawText, projFolder);
      if (!parsed.title && parsed.images.length === 0) continue;

      // Verify which linked images in project.txt actually exist inside the project folder
      const verifiedImages = [];
      for (const imgFile of parsed.images) {
        const fullImgPath = `${projFolder}${imgFile}`;
        const exists = await verifyImageExists(fullImgPath);
        if (exists) verifiedImages.push(fullImgPath);
      }

      // Only add project if its text file exists and at least 1 linked image exists
      if (verifiedImages.length > 0) {
        parsed.verifiedImages = verifiedImages;
        parsed.verifiedMain = verifiedImages[0];
        loadedProjects.push(parsed);
      }
    } catch (e) {
      // No project.txt in this folder -> skip
    }
  }

  countBadge.textContent = `LOADED: ${loadedProjects.length} PROJECT${
    loadedProjects.length === 1 ? "" : "S"
  }`;

  // If no project.txt files were found, do not show any projects
  if (loadedProjects.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box">
        <div class="empty-state-title">// 0 PROJECT TEXT FILES DETECTED</div>
        <div class="empty-state-desc">
          No valid <code>project.txt</code> files with linked images were found inside <code>${normBase}</code>.
          Add a subfolder with a <code>project.txt</code> file and its linked images to populate this section.
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = "";

  loadedProjects.forEach((proj, idx) => {
    const card = document.createElement("article");
    card.className = "project-card";
    const drawerId = `drawer-proj-${idx}`;
    const stackPreview = proj.verifiedImages.slice(0, 3);

    card.innerHTML = `
      <div class="project-top-layout">
        <div class="project-main-img-wrap">
          <img class="interactive-img project-main-img" src="${proj.verifiedMain}" alt="${proj.title}" />
          <div class="project-folder-badge">SOURCE: ${proj.folder}project.txt</div>
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

          <div class="photo-stack-trigger">
            <div class="stack-visual">
              ${stackPreview
                .map((src) => `<img class="stack-card-img" src="${src}" alt="Stack preview" />`)
                .join("")}
            </div>
            <div class="stack-meta">
              <span class="stack-title">PHOTO STACK (${proj.verifiedImages.length} LINKED)</span>
              <span class="stack-subtitle">Click stack to reveal full project grid &#8595;</span>
            </div>
          </div>
        </div>
      </div>

      <div id="${drawerId}" class="project-expanded-drawer">
        <div class="drawer-header">
          <span>// LINKED FROM ${proj.folder}project.txt (${proj.verifiedImages.length} IMAGES)</span>
          <span>CLICK ANY PHOTO FOR FULL SCREEN</span>
        </div>
        <div class="project-gallery-grid"></div>
      </div>
    `;

    container.appendChild(card);

    const galleryGrid = card.querySelector(".project-gallery-grid");
    const lightboxList = proj.verifiedImages.map((src, i) => ({
      src,
      caption: `${proj.title} // [${i + 1}/${proj.verifiedImages.length}]`
    }));

    proj.verifiedImages.forEach((src, imgIdx) => {
      const itemWrap = document.createElement("div");
      itemWrap.className = "project-gallery-item";
      const img = document.createElement("img");
      img.className = "interactive-img";
      img.src = src;
      img.alt = `${proj.title} photo ${imgIdx + 1}`;
      img.addEventListener("click", () => openLightbox(lightboxList, imgIdx));
      itemWrap.appendChild(img);
      galleryGrid.appendChild(itemWrap);
    });

    card.querySelector(".project-main-img").addEventListener("click", () => {
      openLightbox(lightboxList, 0);
    });

    const stackTrigger = card.querySelector(".photo-stack-trigger");
    const drawer = card.querySelector(`#${drawerId}`);
    stackTrigger.addEventListener("click", () => {
      const isOpen = drawer.classList.toggle("open");
      stackTrigger.querySelector(".stack-subtitle").innerHTML = isOpen
        ? "Click stack to collapse project grid &#8593;"
        : "Click stack to reveal full project grid &#8595;";
    });
  });
}

/**
 * ============================================================================
 * 5. TAB 3: PHOTOGRAPHY LIVE FOLDER CHECKER
 * ============================================================================
 * Checks `assets/photography/` and ONLY renders the exact images found in
 * that folder.
 */
async function discoverPhotographyImages() {
  const { folder, candidateFilesToProbe } = PORTFOLIO_CONFIG.photographyConfig;
  const normFolder = normalizeFolder(folder);
  const discoveredFiles = new Set();
  const imageRegex = /\.(jpe?g|png|webp|avif|gif)$/i;

  // 1. Try directory listing scan (works automatically on VS Code Live Server, python http.server, Apache, etc.)
  try {
    const res = await fetch(normFolder, { cache: "no-store" });
    if (res.ok) {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        doc.querySelectorAll("a").forEach((a) => {
          const href = a.getAttribute("href") || "";
          const cleanName = decodeURIComponent(href.split("/").pop());
          if (imageRegex.test(cleanName)) {
            discoveredFiles.add(`${normFolder}${cleanName}`);
          }
        });
      }
    }
  } catch (e) {
    // Ignore if server disables directory listing
  }

  // 2. Also check optional `assets/photography/photos.txt` if user placed a text list
  if (discoveredFiles.size === 0) {
    try {
      const txtRes = await fetch(`${normFolder}photos.txt`, { cache: "no-store" });
      if (txtRes.ok && !(txtRes.headers.get("content-type") || "").includes("text/html")) {
        const text = await txtRes.text();
        const lines = text
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);
        for (const file of lines) {
          const fullUrl = `${normFolder}${file}`;
          if (await verifyImageExists(fullUrl)) {
            discoveredFiles.add(fullUrl);
          }
        }
      }
    } catch (e) {}
  }

  // 3. Fallback for static hosts (e.g. GitHub Pages without directory listing):
  // Probe candidate filenames and ONLY keep the exact ones that exist in the folder
  if (discoveredFiles.size === 0) {
    const probePromises = candidateFilesToProbe.map(async (file) => {
      const fullUrl = `${normFolder}${file}`;
      const exists = await verifyImageExists(fullUrl);
      return exists ? fullUrl : null;
    });
    const results = await Promise.all(probePromises);
    results.filter(Boolean).forEach((url) => discoveredFiles.add(url));
  }

  return Array.from(discoveredFiles);
}

async function loadAndRenderPhotography() {
  const grid = document.getElementById("photography-grid");
  const countBadge = document.getElementById("photo-count-badge");
  const validPhotoUrls = await discoverPhotographyImages();

  countBadge.textContent = `FOLDER COUNT: ${validPhotoUrls.length} IMAGE${
    validPhotoUrls.length === 1 ? "" : "S"
  }`;

  if (validPhotoUrls.length === 0) {
    grid.style.display = "block";
    grid.innerHTML = `
      <div class="empty-state-box">
        <div class="empty-state-title">// 0 IMAGES IN PHOTOGRAPHY FOLDER</div>
        <div class="empty-state-desc">
          No images were found in <code>${PORTFOLIO_CONFIG.photographyConfig.folder}</code>.
          Drop <code>.jpg</code>, <code>.png</code>, or <code>.webp</code> files into the folder to display them here.
        </div>
      </div>
    `;
    return;
  }

  grid.style.display = "grid";
  grid.innerHTML = "";

  const lightboxItems = validPhotoUrls.map((url, i) => {
    const fileName = url.split("/").pop();
    return {
      src: url,
      caption: `${fileName} // [${i + 1} / ${validPhotoUrls.length}]`
    };
  });

  validPhotoUrls.forEach((url, idx) => {
    const fileName = url.split("/").pop();
    const card = document.createElement("div");
    card.className = "insta-card";

    const img = document.createElement("img");
    img.className = "photo-grid-img";
    img.crossOrigin = "anonymous";
    img.src = url;
    img.alt = fileName;

    img.addEventListener("load", () => {
      if (currentTabIndex === 2) updatePhotographyAverageColor();
    });

    card.innerHTML = `
      <div class="insta-overlay">
        <span class="insta-title">${fileName}</span>
      </div>
    `;
    card.prepend(img);
    grid.appendChild(card);

    card.addEventListener("click", () => {
      openLightbox(lightboxItems, idx);
    });
  });
}

/**
 * ============================================================================
 * 6. TAB NAVIGATION & DIRECTIONAL SLIDE ANIMATIONS
 * ============================================================================
 */
const TABS = ["about", "projects", "photography"];
const TAB_LABELS = ["ABOUT ME", "PROJECTS", "PHOTOGRAPHY"];
let currentTabIndex = 0;

function switchTab(targetIndex) {
  if (targetIndex === currentTabIndex) return;

  const direction = targetIndex > currentTabIndex ? "right" : "left";
  const isWrapAroundNext = currentTabIndex === 2 && targetIndex === 0;
  const isWrapAroundPrev = currentTabIndex === 0 && targetIndex === 2;
  const slideClass =
    isWrapAroundNext || (!isWrapAroundPrev && direction === "right")
      ? "slide-in-right"
      : "slide-in-left";

  currentTabIndex = targetIndex;

  document.querySelectorAll(".tab-btn").forEach((btn, idx) => {
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
    setTimeout(updatePhotographyAverageColor, 60);
  } else {
    document.body.classList.remove("photo-theme-active");
    resetToCadTheme();
  }
}

/**
 * ============================================================================
 * 7. PHOTOGRAPHY DYNAMIC SCREEN-AVERAGE COLOR ENGINE
 * ============================================================================
 */
function resetToCadTheme() {
  const bgLayer = document.getElementById("bg-canvas-layer");
  bgLayer.style.backgroundColor = "#1f2326";
  bgLayer.style.backgroundImage = "none";
  document.getElementById("swatch-dot").style.backgroundColor = "#1f2326";
  document.getElementById("swatch-hex").textContent = "#1F2326";
}

function updatePhotographyAverageColor() {
  if (currentTabIndex !== 2) return;

  const imgs = Array.from(document.querySelectorAll(".photo-grid-img"));
  if (imgs.length === 0) {
    resetToCadTheme();
    return;
  }

  const canvas = document.getElementById("color-sampler-canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  let totalR = 0,
    totalG = 0,
    totalB = 0,
    countedImages = 0;
  const viewportH = window.innerHeight;

  imgs.forEach((img) => {
    const rect = img.getBoundingClientRect();
    const isVisible = rect.bottom > 60 && rect.top < viewportH && rect.width > 0;
    if (!isVisible || !img.complete || img.naturalWidth === 0) return;

    try {
      ctx.clearRect(0, 0, 32, 32);
      ctx.drawImage(img, 0, 0, 32, 32);
      const data = ctx.getImageData(0, 0, 32, 32).data;

      let r = 0,
        g = 0,
        b = 0,
        pixels = 0;
      for (let i = 0; i < data.length; i += 16) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        pixels++;
      }
      if (pixels > 0) {
        totalR += r / pixels;
        totalG += g / pixels;
        totalB += b / pixels;
        countedImages++;
      }
    } catch (e) {}
  });

  if (countedImages > 0) {
    const avgR = Math.round((totalR / countedImages) * 0.65);
    const avgG = Math.round((totalG / countedImages) * 0.65);
    const avgB = Math.round((totalB / countedImages) * 0.65);

    const hex =
      "#" +
      [avgR, avgG, avgB]
        .map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();

    const bgLayer = document.getElementById("bg-canvas-layer");
    bgLayer.style.backgroundColor = `rgb(${avgR}, ${avgG}, ${avgB})`;
    bgLayer.style.backgroundImage = `radial-gradient(circle at 50% 30%, rgba(${Math.min(
      255,
      avgR + 45
    )}, ${Math.min(255, avgG + 45)}, ${Math.min(255, avgB + 45)}, 0.38), rgba(18, 21, 24, 0.88))`;

    document.getElementById("swatch-dot").style.backgroundColor = hex;
    document.getElementById("swatch-hex").textContent = hex;
  }
}

/**
 * ============================================================================
 * 8. UNIVERSAL LIGHTBOX MODAL (WITH SCROLL LOCK)
 * ============================================================================
 */
let currentLightboxList = [];
let currentLightboxIndex = 0;

function preventBackgroundScroll(e) {
  e.preventDefault();
}

function openLightbox(items, startIndex = 0) {
  currentLightboxList = items;
  currentLightboxIndex = startIndex;
  updateLightboxSlide();

  const modal = document.getElementById("lightbox-modal");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");

  // Lock page scrolling while viewing full-size image
  document.body.classList.add("lightbox-lock");
  window.addEventListener("wheel", preventBackgroundScroll, { passive: false });
  window.addEventListener("touchmove", preventBackgroundScroll, { passive: false });
}

function closeLightbox() {
  const modal = document.getElementById("lightbox-modal");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");

  // Restore page scrolling
  document.body.classList.remove("lightbox-lock");
  window.removeEventListener("wheel", preventBackgroundScroll);
  window.removeEventListener("touchmove", preventBackgroundScroll);
}

function updateLightboxSlide() {
  if (!currentLightboxList.length) return;
  const item = currentLightboxList[currentLightboxIndex];
  document.getElementById("lightbox-img").src = item.src;
  document.getElementById("lightbox-caption").textContent = item.caption || "";
  document.getElementById("lightbox-counter").textContent = `${
    currentLightboxIndex + 1
  } / ${currentLightboxList.length}`;
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
 * 9. INITIALIZATION & EVENT LISTENERS
 * ============================================================================
 */
window.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([
    renderAboutSection(),
    loadAndRenderProjects(),
    loadAndRenderPhotography()
  ]);

  // Fade out loader and trigger staggered entrance animation
  setTimeout(() => {
    document.getElementById("page-loader").classList.add("loaded");
    document.body.classList.add("page-ready");
  }, 450);

  // Top Navigation Tabs
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      switchTab(parseInt(btn.dataset.index, 10));
    });
  });

  // Side Arrow Bars
  document.getElementById("side-nav-prev").addEventListener("click", () => {
    switchTab((currentTabIndex - 1 + TABS.length) % TABS.length);
  });

  document.getElementById("side-nav-next").addEventListener("click", () => {
    switchTab((currentTabIndex + 1) % TABS.length);
  });

  // Bio Edit Toggle
  // const editBioBtn = document.getElementById("toggle-bio-edit");
  // const bioContent = document.getElementById("about-bio-content");
  // editBioBtn.addEventListener("click", () => {
  //   const isEditing = bioContent.getAttribute("contenteditable") === "true";
  //   if (isEditing) {
  //     bioContent.setAttribute("contenteditable", "false");
  //     localStorage.setItem("azcore_custom_bio", bioContent.innerHTML);
  //     editBioBtn.textContent = "EDIT TEXT";
  //   } else {
  //     bioContent.setAttribute("contenteditable", "true");
  //     bioContent.focus();
  //     editBioBtn.textContent = "SAVE TEXT";
  //   }
  // });

  // Live AutoCAD Cursor Coordinates
  const coordReadout = document.getElementById("coord-readout");
  window.addEventListener("mousemove", (e) => {
    const x = String(e.clientX).padStart(4, "0");
    const y = String(e.clientY).padStart(4, "0");
    coordReadout.textContent = `X: ${x} // Y: ${y}`;
  });

  // Re-sample Photography Average Color on Scroll / Resize
  window.addEventListener(
    "scroll",
    () => {
      if (currentTabIndex === 2) updatePhotographyAverageColor();
    },
    { passive: true }
  );
  window.addEventListener("resize", () => {
    if (currentTabIndex === 2) updatePhotographyAverageColor();
  });

  // Lightbox Events
  const lightboxModal = document.getElementById("lightbox-modal");
  lightboxModal.addEventListener("click", (e) => {
    if (e.target === lightboxModal) closeLightbox();
  });
  document.getElementById("lightbox-prev").addEventListener("click", (e) => {
    e.stopPropagation();
    stepLightbox(-1);
  });
  document.getElementById("lightbox-next").addEventListener("click", (e) => {
    e.stopPropagation();
    stepLightbox(1);
  });

  window.addEventListener("keydown", (e) => {
    if (lightboxModal.classList.contains("open")) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") stepLightbox(-1);
      if (e.key === "ArrowRight") stepLightbox(1);
    }
  });
});