import express, { query } from 'express';
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

const corsOption = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors(corsOption));

app.get('/', (req, res) => {
  res.send('Server is ready');
});
//get products on home page
app.get('/api/products', async (req, res) => {
  console.log(query);
  try {
    const result = await db.query('SELECT * FROM products ORDER BY id ASC');
    const products = result.rows;
    return res.json(products);
  } catch (error) {
    console.log(error);
  }
});

//get products on shop page
app.get('/api/shop/products', async (req, res) => {
  const { sortType, page, limit } = req.query;
  let result = [];

  try {
    // const products = await db.query('SELECT * FROM products ORDER BY id DESC');

    switch (sortType) {
      case '1':
        result = await db.query('SELECT * FROM products ORDER BY id ASC');
        break;
      case '2':
        result = await db.query('SELECT * FROM products ORDER BY id ASC');
        break;
      case '3':
        result = await db.query('SELECT * FROM products ORDER BY id DESC');
        break;
      case '4':
        result = await db.query('SELECT * FROM products ORDER BY price ASC');
        break;
      case '5':
        result = await db.query('SELECT * FROM products ORDER BY price DESC');
        break;
      default:
        result = await db.query('SELECT * FROM products ORDER BY id ASC');
        break;
    }

    const products = result.rows;
    if (limit === '8') {
      return res.json(products.slice(0, 8));
    }
    if (limit === '12') {
      return res.json(products.slice(0, 12));
    }
    if (limit === 'all') {
      return res.json(products.slice(0, products.length));
    }
  } catch (error) {
    console.log(error);
  }
});

//get user info route
app.get('/api/user/info/:userId', async (req, res) => {
  //check token
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

  //compare token signature
  if (signature === tokenSignature) {
    const payload = JSON.parse(atob(encodePayload));

    //passed compare -> get user info
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

//get product list in cart
app.get('/api/cart', async (req, res) => {
  //check token
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

  //compare token signature
  if (signature === tokenSignature) {
    const payload = JSON.parse(atob(encodePayload));

    //passed compare -> get user info
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
      const cart = await db.query(
        `
        SELECT cart.cart_id,products.id, products.name, products.price, products.image1, cart.product_size, cart.user_id, users.username, users.email, users.phonenumber, users.address FROM products
        JOIN cart
        ON products.id = cart.product_id  
        JOIN users
        ON users.id = cart.user_id
        WHERE user_id=$1
        ORDER BY product_id ASC;
        `,
        [payload.sub]
      );
      const data = cart.rows;
      return res.status(201).json({ data });
    } catch (error) {
      console.log(error);
    }
  }
});

//get product list in compare
app.get('/api/compare', async (req, res) => {
  //check token
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

  //compare token signature
  if (signature === tokenSignature) {
    const payload = JSON.parse(atob(encodePayload));

    //passed compare -> get user info
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
      const cart = await db.query(
        `
        SELECT compare.compare_id,products.id, products.name, products.price, products.image1, compare.product_size FROM products
        JOIN compare
        ON products.id = compare.product_id  
        JOIN users
        ON users.id = compare.user_id
        WHERE user_id=$1
        ORDER BY product_id ASC
        `,
        [payload.sub]
      );
      const data = cart.rows;
      return res.status(201).json({ data });
    } catch (error) {
      console.log(error);
    }
  }
});

//get product list in wishlist
app.get('/api/wishlist', async (req, res) => {
  //check token
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

  //compare token signature
  if (signature === tokenSignature) {
    const payload = JSON.parse(atob(encodePayload));

    //passed compare -> get user info
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
      const cart = await db.query(
        `
        SELECT wishlist.wishlist_id,products.id, products.name, products.price, products.image1, wishlist.product_size FROM products
        JOIN wishlist
        ON products.id = wishlist.product_id  
        JOIN users
        ON users.id = wishlist.user_id
        WHERE user_id=$1
        ORDER BY product_id ASC
        `,
        [payload.sub]
      );
      const data = cart.rows;
      return res.status(201).json({ data });
    } catch (error) {
      console.log(error);
    }
  }
});

//register route
app.post('/api/register', async (req, res) => {
  const user = req.body;
  const { email, password } = user;
  //check user existing
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [
      email
    ]);
    if (result.rows.length > 0) {
      return res
        .status(401)
        .json({ msg: 'User Already Exists. Try Logging In' });
    } else {
      //hash password
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

//login route
app.post('/api/login', async (req, res) => {
  const email = req.body.email;
  const loginPassword = req.body.password;
  //check user existing
  try {
    const checkResult = await db.query('SELECT * FROM users WHERE email = $1', [
      email
    ]);

    if (checkResult.rows.length > 0) {
      //compare passwords
      const user = checkResult.rows[0];
      const storedPassword = user.password;
      bcrypt.compare(loginPassword, storedPassword, (error, result) => {
        if (!result) {
          return res.status(401).json({ msg: 'Password Does Not Match' });
        } else {
          //loged in & create a token
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

          //create a token signature
          const hmac = crypto.createHmac('sha256', jwtSecret);
          const signature = hmac.update(tokenData).digest('base64url');

          return res.json({
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

//add product to cart
app.post('/api/cart', async (req, res) => {
  //check token
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

  //compare token signature
  if (signature === tokenSignature) {
    const payload = JSON.parse(atob(encodePayload));
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

      const data = req.body;

      await db.query(
        'INSERT INTO cart(user_id, product_id, product_size, quantity) VALUES($1, $2, $3, $4)',
        [user.id, data.productId, data.size, data.quantity]
      );
      return res.status(201).json({ msg: 'Add to cart successfully' });
    } catch (error) {
      console.log(error);
    }
  }
});

//add product to compare
app.post('/api/compare', async (req, res) => {
  //check token
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

  //compare token signature
  if (signature === tokenSignature) {
    const payload = JSON.parse(atob(encodePayload));
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

      const data = req.body;

      await db.query(
        'INSERT INTO compare(user_id, product_id, product_size, quantity) VALUES($1, $2, $3, $4)',
        [user.id, data.productId, data.size, data.quantity]
      );
      return res.status(201).json({ msg: 'Add to compare successfully' });
    } catch (error) {
      console.log(error);
    }
  }
});

//add product to wishlist
app.post('/api/wishlist', async (req, res) => {
  //check token
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

  //compare token signature
  if (signature === tokenSignature) {
    const payload = JSON.parse(atob(encodePayload));
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

      const data = req.body;

      await db.query(
        'INSERT INTO wishlist(user_id, product_id, product_size, quantity) VALUES($1, $2, $3, $4)',
        [user.id, data.productId, data.size, data.quantity]
      );
      return res.status(201).json({ msg: 'Add to wishlist successfully' });
    } catch (error) {
      console.log(error);
    }
  }
});

//move product from wishlist to cart
app.post('/api/wishlist/move_to_cart', async (req, res) => {
  //check token
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

  //compare token signature
  if (signature === tokenSignature) {
    const payload = JSON.parse(atob(encodePayload));
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

      await db.query(
        `INSERT INTO cart(user_id, product_id, product_size,quantity)
          SELECT user_id, product_id, product_size,quantity
          FROM wishlist
          WHERE user_id = $1
          `,
        [payload.sub]
      );

      await db.query(
        `DELETE FROM wishlist
          WHERE user_id = $1
          `,
        [payload.sub]
      );
      return res.status(201).json({ msg: 'Add to compare successfully' });
    } catch (error) {
      console.log(error);
    }
  }
});

//delete item from cart
app.delete('/api/cart/:cart_id', async (req, res) => {
  const cartId = req.params.cart_id;
  await db.query('DELETE FROM cart WHERE cart_id = $1', [parseInt(cartId)]);
  return res.json('ok');
});

//delete item from compare
app.delete('/api/compare/:compare_id', async (req, res) => {
  const compareId = req.params.compare_id;
  await db.query('DELETE FROM compare WHERE compare_id = $1', [
    parseInt(compareId)
  ]);
  return res.json('ok');
});

//delete item from wishlist
app.delete('/api/wishlist/:wishlist_id', async (req, res) => {
  const wishlistId = req.params.wishlist_id;
  await db.query('DELETE FROM wishlist WHERE wislist_id = $1', [
    parseInt(wishlistId)
  ]);
  return res.json('ok');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
