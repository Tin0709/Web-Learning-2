/* To-Do List App
 * Features: add, edit (dblclick or Edit button), delete, toggle complete,
 * filters (All/Active/Completed), clear completed, drag-and-drop reordering,
 * localStorage persistence.
 */

(function () {
  const STORAGE_KEY = "todos-v1";

  /** @type {{id:string,text:string,completed:boolean,created:number}[]} */
  let tasks = [];
  let currentFilter = "all"; // 'all' | 'active' | 'completed'

  // Elements
  const form = document.getElementById("new-task-form");
  const input = document.getElementById("task-input");
  const addBtn = document.getElementById("add-btn");
  const list = document.getElementById("task-list");
  const itemsLeftEl = document.getElementById("items-left");
  const clearCompletedBtn = document.getElementById("clear-completed");
  const filterBtns = Array.from(document.querySelectorAll(".filter"));

  // Utils
  const uid = () =>
    Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      tasks = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(tasks)) tasks = [];
    } catch {
      tasks = [];
    }
  };

  const filteredTasks = () => {
    switch (currentFilter) {
      case "active":
        return tasks.filter((t) => !t.completed);
      case "completed":
        return tasks.filter((t) => t.completed);
      default:
        return tasks;
    }
  };

  // Rendering
  function render() {
    list.innerHTML = "";
    const frag = document.createDocumentFragment();

    filteredTasks().forEach((task) => {
      const li = document.createElement("li");
      li.className = "task" + (task.completed ? " completed" : "");
      li.draggable = true;
      li.dataset.id = task.id;

      // Checkbox
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "task__checkbox";
      checkbox.checked = task.completed;
      checkbox.setAttribute("aria-label", "Mark task complete");

      // Title
      const title = document.createElement("div");
      title.className = "task__title";
      title.textContent = task.text;
      title.title = "Double-click to edit";

      // Actions
      const actions = document.createElement("div");
      actions.className = "task__actions";

      const editBtn = document.createElement("button");
      editBtn.className = "iconbtn";
      editBtn.innerText = "Edit";
      editBtn.setAttribute("aria-label", "Edit task");

      const delBtn = document.createElement("button");
      delBtn.className = "iconbtn iconbtn--danger";
      delBtn.innerText = "Delete";
      delBtn.setAttribute("aria-label", "Delete task");

      actions.append(editBtn, delBtn);
      li.append(checkbox, title, actions);
      frag.appendChild(li);

      // Events
      checkbox.addEventListener("change", () => {
        task.completed = checkbox.checked;
        save();
        render();
      });

      const beginEdit = () => {
        title.contentEditable = "true";
        title.focus();
        placeCaretAtEnd(title);
      };
      const finishEdit = () => {
        const newText = title.textContent.trim();
        if (newText.length === 0) {
          // If cleared, delete task
          deleteTask(task.id);
          return;
        }
        task.text = newText;
        title.contentEditable = "false";
        save();
        render();
      };

      editBtn.addEventListener("click", beginEdit);
      title.addEventListener("dblclick", beginEdit);
      title.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          finishEdit();
        } else if (e.key === "Escape") {
          title.textContent = task.text;
          title.contentEditable = "false";
        }
      });
      title.addEventListener("blur", () => {
        if (title.isContentEditable) finishEdit();
      });

      delBtn.addEventListener("click", () => deleteTask(task.id));

      // Drag & drop
      li.addEventListener("dragstart", (e) => {
        li.classList.add("dragging");
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
      });
      li.addEventListener("dragend", () => li.classList.remove("dragging"));
      li.addEventListener("dragover", (e) => {
        e.preventDefault();
        const dragging = document.querySelector(".task.dragging");
        if (!dragging || dragging === li) return;
        const rect = li.getBoundingClientRect();
        const before = e.clientY - rect.top < rect.height / 2;
        list.insertBefore(dragging, before ? li : li.nextSibling);
      });
      li.addEventListener("drop", (e) => {
        e.preventDefault();
        const fromId = e.dataTransfer.getData("text/plain");
        const toId = li.dataset.id;
        reorderTasks(fromId, toId, li);
      });
    });

    list.appendChild(frag);

    const left = tasks.filter((t) => !t.completed).length;
    itemsLeftEl.textContent = `${left} item${left !== 1 ? "s" : ""} left`;

    // Update filters UI
    filterBtns.forEach((btn) => {
      const active = btn.dataset.filter === currentFilter;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    });
  }

  function placeCaretAtEnd(el) {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    save();
    render();
  }

  function reorderTasks(fromId, toId, toLi) {
    const fromIdx = tasks.findIndex((t) => t.id === fromId);
    if (fromIdx === -1) return;
    const [moved] = tasks.splice(fromIdx, 1);

    if (!toId || fromId === toId) {
      tasks.push(moved);
    } else {
      // Compute target index based on current DOM order
      const domIds = Array.from(list.querySelectorAll(".task")).map(
        (li) => li.dataset.id
      );
      const targetIdx = domIds.indexOf(moved.id);
      // Rebuild tasks in DOM order to persist exactly what the user sees
      const byId = new Map(tasks.map((t) => [t.id, t]));
      const newOrder = domIds.map((id) =>
        id === moved.id ? moved : byId.get(id) || moved
      );
      // Fallback if mapping failed
      if (newOrder.length === tasks.length + 1) newOrder.pop();
      tasks = newOrder;
    }
    save();
    render();
    // Keep keyboard focus roughly in place
    if (toLi) toLi.focus?.();
  }

  // Event wiring
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    tasks.push({
      id: uid(),
      text,
      completed: false,
      created: Date.now(),
    });
    input.value = "";
    save();
    render();
  });

  clearCompletedBtn.addEventListener("click", () => {
    const had = tasks.some((t) => t.completed);
    tasks = tasks.filter((t) => !t.completed);
    if (had) {
      save();
      render();
    }
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentFilter = btn.dataset.filter;
      render();
    });
  });

  // Keyboard: quickly add with Enter even if button focused
  addBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter") form.requestSubmit();
  });

  // Init
  load();
  render();
})();
