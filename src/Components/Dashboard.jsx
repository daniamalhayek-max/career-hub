import { STATUSES } from '../data/jobs.js';

// A small reusable component: one number box
function Stat({ number, label }) {
  return (
    <div className="stat">
      <span className="stat-number">{number}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function Dashboard({ jobs, setPage }) {
  // How many jobs have this status?
  function countStatus(status) {
    return jobs.filter((job) => job.status === status).length;
  }

  const total = jobs.length;
  const toApply = countStatus('To apply');
  const sent = total - toApply;
  const responses = countStatus('Interview') + countStatus('Offer');
  const responseRate = sent === 0 ? 0 : Math.round((responses / sent) * 100);

  // The first 3 jobs still waiting
  const nextJobs = jobs.filter((job) => job.status === 'To apply').slice(0, 3);

  return (
    <section>
      <h1>Dashboard</h1>
      <p>Here's how your job search is going.</p>

      <div className="stats">
        <Stat number={total} label="Jobs saved" />
        <Stat number={toApply} label="Still to apply" />
        <Stat number={sent} label="Applications sent" />
        <Stat number={responseRate + '%'} label="Response rate" />
      </div>

      <div className="panel">
        <h2>Pipeline</h2>
        {STATUSES.map((status) => {
          const count = countStatus(status);
          const percent = total === 0 ? 0 : (count / total) * 100;
          return (
            <div key={status} className="pipe-row">
              <span>{status}</span>
              <div className="pipe-track">
                <div
                  className={'pipe-fill ' + status.toLowerCase().replace(' ', '-')}
                  style={{ width: percent + '%' }}
                />
              </div>
              <span className="pipe-count">{count}</span>
            </div>
          );
        })}
      </div>

      <div className="panel">
        <h2>Next to apply</h2>
        {nextJobs.length === 0 ? (
          <p>Nothing waiting. Add a job you want to apply to.</p>
        ) : (
          <ul className="next-list">
            {nextJobs.map((job) => (
              <li key={job.id}>
                <strong>{job.title}</strong> · {job.company}
              </li>
            ))}
          </ul>
        )}
        <button className="link-btn" onClick={() => setPage('jobs')}>
          Go to my jobs →
        </button>
      </div>
    </section>
  );
}

export default Dashboard;