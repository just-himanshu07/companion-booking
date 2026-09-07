import { PrismaClient, Role, VerificationStatus, DocumentType, DocumentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Companion Booking Marketplace database...');

  // 1. Platform Settings
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
    update: {},
    create: {
      key: 'PLATFORM_COMMISSION_PERCENT',
      value: '15',
      description: 'Default platform commission percentage on bookings',
    },
  });

  // 2. Cities
  const cities = [
    { name: 'Mumbai', state: 'Maharashtra', slug: 'mumbai', isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80' },
    { name: 'Delhi NCR', state: 'Delhi', slug: 'delhi-ncr', isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80' },
    { name: 'Bengaluru', state: 'Karnataka', slug: 'bengaluru', isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80' },
    { name: 'Goa', state: 'Goa', slug: 'goa', isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80' },
    { name: 'Hyderabad', state: 'Telangana', slug: 'hyderabad', isPopular: false, imageUrl: 'https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=800&q=80' },
    { name: 'Pune', state: 'Maharashtra', slug: 'pune', isPopular: false, imageUrl: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=800&q=80' },
    { name: 'Jaipur', state: 'Rajasthan', slug: 'jaipur', isPopular: true, imageUrl: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80' },
  ];

  const cityMap = new Map<string, string>();
  for (const c of cities) {
    const city = await prisma.city.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
    cityMap.set(c.slug, city.id);
  }

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
  for (const act of activities) {
    const activity = await prisma.activity.upsert({
      where: { slug: act.slug },
      update: {},
      create: act,
    });
    activityMap.set(act.slug, activity.id);
  }

  // 4. Admin User
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@companion.com' },
    update: {},
    create: {
      email: 'admin@companion.com',
      passwordHash,
      role: Role.ADMIN,
      isEmailVerified: true,
      isPhoneVerified: true,
      isRegistrationFeePaid: true,
    },
  });
  console.log('Created Admin User:', adminUser.email);

  // 5. Customer User
  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      passwordHash,
      role: Role.CUSTOMER,
      isEmailVerified: true,
      isPhoneVerified: true,
      isRegistrationFeePaid: true,
      customerProfile: {
        create: {
          name: 'Rajesh Kumar',
          age: 28,
          gender: 'Male',
          city: 'Mumbai',
          interests: ['Fine Dining', 'Movies', 'Tech'],
          languages: ['English', 'Hindi'],
          bio: 'Passionate tech entrepreneur who loves exploring new culinary spots and attending cultural events.',
        },
      },
    },
  });
  console.log('Created Customer User:', customerUser.email);

  // 6. Sample Companions
  const companionData = [
    {
      email: 'aria@companion.com',
      username: 'aria_sharma',
      fullName: 'Aria Sharma',
      displayName: 'Aria S.',
      age: 24,
      gender: 'Female',
      citySlug: 'mumbai',
      hourlyPrice: 800,
      bio: 'Enthusiastic culinary lover and art historian. I love exploring upscale dining spots, attending art gallery openings, and having deep discussions about culture and cinema.',
      languages: ['English', 'Hindi', 'French'],
      interests: ['Culinary Arts', 'Indie Films', 'Classical Music', 'Architecture'],
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80'
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: true,
      averageRating: 4.9,
      totalReviews: 12,
      activitySlugs: ['fine-dining', 'coffee-conversation', 'movie-companion', 'art-galleries']
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
      bio: 'Tech professional and heritage walk enthusiast in Delhi. Happy to accompany you to tech conferences, historical monuments, or relaxing coffee sessions.',
      languages: ['English', 'Hindi', 'Punjabi'],
      interests: ['Technology', 'History', 'Coffee', 'Photography'],
      profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80'
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: true,
      averageRating: 4.8,
      totalReviews: 9,
      activitySlugs: ['tech-conference', 'sightseeing', 'coffee-conversation']
    },
    {
      email: 'ananya@companion.com',
      username: 'ananya_mehta',
      fullName: 'Ananya Mehta',
      displayName: 'Ananya M.',
      age: 25,
      gender: 'Female',
      citySlug: 'bengaluru',
      hourlyPrice: 750,
      bio: 'Fashion designer based in Indiranagar. Great companion for shopping trips, live acoustic concerts, and exploring Bengaluru rooftop dining.',
      languages: ['English', 'Kannada', 'Hindi'],
      interests: ['Fashion', 'Live Music', 'Gourmet Food', 'Yoga'],
      profilePhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: true,
      averageRating: 5.0,
      totalReviews: 15,
      activitySlugs: ['fine-dining', 'concerts-events', 'shopping']
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
      bio: 'Certified travel guide and foodie in North Goa. Perfect host for beachside sunset dinners, water sports events, and sightseeing tours.',
      languages: ['English', 'Hindi', 'Konkani'],
      interests: ['Beach Life', 'Seafood', 'Photography', 'Sailing'],
      profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80'
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      isFeatured: false,
      averageRating: 4.9,
      totalReviews: 8,
      activitySlugs: ['sightseeing', 'fine-dining', 'movie-companion']
    },
    {
      email: 'priya@companion.com',
      username: 'priya_kapoor',
      fullName: 'Priya Kapoor',
      displayName: 'Priya K.',
      age: 23,
      gender: 'Female',
      citySlug: 'pune',
      hourlyPrice: 500,
      bio: 'Literature student who enjoys quiet cafe conversations, book club meetings, and museum tours.',
      languages: ['English', 'Marathi', 'Hindi'],
      interests: ['Reading', 'Coffee', 'Art', 'Writing'],
      profilePhoto: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      gallery: [],
      verificationStatus: VerificationStatus.PENDING,
      isFeatured: false,
      averageRating: 0.0,
      totalReviews: 0,
      activitySlugs: ['coffee-conversation', 'art-galleries']
    }
  ];

  for (const comp of companionData) {
    const cityId = cityMap.get(comp.citySlug);
    if (!cityId) continue;

    const user = await prisma.user.upsert({
      where: { email: comp.email },
      update: {},
      create: {
        email: comp.email,
        passwordHash,
        role: Role.COMPANION,
        isEmailVerified: true,
        isPhoneVerified: true,
        isRegistrationFeePaid: true,
      },
    });

    const companionProfile = await prisma.companionProfile.upsert({
      where: { userId: user.id },
      update: {},
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
        profilePhoto: comp.profilePhoto,
        gallery: comp.gallery,
        verificationStatus: comp.verificationStatus,
        isFeatured: comp.isFeatured,
        averageRating: comp.averageRating,
        totalReviews: comp.totalReviews,
      },
    });

    // Link Activities
    for (const actSlug of comp.activitySlugs) {
      const actId = activityMap.get(actSlug);
      if (actId) {
        await prisma.companionActivity.upsert({
          where: {
            companionId_activityId: {
              companionId: companionProfile.id,
              activityId: actId,
            },
          },
          update: {},
          create: {
            companionId: companionProfile.id,
            activityId: actId,
          },
        });
      }
    }

    // Add sample verification document
    if (comp.verificationStatus === VerificationStatus.VERIFIED) {
      await prisma.verificationDocument.create({
        data: {
          companionId: companionProfile.id,
          documentType: DocumentType.GOVT_ID,
          fileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
          status: DocumentStatus.APPROVED,
          reviewNotes: 'Govt ID verified by admin.',
        },
      });
    } else if (comp.verificationStatus === VerificationStatus.PENDING) {
      await prisma.verificationDocument.create({
        data: {
          companionId: companionProfile.id,
          documentType: DocumentType.GOVT_ID,
          fileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
          status: DocumentStatus.PENDING,
          reviewNotes: 'Awaiting admin review.',
        },
      });
    }

    // Add availability slots for next 7 days
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      const timeSlots = [
        { startTime: '10:00', endTime: '12:00' },
        { startTime: '14:00', endTime: '16:00' },
        { startTime: '18:00', endTime: '20:00' },
        { startTime: '20:00', endTime: '22:00' },
      ];

      for (const slot of timeSlots) {
        await prisma.availabilitySlot.upsert({
          where: {
            companionId_date_startTime: {
              companionId: companionProfile.id,
              date: dateStr,
              startTime: slot.startTime,
            },
          },
          update: {},
          create: {
            companionId: companionProfile.id,
            date: dateStr,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isBooked: false,
          },
        });
      }
    }
  }

  // 7. Sample Conversation & Messages
  const ariaUser = await prisma.user.findUnique({ where: { email: 'aria@companion.com' } });
  if (ariaUser && customerUser) {
    const existingConv = await prisma.conversation.findFirst({
      where: { customerId: customerUser.id, companionUserId: ariaUser.id },
    });

    const conv = existingConv || await prisma.conversation.create({
      data: {
        customerId: customerUser.id,
        companionUserId: ariaUser.id,
        lastMessageAt: new Date(),
      },
    });

    const sampleMsgs = [
      { senderId: customerUser.id, text: "Hi Aria, I saw your profile and loved your interest in fine dining and art!" },
      { senderId: ariaUser.id, text: "Hello Rajesh! Thank you so much. I love exploring culinary spots in Mumbai." },
      { senderId: customerUser.id, text: "Would you be open for dinner companionship this Friday evening?" },
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
    console.log('Seeded sample conversation and messages between Rajesh and Aria.');
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

