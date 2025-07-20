const mongoose = require('mongoose');
const config = require('./environment');

const connectDB = async () => {
  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(config.MONGODB_URI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Database utilities
const clearDatabase = async () => {
  if (config.NODE_ENV !== 'test') {
    throw new Error('Clear database only allowed in test environment');
  }
  
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    await collections[key].deleteMany();
  }
};

const seedDatabase = async () => {
  // Import models
  const User = require('../models/User');
  const Topic = require('../models/Topic');
  
  // Clear existing data
  await User.deleteMany({});
  await Topic.deleteMany({});
  
  // Create test users
  const testUsers = [
    {
      username: 'demo_user',
      email: 'demo@debate.coach',
      password: 'Demo123!',
      level: 5,
      xp: 450,
      totalDebates: 15
    },
    {
      username: 'test_champion',
      email: 'champion@debate.coach',
      password: 'Champ123!',
      level: 10,
      xp: 2500,
      totalDebates: 50
    }
  ];
  
  const users = await User.create(testUsers);
  
  // Create debate topics
  const debateTopics = [
    {
      title: 'AI in Education',
      description: 'Should AI replace traditional teaching methods?',
      category: 'Education',
      difficulty: 'beginner',
      prompts: [
        'Consider personalized learning benefits',
        'Think about human connection importance',
        'Address digital divide concerns'
      ]
    },
    {
      title: 'Climate Action',
      description: 'Individual actions vs systemic change for climate?',
      category: 'Environment',
      difficulty: 'intermediate',
      prompts: [
        'Evaluate personal carbon footprint impact',
        'Discuss corporate responsibility',
        'Consider policy changes needed'
      ]
    },
    {
      title: 'Universal Basic Income',
      description: 'Should governments provide UBI to all citizens?',
      category: 'Economics',
      difficulty: 'advanced',
      prompts: [
        'Analyze economic sustainability',
        'Consider workforce motivation',
        'Evaluate implementation challenges'
      ]
    }
  ];
  
  await Topic.create(debateTopics);
  
  console.log('✅ Database seeded successfully');
  return { users };
};

module.exports = {
  connectDB,
  clearDatabase,
  seedDatabase
};
