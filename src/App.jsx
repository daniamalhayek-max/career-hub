import { useState, useEffect } from 'react';
import Dashboard from './Components/Dashboard.jsx';
import CV from './Components/CV.jsx';
import Jobs from './Components/Jobs.jsx';
import Notes from './Components/Notes.jsx';
import { STARTING_JOBS } from './data/jobs.js';

function App() {
  const [page, setPage] = useState('dashboard');

  // The jobs now live here, in the parent, so every page can use them
  const [jobs, setJobs] = useState(() => {
    const saved = localStorage.getItem('jobs');
    return saved ? JSON.parse(saved) : STARTING_JOBS;
  });

  // Save jobs every time they change
  useEffect(() => {
    localStorage.setItem('jobs', JSON.stringify(jobs));
  }, [jobs]);

  return (
    <div className="app">
      <aside className="sidebar">
        <h2 className="logo">Career Hub</h2>
        <nav className="nav">
          <button className={page === 'dashboard' ? 'active' : ''} onClick={() => setPage('dashboard')}>Dashboard</button>
          <button className={page === 'jobs' ? 'active' : ''} onClick={() => setPage('jobs')}>Jobs</button>
          <button className={page === 'cv' ? 'active' : ''} onClick={() => setPage('cv')}>My CV</button>
          <button className={page === 'notes' ? 'active' : ''} onClick={() => setPage('notes')}>Notes</button>
        </nav>
      </aside>

      <main className="main">
        {page === 'dashboard' && <Dashboard jobs={jobs} setPage={setPage} />}
        {page === 'jobs' && <Jobs jobs={jobs} setJobs={setJobs} />}
        {page === 'cv' && <CV />}
        {page === 'notes' && <Notes />}
      </main>
    </div>
  );
}

export default App;