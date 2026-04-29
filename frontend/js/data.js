/* data.js — All static data: hospitals, dispensaries, doctors, rooms */

const H_DATA = [
  { id:0, type:'hospital',    name:'AIIMS Rishikesh',               lat:30.0869, lng:78.2676, cap:200, pts:120, icu:40, icuOcc:20, docs:30, aDocs:18, rating:4.8 },
  { id:1, type:'hospital',    name:'Doon Hospital, Dehradun',        lat:30.3165, lng:78.0322, cap:150, pts:90,  icu:25, icuOcc:10, docs:20, aDocs:12, rating:4.2 },
  { id:2, type:'hospital',    name:'Max Hospital, Dehradun',         lat:30.3253, lng:78.0421, cap:100, pts:60,  icu:20, icuOcc:8,  docs:15, aDocs:9,  rating:4.5 },
  { id:3, type:'hospital',    name:'Shri Mahant Hospital',           lat:30.3398, lng:77.9950, cap:80,  pts:70,  icu:10, icuOcc:9,  docs:10, aDocs:3,  rating:3.9 },
  { id:4, type:'hospital',    name:'Synergy Hospital',               lat:30.2936, lng:78.0613, cap:60,  pts:20,  icu:12, icuOcc:4,  docs:12, aDocs:8,  rating:4.3 },
  { id:5, type:'hospital',    name:'Himalayan Hospital, Jolly Grant',lat:30.2800, lng:78.0900, cap:120, pts:80,  icu:30, icuOcc:15, docs:22, aDocs:14, rating:4.6 },
  { id:6, type:'hospital',    name:'Base Hospital, Haldwani',        lat:29.2183, lng:79.5130, cap:180, pts:100, icu:35, icuOcc:18, docs:28, aDocs:16, rating:4.4 },
  { id:7, type:'hospital',    name:'District Hospital, Haridwar',    lat:29.9457, lng:78.1642, cap:100, pts:55,  icu:18, icuOcc:7,  docs:16, aDocs:10, rating:4.0 },
  { id:8, type:'dispensary',  name:'City Dispensary, Dehradun',      lat:30.3190, lng:78.0310, cap:40,  pts:12,  icu:0,  icuOcc:0,  docs:4,  aDocs:3,  rating:4.1 },
  { id:9, type:'dispensary',  name:'Rajpur Road Dispensary',         lat:30.3410, lng:78.0760, cap:30,  pts:8,   icu:0,  icuOcc:0,  docs:3,  aDocs:2,  rating:3.9 },
];

const DOCTORS = {
  hospital: [
    { name:'Dr. Anil Sharma',   spec:'General Medicine',   fee:500  },
    { name:'Dr. Priya Mehra',   spec:'Emergency Medicine', fee:700  },
    { name:'Dr. Rakesh Gupta',  spec:'Surgery',            fee:900  },
    { name:'Dr. Sunita Rawat',  spec:'Orthopedics',        fee:800  },
    { name:'Dr. Vikas Thakur',  spec:'Cardiology',         fee:1200 },
  ],
  dispensary: [
    { name:'Dr. Kavita Joshi',  spec:'General Physician',  fee:200  },
    { name:'Dr. Mohan Bisht',   spec:'General Medicine',   fee:150  },
  ],
};

const ROOMS = [
  { icon:'🛏', name:'General Ward',  pricePerDay:500,  avail:12 },
  { icon:'🏠', name:'Semi-Private',  pricePerDay:1200, avail:6  },
  { icon:'🌟', name:'Private Room',  pricePerDay:2500, avail:3  },
  { icon:'🚨', name:'ICU',           pricePerDay:5000, avail:4  },
  { icon:'💎', name:'Deluxe Suite',  pricePerDay:4000, avail:2  },
];

const DISP_ROOMS = [
  { icon:'🛏', name:'Waiting Room',    pricePerDay:0,   avail:10 },
  { icon:'🏠', name:'Observation Bed', pricePerDay:300, avail:4  },
];

const SEV_LABELS = ['', 'Low', 'Medium', 'High', 'Critical'];

const MINOR_CONDITIONS = ['cut', 'minor burn', 'fever', 'pain'];

/* severity calc — mirrored from C++ so frontend shows badge instantly */
function calcSeverity(age, cond, uncon, bleeding) {
  let score = 0;
  if (age < 5 || age > 70)       score += 2;
  else if (age < 15 || age > 55) score += 1;

  const c = cond.toLowerCase();
  if (c.includes('cardiac') || c.includes('stroke'))                           score += 3;
  else if (c.includes('fracture') || c.includes('burn') || c.includes('accident')) score += 2;
  else if (c.includes('fever') || c.includes('pain') || c.includes('cut'))    score += 1;

  if (uncon)    score += 2;
  if (bleeding) score += 1;

  if (score >= 6) return 4;
  if (score >= 4) return 3;
  if (score >= 2) return 2;
  return 1;
}

function needsDispensary(sev, cond) {
  return sev === 1 && MINOR_CONDITIONS.some(d => cond.toLowerCase().includes(d));
}
