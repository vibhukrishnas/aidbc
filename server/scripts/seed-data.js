require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const config = require('../src/config/environment');
const Topic = require('../src/models/Topic');
const User = require('../src/models/User');

// Sample topics for the hackathon demo
const sampleTopics = [
  {
    title: "Should artificial intelligence replace human teachers in schools?",
    description: "Debate the role of AI in education and whether technology can effectively replace human educators in the classroom.",
    category: "education",
    difficulty: "intermediate",
    tags: ["AI", "education", "technology", "teaching"],
    structure: {
      prompt: "Present your argument on whether AI should replace human teachers, considering both benefits and drawbacks.",
      context: "With advancing AI technology, there's growing debate about automation in education.",
      keyPoints: [
        "Personalized learning capabilities",
        "Cost effectiveness and scalability",
        "Human emotional connection and empathy",
        "Complex problem-solving and creativity"
      ]
    },
    translations: {
      hi: {
        title: "क्या कृत्रिम बुद्धिमत्ता को स्कूलों में मानव शिक्षकों को बदलना चाहिए?",
        description: "शिक्षा में AI की भूमिका पर बहस करें और क्या तकनीक कक्षा में मानव शिक्षकों को प्रभावी रूप से बदल सकती है।"
      }
    },
    createdBy: null, // Will be set to admin user
    status: "approved",
    isFeatured: true
  },
  {
    title: "Is social media doing more harm than good to society?",
    description: "Examine the impact of social media platforms on society, relationships, and mental health.",
    category: "social",
    difficulty: "beginner",
    tags: ["social media", "society", "mental health", "communication"],
    structure: {
      prompt: "Argue whether social media's negative impacts outweigh its benefits for society.",
      context: "Social media has transformed how we communicate and share information globally.",
      keyPoints: [
        "Connection and global communication",
        "Information sharing and awareness",
        "Mental health and addiction concerns",
        "Privacy and misinformation issues"
      ]
    },
    createdBy: null,
    status: "approved",
    isFeatured: true
  },
  {
    title: "Should renewable energy completely replace fossil fuels by 2030?",
    description: "Debate the feasibility and necessity of transitioning to 100% renewable energy within this decade.",
    category: "environment",
    difficulty: "advanced",
    tags: ["renewable energy", "climate change", "environment", "sustainability"],
    structure: {
      prompt: "Present your case for or against complete renewable energy transition by 2030.",
      context: "Climate change urgency versus economic and practical implementation challenges.",
      keyPoints: [
        "Environmental impact and climate goals",
        "Economic costs and job transitions",
        "Technology readiness and infrastructure",
        "Energy security and reliability"
      ]
    },
    createdBy: null,
    status: "approved",
    isFeatured: false
  },
  {
    title: "Should cryptocurrency be regulated by governments?",
    description: "Discuss whether governments should impose regulations on cryptocurrency markets and transactions.",
    category: "economics",
    difficulty: "intermediate",
    tags: ["cryptocurrency", "regulation", "finance", "government"],
    structure: {
      prompt: "Argue for or against government regulation of cryptocurrency markets.",
      context: "The growing crypto market faces questions about oversight and consumer protection.",
      keyPoints: [
        "Financial stability and consumer protection",
        "Innovation and technological freedom",
        "Money laundering and illegal activities",
        "Economic sovereignty and control"
      ]
    },
    createdBy: null,
    status: "approved",
    isFeatured: false
  },
  {
    title: "Is remote work better than office work for productivity?",
    description: "Compare the effectiveness of remote work versus traditional office environments for employee productivity.",
    category: "social",
    difficulty: "beginner",
    tags: ["remote work", "productivity", "workplace", "technology"],
    structure: {
      prompt: "Debate whether remote work or office work leads to better productivity outcomes.",
      context: "The pandemic has accelerated remote work adoption across industries.",
      keyPoints: [
        "Flexibility and work-life balance",
        "Collaboration and team dynamics",
        "Distractions and home environment",
        "Technology tools and communication"
      ]
    },
    createdBy: null,
    status: "approved",
    isFeatured: false
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create admin user if doesn't exist
    let adminUser = await User.findOne({ email: 'admin@debate-coach.ai' });
    
    if (!adminUser) {
      adminUser = new User({
        username: 'admin',
        email: 'admin@debate-coach.ai',
        password: 'admin123',
        role: 'admin',
        profile: {
          firstName: 'Admin',
          lastName: 'User'
        },
        isVerified: true
      });
      await adminUser.save();
      console.log('✅ Admin user created');
    }

    // Create demo student user
    let demoUser = await User.findOne({ email: 'demo@student.com' });
    
    if (!demoUser) {
      demoUser = new User({
        username: 'demo_student',
        email: 'demo@student.com',
        password: 'demo123',
        role: 'student',
        profile: {
          firstName: 'Demo',
          lastName: 'Student',
          grade: '10th',
          school: 'Demo High School'
        },
        preferences: {
          language: 'en',
          difficulty: 'beginner'
        },
        stats: {
          totalXP: 250,
          level: 2,
          totalDebates: 3
        },
        isVerified: true
      });
      await demoUser.save();
      console.log('✅ Demo student user created');
    }

    // Clear existing topics and create new ones
    await Topic.deleteMany({});
    
    // Set admin user as creator for all topics
    const topicsWithCreator = sampleTopics.map(topic => ({
      ...topic,
      createdBy: adminUser._id
    }));

    await Topic.insertMany(topicsWithCreator);
    console.log(`✅ Created ${topicsWithCreator.length} sample topics`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • Admin user: admin@debate-coach.ai (password: admin123)`);
    console.log(`   • Demo user: demo@student.com (password: demo123)`);
    console.log(`   • Topics created: ${topicsWithCreator.length}`);
    console.log(`   • Categories: ${[...new Set(topicsWithCreator.map(t => t.category))].join(', ')}`);
    
    console.log('\n🚀 You can now start the server with: npm run dev');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;