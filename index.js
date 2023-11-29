const express = require("express");
const cors = require("cors");
var jwt = require('jsonwebtoken');
require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware


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
    const signUpUserCollection = client.db('TouristDB').collection('signUpUser')
    const bookedCollection = client.db('TouristDB').collection('bookings')
    const paymentCollection = client.db('TouristDB').collection('payment')

    // jwt section
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_TOKEN, { expiresIn: '365d' })
      console.log(token);
      res.send({ token })
    })

    // verified token middleware
    const verifyToken = (req, res, next) => {
      console.log('verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        res.status(401).send({ message: 'unauthorized access' })
      }
      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        } else {
          req.decoded = decoded;
          next()
        }
      })
    }

    // host section start
    // verify host
    const verifyHost = async (req, res, next) => {
      const email = req.decoded.email
      const query = { email: email }
      const user = await signUpUserCollection.findOne(query)
      const isHost = user?.role === 'host';
      if (!isHost) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      next()
    }

    app.get('/signUpUsers/host/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      const query = { email: email }
      const user = await signUpUserCollection.findOne(query)
      let host = false;
      if (user) {
        host = user?.role === 'host';
      }
      res.send({ host })
    })
    // host section end

    // admin section start
    // verify admin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email
      const query = { email: email }
      const user = await signUpUserCollection.findOne(query)
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      next()
    }

    app.get('/signUpUser/admin/:email', verifyToken,verifyAdmin, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      const query = { email: email }
      const user = await signUpUserCollection.findOne(query)
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin })
    })
    // admin section end

    // get all sign up user
    app.get('/allUsers',verifyToken,verifyAdmin, async(req, res) => {
      const result = await signUpUserCollection.find().toArray()
      res.send(result)
    })
    // post by booking
    app.post('/booking', async (req, res) => {
      const body = req.body;
      const result = await bookedCollection.insertOne(body)
      res.send(result)
    })

    // post by sign up users
    app.post('/signUpUser', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await signUpUserCollection.findOne(query)
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null })
      }
      const result = await signUpUserCollection.insertOne(user)
      res.send(result)
    })

    // get the packages collection
    app.get('/packages', async (req, res) => {
      const result = await packageCollection.find().toArray()
      res.send(result)
    })

    // posted by user share story
    app.post('/shareStory', async (req, res) => {
      const shareStory = req.body;
      const result = await stroyCollection.insertOne(shareStory)
      res.send(result)
    })

    // post the package collection in the wishlist
    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user)
      res.send(result)
    })

    // get the user data
    app.get('/users', verifyToken, async (req, res) => {
      const email = req.query.email
      const query = { email: email }
      const result = await userCollection.find(query).toArray()
      res.send(result)
    })

    // delete specific data
    app.get('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await userCollection.findOne(query)
      res.send(result)
    })
    // delete specific data
    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await userCollection.deleteOne(query)
      res.send(result)
    })

    // post by tour guide
    app.post('/tourGuides',async(req, res) => {
      const body = req.body;
      const result = await guidesCollection.insertOne(body)
      res.send(result)
    })
    // get the tour guides planner
    app.get('/guides', async (req, res) => {
      const result = await guidesCollection.find().toArray()
      res.send(result)
    })

    // get the specific guides
    app.get('/guides/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await guidesCollection.findOne(query)
      res.send(result)
    })

    // get the tour type data
    app.get('/tourTypes', async (req, res) => {
      const result = await tourTypeCollection.find().toArray()
      res.send(result)
    })

    // get each tour type data
    app.get('/tourTypes/:tourType', async (req, res) => {
      const tourType = req.params.tourType;
      const tours = await tourTypeCollection.find().toArray()
      const result = await tours.filter(tour => tour.tourType === tourType)
      res.send(result)
    })

    // get specific data
    app.get('/tourType/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await tourTypeCollection.findOne(query)
      res.send(result)
    })

    // story section, and get the story
    app.get('/touristStory', async (req, res) => {
      const result = await stroyCollection.find().toArray()
      res.send(result)
    })

    // get the specific stroy
    app.get('/touristStory/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await stroyCollection.findOne(query)
      res.send(result)
    })

    // get the my booking data
    app.get('/bookings', async (req, res) => {
      const email = req.query.email
      const query = { email: email }
      const result = await bookedCollection.find(query).toArray()
      res.send(result)
    })

    // get the my booking all data
    app.get('/booking', verifyToken, verifyHost, async (req, res) => {
      const result = await bookedCollection.find().toArray()
      res.send(result)
    })

    // change the status of accepted by host
    app.patch('/booking/host/:id', verifyToken, verifyHost, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          status: 'Accepted'
        }
      }
      const result = await bookedCollection.updateOne(query, updatedDoc)
      res.send(result)
    })

    // change the status of rejected by host
    app.patch('/bookings/host/:id', verifyToken, verifyHost, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          status: 'Rejected'
        }
      }
      const result = await bookedCollection.updateOne(query, updatedDoc)
      res.send(result)
    })
    
    //  // change the role by admin
    app.patch('/booked/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await signUpUserCollection.updateOne(query, updatedDoc)
      res.send(result)
    })

    // change the role by host
    app.patch('/book/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          role: 'host'
        }
      }
      const result = await signUpUserCollection.updateOne(query, updatedDoc)
      res.send(result)
    })

    // payment intent
    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100)
      console.log(amount, 'amount inside the intent');
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      })
      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })

    app.post('/payments', async (req, res) => {
      const payment = req.body;
      const paymentsResult = await paymentCollection.insertOne(payment)
      const query = {
        _id: {
          $in: payment.cartIds.map(id => new ObjectId(id))
        }
      }

      const deleteResult = await bookedCollection.deleteOne(query)
      res.send({ paymentsResult, deleteResult })
    })

    // bookings specific data
    app.get('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await bookedCollection.findOne(query)
      res.send(result)
    })

    // delete specific data
    app.delete('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await bookedCollection.deleteOne(query)
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