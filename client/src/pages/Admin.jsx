import { motion } from 'framer-motion'
import {
  BatteryCharging,
  ChevronLeft,
  ChevronRight,
  Edit3,
  LayoutDashboard,
  MapPinned,
  MessageSquare,
  Plus,
  Shield,
  Trash2,
  UserRound,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import StationFormModal from '../components/admin/StationFormModal'
import { Navbar, PageWrapper } from '../components/layout'
import { Button, Input } from '../components/ui'
import { getMockStations } from '../data/mockStations'
import useSocket from '../hooks/useSocket'
import api from '../services/api'
import { isMockModeEnabled } from '../utils/mockMode'

const adminTabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'stations', label: 'Stations', icon: MapPinned },
  { id: 'chargers', label: 'Chargers', icon: BatteryCharging },
  { id: 'reviews', label: 'Reviews', icon: MessageSquare },
  { id: 'users', label: 'Users', icon: UserRound },
]

const CHARGER_STATUS_OPTIONS = ['available', 'occupied', 'offline', 'maintenance']

const CHART_COLORS = ['#f0f0f0', '#ffb800', '#ff3d5a', '#8ca1b5']

const formatDate = (value) => {
  if (!value) {
    return '--'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const parsePagination = (payload, fallbackPage = 1, fallbackLimit = 20) => {
  const pagination = payload?.data?.pagination || payload?.pagination || {}

  return {
    page: Number(pagination.page) || fallbackPage,
    limit: Number(pagination.limit) || fallbackLimit,
    pages: Number(pagination.pages) || 1,
    total: Number(pagination.total) || 0,
  }
}

const toMockAdminCollections = () => {
  const stations = getMockStations()
  const now = new Date()

  const chargers = stations.flatMap((station) => {
    const total = Number(station?.totalChargers) || 0
    const available = Number(station?.availableChargers) || 0

    return Array.from({ length: total }).map((_, index) => ({
      _id: `${station._id}-charger-${index + 1}`,
      stationId: {
        _id: station._id,
        stationName: station.stationName,
        city: station.city,
        state: station.state,
      },
      chargerType: station?.chargerTypes?.[0] || 'Level2',
      connectorType: 'Type2',
      powerOutput: station?.chargerTypes?.includes('DC_Fast') ? 60 : 22,
      status: index < available ? 'available' : 'occupied',
      lastUpdated: now.toISOString(),
    }))
  })

  const users = [
    {
      _id: 'mock-admin-1',
      username: 'admin.demo',
      email: 'admin@electromap.demo',
      role: 'admin',
      createdAt: new Date(now.getFullYear() - 1, 2, 14).toISOString(),
      savedStationsCount: 4,
    },
    {
      _id: 'mock-user-1',
      username: 'driver.one',
      email: 'driver.one@example.com',
      role: 'user',
      createdAt: new Date(now.getFullYear() - 1, 6, 3).toISOString(),
      savedStationsCount: 2,
    },
    {
      _id: 'mock-user-2',
      username: 'fleet.alpha',
      email: 'fleet.alpha@example.com',
      role: 'user',
      createdAt: new Date(now.getFullYear(), 0, 11).toISOString(),
      savedStationsCount: 7,
    },
  ]

  const reviews = stations.slice(0, 6).map((station, index) => ({
    _id: `mock-review-${index + 1}`,
    rating: Math.max(3, Math.min(5, Math.round(Number(station.rating) || 4))),
    comment: 'Fast charging session with stable connector output.',
    tags: ['Fast', 'Reliable'],
    createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - index).toISOString(),
    userId: {
      _id: users[index % users.length]._id,
      username: users[index % users.length].username,
      email: users[index % users.length].email,
    },
    stationId: {
      _id: station._id,
      stationName: station.stationName,
      city: station.city,
      state: station.state,
    },
  }))

  const totalChargers = chargers.length
  const availableChargers = chargers.filter((charger) => charger.status === 'available').length
  const occupiedChargers = chargers.filter((charger) => charger.status === 'occupied').length
  const offlineChargers = chargers.filter((charger) => charger.status === 'offline').length
  const maintenanceChargers = chargers.filter((charger) => charger.status === 'maintenance').length

  const stationsByMonth = Array.from({ length: 6 }).map((_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    return {
      month: monthDate.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
      count: Math.max(1, Math.round(stations.length / 6) + (index % 2)),
    }
  })

  return {
    stations,
    chargers,
    users,
    reviews,
    stats: {
      totalStations: stations.length,
      totalChargers,
      totalUsers: users.length,
      totalReviews: reviews.length,
      activeStations: stations.filter((station) => Number(station.availableChargers) > 0).length,
      stationsByMonth,
      chargerStatusBreakdown: {
        available: availableChargers,
        occupied: occupiedChargers,
        offline: offlineChargers,
        maintenance: maintenanceChargers,
      },
    },
  }
}

const CountMetric = ({ value }) => {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let frame = null
    const target = Number(value) || 0
    const start = performance.now()
    const duration = 850

    const update = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - progress) ** 3
      setDisplay(Math.round(target * eased))

      if (progress < 1) {
        frame = window.requestAnimationFrame(update)
      }
    }

    frame = window.requestAnimationFrame(update)

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame)
      }
    }
  }, [value])

  return <span className="mono-data">{display.toLocaleString('en-IN')}</span>
}

const TableSkeleton = ({ rows = 6, columns = 5 }) => (
  <div style={{ display: 'grid', gap: '0.45rem' }}>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div
        key={`table-skeleton-${rowIndex}`}
        className="glass-card skeleton"
        style={{
          borderRadius: '10px',
          height: 44,
          width: `calc(100% - ${(rowIndex % columns) * 0.4}rem)`,
        }}
      />
    ))}
  </div>
)

function Admin() {
  const { socket } = useSocket()

  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const [stats, setStats] = useState({
    totalStations: 0,
    totalChargers: 0,
    activeStations: 0,
    totalReviews: 0,
    totalUsers: 0,
    stationsByMonth: [],
    chargerStatusBreakdown: {
      available: 0,
      occupied: 0,
      offline: 0,
      maintenance: 0,
    },
  })
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState('')

  const [stations, setStations] = useState([])
  const [stationsPage, setStationsPage] = useState(1)
  const [stationsPagination, setStationsPagination] = useState({
    page: 1,
    limit: 20,
    pages: 1,
    total: 0,
  })
  const [stationsLoading, setStationsLoading] = useState(false)
  const [stationsError, setStationsError] = useState('')
  const [stationActionLoadingId, setStationActionLoadingId] = useState('')
  const [stationOptions, setStationOptions] = useState([])

  const [stationModalOpen, setStationModalOpen] = useState(false)
  const [stationModalMode, setStationModalMode] = useState('create')
  const [stationModalRecord, setStationModalRecord] = useState(null)
  const [stationModalLoading, setStationModalLoading] = useState(false)

  const [chargerStationFilter, setChargerStationFilter] = useState('')
  const [chargers, setChargers] = useState([])
  const [chargersPage, setChargersPage] = useState(1)
  const [chargersPagination, setChargersPagination] = useState({
    page: 1,
    limit: 20,
    pages: 1,
    total: 0,
  })
  const [chargersLoading, setChargersLoading] = useState(false)
  const [chargersError, setChargersError] = useState('')
  const [chargerUpdatingId, setChargerUpdatingId] = useState('')

  const [reviews, setReviews] = useState([])
  const [reviewsPage, setReviewsPage] = useState(1)
  const [reviewsPagination, setReviewsPagination] = useState({
    page: 1,
    limit: 20,
    pages: 1,
    total: 0,
  })
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsError, setReviewsError] = useState('')
  const [reviewDeletingId, setReviewDeletingId] = useState('')

  const [users, setUsers] = useState([])
  const [usersPage, setUsersPage] = useState(1)
  const [usersSearchInput, setUsersSearchInput] = useState('')
  const [usersSearchQuery, setUsersSearchQuery] = useState('')
  const [usersPagination, setUsersPagination] = useState({
    page: 1,
    limit: 20,
    pages: 1,
    total: 0,
  })
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState('')
  const [roleUpdatingId, setRoleUpdatingId] = useState('')

  const chargerPieData = useMemo(
    () => [
      {
        name: 'available',
        value: Number(stats?.chargerStatusBreakdown?.available) || 0,
      },
      {
        name: 'occupied',
        value: Number(stats?.chargerStatusBreakdown?.occupied) || 0,
      },
      {
        name: 'offline',
        value: Number(stats?.chargerStatusBreakdown?.offline) || 0,
      },
      {
        name: 'maintenance',
        value: Number(stats?.chargerStatusBreakdown?.maintenance) || 0,
      },
    ],
    [
      stats?.chargerStatusBreakdown?.available,
      stats?.chargerStatusBreakdown?.maintenance,
      stats?.chargerStatusBreakdown?.occupied,
      stats?.chargerStatusBreakdown?.offline,
    ],
  )

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    setStatsError('')

    if (isMockModeEnabled()) {
      const fallback = toMockAdminCollections()
      setStats(fallback.stats)
      setStatsLoading(false)
      return
    }

    try {
      const { data } = await api.get('/admin/stats')
      const payload = data?.data || {}
      setStats({
        totalStations: Number(payload?.totalStations) || 0,
        totalChargers: Number(payload?.totalChargers) || 0,
        activeStations: Number(payload?.activeStations) || 0,
        totalReviews: Number(payload?.totalReviews) || 0,
        totalUsers: Number(payload?.totalUsers) || 0,
        stationsByMonth: Array.isArray(payload?.stationsByMonth)
          ? payload.stationsByMonth
          : [],
        chargerStatusBreakdown: payload?.chargerStatusBreakdown || {
          available: 0,
          occupied: 0,
          offline: 0,
          maintenance: 0,
        },
      })
    } catch {
      const fallback = toMockAdminCollections()
      setStats(fallback.stats)
      setStatsError('')
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const loadStationOptions = useCallback(async () => {
    if (isMockModeEnabled()) {
      const fallback = toMockAdminCollections()
      setStationOptions(fallback.stations)
      return
    }

    try {
      const { data } = await api.get('/stations', {
        params: {
          page: 1,
          limit: 100,
          sortBy: 'name',
        },
      })
      const nextStations = data?.data?.stations || []
      setStationOptions(nextStations)
    } catch {
      const fallback = toMockAdminCollections()
      setStationOptions(fallback.stations)
    }
  }, [])

  const loadStations = useCallback(async (page = stationsPage) => {
    setStationsLoading(true)
    setStationsError('')

    if (isMockModeEnabled()) {
      const fallback = toMockAdminCollections()
      const start = (page - 1) * 20
      const end = start + 20
      setStations(fallback.stations.slice(start, end))
      setStationsPagination({
        page,
        limit: 20,
        total: fallback.stations.length,
        pages: Math.max(1, Math.ceil(fallback.stations.length / 20)),
      })
      setStationsLoading(false)
      return
    }

    try {
      const { data } = await api.get('/stations', {
        params: {
          page,
          limit: 20,
          sortBy: 'name',
        },
      })

      setStations(data?.data?.stations || [])
      setStationsPagination(parsePagination(data, page, 20))
    } catch {
      const fallback = toMockAdminCollections()
      const start = (page - 1) * 20
      const end = start + 20
      const paginated = fallback.stations.slice(start, end)
      setStations(paginated)
      setStationsPagination({
        page,
        limit: 20,
        total: fallback.stations.length,
        pages: Math.max(1, Math.ceil(fallback.stations.length / 20)),
      })
      setStationsError('')
    } finally {
      setStationsLoading(false)
    }
  }, [stationsPage])

  const loadChargers = useCallback(async (page = chargersPage, stationId = chargerStationFilter) => {
    setChargersLoading(true)
    setChargersError('')

    if (isMockModeEnabled()) {
      const fallback = toMockAdminCollections()
      const filtered = stationId
        ? fallback.chargers.filter(
            (charger) => String(charger?.stationId?._id) === String(stationId),
          )
        : fallback.chargers
      const start = (page - 1) * 20
      const end = start + 20
      setChargers(filtered.slice(start, end))
      setChargersPagination({
        page,
        limit: 20,
        total: filtered.length,
        pages: Math.max(1, Math.ceil(filtered.length / 20)),
      })
      setChargersLoading(false)
      return
    }

    try {
      const { data } = await api.get('/admin/chargers', {
        params: {
          page,
          limit: 20,
          stationId: stationId || undefined,
        },
      })

      setChargers(data?.data?.chargers || [])
      setChargersPagination(parsePagination(data, page, 20))
    } catch {
      const fallback = toMockAdminCollections()
      const filtered = stationId
        ? fallback.chargers.filter(
            (charger) => String(charger?.stationId?._id) === String(stationId),
          )
        : fallback.chargers
      const start = (page - 1) * 20
      const end = start + 20
      setChargers(filtered.slice(start, end))
      setChargersPagination({
        page,
        limit: 20,
        total: filtered.length,
        pages: Math.max(1, Math.ceil(filtered.length / 20)),
      })
      setChargersError('')
    } finally {
      setChargersLoading(false)
    }
  }, [chargerStationFilter, chargersPage])

  const loadReviews = useCallback(async (page = reviewsPage) => {
    setReviewsLoading(true)
    setReviewsError('')

    if (isMockModeEnabled()) {
      const fallback = toMockAdminCollections()
      const start = (page - 1) * 20
      const end = start + 20
      setReviews(fallback.reviews.slice(start, end))
      setReviewsPagination({
        page,
        limit: 20,
        total: fallback.reviews.length,
        pages: Math.max(1, Math.ceil(fallback.reviews.length / 20)),
      })
      setReviewsLoading(false)
      return
    }

    try {
      const { data } = await api.get('/admin/reviews', {
        params: {
          page,
          limit: 20,
        },
      })

      setReviews(data?.data?.reviews || [])
      setReviewsPagination(parsePagination(data, page, 20))
    } catch {
      const fallback = toMockAdminCollections()
      const start = (page - 1) * 20
      const end = start + 20
      setReviews(fallback.reviews.slice(start, end))
      setReviewsPagination({
        page,
        limit: 20,
        total: fallback.reviews.length,
        pages: Math.max(1, Math.ceil(fallback.reviews.length / 20)),
      })
      setReviewsError('')
    } finally {
      setReviewsLoading(false)
    }
  }, [reviewsPage])

  const loadUsers = useCallback(async (page = usersPage, query = usersSearchQuery) => {
    setUsersLoading(true)
    setUsersError('')

    if (isMockModeEnabled()) {
      const fallback = toMockAdminCollections()
      const filteredUsers = query
        ? fallback.users.filter((user) => {
            const haystack = `${user.username} ${user.email}`.toLowerCase()
            return haystack.includes(String(query).toLowerCase())
          })
        : fallback.users
      const start = (page - 1) * 20
      const end = start + 20
      setUsers(filteredUsers.slice(start, end))
      setUsersPagination({
        page,
        limit: 20,
        total: filteredUsers.length,
        pages: Math.max(1, Math.ceil(filteredUsers.length / 20)),
      })
      setUsersLoading(false)
      return
    }

    try {
      const { data } = await api.get('/admin/users', {
        params: {
          page,
          limit: 20,
          q: query || undefined,
        },
      })

      setUsers(data?.data?.users || [])
      setUsersPagination(parsePagination(data, page, 20))
    } catch {
      const fallback = toMockAdminCollections()
      const filteredUsers = query
        ? fallback.users.filter((user) => {
            const haystack = `${user.username} ${user.email}`.toLowerCase()
            return haystack.includes(String(query).toLowerCase())
          })
        : fallback.users
      const start = (page - 1) * 20
      const end = start + 20
      setUsers(filteredUsers.slice(start, end))
      setUsersPagination({
        page,
        limit: 20,
        total: filteredUsers.length,
        pages: Math.max(1, Math.ceil(filteredUsers.length / 20)),
      })
      setUsersError('')
    } finally {
      setUsersLoading(false)
    }
  }, [usersPage, usersSearchQuery])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStationOptions()
      void loadStats()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [loadStationOptions, loadStats])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (activeTab === 'stations') {
        void loadStations(stationsPage)
      }

      if (activeTab === 'chargers') {
        void loadChargers(chargersPage, chargerStationFilter)
      }

      if (activeTab === 'reviews') {
        void loadReviews(reviewsPage)
      }

      if (activeTab === 'users') {
        void loadUsers(usersPage, usersSearchQuery)
      }
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [
    activeTab,
    chargerStationFilter,
    chargersPage,
    loadChargers,
    loadReviews,
    loadStations,
    loadUsers,
    reviewsPage,
    stationsPage,
    usersPage,
    usersSearchQuery,
  ])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setUsersPage(1)
      setUsersSearchQuery(usersSearchInput.trim())
    }, 420)

    return () => {
      window.clearTimeout(timer)
    }
  }, [usersSearchInput])

  useEffect(() => {
    if (!socket) {
      return undefined
    }

    const handleChargerStatusUpdate = (payload) => {
      const chargerId = String(payload?.chargerId || '')
      if (!chargerId) {
        return
      }

      setChargers((current) =>
        current.map((charger) =>
          String(charger?._id) === chargerId
            ? {
                ...charger,
                status: payload?.status || charger?.status,
                lastUpdated: new Date().toISOString(),
              }
            : charger,
        ),
      )
    }

    socket.on('charger:status_update', handleChargerStatusUpdate)

    return () => {
      socket.off('charger:status_update', handleChargerStatusUpdate)
    }
  }, [socket])

  const handleOpenCreateStation = () => {
    setStationModalMode('create')
    setStationModalRecord(null)
    setStationModalOpen(true)
  }

  const handleOpenEditStation = async (stationId) => {
    setStationModalLoading(true)
    try {
      const { data } = await api.get(`/stations/${stationId}`)
      const fullStation = data?.data?.station || null

      if (!fullStation?._id) {
        toast.error('Could not load station details.')
        return
      }

      setStationModalMode('edit')
      setStationModalRecord(fullStation)
      setStationModalOpen(true)
    } catch (requestError) {
      toast.error(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Unable to load station details.',
      )
    } finally {
      setStationModalLoading(false)
    }
  }

  const handleDeleteStation = async (stationId) => {
    const confirmed = window.confirm('Delete this station? This cannot be undone.')
    if (!confirmed) {
      return
    }

    setStationActionLoadingId(String(stationId))

    try {
      await api.delete(`/stations/${stationId}`)
      toast.success('Station deleted.')
      await Promise.all([
        loadStations(stationsPage),
        loadStats(),
        loadStationOptions(),
      ])
    } catch (requestError) {
      toast.error(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Unable to delete station.',
      )
    } finally {
      setStationActionLoadingId('')
    }
  }

  const handleChargerStatusUpdate = async (chargerId, status) => {
    setChargerUpdatingId(String(chargerId))

    try {
      await api.put(`/chargers/${chargerId}/status`, { status })
      setChargers((current) =>
        current.map((charger) =>
          String(charger?._id) === String(chargerId)
            ? {
                ...charger,
                status,
                lastUpdated: new Date().toISOString(),
              }
            : charger,
        ),
      )
      toast.success('Charger status updated.')
      void loadStats()
    } catch (requestError) {
      toast.error(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Unable to update charger status.',
      )
    } finally {
      setChargerUpdatingId('')
    }
  }

  const handleDeleteReview = async (reviewId) => {
    const confirmed = window.confirm('Delete this review?')
    if (!confirmed) {
      return
    }

    setReviewDeletingId(String(reviewId))

    try {
      await api.delete(`/reviews/${reviewId}`)
      toast.success('Review deleted.')
      void loadReviews(reviewsPage)
      void loadStats()
    } catch (requestError) {
      toast.error(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Unable to delete review.',
      )
    } finally {
      setReviewDeletingId('')
    }
  }

  const handleRoleToggle = async (user) => {
    const nextRole = user?.role === 'admin' ? 'user' : 'admin'
    setRoleUpdatingId(String(user?._id))

    try {
      const { data } = await api.patch(`/admin/users/${user?._id}/role`, {
        role: nextRole,
      })
      const updated = data?.data?.user

      if (updated?._id) {
        setUsers((current) =>
          current.map((item) => (String(item?._id) === String(updated._id) ? updated : item)),
        )
      }

      toast.success(`Role updated to ${nextRole}.`)
      void loadStats()
    } catch (requestError) {
      toast.error(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Unable to update role.',
      )
    } finally {
      setRoleUpdatingId('')
    }
  }

  const metricCards = [
    { label: 'Total Stations', value: stats.totalStations },
    { label: 'Total Chargers', value: stats.totalChargers },
    { label: 'Active Stations', value: stats.activeStations },
    { label: 'Total Reviews', value: stats.totalReviews },
    { label: 'Total Users', value: stats.totalUsers },
  ]

  return (
    <PageWrapper title="Admin Panel" className="hero-gradient">
      <Navbar />

      <section
        className="container-shell"
        style={{
          minHeight: '100vh',
          paddingTop: '5rem',
          paddingBottom: '2rem',
          display: 'grid',
          gridTemplateColumns: sidebarCollapsed ? '74px minmax(0, 1fr)' : '250px minmax(0, 1fr)',
          gap: '0.9rem',
          transition: 'grid-template-columns 220ms var(--easing-smooth)',
        }}
      >
        <motion.aside
          className="glass-card"
          animate={{ width: sidebarCollapsed ? 74 : 250 }}
          transition={{ duration: 0.22, ease: [0.2, 0.9, 0.2, 1] }}
          style={{
            borderRadius: '14px',
            padding: '0.75rem',
            overflow: 'hidden',
            display: 'grid',
            alignContent: 'start',
            gap: '0.6rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: sidebarCollapsed ? 'center' : 'space-between', alignItems: 'center', gap: '0.4rem' }}>
            {!sidebarCollapsed ? (
              <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Shield size={16} />
                Admin
              </strong>
            ) : null}
            <button
              type="button"
              className="focus-ring"
              onClick={() => setSidebarCollapsed((current) => !current)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              style={{
                width: 30,
                height: 30,
                borderRadius: '9px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(10, 22, 40, 0.72)',
                color: 'var(--text-secondary)',
              }}
            >
              {sidebarCollapsed ? (
                <ChevronRight size={14} style={{ margin: '0 auto' }} />
              ) : (
                <ChevronLeft size={14} style={{ margin: '0 auto' }} />
              )}
            </button>
          </div>

          <nav style={{ display: 'grid', gap: '0.35rem' }}>
            {adminTabs.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  type="button"
                  className="focus-ring"
                  onClick={() => setActiveTab(tab.id)}
                  aria-label={tab.label}
                  style={{
                    width: '100%',
                    borderRadius: '10px',
                    minHeight: 40,
                    border: active
                      ? '1px solid rgba(255, 255, 255, 0.45)'
                      : '1px solid transparent',
                    background: active
                      ? 'rgba(255, 255, 255, 0.14)'
                      : 'transparent',
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    gap: '0.45rem',
                    paddingInline: sidebarCollapsed ? '0' : '0.55rem',
                  }}
                >
                  <Icon size={15} />
                  {!sidebarCollapsed ? <span>{tab.label}</span> : null}
                </button>
              )
            })}
          </nav>
        </motion.aside>

        <div className="glass-card" style={{ borderRadius: '14px', padding: '1rem', minWidth: 0 }}>
          {activeTab === 'overview' ? (
            <div style={{ display: 'grid', gap: '0.8rem' }}>
              <header>
                <h1 style={{ fontSize: '1.45rem' }}>Overview</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Platform-level metrics and operational trends.
                </p>
              </header>

              {statsError ? (
                <div className="glass-card" style={{ borderRadius: '10px', padding: '0.7rem', color: 'var(--accent-red)' }}>
                  {statsError}
                </div>
              ) : null}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.55rem',
                }}
              >
                {statsLoading
                  ? Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={`metric-skeleton-${index}`}
                        className="glass-card skeleton"
                        style={{ borderRadius: '12px', minHeight: 98 }}
                      />
                    ))
                  : metricCards.map((item) => (
                      <div
                        key={item.label}
                        className="glass-card"
                        style={{
                          borderRadius: '12px',
                          borderColor: 'rgba(255, 255, 255, 0.24)',
                          padding: '0.7rem',
                          display: 'grid',
                          gap: '0.3rem',
                        }}
                      >
                        <small style={{ color: 'var(--text-secondary)' }}>{item.label}</small>
                        <div style={{ fontSize: '1.38rem' }}>
                          <CountMetric value={item.value} />
                        </div>
                      </div>
                    ))}
              </div>

              <div className="admin-chart-grid">
                <div className="glass-card" style={{ borderRadius: '12px', padding: '0.7rem', minHeight: 280 }}>
                  <h2 style={{ fontSize: '1.05rem', marginBottom: '0.4rem' }}>Stations Added Per Month</h2>
                  <div style={{ width: '100%', height: 235 }}>
                    <ResponsiveContainer>
                      <LineChart data={stats.stationsByMonth || []}>
                        <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                        <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            background: 'rgba(5, 10, 14, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="var(--accent-primary)"
                          strokeWidth={3}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-card" style={{ borderRadius: '12px', padding: '0.7rem', minHeight: 280 }}>
                  <h2 style={{ fontSize: '1.05rem', marginBottom: '0.4rem' }}>Charger Status Mix</h2>
                  <div style={{ width: '100%', height: 235 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={chargerPieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={84}
                          dataKey="value"
                          nameKey="name"
                          label
                        >
                          {chargerPieData.map((entry, index) => (
                            <Cell key={`cell-${entry.name}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: 'rgba(5, 10, 14, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'stations' ? (
            <div style={{ display: 'grid', gap: '0.8rem' }}>
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <div>
                  <h1 style={{ fontSize: '1.45rem' }}>Stations Management</h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Manage charging stations and metadata.
                  </p>
                </div>
                <Button leftIcon={<Plus size={14} />} onClick={handleOpenCreateStation}>
                  Add Station
                </Button>
              </header>

              {stationsError ? (
                <div className="glass-card" style={{ borderRadius: '10px', padding: '0.7rem', color: 'var(--accent-red)' }}>
                  {stationsError}
                </div>
              ) : null}

              {stationsLoading ? (
                <TableSkeleton rows={8} columns={5} />
              ) : (
                <div className="admin-table-shell">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>City</th>
                        <th>Chargers</th>
                        <th>Status</th>
                        <th>Rating</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stations.length ? (
                        stations.map((station) => (
                          <tr key={station?._id}>
                            <td>{station?.stationName || '--'}</td>
                            <td>{station?.city || '--'}</td>
                            <td className="mono-data">
                              {Number(station?.availableChargers) || 0}/{Number(station?.totalChargers) || 0}
                            </td>
                            <td>
                              <span className={station?.isOpen ? 'status-available' : 'status-occupied'}>
                                {station?.isOpen ? 'Open' : 'Closed'}
                              </span>
                            </td>
                            <td className="mono-data">{Number(station?.rating || 0).toFixed(1)}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.35rem' }}>
                                <button
                                  type="button"
                                  className="focus-ring admin-icon-button"
                                  onClick={() => {
                                    void handleOpenEditStation(station?._id)
                                  }}
                                  aria-label={`Edit ${station?.stationName || 'station'}`}
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="focus-ring admin-icon-button"
                                  onClick={() => {
                                    void handleDeleteStation(station?._id)
                                  }}
                                  aria-label={`Delete ${station?.stationName || 'station'}`}
                                  disabled={stationActionLoadingId === String(station?._id)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} style={{ color: 'var(--text-secondary)' }}>
                            No stations found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <small style={{ color: 'var(--text-secondary)' }}>
                  {stationsPagination.total} total stations
                </small>
                <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={stationsPagination.page <= 1}
                    onClick={() => setStationsPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
                  </Button>
                  <span className="mono-data" style={{ fontSize: '0.84rem' }}>
                    {stationsPagination.page}/{stationsPagination.pages}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={stationsPagination.page >= stationsPagination.pages}
                    onClick={() =>
                      setStationsPage((current) =>
                        Math.min(stationsPagination.pages, current + 1),
                      )
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'chargers' ? (
            <div style={{ display: 'grid', gap: '0.8rem' }}>
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <div>
                  <h1 style={{ fontSize: '1.45rem' }}>Chargers</h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Monitor and update live charger statuses.
                  </p>
                </div>

                <label style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                  Filter by station
                  <select
                    className="focus-ring"
                    value={chargerStationFilter}
                    onChange={(event) => {
                      setChargerStationFilter(event.target.value)
                      setChargersPage(1)
                    }}
                    style={{
                      marginLeft: '0.45rem',
                      minHeight: 36,
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.26)',
                      background: 'rgba(10, 22, 40, 0.72)',
                      paddingInline: '0.55rem',
                    }}
                  >
                    <option value="">All stations</option>
                    {stationOptions.map((station) => (
                      <option key={station?._id} value={station?._id}>
                        {station?.stationName}
                      </option>
                    ))}
                  </select>
                </label>
              </header>

              {chargersError ? (
                <div className="glass-card" style={{ borderRadius: '10px', padding: '0.7rem', color: 'var(--accent-red)' }}>
                  {chargersError}
                </div>
              ) : null}

              {chargersLoading ? (
                <TableSkeleton rows={8} columns={5} />
              ) : (
                <div className="admin-table-shell">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Charger ID</th>
                        <th>Station</th>
                        <th>Type</th>
                        <th>Power</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chargers.length ? (
                        chargers.map((charger) => (
                          <tr key={charger?._id}>
                            <td className="mono-data">{String(charger?._id || '').slice(-6)}</td>
                            <td>{charger?.stationId?.stationName || '--'}</td>
                            <td>{charger?.chargerType || '--'}</td>
                            <td>{Number(charger?.powerOutput) || 0} kW</td>
                            <td>
                              <select
                                className="focus-ring"
                                value={charger?.status || 'offline'}
                                onChange={(event) => {
                                  void handleChargerStatusUpdate(charger?._id, event.target.value)
                                }}
                                disabled={chargerUpdatingId === String(charger?._id)}
                                style={{
                                  minHeight: 34,
                                  borderRadius: '9px',
                                  border: '1px solid rgba(255, 255, 255, 0.26)',
                                  background: 'rgba(10, 22, 40, 0.72)',
                                  paddingInline: '0.5rem',
                                }}
                              >
                                {CHARGER_STATUS_OPTIONS.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} style={{ color: 'var(--text-secondary)' }}>
                            No chargers found for this filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <small style={{ color: 'var(--text-secondary)' }}>
                  {chargersPagination.total} total chargers
                </small>
                <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={chargersPagination.page <= 1}
                    onClick={() => setChargersPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
                  </Button>
                  <span className="mono-data" style={{ fontSize: '0.84rem' }}>
                    {chargersPagination.page}/{chargersPagination.pages}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={chargersPagination.page >= chargersPagination.pages}
                    onClick={() =>
                      setChargersPage((current) =>
                        Math.min(chargersPagination.pages, current + 1),
                      )
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'reviews' ? (
            <div style={{ display: 'grid', gap: '0.8rem' }}>
              <header>
                <h1 style={{ fontSize: '1.45rem' }}>Reviews</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Moderate and remove inappropriate feedback.
                </p>
              </header>

              {reviewsError ? (
                <div className="glass-card" style={{ borderRadius: '10px', padding: '0.7rem', color: 'var(--accent-red)' }}>
                  {reviewsError}
                </div>
              ) : null}

              {reviewsLoading ? (
                <TableSkeleton rows={8} columns={6} />
              ) : (
                <div className="admin-table-shell">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Reviewer</th>
                        <th>Station</th>
                        <th>Rating</th>
                        <th>Comment</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviews.length ? (
                        reviews.map((review) => (
                          <tr key={review?._id}>
                            <td>{review?.userId?.username || '--'}</td>
                            <td>{review?.stationId?.stationName || '--'}</td>
                            <td className="mono-data">{Number(review?.rating || 0).toFixed(1)}</td>
                            <td style={{ maxWidth: 280 }}>
                              <p
                                style={{
                                  margin: 0,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                                title={review?.comment}
                              >
                                {review?.comment || '--'}
                              </p>
                            </td>
                            <td>{formatDate(review?.createdAt)}</td>
                            <td>
                              <button
                                type="button"
                                className="focus-ring admin-icon-button"
                                onClick={() => {
                                  void handleDeleteReview(review?._id)
                                }}
                                aria-label="Delete review"
                                disabled={reviewDeletingId === String(review?._id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} style={{ color: 'var(--text-secondary)' }}>
                            No reviews found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <small style={{ color: 'var(--text-secondary)' }}>
                  {reviewsPagination.total} total reviews
                </small>
                <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={reviewsPagination.page <= 1}
                    onClick={() => setReviewsPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
                  </Button>
                  <span className="mono-data" style={{ fontSize: '0.84rem' }}>
                    {reviewsPagination.page}/{reviewsPagination.pages}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={reviewsPagination.page >= reviewsPagination.pages}
                    onClick={() =>
                      setReviewsPage((current) =>
                        Math.min(reviewsPagination.pages, current + 1),
                      )
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'users' ? (
            <div style={{ display: 'grid', gap: '0.8rem' }}>
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <div>
                  <h1 style={{ fontSize: '1.45rem' }}>Users</h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Manage user roles and account access.
                  </p>
                </div>
                <div style={{ width: 'min(320px, 100%)' }}>
                  <Input
                    value={usersSearchInput}
                    onChange={(event) => {
                      setUsersSearchInput(event.target.value)
                    }}
                    placeholder="Search by username or email"
                    aria-label="Search users"
                  />
                </div>
              </header>

              {usersError ? (
                <div className="glass-card" style={{ borderRadius: '10px', padding: '0.7rem', color: 'var(--accent-red)' }}>
                  {usersError}
                </div>
              ) : null}

              {usersLoading ? (
                <TableSkeleton rows={8} columns={6} />
              ) : (
                <div className="admin-table-shell">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th>Saved</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length ? (
                        users.map((user) => (
                          <tr key={user?._id}>
                            <td>{user?.username || '--'}</td>
                            <td>{user?.email || '--'}</td>
                            <td>
                              <span className={user?.role === 'admin' ? 'status-available' : 'status-offline'}>
                                {user?.role || '--'}
                              </span>
                            </td>
                            <td>{formatDate(user?.createdAt)}</td>
                            <td className="mono-data">{Number(user?.savedStationsCount) || 0}</td>
                            <td>
                              <Button
                                size="sm"
                                variant={user?.role === 'admin' ? 'danger' : 'secondary'}
                                disabled={roleUpdatingId === String(user?._id)}
                                onClick={() => {
                                  void handleRoleToggle(user)
                                }}
                              >
                                {user?.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} style={{ color: 'var(--text-secondary)' }}>
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <small style={{ color: 'var(--text-secondary)' }}>
                  {usersPagination.total} total users
                </small>
                <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={usersPagination.page <= 1}
                    onClick={() => setUsersPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
                  </Button>
                  <span className="mono-data" style={{ fontSize: '0.84rem' }}>
                    {usersPagination.page}/{usersPagination.pages}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={usersPagination.page >= usersPagination.pages}
                    onClick={() =>
                      setUsersPage((current) =>
                        Math.min(usersPagination.pages, current + 1),
                      )
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <StationFormModal
        isOpen={stationModalOpen}
        mode={stationModalMode}
        station={stationModalRecord}
        onClose={() => setStationModalOpen(false)}
        onSuccess={() => {
          void loadStations(stationsPage)
          void loadStationOptions()
          void loadStats()
          if (activeTab === 'chargers') {
            void loadChargers(chargersPage, chargerStationFilter)
          }
        }}
      />

      {stationModalLoading ? (
        <div
          className="glass-card"
          style={{
            position: 'fixed',
            top: '5.3rem',
            right: '1rem',
            zIndex: 48,
            borderRadius: '10px',
            padding: '0.45rem 0.6rem',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
          }}
        >
          Loading station details...
        </div>
      ) : null}

      <style>
        {`
          .admin-chart-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.7rem;
          }

          .admin-table-shell {
            border: 1px solid rgba(255, 255, 255, 0.22);
            border-radius: 12px;
            overflow: auto;
          }

          .admin-table {
            width: 100%;
            min-width: 760px;
            border-collapse: collapse;
          }

          .admin-table th,
          .admin-table td {
            padding: 0.62rem 0.52rem;
            text-align: left;
            border-top: 1px solid rgba(122, 157, 181, 0.16);
            vertical-align: middle;
          }

          .admin-table th {
            color: var(--text-secondary);
            font-size: 0.8rem;
            border-top: none;
          }

          .admin-icon-button {
            width: 30px;
            height: 30px;
            border-radius: 9px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            background: rgba(10, 22, 40, 0.72);
            color: var(--text-secondary);
          }

          @media (max-width: 1120px) {
            .admin-chart-grid {
              grid-template-columns: minmax(0, 1fr);
            }
          }

          @media (max-width: 960px) {
            .container-shell {
              width: min(100%, calc(100% - 1.2rem));
              grid-template-columns: minmax(0, 1fr) !important;
            }
          }
        `}
      </style>
    </PageWrapper>
  )
}

export default Admin
