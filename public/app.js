let currentFilter = 'all';
let currentPage = 1;

const todoInput = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const selectAllCb = document.getElementById('select-all-cb');
const deleteCompletedBtn = document.getElementById('delete-completed-btn');
const todoList = document.getElementById('todo-list');
const pagination = document.getElementById('pagination');
const tabs = document.querySelectorAll('.tab');

async function fetchTodos() {
  const res = await fetch(`/api/todos?filter=${currentFilter}&page=${currentPage}&limit=5`);
  const data = await res.json();
  renderTodos(data.todos);
  renderPagination(data.pages);
  updateCounts(data);
  updateSelectAll(data);
}

function renderTodos(todos) {
  if (todos.length === 0) {
    todoList.innerHTML = '<li class="empty">Нет задач</li>';
    return;
  }
  todoList.innerHTML = '';
  todos.forEach(todo => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.completed ? ' completed' : '');

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !!todo.completed;
    cb.addEventListener('change', () => toggleTodo(todo.id, cb.checked));

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;
    text.addEventListener('click', () => startEdit(li, todo));

    const del = document.createElement('button');
    del.className = 'todo-delete';
    del.textContent = '\u00d7';
    del.addEventListener('click', () => deleteTodo(todo.id));

    li.append(cb, text, del);
    todoList.appendChild(li);
  });
}

function startEdit(li, todo) {
  const text = li.querySelector('.todo-text');
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'todo-edit';
  input.value = todo.text;
  text.replaceWith(input);
  input.focus();

  const finish = async (save) => {
    if (save && input.value.trim() && input.value.trim() !== todo.text) {
      await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input.value.trim() })
      });
    }
    await fetchTodos();
  };

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') finish(true);
    if (e.key === 'Escape') finish(false);
  });
  input.addEventListener('blur', () => finish(true));
}

async function toggleTodo(id, completed) {
  await fetch(`/api/todos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed })
  });
    await fetchTodos();
}

async function deleteTodo(id) {
  await fetch(`/api/todos/${id}`, { method: 'DELETE' });
  await fetchTodos();
}

function renderPagination(pages) {
  pagination.innerHTML = '';
  if (pages <= 1) return;
  for (let i = 1; i <= pages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    if (i === currentPage) btn.className = 'active';
    btn.addEventListener('click', () => { currentPage = i; fetchTodos(); });
    pagination.appendChild(btn);
  }
}

function updateCounts(data) {
  document.getElementById('count-all').textContent = data.allCount;
  document.getElementById('count-active').textContent = data.activeCount;
  document.getElementById('count-completed').textContent = data.completedCount;
}

function updateSelectAll(data) {
  selectAllCb.checked = data.allCount > 0 && data.activeCount === 0;
}

// Add todo
async function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;
  await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  todoInput.value = '';
  currentPage = 1;
  await fetchTodos();
}

addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });

// Select all
selectAllCb.addEventListener('change', async () => {
  await fetch('/api/todos-toggle-all', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed: selectAllCb.checked })
  });
  await fetchTodos();
});

// Delete completed
deleteCompletedBtn.addEventListener('click', async () => {
  await fetch('/api/todos-completed', { method: 'DELETE' });
  currentPage = 1;
  await fetchTodos();
});

// Tabs
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentFilter = tab.dataset.filter;
    currentPage = 1;
    fetchTodos();
  });
});

fetchTodos();
