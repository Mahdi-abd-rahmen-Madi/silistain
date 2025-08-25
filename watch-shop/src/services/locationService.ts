import { Municipality } from '../types/order';

const API_BASE_URL = '/api/tn-municipalities';

export const fetchMunicipalities = async (filters?: { name?: string; delegation?: string }): Promise<Municipality[]> => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (filters?.name) params.append('name', filters.name);
    if (filters?.delegation) params.append('delegation', filters.delegation);
    
    console.log('Fetching municipalities from:', `${API_BASE_URL}/municipalities?${params.toString()}`);
    const response = await fetch(`${API_BASE_URL}/municipalities?${params.toString()}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    const responseText = await response.text();
    console.log('Raw response:', responseText.substring(0, 200)); // Log first 200 chars of response
    
    if (!response.ok) {
      console.error('Error response status:', response.status, response.statusText);
      throw new Error(`Failed to fetch municipalities: ${response.status} ${response.statusText}`);
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse JSON response:', e);
      console.error('Response content type:', response.headers.get('content-type'));
      throw new Error('Invalid JSON response from server');
    }
    
    // Transform the API response to match our Municipality type
    const municipalities: Municipality[] = [];
    
    data.forEach((gov: any) => {
      gov.Delegations.forEach((delegation: any) => {
        municipalities.push({
          id: delegation.PostalCode,
          name: delegation.NameAr, // Using Arabic name as the default
          nameEn: delegation.Name,
          delegation: delegation.Value,
          governorate: gov.Name,
          postalCode: delegation.PostalCode,
          latitude: delegation.Latitude,
          longitude: delegation.Longitude,
          created_at: new Date().toISOString()
        });
      });
    });
    
    return municipalities;
  } catch (error) {
    console.error('Error in fetchMunicipalities:', error);
    throw error;
  }
};

/**
 * Fetches unique governorates from the municipalities data
 * @returns {Promise<string[]>} Sorted array of unique governorate names
 */
export const getGovernorates = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/municipalities`);
    if (!response.ok) {
      throw new Error(`Failed to fetch governorates: ${response.statusText}`);
    }
    const data = await response.json();
    const governorates = data.map((g: any) => g.Name);
    return governorates.sort();
  } catch (error) {
    console.error('Error getting governorates:', error);
    throw error;
  }
};

/**
 * Fetches delegations for a specific governorate
 * @param governorate The name of the governorate
 * @returns {Promise<string[]>} Sorted array of delegation names
 */
export const getDelegations = async (governorate: string): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/municipalities?name=${encodeURIComponent(governorate)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch delegations: ${response.statusText}`);
    }
    const data = await response.json();
    
    // Find the governorate and get its delegations
    const gov = data.find((g: any) => g.Name === governorate);
    if (!gov) return [];
    
    return gov.Delegations.map((d: any) => d.Name).sort();
  } catch (error) {
    console.error('Error getting delegations:', error);
    throw error;
  }
};

/**
 * Fetches cities for a specific delegation
 * @param delegation The name of the delegation
 * @returns {Promise<Municipality[]>} Array of city data
 */
export const getCities = async (delegation: string): Promise<Municipality[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/municipalities`);
    if (!response.ok) {
      throw new Error(`Failed to fetch cities: ${response.statusText}`);
    }
    const data = await response.json();
    
    // Find all cities in the specified delegation
    const cities: Municipality[] = [];
    
    data.forEach((gov: any) => {
      gov.Delegations
        .filter((d: any) => d.Name === delegation)
        .forEach((d: any) => {
          cities.push({
            id: d.PostalCode,
            name: d.NameAr,
            nameEn: d.Name,
            delegation: d.Value,
            governorate: gov.Name,
            postalCode: d.PostalCode,
            latitude: d.Latitude,
            longitude: d.Longitude,
            created_at: new Date().toISOString()
          });
        });
    });
    
    return cities;
  } catch (error) {
    console.error('Error getting cities:', error);
    throw error;
  }
};
