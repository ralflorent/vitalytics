export interface UserProfile {
  nickname: string;
  ageRange: string;
  background: string;
  interests: string[];
}

export const EMPTY_PROFILE: UserProfile = {
  nickname: '',
  ageRange: '',
  background: '',
  interests: [],
};

export const AGE_RANGES = [
  { value: 'under-18', label: 'Under 18' },
  { value: '18-24', label: '18–24' },
  { value: '25-34', label: '25–34' },
  { value: '35-44', label: '35–44' },
  { value: '45-54', label: '45–54' },
  { value: '55-64', label: '55–64' },
  { value: '65+', label: '65+' },
];

export const BACKGROUNDS = [
  { value: 'doctor', label: 'Doctor / Physician' },
  { value: 'nurse', label: 'Nurse / NP / PA' },
  { value: 'researcher', label: 'Medical Researcher' },
  { value: 'student', label: 'Health Sciences Student' },
  { value: 'caregiver', label: 'Caregiver / Family Member' },
  { value: 'general', label: 'General Public' },
];

export const INTEREST_OPTIONS = [
  'Cardiology',
  'Nutrition & Diet',
  'Mental Health',
  'Pediatrics',
  'Women\'s Health',
  'Chronic Conditions',
  'Lab Results',
  'Medications',
  'Preventive Care',
  'Fitness & Exercise',
];

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem('user_profile');
    if (raw) return { ...EMPTY_PROFILE, ...JSON.parse(raw) };
  } catch { /* corrupted data — fall through */ }
  return { ...EMPTY_PROFILE };
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem('user_profile', JSON.stringify(profile));
}
