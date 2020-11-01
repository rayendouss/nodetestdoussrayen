const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config()
const User = require('./models/User')
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.text());
var rateLimit = [];
const connectDB = async () => {
    try{
        await mongoose.connect("mongodb+srv://rayen123:rayen123@testnode.ou1rn.mongodb.net/TestNode?retryWrites=true&w=majority", {
            useNewUrlParser: true,
        });
        console.log("mongodb connected");

    }
    catch (err) {
        console.log(err.message);
        process.exit(1);

    }
}

connectDB();

app.get('/api', (req, res) => {
    res.json({
        message: 'Welcome to the API'
    });
});

app.post('/api/justify', verifyToken, (req, res) => {
    jwt.verify(req.token, 'secretkey', (err) => {

        // Check Authorization
        if (err) {
            res.sendStatus(403);
            return;
        }
        else {
            onJustifyVerified(req.body,req.token);
        }

    });

    function onJustifyVerified() {

        res.type("text/plain");
        var text = req.body;

        // Check content
        if (!text) {
            res.send('');
            return;
        }
        // Check current user data
        if (!checkUserRates()) {
            return;
        }
        var cmp = 79;
        var newtext = "";
        var j;
        text = text.replace(/\s\s+/g, ' ');
        for (var i = 0; i < text.length; i++) {
            newtext += text[i];
            if (i == cmp ) {
                if (text[i] == ' ' || text[i] == ',' || text[i] == '.') {
                    newtext += '\n';
                    cmp = i + 1 + 80;
                }
                else {
                    j = 0;
                    while (text[i] !== ' ' && text[i] !== '.' && text[i] !== ',') {
                        i = i - 1;
                        j++;
                    }
                    newtext = newtext.substr(0, newtext.length - j);
                    newtext += '\n';
                    cmp = i + 80;
                }
            }
        }
        res.send(addSpace(newtext));
    }


    function checkUserRates() {
        var textWords = req.body;

        var userRateLimit = rateLimit[req.token];
    
        if (!userRateLimit || !userRateLimit.date) {
            res.sendStatus(403);
            return false;
        }
    
        // Check words rate
        let userDay = userRateLimit.date.getDate();
        let currentDay = new Date().getDate();
    
        if (currentDay !== userDay) {
            userRateLimit.date = new Date();
            userRateLimit.words = 0;
        }
        //console.log(textWords.length);
    
        if (userRateLimit.words + textWords.length > 80000) {
            res.status(402).json({ message: '402 Payment Required.' });
            return false;
        }
    
        //console.log(textWords.length + userRateLimit.words);
        // Update words count
        userRateLimit.words = userRateLimit.words + textWords.length;
    
        rateLimit[req.token] = userRateLimit;
    
        return true;
    }
    

});

app.post('/api/token',async function (req, res) {
    const email = req.body.email;
    console.log("aaa",email)
    var userr =  await User.findOne({ 'email' :email});
        
    console.log("aaa",{userr})
    const user = {
            email: req.body.email
        }
if(userr){
    console.log(userr.email)
        jwt.sign({ user }, 'secretkey', { expiresIn: '24h' }, (err, token) => {
            rateLimit[token] = { words: 0, date: new Date() };
            //console.log(rateLimit[token]);
            res.json({
                token
            });
        });} else{
            res.json({msg:"user not exist"})
        }
    });



// FORMAT OF TOKEN
// authorization: <access_token>

// Verify Token
function verifyToken(req, res, next) {
    // Get auth header value
    const header = req.headers['authorization'];
    // Check if header is undefined
    if (typeof header !== 'undefined') {
        // Set the token
        req.token = header;
        // Next 
        next();
    } else {
        // Forbidden
        res.sendStatus(403);
    }

}

function addSpace(text) {
    MaxLineLength = 80;

    var newLines = text.split(/\n/);

    for (var i = 0; i < newLines.length; i++) {

        var line = newLines[i].trim();
        console.log(line.length);

        if (line.length >= MaxLineLength) {
            //console.log(line);
            continue;
        }
        var k = 1;
        for (var j = 0; j < line.length; j++) {

            if (line[j] == " " && line.length < MaxLineLength) {
                line = setCharAt(line, j, "  ");
                j = j + k;
                //console.log(line.length);
            }
            if (j == line.length - 1 && line.length < MaxLineLength) {
                j = 0;
                k++;
            }
        }
        newLines[i] = line;
    }
    return newLines.join("\n");

}


function setCharAt(str, index, chr) {
    if (index > str.length - 1) return str;
    return str.substr(0, index) + chr + str.substr(index + 1);
}

app.listen(5000 || process.env.PORT, () => console.log('Server started on port 5000'));