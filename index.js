require("dotenv").config();
const express = require("express");
const { ObjectId } = require("mongodb");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_RESTAURANT}:${process.env.DB_PASS}@cluster0.ymvbd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    // create collection

    const userCollection = client.db("Restaurant_DB").collection("users");
    const foodCollection = client.db("Restaurant_DB").collection("foods");

    // create a post api for user collection

    app.post("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = req.body;
      // console.log(user);
      const existUser = await userCollection.findOne(query);
      if (existUser) {
        // console.log("user exists before");
        return res.send(existUser);
      } else {
        const result = await userCollection.insertOne({
          user,
        });
        // console.log(result);
        return res.send(result);
      }
    });

    // create add food page

    app.post("/addFoods", async (req, res) => {
      const newFoods = req.body;
      const result = await foodCollection.insertOne(newFoods);
      res.send(result);
    });

    // save purchase page info

    app.post("/purchaseFoods", async (req, res) => {
      const foodInfo = req.body;
      const result = await foodCollection.insertOne(foodInfo);
      res.send(result);
    });

    //  Read all food data in All Foods Page
    app.get("/allFoods", async (req, res) => {
      const food = foodCollection.find();
      const result = await food.toArray();
      res.send(result);
    });

    // Read specific food details based on

    app.get("/singleFood/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const foodDetails = await foodCollection.findOne(query);
      res.send(foodDetails);
    });

    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
