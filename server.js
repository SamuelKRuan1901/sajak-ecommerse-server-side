import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';
import env from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { base64url } from './helper.js';

env.config();
const app = express();
const port = process.env.SERVER_PORT || 3000;
const saltRounds = 10;
const jwtSecret = process.env.JWT_SECRET;

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Server is ready');
});

app.get('/api/products', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM products ORDER BY id ASC');
    const products = result.rows;
    return res.json(products);
  } catch (error) {
    console.log(error);
  }
});

app.get('/api/user/info/:userId', async (req, res) => {
  const token = req.headers.authorization?.slice(7);
  if (!token) {
    return res.status(401).json({
      message: 'Unauthorized'
    });
  }

  const [encodeHeader, encodePayload, tokenSignature] = token.split('.');
  const tokenData = `${encodeHeader}.${encodePayload}`;
  const hmac = crypto.createHmac('sha256', jwtSecret);
  const signature = hmac.update(tokenData).digest('base64url');

  if (signature === tokenSignature) {
    const payload = JSON.parse(atob(encodePayload));
    console.log(payload);
    try {
      const result = await db.query('SELECT * FROM users WHERE id=$1', [
        payload.sub
      ]);
      const user = result.rows[0];
      if (!user) {
        return res.status(401).json({
          message: 'Unauthorized'
        });
      }
      if (payload.exp < Date.now()) {
        return res.status(401).json({
          message: 'Unauthorized'
        });
      }
      return res.json(user);
    } catch (error) {
      console.log(error);
    }
  }
});

app.post('/api/register', async (req, res) => {
  const user = req.body;
  const { email, password } = user;

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [
      email
    ]);
    if (result.rows.length > 0) {
      return res
        .status(401)
        .json({ msg: 'User Already Exists. Try Logging In' });
    } else {
      bcrypt.hash(password, saltRounds, async (error, hash) => {
        if (error) {
          console.log('Error hashing password:', error);
        } else {
          await db.query('INSERT INTO users(email, password) VALUES($1,$2)', [
            email,
            hash
          ]);
          return res.status(201).json({
            msg: 'A New User Is Successfully Created'
          });
        }
      });
    }
  } catch (error) {
    console.log(error);
  }
});

app.post('/api/login', async (req, res) => {
  const email = req.body.email;
  const loginPassword = req.body.password;
  try {
    const checkResult = await db.query('SELECT * FROM users WHERE email = $1', [
      email
    ]);

    if (checkResult.rows.length > 0) {
      const user = checkResult.rows[0];
      const storedPassword = user.password;
      bcrypt.compare(loginPassword, storedPassword, (error, result) => {
        if (!result) {
          return res.status(401).json({ msg: 'Password Does Not Match' });
        } else {
          const header = {
            alg: 'HS256',
            typ: 'JWT'
          };

          const payload = {
            sub: user.id,
            exp: Date.now() + 3600000
          };

          const encodeHeader = base64url(JSON.stringify(header));
          const encodePayload = base64url(JSON.stringify(payload));

          const tokenData = `${encodeHeader}.${encodePayload}`;

          const hmac = crypto.createHmac('sha256', jwtSecret);
          const signature = hmac.update(tokenData).digest('base64url');

          res.json({
            id: user.id,
            token: `${tokenData}.${signature}`
          });
        }
      });
    } else {
      return res.status(401).json({ mgs: 'User Does Not Exist' });
    }
  } catch (error) {
    console.log(error);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
