// Car Database utility to map CarOrdinal IDs to human-readable names.
// Supports loading cached database from localStorage and updating from GitHub.

type CarMap = Record<string, string>;

// Popular fallback cars in case the database hasn't been downloaded/loaded yet
const fallbackCars: CarMap = {
  "249": "1962 Ferrari 250 GTO",
  "251": "1954 Mercedes-Benz 300 SL Coupe",
  "292": "2003 Porsche Carrera GT",
  "348": "2005 Ford GT",
  "411": "2005 Honda NSX-R",
  "445": "2002 Nissan Skyline GT-R V-Spec II",
  "461": "1998 Toyota Supra RZ",
  "1260": "2010 Lexus LFA",
  "1314": "1993 McLaren F1",
  "2034": "2013 Ferrari LaFerrari",
  "2164": "2014 Lamborghini Huracán LP 610-4",
};

let carDatabase: CarMap = { ...fallbackCars };

// Load the database from localStorage if it exists
export const initCarDb = (): number => {
  try {
    const cached = localStorage.getItem('forza_cars_db');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object') {
        carDatabase = { ...fallbackCars, ...parsed };
      }
    }
  } catch (e) {
    console.error('Failed to parse cached car database:', e);
  }
  return Object.keys(carDatabase).length;
};

// Retrieve car name by ordinal ID
export const getCarName = (ordinal: number): string | null => {
  if (ordinal === 0) return null;
  const key = String(ordinal);
  return carDatabase[key] || null;
};

// Get current loaded count
export const getCarCount = (): number => {
  return Object.keys(carDatabase).length;
};

// Fetch latest database from repository and save to localStorage
export const updateCarDb = async (): Promise<number> => {
  const url = 'https://raw.githubusercontent.com/1Stalk/Forza-Horizon-Discord-Rich-Presence/main/src-tauri/cars.json';
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download database: HTTP ${response.status}`);
  }
  
  const fetchedCars = await response.json();
  if (fetchedCars && typeof fetchedCars === 'object') {
    // Validate that it looks like a record of string -> string
    const validatedCars: CarMap = {};
    for (const [key, value] of Object.entries(fetchedCars)) {
      if (typeof value === 'string') {
        validatedCars[key] = value;
      }
    }
    
    // Save to localStorage
    localStorage.setItem('forza_cars_db', JSON.stringify(validatedCars));
    
    // Merge into memory
    carDatabase = { ...fallbackCars, ...validatedCars };
    return Object.keys(carDatabase).length;
  } else {
    throw new Error('Downloaded database is not in the correct JSON format');
  }
};
