const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));




mongoose.connect("mongodb+srv://suryankdixit:test123@cluster0.v2feh.mongodb.net/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true })


const itemsSchema = new mongoose.Schema({
    name: String
});
const Item = mongoose.model("item", itemsSchema);


const customSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});
const customList = mongoose.model("list", customSchema);

const item1 = new Item({
    name: "Welcome to your Todo-List"
});

const item2 = new Item({
    name: "Hit + to Add a New item"
});

const item3 = new Item({
    name: "<-- Hit Checkbox to Delete an item"
});

const defaultItems = [item1, item2, item3];


app.get("/", function(req, res) {

    const day = date.getDate();

    Item.find({}, function(err, foundItems) {

        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function(req, res) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully Added Items");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", { listTitle: day, newListItems: foundItems });
        }
    });
});

app.post("/", function(req, res) {

    const item = req.body.newItem;
    const listName = req.body.list;

    const newItem = new Item({
        name: item
    });

    const day = date.getDate();

    if (listName === day) {
        newItem.save();
        res.redirect("/");
    } else {
        customList.findOne({ name: listName }, function(err, foundList) {
            foundList.items.push(newItem);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});


app.post("/delete", function(req, res) {
    console.log(req.body.checkbox);

    const id = req.body.checkbox;
    const listName = req.body.listName;

    const day = date.getDate();

    if (listName === day) {
        Item.findByIdAndRemove(id, function(err) {
            if (err) {
                console.log(err);
            } else {
                console.log("Deleted");
                res.redirect("/");
            }
        });
    } else {
        customList.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: id } } }, function(err, found) {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }
});


app.get("/:title", function(req, res) {

    const page = _.capitalize(req.params.title);
    if (customList.findOne({ name: page }, function(err, result) {
            if (!err) {
                if (!result) {
                    // Create New Custom List
                    const list = new customList({
                        name: page,
                        items: []
                    });

                    list.save();
                    res.redirect("/" + page);

                } else {
                    res.render("list", { listTitle: result.name, newListItems: result.items });
                }
            }
        }));
})


app.listen(3000, function() {
    console.log("Server started on port 3000");
});