const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173"], //if deploy replace
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fhwdeyh.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    // await client.connect();
    const userCollection = client.db("contestHub").collection("user");
    const contestCollection = client.db("contestHub").collection("contest");

    //aurh releted api
    app.post("/jwt", (req, res) => {
      const user = req.body;

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true, //replace deploy true

          sameSite: "none",
        })
        .send({ success: true });
    });

    //User api
    app.post("/user", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.get("/user", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // Single user by uid
    app.get("/user/:uid", async (req, res) => {
      const uid = req.params.uid;
      const query = {
        uid: uid,
      };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    app.delete("/user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });
    //change rale
    app.patch("/user/:id", async (req, res) => {
      const id = req.params.id;
      const role = req.body.role;
      console.log(id, role);
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: role,
        },
      };

      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    //contest api
    app.post("/contest", async (req, res) => {
      const product = req.body;
      try {
        const result = await contestCollection.insertOne(product);

        res.status(201).json({ message: "contest added successfully" });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ error: "Failed to insert data into the da tabase" });
      }
    });

    app.get("/contest", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);

      const result = await contestCollection
        .find()
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result);
    });

    app.get("/contestCount", async (req, res) => {
      const count = await contestCollection.estimatedDocumentCount();
      res.send({ count });
    });

    app.get("/contest/top10", async (req, res) => {
      try {
        const result = await contestCollection
          .find()
          .sort({ orderCount: -1 })
          .limit(10)
          .toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch and sort data" });
      }
    });

    app.get("/contest/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await contestCollection.findOne(query);
      res.send(result);
    });

    app.get("/filtered-contest", verifyToken, async (req, res) => {
      const { email } = req.query;
      try {
        const filteredcontests = await contestBuyCollection
          .find({ email })
          .toArray();
        res.json(filteredcontests);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Fai led to fetch and filter data" });
      }
    });

    app.get("/filtered-added-contest", verifyToken, async (req, res) => {
      const { email } = req.query;
      try {
        const filteredContest = await contestCollection
          .find({ email })
          .toArray();
        res.json(filteredContest);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch and filter data" });
      }
    });

    app.delete("/contest/:id", async (req, res) => {
      const id = req.params.id;

      const query = {
        _id: new ObjectId(id),
      };
      const result = await contestCollection.deleteOne(query);

      res.send(result);
    });

    // buy api
    app.post("/buy", async (req, res) => {
      const product = req.body;

      try {
        const result = await contestBuyCollection.insertOne(product);

        res.status(201).json({ message: "Product added successfully" });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ error: "Failed to insert data into the database" });
      }
    });

    app.get("/buy", async (req, res) => {
      const result = await contestBuyCollection.find().toArray();
      res.send(result);
    });

    app.delete("/buy/:id", async (req, res) => {
      const id = req.params.id;

      const query = {
        _id: new ObjectId(id),
      };
      const result = await contestBuyCollection.deleteOne(query);

      res.send(result);
    });

    app.put("/contest/update/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;

      console.log("id", id, data);

      const filter = { _id: new ObjectId(id) };
      const updatedProduct = {
        $set: {
          name: data.name,
          image: data.image,
          Category: data.Category,
          Quantity: data.Quantity,
          chiefNames: data.chiefNames,
          contestOrigin: data.contestOrigin,
          price: data.price,
          orderCount: data.orderCount,
          contestOrigin: data.contestOrigin,
          shortDescription: data.shortDescription,
        },
      };

      try {
        const result = await contestCollection.updateOne(
          filter,
          updatedProduct
        );
        if (result.modifiedCount === 1) {
          res.json({ message: "Product updated successfully" });
        } else {
          res.status(404).json({ error: "Product not found" });
        }
      } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.put("/user/update/:uid", async (req, res) => {
      const uid = req.params.uid;
      const userData = req.body;

      // Update the user profile UID
      try {
        const filter = { uid };
        const update = { $set: userData };

        const result = await userCollection.updateOne(filter, update);

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User profile updated successfully" });
      } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/contest/search/:text", async (req, res) => {
      const text = req.params.text;
      console.log(text);

      try {
        const searchResults = await contestCollection
          .find({ name: { $regex: text, $options: "i" } })
          .toArray();
        res.json(searchResults);
      } catch (error) {
        console.error("Error searching for contest items:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
    //we are no end
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Crud is running...");
});

app.listen(port, () => {
  console.log(`SERVER is Running on port ${port}`);
});
