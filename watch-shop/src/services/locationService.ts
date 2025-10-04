import { Municipality } from '../types/order';

const API_BASE_URL = '/api/tn-municipalities';

export const fetchMunicipalities = async (filters?: { name?: string; delegation?: string }): Promise<Municipality[]> => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (filters?.name) params.append('name', filters.name);
    if (filters?.delegation) params.append('delegation', filters.delegation);
    
    const apiUrl = `${import.meta.env.VITE_API_BASE_URL || ''}/municipalities`;
    console.log('Fetching municipalities from:', apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        error: errorText
      });
      throw new Error(`Failed to fetch municipalities: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    // Transform the API response to match our Municipality type
    const municipalities: Municipality[] = [];
    
    // Handle the actual API response format
    if (Array.isArray(data)) {
      data.forEach((gov: any) => {
        if (gov.Delegations && Array.isArray(gov.Delegations)) {
          gov.Delegations.forEach((delegation: any) => {
            municipalities.push({
              id: delegation.PostalCode || `${gov.Name}-${delegation.Name}`,
              name: delegation.NameAr || delegation.Name,
              nameEn: delegation.Name,
              delegation: delegation.Value || delegation.Name,
              governorate: gov.Name,
              postalCode: delegation.PostalCode,
              latitude: delegation.Latitude,
              longitude: delegation.Longitude,
              created_at: new Date().toISOString()
            });
          });
        }
      });
    }
    
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
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/municipalities`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching governorates:', {
        status: response.status,
        error: errorText
      });
      throw new Error(`Failed to fetch governorates: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('Unexpected API response format:', data);
      throw new Error('Invalid response format from server');
    }
    
    // Extract and sort unique governorate names
    const governorates = [...new Set(data.map((g: any) => g.Name))].sort();
    return governorates;
  } catch (error) {
    console.error('Error in getGovernorates:', error);
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
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/municipalities?name=${encodeURIComponent(governorate)}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching delegations:', {
        status: response.status,
        governorate,
        error: errorText
      });
      throw new Error(`Failed to fetch delegations: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      console.warn('No data found for governorate:', governorate);
      return [];
    }
    
    // Find the governorate and get its delegations
    const gov = data.find((g: any) => g.Name === governorate);
    if (!gov || !Array.isArray(gov.Delegations)) {
      console.warn('No delegations found for governorate:', governorate);
      return [];
    }
    
    // Sort and return delegation names
    return gov.Delegations
      .map((d: any) => d.Name)
      .filter((name: string | null) => name != null)
      .sort();
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
