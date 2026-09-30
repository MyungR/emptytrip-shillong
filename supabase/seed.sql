-- =============================================================================
-- EmptyTrip Shillong - seed data (CP1)
--
-- Run AFTER supabase/schema.sql, in the Supabase SQL Editor.
--
-- Inserts the 10 seed trips from src/data/trips.js with their ORIGINAL ids (1-10),
-- so requests can reference them by foreign key. Values are copied field-for-field:
--   from -> from_location, to -> to_location, everything else keeps its name.
-- Not stored: fromCoords/toCoords (derived in the frontend from locationCoords).
-- date, notes and driver_key are NULL for seed trips.
--
-- Safe to re-run: existing ids are skipped (ON CONFLICT DO NOTHING), and the identity
-- counter is moved past the seed ids so new trips get id 11 or higher.
--
-- NOTE: trip 1 carries the same phone number that already exists in src/data/trips.js.
-- Replace it here if it is a real person's number and you do not want it in the database.
-- =============================================================================

insert into public.trips
  (id, driver, phone, from_location, to_location, departure, seats, vehicle, fare, rating, pickup)
overriding system value
values
  (1, 'Bah Rishang', '+91 8974947544', 'Sohra', 'Shillong', '4:30 PM', 3, 'Maruti Alto', 250, 4.8, 'Sohra Market'),
  (2, 'Bah Pyndap', '+91 98765 43211', 'Mawlynnong', 'Shillong', '5:00 PM', 2, 'Wagon R', 300, 4.6, 'Mawlynnong Gate'),
  (3, 'Bah Lamphrang', '+91 98765 43212', 'Jowai', 'Shillong', '3:00 PM', 4, 'Swift Dzire', 200, 4.9, 'Jowai Bus Stand'),
  (4, 'Bah Banteilang', '+91 98765 43213', 'Nongpoh', 'Shillong', '6:15 PM', 3, 'Alto K10', 150, 4.5, 'Nongpoh Market'),
  (5, 'Bah Kyrshan', '+91 98765 43214', 'Dawki', 'Shillong', '2:00 PM', 5, 'Ertiga', 400, 4.7, 'Dawki Boat Ghat'),
  (6, 'Bah Heibormi', '+91 98765 43215', 'Sohra', 'Shillong', '6:00 PM', 2, 'Wagon R', 280, 4.4, 'Sohra Police Bazar'),
  (7, 'Bah Dondor', '+91 98765 43216', 'Pynursla', 'Shillong', '4:00 PM', 3, 'Maruti 800', 180, 4.6, 'Pynursla Market'),
  (8, 'Bah Skhem', '+91 98765 43217', 'Mairang', 'Shillong', '5:30 PM', 4, 'Swift', 220, 4.8, 'Mairang Main Road'),
  (9, 'Bah Pynshai', '+91 98765 43218', 'Mawlynnong', 'Shillong', '3:30 PM', 6, 'Innova', 350, 4.9, 'Mawlynnong Village'),
  (10, 'Bah Iaineh', '+91 98765 43219', 'Jowai', 'Shillong', '7:00 PM', 3, 'Alto', 210, 4.5, 'Jowai Taxi Stand')
on conflict (id) do nothing;

-- Make sure the next auto-generated trip id is greater than every existing id.
select setval(
  pg_get_serial_sequence('public.trips', 'id'),
  (select max(id) from public.trips)
);
