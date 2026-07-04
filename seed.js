// utils/seed.js
// Optional helper script to populate the database with demo data.
// Run with: npm run seed

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Ticket = require('../models/Ticket');

const seed = async () => {
  await connectDB();

  await User.deleteMany();
  await Ticket.deleteMany();

  const admin = await User.create({
    name: 'Ada Admin',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin',
  });

  const agent = await User.create({
    name: 'Alex Agent',
    email: 'agent@example.com',
    password: 'password123',
    role: 'agent',
  });

  const customer = await User.create({
    name: 'Casey Customer',
    email: 'customer@example.com',
    password: 'password123',
    role: 'customer',
  });

  await Ticket.create([
    {
      subject: 'Cannot reset my password',
      description: 'The reset link in my email is not working.',
      status: 'open',
      priority: 'high',
      category: 'account',
      createdBy: customer._id,
    },
    {
      subject: 'Question about invoice',
      description: 'My last invoice shows a charge I do not recognize.',
      status: 'in_progress',
      priority: 'medium',
      category: 'billing',
      createdBy: customer._id,
      assignedTo: agent._id,
    },
  ]);

  console.log('Seed data created:');
  console.log('  Admin:    admin@example.com / password123');
  console.log('  Agent:    agent@example.com / password123');
  console.log('  Customer: customer@example.com / password123');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
