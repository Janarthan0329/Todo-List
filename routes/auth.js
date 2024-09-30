const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const router = express.Router();

// Sign up route
router.post('/signup', async (req, res) => {
    const { fullName, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).send('User already exists');
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(`Hashed password for ${email}: ${hashedPassword}`); // Log hashed password

        user = new User({ fullName, email, password: hashedPassword });
        await user.save();

        req.session.userId = user._id;
        res.redirect('/');
        res.alert("Sign up successfully!!!");
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});


// Login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.log(`User not found for email: ${email}`);
            return res.status(400).send('Invalid credentials');
        }

        console.log(`Received login attempt for email: ${email}`);
        console.log(`Stored hashed password: ${user.password}`);

        // Compare the password with the hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log("Password match result:", isMatch);

        if (!isMatch) {
            console.log(`Password did not match for email: ${email}`);
            return res.status(400).send('Invalid credentials');
        }

        req.session.userId = user._id;
        res.redirect('/');
        res.alert("Log In successfully!!!");
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});


// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error during logout:", err);
            return res.status(500).send('Server error');
        }
        res.redirect('/');
    });
});

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/login');
};

// Protecting routes
router.get('/protected', isAuthenticated, (req, res) => {
    res.send('This is a protected route');
});

module.exports = router;
