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
    profileImage: "profile.webp",
    resume: {
      file: "resume.pdf",
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
    // Optional dual-resolution subfolders inside a project folder (falls back to root of project folder if not used)
    previewSubfolder: "preview/",
    fullSubfolder: "full/",
    foldersToCheck: [
      "LARP"
    ]
  },

  // -------------------- TAB 3: PHOTOGRAPHY FOLDER CONFIG --------------------
  photographyConfig: {
    // Change `gridColumns` anytime to adjust how many photos appear per row (currently 5 wide)
    gridColumns: 5,
    folder: "assets/photography/",
    // Dual-folder setup: lightweight thumbnails in `preview/`, uncompressed originals in `full/`
    // (If an image isn't inside `preview/` or `full/`, the script automatically falls back to `assets/photography/<file>`)
    previewSubfolder: "preview/",
    fullSubfolder: "full/",
    maxNumberedProbe: 80
  }
};

/**
 * ============================================================================
 * 2. FILE HELPERS & CASE-TOLERANT ASSET VERIFICATION
 * ============================================================================
 */
function normalizeFolder(path) {
  if (!path) return "";
  return path.endsWith("/") ? path : path + "/";
}

function getAssetType(filename) {
  if (/\.glb|\.gltf$/i.test(filename)) return "glb";
  if (/\.stl$/i.test(filename)) return "stl";
  return "image";
}

function is3DAsset(type) {
  return type === "glb" || type === "stl";
}

async function verifyFileExistsFast(url) {
  try {
    const res = await fetch(url, { method: "HEAD", cache: "no-store" });
    if (!res.ok) return false;
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/html")) return false;
    return true;
  } catch (e) {
    return false;
  }
}

// Resolves exact casing (.stl vs .STL, .glb vs .GLB) so Windows/Git case mismatches don't 404
async function resolveValidUrlWithCaseFallback(baseFolder, fileName) {
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

// Automatically pairs .webp previews with .jpg/.png full-size images!
async function resolveDualImageUrls(baseFolder, previewSub, fullSub, fileName) {
  const normBase = normalizeFolder(baseFolder);
  const normPrev = normalizeFolder(previewSub);
  const normFull = normalizeFolder(fullSub);

  // Strip the extension so we have just the base name (e.g., "Image (1)")
  const dotIdx = fileName.lastIndexOf(".");
  const baseName = dotIdx !== -1 ? fileName.slice(0, dotIdx) : fileName;
  const originalExt = dotIdx !== -1 ? fileName.slice(dotIdx) : ".webp";

  // 1. Check Preview Folder (Prioritizes .webp first, then original extension, then .jpg)
  const previewExts = [...new Set([".webp", originalExt, ".jpg", ".JPG", ".png"])];
  let previewUrl = null;
  for (const ext of previewExts) {
    const candidate = `${normBase}${normPrev}${baseName}${ext}`;
    if (await verifyFileExistsFast(candidate)) {
      previewUrl = candidate;
      break;
    }
  }

  // 2. Check Full Folder (Prioritizes .jpg first, then original extension, then .webp/.png)
  const fullExts = [...new Set([".jpg", ".JPG", ".jpeg", originalExt, ".png", ".webp"])];
  let fullUrl = null;
  for (const ext of fullExts) {
    const candidate = `${normBase}${normFull}${baseName}${ext}`;
    if (await verifyFileExistsFast(candidate)) {
      fullUrl = candidate;
      break;
    }
  }

  // 3. Fallback: Check root folder directly if subfolders aren't used for a specific file
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
 * 3. UNIFIED 3D ENGINE (SUPPORTS FULL-COLOR .GLB/.GLTF & .STL MODELS)
 * ============================================================================
 */
const modelCache = new Map();

function load3DModelObject(url, type) {
  if (modelCache.has(url)) {
    return Promise.resolve(modelCache.get(url).clone(true));
  }

  return new Promise((resolve, reject) => {
    if (type === "glb") {
      if (typeof THREE === "undefined" || !THREE.GLTFLoader) {
        reject(new Error("THREE.GLTFLoader not loaded"));
        return;
      }
      const loader = new THREE.GLTFLoader();
      loader.load(
        url,
        (gltf) => {
          const root = gltf.scene || gltf.scenes[0];
          // Center and normalize scale to a consistent bounding radius
          const box = new THREE.Box3().setFromObject(root);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const scale = 62 / maxDim;

          const wrapper = new THREE.Group();
          root.position.sub(center);
          wrapper.add(root);
          wrapper.scale.set(scale, scale, scale);

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

          modelCache.set(url, wrapper);
          resolve(wrapper.clone(true));
        },
        undefined,
        (err) => reject(err)
      );
    }
  });
}

// Auto-rotating 3D card preview for both .GLB (with color) and .STL
function mountAutoRotating3DPreview(container, modelUrl, type) {
  const badge = document.createElement("div");
  badge.className = "stl-badge-overlay";
  badge.textContent = `3D ${type.toUpperCase()} // CLICK TO ORBIT`;
  container.appendChild(badge);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 16 / 10, 0.1, 2000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  // Balanced multi-directional lighting so colored .GLB materials look vibrant and accurate
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222830, 0.95);
  scene.add(hemiLight);

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight1.position.set(65, 90, 75);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.45);
  dirLight2.position.set(-65, -40, -60);
  scene.add(dirLight2);

  const grid = new THREE.GridHelper(120, 12, 0xd92804, 0x333a40);
  grid.position.y = -28;
  scene.add(grid);

  let modelGroup = null;
  let isVisible = false;
  let animFrameId = null;

  function resizeRenderer() {
    const w = container.clientWidth || 320;
    const h = container.clientHeight || 240;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  load3DModelObject(modelUrl, type)
    .then((obj) => {
      modelGroup = obj;
      scene.add(modelGroup);
      camera.position.set(55, 38, 75);
      camera.lookAt(0, 0, 0);
      resizeRenderer();
      renderer.render(scene, camera);
    })
    .catch(() => {
      badge.textContent = `${type.toUpperCase()} LOAD ERROR`;
    });

  function animate() {
    if (!isVisible) return;
    animFrameId = requestAnimationFrame(animate);
    if (modelGroup) {
      modelGroup.rotation.y += 0.008;
    }
    renderer.render(scene, camera);
  }

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
 * 4. POST-BOOT DEFERRED BACKGROUND PRE-WARM (RUNS WHILE READING ABOUT ME)
 * ============================================================================
 */
function backgroundPrewarmPreviewImages(previewUrls) {
  if (!previewUrls || previewUrls.length === 0) return;

  let currentIndex = 0;
  function loadNextChunk() {
    if (currentIndex >= previewUrls.length) return;
    const chunkLimit = Math.min(currentIndex + 4, previewUrls.length);

    for (let i = currentIndex; i < chunkLimit; i++) {
      const bgImg = new Image();
      bgImg.crossOrigin = "anonymous";
      bgImg.decoding = "async";
      bgImg.src = previewUrls[i];
    }

    currentIndex = chunkLimit;
    if (currentIndex < previewUrls.length) {
      setTimeout(loadNextChunk, 280);
    }
  }

  loadNextChunk();
}

/**
 * ============================================================================
 * 5. TAB 1: RENDER ABOUT ME & RESUME (LOADS IMMEDIATELY ON STARTUP)
 * ============================================================================
 */
async function renderAboutSection() {
  const cfg = PORTFOLIO_CONFIG.about;
  document.getElementById("nav-brand-name").textContent = PORTFOLIO_CONFIG.brandName;
  document.getElementById("about-headline").textContent = cfg.headline;
  document.getElementById("about-name-caption").textContent = cfg.name;

  // Set CSS variable for Photography Grid Columns immediately
  document.documentElement.style.setProperty(
    "--photo-grid-cols",
    PORTFOLIO_CONFIG.photographyConfig.gridColumns || 5
  );

  const profileImg = document.getElementById("about-profile-img");
  const normAboutFolder = normalizeFolder(cfg.folder);
  const resolvedProfile =
    (await resolveValidUrlWithCaseFallback(normAboutFolder, cfg.profileImage)) ||
    (await resolveValidUrlWithCaseFallback(normAboutFolder, "profile.jpg")) ||
    (await resolveValidUrlWithCaseFallback(normAboutFolder, "profile.png"));

  if (resolvedProfile) {
    profileImg.src = resolvedProfile;
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
          previewSrc: profileImg.src,
          fullSrc: profileImg.src,
          caption: `${cfg.name}`
        }
      ],
      0
    );
  });

  // Resume Setup
  const resumePath = cfg.resume.file.startsWith("http")
    ? cfg.resume.file
    : `${normAboutFolder}${cfg.resume.file}`;

  document.getElementById("resume-title-display").textContent = cfg.resume.title;
  document.getElementById("resume-subtitle-display").textContent = cfg.resume.subtitle;
  document.getElementById("download-resume-link").href = resumePath;

  const resumeExists = await verifyFileExistsFast(resumePath);
  const statusTag = document.getElementById("resume-status-tag");
  statusTag.textContent = resumeExists ? "PDF VERIFIED" : "READY";

  document.getElementById("preview-resume-btn").addEventListener("click", () => {
    openLightbox(
      [
        {
          type: "pdf",
          fullSrc: resumePath,
          caption: `${cfg.resume.title} // ${resumePath}`
        }
      ],
      0
    );
  });

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
          ${group.items.map((item) => `<span class="skill-tag">${item}</span>`).join("")}
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
 * 6. TAB 2: REWORKED PROJECT SYSTEM (.GLB, .STL, & DUAL-RES IMAGES)
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
    } else if (/^MAIN(_IMAGE|_STL|_MODEL|_GLB)?\s*:/i.test(line)) {
      inDescription = false;
      data.mainAsset = line.replace(/^MAIN(_IMAGE|_STL|_MODEL|_GLB)?\s*:\s*/i, "").trim();
    } else if (/^(IMAGES|FILES|ASSETS|MODELS)\s*:/i.test(line)) {
      inDescription = false;
      const items = line
        .replace(/^(IMAGES|FILES|ASSETS|MODELS)\s*:\s*/i, "")
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

  // Prioritize MAIN_IMAGE / MAIN_MODEL at index 0 of assets list
  if (data.mainAsset) {
    data.assets = [
      data.mainAsset,
      ...data.assets.filter((a) => a.toLowerCase() !== data.mainAsset.toLowerCase())
    ];
  }

  return data;
}

async function resolveProjectAsset(projFolder, fileName) {
  const { previewSubfolder, fullSubfolder } = PORTFOLIO_CONFIG.projectsConfig;
  const assetType = getAssetType(fileName);

  if (is3DAsset(assetType)) {
    const resolved3D = await resolveValidUrlWithCaseFallback(projFolder, fileName);
    if (!resolved3D) return null;
    return {
      type: assetType,
      previewSrc: resolved3D,
      fullSrc: resolved3D,
      file: fileName
    };
  }

  // Image asset: check preview/ and full/ subfolders or direct folder
  const dual = await resolveDualImageUrls(projFolder, previewSubfolder, fullSubfolder, fileName);
  if (dual) {
    return {
      type: "image",
      previewSrc: dual.previewUrl,
      fullSrc: dual.fullUrl,
      file: fileName
    };
  }

  // Case fallback check on direct image
  const fallbackDirect = await resolveValidUrlWithCaseFallback(projFolder, fileName);
  if (fallbackDirect) {
    return {
      type: "image",
      previewSrc: fallbackDirect,
      fullSrc: fallbackDirect,
      file: fileName
    };
  }

  return null;
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
        const res = await fetch(txtUrl, { cache: "no-store" });
        if (!res.ok) continue;
        if ((res.headers.get("content-type") || "").includes("text/html")) continue;

        const rawText = await res.text();
        if (!rawText || !rawText.trim()) continue;

        const parsed = parseProjectTextFile(rawText, projFolder);
        if (!parsed.title && parsed.assets.length === 0) continue;

        const resolvedList = await Promise.all(
          parsed.assets.map((file) => resolveProjectAsset(projFolder, file))
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
            No valid <code>project.txt</code> files with linked images, <code>.glb</code>, or <code>.stl</code> models were found inside <code>${normBase}</code>.
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
        .map((item) =>
          is3DAsset(item.type)
            ? `<div class="stack-card-3d">[3D ${item.type.toUpperCase()}]</div>`
            : `<img class="stack-card-img" src="${item.previewSrc}" loading="lazy" decoding="async" alt="Stack preview" />`
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
            <span>CLICK ANY IMAGE, .GLB, OR .STL MODEL FOR FULL SCREEN</span>
          </div>
          <div class="project-gallery-grid"></div>
        </div>
      `;

      container.appendChild(card);

      const lightboxList = proj.verifiedAssets.map((asset, i) => ({
        type: asset.type,
        previewSrc: asset.previewSrc,
        fullSrc: asset.fullSrc,
        caption: `${proj.title} (${asset.file}) // [${i + 1}/${proj.verifiedAssets.length}]`
      }));

      const mainWrap = card.querySelector(`#main-wrap-${idx}`);
      if (is3DAsset(mainAsset.type)) {
        const stage3d = document.createElement("div");
        stage3d.className = "stl-preview-container";
        mainWrap.prepend(stage3d);
        mountAutoRotating3DPreview(stage3d, mainAsset.fullSrc, mainAsset.type);
      } else {
        const mainImg = document.createElement("img");
        mainImg.className = "interactive-img project-main-img";
        mainImg.src = mainAsset.previewSrc;
        mainImg.loading = "lazy";
        mainImg.decoding = "async";
        mainImg.alt = proj.title;
        mainWrap.prepend(mainImg);
      }

      mainWrap.addEventListener("click", () => openLightbox(lightboxList, 0));

      const galleryGrid = card.querySelector(".project-gallery-grid");
      proj.verifiedAssets.forEach((asset, assetIdx) => {
        const itemWrap = document.createElement("div");
        itemWrap.className = "project-gallery-item";

        if (is3DAsset(asset.type)) {
          const box3d = document.createElement("div");
          box3d.className = "stl-preview-container";
          itemWrap.appendChild(box3d);
          mountAutoRotating3DPreview(box3d, asset.fullSrc, asset.type);
        } else {
          const img = document.createElement("img");
          img.className = "interactive-img";
          img.src = asset.previewSrc;
          img.loading = "lazy";
          img.decoding = "async";
          img.alt = `${proj.title} item ${assetIdx + 1}`;
          itemWrap.appendChild(img);
        }

        itemWrap.addEventListener("click", () => openLightbox(lightboxList, assetIdx));
        galleryGrid.appendChild(itemWrap);
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

    projectsLoaded = true;
  })();

  return projectsLoadingPromise;
}

/**
 * ============================================================================
 * 7. TAB 3: DUAL-SET PHOTOGRAPHY ENGINE (PREVIEW GRID -> FULL-RES ON CLICK)
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

  // 1. Check `photos.txt` manifest first
  try {
    const txtRes = await fetch(`${normFolder}photos.txt`, { cache: "no-store" });
    if (txtRes.ok && !(txtRes.headers.get("content-type") || "").includes("text/html")) {
      const text = await txtRes.text();
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      const resolvedBatch = await Promise.all(
        lines.map(async (fileName) => {
          const dual = await resolveDualImageUrls(
            normFolder,
            previewSubfolder,
            fullSubfolder,
            fileName
          );
          return dual ? { fileName, ...dual } : null;
        })
      );

      resolvedBatch.filter(Boolean).forEach((item) => {
        if (!seenNames.has(item.fileName)) {
          seenNames.add(item.fileName);
          discoveredItems.push(item);
        }
      });
    }
  } catch (e) {}

  // 2. Fallback numbered probing (checks `.webp` and `.jpg` in `preview/` and `full/`)
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

    for (let i = 0; i < candidates.length; i += 24) {
      const batch = candidates.slice(i, i + 24);
      const results = await Promise.all(
        batch.map(async (fileName) => {
          const dual = await resolveDualImageUrls(
            normFolder,
            previewSubfolder,
            fullSubfolder,
            fileName
          );
          return dual ? { fileName, ...dual } : null;
        })
      );
      results.filter(Boolean).forEach((item) => {
        if (!seenNames.has(item.fileName)) {
          seenNames.add(item.fileName);
          discoveredItems.push(item);
        }
      });
    }
  }

  return discoveredItems;
}

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
  if (photographyLoaded) return;
  if (photographyLoadingPromise) return photographyLoadingPromise;

  photographyLoadingPromise = (async () => {
    const grid = document.getElementById("photography-grid");
    const countBadge = document.getElementById("photo-count-badge");

    // Apply adjustable column count variable
    document.documentElement.style.setProperty(
      "--photo-grid-cols",
      PORTFOLIO_CONFIG.photographyConfig.gridColumns || 5
    );

    const photoItems = await discoverPhotographyDualAssets();

    // Silently pre-warm the lightweight preview thumbnails in chunks while user is on About Me
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
      type: "image",
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
            img.src = img.dataset.src;
            img.removeAttribute("data-src");
          }
          obs.unobserve(card);
        });
      },
      { rootMargin: "400px 0px" }
    );

    photoItems.forEach((item, idx) => {
      const card = document.createElement("div");
      card.className = "insta-card";

      const img = document.createElement("img");
      img.className = "photo-grid-img";
      img.crossOrigin = "anonymous";
      img.decoding = "async";
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
 * 9. TAB NAVIGATION & ON-DEMAND TAB ASSURANCE
 * ============================================================================
 */
const TABS = ["about", "projects", "photography"];
const TAB_LABELS = ["ABOUT ME", "PROJECTS", "PHOTOGRAPHY"];
let currentTabIndex = 0;

function switchTab(targetIndex) {
  if (targetIndex === currentTabIndex) return;

  // Ensure target tab assets are triggered if user clicks tab before idle timer finishes
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
 * 10. UNIVERSAL LIGHTBOX (PROGRESSIVE FULL-RES LOADER + 3D GLB/STL ORBIT)
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
  lbWireframeState = false,
  lbAnimId = null;

function preventBackgroundScroll(e) {
  if (e.target && e.target.closest("#lightbox-3d-stage")) return;
  e.preventDefault();
}

function setModelWireframe(group, enable) {
  if (!group) return;
  group.traverse((child) => {
    if (child.isMesh && child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => (m.wireframe = enable));
      } else {
        child.material.wireframe = enable;
      }
    }
  });
}

function initOrUpdateLightbox3D(modelUrl, type) {
  const stage = document.getElementById("lightbox-3d-stage");
  const wireBtn = document.getElementById("model-wireframe-btn");
  const resetBtn = document.getElementById("model-reset-btn");
  const loaderOverlay = document.getElementById("lightbox-loader");
  const loaderText = document.getElementById("lightbox-loader-text");

  if (!lbRenderer) {
    lbScene = new THREE.Scene();
    lbCamera = new THREE.PerspectiveCamera(42, 16 / 10, 0.1, 4000);
    lbRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    lbRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    lbRenderer.outputEncoding = THREE.sRGBEncoding;
    stage.appendChild(lbRenderer.domElement);

    lbControls = new THREE.OrbitControls(lbCamera, lbRenderer.domElement);
    lbControls.enableDamping = true;
    lbControls.dampingFactor = 0.06;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x222830, 1.0);
    lbScene.add(hemi);

    const dir1 = new THREE.DirectionalLight(0xffffff, 0.95);
    dir1.position.set(100, 140, 120);
    lbScene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0xffffff, 0.5);
    dir2.position.set(-100, -80, -90);
    lbScene.add(dir2);

    const grid = new THREE.GridHelper(180, 18, 0xd92804, 0x2f363d);
    grid.position.y = -42;
    lbScene.add(grid);

    wireBtn.addEventListener("click", () => {
      if (!lbModelGroup) return;
      lbWireframeState = !lbWireframeState;
      setModelWireframe(lbModelGroup, lbWireframeState);
      wireBtn.textContent = `WIREFRAME: ${lbWireframeState ? "ON" : "OFF"}`;
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

  if (lbModelGroup) {
    lbScene.remove(lbModelGroup);
    lbModelGroup = null;
  }

  lbWireframeState = false;
  wireBtn.textContent = "WIREFRAME: OFF";

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
  const modal = document.getElementById("lightbox-modal");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");

  activeFullImageRequestToken++;

  if (lbAnimId) {
    cancelAnimationFrame(lbAnimId);
    lbAnimId = null;
  }

  document.getElementById("lightbox-pdf-frame").src = "";
  document.getElementById("lightbox-loader").style.display = "none";

  document.body.classList.remove("lightbox-lock");
  window.removeEventListener("wheel", preventBackgroundScroll);
  window.removeEventListener("touchmove", preventBackgroundScroll);
}

function updateLightboxSlide() {
  if (!currentLightboxList.length) return;
  const item = currentLightboxList[currentLightboxIndex];
  const requestToken = ++activeFullImageRequestToken;

  const imgEl = document.getElementById("lightbox-img");
  const stage3d = document.getElementById("lightbox-3d-stage");
  const pdfFrame = document.getElementById("lightbox-pdf-frame");
  const wireBtn = document.getElementById("model-wireframe-btn");
  const resetBtn = document.getElementById("model-reset-btn");
  const loaderOverlay = document.getElementById("lightbox-loader");
  const loaderText = document.getElementById("lightbox-loader-text");

  imgEl.style.display = "none";
  stage3d.style.display = "none";
  pdfFrame.style.display = "none";
  wireBtn.style.display = "none";
  resetBtn.style.display = "none";
  loaderOverlay.style.display = "none";

  if (lbAnimId) {
    cancelAnimationFrame(lbAnimId);
    lbAnimId = null;
  }

  if (is3DAsset(item.type)) {
    stage3d.style.display = "block";
    wireBtn.style.display = "inline-block";
    resetBtn.style.display = "inline-block";
    initOrUpdateLightbox3D(item.fullSrc, item.type);
  } else if (item.type === "pdf") {
    pdfFrame.style.display = "block";
    pdfFrame.src = item.fullSrc;
  } else {
    // Progressive Dual-Set Image Loading:
    // 1. Show lightweight preview immediately (slightly dimmed) + CAD Loading Spinner
    // 2. Fetch uncompressed Full-Size image in background and swap smoothly when ready
    imgEl.style.display = "block";
    const previewUrl = item.previewSrc || item.fullSrc;
    const fullUrl = item.fullSrc || item.previewSrc;

    imgEl.src = previewUrl;
    imgEl.classList.add("loading-blur");
    loaderText.textContent = "LOADING FULL-RESOLUTION IMAGE...";
    loaderOverlay.style.display = "flex";

    const highResLoader = new Image();
    highResLoader.decoding = "async";
    highResLoader.onload = () => {
      if (requestToken !== activeFullImageRequestToken) return;
      imgEl.src = fullUrl;
      imgEl.classList.remove("loading-blur");
      loaderOverlay.style.display = "none";
    };
    highResLoader.onerror = () => {
      if (requestToken !== activeFullImageRequestToken) return;
      imgEl.classList.remove("loading-blur");
      loaderOverlay.style.display = "none";
    };
    highResLoader.src = fullUrl;
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
 * 11. INITIALIZATION (INSTANT FIRST-PAGE BOOT -> DEFERRED BACKGROUND LOADING)
 * ============================================================================
 */
window.addEventListener("DOMContentLoaded", async () => {
  // 1. ONLY load the About Me tab on initial startup so the website opens instantaneously
  await renderAboutSection();

  // 2. Immediately reveal the website so the user can start reading About Me
  setTimeout(() => {
    document.getElementById("page-loader").classList.add("loaded");
    document.body.classList.add("page-ready");

    // 3. AFTER the website has finished loading and user is reading About Me,
    // quietly initialize Projects and Photography previews in the background!
    const startDeferredBackgroundLoading = async () => {
      await loadAndRenderProjects();
      await loadAndRenderPhotography();
    };

    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => startDeferredBackgroundLoading(), { timeout: 1500 });
    } else {
      setTimeout(startDeferredBackgroundLoading, 800);
    }
  }, 300);

  // Top Tab Navigation
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

  // Scroll / Resize Color Sampler
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