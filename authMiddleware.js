// authMiddleware.js

const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY;// Replace with your actual secret key

function authenticateToken(req, res, next) {
  const authHeader = req.header('Authorization');


  if (!authHeader) {

    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
  }

  // Split the header to extract the token (assuming "Bearer" is followed by a space)
  const token = authHeader.split(' ')[1]; // Extract the token part
  console.log('Received Token:', token); // Log the received token

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {

      return res.status(403).json({ success: false, message: 'Forbidden: Invalid token' });
    }


    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
