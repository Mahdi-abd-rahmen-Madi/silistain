import { Municipality } from '../types/order';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const fetchMunicipalities = async (filters?: { name?: string; delegation?: string }): Promise<Municipality[]> => {
  try {
    console.log('Fetching municipalities from Supabase function...');
    const { data, error } = await supabase.functions.invoke('municipalities');
    
    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(`Failed to fetch municipalities: ${error.message}`);
    }
    
    console.log('Raw data from function:', data);
    
    if (!data) {
      console.warn('No data returned from municipalities function');
      return [];
    }
    
    // Apply filters client-side if needed
    let result = Array.isArray(data) ? data : [];
    
    if (filters?.name) {
      result = result.filter((m: Municipality) => 
        m.name?.toLowerCase().includes(filters.name!.toLowerCase())
      );
    }
    
    if (filters?.delegation) {
      result = result.filter((m: Municipality) => 
        m.delegation?.toLowerCase().includes(filters.delegation!.toLowerCase())
      );
    }
    
    console.log('Filtered municipalities:', result);
    return result;
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
    const municipalities = await fetchMunicipalities();
    const governorates = new Set(municipalities.map((m: any) => m.governorate));
    return Array.from(governorates).sort() as string[];
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
