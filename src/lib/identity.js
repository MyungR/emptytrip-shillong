// Anonymous per-browser identity (CP2.2).
// A random key is generated once per browser and kept in localStorage so a driver can
// find their own trips (trips.driver_key) and a passenger can find their own requests
// (ride_requests.passenger_key). This is NOT authentication and is not a secret.

const DRIVER_KEY = 'emptyTripDriverKey'
const PASSENGER_KEY = 'emptyTripPassengerKey'

function randomId(prefix) {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`
  return `${prefix}_${uuid}`
}

// Keep one key per browser. If localStorage is unavailable (private mode, blocked),
// fall back to a key that lasts for the current page session only.
const memory = {}

function getOrCreate(storageKey, prefix) {
  try {
    const existing = localStorage.getItem(storageKey)
    if (existing) return existing
    const created = randomId(prefix)
    localStorage.setItem(storageKey, created)
    return created
  } catch {
    if (!memory[storageKey]) memory[storageKey] = randomId(prefix)
    return memory[storageKey]
  }
}

export function getDriverKey() {
  return getOrCreate(DRIVER_KEY, 'drv')
}

export function getPassengerKey() {
  return getOrCreate(PASSENGER_KEY, 'pax')
}
