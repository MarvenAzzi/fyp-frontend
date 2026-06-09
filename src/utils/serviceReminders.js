// Fixed colour thresholds (same for every car)
const RED_KM    = 1000;  // ≤ 1000 km  → red
const YELLOW_KM = 2000;  // ≤ 2000 km  → yellow
//                         > 2000 km  → blue

// Zone assignments scale with mileage.
// More red/yellow as the car gets older / higher mileage.
//
// < 50 000 km   : 1 red,  0 yellow  (nearly new – oil only flagged)
// 50 000-100 000: 1 red,  2 yellow
// 100 000-150 000: 2 red, 3 yellow
// 150 000+       : 3 red, 5 yellow
function getZoneMap(mileage) {
  if (mileage >= 150000) {
    return {
      oil:           'red',
      tyre_rotation: 'red',
      air_filter:    'yellow',
      spark_plugs:   'red',
      brake_fluid:   'yellow',
      brake_pads:    'yellow',
      coolant:       'yellow',
      transmission:  'blue',
      glow_plugs:    'yellow',
      timing_belt:   'yellow',
      battery:       'red',
    };
  }
  if (mileage >= 100000) {
    return {
      oil:           'red',
      tyre_rotation: 'yellow',
      air_filter:    'yellow',
      spark_plugs:   'red',
      brake_fluid:   'yellow',
      brake_pads:    'blue',
      coolant:       'blue',
      transmission:  'blue',
      glow_plugs:    'blue',
      timing_belt:   'blue',
      battery:       'yellow',
    };
  }
  if (mileage >= 50000) {
    return {
      oil:           'red',
      tyre_rotation: 'yellow',
      air_filter:    'blue',
      spark_plugs:   'yellow',
      brake_fluid:   'blue',
      brake_pads:    'blue',
      coolant:       'blue',
      transmission:  'blue',
      glow_plugs:    'blue',
      timing_belt:   'blue',
      battery:       'blue',
    };
  }
  // < 50 000 km
  return {
    oil:           'red',
    tyre_rotation: 'blue',
    air_filter:    'blue',
    spark_plugs:   'blue',
    brake_fluid:   'blue',
    brake_pads:    'blue',
    coolant:       'blue',
    transmission:  'blue',
    glow_plugs:    'blue',
    timing_belt:   'blue',
    battery:       'blue',
  };
}

// Deterministic number in [0, 1) for a given vehicle + service combination.
function vehicleFraction(vehicleKey, serviceId) {
  const str = String(vehicleKey) + serviceId;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return ((h >>> 0) % 10000) / 10000;
}

// Pick a km-left value inside the assigned colour zone.
// The vehicleId fraction varies the exact number so different cars differ.
function kmLeftForZone(zone, fraction) {
  switch (zone) {
    case 'red':    return Math.round(100  + fraction * 900);   // 100 – 999
    case 'yellow': return Math.round(1000 + fraction * 1000);  // 1000 – 1999
    default:       return Math.round(2001 + fraction * 12999); // 2001 – 15000
  }
}

const SERVICES = [
  {
    id: 'oil',
    name: 'Oil & Filter Change',
    icon: 'oil',
    fuelTypes: null,
    tip: 'Regular oil changes protect your engine from wear and overheating.',
  },
  {
    id: 'tyre_rotation',
    name: 'Tyre Rotation',
    icon: 'tire',
    fuelTypes: null,
    tip: 'Rotating tyres ensures even wear and extends tyre life significantly.',
  },
  {
    id: 'air_filter',
    name: 'Air Filter Replacement',
    icon: 'air-filter',
    fuelTypes: null,
    tip: 'A clean air filter improves fuel economy and engine performance.',
  },
  {
    id: 'spark_plugs',
    name: 'Spark Plug Replacement',
    icon: 'lightning-bolt',
    fuelTypes: ['petrol'],
    tip: 'Worn spark plugs cause misfires, poor fuel economy, and hard starts.',
  },
  {
    id: 'brake_fluid',
    name: 'Brake Fluid Change',
    icon: 'car-brake-alert',
    fuelTypes: null,
    tip: 'Brake fluid absorbs moisture over time, reducing braking effectiveness.',
  },
  {
    id: 'brake_pads',
    name: 'Brake Pad Inspection',
    icon: 'car-brake-parking',
    fuelTypes: null,
    tip: 'Worn brake pads increase stopping distance and are a safety risk.',
  },
  {
    id: 'coolant',
    name: 'Coolant Flush',
    icon: 'thermometer',
    fuelTypes: null,
    tip: 'Fresh coolant prevents corrosion and maintains correct engine temperature.',
  },
  {
    id: 'transmission',
    name: 'Transmission Fluid',
    icon: 'cog',
    fuelTypes: null,
    tip: 'Clean transmission fluid ensures smooth gear changes and prevents slipping.',
  },
  {
    id: 'glow_plugs',
    name: 'Glow Plug Inspection',
    icon: 'fire',
    fuelTypes: ['diesel'],
    tip: 'Faulty glow plugs cause hard cold starts and increased emissions.',
  },
  {
    id: 'timing_belt',
    name: 'Timing Belt Check',
    icon: 'engine',
    fuelTypes: null,
    tip: 'A snapped timing belt causes catastrophic engine damage. Never ignore this.',
  },
  {
    id: 'battery',
    name: 'Battery Check',
    icon: 'car-battery',
    fuelTypes: null,
    tip: 'Car batteries typically last 3–5 years. A weak battery causes no-start situations.',
  },
];

function detectFuelType(engineType) {
  return /tdi|diesel|cdi|dci/i.test(engineType || '') ? 'diesel' : 'petrol';
}

export function calculateReminders(mileage, engineType, vehicleKey) {
  if (!mileage || mileage <= 0) return [];

  const fuel    = detectFuelType(engineType);
  const key     = vehicleKey ?? 1;
  const zoneMap = getZoneMap(mileage);
  const results = [];

  for (const service of SERVICES) {
    if (service.fuelTypes && !service.fuelTypes.includes(fuel)) continue;

    const zone   = zoneMap[service.id] ?? 'blue';
    const frac   = vehicleFraction(key, service.id);
    const kmLeft = kmLeftForZone(zone, frac);
    const nextAt = mileage + kmLeft;

    results.push({
      ...service,
      nextAt,
      kmLeft,
      status: zone === 'red' ? 'urgent' : zone === 'yellow' ? 'soon' : 'scheduled',
    });
  }

  // Sort: urgent → soon → scheduled; within same status sort by kmLeft asc
  const ORDER = { urgent: 0, soon: 1, scheduled: 2 };
  results.sort((a, b) =>
    ORDER[a.status] !== ORDER[b.status]
      ? ORDER[a.status] - ORDER[b.status]
      : a.kmLeft - b.kmLeft
  );

  return results;
}

export function getBadgeCount(reminders) {
  return reminders.filter(r => r.status === 'urgent' || r.status === 'soon').length;
}
