// MongoDB Initialization Script
// This script runs when MongoDB container starts for the first time

// Switch to the debate-coach-ai database
db = db.getSiblingDB('debate-coach-ai');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['username', 'email', 'password'],
      properties: {
        username: {
          bsonType: 'string',
          minLength: 3,
          maxLength: 30,
          description: 'Username must be a string between 3-30 characters'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
          description: 'Email must be a valid email address'
        }
      }
    }
  }
});

db.createCollection('topics', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'description', 'category', 'difficulty'],
      properties: {
        title: {
          bsonType: 'string',
          minLength: 5,
          maxLength: 100
        },
        category: {
          bsonType: 'string',
          enum: ['Education', 'Technology', 'Environment', 'Politics', 'Economics', 'Ethics', 'Science', 'Society', 'Culture', 'Health']
        },
        difficulty: {
          bsonType: 'string',
          enum: ['beginner', 'intermediate', 'advanced']
        }
      }
    }
  }
});

db.createCollection('debates');
db.createCollection('achievements');
db.createCollection('analytics');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ 'gamification.level': -1 });
db.users.createIndex({ 'gamification.totalXP': -1 });

db.topics.createIndex({ category: 1, difficulty: 1 });
db.topics.createIndex({ tags: 1 });
db.topics.createIndex({ isActive: 1, isFeatured: -1 });

db.debates.createIndex({ user: 1, createdAt: -1 });
db.debates.createIndex({ topic: 1 });
db.debates.createIndex({ 'feedback.overallScore': -1 });

db.achievements.createIndex({ id: 1 }, { unique: true });
db.achievements.createIndex({ category: 1 });

db.analytics.createIndex({ user: 1, timestamp: -1 });
db.analytics.createIndex({ eventType: 1, timestamp: -1 });
db.analytics.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

print('Database initialized successfully with collections and indexes!');

// Insert some sample data
db.topics.insertMany([
  {
    title: "Technology should be regulated more strictly",
    description: "Debate whether governments should impose stricter regulations on technology companies.",
    category: "Technology",
    difficulty: "intermediate",
    prompts: ["Consider privacy implications", "Think about innovation vs regulation"],
    tags: ["regulation", "privacy", "innovation"],
    isActive: true,
    isFeatured: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Remote work is the future of employment",
    description: "Argue for or against remote work becoming the dominant employment model.",
    category: "Society",
    difficulty: "beginner",
    prompts: ["Consider productivity factors", "Think about work-life balance"],
    tags: ["remote work", "productivity", "future"],
    isActive: true,
    isFeatured: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

db.achievements.insertMany([
  {
    id: "first_debate",
    name: "First Steps",
    description: "Complete your first debate",
    icon: "🎯",
    type: "milestone",
    category: "debate",
    requirement: { type: "debates", count: 1 },
    xpReward: 100,
    coinReward: 50,
    rarity: "common",
    order: 1,
    isActive: true,
    unlockedBy: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "perfect_score",
    name: "Perfect Performance",
    description: "Score 90+ on a debate",
    icon: "🌟",
    type: "badge",
    category: "debate",
    requirement: { type: "score", score: 90 },
    xpReward: 200,
    coinReward: 100,
    rarity: "rare",
    order: 5,
    isActive: true,
    unlockedBy: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('Sample data inserted successfully!');
print('MongoDB initialization complete!');
