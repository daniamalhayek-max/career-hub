import { useState, useEffect } from 'react';
import { get, set, del } from 'idb-keyval';
import { supabase } from '../lib/supabase.js';
import CVCard from './CVCard.jsx';

// ===== Helpers (outside the component: they don't use state) =====
const ALLOWED = ['.pdf', '.doc', '.docx'];

function isAllowed(file) {
  const name = file.name.toLowerCase();
  return ALLOWED.some((ext) => name.endsWith(ext));
}

function isPdf(version) {
  return version.file_name.toLowerCase().endsWith('.pdf');
}

// Storage paths can't have spaces or special letters: "My CV (1).pdf" → "My_CV__1_.pdf"
function safeName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// Newest version first
function sortVersions(cv) {
  return { ...cv, versions: [...cv.versions].sort((a, b) => b.number - a.number) };
}

function CV({ userId }) {
  // ===== ZONE 1: state =====
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false); // true while a file is uploading
  const [newName, setNewName] = useState('');
  const [newFile, setNewFile] = useState(null);
  const [viewing, setViewing] = useState(null); // the version shown in the viewer
  const [viewUrl, setViewUrl] = useState('');
  const [oldCvs, setOldCvs] = useState([]); // CVs still saved in THIS browser (the old way)

  // Load YOUR CVs and their versions from the database (a JOIN of two tables)
  useEffect(() => {
    supabase
      .from('cvs')
      .select('*, versions:cv_versions(*)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) alert('Could not load your CVs: ' + error.message);
        else setCvs(data.map(sortVersions));
        setLoading(false);
      });

    // Look for CVs from before, saved in this browser
    get('cvs').then((saved) => setOldCvs(saved || []));
  }, []);

  // Files in storage are private: ask Supabase for a temporary link (valid 1 hour)
  useEffect(() => {
    if (!viewing) return;
    setViewUrl('');
    supabase.storage
      .from('cvs')
      .createSignedUrl(viewing.file_path, 3600)
      .then(({ data, error }) => {
        if (error) alert('Could not open the file: ' + error.message);
        else setViewUrl(data.signedUrl);
      });
  }, [viewing]);

  // ===== ZONE 2: logic =====

  // Upload ONE file to storage, then save its details as a row in cv_versions
  async function uploadVersion(cvId, file, number) {
    const path = `${userId}/${Date.now()}-${safeName(file.name)}`;

    const upload = await supabase.storage.from('cvs').upload(path, file);
    if (upload.error) throw upload.error;

    const { data, error } = await supabase
      .from('cv_versions')
      .insert({ cv_id: cvId, number, file_name: file.name, size: file.size, file_path: path })
      .select()
      .single();
    if (error) throw error;

    return data;
  }

  async function createCv(e) {
    e.preventDefault();
    const form = e.target;
    if (newName.trim() === '' || !newFile) return;
    if (!isAllowed(newFile)) return alert('Please choose a PDF or Word file.');

    setBusy(true);
    try {
      // 1) a row in "cvs"  2) the file + a row in "cv_versions"
      const { data: cv, error } = await supabase
        .from('cvs')
        .insert({ name: newName.trim() })
        .select()
        .single();
      if (error) throw error;

      const version = await uploadVersion(cv.id, newFile, 1);

      setCvs((prev) => [{ ...cv, versions: [version] }, ...prev]);
      setNewName('');
      setNewFile(null);
      form.reset(); // clears the file input
    } catch (err) {
      alert('Could not upload: ' + err.message);
    }
    setBusy(false);
  }

  async function addVersion(cvId, file) {
    if (!isAllowed(file)) return alert('Please choose a PDF or Word file.');

    const cv = cvs.find((c) => c.id === cvId);
    const nextNumber = Math.max(0, ...cv.versions.map((v) => v.number)) + 1;

    setBusy(true);
    try {
      const version = await uploadVersion(cvId, file, nextNumber);
      setCvs((prev) =>
        prev.map((c) => (c.id === cvId ? { ...c, versions: [version, ...c.versions] } : c))
      );
    } catch (err) {
      alert('Could not upload: ' + err.message);
    }
    setBusy(false);
  }

  // While typing: only change the screen. When you leave the box: save to the database.
  function renameCv(cvId, name) {
    setCvs((prev) => prev.map((cv) => (cv.id === cvId ? { ...cv, name } : cv)));
  }

  async function saveCvName(cvId) {
    const cv = cvs.find((c) => c.id === cvId);
    const { error } = await supabase.from('cvs').update({ name: cv.name }).eq('id', cvId);
    if (error) alert('Could not rename: ' + error.message);
  }

  async function deleteCv(cvId) {
    if (!confirm('Delete this CV and all its versions?')) return;
    const cv = cvs.find((c) => c.id === cvId);

    // Delete the files, then the row (its versions are deleted with it: "on delete cascade")
    await supabase.storage.from('cvs').remove(cv.versions.map((v) => v.file_path));
    const { error } = await supabase.from('cvs').delete().eq('id', cvId);
    if (error) return alert('Could not delete: ' + error.message);

    setCvs((prev) => prev.filter((c) => c.id !== cvId));
    setViewing(null);
  }

  async function deleteVersion(cvId, versionId) {
    if (!confirm('Delete this version?')) return;
    const cv = cvs.find((c) => c.id === cvId);
    const version = cv.versions.find((v) => v.id === versionId);

    await supabase.storage.from('cvs').remove([version.file_path]);
    const { error } = await supabase.from('cv_versions').delete().eq('id', versionId);
    if (error) return alert('Could not delete: ' + error.message);

    // The last version of a CV gone? Delete the CV too.
    if (cv.versions.length === 1) {
      await supabase.from('cvs').delete().eq('id', cvId);
    }

    setCvs((prev) =>
      prev
        .map((c) => (c.id === cvId ? { ...c, versions: c.versions.filter((v) => v.id !== versionId) } : c))
        .filter((c) => c.versions.length > 0)
    );
    if (viewing && viewing.id === versionId) setViewing(null);
  }

  async function download(version) {
    // A temporary link (1 minute) that downloads the file with its original name
    const { data, error } = await supabase.storage
      .from('cvs')
      .createSignedUrl(version.file_path, 60, { download: version.file_name });
    if (error) return alert('Could not download: ' + error.message);

    window.location.href = data.signedUrl;
  }

  // One-time button: upload the CVs saved in this browser before
  async function importOldCvs() {
    setBusy(true);
    try {
      const added = [];
      for (const old of oldCvs) {
        const { data: cv, error } = await supabase
          .from('cvs')
          .insert({ name: old.name })
          .select()
          .single();
        if (error) throw error;

        const versions = [];
        // oldest first, keeping the same version numbers
        for (const v of [...old.versions].sort((a, b) => a.number - b.number)) {
          versions.push(await uploadVersion(cv.id, v.file, v.number));
        }
        added.push(sortVersions({ ...cv, versions }));
      }

      setCvs((prev) => [...added, ...prev]);

      // Keep a backup in this browser, then hide the button
      await set('cvs-backup', oldCvs);
      await del('cvs');
      setOldCvs([]);
    } catch (err) {
      alert('Could not import: ' + err.message);
    }
    setBusy(false);
  }

  // ===== ZONE 3: what you see =====
  if (loading) return <p className="loading">Loading your CVs…</p>;

  return (
    <section>
      <h1>My CV</h1>
      <p>Keep every version of your CV in one place.</p>

      {oldCvs.length > 0 && (
        <div className="panel">
          <p>
            This browser still has {oldCvs.length} {oldCvs.length === 1 ? 'CV' : 'CVs'} from before.
          </p>
          <button className="link-btn" onClick={importOldCvs} disabled={busy}>
            + Upload them to my account
          </button>
        </div>
      )}

      <form className="cv-upload" onSubmit={createCv}>
        <input
          placeholder="CV name (e.g. Software Engineering CV)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setNewFile(e.target.files[0])}
        />
        <button type="submit" disabled={busy}>
          {busy ? 'Uploading…' : '+ Add CV'}
        </button>
      </form>

      {cvs.length === 0 && oldCvs.length === 0 && (
        <p className="empty">No CVs yet. Upload your first one above.</p>
      )}

      <div className={viewing ? 'cv-grid with-viewer' : 'cv-grid'}>
        <div className="cv-list">
          {cvs.map((cv) => (
            <CVCard
              key={cv.id}
              cv={cv}
              busy={busy}
              viewingId={viewing ? viewing.id : null}
              onRename={renameCv}
              onRenameDone={saveCvName}
              onDelete={deleteCv}
              onAddVersion={addVersion}
              onDeleteVersion={deleteVersion}
              onView={setViewing}
              onDownload={download}
            />
          ))}
        </div>

        {viewing && (
          <div className="viewer">
            <div className="viewer-head">
              <strong>{viewing.file_name}</strong>
              <div className="viewer-links">
                {viewUrl && isPdf(viewing) && (
                  <a href={viewUrl} target="_blank" rel="noreferrer">Open ↗</a>
                )}
                <button onClick={() => setViewing(null)}>Close ✕</button>
              </div>
            </div>
            {!isPdf(viewing) ? (
              <p className="viewer-note">
                Word files can't be shown in the browser. Click <strong>Download</strong> to open it in Word.
              </p>
            ) : viewUrl ? (
              <iframe src={viewUrl} title="CV preview" />
            ) : (
              <p className="viewer-note">Opening…</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default CV;
