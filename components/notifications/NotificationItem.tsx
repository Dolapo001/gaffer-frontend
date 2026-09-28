'use client'

import { useRouter } from 'next/navigation'
import { resolveNotificationLink } from '@/lib/notificationLinks'
import { formatDistanceToNow } from 'date-fns'
import {
  Bell,
  Trophy,
  Target,
  Square,
  ArrowLeftRight,
  ListOrdered,
  Star,
  TrendingUp,
  UserPlus,
  Users,
  Newspaper,
} from 'lucide-react'

function getIcon(type: string) {
  switch (type) {
    case 'match_started':
    case 'match_ended':
    case 'half_time':
    case 'match_suspended':
    case 'match_resumed':
      return <Trophy size={16} className="text-blue-400" />
    case 'goal_scored':
    case 'own_goal':
    case 'penalty_awarded':
    case 'penalty_scored':
    case 'penalty_missed':
      return <Target size={16} className="text-green-400" />
    case 'red_card':
      return <Square size={16} className="text-red-500" />
    case 'yellow_card':
      return <Square size={16} className="text-yellow-400" />
    case 'substitution':
      return <ArrowLeftRight size={16} className="text-purple-400" />
    case 'lineup_change':
      return <ListOrdered size={16} className="text-indigo-400" />
    case 'fantasy_points_updated':
      return <Star size={16} className="text-yellow-400" />
    case 'fantasy_rank_changed':
      return <TrendingUp size={16} className="text-orange-400" />
    case 'team_invite':
      return <UserPlus size={16} className="text-teal-400" />
    case 'team_update':
      return <Users size={16} className="text-teal-400" />
    case 'news_published':
      return <Newspaper size={16} className="text-gray-400" />
    default:
      return <Bell size={16} className="text-gray-400" />
  }
}

export interface NotificationItemProps {
  notification: {
    _id: string
    type: string
    title: string
    message: string
    isRead: boolean
    createdAt: string
    link?: string
  }
  onRead: (id: string) => void
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const router = useRouter()

  const handleClick = () => {
    if (!notification.isRead) onRead(notification._id)
    // Old notifications carry pre-/app links ("/fantasy", "/match/:id"): map them
    const target = resolveNotificationLink(notification.link)
    if (target) router.push(target)
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/5 ${
        !notification.isRead
          ? 'border-l-4 border-l-gaffer-orange bg-gaffer-orange/5'
          : 'border-l-4 border-l-transparent opacity-60'
      }`}
    >
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
        {getIcon(notification.type)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-chakra font-black uppercase text-white leading-tight truncate">
          {notification.title}
        </p>
        <p className="text-[11px] text-white/40 font-medium leading-normal line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <span className="text-[9px] text-white/20 font-bold uppercase mt-1 inline-block">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </span>
      </div>

      {!notification.isRead && (
        <div className="w-2 h-2 rounded-full bg-gaffer-orange shrink-0 mt-1.5 flex-none" />
      )}
    </button>
  )
}
