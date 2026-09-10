import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

const DUMMY_PLACEHOLDER_COMPANIONS = [
  {
    id: 'placeholder-1',
    username: 'verified_candidate_1',
    displayName: 'Verified Candidate',
    age: 24,
    gender: 'Female',
    hourlyPrice: 1500,
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    verificationStatus: 'VERIFIED',
    averageRating: 4.9,
    totalReviews: 12,
    city: { id: 'c1', name: 'Location Hidden', slug: 'location-hidden' },
    activities: [{ activity: { id: 'a1', name: 'Coffee & Outings', slug: 'coffee-outings', icon: '☕' } }],
  },
  {
    id: 'placeholder-2',
    username: 'verified_candidate_2',
    displayName: 'Verified Candidate',
    age: 23,
    gender: 'Female',
    hourlyPrice: 1800,
    profilePhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    verificationStatus: 'VERIFIED',
    averageRating: 4.8,
    totalReviews: 8,
    city: { id: 'c2', name: 'Location Hidden', slug: 'location-hidden' },
    activities: [{ activity: { id: 'a2', name: 'Dining & Events', slug: 'dining-events', icon: '🍽️' } }],
  },
  {
    id: 'placeholder-3',
    username: 'verified_candidate_3',
    displayName: 'Verified Candidate',
    age: 25,
    gender: 'Female',
    hourlyPrice: 2000,
    profilePhoto: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    verificationStatus: 'VERIFIED',
    averageRating: 5.0,
    totalReviews: 15,
    city: { id: 'c3', name: 'Location Hidden', slug: 'location-hidden' },
    activities: [{ activity: { id: 'a3', name: 'Concerts & Shows', slug: 'concerts-shows', icon: '🎵' } }],
  },
];

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in or register to search companions.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const isPlaceholderRequest = searchParams.get('placeholder') === 'true';

    // SERVER-SIDE VERIFICATION AUTHORIZATION GATE:
    // Non-ACTIVE customers cannot fetch real database companion profiles.
    if (user.role === 'CUSTOMER' && user.accountStatus !== 'ACTIVE') {
      if (isPlaceholderRequest) {
        return NextResponse.json({
          companions: DUMMY_PLACEHOLDER_COMPANIONS,
          pagination: { page: 1, limit: 3, total: 3, totalPages: 1 },
          isLocked: true,
          accountStatus: user.accountStatus,
        });
      }

      return NextResponse.json(
        {
          error: 'ACCOUNT_VERIFICATION_REQUIRED',
          message: 'Your account is currently under verification. You will get access to candidates and platform features after your identity verification is approved.',
          accountStatus: user.accountStatus,
        },
        { status: 403 }
      );
    }

    const city = searchParams.get('city');
    const activity = searchParams.get('activity');
    const date = searchParams.get('date');
    const explicitGender = searchParams.get('gender');
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined;
    const language = searchParams.get('language');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '9', 10);
    const skip = (page - 1) * limit;

    const whereClause: any = {
      verificationStatus: 'VERIFIED',
    };

    // AUTOMATIC OPPOSITE GENDER MATCHING RULE
    if (explicitGender) {
      whereClause.gender = { equals: explicitGender, mode: 'insensitive' };
    } else if (user.customerProfile?.gender) {
      const custGender = user.customerProfile.gender.toLowerCase();
      if (custGender === 'male') {
        whereClause.gender = { equals: 'Female', mode: 'insensitive' };
      } else if (custGender === 'female') {
        whereClause.gender = { equals: 'Male', mode: 'insensitive' };
      }
    }

    if (city) {
      whereClause.city = {
        OR: [{ slug: city }, { id: city }, { name: { equals: city, mode: 'insensitive' } }],
      };
    }

    if (activity) {
      whereClause.activities = {
        some: {
          activity: {
            OR: [{ slug: activity }, { id: activity }, { name: { equals: activity, mode: 'insensitive' } }],
          },
        },
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      whereClause.hourlyPrice = {};
      if (minPrice !== undefined) whereClause.hourlyPrice.gte = minPrice;
      if (maxPrice !== undefined) whereClause.hourlyPrice.lte = maxPrice;
    }

    if (minRating !== undefined) {
      whereClause.averageRating = { gte: minRating };
    }

    if (language) {
      whereClause.languages = { has: language };
    }

    if (search) {
      whereClause.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
        { interests: { has: search } },
      ];
    }

    if (date) {
      whereClause.availabilitySlots = {
        some: {
          date,
          isBooked: false,
        },
      };
    }

    const [companions, total] = await Promise.all([
      prisma.companionProfile.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: [{ isFeatured: 'desc' }, { averageRating: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          username: true,
          displayName: true,
          age: true,
          gender: true,
          hourlyPrice: true,
          profilePhoto: true,
          verificationStatus: true,
          averageRating: true,
          totalReviews: true,
          city: {
            select: { id: true, name: true, slug: true },
          },
          activities: {
            select: {
              activity: {
                select: { id: true, name: true, slug: true, icon: true },
              },
            },
          },
        },
      }),
      prisma.companionProfile.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      companions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch companions' }, { status: 500 });
  }
}
