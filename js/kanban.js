// Default seed state matching exactly the user's screenshots
const DEFAULT_BOARDS = [
  {
    id: "board-1",
    title: "My Daily Board",
    columns: [
      {
        id: "col-todo",
        title: "To Do",
        cards: [
          {
            id: "card-1",
            title: "Unique user Unique events in analytics package",
            tag: "Feature",
            tagColor: "blue"
          }
        ]
      },
      {
        id: "col-in-progress",
        title: "In Progress",
        cards: [
          {
            id: "card-2",
            title: "CW-298 Create common analytics package",
            tag: "High Priority",
            tagColor: "amber"
          }
        ]
      },
      {
        id: "col-done",
        title: "Done",
        cards: [
          {
            id: "card-3",
            title: "Untitled",
            tag: "Completed",
            tagColor: "emerald"
          }
        ]
      },
      {
        id: "col-new-col",
        title: "Column",
        cards: []
      }
    ]
  }
];

class KanbanEngine {
  constructor() {
    this.boards = this.loadData();
    this.activeBoardId = localStorage.getItem("aura_active_board_id") || this.boards[0]?.id || "board-1";
    this.draggedCardInfo = null; // { cardId, sourceColId }

    // DOM Elements
    this.boardTitleEl = document.getElementById("board-title");
    this.columnsContainer = document.getElementById("kanban-columns");
    this.boardsListEl = document.getElementById("boards-list");
    this.menuToggleBtn = document.getElementById("menu-toggle-btn");
    this.sidebarEl = document.getElementById("sidebar");

    this.init();
  }

  loadData() {
    const saved = localStorage.getItem("aura_kanban_boards");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved boards:", e);
      }
    }
    return DEFAULT_BOARDS;
  }

  saveData() {
    localStorage.setItem("aura_kanban_boards", JSON.stringify(this.boards));
    localStorage.setItem("aura_active_board_id", this.activeBoardId);

    // Optional Chrome storage sync if available
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({
        aura_kanban_boards: this.boards,
        aura_active_board_id: this.activeBoardId
      });
    }
  }

  getActiveBoard() {
    return this.boards.find((b) => b.id === this.activeBoardId) || this.boards[0];
  }

  init() {
    this.renderSidebar();
    this.renderActiveBoard();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Board Title editing
    if (this.boardTitleEl) {
      this.boardTitleEl.addEventListener("blur", () => {
        const activeBoard = this.getActiveBoard();
        const newTitle = this.boardTitleEl.textContent.trim();
        if (newTitle && activeBoard) {
          activeBoard.title = newTitle;
          this.saveData();
          this.renderSidebar();
        } else if (activeBoard) {
          this.boardTitleEl.textContent = activeBoard.title;
        }
      });

      this.boardTitleEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.boardTitleEl.blur();
        }
      });

      this.boardTitleEl.addEventListener("paste", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const text = (e.clipboardData || window.clipboardData)?.getData("text/plain") || "";
        document.execCommand("insertText", false, text.replace(/[\r\n]+/g, " "));
      });
    }

    // Sidebar Toggle via single top-nav menu icon (Hamburger)
    if (this.menuToggleBtn && this.sidebarEl) {
      this.menuToggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isCollapsed = this.sidebarEl.classList.toggle("collapsed");
        localStorage.setItem("aura_sidebar_collapsed", isCollapsed ? "true" : "false");
      });
    }

    // Restore initial sidebar state cleanly (default open if unset)
    const isInitiallyCollapsed = localStorage.getItem("aura_sidebar_collapsed") === "true";
    if (this.sidebarEl) {
      this.sidebarEl.classList.toggle("collapsed", isInitiallyCollapsed);
    }
  }

  renderSidebar() {
    if (!this.boardsListEl) return;
    this.boardsListEl.innerHTML = "";

    this.boards.forEach((board) => {
      const item = document.createElement("div");
      item.className = `sidebar-board-item ${board.id === this.activeBoardId ? "active" : ""}`;
      item.innerHTML = `
        <span class="board-name">${this.escapeHtml(board.title)}</span>
        ${
          this.boards.length > 1
            ? `<button class="delete-board-btn" title="Delete Board">✕</button>`
            : ""
        }
      `;

      item.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-board-btn")) {
          e.stopPropagation();
          if (confirm(`Delete board "${board.title}"?`)) {
            this.boards = this.boards.filter((b) => b.id !== board.id);
            if (this.activeBoardId === board.id) {
              this.activeBoardId = this.boards[0]?.id || "";
            }
            this.saveData();
            this.renderSidebar();
            this.renderActiveBoard();
          }
          return;
        }

        this.activeBoardId = board.id;
        this.saveData();
        this.renderSidebar();
        this.renderActiveBoard();
      });

      this.boardsListEl.appendChild(item);
    });
  }

  renderActiveBoard() {
    const activeBoard = this.getActiveBoard();
    if (!activeBoard) return;

    if (this.boardTitleEl) {
      this.boardTitleEl.textContent = activeBoard.title;
    }

    if (!this.columnsContainer) return;
    this.columnsContainer.innerHTML = "";

    // Render columns
    activeBoard.columns.forEach((col) => {
      const colEl = this.createColumnElement(col, activeBoard);
      this.columnsContainer.appendChild(colEl);
    });

    // Render "+ Add Column" button
    const addColBtn = document.createElement("div");
    addColBtn.className = "add-column-button";
    addColBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      <span>Add Column</span>
    `;
    addColBtn.addEventListener("click", () => {
      const title = prompt("Enter column name:", "New Column");
      if (title && title.trim()) {
        activeBoard.columns.push({
          id: `col-${Date.now()}`,
          title: title.trim(),
          cards: []
        });
        this.saveData();
        this.renderActiveBoard();
      }
    });

    this.columnsContainer.appendChild(addColBtn);
  }

  createColumnElement(column, activeBoard) {
    const colEl = document.createElement("div");
    colEl.className = "kanban-column";
    colEl.dataset.colId = column.id;

    // Header
    const headerEl = document.createElement("div");
    headerEl.className = "column-header";
    headerEl.innerHTML = `
      <div class="col-title-wrap">
        <span class="column-title" contenteditable="true" spellcheck="false">${this.escapeHtml(column.title)}</span>
        <span class="column-count">${column.cards.length}</span>
      </div>
      <div class="column-actions">
        <button class="col-menu-btn" title="Column Options">•••</button>
      </div>
    `;

    // Column title edit
    const titleSpan = headerEl.querySelector(".column-title");
    titleSpan.addEventListener("blur", () => {
      const newTitle = titleSpan.textContent.trim();
      if (newTitle) {
        column.title = newTitle;
        this.saveData();
      } else {
        titleSpan.textContent = column.title;
      }
    });
    titleSpan.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        titleSpan.blur();
      }
    });
    titleSpan.addEventListener("paste", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const text = (e.clipboardData || window.clipboardData)?.getData("text/plain") || "";
      document.execCommand("insertText", false, text.replace(/[\r\n]+/g, " "));
    });

    // Column Options menu (Dropdown with Delete Icon)
    const menuBtn = headerEl.querySelector(".col-menu-btn");
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      // Remove any existing dropdowns first
      document.querySelectorAll(".col-menu-dropdown").forEach((d) => d.remove());

      const dropdown = document.createElement("div");
      dropdown.className = "col-menu-dropdown";
      dropdown.innerHTML = `
        <button class="col-menu-action delete-col-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
          <span>Delete Column</span>
        </button>
      `;

      headerEl.style.position = "relative";
      headerEl.appendChild(dropdown);

      const deleteBtn = dropdown.querySelector(".delete-col-btn");
      deleteBtn.addEventListener("click", (evt) => {
        evt.stopPropagation();
        activeBoard.columns = activeBoard.columns.filter((c) => c.id !== column.id);
        this.saveData();
        this.renderActiveBoard();
      });

      // Close dropdown when clicking outside
      const closeDropdown = (evt) => {
        if (!dropdown.contains(evt.target)) {
          dropdown.remove();
          document.removeEventListener("click", closeDropdown);
        }
      };
      setTimeout(() => document.addEventListener("click", closeDropdown), 10);
    });

    // Cards list container
    const cardsListEl = document.createElement("div");
    cardsListEl.className = "cards-list";

    // Setup Drag-over / Drop on Column
    cardsListEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      cardsListEl.classList.add("drag-hover");
    });
    cardsListEl.addEventListener("dragleave", () => {
      cardsListEl.classList.remove("drag-hover");
    });
    cardsListEl.addEventListener("drop", (e) => {
      e.preventDefault();
      cardsListEl.classList.remove("drag-hover");
      this.handleCardDrop(column.id);
    });

    // Populate Cards
    column.cards.forEach((card) => {
      const cardEl = this.createCardElement(card, column, activeBoard);
      cardsListEl.appendChild(cardEl);
    });

    // Footer with "+ New" button (matching screenshot 1 & 2)
    const footerEl = document.createElement("div");
    footerEl.className = "column-footer";
    footerEl.innerHTML = `
      <button class="add-card-btn">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>New</span>
      </button>
    `;

    const addCardBtn = footerEl.querySelector(".add-card-btn");
    addCardBtn.addEventListener("click", () => {
      this.showInlineCardInput(footerEl, column, activeBoard);
    });

    colEl.appendChild(headerEl);
    colEl.appendChild(cardsListEl);
    colEl.appendChild(footerEl);

    return colEl;
  }

  showInlineCardInput(footerEl, column, activeBoard) {
    let selectedTag = "";
    let selectedColor = "blue";

    footerEl.innerHTML = `
      <div class="card-inline-composer">
        <textarea class="card-composer-input" placeholder="What needs to be done?" rows="2"></textarea>
        
        <!-- Tag Selector Chips in Composer -->
        <div class="composer-tag-selector">
          <span class="tag-selector-label">Tag:</span>
          <button type="button" class="tag-chip active" data-tag="" data-color="">None</button>
          <button type="button" class="tag-chip tag-blue" data-tag="FEATURE" data-color="blue">FEATURE</button>
          <button type="button" class="tag-chip tag-amber" data-tag="HIGH PRIORITY" data-color="amber">PRIORITY</button>
          <button type="button" class="tag-chip tag-rose" data-tag="BUG" data-color="rose">BUG</button>
          <button type="button" class="tag-chip tag-purple" data-tag="DESIGN" data-color="purple">DESIGN</button>
        </div>

        <div class="composer-actions">
          <button class="composer-submit-btn">Add</button>
          <button class="composer-cancel-btn">Cancel</button>
        </div>
      </div>
    `;

    const textarea = footerEl.querySelector(".card-composer-input");
    const submitBtn = footerEl.querySelector(".composer-submit-btn");
    const cancelBtn = footerEl.querySelector(".composer-cancel-btn");
    const tagChips = footerEl.querySelectorAll(".tag-chip");

    textarea.focus();

    // Prevent global paste interception from interfering with card composer textarea
    textarea.addEventListener("paste", (e) => {
      e.stopPropagation();
    });

    tagChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        tagChips.forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        selectedTag = chip.dataset.tag;
        selectedColor = chip.dataset.color || "blue";
      });
    });

    const commitAdd = () => {
      const text = textarea.value.trim();
      if (text) {
        column.cards.push({
          id: `card-${Date.now()}`,
          title: text,
          tag: selectedTag,
          tagColor: selectedColor || "blue"
        });
        this.saveData();
        this.renderActiveBoard();
      } else {
        this.renderActiveBoard();
      }
    };

    submitBtn.addEventListener("click", commitAdd);
    cancelBtn.addEventListener("click", () => this.renderActiveBoard());

    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        commitAdd();
      } else if (e.key === "Escape") {
        this.renderActiveBoard();
      }
    });
  }

  createCardElement(card, column, activeBoard) {
    const cardEl = document.createElement("div");
    cardEl.className = "kanban-card";
    cardEl.draggable = true;
    cardEl.dataset.cardId = card.id;

    const tagHtml = card.tag
      ? `<span class="card-tag tag-${card.tagColor || 'blue'}" title="Click to change or remove tag">
           ${this.escapeHtml(card.tag)}
         </span>`
      : `<button class="add-tag-btn" title="Add Tag">+ Tag</button>`;

    cardEl.innerHTML = `
      <div class="card-header">
        <div class="card-tag-wrapper">
          ${tagHtml}
        </div>
        <button class="card-delete-btn" title="Delete card">✕</button>
      </div>
      <div class="card-title" contenteditable="true" spellcheck="false">${this.escapeHtml(card.title)}</div>
    `;

    // Interactive Tag click / add tag handler
    const tagWrap = cardEl.querySelector(".card-tag-wrapper");
    tagWrap.addEventListener("click", (e) => {
      e.stopPropagation();
      this.openTagMenu(tagWrap, card, column);
    });

    // Title edit
    const titleEl = cardEl.querySelector(".card-title");
    titleEl.addEventListener("paste", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const text = (e.clipboardData || window.clipboardData)?.getData("text/plain") || "";
      document.execCommand("insertText", false, text.replace(/[\r\n]+/g, " "));
    });
    titleEl.addEventListener("blur", () => {
      const newTitle = titleEl.textContent.trim();
      if (newTitle) {
        card.title = newTitle;
        this.saveData();
      } else {
        titleEl.textContent = card.title;
      }
    });
    titleEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        titleEl.blur();
      }
    });

    // Delete card
    const deleteBtn = cardEl.querySelector(".card-delete-btn");
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      column.cards = column.cards.filter((c) => c.id !== card.id);
      this.saveData();
      this.renderActiveBoard();
    });

    // Drag handlers
    cardEl.addEventListener("dragstart", (e) => {
      // Never start dragging if interacting with tag popover, inputs, or buttons
      if (
        e.target.closest(".tag-picker-popover") ||
        e.target.closest("input") ||
        e.target.closest("button") ||
        e.target.isContentEditable
      ) {
        e.preventDefault();
        return false;
      }

      this.draggedCardInfo = {
        cardId: card.id,
        sourceColId: column.id
      };
      e.dataTransfer.setData("text/plain", card.id);
      cardEl.classList.add("is-dragging");
    });

    cardEl.addEventListener("dragend", () => {
      cardEl.classList.remove("is-dragging");
      this.draggedCardInfo = null;
    });

    return cardEl;
  }

  openTagMenu(anchorEl, card, column) {
    // Close existing open menus
    document.querySelectorAll(".tag-picker-popover").forEach((p) => p.remove());

    const cardEl = anchorEl.closest(".kanban-card");
    // Disable card dragging while popover is open so inputs work flawlessly
    if (cardEl) {
      cardEl.draggable = false;
    }

    let selectedColor = card.tagColor || "blue";

    const popover = document.createElement("div");
    popover.className = "tag-picker-popover";
    popover.draggable = false;

    popover.innerHTML = `
      <div class="tag-picker-title">Select or edit tag</div>
      <div class="tag-picker-options">
        <div class="tag-option-item" data-tag="FEATURE" data-color="blue">
          <span class="card-tag tag-blue">FEATURE</span>
        </div>
        <div class="tag-option-item" data-tag="HIGH PRIORITY" data-color="amber">
          <span class="card-tag tag-amber">HIGH PRIORITY</span>
        </div>
        <div class="tag-option-item" data-tag="BUG" data-color="rose">
          <span class="card-tag tag-rose">BUG</span>
        </div>
        <div class="tag-option-item" data-tag="COMPLETED" data-color="emerald">
          <span class="card-tag tag-emerald">COMPLETED</span>
        </div>
        <div class="tag-option-item" data-tag="DESIGN" data-color="purple">
          <span class="card-tag tag-purple">DESIGN</span>
        </div>
      </div>

      <div class="tag-picker-custom">
        <input type="text" class="custom-tag-input" placeholder="Custom tag name..." value="${this.escapeHtml(card.tag || '')}" autocomplete="off" />
        
        <div class="custom-color-swatches-row">
          <span class="color-picker-label">Color:</span>
          <div class="swatches-group">
            <button type="button" class="swatch-btn color-blue ${selectedColor === 'blue' ? 'active' : ''}" data-color="blue" title="Blue"></button>
            <button type="button" class="swatch-btn color-amber ${selectedColor === 'amber' ? 'active' : ''}" data-color="amber" title="Amber"></button>
            <button type="button" class="swatch-btn color-rose ${selectedColor === 'rose' ? 'active' : ''}" data-color="rose" title="Rose"></button>
            <button type="button" class="swatch-btn color-emerald ${selectedColor === 'emerald' ? 'active' : ''}" data-color="emerald" title="Green"></button>
            <button type="button" class="swatch-btn color-purple ${selectedColor === 'purple' ? 'active' : ''}" data-color="purple" title="Purple"></button>
          </div>
        </div>

        <button type="button" class="save-custom-tag-btn">Save Tag</button>
      </div>

      ${
        card.tag
          ? `<button type="button" class="remove-tag-btn">Remove Tag</button>`
          : ""
      }
    `;

    // Prevent any clicks or typing inside popover from propagating
    popover.addEventListener("mousedown", (e) => e.stopPropagation());
    popover.addEventListener("mouseup", (e) => e.stopPropagation());
    popover.addEventListener("click", (e) => e.stopPropagation());
    popover.addEventListener("keydown", (e) => e.stopPropagation());

    // Position popover
    anchorEl.style.position = "relative";
    anchorEl.appendChild(popover);

    // Focus input field smoothly
    const customInput = popover.querySelector(".custom-tag-input");
    setTimeout(() => {
      customInput.focus();
      customInput.select();
    }, 50);

    // Color Swatch Selection
    const swatchBtns = popover.querySelectorAll(".swatch-btn");
    swatchBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        swatchBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        selectedColor = btn.dataset.color;
      });
    });

    // Preset tags click
    popover.querySelectorAll(".tag-option-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        card.tag = item.dataset.tag;
        card.tagColor = item.dataset.color;
        if (cardEl) cardEl.draggable = true;
        this.saveData();
        popover.remove();
        this.renderActiveBoard();
      });
    });

    // Custom Tag Save
    const saveBtn = popover.querySelector(".save-custom-tag-btn");
    const saveCustom = (e) => {
      if (e) e.stopPropagation();
      const val = customInput.value.trim().toUpperCase();
      if (val) {
        card.tag = val;
        card.tagColor = selectedColor;
        if (cardEl) cardEl.draggable = true;
        this.saveData();
        popover.remove();
        this.renderActiveBoard();
      }
    };

    saveBtn.addEventListener("click", saveCustom);
    customInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveCustom(e);
      if (e.key === "Escape") {
        if (cardEl) cardEl.draggable = true;
        popover.remove();
      }
    });

    // Remove Tag button
    const removeBtn = popover.querySelector(".remove-tag-btn");
    if (removeBtn) {
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        card.tag = "";
        card.tagColor = "";
        if (cardEl) cardEl.draggable = true;
        this.saveData();
        popover.remove();
        this.renderActiveBoard();
      });
    }

    // Close when clicking outside
    const closeListener = (e) => {
      if (!popover.contains(e.target)) {
        if (cardEl) cardEl.draggable = true;
        popover.remove();
        document.removeEventListener("click", closeListener);
      }
    };
    setTimeout(() => document.addEventListener("click", closeListener), 10);
  }

  handleCardDrop(targetColId) {
    if (!this.draggedCardInfo) return;

    const { cardId, sourceColId } = this.draggedCardInfo;
    const activeBoard = this.getActiveBoard();
    if (!activeBoard) return;

    const sourceCol = activeBoard.columns.find((c) => c.id === sourceColId);
    const targetCol = activeBoard.columns.find((c) => c.id === targetColId);
    if (!sourceCol || !targetCol) return;

    const cardIndex = sourceCol.cards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return;

    // Move card from source to target
    const [movedCard] = sourceCol.cards.splice(cardIndex, 1);
    targetCol.cards.push(movedCard);

    this.saveData();
    this.renderActiveBoard();
  }

  escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }
}

window.kanbanEngine = new KanbanEngine();
