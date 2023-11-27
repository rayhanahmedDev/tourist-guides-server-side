const express = require("express");
const cors = require("cors");
var jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
// tourist-guide
// ikKVVhutivc0zy3d

app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.or5ssuz.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const packageCollection = client.db('TouristDB').collection('ourPackages')
    const userCollection = client.db('TouristDB').collection('user')
    const guidesCollection = client.db('TouristDB').collection('tourGuides')
    const tourTypeCollection = client.db('TouristDB').collection('tourType')
    const stroyCollection = client.db('TouristDB').collection('touristStory')

    // jwt section
    app.post('/jwt', async(req, res ) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_TOKEN , {expiresIn: '365d'})
      console.log(token);
      res.send({token})
    })

    // verified token middleware
    const verifyToken = (req, res, next) => {
      console.log('verify token', req.headers.authorization);
      if(!req.headers.authorization){
        res.status(401).send({message : 'unauthorized access'})
      }
      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
        if(err){
          return res.status(401).send({message : 'unauthorized access'})
        }else{
          req.decoded = decoded;
          next()
        }
      })
    }

    // get the packages collection
    app.get('/packages', async(req, res) => {
        const result = await packageCollection.find().toArray()
        res.send(result)
    })

    // post the package collection in the wishlist
    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user)
      res.send(result)
    })

    // get the user data
    app.get('/users',verifyToken, async(req, res) => {
      const email = req.query.email
      const query = {email:email}
      const result = await userCollection.find(query).toArray()
      res.send(result)
    })

    // delete specific data
    app.get('/users/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await userCollection.findOne(query)
      res.send(result)
    })
    // delete specific data
    app.delete('/users/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await userCollection.deleteOne(query)
      res.send(result)
    })

    // get the tour guides planner
    app.get('/guides', async(req, res) => {
      const result = await guidesCollection.find().toArray()
      res.send(result)
    })

    // get the specific guides
    app.get('/guides/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await guidesCollection.findOne(query)
      res.send(result)
    })

    // get the tour type data
    app.get('/tourTypes', async(req, res) => {
      const result = await tourTypeCollection.find().toArray()
      res.send(result)
    })

    // get each tour type data
    app.get('/tourTypes/:tourType', async(req,res) =>{
      const tourType = req.params.tourType;
      const tours = await tourTypeCollection.find().toArray()
      const result= await tours.filter( tour => tour.tourType === tourType)
      res.send(result)
    })

    // story section, and get the story
    app.get('/touristStory', async(req, res) => {
      const result = await stroyCollection.find().toArray()
      res.send(result)
    })

    // get the specific stroy
    app.get('/touristStory/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await stroyCollection.findOne(query)
      res.send(result)
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("Tourist is running...");
  });

  app.listen(port, () => {
    console.log(`Simple Crud is Running on port ${port}`);
  });