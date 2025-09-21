// Select elements
const bookForm = document.getElementById("bookForm");
const booksList = document.getElementById("books");

// Book data (temporary, stored in memory)
let books = [
  { title: "1984", author: "George Orwell", votes: 5 },
  { title: "To Kill a Mockingbird", author: "Harper Lee", votes: 3 },
];
// Render books
function renderBooks() {
  booksList.innerHTML = "";
  books
    .sort((a, b) => b.votes - a.votes) // sort by votes
    .forEach((book, index) => {
      const li = document.createElement("li");
      li.className = "book-item";

      li.innerHTML = `
        <div class="book-info">
          <h3>${book.title}</h3>
          <p>by ${book.author}</p>
          <p>Votes: <strong>${book.votes}</strong></p>
        </div>
        <div class="vote-buttons">
          <button onclick="vote(${index}, 1)">👍</button>
          <button onclick="vote(${index}, -1)">👎</button>
        </div>
      `;
      booksList.appendChild(li);
    });
}

// Add book
bookForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const title = document.getElementById("title").value.trim();
  const author = document.getElementById("author").value.trim();

  if (title && author) {
    books.push({ title, author, votes: 0 });
    renderBooks();
    bookForm.reset();
  }
});

// Vote function
function vote(index, change) {
  books[index].votes += change;
  renderBooks();
}
