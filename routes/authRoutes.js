const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const router = express.Router();
require('dotenv').config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const client = new OAuth2Client(CLIENT_ID);

router.post('/auth/google', async (req, res) => {
    const { token } = req.body;
  
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID, 
      });
      const payload = ticket.getPayload();
      
      // This is your Google user profile
      const user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture 
      };
  
      res.status(200).json({ user });
    } catch (error) {
      console.error("Error during Google login:", error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });
  

module.exports = router;
