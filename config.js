import pg from 'pg';
import env from 'dotenv';

env.config();

export const corsOption = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

export const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT
});

export const port = process.env.SERVER_PORT || 3000;
export const saltRounds = 10;
export const jwtSecret = process.env.JWT_SECRET;
