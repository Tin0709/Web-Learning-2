/* TinyBlog - zero backend blog using localStorage
 * Features: list + search + tag filter + view + comments + create/edit/delete posts
 */

const q = (sel) => document.querySelector(sel);
const el = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};
