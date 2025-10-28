// Simple, robust To-Do app with localStorage
(() => {
  const els = {
    input: document.getElementById("task-input"),
    due: document.getElementById("task-due"),
    priority: document.getElementById("task-priority"),
    addBtn: document.getElementById("add-btn"),
    list: document.getElementById("task-list"),
    template: document.getElementById("task-item-template"),
    chips: document.querySelectorAll(".chip"),
    search: document.getElementById("search-input"),
    counter: document.getElementById("counter"),
    clearCompleted: document.getElementById("clear-completed"),
    exportBtn: document.getElementById("export-json"),
    importInput: document.getElementById("import-json"),
  };

  const STORAGE_KEY = "todo-items-v1";

  /** @type {Array<{id:string,text:string,completed:boolean,due?:string,priority:'low'|'normal'|'high',createdAt:number}>} */
  let items = load() || [];

  const state = {
    filter: "all", // all | active | completed
    query: "",
  };

  // --- Utilities ---
  function uid() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  function formatDateISOToNice(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return "";
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  function updateCounter() {
    const left = items.filter((i) => !i.completed).length;
    const total = items.length;
    els.counter.textContent = `${left} item${
      left !== 1 ? "s" : ""
    } left • ${total} total`;
  }

  // --- Render ---
  function render() {
    els.list.innerHTML = "";

    // sort: active first, then by priority, then due date, then createdAt
    const priorityRank = { high: 0, normal: 1, low: 2 };
    const filtered = items
      .filter((i) => {
        const matchesFilter =
          state.filter === "all"
            ? true
            : state.filter === "active"
            ? !i.completed
            : i.completed;

        const matchesQuery = state.query
          ? i.text.toLowerCase().includes(state.query)
          : true;

        return matchesFilter && matchesQuery;
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (priorityRank[a.priority] !== priorityRank[b.priority]) {
          return priorityRank[a.priority] - priorityRank[b.priority];
        }
        if ((a.due || "") !== (b.due || "")) {
          // empty due dates go last
          if (!a.due) return 1;
          if (!b.due) return -1;
          return a.due.localeCompare(b.due);
        }
        return a.createdAt - b.createdAt;
      });

    for (const item of filtered) {
      const node = els.template.content.firstElementChild.cloneNode(true);

      const li = node;
      li.dataset.id = item.id;
      if (item.completed) li.classList.add("completed");

      // checkbox
      const toggle = li.querySelector(".task__toggle");
      toggle.checked = !!item.completed;

      // priority badge
      const p = li.querySelector(".task__priority");
      p.dataset.priority = item.priority;
      p.textContent =
        item.priority === "high"
          ? "High"
          : item.priority === "low"
          ? "Low"
          : "Normal";

      // text
      const textSpan = li.querySelector(".task__text");
      textSpan.textContent = item.text;

      // meta
      const due = li.querySelector(".task__due");
      if (item.due) {
        due.textContent = `Due ${formatDateISOToNice(item.due)}`;
        due.dateTime = item.due;
      } else {
        due.textContent = "No due date";
      }

      const created = li.querySelector(".task__created");
      created.textContent = `Added ${new Date(
        item.createdAt
      ).toLocaleDateString()}`;
      created.dateTime = new Date(item.createdAt).toISOString();

      els.list.appendChild(li);
    }

    updateCounter();
  }

  // --- CRUD ---
  function addItem() {
    const text = (els.input.value || "").trim();
    if (!text) return;
    const item = {
      id: uid(),
      text,
      completed: false,
      due: els.due.value || undefined,
      priority: els.priority.value,
      createdAt: Date.now(),
    };
    items.push(item);
    save();
    clearAddBar();
    render();
  }

  function clearAddBar() {
    els.input.value = "";
    // keep date/priority as user may add multiple similar tasks
  }

  function setCompleted(id, completed) {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    it.completed = completed;
    save();
    render();
  }

  function deleteItem(id) {
    items = items.filter((x) => x.id !== id);
    save();
    render();
  }

  function beginInlineEdit(li) {
    if (li.classList.contains("editing")) return;

    const id = li.dataset.id;
    const span = li.querySelector(".task__text");

    const input = document.createElement("input");
    input.type = "text";
    input.value = span.textContent;
    input.className = "edit-input";
    input.setAttribute("aria-label", "Edit task text");
    span.after(input);

    li.classList.add("editing");
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    const commit = () => {
      const newText = input.value.trim();
      if (newText) {
        const it = items.find((x) => x.id === id);
        if (it) {
          it.text = newText;
          save();
        }
      }
      input.remove();
      li.classList.remove("editing");
      render();
    };

    const cancel = () => {
      input.remove();
      li.classList.remove("editing");
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") commit();
      if (e.key === "Escape") cancel();
    });
    input.addEventListener("blur", commit);
  }

  // --- Events ---
  els.addBtn.addEventListener("click", addItem);
  els.input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addItem();
  });

  // delegate list interactions
  els.list.addEventListener("click", (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    const li = target.closest(".task");
    if (!li) return;
    const id = li.dataset.id;

    if (target.classList.contains("task__toggle")) {
      setCompleted(id, target.checked);
      return;
    }

    if (target.dataset.action === "delete") {
      deleteItem(id);
      return;
    }

    if (target.dataset.action === "edit") {
      beginInlineEdit(li);
      return;
    }
  });

  // support clicking label area to toggle checkbox
  els.list.addEventListener("change", (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    if (target.classList.contains("task__toggle")) {
      const li = target.closest(".task");
      if (!li) return;
      setCompleted(li.dataset.id, target.checked);
    }
  });

  // double click or press Enter on text to edit
  els.list.addEventListener("dblclick", (e) => {
    const span = e.target.closest(".task__text");
    if (!span) return;
    const li = span.closest(".task");
    if (li) beginInlineEdit(li);
  });
  els.list.addEventListener("keydown", (e) => {
    const span = e.target.closest?.(".task__text");
    if (!span) return;
    if (e.key === "Enter") {
      const li = span.closest(".task");
      if (li) beginInlineEdit(li);
    }
  });

  // filter chips
  els.chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      els.chips.forEach((c) => {
        c.classList.toggle("active", c === chip);
        c.setAttribute("aria-selected", c === chip ? "true" : "false");
      });
      state.filter = chip.dataset.filter;
      render();
    });
  });

  // search
  els.search.addEventListener("input", () => {
    state.query = els.search.value.trim().toLowerCase();
    render();
  });

  // clear completed
  els.clearCompleted.addEventListener("click", () => {
    const hadCompleted = items.some((i) => i.completed);
    if (!hadCompleted) return;
    if (!confirm("Delete all completed tasks?")) return;
    items = items.filter((i) => !i.completed);
    save();
    render();
  });

  // Export / Import
  els.exportBtn.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `todos-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  els.importInput.addEventListener("change", async () => {
    const file = els.importInput.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error("Invalid file format");
      // Basic shape validation
      const cleaned = data
        .map((x) => ({
          id: typeof x.id === "string" ? x.id : uid(),
          text: String(x.text ?? "").slice(0, 200),
          completed: !!x.completed,
          due: x.due && /^\d{4}-\d{2}-\d{2}$/.test(x.due) ? x.due : undefined,
          priority: ["low", "normal", "high"].includes(x.priority)
            ? x.priority
            : "normal",
          createdAt: Number.isFinite(x.createdAt) ? x.createdAt : Date.now(),
        }))
        .filter((x) => x.text);

      items = cleaned;
      save();
      render();
      alert("Import successful!");
    } catch (err) {
      console.error(err);
      alert("Import failed. Make sure the file is a valid JSON export.");
    } finally {
      els.importInput.value = "";
    }
  });

  // Initial render
  render();
})();
