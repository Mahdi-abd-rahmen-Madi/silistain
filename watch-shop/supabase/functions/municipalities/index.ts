// supabase/functions/municipalities/index.ts
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

// Sample data to use if API fails
const SAMPLE_DATA = [
  {
    id: '1',
    name: 'Tunis',
    delegation: 'Tunis',
    governorate: 'Tunis'
  },
  {
    id: '2',
    name: 'Ariana',
    delegation: 'Ariana',
    governorate: 'Ariana'
  },
  // Add more sample data as needed
];

const fetchWithTimeout = async (url: string, options = {}, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

export default async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: CORS_HEADERS 
    });
  }

  try {
    // Try to fetch from the external API with a timeout
    const response = await fetchWithTimeout('https://tn-municipality-api.vercel.app/api/municipalities');
    
    if (response.ok) {
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: CORS_HEADERS
      });
    }
    
    // If the API fails, return sample data
    console.warn('Using sample data due to API failure');
    return new Response(JSON.stringify(SAMPLE_DATA), {
      headers: CORS_HEADERS
    });
    
  } catch (error) {
    console.error('Error in municipalities function:', error);
    
    // Return sample data in case of any error
    return new Response(JSON.stringify(SAMPLE_DATA), {
      status: 200, // Still return 200 since we're providing fallback data
      headers: CORS_HEADERS
    });
  }
};