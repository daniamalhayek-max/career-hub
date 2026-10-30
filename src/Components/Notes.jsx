import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { CATEGORIES, STARTING_NOTES } from '../data/notes.js';
import NoteCard from './NoteCard.jsx';

function Notes() {
  // ===== ZONE 1: state =====
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [filter, setFilter] = useState('All');

  // Load YOUR notes from the database once, when the page opens
  useEffect(() => {
    supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) alert('Could not load your notes: ' + error.message);
        else setNotes(data);
        setLoading(false);
      });
  }, []);

  // Notes you wrote before, still saved in THIS browser (the old way)
  const oldNotes = JSON.parse(localStorage.getItem('notes') || '[]');

  // ===== ZONE 2: logic =====
  // Only the chosen category, pinned notes first
  const shownNotes = notes
    .filter((note) => filter === 'All' || note.category === filter)
    .sort((a, b) => b.pinned - a.pinned);

  function countIn(c) {
    return c === 'All' ? notes.length : notes.filter((note) => note.category === c).length;
  }

  // Each function: 1) save in the database  2) if it worked, update the screen
  async function addNote(e) {
    e.preventDefault();
    if (title.trim() === '') return;

    const { data, error } = await supabase
      .from('notes')
      .insert({ title: title.trim(), text, category })
      .select()
      .single();
    if (error) return alert('Could not add: ' + error.message);

    setNotes((prev) => [data, ...prev]);
    setTitle('');
    setText('');
  }

  async function saveNote(updatedNote) {
    const { error } = await supabase
      .from('notes')
      .update({ title: updatedNote.title, text: updatedNote.text, category: updatedNote.category })
      .eq('id', updatedNote.id);
    if (error) return alert('Could not save: ' + error.message);

    setNotes((prev) => prev.map((note) => (note.id === updatedNote.id ? updatedNote : note)));
  }

  async function deleteNote(id) {
    if (!confirm('Delete this note?')) return;

    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) return alert('Could not delete: ' + error.message);

    setNotes((prev) => prev.filter((note) => note.id !== id));
  }

  async function togglePin(id) {
    const note = notes.find((n) => n.id === id);

    const { error } = await supabase.from('notes').update({ pinned: !note.pinned }).eq('id', id);
    if (error) return alert('Could not save: ' + error.message);

    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  }

  // One-time button: copy your old browser notes (or the starting notes) into the database
  async function importNotes() {
    const source = oldNotes.length > 0 ? oldNotes : STARTING_NOTES;
    const rows = source.map((n) => ({
      title: n.title,
      text: n.text,
      category: n.category,
      pinned: n.pinned,
    }));

    const { data, error } = await supabase.from('notes').insert(rows).select();
    if (error) return alert('Could not import: ' + error.message);

    setNotes((prev) => [...data, ...prev]);
  }

  // ===== ZONE 3: what you see =====
  if (loading) return <p className="loading">Loading your notes…</p>;

  return (
    <section>
      <h1>Ideas & Notes</h1>
      <p>Interview answers, companies to watch, things to learn.</p>

      {notes.length === 0 && (
        <div className="panel">
          <p>You have no notes saved online yet.</p>
          <button className="link-btn" onClick={importNotes}>
            {oldNotes.length > 0
              ? `+ Bring in my ${oldNotes.length} ${oldNotes.length === 1 ? 'note' : 'notes'} from this browser`
              : '+ Add the starting notes'}
          </button>
        </div>
      )}

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

      {notes.length > 0 && shownNotes.length === 0 && <p className="empty">No notes in this category.</p>}
    </section>
  );
}

export default Notes;
