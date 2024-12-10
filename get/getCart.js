export const getCart = async (userId, db) => {
  try {
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
      [userId]
    );

    return { status: 201, data: cart.rows };
  } catch (error) {
    return { status: 401, data: error };
  }
};
