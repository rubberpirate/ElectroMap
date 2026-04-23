import { AnimatePresence, motion } from 'framer-motion'
import { ListFilter, MapPin, Route, X, Zap } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'

import { Navbar, PageWrapper } from '../components/layout'
import MapSidebar from '../components/map/MapSidebar'
import MapView from '../components/map/MapView'
import StationDrawer from '../components/station/StationDrawer'
import { getMockStationById } from '../data/mockStations'
import useAuth from '../hooks/useAuth'
import useGeolocation from '../hooks/useGeolocation'
import useSocket from '../hooks/useSocket'
import useStations from '../hooks/useStations'
import api from '../services/api'
import { useMapStore } from '../store/mapStore'
import { useStationStore } from '../store/stationStore'
import { buildOsrmRouteUrl, getMapTilerKey } from '../utils/maptiler'
import { isMockModeEnabled, isMockStationId } from '../utils/mockMode'

const INDIA_CENTER = [78.9629, 20.5937]
const MOCK_FALLBACK_LOCATION = {
	lat: 16.5062,
	lng: 80.648,
}

const getStationCoordinates = (station) => {
	const coordinates = station?.location?.coordinates

	if (Array.isArray(coordinates) && coordinates.length >= 2) {
		const lng = Number(coordinates[0])
		const lat = Number(coordinates[1])

		if (Number.isFinite(lat) && Number.isFinite(lng)) {
			return [lng, lat]
		}
	}

	const lng = Number(station?.lng)
	const lat = Number(station?.lat)

	if (Number.isFinite(lat) && Number.isFinite(lng)) {
		return [lng, lat]
	}

	return null
}

const getInitialViewport = (userLocation, mapCenter) => {
	const centerLng = Number(userLocation?.lng ?? mapCenter?.[0])
	const centerLat = Number(userLocation?.lat ?? mapCenter?.[1])

	if (Number.isFinite(centerLat) && Number.isFinite(centerLng)) {
		return {
			lat: centerLat,
			lng: centerLng,
			radiusKm: 10,
		}
	}

	return {
		lat: isMockModeEnabled() ? MOCK_FALLBACK_LOCATION.lat : INDIA_CENTER[1],
		lng: isMockModeEnabled() ? MOCK_FALLBACK_LOCATION.lng : INDIA_CENTER[0],
		radiusKm: 10,
	}
}

function MapPage() {
	const [searchParams, setSearchParams] = useSearchParams()
	const availabilityToastMapRef = useRef(new Map())

	const userLocation = useMapStore((state) => state.userLocation)
	const mapCenter = useMapStore((state) => state.mapCenter)
	const selectedStation = useMapStore((state) => state.selectedStation)
	const highlightedStationId = useMapStore((state) => state.highlightedStationId)
	const filters = useMapStore((state) => state.filters)
	const visibleStations = useMapStore((state) => state.visibleStations)
	const setUserLocation = useMapStore((state) => state.setUserLocation)
	const setSelectedStation = useMapStore((state) => state.setSelectedStation)
	const setHighlightedStationId = useMapStore((state) => state.setHighlightedStationId)
	const setFilters = useMapStore((state) => state.setFilters)
	const resetFilters = useMapStore((state) => state.resetFilters)
	const setMapCenter = useMapStore((state) => state.setMapCenter)
	const zoom = useMapStore((state) => state.zoom)
	const setZoom = useMapStore((state) => state.setZoom)
	const setVisibleStations = useMapStore((state) => state.setVisibleStations)
	const setStations = useMapStore((state) => state.setStations)

	const { socket, isConnected } = useSocket()
	const {
		requestLocation,
		error: locationError,
		isLoading: isLocating,
	} = useGeolocation()
	const { user, isAuthenticated } = useAuth()
	const savedStationsFromStore = useStationStore((state) => state.savedStations)
	const stationIdFromQuery = searchParams.get('stationId')

	const [viewportQuery, setViewportQuery] = useState(() =>
		getInitialViewport(userLocation, mapCenter),
	)
	const [routeGeoJSON, setRouteGeoJSON] = useState(null)
	const [routeSummary, setRouteSummary] = useState(null)
	const [isRouting, setIsRouting] = useState(false)
	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
	const [manualLocationLabel, setManualLocationLabel] = useState(() =>
		isMockModeEnabled() ? 'Vijayawada (Demo)' : '',
	)
	const [isMobile, setIsMobile] = useState(() => {
		if (typeof window === 'undefined') {
			return false
		}

		return window.matchMedia('(max-width: 960px)').matches
	})

	useEffect(() => {
		requestLocation()
	}, [requestLocation])

	useEffect(() => {
		if (typeof window === 'undefined') {
			return undefined
		}

		const media = window.matchMedia('(max-width: 960px)')

		const onChange = (event) => {
			setIsMobile(event.matches)

			if (!event.matches) {
				setIsMobileSidebarOpen(false)
			}
		}

		media.addEventListener('change', onChange)

		return () => {
			media.removeEventListener('change', onChange)
		}
	}, [])

	const effectiveRadius = useMemo(() => {
		const mapRadius = Number(viewportQuery?.radiusKm) || 10
		const maxDistance = Number(filters?.maxDistance) || 10

		return Math.max(1, Math.min(maxDistance, mapRadius))
	}, [filters?.maxDistance, viewportQuery?.radiusKm])

	const {
		stations,
		isLoading,
		error,
		hasMore,
		loadMore,
	} = useStations({
		lat: Number(viewportQuery?.lat),
		lng: Number(viewportQuery?.lng),
		radius: effectiveRadius,
		filters,
	})

	const maptilerKey = getMapTilerKey()
	const savedStationIdList = [
		...(Array.isArray(user?.savedStations) ? user.savedStations : []).map((item) =>
			String(item),
		),
		...(Array.isArray(savedStationsFromStore) ? savedStationsFromStore : []).map((item) =>
			String(item),
		),
	]
	const savedStationKey = savedStationIdList.join('|')

	const visibleMetrics = useMemo(() => {
		const sourceStations = visibleStations?.length ? visibleStations : stations

		return {
			stationCount: sourceStations.length,
			availableChargers: sourceStations.reduce(
				(total, station) => total + (Number(station?.availableChargers) || 0),
				0,
			),
		}
	}, [stations, visibleStations])

	const clearRoute = useCallback(() => {
		setRouteGeoJSON(null)
		setRouteSummary(null)
	}, [])

	const handleNavigate = useCallback(
		async (station) => {
			const destination = getStationCoordinates(station)

			if (!destination) {
				toast.error('Station location is unavailable for navigation.')
				return false
			}

			if (!userLocation) {
				return false
			}

			setIsRouting(true)

			try {
				const routeUrl = buildOsrmRouteUrl({
					start: [userLocation.lng, userLocation.lat],
					end: destination,
				})

				if (!routeUrl) {
					throw new Error('Invalid coordinates for route navigation.')
				}

				const response = await fetch(routeUrl)

				if (!response.ok) {
					throw new Error('Directions API request failed.')
				}

				const payload = await response.json()
				const bestRoute = payload?.routes?.[0]

				if (!bestRoute?.geometry) {
					throw new Error('No route available for this station.')
				}

				setRouteGeoJSON({
					type: 'Feature',
					properties: {
						stationId: station?._id,
					},
					geometry: bestRoute.geometry,
				})

				setRouteSummary({
					stationName: station?.stationName || 'Selected station',
					distanceKm: (Number(bestRoute.distance) || 0) / 1000,
					durationMin: (Number(bestRoute.duration) || 0) / 60,
					stepsCount: bestRoute?.legs?.[0]?.steps?.length || 0,
				})

				return true
			} catch (requestError) {
				clearRoute()
				toast.error(requestError?.message || 'Could not render route on map.')
				return false
			} finally {
				setIsRouting(false)
			}
		},
		[clearRoute, userLocation],
	)

	const handleViewportSettled = useCallback(
		({ lat, lng, radiusKm, zoom }) => {
			if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
				return
			}

			const currentState = useMapStore.getState()
			const currentCenter = currentState.mapCenter || []
			const currentZoom = Number(currentState.zoom) || 5
			const nextZoom = Number(zoom) || 5

			if (
				!Number.isFinite(Number(currentCenter[0])) ||
				!Number.isFinite(Number(currentCenter[1])) ||
				Math.abs(Number(currentCenter[0]) - lng) > 0.00001 ||
				Math.abs(Number(currentCenter[1]) - lat) > 0.00001
			) {
				setMapCenter([lng, lat])
			}

			if (Math.abs(currentZoom - nextZoom) > 0.01) {
				setZoom(nextZoom)
			}

			setViewportQuery((current) => {
				const nextRadius = Number.isFinite(radiusKm) ? Number(radiusKm) : current.radiusKm
				const hasChanged =
					Math.abs(Number(current.lat) - lat) > 0.00001 ||
					Math.abs(Number(current.lng) - lng) > 0.00001 ||
					Math.abs(Number(current.radiusKm) - Number(nextRadius)) > 0.00001

				if (!hasChanged) {
					return current
				}

				return {
					...current,
					lat,
					lng,
					radiusKm: nextRadius,
				}
			})
		},
		[setMapCenter, setZoom],
	)

	const handleVisibleStationsChange = useCallback(
		(nextStations) => {
			const currentVisibleStations = useMapStore.getState().visibleStations || []
			const nextIds = Array.isArray(nextStations)
				? nextStations.map((station) => String(station?._id))
				: []
			const currentIds = currentVisibleStations.map((station) => String(station?._id))

			const sameLength = nextIds.length === currentIds.length
			const hasDiff = !sameLength || nextIds.some((id, index) => id !== currentIds[index])

			if (!hasDiff) {
				return
			}

			setVisibleStations(nextStations)
		},
		[setVisibleStations],
	)

	const handleUserLocationChange = useCallback(
		(nextLocation) => {
			const nextLat = Number(nextLocation?.lat)
			const nextLng = Number(nextLocation?.lng)

			if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) {
				return
			}

			const currentLocation = useMapStore.getState().userLocation
			const currentLat = Number(currentLocation?.lat)
			const currentLng = Number(currentLocation?.lng)

			const unchanged =
				Number.isFinite(currentLat) &&
				Number.isFinite(currentLng) &&
				Math.abs(currentLat - nextLat) < 0.00001 &&
				Math.abs(currentLng - nextLng) < 0.00001

			if (unchanged) {
				return
			}

			setUserLocation({ lat: nextLat, lng: nextLng })
		},
		[setUserLocation],
	)

	const handleManualLocationSelect = useCallback(
		(selection) => {
			const [lng, lat] = selection?.coordinates || []
			const nextLat = Number(lat)
			const nextLng = Number(lng)

			if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) {
				toast.error('Selected location is invalid.')
				return
			}

			setUserLocation({ lat: nextLat, lng: nextLng })
			setMapCenter([nextLng, nextLat])
			setZoom(12)
			setViewportQuery((current) => ({
				...current,
				lat: nextLat,
				lng: nextLng,
			}))
			setManualLocationLabel(selection?.placeName || `${nextLat.toFixed(3)}, ${nextLng.toFixed(3)}`)
			toast.success(
				`Showing stations near ${selection?.placeName || 'your selected location'}.`,
			)
		},
		[setMapCenter, setUserLocation, setZoom],
	)

	const handleStationHover = useCallback(
		(stationId) => {
			setHighlightedStationId(stationId ? String(stationId) : null)
		},
		[setHighlightedStationId],
	)

	const handleStationSelect = useCallback(
		(station) => {
			if (!station?._id) {
				return
			}

			setSelectedStation(station)
			setHighlightedStationId(String(station._id))

			if (isMobile) {
				setIsMobileSidebarOpen(false)
			}
		},
		[isMobile, setHighlightedStationId, setSelectedStation],
	)

	const handleSearchSelect = useCallback(
		async (station) => {
			if (!station?._id) {
				return
			}

			let nextStation = station

			if (!getStationCoordinates(station)) {
				if (isMockModeEnabled() || isMockStationId(station?._id)) {
					nextStation = getMockStationById(station._id) || station
				} else {
					try {
						const { data } = await api.get(`/stations/${station._id}`)
						nextStation = data?.data?.station || station
					} catch {
						nextStation = getMockStationById(station._id) || station
					}
				}
			}

			handleStationSelect(nextStation)
		},
		[handleStationSelect],
	)

	const clearStationSelectionQuery = useCallback(() => {
		setSearchParams(
			(current) => {
				const next = new URLSearchParams(current)
				next.delete('stationId')
				return next
			},
			{ replace: true },
		)
	}, [setSearchParams])

	useEffect(() => {
		if (!stationIdFromQuery) {
			return undefined
		}

		let isActive = true

		const loadQueryStation = async () => {
			const existingStation = stations.find(
				(item) => String(item?._id) === String(stationIdFromQuery),
			)
			let selected = existingStation || null

			if (!selected) {
				if (isMockModeEnabled() || isMockStationId(stationIdFromQuery)) {
					selected = getMockStationById(stationIdFromQuery)
				} else {
					try {
						const { data } = await api.get(`/stations/${stationIdFromQuery}`)
						selected = data?.data?.station || null
					} catch {
						selected = getMockStationById(stationIdFromQuery)
					}
				}
			}

			if (!isActive) {
				return
			}

			if (!selected?._id) {
				toast.error('Could not open that station on the map.')
				clearStationSelectionQuery()
				return
			}

			handleStationSelect(selected)

			const coordinates = getStationCoordinates(selected)
			if (coordinates) {
				const [lng, lat] = coordinates

				setMapCenter([lng, lat])
				setZoom(13)
				setViewportQuery((current) => ({
					...current,
					lat,
					lng,
				}))
			}

			clearStationSelectionQuery()
		}

		void loadQueryStation()

		return () => {
			isActive = false
		}
	}, [
		clearStationSelectionQuery,
		handleStationSelect,
		setMapCenter,
		setZoom,
		stationIdFromQuery,
		stations,
	])

	useEffect(() => {
		if (!socket) {
			return undefined
		}

		const handleChargerRealtime = (payload) => {
			const stationId = String(payload?.stationId || '')

			if (!stationId) {
				return
			}

			const currentMapState = useMapStore.getState()
			const matchingStation =
				currentMapState.stations.find(
					(station) => String(station?._id) === stationId,
				) ||
				currentMapState.visibleStations.find(
					(station) => String(station?._id) === stationId,
				) ||
				(String(currentMapState.selectedStation?._id) === stationId
					? currentMapState.selectedStation
					: null)
			const previousAvailable = Number(matchingStation?.availableChargers) || 0

			useStationStore.getState().updateChargerStatusRealtime(payload)

			if (typeof payload?.availableChargers !== 'number') {
				return
			}

			const savedStationIds = new Set(
				savedStationKey ? savedStationKey.split('|').filter(Boolean) : [],
			)

			if (
				isAuthenticated &&
				savedStationIds.has(stationId) &&
				String(payload?.status || '').toLowerCase() === 'available' &&
				payload.availableChargers > previousAvailable
			) {
				const now = Date.now()
				const lastToastAt = availabilityToastMapRef.current.get(stationId) || 0

				if (now - lastToastAt > 12000) {
					toast.success(
						`${
							matchingStation?.stationName || 'Saved station'
						}: ${payload.availableChargers} charger now available.`,
					)
					availabilityToastMapRef.current.set(stationId, now)
				}
			}

			setStations((currentStations) =>
				currentStations.map((station) =>
					String(station?._id) === stationId
						? {
								...station,
								availableChargers: payload.availableChargers,
							}
						: station,
				),
			)

			setVisibleStations((currentStations) =>
				currentStations.map((station) =>
					String(station?._id) === stationId
						? {
								...station,
								availableChargers: payload.availableChargers,
							}
						: station,
				),
			)

			const currentSelection = useMapStore.getState().selectedStation

			if (currentSelection && String(currentSelection._id) === stationId) {
				useMapStore.getState().setSelectedStation({
					...currentSelection,
					availableChargers: payload.availableChargers,
				})
			}
		}

		socket.on('charger:status_update', handleChargerRealtime)

		return () => {
			socket.off('charger:status_update', handleChargerRealtime)
		}
	}, [isAuthenticated, savedStationKey, setStations, setVisibleStations, socket])

	return (
		<PageWrapper title="Map" className="hero-gradient">
			<Navbar />

			<section
				style={{
					minHeight: '100vh',
					paddingTop: '4.25rem',
					paddingBottom: '0.5rem',
				}}
			>
				<div className="map-layout-shell">
					<aside className="map-sidebar-desktop glass-card">
						<MapSidebar
							stations={stations}
							isLoading={isLoading}
							error={error}
							filters={filters}
							selectedStationId={selectedStation?._id}
							onFiltersChange={setFilters}
							onResetFilters={resetFilters}
							onSelectStation={handleStationSelect}
							onHoverStation={handleStationHover}
							onSearchSelect={handleSearchSelect}
							hasMore={hasMore}
							onLoadMore={loadMore}
							maptilerKey={maptilerKey}
							locationError={locationError}
							isLocating={isLocating}
							onRequestLocation={requestLocation}
							onManualLocationSelect={handleManualLocationSelect}
							manualLocationLabel={manualLocationLabel}
						/>
					</aside>

					<div className="map-canvas-shell">
						<MapView
							stations={stations}
							selectedStation={selectedStation}
							highlightedStationId={highlightedStationId}
							userLocation={userLocation}
							mapCenter={mapCenter}
							mapZoom={zoom}
							mapStyle="dark"
							routeGeoJSON={routeGeoJSON}
							routePlannerStops={[]}
							onStationSelect={handleStationSelect}
							onStationHover={handleStationHover}
							onViewportSettled={handleViewportSettled}
							onVisibleStationsChange={handleVisibleStationsChange}
							onUserLocationChange={handleUserLocationChange}
						/>

						<div className="map-hud-bottom-left">
							<div className="glass-card map-stats-bar">
								<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
									<MapPin size={14} />
									{visibleMetrics.stationCount} stations in view
								</span>
								<span style={{ color: 'rgba(138, 138, 138, 0.72)' }}>|</span>
								<span className="status-available" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
									<Zap size={14} />
									{visibleMetrics.availableChargers} chargers available
								</span>
							</div>

							{routeSummary ? (
								<motion.div
									initial={{ opacity: 0, y: 12 }}
									animate={{ opacity: 1, y: 0 }}
									className="glass-card"
									style={{
										marginTop: '0.65rem',
										borderRadius: '2px',
										padding: '0.7rem',
										width: 'min(320px, 92vw)',
										display: 'grid',
										gap: '0.42rem',
									}}
								>
									<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
										<strong style={{ display: 'inline-flex', alignItems: 'center', gap: '0.38rem' }}>
											<Route size={15} />
											Route Active
										</strong>
										<button
											type="button"
											className="focus-ring"
											onClick={clearRoute}
											aria-label="Clear active route"
											style={{
												width: 26,
												height: 26,
												borderRadius: '2px',
												border: '1px solid var(--border)',
												background: 'rgba(22, 22, 22, 0.95)',
												color: 'var(--text-secondary)',
											}}
										>
											<X size={14} style={{ margin: '0 auto' }} />
										</button>
									</div>
									<small style={{ color: 'var(--text-secondary)' }}>{routeSummary.stationName}</small>
									<div className="mono-data" style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
										<span>{routeSummary.distanceKm.toFixed(1)} km</span>
										<span>{Math.round(routeSummary.durationMin)} min</span>
										<span>{routeSummary.stepsCount} steps</span>
									</div>
								</motion.div>
							) : null}
						</div>

						<AnimatePresence>
							{isMobile ? (
								<motion.button
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: 20 }}
									type="button"
									className="focus-ring map-mobile-toggle"
									onClick={() => setIsMobileSidebarOpen(true)}
									aria-label="Open station list and filters"
								>
									<ListFilter size={16} />
									Stations
								</motion.button>
							) : null}
						</AnimatePresence>
					</div>
				</div>

				<AnimatePresence>
					{isMobileSidebarOpen ? (
						<>
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								onClick={() => setIsMobileSidebarOpen(false)}
								style={{
									position: 'fixed',
									inset: 0,
									zIndex: 46,
									background: 'rgba(5, 5, 5, 0.62)',
								}}
								aria-hidden="true"
							/>

							<motion.aside
								initial={{ y: '100%' }}
								animate={{ y: 0 }}
								exit={{ y: '100%' }}
								transition={{ duration: 0.28, ease: [0.2, 0.9, 0.2, 1] }}
								className="glass-card map-mobile-sidebar"
							>
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										gap: '0.6rem',
										padding: '0.85rem 1rem',
										borderBottom: '1px solid var(--border)',
									}}
								>
									<strong>Stations</strong>
									<button
										type="button"
										className="focus-ring"
										onClick={() => setIsMobileSidebarOpen(false)}
										aria-label="Close stations drawer"
										style={{
											width: 34,
											height: 34,
											borderRadius: '2px',
											border: '1px solid var(--border)',
											background: 'rgba(22, 22, 22, 0.95)',
											color: 'var(--text-secondary)',
										}}
									>
										<X size={16} style={{ margin: '0 auto' }} />
									</button>
								</div>

								<div style={{ padding: '0.8rem 1rem 1rem', minHeight: 0, overflow: 'hidden' }}>
									<MapSidebar
										stations={stations}
										isLoading={isLoading}
										error={error}
										filters={filters}
										selectedStationId={selectedStation?._id}
										onFiltersChange={setFilters}
										onResetFilters={resetFilters}
										onSelectStation={handleStationSelect}
										onHoverStation={handleStationHover}
										onSearchSelect={handleSearchSelect}
										hasMore={hasMore}
										onLoadMore={loadMore}
										maptilerKey={maptilerKey}
										locationError={locationError}
										isLocating={isLocating}
										onRequestLocation={requestLocation}
										onManualLocationSelect={handleManualLocationSelect}
										manualLocationLabel={manualLocationLabel}
									/>
								</div>
							</motion.aside>
						</>
					) : null}
				</AnimatePresence>

				<StationDrawer
					stationId={selectedStation?._id}
					isOpen={Boolean(selectedStation?._id)}
					onClose={() => {
						setSelectedStation(null)
						setHighlightedStationId(null)
					}}
					socket={socket}
					userLocation={userLocation}
					onNavigate={handleNavigate}
				/>

				<div
					className="glass-card"
					style={{
						position: 'fixed',
						right: '1rem',
						bottom: '1rem',
						zIndex: 35,
						borderRadius: '2px',
						padding: '0.48rem 0.62rem',
						display: 'inline-flex',
						gap: '0.45rem',
						alignItems: 'center',
						color: isConnected ? 'var(--text-primary)' : 'var(--text-secondary)',
					}}
				>
					<span className="pulse-dot" style={{ width: 8, height: 8 }} />
					<small>{isConnected ? 'Live updates connected' : 'Reconnecting live updates...'}</small>
				</div>

				{isRouting ? (
					<div
						className="glass-card"
						style={{
							position: 'fixed',
							top: '5.4rem',
							right: '1rem',
							zIndex: 38,
							borderRadius: '2px',
							padding: '0.5rem 0.7rem',
							color: 'var(--text-secondary)',
							fontSize: '0.82rem',
						}}
					>
						Calculating best route...
					</div>
				) : null}

				<style>
					{`
						.map-layout-shell {
							height: calc(100vh - 4.75rem);
							display: grid;
							grid-template-columns: 320px minmax(0, 1fr);
							gap: 0.55rem;
							padding-inline: 0.55rem;
						}

						.map-sidebar-desktop {
							min-width: 0;
							overflow: hidden;
							padding: 0.55rem;
						}

						.map-canvas-shell {
							position: relative;
							border: 1px solid var(--border);
							border-radius: 2px;
							overflow: hidden;
						}

						.map-hud-bottom-left {
							position: absolute;
							left: 0.6rem;
							bottom: 0.6rem;
							z-index: 4;
						}

						.map-stats-bar {
							border-radius: 2px;
							padding: 0.45rem 0.78rem;
							font-size: 0.75rem;
							display: inline-flex;
							align-items: center;
							gap: 0.6rem;
							flex-wrap: wrap;
							background: rgba(18, 18, 18, 0.95);
						}

						.map-mobile-toggle {
							position: absolute;
							z-index: 5;
							left: 0.75rem;
							bottom: 0.85rem;
							border: 1px solid var(--border);
							border-radius: 2px;
							background: rgba(18, 18, 18, 0.94);
							color: var(--text-primary);
							min-height: 40px;
							padding: 0.4rem 0.72rem;
							display: inline-flex;
							align-items: center;
							gap: 0.4rem;
						}

						.map-mobile-sidebar {
							position: fixed;
							left: 0;
							right: 0;
							bottom: 0;
							z-index: 47;
							border-radius: 2px 2px 0 0;
							border-top: 1px solid var(--border);
							border-left: none;
							border-right: none;
							border-bottom: none;
							max-height: 84vh;
							min-height: 66vh;
							display: grid;
							grid-template-rows: auto minmax(0, 1fr);
						}

						@media (max-width: 960px) {
							.map-layout-shell {
								grid-template-columns: minmax(0, 1fr);
								padding-inline: 0;
								gap: 0;
								height: calc(100vh - 4.25rem);
							}

							.map-sidebar-desktop {
								display: none;
							}

							.map-canvas-shell {
								border-radius: 0;
								border-left: none;
								border-right: none;
							}

							.map-hud-bottom-left {
								left: 0.7rem;
								bottom: 3.9rem;
							}

							.map-stats-bar {
								max-width: calc(100vw - 1.4rem);
							}
						}
					`}
				</style>
			</section>
		</PageWrapper>
	)
}

export default MapPage
