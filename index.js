const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Todo = require("./models/todo");

const port = 3000;

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const dburl = "mongodb://localhost:27017/tododb";
mongoose.connect(dburl, { useNewUrlParser: true, useUnifiedTopology: true });

app.get("/", (request, response) => {
    Todo.find()
        .then(result => {
            response.render("index", { todos: result }); 
            console.log(result); 
        })
        .catch(error => {
            console.error("Error occurred while fetching todos:", error);
            response.status(500).send("Internal Server Error");
        });
});

app.post("/", (request, response) => {
    const todo = new Todo({
        todo: request.body.todoValue
    });
    todo.save()
        .then(result => {
            response.redirect("/");
        })
        .catch(error => {
            console.error("Error occurred while saving todo:", error);
            response.status(500).send("Internal Server Error");
        });
});

app.delete("/:id", (request, response) => {
    const id = request.params.id;
    if (!id) {
        return response.status(400).send("ID parameter is missing");
    }

    Todo.findByIdAndDelete(id)
        .then(result => {
            if (!result) {
                return response.status(404).send("Todo not found");
            }
            console.log(result);
            response.sendStatus(200);
        })
        .catch(error => {
            console.error(error);
            response.sendStatus(500);
        });
});

app.get("/edit/:id", (request, response) => {
    const id = request.params.id;
    if (!id) {
        return response.status(400).send("ID parameter is missing");
    }

    Todo.findById(id)
        .then(todo => {
            if (!todo) {
                return response.status(404).send("Todo not found");
            }
            // Render the "edit" view with the todo data
            response.render("edit", { todo: todo });
        })
        .catch(error => {
            console.error(error);
            response.sendStatus(500);
        });
});

// Define route handler for updating todo
app.post("/update/:id", (request, response) => {
    const id = request.params.id;
    const updatedTodoText = request.body.todo;
    Todo.findByIdAndUpdate(id, { todo: updatedTodoText }, { new: true })
        .then(updatedTodo => {
            if (!updatedTodo) {
                return response.status(404).send("Todo not found");
            }
            console.log("Updated todo:", updatedTodo);
            response.redirect("/");
        })
        .catch(error => {
            console.error(error);
            response.sendStatus(500);
        });
});


app.listen(port, () => {
    console.log("Server is running on port " + port);
});
