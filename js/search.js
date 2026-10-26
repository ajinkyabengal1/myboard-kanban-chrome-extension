class GoogleSearchBar {
  constructor() {
    this.form = document.getElementById("search-form");
    this.input = document.getElementById("search-input");
    this.clearBtn = document.getElementById("search-clear-btn");

    this.init();
  }

  init() {
    if (!this.form || !this.input) return;

    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.executeSearch();
    });

    this.input.addEventListener("input", () => {
      if (this.clearBtn) {
        this.clearBtn.style.display = this.input.value.length > 0 ? "flex" : "none";
      }
    });

    if (this.clearBtn) {
      this.clearBtn.addEventListener("click", () => {
        this.input.value = "";
        this.input.focus();
        this.clearBtn.style.display = "none";
      });
    }

    // Global shortcut: press "/" or "Cmd/Ctrl + K" to focus search bar
    window.addEventListener("keydown", (e) => {
      if ((e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) && 
          document.activeElement.tagName !== "INPUT" && 
          document.activeElement.tagName !== "TEXTAREA") {
        e.preventDefault();
        this.input.focus();
        this.input.select();
      }
    });
  }

  executeSearch() {
    const val = this.input.value.trim();
    if (!val) return;

    // Check if input looks like a valid URL
    const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
    if (urlPattern.test(val)) {
      const targetUrl = val.startsWith("http://") || val.startsWith("https://") ? val : `https://${val}`;
      window.location.href = targetUrl;
    } else {
      // Search Google
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(val)}`;
      window.location.href = searchUrl;
    }
  }
}

window.searchBar = new GoogleSearchBar();
