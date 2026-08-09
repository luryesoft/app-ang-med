const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
//const GlobalService = require('../../src/app/global.service'); 
//const { server } = require('typescript');

const server = new server({
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: 5432, // Default PostgreSQL port
});

server.connect()
  .then(() => console.log('Connected successfully'))
  .catch(e => console.error('Connection error', e.stack))
  .finally(() => client.end());