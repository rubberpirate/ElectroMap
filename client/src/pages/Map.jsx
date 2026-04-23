import { AnimatePresence, motion } from 'framer-motion'
import { Layers3, ListFilter, MapPin, Route, X, Zap } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'

import { Navbar, PageWrapper } from '../components/layout'
import MapSidebar from '../components/map/MapSidebar'
import MapView from '../components/map/MapView'
import StationDrawer from '../components/station/StationDrawer'
import { Button } from '../components/ui'
import useAuth from '../hooks/useAuth'
import useGeolocation from '../hooks/useGeolocation'
import useSocket from '../hooks/useSocket'
import useStations from '../hooks/useStations'
import api from '../services/api'
import { useMapStore } from '../store/mapStore'
import { useStationStore } from '../store/stationStore'
import { getMapboxToken } from '../utils/mapbox'

const INDIA_CENTER = [78.9629, 20.5937]

const haversineDistanceKm = (from, to) => {
	const fromLat = Number(from?.lat)
	const fromLng = Number(from?.lng)
	const toLat = Number(to?.lat)
	const toLng = Number(to?.lng)

	if ([fromLat, fromLng, toLat, toLng].some((value) => !Number.isFinite(value))) {
		return 0
	}

	const earthRadiusKm = 6371
	const toRadians = (value) => (value * Math.PI) / 180

	const dLat = toRadians(toLat - fromLat)
	const dLng = toRadians(toLng - fromLng)

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRadians(fromLat)) *
			Math.cos(toRadians(toLat)) *
			Math.sin(dLng / 2) *
			Math.sin(dLng / 2)

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
	return earthRadiusKm * c
}

const getPointAlongLine = (coordinates, targetDistanceKm) => {
	if (!Array.isArray(coordinates) || coordinates.length < 2 || targetDistanceKm <= 0) {
		return null
	}

	let traveledKm = 0

	for (let index = 0; index < coordinates.length - 1; index += 1) {
		const [fromLng, fromLat] = coordinates[index]
		const [toLng, toLat] = coordinates[index + 1]

		const segmentDistance = haversineDistanceKm(
			{ lat: fromLat, lng: fromLng },
			{ lat: toLat, lng: toLng },
		)

		if (traveledKm + segmentDistance >= targetDistanceKm && segmentDistance > 0) {
			const ratio = (targetDistanceKm - traveledKm) / segmentDistance
			const lng = fromLng + (toLng - fromLng) * ratio
			const lat = fromLat + (toLat - fromLat) * ratio
			return [lng, lat]
		}

		traveledKm += segmentDistance
	}

	return coordinates[coordinates.length - 1] || null
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
		lat: INDIA_CENTER[1],
		lng: INDIA_CENTER[0],
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
	const setZoom = useMapStore((state) => state.setZoom)
	const setVisibleStations = useMapStore((state) => state.setVisibleStations)
	const setStations = useMapStore((state) => state.setStations)

	const { socket, isConnected } = useSocket()
	const { requestLocation, error: locationError } = useGeolocation()
	const { user, isAuthenticated } = useAuth()
	const savedStationsFromStore = useStationStore((state) => state.savedStations)
	const stationIdFromQuery = searchParams.get('stationId')

	const [viewportQuery, setViewportQuery] = useState(() =>
		getInitialViewport(userLocation, mapCenter),
	)
	const [mapStyle, setMapStyle] = useState('dark')
	const [routeGeoJSON, setRouteGeoJSON] = useState(null)
	const [routeSummary, setRouteSummary] = useState(null)
	const [routePlannerSummary, setRoutePlannerSummary] = useState(null)
	const [routePlannerStops, setRoutePlannerStops] = useState([])
	const [isRouting, setIsRouting] = useState(false)
	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
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

	const mapboxToken = getMapboxToken()
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
		setRoutePlannerSummary(null)
		setRoutePlannerStops([])
	}, [])

	const handleNavigate = useCallback(
		async (station) => {
			const destination = getStationCoordinates(station)

			if (!destination) {
				toast.error('Station location is unavailable for navigation.')
				return false
			}

			if (!mapboxToken || !userLocation) {
				return false
			}

			setIsRouting(true)

			try {
				const origin = `${userLocation.lng},${userLocation.lat}`
				const target = `${destination[0]},${destination[1]}`

				const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin};${target}`

				const params = new URLSearchParams({
					alternatives: 'false',
					geometries: 'geojson',
					overview: 'full',
					steps: 'true',
					access_token: mapboxToken,
				})

				const response = await fetch(`${url}?${params.toString()}`)

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
				setRoutePlannerSummary(null)
				setRoutePlannerStops([])

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
		[clearRoute, mapboxToken, userLocation],
	)

	const handlePlanRoute = useCallback(
		async ({ start, end, batteryRangeKm }) => {
			if (!mapboxToken) {
				throw new Error('Mapbox token is missing.')
			}

			const [startLng, startLat] = start?.coordinates || []
			const [endLng, endLat] = end?.coordinates || []

			if (
				![startLng, startLat, endLng, endLat, batteryRangeKm].every((value) =>
					Number.isFinite(Number(value)),
				)
			) {
				throw new Error('Invalid route planner inputs.')
			}

			setIsRouting(true)

			try {
				const endpoint = `https://api.mapbox.com/directions/v5/mapbox/driving/${startLng},${startLat};${endLng},${endLat}`
				const params = new URLSearchParams({
					alternatives: 'false',
					geometries: 'geojson',
					overview: 'full',
					steps: 'true',
					access_token: mapboxToken,
				})

				const response = await fetch(`${endpoint}?${params.toString()}`)
				if (!response.ok) {
					throw new Error('Directions API request failed.')
				}

				const payload = await response.json()
				const bestRoute = payload?.routes?.[0]

				if (!bestRoute?.geometry?.coordinates?.length) {
					throw new Error('No route available for this journey.')
				}

				const distanceKm = (Number(bestRoute.distance) || 0) / 1000
				const durationMin = (Number(bestRoute.duration) || 0) / 60
				const requiredStops = Math.max(
					0,
					Math.ceil(distanceKm / Number(batteryRangeKm)) - 1,
				)

				const checkpointTargets = []
				for (let index = 1; index <= requiredStops; index += 1) {
					const targetDistance = (distanceKm / (requiredStops + 1)) * index
					const point = getPointAlongLine(bestRoute.geometry.coordinates, targetDistance)

					if (point) {
						checkpointTargets.push({
							order: index,
							coordinates: point,
						})
					}
				}

				const usedStationIds = new Set()
				const plannedStops = []

				for (const checkpoint of checkpointTargets) {
					const [lng, lat] = checkpoint.coordinates

					try {
						const { data } = await api.get('/stations/nearby', {
							params: {
								lat,
								lng,
								radius: 5000,
								page: 1,
								limit: 6,
							},
						})

						const nearby = data?.data?.stations || []
						const nearestStation = nearby.find(
							(item) => item?._id && !usedStationIds.has(String(item._id)),
						)

						if (nearestStation?._id) {
							usedStationIds.add(String(nearestStation._id))
							plannedStops.push({
								id: `station-stop-${nearestStation._id}-${checkpoint.order}`,
								order: checkpoint.order,
								kind: 'station',
								stationId: String(nearestStation._id),
								stationName: nearestStation.stationName || `Stop ${checkpoint.order}`,
								coordinates:
									getStationCoordinates(nearestStation) || checkpoint.coordinates,
								station: nearestStation,
							})
							continue
						}
					} catch {
						// Keep fallback checkpoint marker when nearby lookup fails.
					}

					plannedStops.push({
						id: `checkpoint-${checkpoint.order}`,
						order: checkpoint.order,
						kind: 'checkpoint',
						stationName: `Charging checkpoint ${checkpoint.order}`,
						coordinates: checkpoint.coordinates,
					})
				}

				setRouteGeoJSON({
					type: 'Feature',
					properties: {
						routeType: 'planner',
					},
					geometry: bestRoute.geometry,
				})

				setRoutePlannerStops(plannedStops)
				setRoutePlannerSummary({
					title: `${start?.placeName || 'Start'} → ${end?.placeName || 'Destination'}`,
					distanceKm,
					durationMin,
					requiredStops,
					estimatedChargingMin: requiredStops * 35,
					foundStations: plannedStops.filter((stop) => stop.kind === 'station').length,
				})
				setRouteSummary({
					stationName: `${start?.placeName || 'Start'} → ${end?.placeName || 'Destination'}`,
					distanceKm,
					durationMin,
					stepsCount: bestRoute?.legs?.[0]?.steps?.length || 0,
				})

				toast.success('Route planner ready.')
			} catch (requestError) {
				clearRoute()
				const message =
					requestError?.message || 'Unable to calculate route plan.'
				toast.error(message)
				throw requestError
			} finally {
				setIsRouting(false)
			}
		},
		[clearRoute, mapboxToken],
	)

	const handleViewportSettled = useCallback(
		({ lat, lng, radiusKm, zoom }) => {
			if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
				return
			}

			setMapCenter([lng, lat])
			setZoom(Number(zoom) || 5)

			setViewportQuery((current) => ({
				...current,
				lat,
				lng,
				radiusKm: Number.isFinite(radiusKm) ? radiusKm : current.radiusKm,
			}))
		},
		[setMapCenter, setZoom],
	)

	const handleVisibleStationsChange = useCallback(
		(nextStations) => {
			setVisibleStations(nextStations)
		},
		[setVisibleStations],
	)

	const handleUserLocationChange = useCallback(
		(nextLocation) => {
			setUserLocation(nextLocation)
		},
		[setUserLocation],
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
				try {
					const { data } = await api.get(`/stations/${station._id}`)
					nextStation = data?.data?.station || station
				} catch {
					nextStation = station
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
				try {
					const { data } = await api.get(`/stations/${stationIdFromQuery}`)
					selected = data?.data?.station || null
				} catch {
					selected = null
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
							routePlannerSummary={routePlannerSummary}
							hasActiveRoute={Boolean(routeGeoJSON)}
							isRoutePlanning={isRouting}
							mapboxToken={mapboxToken}
							onPlanRoute={handlePlanRoute}
							onClearRoute={clearRoute}
						/>
					</aside>

					<div className="map-canvas-shell">
						<MapView
							stations={stations}
							selectedStation={selectedStation}
							highlightedStationId={highlightedStationId}
							userLocation={userLocation}
							mapStyle={mapStyle}
							routeGeoJSON={routeGeoJSON}
							routePlannerStops={routePlannerStops}
							onStationSelect={handleStationSelect}
							onStationHover={handleStationHover}
							onViewportSettled={handleViewportSettled}
							onVisibleStationsChange={handleVisibleStationsChange}
							onUserLocationChange={handleUserLocationChange}
						/>

						<div className="map-hud-top-right">
							<Button
								variant="secondary"
								size="sm"
								leftIcon={<Layers3 size={15} />}
								onClick={() =>
									setMapStyle((current) =>
										current === 'dark' ? 'satellite' : 'dark',
									)
								}
								aria-label="Toggle map style"
							>
								{mapStyle === 'dark' ? 'Satellite' : 'Dark'}
							</Button>
						</div>

						<div className="map-hud-bottom-left">
							<div className="glass-card map-stats-bar">
								<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
									<MapPin size={14} />
									{visibleMetrics.stationCount} stations in view
								</span>
								<span style={{ color: 'rgba(122, 157, 181, 0.52)' }}>|</span>
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
										borderRadius: '12px',
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
												borderRadius: '8px',
												border: '1px solid var(--border)',
												background: 'rgba(10, 22, 40, 0.75)',
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
									Stations & Filters
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
									background: 'rgba(5, 10, 14, 0.48)',
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
									<strong>Stations and Filters</strong>
									<button
										type="button"
										className="focus-ring"
										onClick={() => setIsMobileSidebarOpen(false)}
										aria-label="Close stations drawer"
										style={{
											width: 34,
											height: 34,
											borderRadius: '10px',
											border: '1px solid var(--border)',
											background: 'rgba(10, 22, 40, 0.72)',
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
										routePlannerSummary={routePlannerSummary}
										hasActiveRoute={Boolean(routeGeoJSON)}
										isRoutePlanning={isRouting}
										mapboxToken={mapboxToken}
										onPlanRoute={handlePlanRoute}
										onClearRoute={clearRoute}
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
						borderRadius: '10px',
						padding: '0.48rem 0.62rem',
						display: 'inline-flex',
						gap: '0.45rem',
						alignItems: 'center',
						color: isConnected ? 'var(--accent-green)' : 'var(--text-secondary)',
					}}
				>
					<span className="pulse-dot" style={{ width: 8, height: 8 }} />
					<small>{isConnected ? 'Live updates connected' : 'Reconnecting live updates...'}</small>
				</div>

				{locationError ? (
					<div
						className="glass-card"
						style={{
							position: 'fixed',
							left: '1rem',
							top: '5.4rem',
							zIndex: 38,
							borderRadius: '10px',
							padding: '0.5rem 0.65rem',
							color: 'var(--accent-amber)',
							maxWidth: 320,
							fontSize: '0.82rem',
						}}
					>
						{locationError}
					</div>
				) : null}

				{isRouting ? (
					<div
						className="glass-card"
						style={{
							position: 'fixed',
							top: '5.4rem',
							right: '1rem',
							zIndex: 38,
							borderRadius: '10px',
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
							grid-template-columns: 380px minmax(0, 1fr);
							gap: 0.8rem;
							padding-inline: 0.8rem;
						}

						.map-sidebar-desktop {
							min-width: 0;
							overflow: hidden;
							padding: 0.8rem;
						}

						.map-canvas-shell {
							position: relative;
							border: 1px solid var(--border);
							border-radius: 16px;
							overflow: hidden;
						}

						.map-hud-top-right {
							position: absolute;
							top: 0.8rem;
							right: 3.2rem;
							z-index: 4;
						}

						.map-hud-bottom-left {
							position: absolute;
							left: 0.8rem;
							bottom: 0.8rem;
							z-index: 4;
						}

						.map-stats-bar {
							border-radius: 999px;
							padding: 0.45rem 0.78rem;
							font-size: 0.83rem;
							display: inline-flex;
							align-items: center;
							gap: 0.6rem;
							flex-wrap: wrap;
						}

						.map-mobile-toggle {
							position: absolute;
							z-index: 5;
							left: 0.75rem;
							bottom: 0.85rem;
							border: 1px solid rgba(0, 212, 255, 0.3);
							border-radius: 999px;
							background: rgba(7, 14, 24, 0.9);
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
							border-radius: 16px 16px 0 0;
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

							.map-hud-top-right {
								right: 0.7rem;
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
