
export type AspectRatio = '16:9' | '3:4';
export type AppMode = 'manual' | 'auto' | 'library' | 'history';

export interface LibraryItem {
  id: string;
  image: string; // base64
  createdAt: number;
  promptSummary: string;
}

export interface HistoryItem {
  id: string;
  image: string;
  createdAt: number;
}

export interface Speaker {
  id: string;
  name: string;
  title: string;
  company: string; // Added company field
  image: File | null;
  imagePreview: string | null;
  editPrompt: string; // e.g., "wear a vest", "arms crossed"
  removeBackground: boolean;
}

export interface AgendaItem {
  id: string;
  time: string;
  activity: string;
}

export interface EventFormData {
  // General
  aspectRatio: AspectRatio;
  
  // Auto Mode File Metadata
  uploadedFileName?: string;
  uploadedFilePreview?: string; // For images
  uploadedFileType?: string;
  uploadedFile?: File | null; // Keep reference for extraction

  // Event Info
  eventType: string; // New: Seminar, Workshop, etc.
  eventName: string;
  time: string;
  date: string;
  targetAudience: string;
  isOnline: boolean;
  locationOrPlatform: string; // Zoom link or Physical Address
  
  // Agenda
  agenda: AgendaItem[];

  // Visuals
  themeTone: string; // Updated preset list
  themeTopics: string[]; // Changed to array for multi-select
  customThemePrompt?: string; // For custom tone
  customTopicPrompt?: string; // For custom topic
  
  // Background/Template
  selectedBackground?: string; // Base64 of a selected background/template
  useUploadedBackground: boolean;

  // Logos
  useBrandLogo: boolean; // New toggle for custom logos vs default MISA
  organizerLogo: File | null;
  organizerLogoPreview: string | null;
  productLogo: File | null;
  productLogoPreview: string | null;
  coOrganizerLogo: File | null;
  coOrganizerLogoPreview: string | null;

  // Contact
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  
  // QR Code
  includeQrCode: boolean;
  qrCodeImage: File | null;
  qrCodePreview: string | null;

  // Speakers
  speakers: Speaker[];
}

export const INITIAL_FORM_DATA: EventFormData = {
  aspectRatio: '16:9',
  uploadedFile: null,
  eventType: '',
  eventName: '',
  date: '',
  time: '',
  targetAudience: '',
  isOnline: true,
  locationOrPlatform: 'Zoom Online',
  agenda: [],
  themeTone: 'Xanh công nghệ (MISA Blue)',
  themeTopics: ['Công nghệ'],
  useUploadedBackground: false,
  useBrandLogo: false, // Default to using MISA logo (false = use default)
  organizerLogo: null,
  organizerLogoPreview: null,
  productLogo: null,
  productLogoPreview: null,
  coOrganizerLogo: null,
  coOrganizerLogoPreview: null,
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  includeQrCode: false,
  qrCodeImage: null,
  qrCodePreview: null,
  speakers: []
};