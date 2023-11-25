const express = require("express");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const applyMiddleware = require("./middlewares");
const authRoutes = require("./routes/authentication");
const connectDB = require("./db/connectDB");
 
applyMiddleware(app);

app.use(authRoutes)

app.post("/user", async (req, res) => {
  const user = req.body;
  const result = await userCollection.insertOne(user);
  res.status(201).json({ message: "User added successfully" });
});

app.get("/health", (req, res) => {
  res.send("Server is running....");
});

app.all("*", (req, res, next) => {
  const error = new Error(`Can't find ${req.originalUrl} on the server`);
  error.status = 404;
  next(error);
});

// Global error handling middleware
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message,
  });
});




   
 

// app.use(authRoutes);

const main = async () => {
  await connectDB();

  app.listen(port, () => {
    console.log(`>> Server is running on port ${port}`);
  });
};
main();
