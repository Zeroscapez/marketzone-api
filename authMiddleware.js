// authMiddleware.js

const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY;// Replace with your actual secret key

function authenticateToken(req, res, next) {
    const authHeader = req.header('Authorization');
    console.log('Authorization Header:', authHeader); // Log the received header
  
    if (!authHeader) {
      console.log('Authorization header missing');
      return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
    }
  
    // Split the header to extract the token (assuming "Bearer" is followed by a space)
    const token = authHeader.split(' ')[1]; // Extract the token part
    console.log('Received Token:', token); // Log the received token
  
    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        console.log('Token verification error:', err);
        return res.status(403).json({ success: false, message: 'Forbidden: Invalid token' });
      }
  
      console.log('Decoded User:', user); // Log the decoded user
      req.user = user;
      next();
    });
  }

module.exports = authenticateToken;
