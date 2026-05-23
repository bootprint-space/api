CREATE TABLE IF NOT EXISTS jupiter (id TEXT PRIMARY KEY, object TEXT NOT NULL, fact TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS mars (id TEXT PRIMARY KEY, object TEXT NOT NULL, fact TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS mercury (id TEXT PRIMARY KEY, object TEXT NOT NULL, fact TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS moon (id TEXT PRIMARY KEY, object TEXT NOT NULL, fact TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS saturn (id TEXT PRIMARY KEY, object TEXT NOT NULL, fact TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sun (id TEXT PRIMARY KEY, object TEXT NOT NULL, fact TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS uranus (id TEXT PRIMARY KEY, object TEXT NOT NULL, fact TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS venus (id TEXT PRIMARY KEY, object TEXT NOT NULL, fact TEXT NOT NULL);

INSERT INTO jupiter VALUES
('a1b2c3d4-0001-0001-0001-000000000001', 'jupiter', 'Jupiter is the largest planet in the solar system.'),
('a1b2c3d4-0001-0001-0001-000000000002', 'jupiter', 'Jupiter has at least 95 known moons.'),
('a1b2c3d4-0001-0001-0001-000000000003', 'jupiter', 'The Great Red Spot on Jupiter is a storm that has lasted over 350 years.'),
('a1b2c3d4-0001-0001-0001-000000000004', 'jupiter', 'Jupiter rotates faster than any other planet, completing a day in about 10 hours.'),
('a1b2c3d4-0001-0001-0001-000000000005', 'jupiter', 'Jupiter is a gas giant with no solid surface.'),
('a1b2c3d4-0001-0001-0001-000000000006', 'jupiter', 'Jupiter has a faint ring system discovered by Voyager 1 in 1979.'),
('a1b2c3d4-0001-0001-0001-000000000007', 'jupiter', 'Jupiter''s magnetic field is 14 times stronger than Earth''s.'),
('a1b2c3d4-0001-0001-0001-000000000008', 'jupiter', 'Jupiter emits more energy than it receives from the Sun.'),
('a1b2c3d4-0001-0001-0001-000000000009', 'jupiter', 'Jupiter is primarily composed of hydrogen and helium.'),
('a1b2c3d4-0001-0001-0001-000000000010', 'jupiter', 'Jupiter''s moon Ganymede is the largest moon in the solar system.');

INSERT INTO mars VALUES
('a1b2c3d4-0002-0002-0002-000000000001', 'mars', 'Mars is home to the tallest mountain in the solar system, Olympus Mons.'),
('a1b2c3d4-0002-0002-0002-000000000002', 'mars', 'Mars has two small moons called Phobos and Deimos.'),
('a1b2c3d4-0002-0002-0002-000000000003', 'mars', 'A day on Mars is 24 hours and 37 minutes.'),
('a1b2c3d4-0002-0002-0002-000000000004', 'mars', 'Mars has the largest dust storms in the solar system.'),
('a1b2c3d4-0002-0002-0002-000000000005', 'mars', 'The atmosphere of Mars is 95% carbon dioxide.'),
('a1b2c3d4-0002-0002-0002-000000000006', 'mars', 'Mars has seasons similar to Earth because of its axial tilt.'),
('a1b2c3d4-0002-0002-0002-000000000007', 'mars', 'Mars is red because of iron oxide, or rust, on its surface.'),
('a1b2c3d4-0002-0002-0002-000000000008', 'mars', 'Mars has been explored by several rovers, including Curiosity and Perseverance.'),
('a1b2c3d4-0002-0002-0002-000000000009', 'mars', 'Mars is the fourth planet from the Sun.'),
('a1b2c3d4-0002-0002-0002-000000000010', 'mars', 'Mars has a thin atmosphere that cannot support liquid water on its surface.');

INSERT INTO mercury VALUES
('a1b2c3d4-0003-0003-0003-000000000001', 'mercury', 'Mercury is the smallest planet in the solar system.'),
('a1b2c3d4-0003-0003-0003-000000000002', 'mercury', 'Mercury has no atmosphere, leaving it covered in craters.'),
('a1b2c3d4-0003-0003-0003-000000000003', 'mercury', 'A year on Mercury is just 88 Earth days.'),
('a1b2c3d4-0003-0003-0003-000000000004', 'mercury', 'Mercury has the most extreme temperature swings of any planet.'),
('a1b2c3d4-0003-0003-0003-000000000005', 'mercury', 'Mercury is the closest planet to the Sun.'),
('a1b2c3d4-0003-0003-0003-000000000006', 'mercury', 'Despite being closest to the Sun, Mercury is not the hottest planet.'),
('a1b2c3d4-0003-0003-0003-000000000007', 'mercury', 'Mercury rotates very slowly, taking 59 Earth days for one rotation.'),
('a1b2c3d4-0003-0003-0003-000000000008', 'mercury', 'Mercury has a large iron core that makes up about 85% of its radius.'),
('a1b2c3d4-0003-0003-0003-000000000009', 'mercury', 'Mercury has water ice in permanently shadowed craters near its poles.'),
('a1b2c3d4-0003-0003-0003-000000000010', 'mercury', 'Mercury has been visited by only two spacecraft: Mariner 10 and MESSENGER.');

INSERT INTO moon VALUES
('a1b2c3d4-0004-0004-0004-000000000001', 'moon', 'The Moon is Earth''s only natural satellite.'),
('a1b2c3d4-0004-0004-0004-000000000002', 'moon', 'The Moon is about 4.5 billion years old.'),
('a1b2c3d4-0004-0004-0004-000000000003', 'moon', 'The Moon''s gravity is about one sixth of Earth''s.'),
('a1b2c3d4-0004-0004-0004-000000000004', 'moon', 'The same side of the Moon always faces Earth.'),
('a1b2c3d4-0004-0004-0004-000000000005', 'moon', 'The Moon has no atmosphere and no weather.'),
('a1b2c3d4-0004-0004-0004-000000000006', 'moon', 'Twelve humans have walked on the Moon, all between 1969 and 1972.'),
('a1b2c3d4-0004-0004-0004-000000000007', 'moon', 'The Moon is slowly moving away from Earth at about 3.8 cm per year.'),
('a1b2c3d4-0004-0004-0004-000000000008', 'moon', 'The Moon stabilises Earth''s axial tilt, which moderates our climate.'),
('a1b2c3d4-0004-0004-0004-000000000009', 'moon', 'The Moon has moonquakes caused by Earth''s gravitational pull.'),
('a1b2c3d4-0004-0004-0004-000000000010', 'moon', 'The Moon''s surface is covered in a layer of powdery dust called regolith.');

INSERT INTO saturn VALUES
('a1b2c3d4-0005-0005-0005-000000000001', 'saturn', 'Saturn is the second largest planet in the solar system.'),
('a1b2c3d4-0005-0005-0005-000000000002', 'saturn', 'Saturn''s rings are made of ice and rock and stretch up to 282,000 km wide.'),
('a1b2c3d4-0005-0005-0005-000000000003', 'saturn', 'Saturn has at least 146 known moons.'),
('a1b2c3d4-0005-0005-0005-000000000004', 'saturn', 'Saturn is the least dense planet and could float on water.'),
('a1b2c3d4-0005-0005-0005-000000000005', 'saturn', 'A day on Saturn lasts only about 10.7 hours.'),
('a1b2c3d4-0005-0005-0005-000000000006', 'saturn', 'Saturn''s moon Titan has a thick atmosphere and liquid methane lakes.'),
('a1b2c3d4-0005-0005-0005-000000000007', 'saturn', 'Saturn has a hexagonal storm at its north pole.'),
('a1b2c3d4-0005-0005-0005-000000000008', 'saturn', 'Saturn is a gas giant with no solid surface.'),
('a1b2c3d4-0005-0005-0005-000000000009', 'saturn', 'Saturn''s rings are thought to be relatively young, possibly only 100 million years old.'),
('a1b2c3d4-0005-0005-0005-000000000010', 'saturn', 'Saturn takes 29.5 Earth years to orbit the Sun.');

INSERT INTO sun VALUES
('a1b2c3d4-0006-0006-0006-000000000001', 'sun', 'The Sun accounts for 99.86% of the mass of the solar system.'),
('a1b2c3d4-0006-0006-0006-000000000002', 'sun', 'The Sun is about 4.6 billion years old.'),
('a1b2c3d4-0006-0006-0006-000000000003', 'sun', 'Light from the Sun takes about 8 minutes to reach Earth.'),
('a1b2c3d4-0006-0006-0006-000000000004', 'sun', 'The Sun''s core temperature reaches 15 million degrees Celsius.'),
('a1b2c3d4-0006-0006-0006-000000000005', 'sun', 'The Sun is a medium-sized star classified as a yellow dwarf.'),
('a1b2c3d4-0006-0006-0006-000000000006', 'sun', 'The Sun completes one rotation every 25 days at its equator.'),
('a1b2c3d4-0006-0006-0006-000000000007', 'sun', 'The Sun will eventually expand into a red giant in about 5 billion years.'),
('a1b2c3d4-0006-0006-0006-000000000008', 'sun', 'The Sun produces energy through nuclear fusion of hydrogen into helium.'),
('a1b2c3d4-0006-0006-0006-000000000009', 'sun', 'The outer atmosphere of the Sun, the corona, reaches millions of degrees.'),
('a1b2c3d4-0006-0006-0006-000000000010', 'sun', 'Solar winds from the Sun create the auroras seen on Earth.');

INSERT INTO uranus VALUES
('a1b2c3d4-0007-0007-0007-000000000001', 'uranus', 'Uranus rotates on its side with an axial tilt of 98 degrees.'),
('a1b2c3d4-0007-0007-0007-000000000002', 'uranus', 'Uranus is the coldest planet in the solar system despite not being the furthest.'),
('a1b2c3d4-0007-0007-0007-000000000003', 'uranus', 'Uranus has 13 known rings.'),
('a1b2c3d4-0007-0007-0007-000000000004', 'uranus', 'Uranus has 28 known moons, all named after Shakespeare characters.'),
('a1b2c3d4-0007-0007-0007-000000000005', 'uranus', 'A year on Uranus lasts 84 Earth years.'),
('a1b2c3d4-0007-0007-0007-000000000006', 'uranus', 'Uranus is an ice giant, composed mostly of water, methane and ammonia ice.'),
('a1b2c3d4-0007-0007-0007-000000000007', 'uranus', 'Uranus appears blue-green due to methane in its atmosphere.'),
('a1b2c3d4-0007-0007-0007-000000000008', 'uranus', 'Uranus was the first planet discovered with a telescope, by William Herschel in 1781.'),
('a1b2c3d4-0007-0007-0007-000000000009', 'uranus', 'Uranus has the second lowest density of any planet after Saturn.'),
('a1b2c3d4-0007-0007-0007-000000000010', 'uranus', 'Winds on Uranus can reach speeds of up to 900 km/h.');

INSERT INTO venus VALUES
('a1b2c3d4-0008-0008-0008-000000000001', 'venus', 'Venus is the hottest planet in the solar system with surface temperatures of 465°C.'),
('a1b2c3d4-0008-0008-0008-000000000002', 'venus', 'Venus rotates in the opposite direction to most planets.'),
('a1b2c3d4-0008-0008-0008-000000000003', 'venus', 'A day on Venus is longer than a year on Venus.'),
('a1b2c3d4-0008-0008-0008-000000000004', 'venus', 'Venus has no moons.'),
('a1b2c3d4-0008-0008-0008-000000000005', 'venus', 'Venus is the brightest natural object in the night sky after the Moon.'),
('a1b2c3d4-0008-0008-0008-000000000006', 'venus', 'Venus has a thick atmosphere of carbon dioxide that causes a runaway greenhouse effect.'),
('a1b2c3d4-0008-0008-0008-000000000007', 'venus', 'Venus is sometimes called Earth''s twin because of its similar size.'),
('a1b2c3d4-0008-0008-0008-000000000008', 'venus', 'The atmospheric pressure on Venus is 90 times greater than on Earth.'),
('a1b2c3d4-0008-0008-0008-000000000009', 'venus', 'Venus has thousands of volcanoes on its surface.'),
('a1b2c3d4-0008-0008-0008-000000000010', 'venus', 'Venus is the closest planet to Earth in terms of size and mass.');