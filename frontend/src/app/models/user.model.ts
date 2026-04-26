export interface InstitutionSummary {
  id: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  description?: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'institution';
  institution: InstitutionSummary | null;
}
