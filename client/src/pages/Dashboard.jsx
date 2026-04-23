import { AnimatePresence, motion } from 'framer-motion'
import {
	Bookmark,
	ImagePlus,
	MapPinned,
	Settings,
	Shield,
	Star,
	Trash2,
	UserRound,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'

import { Navbar, PageWrapper } from '../components/layout'
import StationCard from '../components/station/StationCard'
import { Avatar, Badge, Button, Input, Spinner } from '../components/ui'
import useAuth from '../hooks/useAuth'
import api from '../services/api'
import { useStationStore } from '../store/stationStore'

const reviewTagOptions = ['Fast', 'Clean', 'Safe', 'Good Lighting', 'Reliable', 'Accessible']

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

const toTagList = (value) => {
	if (!value) {
		return []
	}

	if (Array.isArray(value)) {
		return value
	}

	return String(value)
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean)
}

const getPaginationFromResponse = (responseData) =>
	responseData?.data?.pagination || responseData?.pagination || null

function Dashboard() {
	const navigate = useNavigate()
	const fileInputRef = useRef(null)

	const { user, updateProfile } = useAuth()
	const unsaveStation = useStationStore((state) => state.unsaveStation)
	const setSavedStationIds = useStationStore((state) => state.setSavedStations)

	const [activeTab, setActiveTab] = useState('saved')
	const [savedStations, setSavedStations] = useState([])
	const [reviews, setReviews] = useState([])
	const [isSavedLoading, setIsSavedLoading] = useState(true)
	const [isReviewsLoading, setIsReviewsLoading] = useState(true)
	const [isSavingProfile, setIsSavingProfile] = useState(false)
	const [savedError, setSavedError] = useState('')
	const [reviewsError, setReviewsError] = useState('')
	const [reviewsPage, setReviewsPage] = useState(1)
	const [hasMoreReviews, setHasMoreReviews] = useState(false)
	const [editingReviewId, setEditingReviewId] = useState(null)
	const [reviewDraft, setReviewDraft] = useState({
		rating: 5,
		comment: '',
		tags: [],
	})
	const [avatarFile, setAvatarFile] = useState(null)
	const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '')
	const [profileForm, setProfileForm] = useState({
		username: user?.username || '',
		email: user?.email || '',
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	})

	const loadSavedStations = useCallback(async () => {
		setIsSavedLoading(true)
		setSavedError('')

		try {
			const { data } = await api.get('/users/saved-stations')
			const stations = data?.data?.stations || []

			setSavedStations(stations)
			setSavedStationIds(stations.map((station) => String(station?._id)).filter(Boolean))
		} catch (error) {
			setSavedError(
				error?.response?.data?.message || error?.message || 'Unable to load saved stations.',
			)
		} finally {
			setIsSavedLoading(false)
		}
	}, [setSavedStationIds])

	const loadReviews = useCallback(async ({ page = 1, append = false } = {}) => {
		setIsReviewsLoading(true)
		setReviewsError('')

		try {
			const { data } = await api.get('/users/me/reviews', {
				params: {
					page,
					limit: 8,
				},
			})

			const nextReviews = data?.data?.reviews || []
			const pagination = getPaginationFromResponse(data)
			const totalPages = Number(pagination?.pages) || 1

			setReviewsPage(page)
			setHasMoreReviews(page < totalPages)

			if (append) {
				setReviews((current) => [...current, ...nextReviews])
			} else {
				setReviews(nextReviews)
			}
		} catch (error) {
			setReviewsError(error?.response?.data?.message || error?.message || 'Unable to load reviews.')
		} finally {
			setIsReviewsLoading(false)
		}
	}, [])

	useEffect(() => {
		const timer = window.setTimeout(() => {
			void loadSavedStations()
			void loadReviews()
		}, 0)

		return () => {
			window.clearTimeout(timer)
		}
	}, [loadSavedStations, loadReviews])

	const memberSince = formatDate(user?.createdAt)

	const selectedAvatarSource = avatarPreview || user?.avatar || ''

	const currentTabLabel = useMemo(() => {
		if (activeTab === 'saved') {
			return 'Saved Stations'
		}

		if (activeTab === 'reviews') {
			return 'My Reviews'
		}

		return 'Profile Settings'
	}, [activeTab])

	const handleRemoveSavedStation = async (stationId) => {
		try {
			await unsaveStation(stationId)
			setSavedStations((current) =>
				current.filter((station) => String(station?._id) !== String(stationId)),
			)
			toast.success('Removed from favourites')
		} catch (error) {
			toast.error(
				error?.response?.data?.message || error?.message || 'Unable to remove saved station.',
			)
		}
	}

	const startEditReview = (review) => {
		setEditingReviewId(review?._id || null)
		setReviewDraft({
			rating: Number(review?.rating) || 5,
			comment: review?.comment || '',
			tags: toTagList(review?.tags),
		})
	}

	const handleUpdateReview = async (reviewId) => {
		if (!reviewDraft.comment.trim() || reviewDraft.comment.trim().length < 10) {
			toast.error('Review comment must include at least 10 characters.')
			return
		}

		try {
			const { data } = await api.put(`/reviews/${reviewId}`, {
				rating: Number(reviewDraft.rating),
				comment: reviewDraft.comment.trim(),
				tags: reviewDraft.tags,
			})

			const updatedReview = data?.data?.review
			if (updatedReview) {
				setReviews((current) =>
					current.map((review) =>
						String(review?._id) === String(reviewId) ? updatedReview : review,
					),
				)
			}

			setEditingReviewId(null)
			toast.success('Review updated.')
		} catch (error) {
			toast.error(error?.response?.data?.message || error?.message || 'Unable to update review.')
		}
	}

	const handleDeleteReview = async (reviewId) => {
		const confirmed = window.confirm('Delete this review? This action cannot be undone.')
		if (!confirmed) {
			return
		}

		try {
			await api.delete(`/reviews/${reviewId}`)
			setReviews((current) => current.filter((review) => String(review?._id) !== String(reviewId)))
			toast.success('Review deleted.')
		} catch (error) {
			toast.error(error?.response?.data?.message || error?.message || 'Unable to delete review.')
		}
	}

	const handleAvatarSelection = (event) => {
		const file = event.target.files?.[0]
		if (!file) {
			return
		}

		setAvatarFile(file)
		setAvatarPreview(URL.createObjectURL(file))
	}

	const handleProfileFieldChange = (key, value) => {
		setProfileForm((current) => ({
			...current,
			[key]: value,
		}))
	}

	const handleSaveProfile = async (event) => {
		event.preventDefault()

		const payload = new FormData()
		let hasAnyField = false

		if (profileForm.username.trim() && profileForm.username.trim() !== user?.username) {
			payload.append('username', profileForm.username.trim())
			hasAnyField = true
		}

		if (profileForm.email.trim() && profileForm.email.trim() !== user?.email) {
			payload.append('email', profileForm.email.trim())
			hasAnyField = true
		}

		const wantsPasswordUpdate =
			profileForm.currentPassword || profileForm.newPassword || profileForm.confirmPassword

		if (wantsPasswordUpdate) {
			payload.append('currentPassword', profileForm.currentPassword)
			payload.append('newPassword', profileForm.newPassword)
			payload.append('confirmPassword', profileForm.confirmPassword)
			hasAnyField = true
		}

		if (avatarFile) {
			payload.append('avatar', avatarFile)
			hasAnyField = true
		}

		if (!hasAnyField) {
			toast('No profile changes to save.')
			return
		}

		setIsSavingProfile(true)

		try {
			const updatedUser = await updateProfile(payload)

			setProfileForm((current) => ({
				...current,
				username: updatedUser?.username || current.username,
				email: updatedUser?.email || current.email,
				currentPassword: '',
				newPassword: '',
				confirmPassword: '',
			}))

			setAvatarFile(null)
			setAvatarPreview(updatedUser?.avatar || avatarPreview)
			toast.success('Profile updated successfully.')
		} catch (error) {
			toast.error(error?.response?.data?.message || error?.message || 'Unable to update profile.')
		} finally {
			setIsSavingProfile(false)
		}
	}

	return (
		<PageWrapper title="Dashboard" className="hero-gradient">
			<Navbar />

			<section
				className="container-shell"
				style={{
					minHeight: '100vh',
					paddingTop: '5rem',
					paddingBottom: '2rem',
					display: 'grid',
					gridTemplateColumns: '290px minmax(0, 1fr)',
					gap: '1rem',
				}}
			>
				<aside
					className="glass-card"
					style={{
						borderRadius: '16px',
						padding: '1rem',
						height: 'fit-content',
						position: 'sticky',
						top: '5rem',
						display: 'grid',
						gap: '0.9rem',
					}}
				>
					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						onChange={handleAvatarSelection}
						style={{ display: 'none' }}
					/>

					<div style={{ display: 'grid', justifyItems: 'center', gap: '0.55rem' }}>
						<div style={{ position: 'relative' }}>
							<Avatar size="lg" src={selectedAvatarSource} name={user?.username || user?.email} />
							<button
								type="button"
								className="focus-ring"
								onClick={() => fileInputRef.current?.click()}
								aria-label="Upload avatar"
								style={{
									position: 'absolute',
									right: -4,
									bottom: -4,
									width: 30,
									height: 30,
									borderRadius: '999px',
									border: '1px solid rgba(255, 255, 255, 0.5)',
									background: 'rgba(7, 15, 24, 0.92)',
									color: 'var(--accent-primary)',
									display: 'grid',
									placeItems: 'center',
								}}
							>
								<ImagePlus size={14} />
							</button>
						</div>

						<div style={{ textAlign: 'center' }}>
							<h2 style={{ fontSize: '1.2rem' }}>{user?.username || 'ElectroMap User'}</h2>
							<p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>{user?.email}</p>
							<small style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
								Member since {memberSince}
							</small>
						</div>
					</div>

					<nav style={{ display: 'grid', gap: '0.45rem' }}>
						{[
							{ id: 'saved', icon: Bookmark, label: 'Saved Stations' },
							{ id: 'reviews', icon: Star, label: 'My Reviews' },
							{ id: 'settings', icon: UserRound, label: 'Profile Settings' },
						].map((item) => {
							const Icon = item.icon
							const active = activeTab === item.id

							return (
								<button
									key={item.id}
									type="button"
									className="focus-ring"
									onClick={() => setActiveTab(item.id)}
									style={{
										border: active
											? '1px solid rgba(255, 255, 255, 0.45)'
											: '1px solid transparent',
										background: active
											? 'rgba(255, 255, 255, 0.12)'
											: 'transparent',
										color: active
											? 'var(--text-primary)'
											: 'var(--text-secondary)',
										width: '100%',
										borderRadius: '10px',
										minHeight: 40,
										display: 'inline-flex',
										alignItems: 'center',
										gap: '0.45rem',
										padding: '0.35rem 0.55rem',
										textAlign: 'left',
									}}
								>
									<Icon size={16} />
									<span>{item.label}</span>
								</button>
							)
						})}

						{user?.role === 'admin' ? (
							<Link to="/admin" className="focus-ring" style={{ textDecoration: 'none' }}>
								<button
									type="button"
									style={{
										border: '1px solid rgba(255, 255, 255, 0.35)',
										background: 'rgba(255, 255, 255, 0.08)',
										color: 'var(--text-primary)',
										width: '100%',
										borderRadius: '10px',
										minHeight: 40,
										display: 'inline-flex',
										alignItems: 'center',
										gap: '0.45rem',
										padding: '0.35rem 0.55rem',
										textAlign: 'left',
									}}
								>
									<Shield size={16} />
									<span>Admin Panel</span>
								</button>
							</Link>
						) : null}
					</nav>
				</aside>

				<div className="glass-card" style={{ borderRadius: '16px', padding: '1rem', minHeight: 560 }}>
					<header
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							gap: '0.8rem',
							marginBottom: '0.9rem',
							flexWrap: 'wrap',
						}}
					>
						<div>
							<h1 style={{ fontSize: '1.45rem' }}>{currentTabLabel}</h1>
							<p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
								Manage your stations, reviews, and account preferences.
							</p>
						</div>

						{activeTab === 'reviews' && hasMoreReviews ? (
							<Button
								variant="secondary"
								onClick={() => loadReviews({ page: reviewsPage + 1, append: true })}
							>
								Load More Reviews
							</Button>
						) : null}
					</header>

					{activeTab === 'saved' ? (
						<div>
							{isSavedLoading ? (
								<div style={{ minHeight: 260, display: 'grid', placeItems: 'center' }}>
									<Spinner />
								</div>
							) : null}

							{!isSavedLoading && savedError ? (
								<div
									className="glass-card"
									style={{ borderRadius: '12px', padding: '0.8rem', color: 'var(--accent-red)' }}
								>
									{savedError}
								</div>
							) : null}

							{!isSavedLoading && !savedError && !savedStations.length ? (
								<div
									className="glass-card"
									style={{
										borderRadius: '14px',
										padding: '1rem',
										textAlign: 'center',
										color: 'var(--text-secondary)',
									}}
								>
									<p>No saved stations yet.</p>
									<Link to="/map" className="focus-ring" style={{ color: 'var(--accent-primary)' }}>
										Explore the map
									</Link>
								</div>
							) : null}

							{!isSavedLoading && !savedError && savedStations.length ? (
								<motion.div
									layout
									style={{
										display: 'grid',
										gap: '0.75rem',
										gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
									}}
								>
									<AnimatePresence>
										{savedStations.map((station) => (
											<motion.article
												key={station?._id}
												layout
												initial={{ opacity: 0, y: 14 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: -14 }}
												transition={{ duration: 0.2 }}
												style={{ display: 'grid', gap: '0.55rem', alignContent: 'start' }}
											>
												<StationCard
													station={station}
													variant="full"
													onClick={() => navigate(`/station/${station?._id}`)}
												/>

												<div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
													<Button
														size="sm"
														leftIcon={<MapPinned size={14} />}
														onClick={() => navigate(`/map?stationId=${station?._id}`)}
													>
														View on Map
													</Button>
													<Button
														size="sm"
														variant="danger"
														leftIcon={<Trash2 size={14} />}
														onClick={() => handleRemoveSavedStation(station?._id)}
													>
														Remove
													</Button>
												</div>
											</motion.article>
										))}
									</AnimatePresence>
								</motion.div>
							) : null}
						</div>
					) : null}

					{activeTab === 'reviews' ? (
						<div style={{ display: 'grid', gap: '0.7rem' }}>
							{isReviewsLoading && !reviews.length ? (
								<div style={{ minHeight: 240, display: 'grid', placeItems: 'center' }}>
									<Spinner />
								</div>
							) : null}

							{!isReviewsLoading && reviewsError ? (
								<div
									className="glass-card"
									style={{ borderRadius: '12px', padding: '0.8rem', color: 'var(--accent-red)' }}
								>
									{reviewsError}
								</div>
							) : null}

							{!isReviewsLoading && !reviewsError && !reviews.length ? (
								<div
									className="glass-card"
									style={{
										borderRadius: '14px',
										padding: '1rem',
										textAlign: 'center',
										color: 'var(--text-secondary)',
									}}
								>
									No reviews yet. Review a station to see it here.
								</div>
							) : null}

							{reviews.map((review) => {
								const station = review?.stationId
								const isEditing = editingReviewId && String(editingReviewId) === String(review?._id)

								return (
									<article
										key={review?._id}
										className="glass-card"
										style={{ borderRadius: '12px', padding: '0.8rem', display: 'grid', gap: '0.55rem' }}
									>
										<div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
											<div>
												<strong>{station?.stationName || 'Station review'}</strong>
												<p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
													{station?.city || '--'}, {station?.state || '--'}
												</p>
											</div>
											<span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
												{formatDate(review?.createdAt)}
											</span>
										</div>

										{!isEditing ? (
											<>
												<div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
													<Star size={14} color="var(--accent-amber)" fill="var(--accent-amber)" />
													<span className="mono-data">{Number(review?.rating || 0).toFixed(1)}</span>
												</div>

												<p style={{ color: 'var(--text-secondary)' }}>{review?.comment}</p>

												{toTagList(review?.tags).length ? (
													<div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
														{toTagList(review?.tags).map((tag) => (
															<Badge key={`${review?._id}-${tag}`} value={tag} size="sm">
																{tag}
															</Badge>
														))}
													</div>
												) : null}

												<div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
													<Button size="sm" variant="secondary" onClick={() => startEditReview(review)}>
														Edit
													</Button>
													<Button
														size="sm"
														variant="danger"
														leftIcon={<Trash2 size={14} />}
														onClick={() => handleDeleteReview(review?._id)}
													>
														Delete
													</Button>
												</div>
											</>
										) : (
											<div style={{ display: 'grid', gap: '0.65rem' }}>
												<label style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
													Rating
													<select
														className="focus-ring"
														value={reviewDraft.rating}
														onChange={(event) =>
															setReviewDraft((current) => ({
																...current,
																rating: Number(event.target.value),
															}))
														}
														style={{
															marginTop: '0.35rem',
															width: '100%',
															minHeight: 40,
															borderRadius: '10px',
															border: '1px solid rgba(255, 255, 255, 0.28)',
															background: 'rgba(10, 22, 40, 0.72)',
															paddingInline: '0.6rem',
														}}
													>
														{[1, 2, 3, 4, 5].map((value) => (
															<option key={value} value={value}>
																{value}
															</option>
														))}
													</select>
												</label>

												<label style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
													Comment
													<textarea
														className="focus-ring"
														value={reviewDraft.comment}
														onChange={(event) =>
															setReviewDraft((current) => ({
																...current,
																comment: event.target.value,
															}))
														}
														rows={4}
														style={{
															marginTop: '0.35rem',
															width: '100%',
															borderRadius: '10px',
															border: '1px solid rgba(255, 255, 255, 0.28)',
															background: 'rgba(10, 22, 40, 0.72)',
															padding: '0.55rem',
															resize: 'vertical',
														}}
													/>
												</label>

												<div>
													<p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginBottom: '0.35rem' }}>
														Tags
													</p>
													<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
														{reviewTagOptions.map((tag) => {
															const active = reviewDraft.tags.includes(tag)

															return (
																<button
																	key={`${review?._id}-${tag}`}
																	type="button"
																	className="focus-ring"
																	onClick={() =>
																		setReviewDraft((current) => ({
																			...current,
																			tags: active
																				? current.tags.filter((item) => item !== tag)
																				: [...current.tags, tag],
																		}))
																	}
																	style={{
																		borderRadius: '999px',
																		border: active
																			? '1px solid rgba(255, 255, 255, 0.6)'
																			: '1px solid rgba(255, 255, 255, 0.22)',
																		background: active
																			? 'rgba(255, 255, 255, 0.14)'
																			: 'rgba(10, 22, 40, 0.75)',
																		color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
																		fontSize: '0.78rem',
																		padding: '0.22rem 0.56rem',
																	}}
																>
																	{tag}
																</button>
															)
														})}
													</div>
												</div>

												<div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
													<Button size="sm" onClick={() => handleUpdateReview(review?._id)}>
														Save Changes
													</Button>
													<Button size="sm" variant="ghost" onClick={() => setEditingReviewId(null)}>
														Cancel
													</Button>
												</div>
											</div>
										)}
									</article>
								)
							})}
						</div>
					) : null}

					{activeTab === 'settings' ? (
						<form onSubmit={handleSaveProfile} style={{ display: 'grid', gap: '0.78rem', maxWidth: 760 }}>
							<Input
								label="Username"
								value={profileForm.username}
								onChange={(event) => handleProfileFieldChange('username', event.target.value)}
							/>

							<Input
								label="Email"
								type="email"
								value={profileForm.email}
								onChange={(event) => handleProfileFieldChange('email', event.target.value)}
							/>

							<div
								className="glass-card"
								style={{
									borderRadius: '12px',
									borderColor: 'rgba(255, 255, 255, 0.25)',
									padding: '0.75rem',
									display: 'grid',
									gap: '0.65rem',
								}}
							>
								<div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
									<Settings size={16} />
									<strong style={{ fontSize: '0.95rem' }}>Change Password</strong>
								</div>

								<Input
									label="Current Password"
									type="password"
									value={profileForm.currentPassword}
									onChange={(event) =>
										handleProfileFieldChange('currentPassword', event.target.value)
									}
									autoComplete="current-password"
								/>

								<Input
									label="New Password"
									type="password"
									value={profileForm.newPassword}
									onChange={(event) => handleProfileFieldChange('newPassword', event.target.value)}
									autoComplete="new-password"
								/>

								<Input
									label="Confirm New Password"
									type="password"
									value={profileForm.confirmPassword}
									onChange={(event) =>
										handleProfileFieldChange('confirmPassword', event.target.value)
									}
									autoComplete="new-password"
								/>
							</div>

							<Button type="submit" isLoading={isSavingProfile}>
								Save Profile
							</Button>
						</form>
					) : null}
				</div>
			</section>

			<style>
				{`
					@media (max-width: 1020px) {
						.container-shell {
							width: min(100%, calc(100% - 1.4rem));
							grid-template-columns: minmax(0, 1fr) !important;
						}
					}
				`}
			</style>
		</PageWrapper>
	)
}

export default Dashboard
