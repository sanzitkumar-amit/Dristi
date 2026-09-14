// Utility for parsing coordinates, calculating Haversine distance, and geocoding across Indian Project Sites

export const REGION_CENTROIDS = {
  'Uttar Pradesh': { lat: 26.8467, lng: 80.9462, name: 'Uttar Pradesh (Lucknow / Kanpur / Varanasi)' },
  'Delhi NCR': { lat: 28.6139, lng: 77.2090, name: 'Delhi NCR (National Capital)' },
  'Maharashtra': { lat: 18.9389, lng: 72.8358, name: 'Maharashtra (Mumbai / Pune)' },
  'Gujarat': { lat: 22.3072, lng: 73.1812, name: 'Gujarat (Vadodara / Ahmedabad)' },
  'Karnataka': { lat: 12.9716, lng: 77.5946, name: 'Karnataka (Bengaluru)' },
  'Tamil Nadu': { lat: 13.0827, lng: 80.2707, name: 'Tamil Nadu (Chennai)' },
  'Madhya Pradesh': { lat: 23.2599, lng: 77.4126, name: 'Madhya Pradesh (Bhopal / Rewa)' },
  'Rajasthan': { lat: 26.9124, lng: 75.7873, name: 'Rajasthan (Jaipur / Jodhpur)' },
  'Bihar': { lat: 25.5941, lng: 85.1376, name: 'Bihar (Patna / Gaya)' },
  'West Bengal': { lat: 22.5726, lng: 88.3639, name: 'West Bengal (Kolkata)' },
  'Jharkhand': { lat: 23.3441, lng: 85.3096, name: 'Jharkhand (Ranchi / Jamshedpur)' },
  'Telangana': { lat: 17.3850, lng: 78.4867, name: 'Telangana (Hyderabad)' },
  'Andhra Pradesh': { lat: 16.5062, lng: 80.6480, name: 'Andhra Pradesh (Amaravati / Vizag)' },
  'Assam': { lat: 26.1445, lng: 91.7362, name: 'Assam & Northeast (Guwahati)' },
  'Odisha': { lat: 20.2961, lng: 85.8245, name: 'Odisha (Bhubaneswar)' },
  'Punjab': { lat: 30.9010, lng: 75.8573, name: 'Punjab (Ludhiana / Amritsar)' },
  'Haryana': { lat: 28.4595, lng: 77.0266, name: 'Haryana (Gurugram / Faridabad)' },
  'Kerala': { lat: 9.9312, lng: 76.2673, name: 'Kerala (Kochi / Thiruvananthapuram)' },
  'Uttarakhand': { lat: 30.3165, lng: 78.0322, name: 'Uttarakhand (Dehradun / Haridwar)' },
  'Himachal Pradesh': { lat: 31.1048, lng: 77.1734, name: 'Himachal Pradesh (Shimla)' },
  'Chhattisgarh': { lat: 21.2514, lng: 81.6296, name: 'Chhattisgarh (Raipur)' },
  'Jammu & Kashmir': { lat: 34.0837, lng: 74.7973, name: 'Jammu & Kashmir (Srinagar / Jammu)' },
  'Goa': { lat: 15.2993, lng: 74.1240, name: 'Goa (Panaji)' }
};

export const POPULAR_CITIES = [
  // Uttar Pradesh
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lng: 80.3319 },
  { name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739 },
  { name: 'Prayagraj (Allahabad)', state: 'Uttar Pradesh', lat: 25.4358, lng: 81.8463 },
  { name: 'Noida / Greater Noida', state: 'Uttar Pradesh', lat: 28.5355, lng: 77.3910 },
  { name: 'Ghaziabad', state: 'Uttar Pradesh', lat: 28.6692, lng: 77.4538 },
  { name: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lng: 78.0081 },
  { name: 'Meerut', state: 'Uttar Pradesh', lat: 28.9845, lng: 77.7064 },
  { name: 'Gorakhpur', state: 'Uttar Pradesh', lat: 26.7606, lng: 83.3732 },
  { name: 'Bareilly', state: 'Uttar Pradesh', lat: 28.3670, lng: 79.4304 },
  { name: 'Aligarh', state: 'Uttar Pradesh', lat: 27.8974, lng: 78.0880 },
  { name: 'Moradabad', state: 'Uttar Pradesh', lat: 28.8386, lng: 78.7733 },
  { name: 'Jhansi', state: 'Uttar Pradesh', lat: 25.4484, lng: 78.5685 },
  { name: 'Ayodhya', state: 'Uttar Pradesh', lat: 26.7922, lng: 82.1998 },
  { name: 'Mathura', state: 'Uttar Pradesh', lat: 27.4924, lng: 77.6737 },
  { name: 'Saharanpur', state: 'Uttar Pradesh', lat: 29.9671, lng: 77.5510 },
  { name: 'Muzaffarnagar', state: 'Uttar Pradesh', lat: 29.4727, lng: 77.7085 },
  { name: 'Firozabad', state: 'Uttar Pradesh', lat: 27.1591, lng: 78.3957 },

  // Delhi NCR & Haryana
  { name: 'Delhi / NCR', state: 'Delhi NCR', lat: 28.6139, lng: 77.2090 },
  { name: 'Gurugram', state: 'Haryana', lat: 28.4595, lng: 77.0266 },
  { name: 'Faridabad', state: 'Haryana', lat: 28.4089, lng: 77.3178 },

  // Maharashtra
  { name: 'Mumbai', state: 'Maharashtra', lat: 18.9389, lng: 72.8358 },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
  { name: 'Nashik', state: 'Maharashtra', lat: 19.9975, lng: 73.7898 },
  { name: 'Thane / Navi Mumbai', state: 'Maharashtra', lat: 19.2183, lng: 72.9781 },

  // Karnataka & South
  { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Mysuru', state: 'Karnataka', lat: 12.2958, lng: 76.6394 },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558 },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185 },
  { name: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.5062, lng: 80.6480 },
  { name: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673 },
  { name: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lng: 76.9366 },

  // Gujarat
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { name: 'Vadodara', state: 'Gujarat', lat: 22.3072, lng: 73.1812 },
  { name: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311 },
  { name: 'Rajkot', state: 'Gujarat', lat: 22.3039, lng: 70.8022 },

  // Rajasthan
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { name: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lng: 73.0243 },
  { name: 'Kota', state: 'Rajasthan', lat: 25.2138, lng: 75.8648 },
  { name: 'Udaipur', state: 'Rajasthan', lat: 24.5854, lng: 73.7125 },

  // Madhya Pradesh
  { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  { name: 'Gwalior', state: 'Madhya Pradesh', lat: 26.2183, lng: 78.1828 },
  { name: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.1815, lng: 79.9864 },
  { name: 'Rewa', state: 'Madhya Pradesh', lat: 24.5332, lng: 81.2955 },

  // Bihar & Jharkhand & East
  { name: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376 },
  { name: 'Gaya', state: 'Bihar', lat: 24.7914, lng: 85.0002 },
  { name: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lng: 85.3096 },
  { name: 'Jamshedpur', state: 'Jharkhand', lat: 22.8046, lng: 86.2029 },
  { name: 'Dhanbad', state: 'Jharkhand', lat: 23.7957, lng: 86.4304 },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { name: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lng: 85.8245 },
  { name: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362 },

  // North & Hills
  { name: 'Chandigarh', state: 'Punjab', lat: 30.7333, lng: 76.7794 },
  { name: 'Amritsar', state: 'Punjab', lat: 31.6340, lng: 74.8723 },
  { name: 'Ludhiana', state: 'Punjab', lat: 30.9010, lng: 75.8573 },
  { name: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lng: 78.0322 },
  { name: 'Haridwar', state: 'Uttarakhand', lat: 29.9457, lng: 78.1642 },
  { name: 'Shimla', state: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734 },
  { name: 'Srinagar', state: 'Jammu & Kashmir', lat: 34.0837, lng: 74.7973 },
  { name: 'Jammu', state: 'Jammu & Kashmir', lat: 32.7266, lng: 74.8570 },
  { name: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lng: 81.6296 },
  { name: 'Panaji', state: 'Goa', lat: 15.4909, lng: 73.8278 }
];

/**
 * Parses GPS coordinates string (e.g., "22.3072° N, 73.1812° E" or "18.9389, 72.8358")
 */
export function parseCoordinates(coordStr) {
  if (!coordStr) return null;
  if (typeof coordStr === 'object' && coordStr.lat != null && coordStr.lng != null) {
    return { lat: Number(coordStr.lat), lng: Number(coordStr.lng) };
  }
  if (typeof coordStr !== 'string') return null;

  try {
    const cleanStr = coordStr.replace(/[°NSEWnsew]/g, '').trim();
    const parts = cleanStr.split(/[,;\s/]+/).map(p => parseFloat(p)).filter(n => !isNaN(n));
    if (parts.length >= 2) {
      const lat = parts[0];
      const lng = parts[1];
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Calculates Great-Circle distance (in kilometers) between two coordinates via Haversine formula
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);
  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) return null;

  const R = 6371; // Radius of Earth in KM
  const dLat = ((numLat2 - numLat1) * Math.PI) / 180;
  const dLon = ((numLon2 - numLon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((numLat1 * Math.PI) / 180) *
      Math.cos((numLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Finds the nearest known Indian city / region hub to the given coordinates
 */
export function findNearestHub(lat, lng) {
  if (lat == null || lng == null) return null;
  let closest = null;
  let minDistance = Infinity;

  for (const city of POPULAR_CITIES) {
    const dist = calculateDistanceKm(lat, lng, city.lat, city.lng);
    if (dist != null && dist < minDistance) {
      minDistance = dist;
      closest = { ...city, distanceKm: dist };
    }
  }

  return closest;
}

/**
 * Attempts reverse geocoding via public client API with fast local fallback
 */
export async function reverseGeocodeLive(lat, lng) {
  if (lat == null || lng == null) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      const locality = data.locality || data.city || data.principalSubdivision || '';
      const state = data.principalSubdivision || data.countryName || '';
      if (locality || state) {
        return {
          city: locality,
          state: state,
          label: locality ? `${locality}, ${state}` : state
        };
      }
    }
  } catch {
    // network / timeout error - fallback to local database
  }

  const hub = findNearestHub(lat, lng);
  if (hub) {
    return {
      city: hub.name,
      state: hub.state,
      label: hub.distanceKm <= 35 ? `${hub.name}, ${hub.state}` : `Near ${hub.name}, ${hub.state}`
    };
  }

  return null;
}

/**
 * Derives coordinates for a project using its mybharat_coordinates, location, state, or district
 */
export function getProjectCoordinates(project) {
  if (!project) return null;

  if (project.mybharat_coordinates) {
    const parsed = parseCoordinates(project.mybharat_coordinates);
    if (parsed) return parsed;
  }
  
  // Try city lookup
  const loc = (project.location || '').toLowerCase();
  const state = (project.mybharat_state || '').toLowerCase();
  const dist = (project.mybharat_district || '').toLowerCase();
  const name = (project.name || '').toLowerCase();

  for (const city of POPULAR_CITIES) {
    const cName = city.name.toLowerCase().split('/')[0].trim();
    if (loc.includes(cName) || dist.includes(cName) || name.includes(cName)) {
      return { lat: city.lat, lng: city.lng };
    }
  }

  // Try state matching
  for (const [regionName, coords] of Object.entries(REGION_CENTROIDS)) {
    const regLower = regionName.toLowerCase();
    if (state.includes(regLower) || loc.includes(regLower) || dist.includes(regLower) || name.includes(regLower)) {
      return { lat: coords.lat, lng: coords.lng };
    }
  }

  return null;
}
