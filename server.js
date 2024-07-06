const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Replace <username>, <password>, and <cluster-url> with your MongoDB Atlas credentials
const dbUri = 'mongodb+srv://eventsayuhasca:eventsayuhasca@ayuhascadev.zbvsdat.mongodb.net/';

mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.log(err));

const userSchema = new mongoose.Schema({
  phone: { type: String, unique: true },
  gender: String,
  interest: String,
  points: { type: Number, default: 0 },
  referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const User = mongoose.model('User', userSchema);

app.post('/api/register', async (req, res) => {
  const { phone, gender, interest } = req.body;
  let user = await User.findOne({ phone });
  if (!user) {
    user = new User({ phone, gender, interest });
    await user.save();
  }
  const referralLink = `http://localhost:5000/referral/${user._id}`;
  res.json({ user, referralLink });
});

app.post('/api/referral/:id', async (req, res) => {
  const { id } = req.params;
  const referrer = await User.findById(id);
  if (referrer) {
    referrer.points += 10;
    await referrer.save();

    const newUser = new User({
      phone: req.body.phone,
      gender: req.body.gender,
      interest: req.body.interest,
      points: 0,
      referrals: []
    });
    newUser.referrals.push(referrer._id);
    await newUser.save();

    res.json({ message: 'Referral successful', newUser });
  } else {
    res.status(404).json({ message: 'Referrer not found' });
  }
});

app.get('/api/user/:phone', async (req, res) => {
  const { phone } = req.params;
  const user = await User.findOne({ phone });
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
