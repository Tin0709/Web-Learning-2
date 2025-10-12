/* Mini Blog CMS - localStorage powered
   Features: CRUD, draft/published, search, tag filter, sorting, pagination,
   import/export JSON. No backend required.
*/

() => {
  const STORAGE_KEY = "blogcms_posts_v1";

  // State
  let posts = loadPosts();
  let state = {
    search: "",
    status: "all",
    tag: "all",
    sort: "newest",
    perPage: 10,
    page: 1,
    editingId: null,
  };

  // Elements
  const postList = document.getElementById("postList");
  const emptyState = document.getElementById("emptyState");
  const paginationEl = document.getElementById("pagination");
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");
  const pageInfo = document.getElementById("pageInfo");
  const template = document.getElementById("postItemTemplate");

  // Filters
  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");
  const tagFilter = document.getElementById("tagFilter");
  const sortSelect = document.getElementById("sortSelect");
  const perPageSelect = document.getElementById("perPageSelect");

  // Header actions
  const newPostBtn = document.getElementById("newPostBtn");
  const exportBtn = document.getElementById("exportBtn");
  const importInput = document.getElementById("importInput");
  const clearBtn = document.getElementById("clearBtn");

  // Modal + editor fields
  const editorModal = document.getElementById("editorModal");
  const editorForm = document.getElementById("editorForm");
  const closeModalBtn = document.getElementById("closeModal");
  const modalTitle = document.getElementById("modalTitle");

  const titleInput = document.getElementById("titleInput");
  const slugInput = document.getElementById("slugInput");
  const statusSelectInput = document.getElementById("statusSelectInput");
  const tagsInput = document.getElementById("tagsInput");
  const coverInput = document.getElementById("coverInput");
  const dateInput = document.getElementById("dateInput");
  const contentInput = document.getElementById("contentInput");

  const savePostBtn = document.getElementById("savePostBtn");
  const saveDraftBtn = document.getElementById("saveDraftBtn");
  const deletePostBtn = document.getElementById("deletePostBtn");
};
