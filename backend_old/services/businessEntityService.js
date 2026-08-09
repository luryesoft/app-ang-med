const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
//const GlobalService = require('../../src/app/global.service'); 
const { server } = require('typescript');

const pool = new Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432, // default port for PostgreSQL
});

exports.getBusinessEntity = async (id) => {
  if (typeof id !== 'string') {
    throw new Error('Invalid ID: ID must be a string');
  }
  const query = 'SELECT * FROM businessentity WHERE entity_id = $1';
  const values = [id];
  try {
    const res = await pool.query(query, values);
    if (res.rows.length === 0) {
      throw new Error('Business entity not found');
    }
    return res.rows[0];
  } catch (err) {
    console.error('Error executing query', err.stack);
    //throw err; // Re-throw the original error
    throw new Error(`Error fetching business entity: ${err.message}`); 
  }
};