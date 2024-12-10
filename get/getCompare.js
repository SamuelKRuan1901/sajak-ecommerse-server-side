export const getCompare = async (userId, db) => {
  try {
    const compare = await db.query(
      `
        SELECT compare.compare_id,products.id, products.name, products.price, products.image1, compare.product_size FROM products
        JOIN compare
        ON products.id = compare.product_id  
        JOIN users
        ON users.id = compare.user_id
        WHERE user_id=$1
        ORDER BY product_id ASC
        `,
      [userId]
    );
    return { status: 201, data: compare.rows };
  } catch (error) {
    return { status: 401, data: error };
  }
};
