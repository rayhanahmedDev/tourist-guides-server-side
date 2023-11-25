const express = require("express");
const cors = require("cors");
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
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

    // get the tour guides planner
    app.get('/guides', async(req, res) => {
      const result = await guidesCollection.find().toArray()
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