const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
const jwt = require("jsonwebtoken");
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY);
require("dotenv").config();

app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "Unauthorized access." });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded) => {
    if (error) {
      return res
        .status(401)
        .send({ error: true, message: "Unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.j5nrexn.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const menuCollection = client.db("BistroDb").collection("menu");
    const reviewsCollection = client.db("BistroDb").collection("reviews");
    const cartsCollection = client.db("BistroDb").collection("carts");
    const usersCollection = client.db("BistroDb").collection("users");

    // todo: jwt work
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "5h",
      });
      res.send({ token });
    });
    // verifyAdmin
    const verifyAdmin = async (req,res,next)=>{
      const decodedEmail = req.decoded.email;
      const query ={ email : decodedEmail};
      const user = await usersCollection.findOne(query);
      if(user?.role !== 'admin'){
        return res.status(403).send({error:true, message:'Forbidden message'})
      };
      next();
    }

    // user collection start
    app.get("/users",verifyJWT,verifyAdmin, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const userEmail = { email: user.email };
      const existingUser = await usersCollection.findOne(userEmail);
      if (existingUser) {
        return res.send({ message: "User already exist" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // check admin
    app.get('/users/admin/:email',verifyJWT, async(req,res)=>{
      const email = req.params.email;
      const decodedEmail = req.decoded.email;
      if(decodedEmail !== email){
        res.send({admin:false});
      }
      const query = { email:email}
      const user = await usersCollection.findOne(query);
      const result = { admin : user?.role === 'admin' };
      res.send(result);
    })

    app.delete('/users/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    })

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    // user collection end

    // menu collection start
    app.get("/menu", async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result);
    });

    app.post('/menu',verifyJWT,verifyAdmin, async (req,res)=>{
      const newMenu = req.body;
      const result = await menuCollection.insertOne(newMenu);
      res.send(result);
    })

    app.delete('/menu/:id',verifyJWT,verifyAdmin, async (req,res)=>{
      const id = req.params.id;
      const query = { _id:id};
      const result = await menuCollection.deleteOne(query);
      res.send(result);
    })
    // menu collection end

    // reviews collection start
    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });
    // reviews collection end

    // carts collection start
    app.post("/carts", async (req, res) => {
      const item = req.body;
      const result = await cartsCollection.insertOne(item);
      res.send(result);
    });

    app.get("/carts", verifyJWT, async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      }
      // todo:
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res
          .status(403)
          .send({ error: true, message: "forbidden access" });
      }
      const query = { email: email };
      const result = await cartsCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartsCollection.deleteOne(query);
      res.send(result);
    });
    // carts collection end

    // create payment intent start
    app.post('/create-payment-intent',verifyJWT, async (req,res)=>{
      const {price} = req.body;
      const amount = price*100 ;
      const paymentIntent = await stripe.paymentIntents.create({
        amount:amount,
        currency:'usd',
        payment_method_types:['card']
      });
      res.send({
        clientSecret : paymentIntent.client_secret
      })
    })

    // create payment intent end

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Boos is setting");
});

app.listen(port, () => {
  console.log(`Boss is setting on port : ${port}`);
});
