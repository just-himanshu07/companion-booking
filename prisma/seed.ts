import { PrismaClient, Role, VerificationStatus, DocumentType, DocumentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Retry helper for transient Prisma/database connection errors
async function withRetry<T>(
  actionName: string,
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorCode = error?.code || '';
      const errorMessage = error?.message || String(error);
      const isTransient =
        errorCode === 'P1001' || // Can't reach database server
        errorCode === 'P1002' || // Database server timed out
        errorCode === 'P1008' || // Operations timed out
        errorCode === 'P1017' || // Server has closed the connection
        errorMessage.includes("Can't reach database server") ||
        errorMessage.includes('Connection terminated') ||
        errorMessage.includes('ETIMEDOUT') ||
        errorMessage.includes('ECONNRESET');

      if (!isTransient || attempt === maxRetries) {
        throw error;
      }

      // Sanitize error message to avoid logging sensitive database URLs or secrets
      const sanitizedMsg = errorMessage
        .replace(/postgresql:\/\/[^@]+@/g, 'postgresql://***:***@')
        .replace(/postgres:\/\/[^@]+@/g, 'postgres://***:***@');

      console.warn(
        `[Retry ${attempt}/${maxRetries}] Transient error in "${actionName}": ${sanitizedMsg}. Retrying in ${delayMs * attempt}ms...`
      );

      try {
        await prisma.$disconnect();
        await prisma.$connect();
      } catch (connErr) {
        // Ignore disconnect/reconnect errors during retry attempt
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
  throw lastError;
}

// Chunk helper for batch database insertions
function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

async function main() {
  console.log('Seeding Companion Booking Marketplace database with 24 realistic demo companions...');

  // 1. Platform Settings
  await withRetry('Platform Settings Seeding', async () => {
    await prisma.platformSetting.upsert({
      where: { key: 'REGISTRATION_FEE_INR' },
      update: { value: '399' },
      create: {
        key: 'REGISTRATION_FEE_INR',
        value: '399',
        description: 'One-time customer registration fee in INR',
      },
    });

    await prisma.platformSetting.upsert({
      where: { key: 'PLATFORM_COMMISSION_PERCENT' },
      update: { value: '15' },
      create: {
        key: 'PLATFORM_COMMISSION_PERCENT',
        value: '15',
        description: 'Default platform commission percentage on bookings',
      },
    });
  });

  // 2. Cities (Strictly focusing on the 6 target locations)
  const cities = [
    { name: 'Mumbai', state: 'Maharashtra', slug: 'mumbai', isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80' },
    { name: 'Delhi NCR', state: 'Delhi', slug: 'delhi-ncr', isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80' },
    { name: 'Bengaluru', state: 'Karnataka', slug: 'bengaluru', isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80' },
    { name: 'Goa', state: 'Goa', slug: 'goa', isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80' },
    { name: 'Pune', state: 'Maharashtra', slug: 'pune', isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=800&q=80' },
    { name: 'Hyderabad', state: 'Telangana', slug: 'hyderabad', isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=800&q=80' },
  ];

  const cityMap = new Map<string, string>();
  await withRetry('Cities Seeding', async () => {
    for (const c of cities) {
      const city = await prisma.city.upsert({
        where: { slug: c.slug },
        update: { name: c.name, isPopular: true },
        create: c,
      });
      cityMap.set(c.slug, city.id);
    }
  });

  // 3. Activities
  const activities = [
    { name: 'Fine Dining & Dinners', slug: 'fine-dining', category: 'Social', icon: 'Utensils', description: 'Accompany for dinner dates, food tasting, or high-end dining experiences.' },
    { name: 'Movie Companion', slug: 'movie-companion', category: 'Entertainment', icon: 'Film', description: 'Watch cinema releases, film festivals, or premiere screenings together.' },
    { name: 'City Sightseeing & Tours', slug: 'sightseeing', category: 'Travel', icon: 'Compass', description: 'Explore famous landmarks, hidden city gems, and heritage spots.' },
    { name: 'Coffee & Conversation', slug: 'coffee-conversation', category: 'Casual', icon: 'Coffee', description: 'Engage in stimulating dialogues, intellectual talks, or friendly casual coffee.' },
    { name: 'Concerts & Cultural Events', slug: 'concerts-events', category: 'Entertainment', icon: 'Music', description: 'Attend live music concerts, theater plays, and cultural festivals.' },
    { name: 'Art Gallery & Museum Visit', slug: 'art-galleries', category: 'Culture', icon: 'Palette', description: 'Tour contemporary art exhibitions, history museums, and photo walks.' },
    { name: 'Shopping & Style Assistant', slug: 'shopping', category: 'Lifestyle', icon: 'ShoppingBag', description: 'Personal shopping guidance, wardrobe styling, and boutique shopping tours.' },
    { name: 'Tech & Business Conference', slug: 'tech-conference', category: 'Professional', icon: 'Briefcase', description: 'Attend professional summits, networking mixers, and tech expos.' },
  ];

  const activityMap = new Map<string, string>();
  await withRetry('Activities Seeding', async () => {
    for (const act of activities) {
      const activity = await prisma.activity.upsert({
        where: { slug: act.slug },
        update: {},
        create: act,
      });
      activityMap.set(act.slug, activity.id);
    }
  });

  // Hash default password once for admin and customers
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 4. Admin User
  const adminUser = await withRetry('Admin User Seeding', async () => {
    return await prisma.user.upsert({
      where: { email: 'admin@companion.com' },
      update: { accountStatus: 'ACTIVE', isEmailVerified: true },
      create: {
        email: 'admin@companion.com',
        passwordHash,
        role: Role.ADMIN,
        accountStatus: 'ACTIVE',
        isEmailVerified: true,
        isPhoneVerified: true,
        isRegistrationFeePaid: true,
      },
    });
  });
  console.log('Created/Verified Admin User:', adminUser.email);

  // 5. Sample Customers for Testing
  const customerUsers = [
    {
      email: 'customer@example.com',
      name: 'Rajesh Kumar',
      age: 28,
      gender: 'Male',
      city: 'Mumbai',
    },
    {
      email: 'priya.sharma@example.com',
      name: 'Priya Sharma',
      age: 26,
      gender: 'Female',
      city: 'Delhi NCR',
    },
  ];

  let primaryCustomer: any = null;
  await withRetry('Sample Customer Seeding', async () => {
    for (const cust of customerUsers) {
      const cUser = await prisma.user.upsert({
        where: { email: cust.email },
        update: { accountStatus: 'ACTIVE', isEmailVerified: true },
        create: {
          email: cust.email,
          passwordHash,
          role: Role.CUSTOMER,
          accountStatus: 'ACTIVE',
          isEmailVerified: true,
          isPhoneVerified: true,
          isRegistrationFeePaid: true,
          customerProfile: {
            create: {
              name: cust.name,
              age: cust.age,
              gender: cust.gender,
              city: cust.city,
              interests: ['Fine Dining', 'Movies', 'Travel'],
              languages: ['English', 'Hindi'],
              bio: 'Active platform member who loves exploring new culinary spots and cultural events.',
            },
          },
        },
      });
      if (cust.email === 'customer@example.com') primaryCustomer = cUser;
    }
  });
  console.log('Created Sample Customer Users.');

  // Seamless Demo Email Migration (Updates existing 4 male demo emails to new female demo emails if present)
  const emailMigrations: Record<string, string> = {
    'sidharth.roy@demo.paireva.fun': 'rhea.deshmukh@demo.paireva.fun',
    'rahul.deshmukh@demo.paireva.fun': 'shreya.krishnan@demo.paireva.fun',
    'yash.patil@demo.paireva.fun': 'tanvi.deshpande@demo.paireva.fun',
    'nithin.kumar@demo.paireva.fun': 'ishita.naidu@demo.paireva.fun',
  };

  await withRetry('Demo Email Migration', async () => {
    for (const [oldEmail, newEmail] of Object.entries(emailMigrations)) {
      const oldUser = await prisma.user.findUnique({ where: { email: oldEmail } });
      const newAlreadyExists = await prisma.user.findUnique({ where: { email: newEmail } });
      if (oldUser && !newAlreadyExists) {
        await prisma.user.update({
          where: { id: oldUser.id },
          data: { email: newEmail },
        });
      }
    }
  });

  // 6. 24 Demo Companions Dataset (16 Female, 8 Male across 6 target cities)
  // Gender Breakdown per city:
  // Mumbai: 1 Male, 3 Female
  // Delhi NCR: 2 Male, 2 Female
  // Bengaluru: 1 Male, 3 Female
  // Goa: 2 Male, 2 Female
  // Pune: 1 Male, 3 Female
  // Hyderabad: 1 Male, 3 Female
  // Total: 8 Male / 16 Female / 24 Companions
  const companionData = [
    // MUMBAI (1 Male, 3 Female)
    {
      email: 'aria@companion.com',
      username: 'aria_sharma',
      fullName: 'Aria Sharma',
      displayName: 'Aria S.',
      age: 24,
      gender: 'Female',
      citySlug: 'mumbai',
      hourlyPrice: 899,
      bio: 'Culinary enthusiast and art lover based in South Mumbai. I enjoy exploring Bandra cafes, attending gallery openings, and having inspiring conversations over artisanal coffee.',
      languages: ['English', 'Hindi', 'French'],
      interests: ['Fine Dining', 'Art Galleries', 'Coffee', 'Indie Cinema'],
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: true,
      averageRating: 4.9,
      totalReviews: 18,
      activitySlugs: ['fine-dining', 'coffee-conversation', 'art-galleries', 'movie-companion'],
    },
    {
      email: 'tanya.kapoor@demo.paireva.fun',
      username: 'tanya_kapoor',
      fullName: 'Tanya Kapoor',
      displayName: 'Tanya K.',
      age: 25,
      gender: 'Female',
      citySlug: 'mumbai',
      hourlyPrice: 799,
      bio: 'Fashion stylist and nightlife lover. Whether it is sunset drinks overlooking Marine Drive or finding live acoustic sessions in Juhu, I bring positive energy and laughter.',
      languages: ['English', 'Hindi', 'Punjabi'],
      interests: ['Fashion', 'Nightlife', 'Live Music', 'Seafood'],
      profilePhoto: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: true,
      averageRating: 4.8,
      totalReviews: 14,
      activitySlugs: ['concerts-events', 'shopping', 'fine-dining'],
    },
    {
      email: 'rhea.deshmukh@demo.paireva.fun',
      username: 'rhea_deshmukh',
      fullName: 'Rhea Deshmukh',
      displayName: 'Rhea D.',
      age: 23,
      gender: 'Female',
      citySlug: 'mumbai',
      hourlyPrice: 749,
      bio: 'Media producer and fitness enthusiast. Love sunset walks along Carter Road, trying out popup food markets, and catching weekend indie movie screenings.',
      languages: ['English', 'Marathi', 'Hindi'],
      interests: ['Fitness', 'Movies', 'Cafes', 'Photography'],
      profilePhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: false,
      averageRating: 4.7,
      totalReviews: 9,
      activitySlugs: ['movie-companion', 'coffee-conversation', 'sightseeing'],
    },
    {
      email: 'kabir.mehta@demo.paireva.fun',
      username: 'kabir_mehta',
      fullName: 'Kabir Mehta',
      displayName: 'Kabir M.',
      age: 27,
      gender: 'Male',
      citySlug: 'mumbai',
      hourlyPrice: 699,
      bio: 'Corporate consultant and fitness enthusiast in BKC. Great companion for business networking dinners, premium sports screenings, or weekend coastal drives.',
      languages: ['English', 'Hindi', 'Gujarati'],
      interests: ['Fitness', 'Business', 'Road Trips', 'Cricket'],
      profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: true,
      averageRating: 4.9,
      totalReviews: 12,
      activitySlugs: ['tech-conference', 'fine-dining', 'sightseeing'],
    },

    // DELHI NCR (2 Male, 2 Female)
    {
      email: 'neha.sen@demo.paireva.fun',
      username: 'neha_sen',
      fullName: 'Neha Sen',
      displayName: 'Neha S.',
      age: 26,
      gender: 'Female',
      citySlug: 'delhi-ncr',
      hourlyPrice: 899,
      bio: 'Heritage architecture fan and foodie based in South Delhi. I organize food walks in Chandni Chowk, theater dates at Mandi House, and fine dining evenings.',
      languages: ['English', 'Hindi', 'Bengali'],
      interests: ['History', 'Food Walks', 'Theater', 'Travel'],
      profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: true,
      averageRating: 4.9,
      totalReviews: 21,
      activitySlugs: ['sightseeing', 'fine-dining', 'concerts-events'],
    },
    {
      email: 'simran.kaur@demo.paireva.fun',
      username: 'simran_kaur',
      fullName: 'Simran Kaur',
      displayName: 'Simran K.',
      age: 23,
      gender: 'Female',
      citySlug: 'delhi-ncr',
      hourlyPrice: 699,
      bio: 'Fashion design graduate and coffee addict from Gurgaon. Love shopping tours at Khan Market, photo walks, and spontaneous weekend food trips.',
      languages: ['English', 'Hindi', 'Punjabi'],
      interests: ['Fashion', 'Shopping', 'Coffee', 'Photography'],
      profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: false,
      averageRating: 4.8,
      totalReviews: 11,
      activitySlugs: ['shopping', 'coffee-conversation', 'art-galleries'],
    },
    {
      email: 'rohan@companion.com',
      username: 'rohan_verma',
      fullName: 'Rohan Verma',
      displayName: 'Rohan V.',
      age: 27,
      gender: 'Male',
      citySlug: 'delhi-ncr',
      hourlyPrice: 650,
      bio: 'Tech professional and heritage walk enthusiast in Delhi. Happy to accompany you to tech conferences, historical monuments, or relaxing cafe sessions.',
      languages: ['English', 'Hindi', 'Punjabi'],
      interests: ['Technology', 'History', 'Coffee', 'Photography'],
      profilePhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80',
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: true,
      averageRating: 4.8,
      totalReviews: 15,
      activitySlugs: ['tech-conference', 'sightseeing', 'coffee-conversation'],
    },
    {
      email: 'aditya.sharma@demo.paireva.fun',
      username: 'aditya_sharma',
      fullName: 'Aditya Sharma',
      displayName: 'Aditya S.',
      age: 28,
      gender: 'Male',
      citySlug: 'delhi-ncr',
      hourlyPrice: 799,
      bio: 'Architect and acoustic guitar player. Great companion for contemporary art exhibitions, dinner dates, and live concert events in Gurgaon.',
      languages: ['English', 'Hindi'],
      interests: ['Art', 'Music', 'Architecture', 'Fine Dining'],
      profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: false,
      averageRating: 4.9,
      totalReviews: 9,
      activitySlugs: ['art-galleries', 'concerts-events', 'fine-dining'],
    },

    // BENGALURU (1 Male, 3 Female)
    {
      email: 'ananya@companion.com',
      username: 'ananya_mehta',
      fullName: 'Ananya Mehta',
      displayName: 'Ananya M.',
      age: 25,
      gender: 'Female',
      citySlug: 'bengaluru',
      hourlyPrice: 750,
      bio: 'UX designer based in Indiranagar. Great companion for boutique shopping trips, live acoustic gigs, and exploring rooftop microbreweries.',
      languages: ['English', 'Kannada', 'Hindi'],
      interests: ['Design', 'Live Music', 'Craft Beer', 'Yoga'],
      profilePhoto: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: true,
      averageRating: 5.0,
      totalReviews: 19,
      activitySlugs: ['fine-dining', 'concerts-events', 'shopping'],
    },
    {
      email: 'divya.nair@demo.paireva.fun',
      username: 'divya_nair',
      fullName: 'Divya Nair',
      displayName: 'Divya N.',
      age: 24,
      gender: 'Female',
      citySlug: 'bengaluru',
      hourlyPrice: 899,
      bio: 'Tech marketer and bookworm in Koramangala. Always ready for artisan coffee sessions, tech mixers, and deep conversations on literature.',
      languages: ['English', 'Malayalam', 'Kannada', 'Hindi'],
      interests: ['Tech', 'Books', 'Cafes', 'Travel'],
      profilePhoto: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: true,
      averageRating: 4.9,
      totalReviews: 16,
      activitySlugs: ['coffee-conversation', 'tech-conference', 'fine-dining'],
    },
    {
      email: 'shreya.krishnan@demo.paireva.fun',
      username: 'shreya_krishnan',
      fullName: 'Shreya Krishnan',
      displayName: 'Shreya K.',
      age: 22,
      gender: 'Female',
      citySlug: 'bengaluru',
      hourlyPrice: 699,
      bio: 'Classical dancer and startup community manager. Love Cubbon Park morning walks, art exhibitions, and discovering quiet reading nooks in the city.',
      languages: ['English', 'Tamil', 'Kannada', 'Hindi'],
      interests: ['Dance', 'Startups', 'Nature Walks', 'Art'],
      profilePhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: false,
      averageRating: 4.8,
      totalReviews: 10,
      activitySlugs: ['art-galleries', 'coffee-conversation', 'sightseeing'],
    },
    {
      email: 'karthik.rao@demo.paireva.fun',
      username: 'karthik_rao',
      fullName: 'Karthik Rao',
      displayName: 'Karthik R.',
      age: 28,
      gender: 'Male',
      citySlug: 'bengaluru',
      hourlyPrice: 699,
      bio: 'Software engineer by day, weekend trekker in Nandi Hills. Perfect companion for filter coffee meetups, tech summits, and outdoor explorations.',
      languages: ['English', 'Kannada', 'Telugu', 'Hindi'],
      interests: ['Trekking', 'Filter Coffee', 'Tech', 'Fitness'],
      profilePhoto: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: false,
      averageRating: 4.8,
      totalReviews: 13,
      activitySlugs: ['sightseeing', 'coffee-conversation', 'tech-conference'],
    },

    // GOA (2 Male, 2 Female)
    {
      email: 'natasha.fernandes@demo.paireva.fun',
      username: 'natasha_fernandes',
      fullName: 'Natasha Fernandes',
      displayName: 'Natasha F.',
      age: 24,
      gender: 'Female',
      citySlug: 'goa',
      hourlyPrice: 999,
      bio: 'Goan local who loves beach shacks, sunset music sessions in Vagator, and heritage walks in Panjim. Let us make your trip memorable!',
      languages: ['English', 'Konkani', 'Hindi'],
      interests: ['Beach Life', 'Dance', 'Seafood', 'Sunset Spots'],
      profilePhoto: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: true,
      averageRating: 5.0,
      totalReviews: 24,
      activitySlugs: ['sightseeing', 'fine-dining', 'concerts-events'],
    },
    {
      email: 'zoya.khan@demo.paireva.fun',
      username: 'zoya_khan',
      fullName: 'Zoya Khan',
      displayName: 'Zoya K.',
      age: 26,
      gender: 'Female',
      citySlug: 'goa',
      hourlyPrice: 899,
      bio: 'Yoga instructor and travel photographer based in Anjuna. Great companion for cafe hops, serene beach strolls, and sunset cocktails.',
      languages: ['English', 'Hindi'],
      interests: ['Photography', 'Yoga', 'Travel', 'Wellness'],
      profilePhoto: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: false,
      averageRating: 4.8,
      totalReviews: 14,
      activitySlugs: ['coffee-conversation', 'sightseeing'],
    },
    {
      email: 'vikram@companion.com',
      username: 'vikram_singh',
      fullName: 'Vikram Singh',
      displayName: 'Vikram S.',
      age: 29,
      gender: 'Male',
      citySlug: 'goa',
      hourlyPrice: 900,
      bio: 'Certified travel guide and foodie in North Goa. Host for beachside sunset dinners, water sports excursions, and heritage villa tours.',
      languages: ['English', 'Hindi', 'Konkani'],
      interests: ['Water Sports', 'Seafood', 'Sailing', 'Photography'],
      profilePhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: true,
      averageRating: 4.9,
      totalReviews: 11,
      activitySlugs: ['sightseeing', 'fine-dining', 'movie-companion'],
    },
    {
      email: 'samuel.dcosta@demo.paireva.fun',
      username: 'samuel_dcosta',
      fullName: "Samuel D'Costa",
      displayName: 'Samuel D.',
      age: 27,
      gender: 'Male',
      citySlug: 'goa',
      hourlyPrice: 799,
      bio: 'Surfer and acoustic musician from South Goa. Happy to show you hidden secret coves, Portuguese heritage sites, and live reggae venues.',
      languages: ['English', 'Konkani', 'Hindi', 'Portuguese'],
      interests: ['Surfing', 'Live Music', 'Heritage', 'Beach'],
      profilePhoto: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80',
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: false,
      averageRating: 4.8,
      totalReviews: 7,
      activitySlugs: ['sightseeing', 'concerts-events'],
    },

    // PUNE (1 Male, 3 Female)
    {
      email: 'priya@companion.com',
      username: 'priya_kapoor',
      fullName: 'Priya Kapoor',
      displayName: 'Priya K.',
      age: 23,
      gender: 'Female',
      citySlug: 'pune',
      hourlyPrice: 599,
      bio: 'Literature student who loves cozy cafe talks in Prabhat Road, book discussions, art galleries, and calm city walks.',
      languages: ['English', 'Marathi', 'Hindi'],
      interests: ['Reading', 'Cafes', 'Art', 'Creative Writing'],
      profilePhoto: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: true,
      averageRating: 4.9,
      totalReviews: 12,
      activitySlugs: ['coffee-conversation', 'art-galleries'],
    },
    {
      email: 'isha.joshi@demo.paireva.fun',
      username: 'isha_joshi',
      fullName: 'Isha Joshi',
      displayName: 'Isha J.',
      age: 25,
      gender: 'Female',
      citySlug: 'pune',
      hourlyPrice: 699,
      bio: 'Koregaon Park foodie and Kathak practitioner. Love exploring artisan bakeries, street food markets, and classical music concerts.',
      languages: ['English', 'Marathi', 'Hindi'],
      interests: ['Dance', 'Bakeries', 'Culture', 'Classical Music'],
      profilePhoto: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: false,
      averageRating: 4.8,
      totalReviews: 8,
      activitySlugs: ['fine-dining', 'concerts-events'],
    },
    {
      email: 'tanvi.deshpande@demo.paireva.fun',
      username: 'tanvi_deshpande',
      fullName: 'Tanvi Deshpande',
      displayName: 'Tanvi D.',
      age: 24,
      gender: 'Female',
      citySlug: 'pune',
      hourlyPrice: 649,
      bio: 'Architectural photographer and trekker. Up for early morning Sinhagad fort climbs, photography walks in Old Pune, and coffee discussions.',
      languages: ['English', 'Marathi', 'Hindi'],
      interests: ['Trekking', 'Photography', 'Architecture', 'Coffee'],
      profilePhoto: 'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: false,
      averageRating: 4.7,
      totalReviews: 7,
      activitySlugs: ['sightseeing', 'coffee-conversation', 'art-galleries'],
    },
    {
      email: 'sameer.kulkarni@demo.paireva.fun',
      username: 'sameer_kulkarni',
      fullName: 'Sameer Kulkarni',
      displayName: 'Sameer K.',
      age: 28,
      gender: 'Male',
      citySlug: 'pune',
      hourlyPrice: 650,
      bio: 'Automotive engineer and outdoor enthusiast. Friendly, articulate, and great company for weekend road trips or cafe meetups in Baner.',
      languages: ['English', 'Marathi', 'Hindi'],
      interests: ['Road Trips', 'Fitness', 'Coffee', 'Automobiles'],
      profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80',
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: true,
      averageRating: 4.9,
      totalReviews: 15,
      activitySlugs: ['sightseeing', 'coffee-conversation'],
    },

    // HYDERABAD (1 Male, 3 Female)
    {
      email: 'sneha.reddy@demo.paireva.fun',
      username: 'sneha_reddy',
      fullName: 'Sneha Reddy',
      displayName: 'Sneha R.',
      age: 25,
      gender: 'Female',
      citySlug: 'hyderabad',
      hourlyPrice: 799,
      bio: 'Jubilee Hills foodie and biryani enthusiast. I love fine dining dates, boutique shopping in Gachibowli, and cozy cafe conversations.',
      languages: ['English', 'Telugu', 'Hindi'],
      interests: ['Fine Dining', 'Shopping', 'Coffee', 'Fashion'],
      profilePhoto: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: true,
      averageRating: 4.9,
      totalReviews: 17,
      activitySlugs: ['fine-dining', 'shopping', 'coffee-conversation'],
    },
    {
      email: 'kavya.rao@demo.paireva.fun',
      username: 'kavya_rao',
      fullName: 'Kavya Rao',
      displayName: 'Kavya R.',
      age: 24,
      gender: 'Female',
      citySlug: 'hyderabad',
      hourlyPrice: 699,
      bio: 'Data analyst and badminton player. Happy to accompany you to tech summits, heritage photography walks around Charminar, or movie screenings.',
      languages: ['English', 'Telugu', 'Hindi'],
      interests: ['Tech', 'Movies', 'Sports', 'Heritage'],
      profilePhoto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: false,
      averageRating: 4.8,
      totalReviews: 11,
      activitySlugs: ['movie-companion', 'tech-conference', 'sightseeing'],
    },
    {
      email: 'ishita.naidu@demo.paireva.fun',
      username: 'ishita_naidu',
      fullName: 'Ishita Naidu',
      displayName: 'Ishita N.',
      age: 23,
      gender: 'Female',
      citySlug: 'hyderabad',
      hourlyPrice: 729,
      bio: 'Interior designer and coffee lover from Banjara Hills. Enjoy sunset views near Durgam Cheruvu, art exhibitions, and friendly dialogues.',
      languages: ['English', 'Telugu', 'Hindi'],
      interests: ['Interior Design', 'Art', 'Coffee', 'Travel'],
      profilePhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: false,
      averageRating: 4.8,
      totalReviews: 8,
      activitySlugs: ['art-galleries', 'coffee-conversation', 'shopping'],
    },
    {
      email: 'arjun.varmabhupathi@demo.paireva.fun',
      username: 'arjun_varma',
      fullName: 'Arjun Varma',
      displayName: 'Arjun V.',
      age: 28,
      gender: 'Male',
      citySlug: 'hyderabad',
      hourlyPrice: 750,
      bio: 'Startup founder and car enthusiast. Excellent company for corporate dinners, tech networking mixers, and drives around Outer Ring Road.',
      languages: ['English', 'Telugu', 'Hindi'],
      interests: ['Startups', 'Road Trips', 'Fine Dining', 'Fitness'],
      profilePhoto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: true,
      averageRating: 4.9,
      totalReviews: 14,
      activitySlugs: ['tech-conference', 'fine-dining', 'sightseeing'],
    },
  ];

  let seededCount = 0;

  // In-memory collections for batch processing
  const companionActivityBatches: { companionId: string; activityId: string }[] = [];
  const verificationDocCandidates: {
    companionId: string;
    documentType: DocumentType;
    fileUrl: string;
    status: DocumentStatus;
    reviewNotes: string;
  }[] = [];
  const availabilitySlotBatches: {
    companionId: string;
    date: string;
    startTime: string;
    endTime: string;
    isBooked: boolean;
  }[] = [];

  // Generate 7 days date strings
  const today = new Date();
  const dateStrings: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dateStrings.push(d.toISOString().split('T')[0]);
  }

  const timeSlots = [
    { startTime: '10:00', endTime: '12:00' },
    { startTime: '14:00', endTime: '16:00' },
    { startTime: '18:00', endTime: '20:00' },
    { startTime: '20:00', endTime: '22:00' },
  ];

  for (const comp of companionData) {
    const cityId = cityMap.get(comp.citySlug);
    if (!cityId) continue;

    const { companionProfile } = await withRetry(`Companion Profile Seeding: ${comp.email}`, async () => {
      const user = await prisma.user.upsert({
        where: { email: comp.email },
        update: {
          accountStatus: 'ACTIVE',
          isEmailVerified: true,
          isRegistrationFeePaid: true,
        },
        create: {
          email: comp.email,
          passwordHash,
          role: Role.COMPANION,
          accountStatus: 'ACTIVE',
          isEmailVerified: true,
          isPhoneVerified: true,
          isRegistrationFeePaid: true,
        },
      });

      const existingProfile = await prisma.companionProfile.findUnique({
        where: { userId: user.id },
      });

      // Preserve admin-uploaded photos (e.g., uploaded via Vercel blob, data URL, or custom upload)
      const isCustomPhoto =
        existingProfile?.profilePhoto &&
        !existingProfile.profilePhoto.includes('images.unsplash.com');

      const photoToUse = isCustomPhoto
        ? existingProfile.profilePhoto
        : comp.profilePhoto;

      const profile = await prisma.companionProfile.upsert({
        where: { userId: user.id },
        update: {
          username: comp.username,
          fullName: comp.fullName,
          displayName: comp.displayName,
          age: comp.age,
          gender: comp.gender,
          cityId,
          hourlyPrice: comp.hourlyPrice,
          bio: comp.bio,
          languages: comp.languages,
          interests: comp.interests,
          profilePhoto: photoToUse,
          gallery: comp.gallery,
          verificationStatus: comp.verificationStatus,
          isFeatured: comp.isFeatured,
          averageRating: comp.averageRating,
          totalReviews: comp.totalReviews,
        },
        create: {
          userId: user.id,
          username: comp.username,
          fullName: comp.fullName,
          displayName: comp.displayName,
          age: comp.age,
          gender: comp.gender,
          cityId,
          hourlyPrice: comp.hourlyPrice,
          bio: comp.bio,
          languages: comp.languages,
          interests: comp.interests,
          profilePhoto: photoToUse,
          gallery: comp.gallery,
          verificationStatus: comp.verificationStatus,
          isFeatured: comp.isFeatured,
          averageRating: comp.averageRating,
          totalReviews: comp.totalReviews,
        },
      });

      return { user, companionProfile: profile };
    });

    // Collect activities in memory
    for (const actSlug of comp.activitySlugs) {
      const actId = activityMap.get(actSlug);
      if (actId) {
        companionActivityBatches.push({
          companionId: companionProfile.id,
          activityId: actId,
        });
      }
    }

    // Collect sample verification doc candidate
    verificationDocCandidates.push({
      companionId: companionProfile.id,
      documentType: DocumentType.GOVT_ID,
      fileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
      status: DocumentStatus.APPROVED,
      reviewNotes: 'Govt ID verified by system admin.',
    });

    // Collect availability slots in memory (7 days x 4 slots = 28 per companion)
    for (const dateStr of dateStrings) {
      for (const slot of timeSlots) {
        availabilitySlotBatches.push({
          companionId: companionProfile.id,
          date: dateStr,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isBooked: false,
        });
      }
    }

    seededCount++;
  }

  // BATCH OPERATION 1: Companion Activities
  if (companionActivityBatches.length > 0) {
    await withRetry('Batch Insert Companion Activities', async () => {
      await prisma.companionActivity.createMany({
        data: companionActivityBatches,
        skipDuplicates: true,
      });
    });
  }

  // BATCH OPERATION 2: Verification Documents (Idempotent check)
  if (verificationDocCandidates.length > 0) {
    await withRetry('Batch Insert Verification Documents', async () => {
      const companionIds = verificationDocCandidates.map((d) => d.companionId);
      const existingDocs = await prisma.verificationDocument.findMany({
        where: { companionId: { in: companionIds } },
        select: { companionId: true },
      });
      const existingDocCompanionIds = new Set(existingDocs.map((d) => d.companionId));

      const docsToCreate = verificationDocCandidates.filter(
        (d) => !existingDocCompanionIds.has(d.companionId)
      );

      if (docsToCreate.length > 0) {
        await prisma.verificationDocument.createMany({
          data: docsToCreate,
        });
      }
    });
  }

  // BATCH OPERATION 3: Availability Slots (Efficient batching in chunks of 100)
  if (availabilitySlotBatches.length > 0) {
    const slotChunks = chunkArray(availabilitySlotBatches, 100);
    let chunkIndex = 1;
    for (const chunk of slotChunks) {
      await withRetry(`Batch Insert Availability Slots (Chunk ${chunkIndex}/${slotChunks.length})`, async () => {
        await prisma.availabilitySlot.createMany({
          data: chunk,
          skipDuplicates: true,
        });
      });
      chunkIndex++;
    }
  }

  // 7. Sample Conversation & Messages for Rajesh Kumar & Aria Sharma
  await withRetry('Sample Conversation & Messages', async () => {
    const ariaUser = await prisma.user.findUnique({ where: { email: 'aria@companion.com' } });
    if (ariaUser && primaryCustomer) {
      const existingConv = await prisma.conversation.findFirst({
        where: { customerId: primaryCustomer.id, companionUserId: ariaUser.id },
      });

      const conv = existingConv || await prisma.conversation.create({
        data: {
          customerId: primaryCustomer.id,
          companionUserId: ariaUser.id,
          lastMessageAt: new Date(),
        },
      });

      const existingMsgCount = await prisma.message.count({
        where: { conversationId: conv.id },
      });

      if (existingMsgCount === 0) {
        const sampleMsgs = [
          { senderId: primaryCustomer.id, text: "Hi Aria, I saw your profile and loved your interest in fine dining and art!" },
          { senderId: ariaUser.id, text: "Hello Rajesh! Thank you so much. I love exploring culinary spots in Mumbai." },
          { senderId: primaryCustomer.id, text: "Would you be open for dinner companionship this Friday evening?" },
          { senderId: ariaUser.id, text: "Sounds wonderful! Feel free to book a slot for Friday via my profile." },
        ];

        for (const msg of sampleMsgs) {
          await prisma.message.create({
            data: {
              conversationId: conv.id,
              senderId: msg.senderId,
              text: msg.text,
            },
          });
        }
      }
    }
  });

  // Print Summary Breakdown as requested
  const allCompanions = await prisma.companionProfile.findMany({
    include: { city: true },
  });

  const citySummary: Record<string, { male: number; female: number }> = {
    'Mumbai': { male: 0, female: 0 },
    'Delhi NCR': { male: 0, female: 0 },
    'Bengaluru': { male: 0, female: 0 },
    'Goa': { male: 0, female: 0 },
    'Pune': { male: 0, female: 0 },
    'Hyderabad': { male: 0, female: 0 },
  };

  let totalMale = 0;
  let totalFemale = 0;

  for (const c of allCompanions) {
    const cityName = c.city.name;
    if (citySummary[cityName]) {
      if (c.gender === 'Female') {
        citySummary[cityName].female++;
        totalFemale++;
      } else if (c.gender === 'Male') {
        citySummary[cityName].male++;
        totalMale++;
      }
    }
  }

  console.log('\n========================================');
  console.log('DEMO COMPANION SEEDING SUMMARY');
  console.log('========================================');
  for (const [cityName, counts] of Object.entries(citySummary)) {
    console.log(`${cityName}: ${counts.male} Male / ${counts.female} Female`);
  }
  console.log('----------------------------------------');
  console.log(`Total: ${totalMale} Male / ${totalFemale} Female / ${allCompanions.length} Companions`);
  console.log('========================================\n');

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
