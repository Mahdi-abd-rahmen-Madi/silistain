import { supabase } from '../lib/supabaseClient';
import { validateContactForm } from '../utils/formValidation';
import logger from '../utils/logger';

// Environment variables from .env file
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export const submitContactForm = async (formData: ContactFormData) => {
  // Validate form data
  const { isValid, errors } = validateContactForm(formData);
  
  if (!isValid) {
    return { success: false, errors };
  }

  try {
    const { data, error } = await supabase.rpc('submit_contact', {
      p_name: formData.name,
      p_email: formData.email,
      p_message: formData.message
    });

    if (error) {
      logger.error('Error submitting contact form:', error);
      return { 
        success: false, 
        errors: { 
          form: error.message || 'Failed to submit the form. Please try again later.'
        } 
      };
    }

    return { success: true };
  } catch (error) {
    logger.error('Unexpected error in contact form submission:', error);
    return { 
      success: false, 
      errors: { 
        form: 'An unexpected error occurred. Please try again later.' 
      } 
    };
  }
};
