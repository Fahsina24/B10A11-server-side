require("dotenv").config();
const express = require("express");
const { ObjectId } = require("mongodb");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
  jwt.verify(token, process.env.JWT_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized Access" });
    }
    req.verifyEmail = decoded;
    next();
  });
};

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
    const purchaseInfoCollection = client
      .db("Restaurant_DB")
      .collection("purchaseFoodInfo");

    // Auth related Api
    app.get("/jwt", (req, res) => {
      const result = req.body;
      console.log(result);
      res.send(result);
    });

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_TOKEN, {
        expiresIn: "1hr",
      });
      res
        .cookie("token", token, { httpOnly: true, secure: false })
        .send({ success: true });
    });

    // create a post api for user collection

    app.post("/users", async (req, res) => {
      const user = req.body;
      // console.log(user);
      const existUser = await userCollection.findOne({ email: user.email });
      if (existUser) {
        console.log("user exists before");
        // console.log(user.email);
        return res.send({
          ...user,
        });
      } else {
        const result = await userCollection.insertOne({
          ...user,
        });
        // console.log(result);
        return res.send(result);
      }
    });

    // get all users;
    app.get("/users", async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    // create add food page

    app.post("/addFoods", async (req, res) => {
      const newFoods = req.body;
      // console.log(newFoods);
      const result = await foodCollection.insertOne(newFoods);
      res.send(result);
    });

    //  Read all food data in All Foods Page
    app.get("/allFoods", async (req, res) => {
      const food = foodCollection.find();
      const result = await food.toArray();
      res.send(result);
    });

    // save purchase page info

    app.post("/purchaseFoods", async (req, res) => {
      const foodInfo = req.body;
      const result = await purchaseInfoCollection.insertOne(foodInfo);
      res.send(result);
    });

    // Read all foods added by particular user based on user's email

    app.get("/my_foods/:email", async (req, res) => {
      const email = req.params.email;
      const foodList = await foodCollection
        .find({ "addBy.userEmail": email })
        .toArray();
      // console.log(foodList);
      res.send(foodList);
    });

    // Read specific food details based on

    app.get("/singleFood/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const foodDetails = await foodCollection.findOne(query);
      res.send(foodDetails);
    });

    // Read ordered food for specific user
    app.get("/orderPage/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { "buyerDetails.buyerEmail": email };
      // console.log(req.cookies);
      // console.log(req.verifyEmail.email);
      // console.log(email);
      if (req.verifyEmail.email != email) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      const orderFoodList = await purchaseInfoCollection.find(query).toArray();
      // console.log(orderFoodList);
      res.send(orderFoodList);
    });

    // //Update function

    // app.patch("/update/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const data = req.body;
    //   const query = { _id: new ObjectId(id) };
    //   const update = {
    //     $set: {
    //       foodName: data?.foodName,
    //       Image: data?.Image,
    //       description: data?.description,
    //       price: data?.price,
    //       foodCategory: data?.foodCategory,
    //       quantity: data?.quantity,
    //       foodOrigin: data?.foodOrigin,
    //     },
    //   };
    //   const result = await foodCollection.updateOne(query, update);
    //   res.json(result);
    // });

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
