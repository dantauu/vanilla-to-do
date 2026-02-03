const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const db = new Database('todos.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/api/todos', (req, res) => {
  const { filter = 'all', page = 1, limit = 5 } = req.query;
  const offset = (page - 1) * limit;

  let where = '';
  if (filter === 'active') where = 'WHERE completed = 0';
  else if (filter === 'completed') where = 'WHERE completed = 1';

  const todos = db.prepare(`SELECT * FROM todos ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(limit, offset);
  const total = db.prepare(`SELECT COUNT(*) as count FROM todos ${where}`).get().count;

  const allCount = db.prepare('SELECT COUNT(*) as count FROM todos').get().count;
  const activeCount = db.prepare('SELECT COUNT(*) as count FROM todos WHERE completed = 0').get().count;
  const completedCount = db.prepare('SELECT COUNT(*) as count FROM todos WHERE completed = 1').get().count;

  res.json({ todos, total, pages: Math.ceil(total / limit), allCount, activeCount, completedCount });
});

app.post('/api/todos', (req, res) => {
    console.log("create")
  const { text } = req.body;
  const result = db.prepare('INSERT INTO todos (text) VALUES (?)').run(text);
  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(result.lastInsertRowid);
  res.json(todo);
});

app.put('/api/todos/:id', (req, res) => {
  const { text, completed } = req.body;
  if (text !== undefined) db.prepare('UPDATE todos SET text = ? WHERE id = ?').run(text, req.params.id);
  if (completed !== undefined) db.prepare('UPDATE todos SET completed = ? WHERE id = ?').run(completed ? 1 : 0, req.params.id);
  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(req.params.id);
  res.json(todo);
});

app.delete('/api/todos/:id', (req, res) => {
  db.prepare('DELETE FROM todos WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.put('/api/todos-toggle-all', (req, res) => {
  const { completed } = req.body;
  db.prepare('UPDATE todos SET completed = ?').run(completed ? 1 : 0);
  res.json({ ok: true });
});

// Delete completed
app.delete('/api/todos-completed', (req, res) => {
  db.prepare('DELETE FROM todos WHERE completed = 1').run();
  res.json({ ok: true });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
