const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }

  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }

    req.decoded = decoded;

    next();
  });
};

// connect mongoDB

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vylcgzn.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    //  create jsonwebtoken
    app.post("/jwt", (req, res) => {
      const user = req.body;

      const token = jwt.sign(user, process.env.ACCESS_TOKEN, );
      res.json({ token });
    });

    // Connect the client to the server

    const userCollection = client.db("sportsDB").collection("users");
    const classCollection = client.db("sportsDB").collection("classes");
    const selectedCollection = client.db("sportsDB").collection("selectedDataByUser")


    // selected data related api
    app.get('/selected/:email',verifyJWT, async(req, res)=>{
      const email = req.params.email;
      if(email === req.decoded.email){
        const query = {userEmail : email}
        const result = await selectedCollection.find(query).toArray();
        res.json(result)
      }
    })
 
    app.post('/selected', async(req, res)=>{
      const data = req.body;
      const query = {classId: data.classId, userEmail: data.userEmail}
      const exist = await selectedCollection.findOne(query)
      if (exist) {
        return res.json({ message: " already selected" });
      }
      const result = await selectedCollection.insertOne(data);
      res.json(result)
    })

    app.delete('/selected/:id', async(req,res)=>{
      const id = req.params.id;
      const query ={_id: new ObjectId(id)}
      const result = await selectedCollection.deleteOne(query)
      res.json(result)
    })
    // classes related api
    app.post('/classes', async(req, res)=>{
      const myClass = req.body;
      const result = await classCollection.insertOne(myClass);
      res.json(result)
    })

    app.get('/classes',verifyJWT, async(req, res)=>{
      const result = await classCollection.find().toArray();
      res.json(result);
    })
    app.get('/classes/approved', async(req, res)=>{
      const query ={status: "approved"}
      const result = await classCollection.find(query).toArray();
      res.json(result);
    })
    app.get('/classes/:email',verifyJWT, async(req, res)=>{
      const email = req.params.email;
      if (req.decoded.email !== email) {
        res.json({ error: true, message: "unauthorized access" });
      }
      const query = { instructorEmail: email };
      const result = await classCollection.find(query).toArray();
      res.json(result);
    })

    app.patch('/classes/admin/:id', async(req, res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const body= req.body;
      if(body.status === "approved"){
        const updateDoc = {
          $set:{
            status: "approved",
          }
        }
        const result = await classCollection.updateOne(filter, updateDoc);
        res.json(result);
      }
      if(body.status === "denied"){
        const updateDoc = {
          $set:{
            status: "denied",
          }
        }
        const result = await classCollection.updateOne(filter, updateDoc);
        res.json(result);
      }
      if(body.feedback ){
        const updateDoc = {
          $set:{
            feedback: body.feedback,
          }
        }
        const result = await classCollection.updateOne(filter, updateDoc);
        res.json(result);
      }
    })

    app.delete('/classes/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await classCollection.deleteOne(query);
      res.json(result)
    })

    // users related api
    app.get("/users",verifyJWT, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.json(result);
    });

    app.get('/users/instructor', async(req, res)=>{
     
      const query = {role: "instructor"}
      const result = await userCollection.find(query).toArray();
      res.json(result)
    })
    app.get('/users/:email',verifyJWT,  async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.json({ error: true, message: "unauthorized access" });
      }
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.json(result);
    })
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existUser = await userCollection.findOne(query);

      if (existUser) {
        return res.json({ message: "user already existed" });
      }
      const result = await userCollection.insertOne(user);
      res.json(result);
    });

    app.patch('/users/admin/:id', async(req, res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const body = req.body;

      if(body.role === "admin"){
        const updateDoc = {
          $set: {
            role: "admin",
          },
        };
  
        const result = await userCollection.updateOne(filter, updateDoc);
        res.json(result);
      }
      
      if(body.role === "instructor"){
        const updateDoc = {
          $set: {
            role: "instructor",
          },
        };
  
        const result = await userCollection.updateOne(filter, updateDoc);
        res.json(result);
      }
      
    })
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.json("Server is running");
});

app.listen(port, () => {
  console.log(`Summer Camp Learning School running on this port ${port}`);
});
