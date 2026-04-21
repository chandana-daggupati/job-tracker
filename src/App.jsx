import { useState, useMemo, useEffect } from 'react'
import './App.css'

const API = 'https://xcrco3h2nl.execute-api.eu-west-1.amazonaws.com/prod'

const STATUS = ['Applied', 'Interview Scheduled', 'Assessment', 'Rejected']

const BADGE_CLASS = {
  'Applied': 'badge-applied',
  'Interview Scheduled': 'badge-interview',
  'Assessment': 'badge-assessment',
  'Rejected': 'badge-rejected',
}

function fmtDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${parseInt(day)} ${months[parseInt(m) - 1]} ${y}`
}

const EMPTY_FORM = { company: '', role: '', date: new Date().toISOString().split('T')[0], status: 'Applied', notes: '' }

export default function App() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    fetchJobs()
  }, [])

  async function fetchJobs() {
    try {
      setLoading(true)
      const res = await fetch(`${API}/jobs`)
      const data = await res.json()
      const sorted = data.sort((a, b) => b.id.localeCompare(a.id))
      setJobs(sorted)
    } catch (e) {
      setError('Failed to load jobs. Please refresh.')
    } finally {
      setLoading(false)
    }
  }

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
    setFormError('')
    setModal('add')
  }

  function openEdit(job) {
    setForm({ company: job.company, role: job.role, date: job.date, status: job.status, notes: job.notes })
    setFormError('')
    setModal(job.id)
  }

  function closeModal() {
    setModal(null)
    setFormError('')
  }

  async function handleSave() {
    if (!form.company.trim() || !form.role.trim()) {
      setFormError('Company name and role are required.')
      return
    }

    setSaving(true)
    try {
      if (modal === 'add') {
        const res = await fetch(`${API}/jobs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const newJob = await res.json()
        setJobs(prev => [newJob, ...prev])
      } else {
        await fetch(`${API}/jobs/${modal}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: modal, ...form }),
        })
        setJobs(prev => prev.map(j => j.id === modal ? { ...j, ...form } : j))
      }
      closeModal()
    } catch (e) {
      setFormError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this application?')) return
    try {
      await fetch(`${API}/jobs/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setJobs(prev => prev.filter(j => j.id !== id))
    } catch (e) {
      alert('Failed to delete. Please try again.')
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
        <div className="stat"><div className="stat-label">Total</div><div className="stat-value">{stats.total}</div></div>
        <div className="stat"><div className="stat-label">Applied</div><div className="stat-value">{stats.applied}</div></div>
        <div className="stat"><div className="stat-label">Interviews</div><div className="stat-value">{stats.interviews}</div></div>
        <div className="stat"><div className="stat-label">Rejected</div><div className="stat-value">{stats.rejected}</div></div>
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
        {loading ? (
          <div className="empty">Loading applications...</div>
        ) : error ? (
          <div className="empty error-text">{error}</div>
        ) : (
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
                    <td><span className={`badge ${BADGE_CLASS[j.status]}`}>{j.status}</span></td>
                    <td><span className="note-text" title={j.notes}>{j.notes || '—'}</span></td>
                    <td>
                      <button className="action-btn" onClick={() => openEdit(j)}>Edit</button>
                      <button className="action-btn del" onClick={() => handleDelete(j.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={handleBackdrop}>
          <div className="modal">
            <h2>{modal === 'add' ? 'Add application' : 'Edit application'}</h2>

            <div className="field">
              <label>Company name</label>
              <input type="text" placeholder="e.g. Stripe" value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            </div>
            <div className="field">
              <label>Role name</label>
              <input type="text" placeholder="e.g. Senior Engineer" value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
            </div>
            <div className="field">
              <label>Date applied</label>
              <input type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="field">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea placeholder="Any additional info..." value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            {formError && <p className="form-error">{formError}</p>}

            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
