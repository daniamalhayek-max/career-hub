function formatSize(bytes) {
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Shows ONE CV and its versions. It doesn't change anything itself:
// it calls the functions it receives from CV.jsx (the "on..." props).
function CVCard({ cv, viewingId, onRename, onDelete, onAddVersion, onDeleteVersion, onView, onDownload }) {
  function handleNewVersion(e) {
    const file = e.target.files[0];
    if (file) onAddVersion(cv.id, file);
    e.target.value = ''; // lets you pick the same file again later
  }

  return (
    <div className="cv-card">
      <div className="cv-card-head">
        <input
          className="cv-name"
          value={cv.name}
          onChange={(e) => onRename(cv.id, e.target.value)}
          title="Click to rename"
        />
        <button className="delete-btn" onClick={() => onDelete(cv.id)}>
          Delete CV
        </button>
      </div>

      <label className="upload-btn">
        + Upload new version
        <input type="file" accept=".pdf,.doc,.docx" hidden onChange={handleNewVersion} />
      </label>

      <ul className="version-list">
        {cv.versions.map((version, index) => (
          <li key={version.id} className={version.id === viewingId ? 'version active' : 'version'}>
            <div>
              <strong>Version {version.number}</strong>
              {index === 0 && <span className="badge">Current</span>}
              <p className="version-meta">
                {version.fileName} · {formatSize(version.size)} · {formatDate(version.uploadedAt)}
              </p>
            </div>
            <div className="version-actions">
              <button onClick={() => onView(version)}>View</button>
              <button onClick={() => onDownload(version)}>Download</button>
              <button className="delete-btn" onClick={() => onDeleteVersion(cv.id, version.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CVCard;