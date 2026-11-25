import React, { useState } from 'react'
import { Bell, Check, Trash2 } from 'lucide-react'

export const NotificationDropdown: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'New Customer Order', desc: 'Order #ORD-9821 received ($348.00)', time: '5m ago', unread: true },
    { id: '2', title: 'Inventory Alert', desc: 'Sony WH-1000XM5 running low (2 units)', time: '1h ago', unread: true },
    { id: '3', title: 'System Security', desc: 'Database backup verified successfully', time: '1d ago', unread: false },
  ])

  const unreadCount = notifications.filter((n) => n.unread).length

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#EF233C]" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Notifications ({unreadCount})
              </span>
              <div className="flex gap-2">
                <button
                  onClick={markAllRead}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Check size={12} /> Read
                </button>
                <button
                  onClick={clearAll}
                  className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No new notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 text-left transition-colors ${
                      n.unread
                        ? 'bg-red-50/40 dark:bg-red-950/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{n.time}</span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      {n.desc}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationDropdown
