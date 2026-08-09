require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const loginRoutes = require('./routes/loginRoutes');

const app = express();

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies

app.use('/api', loginRoutes); // Mount the login routes under /api

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));