class AuraApp {
  constructor() {
    this.themeToggleBtn = document.getElementById("theme-toggle-btn");
    this.nextBgBtn = document.getElementById("next-bg-btn");
    this.settingsBtn = document.getElementById("settings-btn");
    this.settingsModal = document.getElementById("settings-modal");
    this.closeSettingsBtn = document.getElementById("close-settings-btn");

    // Favicon elements
    this.settingFaviconPreview = document.getElementById("setting-favicon-preview");
    this.settingFaviconFileInput = document.getElementById("setting-favicon-file-input");
    this.resetFaviconBtn = document.getElementById("reset-favicon-btn");
    this.settingFaviconUrlInput = document.getElementById("setting-favicon-url-input");
    this.applyFaviconUrlBtn = document.getElementById("apply-favicon-url-btn");

    // Settings fields
    this.bgRotationSelect = document.getElementById("setting-bg-rotation");
    this.customBgInput = document.getElementById("setting-custom-bg");
    this.applyCustomBgBtn = document.getElementById("apply-custom-bg-btn");
    this.exportDataBtn = document.getElementById("export-data-btn");
    this.importDataInput = document.getElementById("import-data-input");
    this.resetAllBtn = document.getElementById("reset-all-btn");

    this.init();
  }

  init() {
    this.initTheme();
    this.initBackgrounds();
    this.initClock();
    this.initClipboard();
    this.initFavicon();
    this.setupEventListeners();
  }

  initClipboard() {
    if (window.ClipboardManager) {
      window.clipboardManager = new window.ClipboardManager();
    }
  }

  initTheme() {
    const savedTheme = localStorage.getItem("aura_theme") || "dark";
    this.applyTheme(savedTheme);

    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        this.applyTheme(newTheme);
      });
    }
  }

  applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("aura_theme", theme);

    if (this.themeToggleBtn) {
      this.themeToggleBtn.innerHTML =
        theme === "dark"
          ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>`
          : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>`;
      this.themeToggleBtn.title = `Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`;
    }
  }

  initBackgrounds() {
    if (window.bgManager) {
      window.bgManager.init();
    }

    if (this.nextBgBtn && window.bgManager) {
      this.nextBgBtn.addEventListener("click", () => {
        window.bgManager.nextWallpaper();
      });
    }
  }

  initClock() {
    const clockEl = document.getElementById("header-clock");
    const updateTime = () => {
      if (!clockEl) return;
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      clockEl.textContent = timeStr;
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  initFavicon() {
    const savedFavicon = localStorage.getItem("aura_custom_favicon") || "";
    this.updateFavicon(savedFavicon);

    // Upload file
    if (this.settingFaviconFileInput) {
      this.settingFaviconFileInput.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target.result;
          if (dataUrl) {
            this.setFavicon(dataUrl);
          }
        };
        reader.readAsDataURL(file);
      });
    }

    // Apply URL
    if (this.applyFaviconUrlBtn && this.settingFaviconUrlInput) {
      this.applyFaviconUrlBtn.addEventListener("click", () => {
        const url = this.settingFaviconUrlInput.value.trim();
        if (url) {
          this.setFavicon(url);
          this.settingFaviconUrlInput.value = "";
        }
      });
      this.settingFaviconUrlInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.applyFaviconUrlBtn.click();
        }
      });
    }

    // Reset default favicon
    if (this.resetFaviconBtn) {
      this.resetFaviconBtn.addEventListener("click", () => {
        this.resetFavicon();
      });
    }
  }

  setFavicon(src) {
    if (!src) return;
    localStorage.setItem("aura_custom_favicon", src);
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({ aura_custom_favicon: src });
    }
    this.updateFavicon(src);
  }

  resetFavicon() {
    localStorage.removeItem("aura_custom_favicon");
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.remove("aura_custom_favicon");
    }
    this.updateFavicon("");
  }

  updateFavicon(src) {
    const defaultFavicon = "icons/icon48.png";
    const activeFavicon = src || defaultFavicon;
    const isCustom = !!src && src !== defaultFavicon;

    // Dynamically update or create <link rel="icon">
    let link = document.getElementById("app-favicon");
    if (!link) {
      link = document.createElement("link");
      link.id = "app-favicon";
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = activeFavicon;

    // Update settings modal preview
    if (this.settingFaviconPreview) {
      this.settingFaviconPreview.src = activeFavicon;
    }

    // Show/hide reset button
    if (this.resetFaviconBtn) {
      this.resetFaviconBtn.style.display = isCustom ? "inline-block" : "none";
    }
  }

  openSettings() {
    if (this.settingsModal) {
      this.settingsModal.classList.add("open");
    }
  }

  closeSettings() {
    if (this.settingsModal) {
      this.settingsModal.classList.remove("open");
    }
  }

  setupEventListeners() {
    // Settings modal open/close
    if (this.settingsBtn) {
      this.settingsBtn.addEventListener("click", () => this.openSettings());
    }
    if (this.closeSettingsBtn) {
      this.closeSettingsBtn.addEventListener("click", () => this.closeSettings());
    }
    this.settingsModal?.addEventListener("click", (e) => {
      if (e.target === this.settingsModal) {
        this.closeSettings();
      }
    });

    // Custom background
    if (this.applyCustomBgBtn && this.customBgInput) {
      this.applyCustomBgBtn.addEventListener("click", () => {
        const url = this.customBgInput.value.trim();
        if (url) {
          localStorage.setItem("aura_custom_bg_url", url);
          window.bgManager.applyBackgroundUrl(url, "Custom Wallpaper");
          alert("Custom wallpaper applied!");
        } else {
          localStorage.removeItem("aura_custom_bg_url");
          window.bgManager.init();
          alert("Reset to dynamic rotating wallpapers.");
        }
      });
    }

    // Export Data
    if (this.exportDataBtn) {
      this.exportDataBtn.addEventListener("click", () => {
        const data = {
          boards: window.kanbanEngine?.boards || [],
          clipboardNotes: window.clipboardManager?.notes || [],
          customFavicon: localStorage.getItem("aura_custom_favicon") || "",
          timerMode: localStorage.getItem("aura_timer_mode") || "focus",
          focusDuration: localStorage.getItem("aura_timer_focus_duration") || "1500",
          theme: localStorage.getItem("aura_theme") || "dark"
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `myboard-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    // Import Data
    if (this.importDataInput) {
      this.importDataInput.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const parsed = JSON.parse(event.target.result);
            let importedAny = false;
            if (Array.isArray(parsed.boards)) {
              window.kanbanEngine.boards = parsed.boards;
              window.kanbanEngine.saveData();
              window.kanbanEngine.renderSidebar();
              window.kanbanEngine.renderActiveBoard();
              importedAny = true;
            }
            if (Array.isArray(parsed.clipboardNotes) && window.clipboardManager) {
              window.clipboardManager.notes = parsed.clipboardNotes;
              window.clipboardManager.saveNotes();
              window.clipboardManager.render();
              importedAny = true;
            }
            if (typeof parsed.customFavicon === "string") {
              this.setFavicon(parsed.customFavicon);
              importedAny = true;
            }
            if (importedAny) {
              alert("Data imported successfully!");
              this.closeSettings();
            } else {
              alert("Invalid backup file format.");
            }
          } catch (err) {
            alert("Error parsing backup JSON.");
          }
        };
        reader.readAsText(file);
      });
    }

    // Reset All Data
    if (this.resetAllBtn) {
      this.resetAllBtn.addEventListener("click", () => {
        if (confirm("Reset all boards and preferences to default? This cannot be undone.")) {
          localStorage.clear();
          window.location.reload();
        }
      });
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.auraApp = new AuraApp();
});
