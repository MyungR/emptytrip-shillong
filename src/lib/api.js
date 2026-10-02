// Data layer (CP2.3): all Supabase calls live here so pages never touch the client directly.
// Maps database columns (from_location / to_location) back to the frontend shape (from / to)
// and derives fromCoords / toCoords from locationCoords in src/data/trips.js.
// Every function throws an Error if Supabase returns one; callers should try/catch.
import { supabase } from './supabase'
import { getDriverKey, getPassengerKey } from './identity'
import { locationCoords } from '../data/trips'

function unwrap({ data, error }) {
  if (error) throw new Error(error.message)
  return data
}

// DB row -> frontend trip object (same field names as src/data/trips.js).
function toTrip(row) {
  return {
    id: row.id,
    driver: row.driver,
    phone: row.phone,
    from: row.from_location,
    to: row.to_location,
    date: row.date,
    departure: row.departure,
    seats: row.seats,
    vehicle: row.vehicle,
    fare: row.fare,
    notes: row.notes,
    rating: row.rating === null || row.rating === undefined ? undefined : Number(row.rating),
    pickup: row.pickup,
    fromCoords: locationCoords[row.from_location],
    toCoords: locationCoords[row.to_location],
    driverKey: row.driver_key,
    createdAt: row.created_at,
  }
}

// DB row -> frontend request object.
function toRequest(row) {
  return {
    id: row.id,
    tripId: row.trip_id,
    passengerName: row.passenger_name,
    passengerPhone: row.passenger_phone,
    seatsRequested: row.seats_requested,
    status: row.status,
    createdAt: row.created_at,
  }
}

// All trips, oldest first (seed trips 1-10 keep their original order).
export async function listTrips() {
  const rows = unwrap(await supabase.from('trips').select('*').order('id', { ascending: true }))
  return rows.map(toTrip)
}

// Trips listed from this browser (matching its driver key), newest first.
// Same trip shape as listTrips(). Used for "Your Listed Trips".
export async function listMyTrips() {
  const rows = unwrap(
    await supabase
      .from('trips')
      .select('*')
      .eq('driver_key', getDriverKey())
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
  )
  return rows.map(toTrip)
}

// Insert a trip from the ListTrip form shape:
// { driver, phone, from, to, date, departure, seats, vehicle, fare, notes }
// The browser's driver key is attached automatically. Returns the saved trip.
export async function createTrip(form) {
  const row = {
    driver: form.driver,
    phone: form.phone,
    from_location: form.from,
    to_location: form.to,
    date: form.date || null,
    departure: form.departure,
    seats: Number(form.seats),
    vehicle: form.vehicle,
    fare: Number(form.fare),
    notes: form.notes || null,
    driver_key: getDriverKey(),
  }
  return toTrip(unwrap(await supabase.from('trips').insert(row).select().single()))
}

// Insert a ride request for a trip. The browser's passenger key is attached automatically.
// Returns the saved request.
export async function createRequest({ tripId, passengerName, passengerPhone, seatsRequested = 1 }) {
  const row = {
    trip_id: tripId,
    passenger_name: passengerName,
    passenger_phone: passengerPhone,
    seats_requested: Number(seatsRequested),
    passenger_key: getPassengerKey(),
  }
  return toRequest(unwrap(await supabase.from('ride_requests').insert(row).select().single()))
}

// Requests made from this browser (passenger key), newest first.
// Each request includes its trip as `trip` (same trip shape as listTrips()). Used by Home "Your Requests".
export async function listMyRequests() {
  const rows = unwrap(
    await supabase
      .from('ride_requests')
      .select('*, trips!inner(*)')
      .eq('passenger_key', getPassengerKey())
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
  )
  return rows.map((row) => ({ ...toRequest(row), trip: toTrip(row.trips) }))
}

// Requests for trips listed from this browser (driver key), newest first.
// Each request includes its trip as `trip`.
export async function listRequestsForDriver() {
  const rows = unwrap(
    await supabase
      .from('ride_requests')
      .select('*, trips!inner(*)')
      .eq('trips.driver_key', getDriverKey())
      .order('created_at', { ascending: false })
  )
  return rows.map((row) => ({ ...toRequest(row), trip: toTrip(row.trips) }))
}

// Set a ride request's status to 'accepted' or 'declined'. Used by the driver inbox.
// The update only matches a request that is still 'pending' AND belongs to one of the trips listed
// from this browser (trips.driver_key = this browser's driver key). Returns the updated request with its
// trip as `trip`. Throws if nothing matched (not found, not yours, or already answered).
// NOTE: the driver key is a client-supplied value, not authentication, so this scoping is not a server-side
// security guarantee. It also needs UPDATE permission on ride_requests; the CP1 schema grants only select and insert.
export async function updateRequestStatus(requestId, status) {
  if (status !== 'accepted' && status !== 'declined') {
    throw new Error("Status must be 'accepted' or 'declined'")
  }
  const myTrips = unwrap(await supabase.from('trips').select('id').eq('driver_key', getDriverKey()))
  const tripIds = myTrips.map((trip) => trip.id)
  if (tripIds.length === 0) throw new Error('Request not found, not yours, or already answered')
  const rows = unwrap(
    await supabase
      .from('ride_requests')
      .update({ status })
      .eq('id', requestId)
      .eq('status', 'pending')
      .in('trip_id', tripIds)
      .select('*, trips(*)')
  )
  if (!rows || rows.length === 0) throw new Error('Request not found, not yours, or already answered')
  return { ...toRequest(rows[0]), trip: toTrip(rows[0].trips) }
}

// Seats already taken by ACCEPTED requests, summed per trip: { [tripId]: seats }.
// Pending and declined requests take no seats. Used by Find Ride for seats left.
export async function listAcceptedSeats() {
  const rows = unwrap(
    await supabase.from('ride_requests').select('trip_id, seats_requested').eq('status', 'accepted')
  )
  const seatsByTrip = {}
  for (const row of rows) {
    seatsByTrip[row.trip_id] = (seatsByTrip[row.trip_id] || 0) + row.seats_requested
  }
  return seatsByTrip
}
