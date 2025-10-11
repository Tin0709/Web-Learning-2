/* To-Do List App
 * Features: add, edit (dblclick or Edit button), delete, toggle complete,
 * filters (All/Active/Completed), clear completed, drag-and-drop reordering,
 * localStorage persistence.
 */

(function () {
  const STORAGE_KEY = 'todos-v1';

  /** @type {{id:string,text:string,completed:boolean,created:number}[]} */
  let tasks = [];
  let currentFilter = 'all'; // 'all' | 'active' | 'completed'

  // Elements
  const form = document.getElementById('new-task-form');
  const input = document.getElementById('task-input');
  const addBtn = document.getElementById('add-btn');
  const list = document.getElementById('task-list');
  const itemsLeftEl = document.getElementById('items-left');
  const clearCompletedBtn = document.getElementById('clear-completed');
  const filterBtns = Array.from(document.querySelectorAll('.filter'));