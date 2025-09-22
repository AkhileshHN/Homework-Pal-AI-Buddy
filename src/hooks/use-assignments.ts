
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Assignment } from '@/lib/data';
import initialData from '@/lib/assignments.json';

const STORAGE_KEY = 'homework-pal-assignments';

export function useAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        setAssignments(JSON.parse(storedData));
      } else {
        // Seed initial data from the JSON file if local storage is empty
        const seededAssignments = initialData.assignments || [];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seededAssignments));
        setAssignments(seededAssignments);
      }
    } catch (error) {
        console.error("Failed to load assignments from localStorage", error);
        // Fallback to initial data in case of parsing errors
        const seededAssignments = initialData.assignments || [];
        setAssignments(seededAssignments);
    } finally {
        setIsLoading(false);
    }
  }, []);

  const updateStorage = (updatedAssignments: Assignment[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAssignments));
    setAssignments(updatedAssignments);
  };

  const addAssignment = useCallback(async (newAssignment: Assignment) => {
    setAssignments(prev => {
        const updated = [...prev, newAssignment];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
    });
  }, []);

  const deleteAssignment = useCallback(async (id: string) => {
    setAssignments(prev => {
        const updated = prev.filter((a) => a.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
    });
  }, []);

  const updateAssignmentStatus = useCallback((id: string, status: 'new' | 'inprogress' | 'completed') => {
    setAssignments(prev => {
        const updated = prev.map(a => {
            if (a.id === id && a.status !== 'completed') {
                return { ...a, status };
            }
            return a;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
    });
  }, []);

  const getAssignment = useCallback((id: string): Assignment | undefined => {
    return assignments.find(a => a.id === id);
  }, [assignments]);
  
  return { 
    assignments, 
    isLoading,
    addAssignment, 
    deleteAssignment,
    updateAssignmentStatus,
    getAssignment
  };
}
