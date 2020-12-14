// load libraries
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const { ObjectId } = require('mongodb');

require('dotenv').config();

// connection string
// const MONGO_URL = 'mongodb://localhost:27017';

const MONGO_USER = process.env.MONGO_USER;
const MONGO_PASSWORD = process.env.MONGO_PASSWORD;
const MONGO_REMOTE_URL = `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@cluster0.obhmp.mongodb.net/?retryWrites=true&w=majority`;

// create a mongodb client - pool
const mongoClient = new MongoClient(MONGO_REMOTE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// environment configuration
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000;

// create an instance of express
const app = express();

// logging all requests with morgan
app.use(morgan('combined'));
app.use(cors());

// resources

// GET /countries
app.get('/countries', async(req, res) => {
    try {
        const result = await mongoClient.db('winemag')
            .collection('wine')
            .distinct('country');

        // result.reverse();

        res.status(200);
        res.type('application/json');
        res.json(result);
    } catch(error) {
        res.status(500);
        res.type('application/json');
        res.json({ 'Error' : error });
    }
});

// GET /country/:country
app.get('/country/:country', (req, res) => {
    const country = req.params['country'];

    mongoClient.db('winemag')
        .collection('wine')
        .find(
            {   // country: new RegExp(`${country}`, 'i')
                country: {
                    $regex: country,
                    $options: 'i'
                }
            }
        )
        .limit(50)
        .sort(
            {
                province: 1
            }
        )
        .project(
            {
                title: 1,
                price: 1
            }
        )
        .toArray()
        .then((result) => {
            res.status(200);
            res.type('application/json');
            res.json(result);
        })
        .catch((error) => {
            res.status(500);
            res.type('application/json');
            res.json({ 'Error' : error });
        })
});

// GET /wine/:id
app.get('/wine/:id', async(req, res) => {
    const id = req.params['id'];
    // const objId = new ObjectId(id);

    try {
        const result = await mongoClient.db('winemag')
            .collection('wine')
            .find(ObjectId(id))
            .toArray();
        
        res.status(200);
        res.type('application/json');
        res.json(result);
    } catch(error) {
        res.status(500);
        res.type('application/json');
        res.json({ 'Error' : error });
    }
});

// serve frontend
app.use(express.static(__dirname + '/frontend'));

// start server with mongodb
mongoClient.connect()
    .then(() => {
        app.listen(PORT, () => {
            console.info(`[INFO] Application started on port ${PORT} at ${new Date()}`);
        });
    })
    .catch((error) => {
        console.error(`[ERROR] Unable to connect to MongoDB.`);
        console.error(`[ERROR] Error message: ${error}`);
    })