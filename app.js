//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//create new database in mongodb
mongoose.connect('mongodb://localhost:27017/todolistDB', { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false  });

//create new schema
const itemsSchema = new mongoose.Schema ({
  name: {
    type: String,
    requred: true
  }
})
  
const Item = mongoose.model('Item', itemsSchema)

const item1 = new Item({
  name: "Welcome to your todo list",
})

const item2 = new Item({
  name: "Hit the + button to add a new item",
})

const item3 = new Item({
  name: "<-- Hit this to delete an item",
})

const defaulItems = [item1, item2, item3];
const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model('List',listSchema);

let day = new Date().toLocaleDateString("en-US", {
  weekday: 'long',
  day: 'numeric',
  month: 'long'
});
app.get("/", function(req, res) {
  Item.find({}, function (err, result) {
    if (result.length === 0) {
      Item.insertMany(defaulItems, function (err) {
        if (err) {
          console.log(err);
        }
        else{
          console.log("Sucessfully saved default to database");
        }
      })
      res.redirect('/')
    }else{
      res.render("list", {listTitle: day, newListItems: result});
    }
  })
});

app.get('/:customListName', function (req, res) {
  const customListName = req.params.customListName

  List.findOne({name: customListName}, function(err, result) {
    if (!err) {
      //if no list was found
      if (!result) {
        //path where we create a new list
        const list = new List({
        name: customListName,
        items: defaulItems
      })
      // list.save()
      // res.redirect('/' + customListName)
      list.save(function() {
        res.redirect('/' + customListName);
      })
      } else{
        //show an existing list
        res.render('list', {listTitle: result.name, newListItems: result.items})
      }
    }
  })
})


app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list

  const item = new Item({
    name: itemName
  })

  if (listName === day) {
    // item.save();
    // res.redirect('/');
    item.save(function() {
      res.redirect('/');
    })
  }else{
    List.findOne({name: listName}, function(err, result) {
      result.items.push(item)
      // result.save()
      // res.redirect('/' + listName)
      result.save(function() {
        res.redirect("/" + listName);
    })
    })
  }
  
});

app.post('/delete', function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === day) {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }
})



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
