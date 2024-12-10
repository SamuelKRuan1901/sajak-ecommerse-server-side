export const getShopProducts = async (req, db) => {
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
      return products.slice(0, 8);
    }
    if (limit === '12') {
      return products.slice(0, 12);
    }
    if (limit === 'all') {
      return products.slice(0, products.length);
    }
  } catch (error) {
    console.log(error);
  }
};
