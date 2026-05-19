require('dotenv').config(); // ← MUST be first line

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

connectDB();

app.use(cors({
  origin: [
    'http://localhost:5173',
    /\.vercel\.app$/
  ],
  credentials: true,
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/user',      require('./routes/user'));
app.use('/api/interview', require('./routes/interview'));
app.use('/api/test',      require('./routes/test'));
app.use('/api/community', require('./routes/community'));
app.use('/api/gd',        require('./routes/gd'));

app.get('/', (req, res) => {
  res.json({ message: 'AceIt API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});