const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'skillxchange.db');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Delete existing DB
if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, full_name TEXT NOT NULL, bio TEXT DEFAULT '', avatar_url TEXT DEFAULT '', city TEXT DEFAULT '', skill_coins REAL DEFAULT 10.0, trust_level TEXT DEFAULT 'bronze', reputation_score REAL DEFAULT 0.0, total_exchanges INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')), last_active TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS skills (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, category TEXT NOT NULL, type TEXT NOT NULL, description TEXT DEFAULT '', proficiency_level TEXT DEFAULT 'intermediate', hourly_rate REAL DEFAULT 1.0, availability TEXT DEFAULT '[]', is_active INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS exchanges (id TEXT PRIMARY KEY, requester_id TEXT NOT NULL REFERENCES users(id), provider_id TEXT NOT NULL REFERENCES users(id), skill_offered_id TEXT REFERENCES skills(id), skill_requested_id TEXT NOT NULL REFERENCES skills(id), type TEXT NOT NULL, status TEXT DEFAULT 'pending', coins_amount REAL DEFAULT 0, coins_escrowed INTEGER DEFAULT 0, scheduled_at TEXT, duration_hours REAL DEFAULT 1.0, message TEXT DEFAULT '', requester_confirmed INTEGER DEFAULT 0, provider_confirmed INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS reviews (id TEXT PRIMARY KEY, exchange_id TEXT NOT NULL REFERENCES exchanges(id), reviewer_id TEXT NOT NULL REFERENCES users(id), reviewee_id TEXT NOT NULL REFERENCES users(id), rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5), comment TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, sender_id TEXT NOT NULL REFERENCES users(id), receiver_id TEXT NOT NULL REFERENCES users(id), exchange_id TEXT REFERENCES exchanges(id), content TEXT NOT NULL, is_read INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, from_user_id TEXT REFERENCES users(id), to_user_id TEXT REFERENCES users(id), exchange_id TEXT REFERENCES exchanges(id), amount REAL NOT NULL, type TEXT NOT NULL, description TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), type TEXT NOT NULL, title TEXT NOT NULL, body TEXT DEFAULT '', link TEXT DEFAULT '', is_read INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS calendar_events (id TEXT PRIMARY KEY, exchange_id TEXT NOT NULL REFERENCES exchanges(id), user_id TEXT NOT NULL REFERENCES users(id), title TEXT NOT NULL, start_time TEXT NOT NULL, end_time TEXT NOT NULL, status TEXT DEFAULT 'scheduled', created_at TEXT DEFAULT (datetime('now')));
  CREATE INDEX IF NOT EXISTS idx_skills_user ON skills(user_id);
  CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
  CREATE INDEX IF NOT EXISTS idx_exchanges_requester ON exchanges(requester_id);
  CREATE INDEX IF NOT EXISTS idx_exchanges_provider ON exchanges(provider_id);
  CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
  CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
`);

const hash = bcrypt.hashSync('password123', 12);

const users = [
  { id: uuidv4(), username: 'alice_dev', email: 'alice@example.com', full_name: 'Alice Johnson', bio: 'Full-stack developer who loves teaching coding. Looking to learn music and cooking!', city: 'Bangalore', skill_coins: 15.5, trust_level: 'silver', reputation_score: 4.5, total_exchanges: 7 },
  { id: uuidv4(), username: 'bob_guitar', email: 'bob@example.com', full_name: 'Bob Martinez', bio: 'Professional guitarist and music teacher. Want to get into tech and fitness.', city: 'Bangalore', skill_coins: 12.0, trust_level: 'gold', reputation_score: 4.8, total_exchanges: 12 },
  { id: uuidv4(), username: 'carol_fit', email: 'carol@example.com', full_name: 'Carol Chen', bio: 'Certified fitness trainer and nutritionist. Eager to learn web development and guitar.', city: 'Bangalore', skill_coins: 8.5, trust_level: 'silver', reputation_score: 4.2, total_exchanges: 5 },
  { id: uuidv4(), username: 'dave_chef', email: 'dave@example.com', full_name: 'Dave Kumar', bio: 'Home chef and food blogger. Would love to learn photography and design.', city: 'Mumbai', skill_coins: 20.0, trust_level: 'gold', reputation_score: 4.6, total_exchanges: 15 },
  { id: uuidv4(), username: 'eva_art', email: 'eva@example.com', full_name: 'Eva Singh', bio: 'Graphic designer and illustrator. Interested in learning cooking and languages.', city: 'Bangalore', skill_coins: 11.0, trust_level: 'bronze', reputation_score: 3.8, total_exchanges: 3 },
  { id: uuidv4(), username: 'frank_lang', email: 'frank@example.com', full_name: 'Frank Patel', bio: 'Polyglot fluent in 5 languages. Looking to learn coding and music production.', city: 'Bangalore', skill_coins: 14.0, trust_level: 'silver', reputation_score: 4.3, total_exchanges: 8 },
  { id: uuidv4(), username: 'grace_biz', email: 'grace@example.com', full_name: 'Grace Williams', bio: 'Startup mentor and business strategist. Wants to learn art and fitness.', city: 'Mumbai', skill_coins: 18.0, trust_level: 'platinum', reputation_score: 4.9, total_exchanges: 22 },
  { id: uuidv4(), username: 'henry_photo', email: 'henry@example.com', full_name: 'Henry Sharma', bio: 'Professional photographer. Interested in learning business and cooking.', city: 'Bangalore', skill_coins: 9.0, trust_level: 'bronze', reputation_score: 3.5, total_exchanges: 2 },
];

const insertUser = db.prepare('INSERT INTO users (id, username, email, password_hash, full_name, bio, city, skill_coins, trust_level, reputation_score, total_exchanges) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
users.forEach(u => insertUser.run(u.id, u.username, u.email, hash, u.full_name, u.bio, u.city, u.skill_coins, u.trust_level, u.reputation_score, u.total_exchanges));

// Skills
const skillsData = [
  // Alice - offers
  { user: 0, name: 'Python Programming', cat: 'tech', type: 'offer', desc: 'From basics to advanced — data science, web dev, automation', prof: 'expert', rate: 1.5 },
  { user: 0, name: 'React & Next.js', cat: 'tech', type: 'offer', desc: 'Modern frontend development with React ecosystem', prof: 'advanced', rate: 1.5 },
  { user: 0, name: 'Guitar Basics', cat: 'music', type: 'request', desc: 'Want to learn acoustic guitar from scratch', prof: 'beginner', rate: 1 },
  { user: 0, name: 'Indian Cooking', cat: 'cooking', type: 'request', desc: 'Looking to master South Indian cuisine', prof: 'beginner', rate: 1 },
  // Bob
  { user: 1, name: 'Guitar Lessons', cat: 'music', type: 'offer', desc: 'Acoustic and electric guitar for all levels', prof: 'expert', rate: 2 },
  { user: 1, name: 'Music Theory', cat: 'music', type: 'offer', desc: 'Understanding scales, chords, and composition', prof: 'advanced', rate: 1.5 },
  { user: 1, name: 'Web Development', cat: 'tech', type: 'request', desc: 'Want to build my own music portfolio site', prof: 'beginner', rate: 1 },
  { user: 1, name: 'Gym Training', cat: 'fitness', type: 'request', desc: 'Looking for a structured workout plan', prof: 'beginner', rate: 1 },
  // Carol
  { user: 2, name: 'Personal Training', cat: 'fitness', type: 'offer', desc: 'Custom workout plans, form coaching, and nutrition advice', prof: 'expert', rate: 2 },
  { user: 2, name: 'Yoga', cat: 'fitness', type: 'offer', desc: 'Hatha and Vinyasa yoga for all levels', prof: 'advanced', rate: 1 },
  { user: 2, name: 'JavaScript', cat: 'tech', type: 'request', desc: 'Want to learn JS for a fitness app idea', prof: 'beginner', rate: 1 },
  { user: 2, name: 'Guitar Basics', cat: 'music', type: 'request', desc: 'Always wanted to play guitar', prof: 'beginner', rate: 1 },
  // Dave
  { user: 3, name: 'Indian Cuisine', cat: 'cooking', type: 'offer', desc: 'Master chef in North and South Indian cooking', prof: 'expert', rate: 1.5 },
  { user: 3, name: 'Baking & Pastry', cat: 'cooking', type: 'offer', desc: 'Breads, cakes, and pastries from scratch', prof: 'advanced', rate: 1.5 },
  { user: 3, name: 'Photography', cat: 'art', type: 'request', desc: 'Food photography for my blog', prof: 'beginner', rate: 1 },
  { user: 3, name: 'Logo Design', cat: 'art', type: 'request', desc: 'Need to learn design for my food brand', prof: 'beginner', rate: 1 },
  // Eva
  { user: 4, name: 'Logo Design', cat: 'art', type: 'offer', desc: 'Brand identity, logos, and visual design', prof: 'advanced', rate: 1.5 },
  { user: 4, name: 'UI/UX Design', cat: 'art', type: 'offer', desc: 'User interface and experience design', prof: 'intermediate', rate: 1 },
  { user: 4, name: 'Italian Cooking', cat: 'cooking', type: 'request', desc: 'Want to learn authentic Italian recipes', prof: 'beginner', rate: 1 },
  { user: 4, name: 'Spanish Language', cat: 'language', type: 'request', desc: 'Planning a trip to Spain', prof: 'beginner', rate: 1 },
  // Frank
  { user: 5, name: 'Spanish', cat: 'language', type: 'offer', desc: 'Native-level Spanish — conversational to advanced', prof: 'expert', rate: 1.5 },
  { user: 5, name: 'French', cat: 'language', type: 'offer', desc: 'Fluent French — beginner to advanced', prof: 'advanced', rate: 1.5 },
  { user: 5, name: 'Japanese', cat: 'language', type: 'offer', desc: 'N2 level Japanese tutor', prof: 'advanced', rate: 2 },
  { user: 5, name: 'Python Programming', cat: 'tech', type: 'request', desc: 'Want to automate language learning tools', prof: 'beginner', rate: 1 },
  // Grace
  { user: 6, name: 'Business Strategy', cat: 'business', type: 'offer', desc: 'Startup mentoring, pitching, and growth strategy', prof: 'expert', rate: 2 },
  { user: 6, name: 'Marketing', cat: 'business', type: 'offer', desc: 'Digital marketing, SEO, and content strategy', prof: 'advanced', rate: 1.5 },
  { user: 6, name: 'Watercolor Painting', cat: 'art', type: 'request', desc: 'Want to pick up a creative hobby', prof: 'beginner', rate: 1 },
  { user: 6, name: 'Fitness Training', cat: 'fitness', type: 'request', desc: 'Need a proper fitness routine', prof: 'beginner', rate: 1 },
  // Henry
  { user: 7, name: 'Photography', cat: 'art', type: 'offer', desc: 'Portrait, landscape, and product photography', prof: 'expert', rate: 1.5 },
  { user: 7, name: 'Photo Editing', cat: 'art', type: 'offer', desc: 'Lightroom and Photoshop mastery', prof: 'advanced', rate: 1 },
  { user: 7, name: 'Business Basics', cat: 'business', type: 'request', desc: 'Want to start my own photography business', prof: 'beginner', rate: 1 },
  { user: 7, name: 'Indian Cooking', cat: 'cooking', type: 'request', desc: 'Learning to cook for myself', prof: 'beginner', rate: 1 },
];

const insertSkill = db.prepare('INSERT INTO skills (id, user_id, name, category, type, description, proficiency_level, hourly_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
const skillIds = {};
skillsData.forEach((s, i) => {
  const id = uuidv4();
  insertSkill.run(id, users[s.user].id, s.name, s.cat, s.type, s.desc, s.prof, s.rate);
  skillIds[i] = id;
});

// Some completed exchanges with reviews
const exchanges = [
  { req: 1, prov: 0, skillReq: 0, type: 'credit', status: 'completed', coins: 3, dur: 2, msg: 'Hey Alice! Can you teach me React basics?' },
  { req: 0, prov: 1, skillReq: 4, type: 'barter', status: 'completed', coins: 0, dur: 2, msg: 'Hi Bob, trade Python for guitar?' },
  { req: 2, prov: 1, skillReq: 4, type: 'credit', status: 'in_progress', coins: 2, dur: 1, msg: 'Guitar lessons please!' },
  { req: 6, prov: 2, skillReq: 8, type: 'credit', status: 'completed', coins: 2, dur: 1, msg: 'Need fitness coaching' },
  { req: 3, prov: 7, skillReq: 28, type: 'credit', status: 'pending', coins: 1.5, dur: 1, msg: 'Can you teach me food photography?' },
];

const insertExchange = db.prepare('INSERT INTO exchanges (id, requester_id, provider_id, skill_requested_id, type, status, coins_amount, duration_hours, message, requester_confirmed, provider_confirmed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
const exchangeIds = [];
exchanges.forEach(e => {
  const id = uuidv4();
  const confirmed = e.status === 'completed' ? 1 : 0;
  insertExchange.run(id, users[e.req].id, users[e.prov].id, skillIds[e.skillReq], e.type, e.status, e.coins, e.dur, e.msg, confirmed, confirmed);
  exchangeIds.push(id);
});

// Reviews
const reviewsData = [
  { exchange: 0, reviewer: 1, reviewee: 0, rating: 5, comment: 'Alice is an amazing teacher! Made React so easy to understand.' },
  { exchange: 0, reviewer: 0, reviewee: 1, rating: 4, comment: 'Bob was a great student, very engaged and asked good questions.' },
  { exchange: 1, reviewer: 0, reviewee: 1, rating: 5, comment: 'Bob is a fantastic guitar teacher. Very patient and skilled.' },
  { exchange: 1, reviewer: 1, reviewee: 0, rating: 5, comment: 'Alice made Python fun! Great teaching style.' },
  { exchange: 3, reviewer: 6, reviewee: 2, rating: 5, comment: 'Carol is incredibly knowledgeable about fitness. Highly recommend!' },
  { exchange: 3, reviewer: 2, reviewee: 6, rating: 4, comment: 'Grace was motivated and followed the plan perfectly.' },
];
const insertReview = db.prepare('INSERT INTO reviews (id, exchange_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)');
reviewsData.forEach(r => insertReview.run(uuidv4(), exchangeIds[r.exchange], users[r.reviewer].id, users[r.reviewee].id, r.rating, r.comment));

// Messages
const msgs = [
  { from: 1, to: 0, content: 'Hey Alice! I saw you offer Python lessons. Would love to learn!' },
  { from: 0, to: 1, content: 'Hi Bob! Sure, I would love to help. And I see you teach guitar — maybe we can do a direct swap?' },
  { from: 1, to: 0, content: 'That sounds perfect! Python for guitar — deal! When are you free?' },
  { from: 0, to: 1, content: 'How about this Saturday at 10am? We can do 2 hours each.' },
  { from: 6, to: 2, content: 'Hi Carol! I need help getting into fitness. Can you design a workout plan?' },
  { from: 2, to: 6, content: 'Of course! Let me know your goals and current fitness level.' },
];
const insertMsg = db.prepare('INSERT INTO messages (id, sender_id, receiver_id, content, is_read) VALUES (?, ?, ?, ?, 1)');
msgs.forEach(m => insertMsg.run(uuidv4(), users[m.from].id, users[m.to].id, m.content));

// Notifications
const notifs = [
  { user: 0, type: 'system', title: 'Welcome to SkillXchange!', body: 'You received 10 free SkillCoins to get started.' },
  { user: 0, type: 'exchange_request', title: 'New Exchange Request', body: 'Bob Martinez wants to learn Python from you!' },
  { user: 7, type: 'exchange_request', title: 'New Exchange Request', body: 'Dave Kumar wants to learn Photography from you!' },
];
const insertNotif = db.prepare('INSERT INTO notifications (id, user_id, type, title, body) VALUES (?, ?, ?, ?, ?)');
notifs.forEach(n => insertNotif.run(uuidv4(), users[n.user].id, n.type, n.title, n.body));

// Calendar events for in-progress exchange
const now = new Date();
const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
const endTime = new Date(nextWeek.getTime() + 60 * 60 * 1000);
const insertCal = db.prepare('INSERT INTO calendar_events (id, exchange_id, user_id, title, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)');
insertCal.run(uuidv4(), exchangeIds[2], users[2].id, 'Learn: Guitar Lessons', nextWeek.toISOString(), endTime.toISOString());
insertCal.run(uuidv4(), exchangeIds[2], users[1].id, 'Teach: Guitar Lessons', nextWeek.toISOString(), endTime.toISOString());

// Transactions
const insertTx = db.prepare('INSERT INTO transactions (id, from_user_id, to_user_id, exchange_id, amount, type, description) VALUES (?, ?, ?, ?, ?, ?, ?)');
insertTx.run(uuidv4(), users[1].id, null, exchangeIds[0], 3, 'escrow_hold', 'Coins held for React lesson');
insertTx.run(uuidv4(), null, users[0].id, exchangeIds[0], 3, 'escrow_release', 'Payment for React lesson');
insertTx.run(uuidv4(), users[6].id, null, exchangeIds[3], 2, 'escrow_hold', 'Coins held for fitness coaching');
insertTx.run(uuidv4(), null, users[2].id, exchangeIds[3], 2, 'escrow_release', 'Payment for fitness coaching');

db.close();
console.log('✅ Database seeded successfully with 8 users, 32 skills, 5 exchanges, 6 reviews, and sample messages!');
console.log('\n📧 Login with any of these emails (password: password123):');
users.forEach(u => console.log(`   ${u.email} — ${u.full_name} (${u.trust_level})`));
