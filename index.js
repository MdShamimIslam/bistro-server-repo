const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
require('dotenv').config();

app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.j5nrexn.mongodb.net/?retryWrites=true&w=majority`;

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

    const menuCollection = client.db('BistroDb').collection('menu');
    const reviewsCollection = client.db('BistroDb').collection('reviews');
    const cartsCollection = client.db('BistroDb').collection('carts');

    // menu collection start
    app.get('/menu', async(req,res)=>{
        const result = await menuCollection.find().toArray();
        res.send(result);
    })
    // menu collection end


    // reviews collection start
    app.get('/reviews', async(req,res)=>{
        const result = await menuCollection.find().toArray();
        res.send(result);
    })
  // reviews collection end


    // carts collection start
    app.post('/carts',async(req,res)=>{
      const item = req.body;
      const result = await cartsCollection.insertOne(item);
      res.send(result);
    })

    app.get('/carts', async(req,res)=>{
      const email ={email:req.query.email}
      const result = await cartsCollection.find(email).toArray();
      res.send(result);
    })
// carts collection end


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req,res)=>{
    res.send('Boos is setting')
})

app.listen(port,()=>{
    console.log(`Boss is setting on port : ${port}`)
})