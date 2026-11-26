export type UserRole = 'client' | 'provider' | 'admin';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export type InquiryStatus = 'new' | 'replied' | 'quoted' | 'accepted' | 'completed' | 'archived';

export type RequestStatus = 'open' | 'in_review' | 'assigned' | 'completed' | 'cancelled';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  location: string;
  createdAt: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  providerCount: number;
  isFeatured: boolean;
  isActive: boolean;
}

export interface ProviderService {
  id: string;
  providerId: string;
  title: string;
  description: string;
  priceNgn: number;
  priceUnit: 'fixed' | 'hourly' | 'per_day' | 'starting_at';
  deliveryEstimate: string;
}

export interface PortfolioItem {
  id: string;
  providerId: string;
  title: string;
  description: string;
  imageUrl: string;
  location: string;
  completedYear: string;
}

export interface Review {
  id: string;
  providerId: string;
  clientId: string;
  clientName: string;
  clientLocation: string;
  rating: number;
  comment: string;
  projectTitle: string;
  createdAt: string;
  isHidden?: boolean;
}

export interface ProviderProfile {
  id: string;
  userId: string;
  fullName: string;
  headline: string;
  businessName: string;
  bio: string;
  categorySlug: string;
  categoryName: string;
  skills: string[];
  location: string;
  serviceAreas: string[];
  avatarUrl: string;
  startingPriceNgn: number;
  yearsExperience: number;
  responseTime: string;
  completedJobs: number;
  ratingAvg: number;
  reviewCount: number;
  verificationStatus: VerificationStatus;
  verificationNotes?: string;
  cacRegistered: boolean;
  ninVerified: boolean;
  isFeatured: boolean;
  services: ProviderService[];
  portfolio: PortfolioItem[];
  reviews: Review[];
  createdAt: string;
}

export interface ServiceRequest {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  categorySlug: string;
  categoryName: string;
  description: string;
  location: string;
  budgetNgn: number;
  urgency: 'immediate' | 'this_week' | 'this_month' | 'flexible';
  status: RequestStatus;
  responsesCount: number;
  createdAt: string;
}

export interface Message {
  id: string;
  inquiryId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  body: string;
  createdAt: string;
}

export interface Inquiry {
  id: string;
  providerId: string;
  providerName: string;
  providerBusiness: string;
  clientId: string;
  clientName: string;
  subject: string;
  budgetNgn?: number;
  preferredDate?: string;
  location: string;
  status: InquiryStatus;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface VerificationSubmission {
  id: string;
  providerId: string;
  providerName: string;
  businessName: string;
  categoryName: string;
  location: string;
  idType: 'NIN' | 'BVN' | 'Drivers License' | 'International Passport';
  idLastFour: string;
  cacNumber?: string;
  portfolioSampleUrl?: string;
  status: VerificationStatus;
  submittedAt: string;
  reviewedNotes?: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
  createdAt: string;
}
