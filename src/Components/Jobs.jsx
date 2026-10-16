import { useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { STATUSES, STARTING_JOBS } from '../data/jobs.js';

// jobs and setJobs come from App; loading is true while App fetches them
function Jobs({ jobs, setJobs, loading }) {
  // ===== ZONE 1: state (only the form and search are kept here) =====
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [apply, setApply] = useState('');
  const [search, setSearch] = useState('');

  // ===== ZONE 2: logic =====
  const toApplyCount = jobs.filter((job) => job.status === 'To apply').length;

  const visibleJobs = jobs.filter((job) => {
    const text = [job.title, job.company, job.location].join(' ').toLowerCase();
    return text.includes(search.toLowerCase());
  });

  // Each function: 1) save in the database  2) if it worked, update the screen
  async function changeStatus(id, newStatus) {
    const { error } = await supabase.from('jobs').update({ status: newStatus }).eq('id', id);
    if (error) return alert('Could not save: ' + error.message);

    setJobs((prev) => prev.map((job) => (job.id === id ? { ...job, status: newStatus } : job)));
  }

  async function deleteJob(id) {
    if (!confirm('Delete this job?')) return;

    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (error) return alert('Could not delete: ' + error.message);

    setJobs((prev) => prev.filter((job) => job.id !== id));
  }

  async function addJob(e) {
    e.preventDefault(); // stops the page from reloading
    if (title === '' || company === '') return; // don't add empty jobs

    // insert = add a row; .select().single() = send me back the saved row
    const { data, error } = await supabase
      .from('jobs')
      .insert({ title, company, location, apply })
      .select()
      .single();
    if (error) return alert('Could not add: ' + error.message);

    setJobs((prev) => [data, ...prev]);

    // clear the form
    setTitle('');
    setCompany('');
    setLocation('');
    setApply('');
  }

  // One-time button: copy the 5 jobs from data/jobs.js into the database
  async function importStartingJobs() {
    const rows = STARTING_JOBS.map(({ id, ...rest }) => rest); // drop the old id
    const { data, error } = await supabase.from('jobs').insert(rows).select();
    if (error) return alert('Could not import: ' + error.message);

    setJobs((prev) => [...data, ...prev]);
  }

  // ===== ZONE 3: what you see =====
  if (loading) return <p className="loading">Loading your jobs…</p>;

  return (
    <section>
      <h1>My Jobs</h1>
      <p>
        You have {jobs.length} jobs saved · {toApplyCount} still to apply
      </p>

      {jobs.length === 0 && (
        <div className="panel">
          <p>Your job list is empty.</p>
          <button className="link-btn" onClick={importStartingJobs}>
            + Add my 5 starting jobs
          </button>
        </div>
      )}

      <input
        className="search"
        placeholder="Search jobs, companies, locations…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <form className="job-form" onSubmit={addJob}>
        <input placeholder="Job title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
        <input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <input placeholder="Application link" value={apply} onChange={(e) => setApply(e.target.value)} />
        <button type="submit">+ Add job</button>
      </form>

      <div className="job-list">
        {visibleJobs.map((job) => (
          <div key={job.id} className="job-card">
            <h3>{job.title}</h3>
            <p>{[job.company, job.location].filter(Boolean).join(' · ')}</p>
            <p className="details">
              {[job.duration, job.compensation].filter(Boolean).join(' · ')}
            </p>
            {job.description && <p className="details">{job.description}</p>}

            <div className="card-actions">
              <select
                className="status"
                value={job.status}
                onChange={(e) => changeStatus(job.id, e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {job.apply && (
                <a className="apply-link" href={job.apply} target="_blank" rel="noreferrer">
                  Apply →
                </a>
              )}

              <button className="delete-btn" onClick={() => deleteJob(job.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}

        {jobs.length > 0 && visibleJobs.length === 0 && <p>No jobs match your search.</p>}
      </div>
    </section>
  );
}

export default Jobs;