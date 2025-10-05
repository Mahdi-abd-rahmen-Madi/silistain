import logger from '../utils/logger';

const API_BASE_URL = '/api/tn-municipalities';

interface Municipality {
  id: string;
  name: string;
  nameEn: string;
  delegation: string;
  governorate: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

export interface ReverseGeocodeResult {
  governorate: string;
  delegation: string;
  city: string;
  postalCode: string;
  address: string;
  latitude: number;
  longitude: number;
}

/**
 * Reverse geocodes coordinates to get location details using the Tunisian municipality API
 * @param lat - Latitude
 * @param lng - Longitude
 * @param radius - Search radius in kilometers (default: 5km)
 * @returns Promise with location details
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  radius: number = 5
): Promise<ReverseGeocodeResult> {
  try {
    logger.debug(`Fetching municipalities near lat: ${lat}, lng: ${lng}, radius: ${radius}km`);
    
    const response = await fetch(
      `${API_BASE_URL}/municipalities?lat=${lat}&lng=${lng}&radius=${radius * 1000}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('API Error Response:', errorText);
      throw new Error(`Failed to fetch location data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    logger.debug('API Response:', data);
    
    if (!Array.isArray(data) || data.length === 0) {
      if (radius < 20) { // Try with a larger radius if no results
        logger.debug(`No municipalities found within ${radius}km, trying with larger radius...`);
        return reverseGeocode(lat, lng, radius + 5);
      }
      throw new Error('No municipalities found near the specified location');
    }

    // Find the closest municipality
    const closest = data.reduce((prev, curr) => {
      const prevDist = Math.sqrt(
        Math.pow(prev.latitude - lat, 2) + 
        Math.pow(prev.longitude - lng, 2)
      );
      const currDist = Math.sqrt(
        Math.pow(curr.latitude - lat, 2) + 
        Math.pow(curr.longitude - lng, 2)
      );
      return currDist < prevDist ? curr : prev;
    }, data[0]);

    if (!closest) {
      throw new Error('Failed to determine closest municipality');
    }
    
    const result = {
      governorate: closest.governorate || '',
      delegation: closest.delegation || '',
      city: closest.name || '',
      postalCode: closest.postalCode || '',
      address: [closest.name, closest.delegation, closest.governorate]
        .filter(Boolean)
        .join(', '),
      latitude: closest.latitude,
      longitude: closest.longitude
    };

    logger.debug('Reverse geocode result:', result);
    return result;
    
  } catch (error) {
    logger.error('Error in reverseGeocode:', error);
    throw new Error(`Failed to reverse geocode coordinates: ${error instanceof Error ? error.message : String(error)}`);
  }
}
