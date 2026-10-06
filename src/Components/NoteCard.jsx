import { useState } from 'react';
import { CATEGORIES } from '../data/notes.js';

// "Skills to learn" → "skills-to-learn" (a CSS class can't have spaces)
function toClass(category) {
  return category.toLowerCase().replaceAll(' ', '-');
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function NoteCard({ note, onSave, onDelete, onTogglePin }) {
  // Each card has its OWN state: is it being edited, and the unsaved changes
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note);

  function startEditing() {
    setDraft(note); // start from the latest saved version
    setEditing(true);
  }

  function handleChange(e) {
    setDraft({ ...draft, [e.target.name]: e.target.value });
  }

  function save() {
    if (draft.title.trim() === '') return;
    onSave(draft); // tell Notes.jsx to store the new version
    setEditing(false);
  }

  // ===== Edit mode =====
  if (editing) {
    return (
      <div className={'note editing ' + toClass(draft.category)}>
        <input name="title" value={draft.title} onChange={handleChange} />
        <textarea name="text" rows="5" value={draft.text} onChange={handleChange} />
        <select name="category" value={draft.category} onChange={handleChange}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <div className="note-footer">
          <button className="save-btn" onClick={save}>Save</button>
          <button onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  // ===== Normal mode =====
  return (
    <div className={'note ' + toClass(note.category)}>
      <div className="note-top">
        <span className="note-category">{note.category}</span>
        <button
          className={note.pinned ? 'pin-btn pinned' : 'pin-btn'}
          onClick={() => onTogglePin(note.id)}
          title={note.pinned ? 'Unpin' : 'Pin to top'}
        >
          {note.pinned ? '★' : '☆'}
        </button>
      </div>

      <h3>{note.title}</h3>
      <p className="note-text">{note.text}</p>

      <div className="note-footer">
        <span className="note-date">{formatDate(note.createdAt)}</span>
        <button onClick={startEditing}>Edit</button>
        <button className="delete-btn" onClick={() => onDelete(note.id)}>Delete</button>
      </div>
    </div>
  );
}

export default NoteCard;