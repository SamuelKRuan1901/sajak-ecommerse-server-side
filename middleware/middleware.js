import { base64url } from '../helper.js';
import crypto from 'crypto';

//loged in & create a token
export const createToken = (user, jwtSecret) => {
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

  const token = {
    id: user.id,
    token: `${tokenData}.${signature}`
  };

  return token;
};

//verifi token
export const verifyToken = async (token, db, jwtSecret) => {
  if (!token) {
    return { status: 401 };
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
        return { status: 401, user: null };
      }
      if (payload.exp < Date.now()) {
        return { status: 401, user: null };
      }
      return { status: 201, user };
    } catch (error) {
      console.log(error);
    }
  }
};
