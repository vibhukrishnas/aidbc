/**
 * Database Seeding Script
 * Populates the database with initial data for development/testing
 */

require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../src/config/environment');

// Import models
const User = require('../src/models/User');
const Topic = require('../src/models/Topic');
const Achievement = require('../src/models/Achievement');

// Sample data
const sampleTopics = [
  {
    title: "Technology should be regulated more strictly",
    description: "Debate whether governments should impose stricter regulations on technology companies to protect privacy and prevent monopolistic practices.",
    category: "Technology",
    difficulty: "intermediate",
    prompts: [
      "Consider the balance between innovation and regulation",
      "Think about privacy vs. convenience trade-offs",
      "Address the role of government in the digital age"
    ],
    tags: ["regulation", "privacy", "monopoly", "government"],
    isActive: true,
    isFeatured: true
  },
  {
    title: "Remote work is better than office work",
    description: "Argue for or against the superiority of remote work compared to traditional office-based employment.",
    category: "Society",
    difficulty: "beginner",
    prompts: [
      "Consider productivity and work-life balance",
      "Think about collaboration and team dynamics",
      "Address the impact on company culture"
    ],
    tags: ["remote", "productivity", "culture", "flexibility"],
    isActive: true,
    isFeatured: false
  },
  {
    title: "Climate change requires immediate drastic action",
    description: "Debate whether urgent, dramatic measures are necessary to combat climate change or if gradual approaches are more effective.",
    category: "Environment",
    difficulty: "advanced",
    prompts: [
      "Consider economic impacts of rapid changes",
      "Think about scientific evidence and timelines",
      "Address global cooperation challenges"
    ],
    tags: ["climate", "environment", "policy", "urgent"],
    isActive: true,
    isFeatured: true
  },
  {
    title: "Social media does more harm than good",
    description: "Examine whether the negative impacts of social media platforms outweigh their benefits for society.",
    category: "Technology",
    difficulty: "intermediate",
    prompts: [
      "Consider mental health implications",
      "Think about information spread and misinformation",
      "Address social connectivity benefits"
    ],
    tags: ["social media", "mental health", "information", "society"],
    isActive: true,
    isFeatured: false
  },
  {
    title: "Universal basic income should be implemented",
    description: "Debate the merits and drawbacks of implementing a universal basic income system in modern economies.",
    category: "Economics",
    difficulty: "advanced",
    prompts: [
      "Consider economic feasibility and funding",
      "Think about work incentives and motivation",
      "Address poverty reduction potential"
    ],
    tags: ["ubi", "economics", "poverty", "welfare"],
    isActive: true,
    isFeatured: false
  }
];

const sampleAchievements = [
  {
    id: 'first_debate',
    name: 'First Steps',
    description: 'Complete your first debate',
    icon: '🎯',
    type: 'milestone',
    category: 'debate',
    requirement: { type: 'debates', count: 1 },
    xpReward: 100,
    coinReward: 50,
    rarity: 'common',
    order: 1,
    hint: 'Just participate in any debate topic'
  },
  {
    id: 'perfect_score',
    name: 'Perfect Performance',
    description: 'Score 90+ on a debate',
    icon: '🌟',
    type: 'badge',
    category: 'debate',
    requirement: { type: 'score', score: 90 },
    xpReward: 200,
    coinReward: 100,
    rarity: 'rare',
    order: 5,
    hint: 'Focus on strong arguments and clear structure'
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day debate streak',
    icon: '🔥',
    type: 'milestone',
    category: 'streak',
    requirement: { type: 'streak', days: 7 },
    xpReward: 300,
    coinReward: 150,
    rarity: 'epic',
    order: 10,
    hint: 'Debate every day for a week'
  },
  {
    id: 'polyglot',
    name: 'Language Explorer',
    description: 'Debate in 3 different languages',
    icon: '🌍',
    type: 'special',
    category: 'special',
    requirement: { type: 'custom', customCheck: 'languages_used_3' },
    xpReward: 250,
    coinReward: 125,
    rarity: 'epic',
    order: 15,
    hint: 'Try debating in Hindi, Tamil, or other supported languages'
  },
  {
    id: 'level_10',
    name: 'Rising Star',
    description: 'Reach level 10',
    icon: '⭐',
    type: 'milestone',
    category: 'level',
    requirement: { type: 'level', level: 10 },
    xpReward: 500,
    coinReward: 250,
    rarity: 'legendary',
    order: 20,
    hint: 'Keep debating and earning XP to level up'
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data (optional - comment out for production)
    await Topic.deleteMany({});
    await Achievement.deleteMany({});
    console.log('🧹 Cleared existing data');
    
    // Seed topics
    console.log('📝 Seeding topics...');
    const createdTopics = await Topic.insertMany(sampleTopics);
    console.log(`✅ Created ${createdTopics.length} topics`);
    
    // Seed achievements
    console.log('🏆 Seeding achievements...');
    const createdAchievements = await Achievement.insertMany(sampleAchievements);
    console.log(`✅ Created ${createdAchievements.length} achievements`);
    
    console.log('🎉 Database seeding completed successfully!');
    
    // Display summary
    console.log('\n📊 Seeding Summary:');
    console.log(`Topics: ${createdTopics.length}`);
    console.log(`Achievements: ${createdAchievements.length}`);
    
    console.log('\n🚀 Your debate platform is ready to use!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from database');
    process.exit(0);
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, sampleTopics, sampleAchievements };
