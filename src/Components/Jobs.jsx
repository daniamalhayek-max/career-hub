import { useState } from 'react';
import { STATUSES } from '../data/jobs.js';

// jobs and setJobs now come from App as props
function Jobs({ jobs, setJobs }) {
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

  function changeStatus(id, newStatus) {
    setJobs(
      jobs.map((job) =>
        job.id === id ? { ...job, status: newStatus } : job
      )
    );
  }

  function deleteJob(id) {
    if (!confirm('Delete this job?')) return;
    setJobs(jobs.filter((job) => job.id !== id));
  }

  function addJob(e) {
    e.preventDefault(); // stops the page from reloading

    if (title === '' || company === '') return; // don't add empty jobs

    const newJob = {
      id: Date.now(),
      title: title,
      company: company,
      location: location,
      duration: '',
      compensation: '',
      description: '',
      apply: apply,
      status: 'To apply',
    };

    setJobs([newJob, ...jobs]);

    // clear the form
    setTitle('');
    setCompany('');
    setLocation('');
    setApply('');
  }

  // ===== ZONE 3: what you see =====
  return (
    <section>
      <h1>My Jobs</h1>
      <p>
        You have {jobs.length} jobs saved · {toApplyCount} still to apply
      </p>

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

        {visibleJobs.length === 0 && <p>No jobs match your search.</p>}
      </div>
    </section>
  );
}

export default Jobs;