const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const User = require('./userModel');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('MongoDB error:', err));

// Register endpoint
app.post('/register', async (req, res) => {
  const { email, password, role } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).json({ message: 'User already exists' });

  const hashed = await require('bcryptjs').hash(password, 10);
  const newUser = new User({ email, password: hashed, role });
  await newUser.save();
  res.status(201).json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const match = await require('bcryptjs').compare(password, user.password);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });

  const token = require('jsonwebtoken').sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.json({ token, role: user.role });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
