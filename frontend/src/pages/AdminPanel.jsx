import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import { toast } from 'react-toastify'
import { FaCar, FaUserCheck, FaUserTimes, FaUsers } from 'react-icons/fa'
import { useLanguage } from '../context/LanguageContext'

const AdminPanel = () => {
  const { t } = useLanguage()
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchData()
  }, [page])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.get(`/admin/users?page=${page}&size=10`),
        api.get('/admin/stats')
      ])
      setUsers(usersRes.data.data || [])
      setTotalPages(usersRes.data.pages || 1)
      setStats(statsRes.data)
    } catch (error) {
      toast.error('Unable to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const blockUser = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/block`)
      toast.success('User blocked')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Something went wrong')
    }
  }

  const unblockUser = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/unblock`)
      toast.success('User unblocked')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Something went wrong')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-sky-400"></div>
      </div>
    )
  }

  const statItems = [
    { label: t('admin.totalUsers'), value: stats?.users?.total || 0, icon: FaUsers, accent: 'from-sky-500/20 to-cyan-500/10' },
    { label: t('admin.active'), value: stats?.users?.active || 0, icon: FaUserCheck, accent: 'from-emerald-500/20 to-green-500/10' },
    { label: t('admin.blocked'), value: stats?.users?.blocked || 0, icon: FaUserTimes, accent: 'from-rose-500/20 to-red-500/10' },
    { label: t('admin.listings'), value: stats?.cars?.total || 0, icon: FaCar, accent: 'from-violet-500/20 to-fuchsia-500/10' }
  ]

  return (
    <div className="space-y-6">
      <div className="glass-panel overflow-hidden">
        <div className="border-b border-[var(--border)] bg-gradient-to-r from-sky-500/10 to-violet-500/10 px-6 py-6 sm:px-8">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-600 dark:text-sky-200">{t('admin.administration')}</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--text)]">{t('admin.title')}</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{t('admin.subtitle')}</p>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-4 sm:p-8">
          {statItems.map((item, index) => (
            <div key={index} className={`rounded-[20px] border border-[var(--border)] bg-gradient-to-br ${item.accent} p-5`}>
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--muted)]">{item.label}</p>
                <item.icon className="text-2xl text-[var(--text)]" />
              </div>
              <p className="mt-4 text-3xl font-semibold text-[var(--text)]">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border)]">
            <thead className="bg-[var(--card)]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">{t('admin.id')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">{t('profile.username')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">{t('admin.email')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">{t('admin.role')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">{t('admin.status')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {users.map((user) => (
                <tr key={user.id} className="bg-transparent">
                  <td className="px-6 py-4 text-sm text-[var(--text)]">{user.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-[var(--text)]">{user.username}</td>
                  <td className="px-6 py-4 text-sm text-[var(--muted)]">{user.email || '-'}</td>
                  <td className="px-6 py-4 text-sm text-[var(--muted)]">
                    <span className={`rounded-full px-2.5 py-1 text-xs ${user.role === 'admin' ? 'bg-violet-500/15 text-violet-700 dark:text-violet-200' : 'bg-slate-500/10 text-[var(--text)]'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`rounded-full px-2.5 py-1 text-xs ${user.is_active ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200' : 'bg-rose-500/15 text-rose-700 dark:text-rose-200'}`}>
                      {user.is_active ? 'Active' : 'Blocked'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.is_active ? (
                      <button onClick={() => blockUser(user.id)} className="rounded-full bg-rose-500/15 px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-500/25 dark:text-rose-200">
                        {t('admin.block')}
                      </button>
                    ) : (
                      <button onClick={() => unblockUser(user.id)} className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-500/25 dark:text-emerald-200">
                        {t('admin.unblock')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-3 border-t border-[var(--border)] px-6 py-4 sm:px-8">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="button-secondary px-4 py-2 disabled:opacity-50">
              {t('admin.previous')}
            </button>
            <span className="text-sm text-[var(--text)]">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="button-secondary px-4 py-2 disabled:opacity-50">
              {t('admin.next')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPanel