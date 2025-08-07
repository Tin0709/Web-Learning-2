const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/roleLoginDB');

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

const User = mongoose.model('User', userSchema);

// Login route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, password });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  let role = '';
  if (email.endsWith('@role1.com')) role = 'role1';
  else if (email.endsWith('@role2.com')) role = 'role2';
  else if (email.endsWith('@role3.com')) role = 'role3';
  else role = 'unknown';

  res.json({ message: 'Login success', role });
});

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
