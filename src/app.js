const express = require("express");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

const connectDB = async () => {
  console.log("Connected to the database");
};

app.get("/health", (req, res) => {
  res.send("Server is running....");
});

const main = async () => {
  try {
    // Connect to the database
    await connectDB();

    // Start the Express server
    app.listen(port, () => {
      console.log(`Car Doctor Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Error connecting to the database:", error.message);
  }
};

// Call the main function to start the server and connect to the database
main();
