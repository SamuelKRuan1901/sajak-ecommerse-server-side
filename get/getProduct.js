export const getProducts = async (db) => {
  try {
    const result = await db.query('SELECT * FROM products ORDER BY id ASC');
    const products = result.rows;
    return products;
  } catch (error) {
    console.log(error);
  }
};
