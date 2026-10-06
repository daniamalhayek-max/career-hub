import { useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';
import CVCard from './CVCard.jsx';

// ===== Helpers (outside the component: they don't use state) =====
const ALLOWED = ['.pdf', '.doc', '.docx'];

function isAllowed(file) {
  const name = file.name.toLowerCase();
  return ALLOWED.some((ext) => name.endsWith(ext));
}

function isPdf(version) {
  return version.fileName.toLowerCase().endsWith('.pdf');
}

function makeVersion(file, number) {
  return {
    id: Date.now(),
    number: number,
    fileName: file.name,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    file: file, // the real file is stored too
  };
}

function CV() {
  // ===== ZONE 1: state =====
  const [cvs, setCvs] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [newName, setNewName] = useState('');
  const [newFile, setNewFile] = useState(null);
  const [viewing, setViewing] = useState(null); // the version shown in the viewer
  const [viewUrl, setViewUrl] = useState('');

  // Load the saved CVs once, when the page opens
  useEffect(() => {
    get('cvs').then((saved) => {
      if (saved) setCvs(saved);
      setLoaded(true);
    });
  }, []);

  // Save every time cvs changes (only after loading, so we never overwrite with [])
  useEffect(() => {
    if (loaded) set('cvs', cvs);
  }, [cvs, loaded]);

  // Make a temporary address for the file being viewed, and clean it up after
  useEffect(() => {
    if (!viewing) return;
    const url = URL.createObjectURL(viewing.file);
    setViewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [viewing]);

  // ===== ZONE 2: logic =====
  function createCv(e) {
    e.preventDefault();
    if (newName.trim() === '' || !newFile) return;
    if (!isAllowed(newFile)) {
      alert('Please choose a PDF or Word file.');
      return;
    }

    const newCv = {
      id: Date.now(),
      name: newName.trim(),
      versions: [makeVersion(newFile, 1)],
    };

    setCvs([newCv, ...cvs]);
    setNewName('');
    setNewFile(null);
    e.target.reset(); // clears the file input
  }

  function addVersion(cvId, file) {
    if (!isAllowed(file)) {
      alert('Please choose a PDF or Word file.');
      return;
    }
    setCvs(
      cvs.map((cv) => {
        if (cv.id !== cvId) return cv;
        const nextNumber = Math.max(0, ...cv.versions.map((v) => v.number)) + 1;
        // newest version goes first
        return { ...cv, versions: [makeVersion(file, nextNumber), ...cv.versions] };
      })
    );
  }

  function renameCv(cvId, name) {
    setCvs(cvs.map((cv) => (cv.id === cvId ? { ...cv, name: name } : cv)));
  }

  function deleteCv(cvId) {
    if (!confirm('Delete this CV and all its versions?')) return;
    setCvs(cvs.filter((cv) => cv.id !== cvId));
    setViewing(null);
  }

  function deleteVersion(cvId, versionId) {
    if (!confirm('Delete this version?')) return;
    setCvs(
      cvs
        .map((cv) =>
          cv.id === cvId
            ? { ...cv, versions: cv.versions.filter((v) => v.id !== versionId) }
            : cv
        )
        .filter((cv) => cv.versions.length > 0) // a CV with no versions left is removed
    );
    if (viewing && viewing.id === versionId) setViewing(null);
  }

  function download(version) {
    const url = URL.createObjectURL(version.file);
    const link = document.createElement('a');
    link.href = url;
    link.download = version.fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ===== ZONE 3: what you see =====
  return (
    <section>
      <h1>My CV</h1>
      <p>Keep every version of your CV in one place.</p>

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
        <button type="submit">+ Add CV</button>
      </form>

      {loaded && cvs.length === 0 && (
        <p className="empty">No CVs yet. Upload your first one above.</p>
      )}

      <div className={viewing ? 'cv-grid with-viewer' : 'cv-grid'}>
        <div className="cv-list">
          {cvs.map((cv) => (
            <CVCard
              key={cv.id}
              cv={cv}
              viewingId={viewing ? viewing.id : null}
              onRename={renameCv}
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
              <strong>{viewing.fileName}</strong>
              <button onClick={() => setViewing(null)}>Close ✕</button>
            </div>
            {isPdf(viewing) ? (
              <iframe src={viewUrl} title="CV preview" />
            ) : (
              <p className="viewer-note">
                Word files can't be shown in the browser. Click <strong>Download</strong> to open it in Word.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default CV;