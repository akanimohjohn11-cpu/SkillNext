import { z } from 'zod';

export function isSafeUrl(url: string): boolean {
  if (url.startsWith('/')) return !url.startsWith('//');
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['client', 'provider', 'admin']).optional(),
});

export const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name is required').max(100),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(8, 'Enter a valid Nigerian phone number').max(20),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['client', 'provider']),
  location: z.string().min(2, 'Location is required').max(100),
  businessName: z.string().max(120).optional(),
  categorySlug: z.string().max(60).optional(),
  headline: z.string().max(140).optional(),
});

export const serviceRequestSchema = z.object({
  title: z.string().min(5, 'Describe your project title (min 5 chars)').max(120),
  categorySlug: z.string().min(1, 'Select a category'),
  description: z.string().min(15, 'Provide at least 15 characters of scope details').max(2000),
  location: z.string().min(2, 'Select or enter a Lagos/Nigerian location').max(100),
  budgetNgn: z.coerce.number().min(5000, 'Minimum budget is ₦5,000').max(500000000),
  urgency: z.enum(['immediate', 'this_week', 'this_month', 'flexible']),
});

export const inquiryCreateSchema = z.object({
  providerId: z.string().min(1),
  subject: z.string().min(3, 'Enter a clear subject').max(140),
  message: z.string().min(10, 'Write a brief project message (min 10 chars)').max(2000),
  budgetNgn: z.coerce.number().min(0).max(500000000).optional(),
  preferredDate: z.string().max(30).optional(),
  location: z.string().min(2).max(100),
});

export const inquiryMessageSchema = z.object({
  inquiryId: z.string().min(1),
  body: z.string().min(1, 'Message cannot be empty').max(2000),
  status: z.enum(['new', 'replied', 'quoted', 'accepted', 'completed', 'archived']).optional(),
});

export const reviewCreateSchema = z.object({
  providerId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  projectTitle: z.string().min(3, 'Project title is required').max(100),
  comment: z.string().min(10, 'Please share at least 10 characters about the work').max(1000),
});

export const providerUpdateSchema = z.object({
  businessName: z.string().min(2).max(120).optional(),
  headline: z.string().min(5).max(140).optional(),
  bio: z.string().min(20).max(2500).optional(),
  categorySlug: z.string().min(1).optional(),
  location: z.string().min(2).max(100).optional(),
  serviceAreas: z.array(z.string().max(80)).max(15).optional(),
  skills: z.array(z.string().max(60)).max(20).optional(),
  startingPriceNgn: z.coerce.number().min(1000).max(100000000).optional(),
  yearsExperience: z.coerce.number().int().min(0).max(60).optional(),
  responseTime: z.string().max(60).optional(),
  avatarUrl: z.string().refine(isSafeUrl, 'Invalid image URL').optional(),
  addService: z
    .object({
      title: z.string().min(3).max(100),
      description: z.string().min(5).max(500),
      priceNgn: z.coerce.number().min(1000).max(100000000),
      priceUnit: z.enum(['fixed', 'hourly', 'per_day', 'starting_at']),
      deliveryEstimate: z.string().min(2).max(60),
    })
    .optional(),
  removeServiceId: z.string().optional(),
  addPortfolio: z
    .object({
      title: z.string().min(3).max(100),
      description: z.string().min(5).max(500),
      imageUrl: z.string().refine(isSafeUrl, 'Invalid portfolio image URL'),
      location: z.string().min(2).max(80),
      completedYear: z.string().min(4).max(10),
    })
    .optional(),
  removePortfolioId: z.string().optional(),
  submitVerification: z
    .object({
      idType: z.enum(['NIN', 'BVN', 'Drivers License', 'International Passport']),
      idLastFour: z.string().regex(/^\d{4}$/, 'Enter the last 4 digits only'),
      cacNumber: z.string().max(40).optional(),
    })
    .optional(),
});

export const contactSchema = z.object({
  name: z.string().min(2, 'Your name is required').max(100),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().max(25).optional().default(''),
  topic: z.string().min(2).max(80),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});
