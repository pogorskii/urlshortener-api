require("dotenv").config({ path: "./.env" });
const express = require("express");
const bodyParser = require(`body-parser`);
const cors = require("cors");
const isUrlHttp = require("is-url-http");
const app = express();

// Connect MongoDB
const mongoose = require("mongoose");
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

// Basic Configuration
const port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Create MONGO Model for shortened links
const { Schema } = mongoose;

// Create Schema
const linkSchema = new Schema({
  url: { type: String, required: true },
  shortUrl: Number,
});

// Create Model
const Link = mongoose.model("Link", linkSchema);

// Save shortened link
const createLink = async (originalUrl) => {
  const result = await Link.find();
  console.log(result);
  const maxNumber = result.reduce(
    (acc, curr) => Math.max(acc, curr.shortUrl),
    result[0].shortUrl
  );
  const newShortUrl = maxNumber + 1;
  Link.create({ url: originalUrl, shortUrl: newShortUrl });
  return newShortUrl;
};

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

// Your first API endpoint
app
  .route("/api/shorturl")
  .post(async (req, res) => {
    const { url } = req.body;
    if (isUrlHttp(url)) {
      const newShortUrl = await createLink(url);
      res.json({ original_url: url, short_url: newShortUrl });
    } else {
      res.json({ error: "invalid url" });
    }
  })
  .get((req, res) => {
    res.json({ original_url: url, short_url: "shortUrlPlaceholder" });
  });

app.get("/api/shortUrl/:short", async (req, res) => {
  try {
    const { short } = req.params;
    const result = await Link.findOne({ shortUrl: short });
    res.redirect(result["url"]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/all", async (req, res) => {
  try {
    const result = await Link.find();
    console.log(result);
    const maxNumber = result.reduce(
      (acc, curr) => Math.max(acc, curr.shortUrl),
      result[0].shortUrl
    );
    console.log(maxNumber);
    res.json({ lastShortLink: maxNumber });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
