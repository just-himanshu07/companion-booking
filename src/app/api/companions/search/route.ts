import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

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

    // AUTOMATIC OPPOSITE GENDER MATCHING RULE:
    // If a male customer searches -> show female candidates
    // If a female customer searches -> show male candidates
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
