import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import logger from '../utils/logger';

export const useNewsletterSubscription = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const subscribe = async (email: string) => {
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      setStatus('error');
      return false;
    }

    setStatus('loading');
    setError(null);

    try {
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .upsert(
          { email, is_active: true },
          { onConflict: 'email', ignoreDuplicates: false }
        )
        .select();

      if (error) {
        if (error.code === '23505') { // Unique violation
          setError('You\'re already subscribed to our newsletter!');
          setStatus('error');
          return false;
        }
        throw error;
      }

      setStatus('success');
      setEmail('');
      return true;
    } catch (err) {
      logger.error('Error subscribing to newsletter:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe. Please try again.';
      setError(errorMessage);
      setStatus('error');
      return false;
    }
  };

  return {
    email,
    setEmail,
    status,
    error,
    subscribe,
    validateEmail,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
  };
};
