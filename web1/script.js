const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const filters = document.querySelectorAll(".filters button");

let todos = JSON.parse(localStorage.getItem("todos")) || [];
let currentFilter = "all";

function saveToLocalStorage() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

function renderTodos() {
  list.innerHTML = "";

  todos
    .filter((todo) => {
      if (currentFilter === "active") return !todo.completed;
      if (currentFilter === "completed") return todo.completed;
      return true;
    })
    .forEach((todo, index) => {
      const li = document.createElement("li");
      li.className = todo.completed ? "completed" : "";
      li.innerHTML = `
        <span>${todo.text}</span>
        <div>
          <button onclick="toggleComplete(${index})">✔</button>
          <button onclick="deleteTodo(${index})">🗑</button>
        </div>
      `;
      list.appendChild(li);
    });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (text) {
    todos.push({ text, completed: false });
    input.value = "";
    saveToLocalStorage();
    renderTodos();
  }
});

function toggleComplete(index) {
  todos[index].completed = !todos[index].completed;
  saveToLocalStorage();
  renderTodos();
}

function deleteTodo(index) {
  todos.splice(index, 1);
  saveToLocalStorage();
  renderTodos();
}

filters.forEach((btn) => {
  btn.addEventListener("click", () => {
    filters.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTodos();
  });
});

renderTodos();
