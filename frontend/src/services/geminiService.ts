import { api } from './apiService';
import { TriageResult } from '../types';

export const geminiService = {
  async analyzeSymptoms(symptoms: string): Promise<TriageResult> {
    return api.post<TriageResult>('/api/ai/triage', { symptoms });
  },
};