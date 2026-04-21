import { useState, useMemo } from 'react'
import './App.css'

const STATUS = ['Applied', 'Interview Scheduled', 'Assessment', 'Rejected']

const BADGE_CLASS = {
  'Applied': 'badge-applied',
  'Interview Scheduled': 'badge-interview',
  'Assessment': 'badge-assessment',
  'Rejected': 'badge-rejected',
}

const INITIAL_JOBS = [
  { id: 1, company: 'Stripe', role: 'Frontend Engineer', date: '2026-04-10', status: 'Interview Scheduled', notes: 'Referral from John. Technical round next week.' },
  { id: 2, company: 'Notion', role: 'Product Designer', date: '2026-04-08', status: 'Applied', notes: '' },
  { id: 3, company: 'Linear', role: 'Full Stack Engineer', date: '2026-04-05', status: 'Assessment', notes: 'Take-home task due April 20.' },
  { id: 4, company: 'Figma', role: 'UX Engineer', date: '2026-03-28', status: 'Rejected', notes: 'Got feedback — lack of 3D experience.' },
  { id: 5, company: 'Vercel', role: 'Developer Advocate', date: '2026-04-14', status: 'Applied', notes: 'Found via LinkedIn.' },
]

function fmtDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${parseInt(day)} ${months[parseInt(m) - 1]} ${y}`
}

const EMPTY_FORM = { company: '', role: '', date: new Date().toISOString().split('T')[0], status: 'Applied', notes: '' }

export default function App() {
  const [jobs, setJobs] = useState(INITIAL_JOBS)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modal, setModal] = useState(null) // null | 'add' | number (editingId)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')

  const filtered = useMemo(() => {
    return jobs.filter(j => {
      const matchSearch = !search ||
        j.company.toLowerCase().includes(search.toLowerCase()) ||
        j.role.toLowerCase().includes(search.toLowerCase())
      const matchStatus = !filterStatus || j.status === filterStatus
      return matchSearch && matchStatus
    })
  }, [jobs, search, filterStatus])

  const stats = useMemo(() => ({
    total: jobs.length,
    applied: jobs.filter(j => j.status === 'Applied').length,
    interviews: jobs.filter(j => j.status === 'Interview Scheduled').length,
    rejected: jobs.filter(j => j.status === 'Rejected').length,
  }), [jobs])

  function openAdd() {
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().split('T')[0] })
    setError('')
    setModal('add')
  }

  function openEdit(job) {
    setForm({ company: job.company, role: job.role, date: job.date, status: job.status, notes: job.notes })
    setError('')
    setModal(job.id)
  }

  function closeModal() {
    setModal(null)
    setError('')
  }

  function handleSave() {
    if (!form.company.trim() || !form.role.trim()) {
      setError('Company name and role are required.')
      return
    }
    if (modal === 'add') {
      setJobs(prev => [{ id: Date.now(), ...form }, ...prev])
    } else {
      setJobs(prev => prev.map(j => j.id === modal ? { ...j, ...form } : j))
    }
    closeModal()
  }

  function handleDelete(id) {
    if (window.confirm('Delete this application?')) {
      setJobs(prev => prev.filter(j => j.id !== id))
    }
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) closeModal()
  }

  return (
    <div className="app">
      <div className="header">
        <div>
          <h1>Job tracker</h1>
          <p className="subtitle">{jobs.length} application{jobs.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>+ Add application</button>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="stat-label">Total</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Applied</div>
          <div className="stat-value">{stats.applied}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Interviews</div>
          <div className="stat-value">{stats.interviews}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Rejected</div>
          <div className="stat-value">{stats.rejected}</div>
        </div>
      </div>

      <div className="toolbar">
        <input
          type="text"
          placeholder="Search by company or role..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Role</th>
              <th>Date applied</th>
              <th>Status</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty">No applications found</div>
                </td>
              </tr>
            ) : (
              filtered.map(j => (
                <tr key={j.id}>
                  <td className="td-company">{j.company}</td>
                  <td>{j.role}</td>
                  <td className="td-muted">{fmtDate(j.date)}</td>
                  <td>
                    <span className={`badge ${BADGE_CLASS[j.status]}`}>{j.status}</span>
                  </td>
                  <td>
                    <span className="note-text" title={j.notes}>{j.notes || '—'}</span>
                  </td>
                  <td>
                    <button className="action-btn" onClick={() => openEdit(j)}>Edit</button>
                    <button className="action-btn del" onClick={() => handleDelete(j.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={handleBackdrop}>
          <div className="modal">
            <h2>{modal === 'add' ? 'Add application' : 'Edit application'}</h2>

            <div className="field">
              <label>Company name</label>
              <input
                type="text"
                placeholder="e.g. Stripe"
                value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
              />
            </div>

            <div className="field">
              <label>Role name</label>
              <input
                type="text"
                placeholder="e.g. Senior Engineer"
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              />
            </div>

            <div className="field">
              <label>Date applied</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>

            <div className="field">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="field">
              <label>Notes</label>
              <textarea
                placeholder="Any additional info..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
