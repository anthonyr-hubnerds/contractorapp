'use client';

import { useState, useEffect } from 'react';

export interface ComplianceDocument {
  id: string;
  type: string;
  status: string;
  expiresAt: string;
  verificationDate?: string;
  fileUrl: string;
}

export interface Subcontractor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  businessType?: string;
  rating?: number;
  status: string;
  specialties: string[];
  docs: ComplianceDocument[];
}

interface UseSubcontractorsResult {
  subcontractors: Subcontractor[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSubcontractors(): UseSubcontractorsResult {
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubcontractors = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:4000/api/subcontractors');
      if (!res.ok) throw new Error('Failed to load subcontractors');
      const data = await res.json();
      setSubcontractors(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubcontractors();
  }, []);

  return {
    subcontractors,
    loading,
    error,
    refresh: fetchSubcontractors
  };
}
