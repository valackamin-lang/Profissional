import User from '../models/User';
import Role from '../models/Role';
import Profile from '../models/Profile';
import Job from '../models/Job';
import Event from '../models/Event';
import Mentorship from '../models/Mentorship';
import FeedItem from '../models/FeedItem';
import { hashPassword } from '../utils/bcrypt';
import logger from '../config/logger';

export const seedSampleData = async (): Promise<void> => {
  try {
    logger.info('🌱 Seeding sample data...');

    const studentRole = await Role.findOne({ where: { name: 'STUDENT' } });
    const mentorRole = await Role.findOne({ where: { name: 'MENTOR' } });
    const partnerRole = await Role.findOne({ where: { name: 'PARTNER' } });

    if (!studentRole || !mentorRole || !partnerRole) {
      throw new Error('Roles not found. Run roles seeder first.');
    }

    // Create sample students
    const students = [];
    for (let i = 1; i <= 3; i++) {
      const hashedPassword = await hashPassword('student123');
      const user = await User.findOrCreate({
        where: { email: `student${i}@example.com` },
        defaults: {
          email: `student${i}@example.com`,
          password: hashedPassword,
          roleId: studentRole.id,
          isEmailVerified: true,
        },
      });

      if (user[1]) {
        // User was created, create profile
        await Profile.create({
          userId: user[0].id,
          type: 'STUDENT',
          firstName: `Estudante`,
          lastName: `${i}`,
          bio: `Estudante de exemplo ${i}`,
          approvalStatus: 'APPROVED',
        });
        students.push(user[0]);
        logger.info(`✅ Created student${i}@example.com`);
      }
    }

    // Create sample mentor
    const mentorPassword = await hashPassword('mentor123');
    const mentorUser = await User.findOrCreate({
      where: { email: 'mentor@example.com' },
      defaults: {
        email: 'mentor@example.com',
        password: mentorPassword,
        roleId: mentorRole.id,
        isEmailVerified: true,
      },
    });

    let mentorProfile;
    if (mentorUser[1]) {
      mentorProfile = await Profile.create({
        userId: mentorUser[0].id,
        type: 'MENTOR',
        firstName: 'João',
        lastName: 'Mentor',
        bio: 'Mentor experiente em desenvolvimento de software',
        approvalStatus: 'APPROVED',
      });
      logger.info('✅ Created mentor@example.com');
    } else {
      mentorProfile = await Profile.findOne({ where: { userId: mentorUser[0].id } });
    }

    // Create sample partner
    const partnerPassword = await hashPassword('partner123');
    const partnerUser = await User.findOrCreate({
      where: { email: 'partner@example.com' },
      defaults: {
        email: 'partner@example.com',
        password: partnerPassword,
        roleId: partnerRole.id,
        isEmailVerified: true,
      },
    });

    let partnerProfile;
    if (partnerUser[1]) {
      partnerProfile = await Profile.create({
        userId: partnerUser[0].id,
        type: 'COMPANY',
        companyName: 'Tech Solutions Inc.',
        companyDocument: '50001234567', // NIF angolano (exemplo)
        bio: 'Empresa parceira especializada em tecnologia',
        approvalStatus: 'APPROVED',
      });
      logger.info('✅ Created partner@example.com');
    } else {
      partnerProfile = await Profile.findOne({ where: { userId: partnerUser[0].id } });
    }

    // Create sample jobs
    if (partnerProfile) {
      const jobs = [
        {
          title: 'Desenvolvedor Full Stack Júnior',
          description: 'Vaga para desenvolvedor full stack júnior com conhecimento em React, Node.js e PostgreSQL.',
          company: 'Tech Solutions Inc.',
          location: 'Luanda, Angola',
          type: 'FULL_TIME' as const,
          requirements: 'Conhecimento em JavaScript, React, Node.js. Experiência com Git.',
          salaryMin: 4000,
          salaryMax: 6000,
          postedBy: partnerProfile.id,
          status: 'OPEN' as const,
        },
        {
          title: 'Estágio em Desenvolvimento Web',
          description: 'Oportunidade de estágio para estudantes de TI interessados em desenvolvimento web.',
          company: 'Tech Solutions Inc.',
          location: 'Remoto',
          type: 'INTERNSHIP' as const,
          requirements: 'Cursando Ciência da Computação ou áreas relacionadas.',
          salaryMin: 1500,
          salaryMax: 2000,
          postedBy: partnerProfile.id,
          status: 'OPEN' as const,
        },
      ];

      for (const jobData of jobs) {
        const [job] = await Job.findOrCreate({
          where: { title: jobData.title, postedBy: partnerProfile.id },
          defaults: jobData,
        });

        if (job) {
          // Add to feed
          await FeedItem.findOrCreate({
            where: { type: 'JOB', itemId: job.id },
            defaults: {
              type: 'JOB',
              itemId: job.id,
              priority: 5,
            },
          });
          logger.info(`✅ Created job: ${job.title}`);
        }
      }
    }

    // Create sample events
    if (partnerProfile) {
      const events = [
        {
          title: 'Workshop de React Avançado',
          description: 'Workshop completo sobre hooks avançados, performance e boas práticas em React.',
          type: 'WORKSHOP' as const,
          organizerId: partnerProfile.id,
          eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          price: 50,
          maxAttendees: 50,
          status: 'UPCOMING' as const,
        },
        {
          title: 'Webinar: Carreira em Tech',
          description: 'Webinar sobre como construir uma carreira de sucesso na área de tecnologia.',
          type: 'WEBINAR' as const,
          organizerId: partnerProfile.id,
          eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          price: 0,
          maxAttendees: 100,
          status: 'UPCOMING' as const,
        },
      ];

      for (const eventData of events) {
        const [event] = await Event.findOrCreate({
          where: { title: eventData.title, organizerId: partnerProfile.id },
          defaults: eventData,
        });

        if (event) {
          // Add to feed
          await FeedItem.findOrCreate({
            where: { type: 'EVENT', itemId: event.id },
            defaults: {
              type: 'EVENT',
              itemId: event.id,
              priority: 5,
            },
          });
          logger.info(`✅ Created event: ${event.title}`);
        }
      }
    }

    // Create sample mentorships
    if (mentorProfile) {
      const mentorships = [
        {
          title: 'Mentoria em Desenvolvimento Full Stack',
          description: 'Mentoria personalizada para desenvolvedores que querem se tornar full stack.',
          mentorId: mentorProfile.id,
          price: 200,
          duration: 10,
          status: 'ACTIVE' as const,
          maxStudents: 5,
        },
        {
          title: 'Mentoria em Carreira Tech',
          description: 'Acompanhamento na construção de carreira na área de tecnologia.',
          mentorId: mentorProfile.id,
          price: 150,
          duration: 8,
          status: 'ACTIVE' as const,
          maxStudents: 10,
        },
      ];

      for (const mentorshipData of mentorships) {
        const [mentorship] = await Mentorship.findOrCreate({
          where: { title: mentorshipData.title, mentorId: mentorProfile.id },
          defaults: mentorshipData,
        });

        if (mentorship) {
          // Add to feed
          await FeedItem.findOrCreate({
            where: { type: 'MENTORSHIP', itemId: mentorship.id },
            defaults: {
              type: 'MENTORSHIP',
              itemId: mentorship.id,
              priority: 5,
            },
          });
          logger.info(`✅ Created mentorship: ${mentorship.title}`);
        }
      }
    }

    logger.info('✅ Sample data seeded successfully.');
    logger.info('');
    logger.info('📝 Sample accounts created:');
    logger.info('   Students: student1@example.com, student2@example.com, student3@example.com (password: student123)');
    logger.info('   Mentor: mentor@example.com (password: mentor123)');
    logger.info('   Partner: partner@example.com (password: partner123)');
  } catch (error) {
    logger.error('❌ Error seeding sample data:', error);
    throw error;
  }
};
