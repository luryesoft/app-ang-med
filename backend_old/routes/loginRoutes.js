const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
//const GlobalService = require('../../src/app/global.service'); 
const { server } = require('typescript');

const pool = new Pool({
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: 5432, // Default PostgreSQL port
});



router.post('/userlogin', async (req, res) => {
  const { userid, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE user_id = $1 ', [userid] );
    if (result.rows.length > 0) {
      const user = result.rows[0];
      //log user structure 
      console.log('User :', user);
      console.log('User object:', userid);

      // In a real app, you should use bcrypt to compare hashed passwords
      if (user.password_tx === password) {
        res.json({
          success: true,
          user: {
            id: user.id,
            user_id: user.user_id,
            user_name: user.user_first_name_tx,
            user_last_name: user.user_last_name_tx,
            company_id: user.company_id
          }
        });
        console.log('User object:', user.user_id);
      } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    } else {
      res.status(401).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login Service error' });
  }
});

module.exports = router;