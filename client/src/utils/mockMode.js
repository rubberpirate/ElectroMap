export const isMockModeEnabled = () => import.meta.env.VITE_USE_MOCK_DATA === 'true'

export const isMockStationId = (value) =>
  String(value || '').trim().toLowerCase().startsWith('mock-')
