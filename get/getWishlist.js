export const getWishlist = async (userId, db) => {
  try {
    const wishlist = await db.query(
      `
        SELECT wishlist.wishlist_id,products.id, products.name, products.price, products.image1, wishlist.product_size FROM products
        JOIN wishlist
        ON products.id = wishlist.product_id  
        JOIN users
        ON users.id = wishlist.user_id
        WHERE user_id=$1
        ORDER BY product_id ASC
        `,
      [userId]
    );

    return { status: 201, data: wishlist.rows };
  } catch (error) {
    return { status: 401, error };
  }
};
