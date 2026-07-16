import React, { useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { toast } from 'react-toastify'
import { FaCamera, FaPhoneAlt, FaShieldAlt, FaUserCircle } from 'react-icons/fa'
import { useLanguage } from '../context/LanguageContext'

const Profile = () => {
  const { user, fetchUser } = useAuth()
  const { t } = useLanguage()
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be 5MB or less')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      await api.put('/auth/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      await fetchUser()
      toast.success('Avatar updated')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Avatar upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-sky-400"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center py-10">
      <div className="glass-panel w-full max-w-5xl overflow-hidden">
        <div className="border-b border-[var(--border)] bg-gradient-to-r from-sky-500/10 to-violet-500/10 px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-sky-600 dark:text-sky-200">{t('profile.accountProfile')}</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--text)]">{t('profile.title')}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted)]">{t('profile.subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[320px_1fr]">
          <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
            <div className="relative mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--card)] shadow-[0_20px_50px_rgba(59,130,246,0.18)]">
              <img src={user.avatar || '/default-avatar.svg'} alt="Avatar" onError={(e) => { e.currentTarget.src = '/default-avatar.svg' }} className="h-full w-full object-cover" />
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="button-secondary mt-6" disabled={uploading}>
              <FaCamera className="mr-2" /> {uploading ? t('profile.uploading') : t('profile.uploadAvatar')}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            <div className="mt-5 rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-4 text-left text-sm text-[var(--muted)]">
              <p className="font-medium text-[var(--text)]">{user.username}</p>
              <p className="mt-1">{user.email || t('profile.noEmail')}</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm text-[var(--muted)]"><FaUserCircle /> {t('profile.username')}</div>
                  <p className="text-lg font-semibold text-[var(--text)]">{user.username}</p>
                </div>
                <div className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm text-[var(--muted)]"><FaPhoneAlt /> {t('profile.phone')}</div>
                  <p className="text-lg font-semibold text-[var(--text)]">{user.phone_number || t('profile.notProvided')}</p>
                </div>
                <div className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-4 md:col-span-2">
                  <div className="mb-3 flex items-center gap-2 text-sm text-[var(--muted)]"><FaShieldAlt /> {t('profile.role')}</div>
                  <p className="text-lg font-semibold text-[var(--text)]">{user.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
