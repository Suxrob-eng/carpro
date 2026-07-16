import React from 'react'

const Layout = ({ children }) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent text-[var(--text)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-8 top-12 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute right-0 top-24 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>
      <div className="relative min-h-screen">{children}</div>
    </div>
  )
}

export default Layout
