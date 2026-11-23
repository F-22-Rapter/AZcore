# AZcore Architecture & Codebase Map

High-density technical architecture reference optimized for local LLMs (context-efficient). Zero frameworks; pure vanilla ES6+, HTML5, CSS3, and Three.js running directly in the browser.

---

## 1. Directory & File Map

### Root Files
- `index.html`: Main SPA container hosting 3 tab views (About, Projects, Photography), side navigation, and the universal full-screen media lightbox modal.
- `script.js`: Master application bootstrap, global configuration (`PORTFOLIO_CONFIG`), tab navigation router (`switchTab`), and About section generator.
- `style.css`: Unified stylesheet containing CAD dark-theme design tokens, responsive layout grids, animations, modal styles, and mobile breakpoints.
- `dev.html`: Localhost visual studio for authoring `project.txt` manifests, tuning 3D coordinates, mapping controls, and exporting configs.
- `dev-resume.html`: Localhost LaTeX resume previewer and design playground for tuning spacing and typography before PDF compilation.
- `Local Latex Compiler.bat`: Local XeLaTeX HTTP microserver (127.0.0.1:8765) powering instant offline PDF builds for `dev-resume.html` (git-ignored).
- `CNAME`: Production domain mapping (`azcore.studio`) for GitHub Pages.
- `robots.txt`: Search crawler indexing rules and sitemap pointer.
- `sitemap.xml`: XML sitemap defining production URLs for SEO.
- `.clinerules`: Execution rules for local implementation models (Qwen3.8-27B) enforcing targeted diffs and plan compliance.
- `.clineignore`: Context window protection rules filtering heavy media/3D binaries out of LLM searches.
- `.gitignore`: Git exclusions for editor files, OS artifacts, and `PLAN.md`.
- `GEMINI.md`: Multi-model collaboration specification defining Antigravity as the Architect/Reviewer.

### Core Modules (`js/`)
- `js/utils-3d.js`: 3D loader engine (GLTF/GLB/STL via Three.js + Draco), auto-rotating canvas mounts, interactive WASD/joystick HUD overlay generator, and iframe virtual cursor bridging.
- `js/projects.js`: Project manifest parser (`project.txt`), category filter bar, 2-wide project card grid, and full project detail modal with media stack.
- `js/photo-lightbox.js`: Photography gallery manager (`photos.txt`), dynamic background color sampler/adaptor, and universal full-screen media lightbox (pan/zoom/media stage switcher).

### Assets & Workflows
- `assets/about/`: Static assets for About tab (`profile.webp`, brand logo, compiled `resume.pdf`).
- `assets/photography/`: Photo gallery repository containing `photos.txt` manifest, `preview/` (webp thumbnails), and `full/` (high-res images).
- `assets/projects/`: Individual project folders containing `project.txt` manifests, media assets (images, 3D models), and embedded apps (e.g. Unity WebGL, p5.js).
- `assets/resume/`: LaTeX resume sources (`awesome-cv.cls`, `main.tex`, and `cv/*.tex` modular section files).
- `.github/workflows/build-resume.yml`: CI/CD action that automatically compiles `main.tex` into `assets/about/resume.pdf` on push via LuaLaTeX.

---

## 2. Core Systems & Data Flow

### Application Boot & Tab Navigation
1. `index.html` loads fonts, CDN libraries (Three.js r128, GLTF/STL/DRACO loaders, OrbitControls, heic2any), and modular scripts in strict order:
   `js/utils-3d.js` -> `js/projects.js` -> `js/photo-lightbox.js` -> `script.js`.
2. On `DOMContentLoaded`:
   - Viewport and navigation variables are computed via `applySideNavWidthVariables()`.
   - `renderAboutSection()` dynamically populates biography, specs, skills, and social links from `PORTFOLIO_CONFIG.about`.
   - `#page-loader` fades out; desktop clients queue idle background preloading (`requestIdleCallback`) of projects and photography streams.
3. Tab Switching (`switchTab`):
   - Transitions between active sections (`0: about`, `1: projects`, `2: photography`) using CSS slide classes (`slide-in-right`, `slide-in-left`).
   - Dynamically re-labels side buttons (`#side-nav-prev`, `#side-nav-next`).
   - Entering Photography enables `.photo-theme-active`, activating dynamic background color sampling; leaving restores CAD theme defaults.

### Projects Pipeline (`js/projects.js`)
1. `loadAndRenderProjects()` reads `PORTFOLIO_CONFIG.projectsConfig.foldersToCheck`.
2. Each target folder is queried for `project.txt` via `fetchSingleProjectFolder()`.
3. `parseProjectTextFile()` parses structured key-value lines: `TITLE`, `CODE`, `SUBNAME`/`CATEGORY`, `TAGS`, `CONTROLS`/`KEYS`, `MAIN_FILE`/`MAIN_ASSET`, `APP`, `ITCH`, `ASSETS`, and multiline `DESCRIPTION`.
4. Unique categories generate the `#project-filter-bar`. Filtering (`applyCategoryFilter`) shows/hides cards without DOM re-creation.
5. Clicking a project card launches `openProjectDetailModal(proj)`, displaying full metadata, primary interactive/3D asset, and thumbnail asset stack.

### Photography & Lightbox Pipeline (`js/photo-lightbox.js`)
1. `loadAndRenderPhotography()` fetches `assets/photography/photos.txt` (newline-delimited image identifiers).
2. Renders responsive gallery cards in `#photography-grid` with preview webp images (`loading="lazy"`).
3. `scheduleAverageColorUpdate()` samples visible thumbnails via an off-screen `<canvas>` (`#color-sampler-canvas`), smoothly updating `--bg-cad` with the gallery's dominant color.
4. Clicking any photo or project asset opens `#lightbox-modal`.
5. Universal stage router mounts the appropriate viewer based on extension:
   - Images (`jpg`, `webp`, `png`): Mounted to `<img>` with interactive pan, pinch, and zoom controls.
   - 3D Models (`glb`, `gltf`, `stl`): Mounted to Three.js canvas with orbit controls and auto-rotation.
   - Video / Audio (`mp4`, `webm`, `mp3`, `wav`): HTML5 native media players with disabled download attributes.
   - Interactive Apps / Embeds (`app/index.html`, itch.io): Loaded inside an `<iframe>` with scaled stage fitting and synthetic virtual controls.

### Virtual Input & Controller HUD (`js/utils-3d.js`)
- Maps `CONTROLS` strings (e.g. `CURSOR:Virtual Mouse@4:2, W:Forward@0:1`) into floating on-screen keys, joysticks, and crosshair overlays.
- Synthetic keyboard events and cross-frame postMessages are dispatched into embedded game iframes (`contentWindow`).

---

## 3. Key Entry Points & Interactivity

### Critical JavaScript Functions
- `switchTab(targetIndex)` (`script.js`): Activates tab index (0..2), slides DOM panels, updates telemetry readouts, and triggers stream loaders.
- `renderAboutSection()` (`script.js`): Parses `PORTFOLIO_CONFIG.about` and populates profile details, specs cards, and skill pills.
- `loadAndRenderProjects()` (`js/projects.js`): Fetches manifests, builds category pills, and renders cards.
- `openProjectDetailModal(proj)` / `stepProjectDetailModal(delta)` (`js/projects.js`): Controls project modal visibility and prev/next cycling.
- `loadAndRenderPhotography()` (`js/photo-lightbox.js`): Fetches photo manifest and initializes gallery.
- `openLightbox(items, startIndex)` / `closeLightbox()` / `stepLightbox(delta)` (`js/photo-lightbox.js`): Drives universal modal media navigation.
- `mountAutoRotating3DPreview(container, modelUrl, type)` (`js/utils-3d.js`): Creates Three.js scene, camera, lighting, and renders spinning preview.
- `buildKeysHudContentHtml(keysString)` / `bindVirtualJoystick(joyEl)` (`js/utils-3d.js`): Generates on-screen interactive control widgets for mobile/desktop.

### Key Event Listeners
- Navigation: Click handlers on `#brand-logo`, `.tab-btn`, `#side-nav-prev`, `#side-nav-next`, and `#mobile-menu-btn`.
- Modal Dismissal & Navigation: `keydown` events for `Escape` (exit modals), `ArrowLeft`/`ArrowRight` (step items), and `+`/`-`/`0` (lightbox zoom).
- Background Scroll Lock: Non-passive `wheel` and `touchmove` listeners prevent page body scrolling while modals or lightbox stages are active.

### Primary CSS Variables & Modifier Classes (`style.css`)
- `:root` Variables:
  - `--bg-cad` (`#1f2326`): Canvas dark background base.
  - `--accent` (`#d92804`): Primary highlight color (red).
  - `--accent-soft` (`rgba(217, 40, 4, 0.18)`): Subtle glow and pill background.
  - `--border-cad` (`rgba(255, 255, 255, 0.14)`): Technical CAD container borders.
  - `--font-sans` (`'Space Grotesk'`): Display headings and interface typography.
  - `--font-mono` (`'JetBrains Mono'`): Code, telemetry, and technical labels.
  - `--side-bar-width`: Side navigation width (desktop `58px`, mobile `46px`).
  - `--project-grid-cols` (default `2`): Project column layout.
  - `--photo-grid-cols` (default `5`): Photography masonry column count.
- Modifier Classes:
  - `.cad-theme` / `.photo-theme-active`: Body theme states controlling grid background styles.
  - `html.lightbox-lock`, `body.lightbox-lock`: Disables page scroll during modal display.
  - `.tab-section.active-section`: Currently visible tab pane.
  - `.slide-in-right`, `.slide-in-left`: Directional transition animations for tab switching.
  - `.mobile-open`: Expands mobile dropdown hamburger menu (`<= 860px`).
  - `.mobile-categories-collapsed`: Collapses project category pills into a compact dropdown on small viewports.

---

## 4. Build & Deployment Notes

### Production Architecture
- **Hosting**: GitHub Pages serving static files directly from root (`/`) of branch `main`.
- **Domain**: Custom domain configured via `CNAME` (`azcore.studio`).
- **Zero Build Step**: No bundler (webpack, vite), npm dependencies, or compile step required for the website. Native ES6 modules and global scripts run raw in browser.
- **CDNs**: Three.js, loaders, and font assets load from Cloudflare / jsDelivr / Google Fonts CDNs.

### CI/CD Workflow (`.github/workflows/build-resume.yml`)
- Automatically compiles LaTeX resume on every push affecting `assets/resume/**`.
- Container environment executes `xu-cheng/latex-action@v3` with LuaLaTeX and Adobe Source Sans 3 fonts.
- Commits generated `main.pdf` directly to `assets/about/resume.pdf` via GitHub Actions bot.

### Local Development Environment
- **Local Server Requirement**: Because project manifests (`project.txt`) and photo lists (`photos.txt`) are fetched via AJAX `fetch()`, files must be served over HTTP/HTTPS (e.g., `npx serve`, Python `python -m http.server 8000`, or VS Code Live Server). Direct `file://` execution will trigger browser CORS restrictions.
- **Localhost Developer Studios & Compilers**:
  - `dev.html`: Run locally to author new projects, test 3D models and controls, and generate `project.txt` files via File System Access API without manual formatting.
  - `dev-resume.html`: Run locally to visually debug LaTeX resume dimensions, margins, and typography against print layout before committing `.tex` files.
  - `Local Latex Compiler.bat`: Standalone batch/PowerShell runner that spins up an ephemeral HTTP XeLaTeX microserver on `http://127.0.0.1:8765` (`/ping`, `/compile`), installs TinyTeX on demand, compiles in seconds for `dev-resume.html`, and cleanly removes itself on exit (git-ignored).
- **Agent Handoff & Version Control Rules**:
  - `PLAN.md` and `Local Latex Compiler.bat` are strictly git-ignored.
  - `.clinerules` and `.clineignore` constrain local implementation agents to targeted diffs without loading heavy binary/3D media into context.
