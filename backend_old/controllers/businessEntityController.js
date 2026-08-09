const { Pool } = require('pg');
const pool = new Pool();

exports.getBusinessEntity = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM business_entities WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).send('Business entity not found');
    }
  } catch (error) {
    console.error('Error retrieving business entity:', error);
    res.status(500).send('Internal Server Error');
  }
};