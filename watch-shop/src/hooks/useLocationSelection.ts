import { useState, useEffect, useCallback } from 'react';
import { Municipality } from '../types/order';
import { getGovernorates, getDelegations, getCities } from '../services/locationService';
import logger from '../utils/logger';

export const useLocationSelection = () => {
  const [governorates, setGovernorates] = useState<string[]>([]);
  const [delegations, setDelegations] = useState<string[]>([]);
  const [cities, setCities] = useState<Municipality[]>([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [selectedDelegation, setSelectedDelegation] = useState('');
  const [selectedCity, setSelectedCity] = useState<Municipality | null>(null);
  const [loading, setLoading] = useState({
    governorates: true,
    delegations: false,
    cities: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Load governorates on mount
  useEffect(() => {
    const loadGovernorates = async () => {
      try {
        setLoading(prev => ({ ...prev, governorates: true }));
        // Pass an empty array as the municipalities parameter since we're fetching all governorates
        const data = await getGovernorates([]);
        setGovernorates(data);
        setError(null);
      } catch (err) {
        logger.error('Failed to load governorates:', err);
        setError('Failed to load governorates. Please try again later.');
      } finally {
        setLoading(prev => ({ ...prev, governorates: false }));
      }
    };

    loadGovernorates();
  }, []);

  // Load delegations when governorate changes
  useEffect(() => {
    if (!selectedGovernorate) {
      setDelegations([]);
      setSelectedDelegation('');
      return;
    }

    const loadDelegations = async () => {
      try {
        setLoading(prev => ({ ...prev, delegations: true }));
        const data = await getDelegations(selectedGovernorate);
        setDelegations(data);
        setError(null);
      } catch (err) {
        logger.error('Failed to load delegations:', err);
        setError('Failed to load delegations. Please try again.');
      } finally {
        setLoading(prev => ({ ...prev, delegations: false }));
      }
    };

    loadDelegations();
  }, [selectedGovernorate]);

  // Load cities when delegation changes
  useEffect(() => {
    if (!selectedDelegation) {
      setCities([]);
      setSelectedCity(null);
      return;
    }

    const loadCities = async () => {
      try {
        setLoading(prev => ({ ...prev, cities: true }));
        const data = await getCities(selectedDelegation);
        setCities(data);
        setError(null);
      } catch (err) {
        logger.error('Failed to load cities:', err);
        setError('Failed to load cities. Please try again.');
      } finally {
        setLoading(prev => ({ ...prev, cities: false }));
      }
    };

    loadCities();
  }, [selectedDelegation]);

  const handleGovernorateChange = (governorate: string) => {
    setSelectedGovernorate(governorate);
    setSelectedDelegation('');
    setSelectedCity(null);
  };

  const handleDelegationChange = (delegation: string) => {
    setSelectedDelegation(delegation);
    setSelectedCity(null);
  };

  const resetLocation = useCallback(() => {
    setSelectedGovernorate('');
    setSelectedDelegation('');
    setSelectedCity(null);
  }, []);

  return {
    governorates,
    delegations,
    cities,
    selectedGovernorate,
    selectedDelegation,
    selectedCity,
    loading,
    error,
    handleGovernorateChange,
    handleDelegationChange,
    setSelectedCity,
    resetLocation,
  };
};
