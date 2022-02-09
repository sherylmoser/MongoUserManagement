const express = require('express');
const mongoose = require('mongoose');
const path = require('path')

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
});
app.use(express.static(__dirname + '/public'));

const dbURL = 'mongodb://localhost/userManagement';

mongoose.connect(dbURL);
const udb = mongoose.connection;
udb.on('error', console.error.bind(console, 'connection error:'));
udb.once('open', function () {
    console.log('db connected');
});

app.listen(port, (err) => {
    if (err) console.log(err);
    console.log(`App Server listen on port: ${port}`);
});

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    age: { type: Number, min: 1, max: 99 },
    createdDate: { type: Date, default: Date.now }
});

const collectionName = 'users';
const user = mongoose.model('User', userSchema, collectionName);

app.post('/newUser', (req, res) => {
    console.log(`POST /newUser: ${JSON.stringify(req.body)}`);
    const newUser = new user();
    newUser.firstName = req.body.firstName;
    newUser.lastName = req.body.lastName;
    newUser.email = req.body.email;
    newUser.age = req.body.age;
    newUser.save((err, data) => {
        if (err) {
            return console.error(err);
        }
        console.log(`new user save: ${data}`);
        res.send(`<div>${newUser.firstName} ${newUser.lastName} has been added to the User Database <a href="/">Back</a></div>`);
    });
});
//  test this with`curl --data "firstName=Steve&lastName=Rogers&email=steve@rogers.com&age=25" http://localhost:3000/newUser`

app.post('/updateUser', (req, res) => {
    console.log(`POST /updateUser: ${JSON.stringify(req.body)}`);
    let matchedFirstName = req.body.firstName;
    let matchedLastName = req.body.lastName;
    let editField = req.body.editField;
    let updateForField = req.body.updateForField;
    let userUpdate = {};
    userUpdate[editField] = updateForField;
    let filter = {
        firstName: matchedFirstName,
        lastName: matchedLastName
    }
    console.log(filter)
    user.findOneAndUpdate(filter, userUpdate,
        { new: true }, //return the updated version instead of the pre-updated document 
        (err, data) => {
            if (err) return console.log(`Oops! ${err}`);
            console.log(`data -- ${data}`)
            let returnMsg = `User: ${data.firstName} New ${editField}: ${data[editField]} <a href="/">Back</a></div>`;
            console.log(returnMsg);
            res.send(returnMsg);
        });
});// test this with: `curl --data "name=Steve&age=70" http://localhost:3000/updateUser`

app.post('/deleteUser', (req, res) => {
    let matchedFirstName = req.body.firstName;
    let matchedLastName = req.body.lastName;
    let filter = {
        firstName: matchedFirstName,
        lastName: matchedLastName
    }
    user.findOneAndDelete(filter,
        (err, data) => {
            if (err) return console.log(`Oops! ${err}`);
            let returnMsg = `User: ${matchedFirstName} ${matchedLastName} has been deleted <a href="/">Back</a></div>`
            res.send(returnMsg)
        })
})

app.post('/searchUser/', (req, res) => {
    let matchedFirstName = req.body.firstName;
    let matchedLastName = req.body.lastName;
    user.find({ firstName: matchedFirstName, lastName: matchedLastName }, {}, {}, (err, data) => {
        let result = JSON.stringify(data);
        console.log(`data = ${result}`);
        res.send(result);
    });
});

//test this with `curl http://localhost:3000/user/Steve`

app.get("/getUsers", (req, res) => {
    user.find({}, (err, data) => {
        if (err) return console.log(`Oops! ${err}`);
        //You can access the result from the call back function  
        let result = JSON.stringify(data);
        console.log(`data = ${result}`);
        res.send(result);
    });
})

app.get("/sortLastNameAZ", async (req, res) => {
    const info = await user.find({}).sort({ lastName: 1 })
    res.send(JSON.stringify(info))
})
app.get("/sortLastNameZA", async (req, res) => {
    const info = await user.find({}).sort({ lastName: -1 })
    res.send(JSON.stringify(info))
})
app.get("/sortFirstNameAZ", async (req, res) => {
    const info = await user.find({}).sort({ firstName: 1 })
    res.send(JSON.stringify(info))
})
app.get("/sortFirstNameZA", async (req, res) => {
    const info = await user.find({}).sort({ firstName: -1 })
    res.send(JSON.stringify(info))
})