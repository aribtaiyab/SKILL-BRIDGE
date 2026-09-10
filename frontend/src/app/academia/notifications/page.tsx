"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Bell,
  CheckCircle2,
  Clock,
  BookOpen,
  Presentation,
  Award,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDemo } from "@/lib/demo/demo-context"
import { demoService } from "@/lib/demo/demo-service"
import { apiClient } from "@/lib/api-client"

interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  link: string | null
  read: boolean
  created_at: string
}

export default function AcademiaNotificationsPage() {
  const { isDemo } = useDemo()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      if (isDemo) {
        const list = demoService.getNotifications()
        setNotifications(list)
        setUnreadCount(list.filter(n => !n.read).length)
        setLoading(false)
        return
      }

      const json = await apiClient<{ success: boolean; data: NotificationItem[]; unreadCount: number }>('/api/academia/notifications')
      if (json.success) {
        setNotifications(json.data || [])
        setUnreadCount(json.unreadCount || 0)
      }
    } catch (err) {
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [isDemo])

  const handleMarkAllRead = async () => {
    try {
      if (isDemo) {
        demoService.markAllNotificationsRead()
        setNotifications(notifications.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
        return
      }

      const json = await apiClient.patch<{ success: boolean }>('/api/academia/notifications', { markAllRead: true })
      if (json.success) {
        setNotifications(notifications.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  const handleMarkOneRead = async (id: string) => {
    try {
      if (isDemo) {
        demoService.markNotificationRead(id)
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
        return
      }

      const json = await apiClient.patch<{ success: boolean }>('/api/academia/notifications', { id })
      if (json.success) {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Error marking read:', err)
    }
  }

  const filtered = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications

  const getIcon = (type: string) => {
    switch (type) {
      case 'mentorship':
        return <BookOpen className="h-4 w-4 text-[var(--color-accent)]" />
      case 'workshop':
        return <Presentation className="h-4 w-4 text-[var(--color-accent)]" />
      case 'evidence':
        return <Award className="h-4 w-4 text-emerald-500" />
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      default:
        return <Bell className="h-4 w-4 text-[var(--color-text-muted)]" />
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Demo Notice */}
      {isDemo && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-medium">
          <Bell className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>
            <strong>Demo Sandbox:</strong> Pre-seeded alerts for Dr. Ananya Sharma. Marking as read updates session state safely.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
            Faculty Notifications
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Real-time updates regarding student submissions, assessment attempts, and workshop registrations
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs flex items-center gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border-primary)] pb-2 text-xs font-medium">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-[var(--radius-control)] transition-colors ${
            filter === 'all'
              ? 'bg-[var(--color-accent)] text-white font-bold'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-card-hover)]'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-[var(--radius-control)] transition-colors ${
            filter === 'unread'
              ? 'bg-[var(--color-accent)] text-white font-bold'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-card-hover)]'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
            <p className="text-xs text-[var(--color-text-muted)]">Loading notifications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <Bell className="h-8 w-8 text-[var(--color-text-muted)] mx-auto opacity-50" />
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto">
              You will receive alerts here whenever students submit practical evidence, book mentorship slots, or complete reassessments.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border-primary)]">
            {filtered.map((n) => (
              <div
                key={n.id}
                className={`p-4 hover:bg-[var(--color-surface-card-hover)]/40 transition-colors flex items-start justify-between gap-4 ${
                  !n.read ? 'bg-[var(--color-accent)]/5' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 rounded-full bg-[var(--color-surface-card-hover)] border border-[var(--color-border-primary)] flex-shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`text-xs font-bold ${!n.read ? 'text-[var(--color-text-primary)] font-semibold' : 'text-[var(--color-text-secondary)]'}`}>
                        {n.title}
                      </h4>
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-[var(--color-accent)] flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">{n.message}</p>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-[var(--color-text-muted)]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {n.link && (
                        <Link href={n.link} className="text-[var(--color-accent)] hover:underline flex items-center gap-1 font-semibold">
                          View details <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {!n.read && (
                  <button
                    onClick={() => handleMarkOneRead(n.id)}
                    className="text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors p-1"
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
