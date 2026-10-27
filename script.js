/**
 * ============================================================================
 * 1. MODULAR PORTFOLIO CONFIGURATION
 * ============================================================================
 */
const PORTFOLIO_CONFIG = {
  brandName: "AZCORE",

  // -------------------- TAB 1: ABOUT ME & RESUME CONFIG --------------------
  about: {
    name: "ALEXANDER ZHUK",
    headline: "ENGINEERING, FABRICATION & VISUAL DESIGN",
    folder: "assets/about/",
    profileImage: "profile.jpg",
    resume: {
      file: "resume.pdf", // Place at assets/about/resume.pdf
      title: "ALEXANDER_ZHUK_RESUME.PDF",
      subtitle: "Civil Engineering, CAD/CFD Simulation, Metal Fabrication & Leadership Experience"
    },
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
  projectsConfig: {
    baseFolder: "assets/projects/",
    textFileName: "project.txt",
    foldersToCheck: [
      "LARP",
      "project-02",
      "project-03",
      "project-04",
      "project-05",
      "project-06",
      "battery-accumulator",
      "gokart-build",
      "solar-canopy",
      "aero-cfd"
    ]
  },

  // -------------------- TAB 3: PHOTOGRAPHY FOLDER CONFIG --------------------
  photographyConfig: {
    folder: "assets/photography/",
    // Supports up to 80 numbered files automatically if static server disables directory listing
    maxNumberedProbe: 80
  }
};

/**
 * ============================================================================
 * 2. ZERO-LAG FILE EXISTENCE CHECKER (HEAD REQUESTS = 0 BYTES DOWNLOADED)
 * ============================================================================
 */
function normalizeFolder(path) {
  return path.endsWith("/") ? path : path + "/";
}

function isStlFile(path) {
  return /\.stl$/i.test(path);
}

// Uses a lightweight HTTP HEAD request instead of `new Image()` so checking 50+
// 100MB photos downloads 0 bytes of actual image payload.
async function verifyFileExistsFast(url) {
  try {
    const res = await fetch(url, { method: "HEAD", cache: "no-store" });
    if (!res.ok) return false;
    const contentType = res.headers.get("content-type") || "";
    // Reject fallback HTML 404 pages returned by some static servers
    if (contentType.includes("text/html")) return false;
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * ============================================================================
 * 3. 3D .STL VIEWER ENGINE (AUTO-ROTATING PREVIEW + INTERACTIVE ORBIT LIGHTBOX)
 * ============================================================================
 */
const stlGeometryCache = new Map();

function loadStlGeometry(url) {
  if (stlGeometryCache.has(url)) {
    return Promise.resolve(stlGeometryCache.get(url));
  }
  return new Promise((resolve, reject) => {
    if (typeof THREE === "undefined" || !THREE.STLLoader) {
      reject(new Error("Three.js STLLoader not available"));
      return;
    }
    const loader = new THREE.STLLoader();
    loader.load(
      url,
      (geometry) => {
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        // Center geometry at origin (0, 0, 0)
        geometry.center();
        stlGeometryCache.set(url, geometry);
        resolve(geometry);
      },
      undefined,
      (err) => reject(err)
    );
  });
}

// Mounts a slowly rotating 3D STL preview inside a project card or gallery item.
// Automatically pauses rendering when scrolled off-screen to save GPU!
function mountAutoRotatingStlPreview(container, stlUrl) {
  const badge = document.createElement("div");
  badge.className = "stl-badge-overlay";
  badge.textContent = "3D STL // CLICK TO ORBIT";
  container.appendChild(badge);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 16 / 10, 0.1, 2000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Studio CAD Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.85);
  dirLight1.position.set(60, 80, 70);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0xd92804, 0.35);
  dirLight2.position.set(-60, -40, -50);
  scene.add(dirLight2);

  // Subtle AutoCAD Ground Grid
  const grid = new THREE.GridHelper(120, 12, 0xd92804, 0x333a40);
  grid.position.y = -28;
  scene.add(grid);

  let mesh = null;
  let isVisible = false;
  let animFrameId = null;

  function resizeRenderer() {
    const w = container.clientWidth || 320;
    const h = container.clientHeight || 240;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  loadStlGeometry(stlUrl)
    .then((geometry) => {
      const material = new THREE.MeshStandardMaterial({
        color: 0xd8dee4,
        metalness: 0.35,
        roughness: 0.42
      });
      mesh = new THREE.Mesh(geometry, material);

      // Auto-scale any STL size to fit cleanly inside a 50-unit sphere
      geometry.computeBoundingSphere();
      const radius = geometry.boundingSphere.radius || 1;
      const scale = 38 / radius;
      mesh.scale.set(scale, scale, scale);
      scene.add(mesh);

      camera.position.set(55, 38, 75);
      camera.lookAt(0, 0, 0);
      resizeRenderer();
      renderer.render(scene, camera);
    })
    .catch(() => {
      badge.textContent = "STL LOAD ERROR";
    });

  function animate() {
    if (!isVisible) return;
    animFrameId = requestAnimationFrame(animate);
    if (mesh) {
      mesh.rotation.y += 0.008; // Slow continuous rotation
    }
    renderer.render(scene, camera);
  }

  // Only animate when visible on screen
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          resizeRenderer();
          animate();
        } else if (animFrameId) {
          cancelAnimationFrame(animFrameId);
        }
      });
    },
    { threshold: 0.05 }
  );
  observer.observe(container);

  window.addEventListener("resize", () => {
    if (isVisible) resizeRenderer();
  });
}

/**
 * ============================================================================
 * 4. TAB 1: RENDER ABOUT ME & RESUME
 * ============================================================================
 */
async function renderAboutSection() {
  const cfg = PORTFOLIO_CONFIG.about;
  document.getElementById("nav-brand-name").textContent = PORTFOLIO_CONFIG.brandName;
  document.getElementById("about-headline").textContent = cfg.headline;
  document.getElementById("about-name-caption").textContent = cfg.name;

  // Profile Portrait
  const profileImg = document.getElementById("about-profile-img");
  const fullProfilePath = `${normalizeFolder(cfg.folder)}${cfg.profileImage}`;
  const exists = await verifyFileExistsFast(fullProfilePath);

  if (exists) {
    profileImg.src = fullProfilePath;
  } else {
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
    openLightbox([{ type: "image", src: profileImg.src, caption: `${cfg.name} // ${fullProfilePath}` }], 0);
  });

  // Resume Setup
  const resumePath = `${normalizeFolder(cfg.folder)}${cfg.resume.file}`;
  document.getElementById("resume-title-display").textContent = cfg.resume.title;
  document.getElementById("resume-subtitle-display").textContent = cfg.resume.subtitle;
  const downloadLink = document.getElementById("download-resume-link");
  downloadLink.href = resumePath;

  const resumeExists = await verifyFileExistsFast(resumePath);
  const statusTag = document.getElementById("resume-status-tag");
  if (resumeExists) {
    statusTag.textContent = "PDF VERIFIED";
  } else {
    statusTag.textContent = `PLACE AT: ${resumePath}`;
    statusTag.style.color = "#ff9f0a";
    statusTag.style.borderColor = "rgba(255, 159, 10, 0.4)";
  }

  document.getElementById("preview-resume-btn").addEventListener("click", () => {
    openLightbox(
      [
        {
          type: "pdf",
          src: resumePath,
          caption: `${cfg.resume.title} // ${resumePath}`
        }
      ],
      0
    );
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
 * 5. TAB 2: MODULAR TEXT-FILE & 3D .STL DRIVEN PROJECTS ENGINE
 * ============================================================================
 */
function parseProjectTextFile(rawText, folderPath) {
  const lines = rawText.replace(/\r\n/g, "\n").split("\n");
  const data = {
    title: "",
    code: "PRJ // ARCHIVE",
    tags: [],
    mainAsset: "",
    assets: [],
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
    } else if (/^MAIN(_IMAGE|_STL|_MODEL)?\s*:/i.test(line)) {
      inDescription = false;
      data.mainAsset = line.replace(/^MAIN(_IMAGE|_STL|_MODEL)?\s*:\s*/i, "").trim();
    } else if (/^(IMAGES|FILES|ASSETS)\s*:/i.test(line)) {
      inDescription = false;
      const items = line
        .replace(/^(IMAGES|FILES|ASSETS)\s*:\s*/i, "")
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean);
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

  if (!data.mainAsset && data.assets.length > 0) {
    data.mainAsset = data.assets[0];
  }
  if (data.mainAsset && !data.assets.includes(data.mainAsset)) {
    data.assets.unshift(data.mainAsset);
  }

  return data;
}

async function discoverProjectFolders(baseFolder, configuredFolders) {
  const folderSet = new Set(configuredFolders);
  try {
    const res = await fetch(baseFolder, { cache: "no-store" });
    if (res.ok && (res.headers.get("content-type") || "").includes("text/html")) {
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      doc.querySelectorAll("a").forEach((a) => {
        const href = a.getAttribute("href") || "";
        if (href.endsWith("/") && !href.startsWith("../") && !href.startsWith("/")) {
          folderSet.add(href.replace(/\/$/, ""));
        }
      });
    }
  } catch (e) {}
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
      if ((res.headers.get("content-type") || "").includes("text/html")) continue;

      const rawText = await res.text();
      if (!rawText || !rawText.trim()) continue;

      const parsed = parseProjectTextFile(rawText, projFolder);
      if (!parsed.title && parsed.assets.length === 0) continue;

      // Verify linked images or .stl files in parallel
      const checks = await Promise.all(
        parsed.assets.map(async (file) => {
          const fullPath = `${projFolder}${file}`;
          const ok = await verifyFileExistsFast(fullPath);
          return ok ? { src: fullPath, type: isStlFile(file) ? "stl" : "image", file } : null;
        })
      );

      const verifiedAssets = checks.filter(Boolean);
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
          No valid <code>project.txt</code> files with linked images or <code>.stl</code> models were found inside <code>${normBase}</code>.
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
    const mainAsset = proj.verifiedAssets[0];
    const stackPreview = proj.verifiedAssets.slice(0, 3);

    const stackVisualHtml = stackPreview
      .map((item) =>
        item.type === "stl"
          ? `<div class="stack-card-stl">[3D STL]</div>`
          : `<img class="stack-card-img" src="${item.src}" loading="lazy" decoding="async" alt="Stack preview" />`
      )
      .join("");

    card.innerHTML = `
      <div class="project-top-layout">
        <div class="project-main-img-wrap" id="main-wrap-${idx}">
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
          <span>CLICK ANY IMAGE OR .STL MODEL FOR FULL SCREEN</span>
        </div>
        <div class="project-gallery-grid"></div>
      </div>
    `;

    container.appendChild(card);

    const lightboxList = proj.verifiedAssets.map((asset, i) => ({
      type: asset.type,
      src: asset.src,
      caption: `${proj.title} (${asset.file}) // [${i + 1}/${proj.verifiedAssets.length}]`
    }));

    // Render Main Hero Slot (Either Auto-Rotating 3D STL or Image)
    const mainWrap = card.querySelector(`#main-wrap-${idx}`);
    if (mainAsset.type === "stl") {
      const stlStage = document.createElement("div");
      stlStage.className = "stl-preview-container";
      mainWrap.prepend(stlStage);
      mountAutoRotatingStlPreview(stlStage, mainAsset.src);
    } else {
      const mainImg = document.createElement("img");
      mainImg.className = "interactive-img project-main-img";
      mainImg.src = mainAsset.src;
      mainImg.loading = "lazy";
      mainImg.decoding = "async";
      mainImg.alt = proj.title;
      mainWrap.prepend(mainImg);
    }

    mainWrap.addEventListener("click", () => openLightbox(lightboxList, 0));

    // Render Expanded Grid Drawer (Supports both Images and .STL files)
    const galleryGrid = card.querySelector(".project-gallery-grid");
    proj.verifiedAssets.forEach((asset, assetIdx) => {
      const itemWrap = document.createElement("div");
      itemWrap.className = "project-gallery-item";

      if (asset.type === "stl") {
        const stlBox = document.createElement("div");
        stlBox.className = "stl-preview-container";
        itemWrap.appendChild(stlBox);
        mountAutoRotatingStlPreview(stlBox, asset.src);
      } else {
        const img = document.createElement("img");
        img.className = "interactive-img";
        img.src = asset.src;
        img.loading = "lazy";
        img.decoding = "async";
        img.alt = `${proj.title} item ${assetIdx + 1}`;
        itemWrap.appendChild(img);
      }

      itemWrap.addEventListener("click", () => openLightbox(lightboxList, assetIdx));
      galleryGrid.appendChild(itemWrap);
    });

    // Stack Drawer Toggle
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
 * 6. TAB 3: HIGH-PERFORMANCE PHOTOGRAPHY ENGINE (50+ IMAGES / 100MB+ ZERO LAG)
 * ============================================================================
 */
async function discoverPhotographyImages() {
  const { folder, maxNumberedProbe } = PORTFOLIO_CONFIG.photographyConfig;
  const normFolder = normalizeFolder(folder);
  const discoveredFiles = new Set();
  const imageRegex = /\.(jpe?g|png|webp|avif|gif)$/i;

  // 1. Fast directory listing scan (Live Server / Python http.server / Apache)
  try {
    const res = await fetch(normFolder, { cache: "no-store" });
    if (res.ok && (res.headers.get("content-type") || "").includes("text/html")) {
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
  } catch (e) {}

  // 2. Optional `photos.txt` manifest check
  if (discoveredFiles.size === 0) {
    try {
      const txtRes = await fetch(`${normFolder}photos.txt`, { cache: "no-store" });
      if (txtRes.ok && !(txtRes.headers.get("content-type") || "").includes("text/html")) {
        const text = await txtRes.text();
        const lines = text
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);
        const checks = await Promise.all(
          lines.map(async (file) => {
            const url = `${normFolder}${file}`;
            return (await verifyFileExistsFast(url)) ? url : null;
          })
        );
        checks.filter(Boolean).forEach((u) => discoveredFiles.add(u));
      }
    } catch (e) {}
  }

  // 3. Fast HEAD probing for up to `maxNumberedProbe` (e.g. 80) photos on static hosts
  if (discoveredFiles.size === 0) {
    const candidates = [];
    for (let i = 1; i <= maxNumberedProbe; i++) {
      const pad = String(i).padStart(2, "0");
      candidates.push(`${pad}.jpg`, `${i}.jpg`, `photo-${pad}.jpg`);
    }
    // Batch HEAD requests in chunks of 20 so we don't choke browser sockets
    for (let i = 0; i < candidates.length; i += 24) {
      const batch = candidates.slice(i, i + 24);
      const results = await Promise.all(
        batch.map(async (file) => {
          const url = `${normFolder}${file}`;
          return (await verifyFileExistsFast(url)) ? url : null;
        })
      );
      results.filter(Boolean).forEach((u) => discoveredFiles.add(u));
    }
  }

  return Array.from(discoveredFiles);
}

// Samples an image's average RGB ONCE when it finishes loading and caches it
// on `card.dataset.r/g/b` so scrolling never touches the canvas or GPU!
function cacheSingleImageColorOnce(img, card) {
  if (card.dataset.colorCached === "true") return;
  try {
    const canvas = document.getElementById("color-sampler-canvas");
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
      type: "image",
      src: url,
      caption: `${fileName} // [${i + 1} / ${validPhotoUrls.length}]`
    };
  });

  // Lazy-load observer: only loads high-res image bytes when within 350px of viewport
  const lazyObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const card = entry.target;
        const img = card.querySelector("img");
        if (img && img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
        }
        obs.unobserve(card);
      });
    },
    { rootMargin: "350px 0px" }
  );

  validPhotoUrls.forEach((url, idx) => {
    const fileName = url.split("/").pop();
    const card = document.createElement("div");
    card.className = "insta-card";

    const img = document.createElement("img");
    img.className = "photo-grid-img";
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.dataset.src = url;
    img.alt = fileName;

    img.addEventListener("load", () => {
      img.classList.add("img-loaded");
      // Compute RGB once in idle/next frame and store in dataset
      requestAnimationFrame(() => {
        cacheSingleImageColorOnce(img, card);
        if (currentTabIndex === 2) scheduleAverageColorUpdate();
      });
    });

    card.innerHTML = `
      <div class="insta-overlay">
        <span class="insta-title">${fileName}</span>
      </div>
    `;
    card.prepend(img);
    grid.appendChild(card);

    lazyObserver.observe(card);

    card.addEventListener("click", () => {
      openLightbox(lightboxItems, idx);
    });
  });
}

/**
 * ============================================================================
 * 7. INSTANT CACHED AVERAGE COLOR ENGINE (<0.05ms PER SCROLL FRAME)
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
  bgLayer.style.backgroundColor = "#1f2326";
  bgLayer.style.backgroundImage = "none";
  document.getElementById("swatch-dot").style.backgroundColor = "#1f2326";
  document.getElementById("swatch-hex").textContent = "#1F2326";
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
 * 8. TAB NAVIGATION & DIRECTIONAL SLIDE ANIMATIONS
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
    scheduleAverageColorUpdate();
  } else {
    document.body.classList.remove("photo-theme-active");
    resetToCadTheme();
  }
}

/**
 * ============================================================================
 * 9. UNIVERSAL LIGHTBOX (2D IMAGES + INTERACTIVE 3D STL + PDF RESUME)
 * ============================================================================
 */
let currentLightboxList = [];
let currentLightboxIndex = 0;

// Interactive Full-Screen STL state
let lbScene = null,
  lbCamera = null,
  lbRenderer = null,
  lbControls = null,
  lbMesh = null,
  lbAnimId = null;

function preventBackgroundScroll(e) {
  // Allow scroll wheel inside the 3D STL stage so OrbitControls can zoom!
  if (e.target && e.target.closest("#lightbox-stl-stage")) return;
  e.preventDefault();
}

function initOrUpdateLightboxStl(stlUrl) {
  const stage = document.getElementById("lightbox-stl-stage");
  const wireBtn = document.getElementById("stl-wireframe-btn");
  const resetBtn = document.getElementById("stl-reset-btn");

  if (!lbRenderer) {
    lbScene = new THREE.Scene();
    lbCamera = new THREE.PerspectiveCamera(42, 16 / 10, 0.1, 4000);
    lbRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    lbRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    stage.appendChild(lbRenderer.domElement);

    lbControls = new THREE.OrbitControls(lbCamera, lbRenderer.domElement);
    lbControls.enableDamping = true;
    lbControls.dampingFactor = 0.06;

    const amb = new THREE.AmbientLight(0xffffff, 0.7);
    lbScene.add(amb);

    const dir1 = new THREE.DirectionalLight(0xffffff, 0.9);
    dir1.position.set(100, 140, 120);
    lbScene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0xd92804, 0.45);
    dir2.position.set(-100, -80, -90);
    lbScene.add(dir2);

    const grid = new THREE.GridHelper(180, 18, 0xd92804, 0x2f363d);
    grid.position.y = -42;
    lbScene.add(grid);

    wireBtn.addEventListener("click", () => {
      if (!lbMesh) return;
      lbMesh.material.wireframe = !lbMesh.material.wireframe;
      wireBtn.textContent = `WIREFRAME: ${lbMesh.material.wireframe ? "ON" : "OFF"}`;
    });

    resetBtn.addEventListener("click", () => {
      if (!lbControls) return;
      lbControls.reset();
      lbCamera.position.set(70, 50, 95);
      lbControls.update();
    });
  }

  const w = stage.clientWidth || window.innerWidth * 0.78;
  const h = stage.clientHeight || window.innerHeight * 0.74;
  lbCamera.aspect = w / h;
  lbCamera.updateProjectionMatrix();
  lbRenderer.setSize(w, h);

  if (lbMesh) {
    lbScene.remove(lbMesh);
    lbMesh.material.dispose();
    lbMesh = null;
  }

  wireBtn.textContent = "WIREFRAME: OFF";

  loadStlGeometry(stlUrl).then((geometry) => {
    const material = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.38,
      roughness: 0.38,
      wireframe: false
    });
    lbMesh = new THREE.Mesh(geometry, material);

    geometry.computeBoundingSphere();
    const radius = geometry.boundingSphere.radius || 1;
    const scale = 52 / radius;
    lbMesh.scale.set(scale, scale, scale);
    lbScene.add(lbMesh);

    lbControls.reset();
    lbCamera.position.set(70, 50, 95);
    lbControls.update();
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

  // Lock background scroll
  document.body.classList.add("lightbox-lock");
  window.addEventListener("wheel", preventBackgroundScroll, { passive: false });
  window.addEventListener("touchmove", preventBackgroundScroll, { passive: false });

  updateLightboxSlide();
}

function closeLightbox() {
  const modal = document.getElementById("lightbox-modal");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");

  if (lbAnimId) {
    cancelAnimationFrame(lbAnimId);
    lbAnimId = null;
  }

  document.getElementById("lightbox-pdf-frame").src = "";

  document.body.classList.remove("lightbox-lock");
  window.removeEventListener("wheel", preventBackgroundScroll);
  window.removeEventListener("touchmove", preventBackgroundScroll);
}

function updateLightboxSlide() {
  if (!currentLightboxList.length) return;
  const item = currentLightboxList[currentLightboxIndex];

  const imgEl = document.getElementById("lightbox-img");
  const stlStage = document.getElementById("lightbox-stl-stage");
  const pdfFrame = document.getElementById("lightbox-pdf-frame");
  const wireBtn = document.getElementById("stl-wireframe-btn");
  const resetBtn = document.getElementById("stl-reset-btn");

  // Hide all viewers first
  imgEl.style.display = "none";
  stlStage.style.display = "none";
  pdfFrame.style.display = "none";
  wireBtn.style.display = "none";
  resetBtn.style.display = "none";

  if (lbAnimId) {
    cancelAnimationFrame(lbAnimId);
    lbAnimId = null;
  }

  if (item.type === "stl") {
    stlStage.style.display = "block";
    wireBtn.style.display = "inline-block";
    resetBtn.style.display = "inline-block";
    initOrUpdateLightboxStl(item.src);
  } else if (item.type === "pdf") {
    pdfFrame.style.display = "block";
    pdfFrame.src = item.src;
  } else {
    imgEl.style.display = "block";
    imgEl.src = item.src;
  }

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
 * 10. INITIALIZATION & EVENT LISTENERS
 * ============================================================================
 */
window.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([
    renderAboutSection(),
    loadAndRenderProjects(),
    loadAndRenderPhotography()
  ]);

  setTimeout(() => {
    document.getElementById("page-loader").classList.add("loaded");
    document.body.classList.add("page-ready");
  }, 450);

  // Top Tab Buttons
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
  const editBioBtn = document.getElementById("toggle-bio-edit");
  const bioContent = document.getElementById("about-bio-content");
  editBioBtn.addEventListener("click", () => {
    const isEditing = bioContent.getAttribute("contenteditable") === "true";
    if (isEditing) {
      bioContent.setAttribute("contenteditable", "false");
      localStorage.setItem("azcore_custom_bio", bioContent.innerHTML);
      editBioBtn.textContent = "EDIT TEXT";
    } else {
      bioContent.setAttribute("contenteditable", "true");
      bioContent.focus();
      editBioBtn.textContent = "SAVE TEXT";
    }
  });

  // Live AutoCAD Cursor Coordinates
  const coordReadout = document.getElementById("coord-readout");
  window.addEventListener(
    "mousemove",
    (e) => {
      const x = String(e.clientX).padStart(4, "0");
      const y = String(e.clientY).padStart(4, "0");
      coordReadout.textContent = `X: ${x} // Y: ${y}`;
    },
    { passive: true }
  );

  // Throttled 60fps Photography Average Color Update on Scroll / Resize
  window.addEventListener(
    "scroll",
    () => {
      if (currentTabIndex === 2) scheduleAverageColorUpdate();
    },
    { passive: true }
  );
  window.addEventListener("resize", () => {
    if (currentTabIndex === 2) scheduleAverageColorUpdate();
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