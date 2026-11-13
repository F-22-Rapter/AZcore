/**
 * ============================================================================
 * script.js — MAIN CONFIGURATION, ABOUT ME, TAB NAVIGATION & BOOTLOADER
 * ============================================================================
 * Load order in index.html:
 *   1. js/utils-3d.js
 *   2. js/projects.js
 *   3. js/photo-lightbox.js
 *   4. script.js (this file)
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
    iitUrl: "https://www.iit.edu/",
    name: "ALEXANDER ZHUK",
    headline: "ABOUT ME",
    folder: "assets/about/",
    profileImage: "profile.webp",
    resume: {
      file: "resume.pdf",
      title: "ALEXANDER_ZHUK_RESUME.PDF",
      subtitle: ""
    },
    bioParagraphs: [
      "Hello! My name is Alex and ever since I was a kid ive always loved working on hands on projects",
      "Currently I am studying Civil Engineering at IIT, working as High voltage lead for our FSAE team, and a photographer based in Chicago."
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

  // -------------------- TAB 2: PROJECTS FOLDER & GRID CONFIG --------------------
  projectsConfig: {
    gridColumns: 2, // <--- VARIABLE: Controls how many projects wide the grid is (default: 2)
    baseFolder: "assets/projects/",
    textFileName: "project.txt",
    foldersToCheck: [
      "LARP",
      "Ansys sim aero",
      "Powertrain mounting",
      "Fabricationpt2",
      "fabrication",
      "Coin hunter",
      "particle sim"
    ],
    // Preset sub-name attributes available in Dev Mode & Project Lookup
    defaultSubNames: [
      "FSAE ELECTRIC",
      "SIMULATION & CFD",
      "FABRICATION",
      "INTERACTIVE & SOFTWARE",
      "STRUCTURAL & CAD"
    ]
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

// Expose config & attribute helpers globally for dev.html and sub-modules
window.PORTFOLIO_CONFIG = PORTFOLIO_CONFIG;

/**
 * Returns a deduplicated flat array of all skills defined in PORTFOLIO_CONFIG.about.skills
 * Used by both the Projects skill lookup bar and the Dev Mode clickable attribute selector.
 */
window.getAllPortfolioSkills = function () {
  const skills = [];
  (PORTFOLIO_CONFIG.about.skills || []).forEach((group) => {
    (group.items || []).forEach((item) => {
      if (item && item !== "new-row" && !skills.includes(item)) {
        skills.push(item);
      }
    });
  });
  return skills;
};

/**
 * Extracts the sub-name attribute from a project CODE string (e.g. "PRJ-01 // FSAE ELECTRIC" -> "FSAE ELECTRIC")
 */
window.extractProjectSubName = function (codeStr, explicitSubName = "") {
  if (explicitSubName && explicitSubName.trim()) {
    return explicitSubName.trim().toUpperCase();
  }
  if (!codeStr) return "ARCHIVE";
  const parts = String(codeStr).split("//");
  if (parts.length > 1) {
    return parts.slice(1).join("//").trim().toUpperCase();
  }
  return String(codeStr).trim().toUpperCase();
};

/**
 * Returns default project sub-name attributes for Dev Mode & Project Lookup
 */
window.getAllPortfolioSubNames = function () {
  return [...(PORTFOLIO_CONFIG.projectsConfig.defaultSubNames || [])];
};

/**
 * Helper to convert "IIT" and "Illinois Institute of Technology" into clickable links
 */
function linkifyIITText(rawHtml, iitUrl) {
  if (!iitUrl || !rawHtml) return rawHtml;
  let output = rawHtml.replace(
    /Illinois Institute of Technology/g,
    `<a href="${iitUrl}" target="_blank" rel="noopener noreferrer" class="iit-link">Illinois Institute of Technology</a>`
  );
  output = output.replace(
    /\bIIT\b/g,
    `<a href="${iitUrl}" target="_blank" rel="noopener noreferrer" class="iit-link">IIT</a>`
  );
  return output;
}

/**
 * ============================================================================
 * TAB 1: RENDER ABOUT ME (WITH IIT LINKS & MOBILE SKILLS DROPDOWN)
 * ============================================================================
 */
async function renderAboutSection() {
  const cfg = PORTFOLIO_CONFIG.about;

  const brandEl = document.getElementById("nav-brand-name");
  if (brandEl) brandEl.textContent = PORTFOLIO_CONFIG.brandName;

  const headlineEl = document.getElementById("about-headline");
  if (headlineEl) headlineEl.textContent = cfg.headline;

  const captionEl = document.getElementById("about-name-caption");
  if (captionEl) captionEl.textContent = cfg.name;

  // Apply CSS Grid column variables for both Photography and Projects
  document.documentElement.style.setProperty(
    "--photo-grid-cols",
    PORTFOLIO_CONFIG.photographyConfig.gridColumns || 5
  );
  document.documentElement.style.setProperty(
    "--project-grid-cols",
    PORTFOLIO_CONFIG.projectsConfig.gridColumns || 2
  );

  const normAboutFolder = normalizeFolder(cfg.folder);
  const resumePath = cfg.resume.file.startsWith("http")
    ? cfg.resume.file
    : `${normAboutFolder}${cfg.resume.file}`;

  const navResumeTab = document.getElementById("nav-resume-tab");
  if (navResumeTab) navResumeTab.href = resumePath;

  // Render Quick Specs with clickable Illinois Institute of Technology link
  const specsListEl = document.getElementById("about-specs-list");
  if (specsListEl) {
    specsListEl.innerHTML = cfg.quickSpecs
      .map((s) => {
        const linkedVal = linkifyIITText(s.value, cfg.iitUrl);
        return `
          <div class="spec-row">
            <span class="spec-label">${s.label}</span>
            <span class="spec-val">${linkedVal}</span>
          </div>`;
      })
      .join("");
  }

  // Render Biography with clickable IIT link
  const bioContainer = document.getElementById("about-bio-content");
  if (bioContainer) {
    const savedBio = localStorage.getItem("azcore_custom_bio");
    if (savedBio) {
      bioContainer.innerHTML = linkifyIITText(savedBio, cfg.iitUrl);
    } else {
      bioContainer.innerHTML = cfg.bioParagraphs
        .map((p) => `<p>${linkifyIITText(p, cfg.iitUrl)}</p>`)
        .join("");
    }
  }

  // Render Skills Grid (clicking any skill jumps to Projects and filters by that skill attribute)
  const skillsGridEl = document.getElementById("about-skills-grid");
  if (skillsGridEl) {
    skillsGridEl.innerHTML = cfg.skills
      .map(
        (group) => `
        <div class="skill-group">
          <div class="skill-group-title">${group.category}</div>
          <div class="skill-tags">
            ${group.items
              .map((item) =>
                item === "new-row"
                  ? `<div class="skill-row-break"></div>`
                  : `<button type="button" class="skill-tag skill-tag-clickable" data-skill-filter="${item}" title="Filter projects using ${item}">${item}</button>`
              )
              .join("")}
          </div>
        </div>`
      )
      .join("");

    skillsGridEl.querySelectorAll(".skill-tag-clickable").forEach((tagBtn) => {
      tagBtn.addEventListener("click", () => {
        const skillName = tagBtn.dataset.skillFilter;
        switchTab(1);
        if (typeof window.filterProjectsByAttribute === "function") {
          window.filterProjectsByAttribute({ skill: skillName });
        }
      });
    });
  }

  // Configure Mobile "Skills" Dropdown with Down Arrow
  setupMobileSkillsDropdown();

  // Render Socials
  const socialsGridEl = document.getElementById("about-socials-grid");
  if (socialsGridEl) {
    socialsGridEl.innerHTML = cfg.socials
      .map(
        (soc) => `
        <a class="social-card" href="${soc.url}" target="_blank" rel="noopener noreferrer">
          <span class="social-platform">${soc.platform}</span>
          <span class="social-handle">${soc.handle}</span>
        </a>`
      )
      .join("");
  }

  // Resolve Profile Image
  const profileImg = document.getElementById("about-profile-img");
  if (profileImg) {
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
      if (typeof openLightbox === "function") {
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
      }
    });
  }
}

/**
 * Sets up the mobile-mode Skills dropdown ("// SKILLS" with a down arrow that expands/collapses)
 */
function setupMobileSkillsDropdown() {
  const skillsGrid = document.getElementById("about-skills-grid");
  if (!skillsGrid) return;

  const skillsPanel = skillsGrid.closest(".cad-panel");
  if (!skillsPanel) return;

  const panelHeader = skillsPanel.querySelector(".panel-header");
  const panelTitle = panelHeader ? panelHeader.querySelector(".panel-title") : null;
  if (!panelHeader || !panelTitle || panelHeader.dataset.dropdownBound === "true") return;

  panelHeader.dataset.dropdownBound = "true";
  panelHeader.classList.add("skills-dropdown-header");
  panelHeader.setAttribute("role", "button");
  panelHeader.setAttribute("tabindex", "0");

  // Collapsed by default on mobile screens (<= 860px) so it works like a clean dropdown
  const isMobileViewport = window.matchMedia("(max-width: 860px)").matches;
  if (isMobileViewport) {
    skillsPanel.classList.add("mobile-skills-collapsed");
    panelHeader.setAttribute("aria-expanded", "false");
  } else {
    panelHeader.setAttribute("aria-expanded", "true");
  }

  panelTitle.innerHTML = `// SKILLS <span class="skills-dropdown-arrow" aria-hidden="true">&#9662;</span>`;

  const toggleSkills = (e) => {
    if (!window.matchMedia("(max-width: 860px)").matches) return;
    e.preventDefault();
    const isNowCollapsed = skillsPanel.classList.toggle("mobile-skills-collapsed");
    panelHeader.setAttribute("aria-expanded", String(!isNowCollapsed));
  };

  panelHeader.addEventListener("click", toggleSkills);
  panelHeader.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      toggleSkills(e);
    }
  });
}

/**
 * ============================================================================
 * TAB NAVIGATION
 * ============================================================================
 */
const TABS = ["about", "projects", "photography"];
const TAB_LABELS = ["ABOUT ME", "PROJECTS", "PHOTOGRAPHY"];
let currentTabIndex = 0;

function switchTab(targetIndex) {
  if (targetIndex === currentTabIndex) return;

  if (targetIndex === 1 && typeof loadAndRenderProjects === "function") {
    loadAndRenderProjects();
  }
  if (targetIndex === 2 && typeof loadAndRenderPhotography === "function") {
    loadAndRenderPhotography();
  }

  const direction = targetIndex > currentTabIndex ? "right" : "left";
  const isWrapAroundNext = currentTabIndex === 2 && targetIndex === 0;
  const isWrapAroundPrev = currentTabIndex === 0 && targetIndex === 2;
  const slideClass =
    isWrapAroundNext || (!isWrapAroundPrev && direction === "right")
      ? "slide-in-right"
      : "slide-in-left";

  currentTabIndex = targetIndex;
  window.currentTabIndex = currentTabIndex;

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
  const prevLabelEl = document.getElementById("prev-tab-label");
  const nextLabelEl = document.getElementById("next-tab-label");
  if (prevLabelEl) prevLabelEl.textContent = TAB_LABELS[prevIndex];
  if (nextLabelEl) nextLabelEl.textContent = TAB_LABELS[nextIndex];

  window.scrollTo(0, 0);

  if (currentTabIndex === 2) {
    document.body.classList.add("photo-theme-active");
    if (typeof scheduleAverageColorUpdate === "function") {
      scheduleAverageColorUpdate();
    }
  } else {
    document.body.classList.remove("photo-theme-active");
    if (typeof resetToCadTheme === "function") {
      resetToCadTheme();
    }
  }
}

window.switchTab = switchTab;
window.currentTabIndex = currentTabIndex;

/**
 * ============================================================================
 * INITIALIZATION & PROGRESSIVE STREAMING BOOT
 * ============================================================================
 */
window.addEventListener("DOMContentLoaded", () => {
  // Only run main portfolio DOM setup when on index.html
  if (!document.getElementById("tab-about")) return;

  renderAboutSection();

  const pageLoader = document.getElementById("page-loader");
  if (pageLoader) pageLoader.classList.add("loaded");
  document.body.classList.add("page-ready");

  if (!IS_MOBILE) {
    const startDeferredBackgroundLoading = () => {
      if (typeof loadAndRenderProjects === "function") loadAndRenderProjects();
      if (typeof loadAndRenderPhotography === "function") loadAndRenderPhotography();
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

  const brandLogo = document.getElementById("brand-logo");
  if (brandLogo) {
    brandLogo.addEventListener("click", () => switchTab(0));
  }

  const sidePrevBtn = document.getElementById("side-nav-prev");
  const sideNextBtn = document.getElementById("side-nav-next");

  if (sidePrevBtn) {
    sidePrevBtn.addEventListener("click", (e) => {
      e.currentTarget.blur();
      switchTab((currentTabIndex - 1 + TABS.length) % TABS.length);
    });
  }

  if (sideNextBtn) {
    sideNextBtn.addEventListener("click", (e) => {
      e.currentTarget.blur();
      switchTab((currentTabIndex + 1) % TABS.length);
    });
  }

  if (typeof initLightboxEventListeners === "function") {
    initLightboxEventListeners();
  }
});