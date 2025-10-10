/* =======================================================
   Recipe Finder — TheMealDB (No API key required)
   Features: Search by name/ingredient, details modal,
             favorites (localStorage), toast messages.
   ======================================================= */

const EL = {
  tabSearch: document.getElementById("tab-search"),
  tabFavs: document.getElementById("tab-favorites"),
  panelSearch: document.getElementById("panel-search"),
  panelFavs: document.getElementById("panel-favorites"),

  form: document.getElementById("search-form"),
  query: document.getElementById("query"),
  btnClear: document.getElementById("btn-clear"),
  status: document.getElementById("status"),
  results: document.getElementById("results"),

  favsGrid: document.getElementById("favorites-grid"),
  favsEmpty: document.getElementById("favorites-empty"),
  btnClearFavs: document.getElementById("btn-clear-favs"),

  modal: document.getElementById("meal-modal"),
  modalClose: document.getElementById("modal-close"),
  modalContent: document.getElementById("modal-content"),

  toast: document.getElementById("toast"),
};
