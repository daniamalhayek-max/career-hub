import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase.js';
import Login from './Components/Login.jsx';
import Dashboard from './Components/Dashboard.jsx';
import CV from './Components/CV.jsx';
import Jobs from './Components/Jobs.jsx';
import Notes from './Components/Notes.jsx';

function App() {
  const [page, setPage] = useState('dashboard');

  // Who is logged in (null = nobody)
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // The jobs, now loaded from the database
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  // 1. On start: am I already logged in? And listen for log in / log out
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => data.subscription.unsubscribe(); // stop listening on cleanup
  }, []);

  // 2. When a user logs in, load THEIR jobs from the database
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) {
      setJobs([]);
      return;
    }

    setJobsLoading(true);
    supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false }) // newest first
      .then(({ data, error }) => {
        if (error) alert('Could not load your jobs: ' + error.message);
        else setJobs(data);
        setJobsLoading(false);
      });
  }, [userId]);

  // 3. What to show (all hooks are above this line)
  if (checkingSession) return <p className="loading">Loading…</p>;
  if (!session) return <Login />;

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

        <div className="account">
          <span className="account-email">{session.user.email}</span>
          <button className="link-btn" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="main">
        {page === 'dashboard' && <Dashboard jobs={jobs} setPage={setPage} />}
        {page === 'jobs' && <Jobs jobs={jobs} setJobs={setJobs} loading={jobsLoading} />}
        {page === 'cv' && <CV />}
        {page === 'notes' && <Notes />}
      </main>
    </div>
  );
}

export default App;