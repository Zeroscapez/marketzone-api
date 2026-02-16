require('dotenv').config({ path: '.env' }); // Replace 'path_to_securitytoken.env' with the actual file path
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const stripeKey = process.env.STRIPE_KEY;
const secretKey = process.env.SECRET_KEY;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const authenticateToken = require('./authMiddleware');
const nodemailer = require('nodemailer');
const helmet = require('helmet')

//const multer = require('multer');


const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(helmet());
//module.exports = app;
const stripe = require('stripe')(stripeKey);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'busterswordisbae@gmail.com',
    pass: process.env.EMAIL_PASS,
  },
});


// Create a MySQL database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});



app.use(bodyParser.json());



// Serve the React frontend from the 'src' directory
app.use('/img/products', express.static(path.join(__dirname, '../img/products')));




app.get('/', (req, res) => {
  res.send('Welcome to My App'); // You can customize this message
});



// Create an endpoint for user registration
app.post('/marketzone/api/register', async (req, res) => {
  try {
    const { first_name, last_name, email, username, password, street, zip_code, state } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users (first_name, last_name, email, username, password, street, zip_code, state)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [first_name, last_name, email, username, hashedPassword, street, zip_code, state],
      (error) => {
        if (error) return res.status(500).json({ success: false });
        res.json({ success: true, message: 'Registration Successful' });
      }
    );

  } catch (err) {
    res.status(500).json({ success: false, message: 'Registration Failed' });
  }
});



app.post('/marketzone/api/login', async (req, res) => {
  const { username, password } = req.body;

  const sql = `SELECT id, username, password FROM users WHERE username = ?`;

  db.query(sql, [username], async (error, results) => {
    if (error || results.length === 0) {
      return res.json({ success: false, message: 'Invalid credentials' });
    }

    const user = results[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY, {
      expiresIn: '24h',
    });

    res.json({ success: true, token });
  });
});




app.get('/marketzone/api/userData', authenticateToken, (req, res) => {
  const userId = req.user.id;
  console.log(req.user.id);
  // Query user data from your database based on the userId
  const sql = `SELECT username FROM users WHERE id = ?`;

  db.query(sql, [userId], (error, results) => {
    if (error) {
      console.error('Database error:', error);
      res.json({ success: false, message: 'Failed to retrieve user data' });
    } else {
      if (results.length === 0) {
        res.json({ success: false, message: 'User not found' });
      } else {
        res.json({ success: true, data: results[0] });
      }
    }
  });
});

//  API endpoint for fetching user account details
app.get('/marketzone/api/accountDetails', authenticateToken, (req, res) => {
  const userId = req.user.id;

  // Query user account details from your database based on the userId
  const sql = `SELECT first_name, last_name, username, email, reward_points FROM users WHERE id = ?`;

  db.query(sql, [userId], (error, results) => {
    if (error) {
      console.error('Database error:', error);
      res.json({ success: false, message: 'Failed to retrieve account details' });
    } else {
      if (results.length === 0) {
        res.json({ success: false, message: 'User not found' });
      } else {
        res.json({ success: true, data: results[0] });
      }
    }
  });

  res.header('Access-Control-Allow-Origin', '*');
});

//  API endpoint for password reset
app.post('/marketzone/api/resetPassword', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { newPassword } = req.body;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const sql = `UPDATE users SET password = ? WHERE id = ?`;

    db.query(sql, [hashedPassword, userId], (error) => {
      if (error) return res.status(500).json({ success: false });
      res.json({ success: true });
    });

  } catch (err) {
    res.status(500).json({ success: false });
  }
});

//  API endpoint for listing products
app.post('/marketzone/api/listProducts', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { name, description, price, image, quantity } = req.body;

  // Implement the logic to insert the product listing into your MySQL database
  const sql = `
    INSERT INTO products (user_id, image, name, description, price, quantity)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [userId, image, name, description, price, quantity], (error, results) => {
    if (error) {
      console.error('Database error:', error);
      res.json({ success: false, message: 'Product listing failed' });
    } else {
      console.log('Product listed:', results);
      res.json({ success: true, message: 'Product listed successfully' });
    }
  });
});


//API endpoint to fetch the user's product listings
app.get('/marketzone/api/userProducts', authenticateToken, (req, res) => {
  const userId = req.user.id;

  // Implement the logic to fetch the user's product listings from your database
  const sql = `SELECT id, image, name, description, price, quantity FROM products WHERE user_id = ?`;

  db.query(sql, [userId], (error, results) => {
    if (error) {
      console.error('Database error:', error);
      res.json({ success: false, message: 'Failed to retrieve product listings' });
    } else {
      res.json({ success: true, data: results });
    }
  });
});


app.get('/marketzone/api/products', (req, res) => {
  // Query all products with user information, including quantity
  const sql = `
    SELECT p.id, p.image, p.name, p.description, p.price, p.quantity, u.username
    FROM products p
    INNER JOIN users u ON p.user_id = u.id
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error('Database error:', error);
      res.json({ success: false, message: 'Failed to retrieve products' });
    } else {
      res.json({ success: true, data: results });
    }
  });
});


//API endpoint for fetching the user's cart items
app.get('/marketzone/api/cart', authenticateToken, (req, res) => {
  const userId = req.user.id;

  // Implement the logic to fetch the user's cart items from your database
  const sql = `
  SELECT c.product_id, p.image, p.name, p.price, c.quantity
  FROM cart c
  INNER JOIN products p ON c.product_id = p.id
  WHERE c.user_id = ?
`;


  db.query(sql, [userId], (error, results) => {
    if (error) {
      console.error('Database error:', error);
      res.json({ success: false, message: 'Failed to retrieve cart items' });
    } else {
      res.json({ success: true, data: results });
    }
  });
});

app.post('/marketzone/api/addToCart', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const product = req.body.product;

  // Implement the logic to insert the product into the user's cart

  const sql = `
  INSERT INTO cart (user_id, product_id, quantity)
  VALUES (?, ?, 1) 
  ON DUPLICATE KEY UPDATE quantity = quantity + 1
`;


  db.query(sql, [userId, product.id], (error, results) => {
    if (error) {
      console.error('Database error:', error);
      res.status(500).json({ success: false, message: 'Failed to add product to cart' });
    } else {
      console.log('Product added to cart:', results);
      res.json({ success: true, message: 'Product added to cart successfully' });
    }
  });
});

app.delete('/marketzone/api/cart/:productId', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const productId = req.params.productId;

  // Implement the logic to delete the item from the user's cart
  const sql = 'DELETE FROM cart WHERE user_id = ? AND product_id = ?';

  db.query(sql, [userId, productId], (error, results) => {
    if (error) {
      console.error('Database error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete item from cart' });
    } else {
      console.log('Item deleted from cart:', results);
      res.json({ success: true, message: 'Item deleted from cart successfully' });
    }
  });
});




app.post('/marketzone/api/checkout', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { shippingAddress, billingAddress, cardToken, amount } = req.body;

    // Calculate reward points earned from the order (2 points for every $1 spent)
    const rewardPointsEarned = Math.floor(amount * 2);

    // Update user's reward points
    const updateRewardPointsSQL = `
      UPDATE users SET reward_points = reward_points + ? WHERE id = ?
    `;
    await db.promise().execute(updateRewardPointsSQL, [rewardPointsEarned, userId]);

    // Create Billing and Shipping Addresses
    const createBillingAddressSQL = `
      INSERT INTO billing_addresses (user_id, street, city, state, zip)
      VALUES (?, ?, ?, ?, ?)
    `;

    const createShippingAddressSQL = `
      INSERT INTO shipping_addresses (user_id, street, city, state, zip)
      VALUES (?, ?, ?, ?, ?)
    `;

    const billingAddressResult = await db.promise().execute(createBillingAddressSQL, [
      userId,
      billingAddress.street,
      billingAddress.city,
      billingAddress.state,
      billingAddress.zip,
    ]);

    const shippingAddressResult = await db.promise().execute(createShippingAddressSQL, [
      userId,
      shippingAddress.street,
      shippingAddress.city,
      shippingAddress.state,
      shippingAddress.zip,
    ]);

    const billingAddressId = billingAddressResult[0].insertId;
    const shippingAddressId = shippingAddressResult[0].insertId;

    // Create Order
    const createOrderSQL = `
      INSERT INTO orders (user_id, billing_address_id, shipping_address_id, total_amount)
      VALUES (?, ?, ?, ?)
    `;

    const orderResult = await db.promise().execute(createOrderSQL, [
      userId,
      billingAddressId,
      shippingAddressId,
      amount,
    ]);

    const orderId = orderResult[0].insertId;

    // Fetch Cart Items
    const cartItemsSQL = `
      SELECT c.product_id, p.name, p.price, c.quantity, p.quantity AS available_quantity
      FROM cart c
      INNER JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `;

    const cartItemsResult = await db.promise().query(cartItemsSQL, [userId]);
    const cartItems = cartItemsResult[0];

    // Create Order Items and update product quantities
    const orderItems = cartItems.map((cartItem) => [
      orderId,
      cartItem.product_id,
      cartItem.quantity,
      cartItem.price * cartItem.quantity,
    ]);

    const createOrderItemsSQL = `
      INSERT INTO order_items (order_id, product_id, quantity, total_price)
      VALUES (?, ?, ?, ?)
    `;

    const updateProductQuantitySQL = `
      UPDATE products SET quantity = quantity - ? WHERE id = ?
    `;

    const removeProductSQL = `
      DELETE FROM products WHERE id = ?
    `;

    await Promise.all(
      cartItems.map(async (cartItem) => {
        await db.promise().execute(createOrderItemsSQL, [
          orderId,
          cartItem.product_id,
          cartItem.quantity,
          cartItem.price * cartItem.quantity,
        ]);

        const newQuantity = cartItem.available_quantity - cartItem.quantity;

        if (newQuantity <= 0) {
          await db.promise().execute(removeProductSQL, [cartItem.product_id]);
        } else {
          await db.promise().execute(updateProductQuantitySQL, [
            cartItem.quantity,
            cartItem.product_id,
          ]);
        }
      })
    );


    // Clear Cart
    const clearCartSQL = 'DELETE FROM cart WHERE user_id = ?';
    await db.promise().execute(clearCartSQL, [userId]);

    const mailOptions = {
      from: 'busterswordisbae@gmail.com',
      to: 'agyeilomini@gmail.com',
      subject: 'Order Confirmation',
      html: `
        <h1>Your Order Details</h1>
        <p>Order ID: ${orderId}</p>
        <p>Total Amount: ${amount}</p>
        <!-- Add more order details here as needed -->
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'Checkout successful', orderId, rewardPointsEarned });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ success: false, message: 'Checkout failed' });
  }
});





app.get('/marketzone/api/orders', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const ordersSQL = `
    SELECT orders.order_id, orders.total_amount,
           GROUP_CONCAT(CONCAT(products.name, ' (Quantity:', order_items.quantity, ')') SEPARATOR ', ') AS products_list, 
           CONCAT(shipping_addresses.street, ', ', shipping_addresses.city, ', ', shipping_addresses.state, ' ', shipping_addresses.zip) AS shipping_address, 
           CONCAT(billing_addresses.street, ', ', billing_addresses.city, ', ', billing_addresses.state, ' ', billing_addresses.zip) AS billing_address
    FROM orders
    INNER JOIN order_items ON orders.order_id = order_items.order_id
    INNER JOIN products ON order_items.product_id = products.id
    INNER JOIN shipping_addresses ON orders.shipping_address_id = shipping_addresses.id
    INNER JOIN billing_addresses ON orders.billing_address_id = billing_addresses.id
    
    WHERE orders.user_id = ?
    GROUP BY orders.order_id
  `;

  db.query(ordersSQL, [userId], (error, results) => {
    if (error) {
      console.error('Error fetching user orders:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve user orders' });
    } else {
      res.json({ success: true, data: results });
    }
  });
});


const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10, // Adjust as needed
});

// To execute queries using the pool:
pool.query('SELECT 1 + 1 AS solution', (error, results, fields) => {
  if (error) throw error;
  console.log('The solution is: ', results[0].solution);
});






//Start the Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

