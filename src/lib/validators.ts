import { z } from 'zod';

export const customerRegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name is required'),
  age: z.number().min(18, 'You must be at least 18 years old to register'),
  gender: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  phone: z.string().optional(),
  termsAccepted: z.boolean({
    required_error: 'Please agree to the Terms & Conditions and Privacy Policy to continue.',
  }).refine((val) => val === true, {
    message: 'Please agree to the Terms & Conditions and Privacy Policy to continue.',
  }),
});

export const companionRegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  displayName: z.string().min(2, 'Display name is required'),
  age: z.number().min(18, 'You must be at least 18 years old to register'),
  gender: z.string().min(2, 'Gender is required'),
  cityId: z.string().uuid('Please select a valid city'),
  hourlyPrice: z.number().min(100, 'Hourly rate must be at least ₹100').max(10000, 'Hourly rate capped at ₹10,000'),
  bio: z.string().min(20, 'Bio should be at least 20 characters describing yourself and activities'),
  languages: z.array(z.string()).min(1, 'Select at least 1 language'),
  interests: z.array(z.string()).default([]),
  activityIds: z.array(z.string()).min(1, 'Select at least 1 activity'),
  profilePhoto: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const bookingSchema = z.object({
  companionId: z.string().uuid('Invalid companion ID'),
  activityId: z.string().uuid('Invalid activity ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format'),
  durationHours: z.number().min(1, 'Minimum booking duration is 1 hour').max(12, 'Maximum duration is 12 hours'),
  notes: z.string().optional(),
});

export const reviewSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5, 'Review must be at least 5 characters'),
});

export const reportSchema = z.object({
  reportedUserId: z.string().uuid('Invalid user ID'),
  reason: z.string().min(3, 'Reason is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

export const platformSettingSchema = z.object({
  registrationFee: z.number().min(0).max(5000),
  commissionPercent: z.number().min(0).max(50),
});

