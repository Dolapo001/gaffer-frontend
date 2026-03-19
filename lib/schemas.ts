import { z } from 'zod'

// ─── Auth ─────────────────────────────────────────────────────────────────────

// POST /auth/register — backend: email + password (min 8, max 72)
// Note: backend strips gender — removed from frontend form too
export const signUpSchema = z
  .object({
    email: z
      .string({ required_error: 'Email is required' })
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be at most 72 characters'),
    confirmPassword: z
      .string({ required_error: 'Please confirm your password' })
      .min(1, 'Please confirm your password'),
    gender: z.enum(['male', 'female'], {
      required_error: 'Please select a gender',
    }).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type SignUpFormData = z.infer<typeof signUpSchema>

// POST /auth/login — backend: email + password (presence check only)
export const signInSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
})

export type SignInFormData = z.infer<typeof signInSchema>

// ─── Users ────────────────────────────────────────────────────────────────────

// PUT /users — updatable fields only
export const updateProfileSchema = z.object({
  fullName: z.string().min(1, 'Name must be at least 1 character').optional(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .optional(),
  avatarUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  phone: z.string().min(1).optional(),
})

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>

// ─── Orgs ─────────────────────────────────────────────────────────────────────

// POST /orgs — name (max 100), handle (min 3, max 30, [a-z0-9_] only)
export const createOrgSchema = z.object({
  name: z
    .string({ required_error: 'Organization name is required' })
    .min(1, 'Organization name is required')
    .max(100, 'Name must be at most 100 characters'),
  handle: z
    .string({ required_error: 'Handle is required' })
    .min(3, 'Handle must be at least 3 characters')
    .max(30, 'Handle must be at most 30 characters')
    .regex(/^[a-z0-9_]+$/, 'Handle may only contain lowercase letters, numbers and underscores'),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  email: z.string().email('Must be a valid email').optional().or(z.literal('')),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  logoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

export type CreateOrgFormData = z.infer<typeof createOrgSchema>

export const organizationSignUpSchema = z
  .object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(1, 'Name is required')
      .max(100, 'Name must be at most 100 characters'),
    email: z
      .string()
      .email('Please enter a valid email address')
      .optional()
      .or(z.literal('')),
    handle: z
      .string({ required_error: 'Handle is required' })
      .min(3, 'Handle must be at least 3 characters')
      .max(30, 'Handle must be at most 30 characters')
      .regex(/^[a-z0-9_]+$/, 'Handle may only contain lowercase letters, numbers and underscores'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be at most 72 characters')
      .optional()
      .or(z.literal('')),
    confirmPassword: z
      .string()
      .optional()
      .or(z.literal('')),
    sport: z.string({ required_error: 'Sport is required' }).min(1, 'Sport is required'),
    description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  })
  .refine((data) => !data.password || !data.confirmPassword || data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type OrganizationSignUpFormData = z.infer<typeof organizationSignUpSchema>

// ─── Teams ────────────────────────────────────────────────────────────────────

// POST /orgs/:orgId/teams — handle: [a-z0-9-] only, min 3, max 50
export const createTeamSchema = z.object({
  name: z
    .string({ required_error: 'Team name is required' })
    .min(1, 'Team name is required')
    .max(100, 'Name must be at most 100 characters'),
  handle: z
    .string({ required_error: 'Handle is required' })
    .min(3, 'Handle must be at least 3 characters')
    .max(50, 'Handle must be at most 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Handle may only contain lowercase letters, numbers and hyphens'),
  sport: z.string({ required_error: 'Sport is required' }).min(1, 'Sport is required'),
  shortName: z.string().max(20, 'Short name must be at most 20 characters').optional(),
  logoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  genderCategory: z.enum(['male', 'female', 'mixed']).optional(),
  homeVenue: z.string().max(100).optional(),
})

export type CreateTeamFormData = z.infer<typeof createTeamSchema>

// ─── Competitions ─────────────────────────────────────────────────────────────

export const createCompetitionSchema = z
  .object({
    name: z
      .string({ required_error: 'Competition name is required' })
      .min(1, 'Competition name is required')
      .max(100, 'Name must be at most 100 characters'),
    sport: z.string({ required_error: 'Sport is required' }).min(1, 'Sport is required'),
    gender: z.enum(['male', 'female', 'mixed'], {
      required_error: 'Gender category is required',
    }),
    startDate: z.string({ required_error: 'Start date is required' }),
    endDate: z.string({ required_error: 'End date is required' }),
    bannerUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  })
  .refine(
    (data) => !data.startDate || !data.endDate || new Date(data.endDate) > new Date(data.startDate),
    { message: 'End date must be after start date', path: ['endDate'] },
  )

export type CreateCompetitionFormData = z.infer<typeof createCompetitionSchema>

// ─── Fantasy ──────────────────────────────────────────────────────────────────

export const createFantasyTeamSchema = z.object({
  teamName: z
    .string({ required_error: 'Team name is required' })
    .min(2, 'Team name must be at least 2 characters')
    .max(50, 'Team name must be at most 50 characters'),
})

export type CreateFantasyTeamFormData = z.infer<typeof createFantasyTeamSchema>

// ─── Feed ─────────────────────────────────────────────────────────────────────

export const publishNewsSchema = z.object({
  body: z
    .string({ required_error: 'Body is required' })
    .min(1, 'Body is required')
    .max(5000, 'Body must be at most 5000 characters'),
  visibility: z.enum(['public', 'org']).optional(),
})

export const addCommentSchema = z.object({
  body: z
    .string({ required_error: 'Comment cannot be empty' })
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment must be at most 2000 characters'),
})
