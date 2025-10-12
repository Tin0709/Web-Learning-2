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
};
