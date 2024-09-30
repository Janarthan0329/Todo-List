const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcrypt"); // Import bcrypt for password hashing
require('dotenv').config();
const mongoose = require('mongoose');
const Todo = require("./models/todo");
const User = require("./models/user"); // Import your User model

const port = process.env.PORT || 3000;

// Middleware setup
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session management
app.use(session({
    secret: process.env.SESSION_SECRET || 'mydemosecretkey123', // Use a strong secret in production
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

// Connect to MongoDB Atlas using the URI from the .env file
const dburl = process.env.MONGO_URI;

mongoose.connect(dburl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => {
        console.error('Error connecting to MongoDB Atlas:', err);
        process.exit(1);
    });

// Fetch all todos and render them on the homepage
app.get("/", async (req, res) => {
    try {
        const todos = await Todo.find();
        res.render("index", { todos, user: req.session.user }); // Pass user session to views
    } catch (error) {
        console.error("Error occurred while fetching todos:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Define the calendar route
app.get('/features/calendar', (req, res) => {
    console.log('Calendar route accessed');
    res.render('calendar');
});

// Define the clock route
app.get('/features/clock', (req, res) => {
    console.log('Clock route accessed');
    res.render('clock');
});

// Define the calculator route
app.get('/features/calculator', (req, res) => {
    console.log('Calculator route accessed');
    res.render('calculator');
});

// Serve the About page
app.get("/about", (req, res) => {
    res.render("about");
});

// Serve the Contact us page
app.get("/contact", (req, res) => {
    res.render("contact");
});

// Serve the Login/Signup page
app.get("/login", (req, res) => {
    res.render("auth");
});

// Handle user login
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        // Log the received email for debugging
        console.log("Received login attempt for email:", email);
        
        // Find the user by email
        const user = await User.findOne({ email });
        
        // If user is found, compare passwords
        if (user) {
            const isMatch = await bcrypt.compare(password, user.password);
            console.log("Password match result:", isMatch);

            if (isMatch) {
                // Store user in session
                req.session.user = { email }; 
                return res.redirect("/");
                return res.alert("Log In successfully!!!");
            }
        }
        
        // If user not found or password doesn't match
        res.status(401).send("Invalid email or password");
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).send("Internal Server Error");
    }
});


// Handle user signup
app.post("/signup", async (req, res) => {
    const { fullName, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send("User with this email already exists.");
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
        });

        await newUser.save();
        console.log(`User signed up: ${fullName}, ${email}`);

        // Automatically log the user in after signup
        req.session.user = { email }; // Store user in session
        res.redirect("/");
    } catch (error) {
        console.error("Error occurred during signup:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Add a new todo
app.post("/", async (req, res) => {
    const todo = new Todo({
        todo: req.body.todoValue
    });

    try {
        await todo.save();
        res.redirect("/");
    } catch (error) {
        console.error("Error occurred while saving todo:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Delete a todo by ID
app.delete("/:id", async (req, res) => {
    const id = req.params.id;

    if (!id) {
        return res.status(400).send("ID parameter is missing");
    }

    try {
        const deletedTodo = await Todo.findByIdAndDelete(id);
        if (!deletedTodo) {
            return res.status(404).send("Todo not found");
        }
        res.sendStatus(200);
    } catch (error) {
        console.error("Error occurred while deleting todo:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Get a specific todo for editing
app.get("/edit/:id", async (req, res) => {
    const id = req.params.id;

    if (!id) {
        return res.status(400).send("ID parameter is missing");
    }

    try {
        const todo = await Todo.findById(id);
        if (!todo) {
            return res.status(404).send("Todo not found");
        }
        res.render("edit", { todo });
    } catch (error) {
        console.error("Error occurred while fetching todo for editing:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Update a todo by ID
app.post("/update/:id", async (req, res) => {
    const id = req.params.id;
    const updatedTodoText = req.body.todo;

    if (!id || !updatedTodoText) {
        return res.status(400).send("Missing required parameters");
    }

    try {
        const updatedTodo = await Todo.findByIdAndUpdate(id, { todo: updatedTodoText }, { new: true });
        if (!updatedTodo) {
            return res.status(404).send("Todo not found");
        }
        res.redirect("/");
    } catch (error) {
        console.error("Error occurred while updating todo:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
