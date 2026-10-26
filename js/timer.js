class ProductivityTimer {
  constructor() {
    this.mode = localStorage.getItem("aura_timer_mode") || "focus"; // 'focus' | 'stopwatch'
    this.focusDuration = parseInt(localStorage.getItem("aura_timer_focus_duration") || "1500", 10); // default 25 mins = 1500s
    this.seconds = this.mode === "stopwatch" ? 0 : this.focusDuration;
    this.isRunning = false;
    this.intervalId = null;

    // DOM Elements
    this.displayEl = document.getElementById("timer-display");
    this.startBtn = document.getElementById("timer-toggle-btn");
    this.resetBtn = document.getElementById("timer-reset-btn");
    this.modeToggleBtn = document.getElementById("timer-mode-toggle");
    this.modeLabelEl = document.getElementById("timer-mode-label");
    this.containerEl = document.getElementById("timer-widget");

    // Popover Elements
    this.popoverEl = document.getElementById("timer-settings-popover");
    this.closePopoverBtn = document.getElementById("close-timer-popover-btn");
    this.focusOptionsSection = document.getElementById("focus-options-section");
    this.tabBtns = document.querySelectorAll(".timer-tab-btn");
    this.presetBtns = document.querySelectorAll(".timer-preset-btn");
    this.customMinutesInput = document.getElementById("timer-custom-minutes-input");
    this.customSetBtn = document.getElementById("timer-custom-set-btn");

    this.init();
  }

  init() {
    this.updateDisplay();
    this.updateModeLabel();
    this.setupEventListeners();
  }

  setupEventListeners() {
    if (this.startBtn) {
      this.startBtn.addEventListener("click", () => this.toggle());
    }
    if (this.resetBtn) {
      this.resetBtn.addEventListener("click", () => this.reset());
    }
    if (this.modeToggleBtn) {
      this.modeToggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.togglePopover();
      });
    }
    if (this.closePopoverBtn) {
      this.closePopoverBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.closePopover();
      });
    }

    // Stop propagation within popover
    if (this.popoverEl) {
      this.popoverEl.addEventListener("click", (e) => {
        e.stopPropagation();
      });
    }

    // Click outside to close popover
    document.addEventListener("click", (e) => {
      if (this.popoverEl && !this.popoverEl.classList.contains("hidden")) {
        if (!e.target.closest("#timer-widget")) {
          this.closePopover();
        }
      }
    });

    // Escape key to close popover
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.popoverEl && !this.popoverEl.classList.contains("hidden")) {
        this.closePopover();
      }
    });

    // Mode tab switching
    this.tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetMode = btn.dataset.mode;
        if (targetMode) {
          this.switchMode(targetMode);
        }
      });
    });

    // Preset duration buttons
    this.presetBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const mins = parseInt(btn.dataset.minutes, 10);
        if (mins && mins > 0) {
          this.setFocusDuration(mins);
        }
      });
    });

    // Custom minutes Set button
    if (this.customSetBtn) {
      this.customSetBtn.addEventListener("click", () => this.applyCustomDuration());
    }

    // Custom minutes Input Enter key
    if (this.customMinutesInput) {
      this.customMinutesInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.applyCustomDuration();
        }
      });
    }
  }

  togglePopover() {
    if (!this.popoverEl) return;
    const isHidden = this.popoverEl.classList.contains("hidden");
    if (isHidden) {
      this.openPopover();
    } else {
      this.closePopover();
    }
  }

  openPopover() {
    if (!this.popoverEl) return;
    this.popoverEl.classList.remove("hidden");
    this.modeToggleBtn?.classList.add("popover-open");

    // Sync tab buttons
    this.tabBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === this.mode);
    });

    if (this.focusOptionsSection) {
      this.focusOptionsSection.style.display = this.mode === "focus" ? "block" : "none";
    }

    // Sync active preset button & input value
    const currentMins = Math.round(this.focusDuration / 60);
    this.presetBtns.forEach((btn) => {
      const mins = parseInt(btn.dataset.minutes, 10);
      btn.classList.toggle("active", mins === currentMins);
    });

    if (this.customMinutesInput) {
      this.customMinutesInput.value = currentMins;
      setTimeout(() => this.customMinutesInput.select(), 50);
    }
  }

  closePopover() {
    if (!this.popoverEl) return;
    this.popoverEl.classList.add("hidden");
    this.modeToggleBtn?.classList.remove("popover-open");
  }

  setFocusDuration(minutes) {
    if (!minutes || minutes < 1) return;
    const cleanMinutes = Math.min(Math.max(1, minutes), 360); // Cap 1m - 360m (6 hours)
    this.focusDuration = cleanMinutes * 60;
    localStorage.setItem("aura_timer_focus_duration", String(this.focusDuration));

    if (this.mode !== "focus") {
      this.mode = "focus";
      localStorage.setItem("aura_timer_mode", "focus");
    }

    this.pause();
    this.seconds = this.focusDuration;
    this.updateDisplay();
    this.updateModeLabel();
    this.closePopover();
  }

  applyCustomDuration() {
    if (!this.customMinutesInput) return;
    const val = parseInt(this.customMinutesInput.value, 10);
    if (!isNaN(val) && val >= 1) {
      this.setFocusDuration(val);
    }
  }

  switchMode(targetMode) {
    if (targetMode !== "focus" && targetMode !== "stopwatch") return;
    this.pause();
    this.mode = targetMode;
    localStorage.setItem("aura_timer_mode", this.mode);

    this.seconds = this.mode === "stopwatch" ? 0 : this.focusDuration;
    this.updateModeLabel();
    this.updateDisplay();

    // Update popover tabs if open
    this.tabBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === this.mode);
    });

    if (this.focusOptionsSection) {
      this.focusOptionsSection.style.display = this.mode === "focus" ? "block" : "none";
    }

    if (this.mode === "stopwatch") {
      this.closePopover();
    }
  }

  toggle() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.containerEl?.classList.add("running");
    if (this.startBtn) {
      this.startBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16" rx="1"></rect>
          <rect x="14" y="4" width="4" height="16" rx="1"></rect>
        </svg>
        <span>Pause</span>
      `;
    }

    this.intervalId = setInterval(() => {
      if (this.mode === "stopwatch") {
        this.seconds++;
        this.updateDisplay();
      } else {
        if (this.seconds > 0) {
          this.seconds--;
          this.updateDisplay();
        } else {
          this.completeFocus();
        }
      }
    }, 1000);
  }

  pause() {
    this.isRunning = false;
    clearInterval(this.intervalId);
    this.containerEl?.classList.remove("running");
    if (this.startBtn) {
      this.startBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        <span>Start</span>
      `;
    }
  }

  reset() {
    this.pause();
    this.seconds = this.mode === "stopwatch" ? 0 : this.focusDuration;
    this.updateDisplay();
  }

  updateModeLabel() {
    const mins = Math.round(this.focusDuration / 60);
    const labelText = this.mode === "stopwatch" ? "Stopwatch" : `Focus (${mins}m)`;

    if (this.modeLabelEl) {
      this.modeLabelEl.textContent = labelText;
    } else if (this.modeToggleBtn) {
      this.modeToggleBtn.textContent = labelText;
    }

    if (this.modeToggleBtn) {
      this.modeToggleBtn.title = `Click to choose focus duration (currently ${mins}m) or switch mode`;
    }
  }

  updateDisplay() {
    const hrs = Math.floor(this.seconds / 3600);
    const mins = Math.floor((this.seconds % 3600) / 60);
    const secs = this.seconds % 60;

    let text = "";
    if (hrs > 0) {
      text = `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    } else {
      text = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    if (this.displayEl) {
      this.displayEl.textContent = text;
    }
  }

  completeFocus() {
    this.pause();
    this.playChime();
    if (this.displayEl) {
      this.displayEl.textContent = "Time's Up! 🎉";
    }
    setTimeout(() => {
      this.reset();
    }, 4000);
  }

  playChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.45);
      });
    } catch (e) {
      console.log("Audio alert playback error", e);
    }
  }
}

window.timerManager = new ProductivityTimer();
