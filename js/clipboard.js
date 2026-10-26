// ============================================================
// MyBoard - Quick Clipboard & Sticky Notes Manager
// ============================================================

const DEFAULT_CLIPBOARD_NOTES = [
  {
    id: "clip-1",
    text: "GA_SERVICE_ACCOUNT_EMAIL\nGA_PRIVATE_KEY\nSEARCH_CONSOLE_SITE_URL\nMIXPANEL_PROJECT_ID",
    color: "yellow",
    createdAt: Date.now() - 1000 * 60 * 15 // 15 mins ago
  },
  {
    id: "clip-2",
    text: "💡 Pro-tip: Click '⚡ Paste' to instantly grab copied text from your system clipboard, or type in the box above. Click 'Copy' on any card to copy back anytime!",
    color: "blue",
    createdAt: Date.now() - 1000 * 60 * 5 // 5 mins ago
  }
];

class ClipboardManager {
  constructor() {
    this.notes = this.loadNotes();
    this.selectedColor = "yellow";

    // DOM Elements
    this.panelEl = document.getElementById("clipboard-panel");
    this.toggleBtn = document.getElementById("clipboard-toggle-btn");
    this.closeBtn = document.getElementById("close-clipboard-btn");
    this.notesListEl = document.getElementById("clipboard-notes-list");
    this.inputEl = document.getElementById("clipboard-input");
    this.addNoteBtn = document.getElementById("add-note-btn");
    this.clearNotesBtn = document.getElementById("clear-notes-btn");
    this.badgeCountEl = document.getElementById("clipboard-count");
    this.colorPickerEl = document.getElementById("sticky-color-picker");

    this.init();
  }

  loadNotes() {
    const saved = localStorage.getItem("aura_clipboard_notes");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Failed to parse saved clipboard notes:", e);
      }
    }
    return DEFAULT_CLIPBOARD_NOTES;
  }

  saveNotes() {
    localStorage.setItem("aura_clipboard_notes", JSON.stringify(this.notes));

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ aura_clipboard_notes: this.notes });
    }
  }

  init() {
    this.render();
    this.setupEventListeners();
    this.restorePanelState();
  }

  restorePanelState() {
    const isCollapsed = localStorage.getItem("aura_clipboard_collapsed") === "true";
    if (this.panelEl) {
      this.panelEl.classList.toggle("collapsed", isCollapsed);
    }
    if (this.toggleBtn) {
      this.toggleBtn.classList.toggle("active", !isCollapsed);
    }
  }

  togglePanel(forceState) {
    if (!this.panelEl) return;
    const shouldCollapse = typeof forceState === "boolean" 
      ? forceState 
      : !this.panelEl.classList.contains("collapsed");
    
    this.panelEl.classList.toggle("collapsed", shouldCollapse);
    localStorage.setItem("aura_clipboard_collapsed", shouldCollapse ? "true" : "false");

    if (this.toggleBtn) {
      this.toggleBtn.classList.toggle("active", !shouldCollapse);
    }
  }

  setupEventListeners() {
    // Toggle button in top navigation bar
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener("click", () => {
        const isCollapsed = this.panelEl?.classList.contains("collapsed");
        this.togglePanel(!isCollapsed);
      });
    }

    // Close button in clipboard header
    if (this.closeBtn) {
      this.closeBtn.addEventListener("click", () => {
        this.togglePanel(true);
      });
    }

    // Color Swatch Selection
    if (this.colorPickerEl) {
      this.colorPickerEl.addEventListener("click", (e) => {
        const swatch = e.target.closest(".color-swatch-dot");
        if (!swatch) return;
        const color = swatch.dataset.color;
        if (color) {
          this.selectedColor = color;
          this.colorPickerEl.querySelectorAll(".color-swatch-dot").forEach((dot) => {
            dot.classList.toggle("active", dot === swatch);
          });
        }
      });
    }

    // Add Note Button
    if (this.addNoteBtn) {
      this.addNoteBtn.addEventListener("click", () => this.handleCreateNote());
    }

    // Textarea: Enter to add (Shift+Enter for newline)
    if (this.inputEl) {
      this.inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.handleCreateNote();
        }
      });

      // Auto-add immediately when pasting text into the textarea
      this.inputEl.addEventListener("paste", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const pastedText = (e.clipboardData || window.clipboardData)?.getData("text");
        if (pastedText && pastedText.trim()) {
          this.addNote(pastedText.trim(), this.selectedColor);
          this.inputEl.value = "";
        }
      });
    }

    // Global Paste Listener: Pressing Cmd+V / Ctrl+V on the general page background auto-adds to clipboard
    document.addEventListener("paste", (e) => {
      const activeEl = document.activeElement;
      const targetEl = e.target;

      // Helper: Check if element is an interactive field or part of Kanban / search / settings / timer / modals
      const isIgnoredTarget = (el) => {
        if (!el) return false;
        const tag = el.tagName?.toUpperCase();
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
        if (el.isContentEditable) return true;
        if (el.closest("input, textarea, select, [contenteditable='true']")) return true;
        if (el.closest("#kanban-board, .kanban-container, #kanban-columns, .kanban-card, .card-inline-composer, .column-footer, .column-header, .column-actions-dropdown, .tag-picker-popover")) return true;
        if (el.closest("#search-form, #search-input, .search-container")) return true;
        if (el.closest("#settings-modal, .modal-backdrop, .modal-content, .modal")) return true;
        if (el.closest("#clipboard-panel")) return true;
        if (el.closest("#timer-widget, .timer-settings-popover")) return true;
        return false;
      };

      // If user is pasting into any input, card, kanban column, modal, or widget, let native paste handle it!
      if (isIgnoredTarget(activeEl) || isIgnoredTarget(targetEl)) {
        return;
      }

      const pastedText = (e.clipboardData || window.clipboardData)?.getData("text");
      if (pastedText && pastedText.trim()) {
        e.preventDefault();
        e.stopPropagation();
        this.addNote(pastedText.trim(), this.selectedColor);
        if (this.inputEl) this.inputEl.value = "";
        
        // Ensure clipboard panel is open so user sees the newly added note
        if (this.panelEl?.classList.contains("collapsed")) {
          this.togglePanel(false);
        }
      }
    });

    // Clear all notes button
    if (this.clearNotesBtn) {
      this.clearNotesBtn.addEventListener("click", () => {
        if (!this.notes.length) return;
        if (confirm("Delete all sticky notes and clipboard clips?")) {
          this.notes = [];
          this.saveNotes();
          this.render();
        }
      });
    }
  }

  handleCreateNote() {
    if (!this.inputEl) return;
    const text = this.inputEl.value.trim();
    if (!text) return;

    this.addNote(text, this.selectedColor);
    this.inputEl.value = "";
    this.inputEl.focus();
  }

  addNote(text, color = "yellow") {
    if (!text || !text.trim()) return;

    // Prevent duplicate calls within 500ms (e.g. from rapid/overlapping paste events)
    const now = Date.now();
    const cleanText = text.trim();
    if (this.lastAddedText === cleanText && now - (this.lastAddedTime || 0) < 500) {
      return;
    }
    this.lastAddedText = cleanText;
    this.lastAddedTime = now;

    const newNote = {
      id: `clip-${now}-${Math.random().toString(36).substring(2, 6)}`,
      text: cleanText,
      color: color,
      createdAt: now
    };

    this.notes.unshift(newNote); // Prepend so newest is at the top
    this.saveNotes();
    this.render();

    // Scroll to top of list
    if (this.notesListEl) {
      this.notesListEl.scrollTop = 0;
    }
  }

  deleteNote(id) {
    const cardEl = this.notesListEl?.querySelector(`[data-id="${id}"]`);
    if (cardEl) {
      cardEl.classList.add("removing");
      setTimeout(() => {
        this.notes = this.notes.filter((n) => n.id !== id);
        this.saveNotes();
        this.render();
      }, 220);
    } else {
      this.notes = this.notes.filter((n) => n.id !== id);
      this.saveNotes();
      this.render();
    }
  }

  copyNote(id, btnEl) {
    const note = this.notes.find((n) => n.id === id);
    if (!note) return;

    const textToCopy = note.text;
    const onSuccess = () => {
      if (btnEl) {
        btnEl.classList.add("copied");
        btnEl.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Copied!</span>
        `;
        setTimeout(() => {
          btnEl.classList.remove("copied");
          btnEl.innerHTML = `
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copy</span>
          `;
        }, 1800);
      }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(onSuccess).catch(() => {
        this.fallbackCopy(textToCopy);
        onSuccess();
      });
    } else {
      this.fallbackCopy(textToCopy);
      onSuccess();
    }
  }

  fallbackCopy(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
    } catch (e) {
      console.error("Fallback copy failed", e);
    }
    document.body.removeChild(textArea);
  }

  formatRelativeTime(timestamp) {
    if (!timestamp) return "Just now";
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 45) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString([], { month: "short", day: "numeric" });
  }

  render() {
    if (!this.notesListEl) return;

    // Update count badge
    if (this.badgeCountEl) {
      const count = this.notes.length;
      this.badgeCountEl.textContent = `${count} ${count === 1 ? "note" : "notes"}`;
    }

    if (this.notes.length === 0) {
      this.notesListEl.innerHTML = `
        <div class="clipboard-empty-state">
          <div class="empty-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              <line x1="9" y1="12" x2="15" y2="12"></line>
              <line x1="9" y1="16" x2="13" y2="16"></line>
            </svg>
          </div>
          <span class="empty-title">Clipboard is empty</span>
          <span class="empty-sub">Paste text with <strong>Cmd+V</strong> or write above to create your first sticky note!</span>
        </div>
      `;
      return;
    }

    this.notesListEl.innerHTML = "";

    this.notes.forEach((note) => {
      const card = document.createElement("div");
      card.className = `sticky-note-card sticky-color-${note.color || "yellow"}`;
      card.dataset.id = note.id;

      // Card Topbar with Time and Action Buttons (Copy & Delete)
      const topbarEl = document.createElement("div");
      topbarEl.className = "sticky-card-topbar";

      const timeEl = document.createElement("span");
      timeEl.className = "sticky-note-time";
      timeEl.textContent = this.formatRelativeTime(note.createdAt);

      const actionsEl = document.createElement("div");
      actionsEl.className = "sticky-card-actions";

      // Copy Button
      const copyBtn = document.createElement("button");
      copyBtn.className = "sticky-btn copy-btn";
      copyBtn.title = "Copy to clipboard";
      copyBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>Copy</span>
      `;
      copyBtn.addEventListener("click", () => this.copyNote(note.id, copyBtn));

      // Delete Button (Prominently visible on top-right of every card)
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "sticky-btn delete-btn";
      deleteBtn.title = "Delete this note";
      deleteBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      `;
      deleteBtn.addEventListener("click", () => this.deleteNote(note.id));

      actionsEl.appendChild(copyBtn);
      actionsEl.appendChild(deleteBtn);

      topbarEl.appendChild(timeEl);
      topbarEl.appendChild(actionsEl);

      // Card Content (editable)
      const contentEl = document.createElement("div");
      contentEl.className = "sticky-note-content";
      contentEl.contentEditable = "true";
      contentEl.spellcheck = false;
      contentEl.title = "Click to edit text";
      contentEl.textContent = note.text;

      contentEl.addEventListener("blur", () => {
        const updated = contentEl.textContent.trim();
        if (updated && updated !== note.text) {
          note.text = updated;
          this.saveNotes();
        } else if (!updated) {
          contentEl.textContent = note.text;
        }
      });

      card.appendChild(topbarEl);
      card.appendChild(contentEl);

      this.notesListEl.appendChild(card);
    });
  }
}

// Global instance initialized on DOMContentLoaded
window.ClipboardManager = ClipboardManager;
