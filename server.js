require('dotenv').config({ path: '../../.env' }); // Replace 'path_to_securitytoken.env' with the actual file path
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const secretKey = process.env.SECRET_KEY;
const jwt = require('jsonwebtoken');
const authenticateToken = require('./authMiddleware');
const multer = require('multer');


const app = express();
//const port = 3306;
//module.exports = app;
const stripe = require('stripe')('sk_test_51OAf3dEFbooIJPsjARXvnzJo13Hq8ArzV4bUbZew57Yjsw8GnDYq4IDoSWN36tpHXuaroWu239gcrx7xbRBDWpqd00BV6pxEWp');


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

// Define storage for the uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, process.env.PUBLIC_IMG); // Set the destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    // Use the original name of the file as the filename
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });


app.use(bodyParser.json());

// Enable CORS for all routes
app.use(cors());

// Serve the React frontend from the 'src' directory
app.use('/img/products', express.static(path.join(__dirname, '../img/products')));




app.get('/', (req, res) => {
    res.send('Welcome to My App'); // You can customize this message
  });



// Create an endpoint for user registration
app.post('/marketzone/api/register', (req, res) => {
  // ... (registration logic)

  // Get the registration data from the request body
  const userData = req.body;

  const { first_name, last_name, email, username, password, street, zip_code, state } = userData;

  const sql = `
    INSERT INTO users (first_name, last_name, email, username, password, street, zip_code, state)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.query(sql, [first_name, last_name, email, username, password, street, zip_code, state], (error, results) => {
    if (error) {
      console.error('Database error:', error);
      res.json({ success: false, message: 'Registration failed' });
    } else {
      console.log('User registered:', results);
      res.json({ success: true, message: 'Registration successful' });
    }
  });

  // Enable CORS for this specific route
  res.header('Access-Control-Allow-Origin', '*');

  // ... (response logic)
});



app.post('/marketzone/api/login', (req, res) => {
  const loginData = req.body;
  const { username, password } = loginData;

  // Implement the logic to verify the user's credentials
  const sql = `SELECT id, username FROM users WHERE username = ? AND password = ?`; // Include 'id' in the query

  db.query(sql, [username, password], (error, results) => {
    if (error) {
      console.error('Database error:', error);
      res.json({ success: false, message: 'Login failed' });
    } else {
      if (results.length === 0) {
        res.json({ success: false, message: 'Invalid username or password' });
      } else {
        // User is authenticated; generate a JWT token
        const user = { id: results[0].id, username: username }; // Include 'id' in the payload
        const token = jwt.sign(user, secretKey, { expiresIn: '10h' });

        // Send the token in the response
        res.json({ success: true, token });
      }
    }
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

// Add a new API endpoint for fetching user account details
app.get('/marketzone/api/accountDetails', authenticateToken, (req, res) => {
  const userId = req.user.id;

  // Query user account details from your database based on the userId
  const sql = `SELECT first_name, last_name, username FROM users WHERE id = ?`;

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
});

// Add a new API endpoint for password reset
app.post('/marketzone/api/resetPassword', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const newPassword = req.body.newPassword;

  // Implement the logic to reset the user's password in your database
  const sql = `UPDATE users SET password = ? WHERE id = ?`;

  db.query(sql, [newPassword, userId], (error, results) => {
    if (error) {
      console.error('Database error:', error);
      res.json({ success: false, message: 'Password reset failed' });
    } else {
      res.json({ success: true, message: 'Password reset successful' });
    }
  });
});

// Add a new API endpoint for listing products
app.post('/marketzone/api/listProducts', authenticateToken, upload.single('image'), (req, res) => {
  const userId = req.user.id;
  const { name, description, price } = req.body;
  const image = "../img/products/" + req.file.filename; // Use the filename provided by multer

  // Implement the logic to insert the product listing into your MySQL database
  const sql = `INSERT INTO products (user_id, image, name, description, price) VALUES (?, ?, ?, ?, ?)`;

  db.query(sql, [userId, image, name, description, price], (error, results) => {
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
  const sql = `SELECT id, image, name, description, price FROM products WHERE user_id = ?`;

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
  // Query all products with user information
  const sql = `
    SELECT p.id, p.image, p.name, p.description, p.price, u.username
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

  // Implement the logic to insert the product into the user's cart in your MySQL database
  // You will need to adjust this SQL query based on your database schema.
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

  // Implement the logic to delete the item from the user's cart in your database using productId.
  // You will need to adjust this SQL query based on your database schema.
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

    // Step 1: Create Billing and Shipping Addresses
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

    // Step 3: Fetch Cart Items
    const cartItemsSQL = `
      SELECT p.id AS product_id, p.name, p.price, c.quantity
      FROM cart c
      INNER JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `;

    const cartItemsResult = await db.promise().query(cartItemsSQL, [userId]);
    const cartItems = cartItemsResult[0];

    // Step 4: Create Order Items
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

    await Promise.all(orderItems.map((item) => db.promise().execute(createOrderItemsSQL, item)));

    // Step 5: Clear Cart
    const clearCartSQL = 'DELETE FROM cart WHERE user_id = ?';
    await db.promise().execute(clearCartSQL, [userId]);

    res.json({ success: true, message: 'Checkout successful', orderId });
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







// Define a catch-all route to serve the main HTML file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/index.html'));
});

// Start the server
//app.listen(port, () => {
//  console.log(`Server is running on port ${port}`);
//});

