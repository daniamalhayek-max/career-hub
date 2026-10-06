import { useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage.js';
import { CATEGORIES, STARTING_NOTES } from '../data/notes.js';
import NoteCard from './NoteCard.jsx';

function Notes() {
  // ===== ZONE 1: state =====
  const [notes, setNotes] = useLocalStorage('notes', STARTING_NOTES); // ← your own hook!
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [filter, setFilter] = useState('All');

  // ===== ZONE 2: logic =====
  // Only the chosen category, pinned notes first
  const shownNotes = notes
    .filter((note) => filter === 'All' || note.category === filter)
    .sort((a, b) => b.pinned - a.pinned);

  function countIn(c) {
    return c === 'All' ? notes.length : notes.filter((note) => note.category === c).length;
  }

  function addNote(e) {
    e.preventDefault();
    if (title.trim() === '') return;

    const newNote = {
      id: Date.now(),
      title: title.trim(),
      text: text,
      category: category,
      pinned: false,
      createdAt: new Date().toISOString(),
    };

    setNotes([newNote, ...notes]);
    setTitle('');
    setText('');
  }

  function saveNote(updatedNote) {
    setNotes(notes.map((note) => (note.id === updatedNote.id ? updatedNote : note)));
  }

  function deleteNote(id) {
    if (!confirm('Delete this note?')) return;
    setNotes(notes.filter((note) => note.id !== id));
  }

  function togglePin(id) {
    setNotes(notes.map((note) => (note.id === id ? { ...note, pinned: !note.pinned } : note)));
  }

  // ===== ZONE 3: what you see =====
  return (
    <section>
      <h1>Ideas & Notes</h1>
      <p>Interview answers, companies to watch, things to learn.</p>

      <form className="note-form" onSubmit={addNote}>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Write your idea…"
          rows="3"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="note-form-row">
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button type="submit">+ Add note</button>
        </div>
      </form>

      <div className="filters">
        {['All', ...CATEGORIES].map((c) => (
          <button
            key={c}
            className={filter === c ? 'chip active' : 'chip'}
            onClick={() => setFilter(c)}
          >
            {c} <span className="chip-count">{countIn(c)}</span>
          </button>
        ))}
      </div>

      <div className="notes-grid">
        {shownNotes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onSave={saveNote}
            onDelete={deleteNote}
            onTogglePin={togglePin}
          />
        ))}
      </div>

      {shownNotes.length === 0 && <p className="empty">No notes here yet.</p>}
    </section>
  );
}

export default Notes;