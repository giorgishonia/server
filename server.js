const express = require('express');
const session = require('express-session');
const axios = require('axios');
const app = express();

// Middleware for parsing JSON and managing sessions
app.use(express.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

const CLIENT_ID = '1346166562935017484';
const CLIENT_SECRET = 'o0HgaAZaRg2fTZeAa3Prvik7qISQAXMk'; // Your Discord Client Secret
const REDIRECT_URI = 'https://server-lhjq.onrender.com/auth/callback';

// Define the /auth/callback route BEFORE static middleware
app.get('/auth/callback', async (req, res) => {
    const code = req.query.code;
    
    try {
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token',
            new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
                scope: 'identify email'
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${tokenResponse.data.access_token}`
            }
        });

        req.session.user = userResponse.data;
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.redirect('/?error=auth_failed');
    }
});

// Serve static files AFTER route definitions
app.use(express.static('public')); // Put your HTML/CSS/JS in a 'public' folder

app.get('/api/check-auth', (req, res) => {
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

app.post('/api/submit-review', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    console.log('New review:', req.body);
    res.json({ success: true });
});

app.listen(5500, () => {
    console.log('Server running on http://localhost:5500');
});