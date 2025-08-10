import { Municipality } from '../types/order';

const API_BASE_URL = 'https://tn-municipality-api.vercel.app/api';

export const fetchMunicipalities = async (filters?: { name?: string; delegation?: string }): Promise<Municipality[]> => {
  try {
    let url = `${API_BASE_URL}/municipalities`;
    const params = new URLSearchParams();
    
    if (filters?.name) params.append('name', filters.name);
    if (filters?.delegation) params.append('delegation', filters.delegation);
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch municipalities: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching municipalities:', error);
    throw error;
  }
};

export const getGovernorates = async (): Promise<string[]> => {
  try {
    const municipalities = await fetchMunicipalities();
    const governorates = new Set(municipalities.map(m => m.governorate));
    return Array.from(governorates).sort();
  } catch (error) {
    console.error('Error getting governorates:', error);
    throw error;
  }
};

export const getDelegations = async (governorate: string): Promise<string[]> => {
  try {
    const municipalities = await fetchMunicipalities({ name: governorate });
    const delegations = new Set(municipalities.map(m => m.delegation));
    return Array.from(delegations).sort();
  } catch (error) {
    console.error('Error getting delegations:', error);
    throw error;
  }
};

export const getCities = async (delegation: string): Promise<Municipality[]> => {
  try {
    return await fetchMunicipalities({ delegation });
  } catch (error) {
    console.error('Error getting cities:', error);
    throw error;
  }
};
