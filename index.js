const express = require("express");
require("./db/config");
const cors = require("cors");
const User = require("./db/User");
const Product = require("./db/Product");
const Jwt = require("jsonwebtoken");
const jwtKey = "e-com";
const bcrypt = require("bcrypt");
const app = express();

app.use(express.json());
app.use(cors());

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  user.password = await bcrypt.hash(user.password, 10);
  let result = await user.save();
  result = result.toObject();
  delete result.password;
  Jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (err, token) => {
    if (err) {
      res.send("Something went wrong!");
    }
    res.send({ result, auth: token });
  });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    if (email && password) {
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(404).send("User not found");
      }
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(404).send("Invalid password");
      user = await User.findOne({ email }).select("-password");
      Jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
        if (err) {
          res.send("Something went wrong!");
        }
        res.send({ user, auth: token });
      });
    }
  } catch (err) {
    res.send(err.message);
  }
});

app.post("/add-product", verifyToken, async (req, res) => {
  let product = new Product(req.body);
  let result = await product.save();
  res.send(result);
});

app.get("/products", async (req, res) => {
  let products = await Product.find();
  if (products.length > 0) {
    return res.send(products);
  }
  res.send("There is no product");
});

app.get("/products/:id", async (req, res) => {
  let product = await Product.findById(req.params.id);
  if (!product) {
    return res.send("Product with the given ID does not exist");
  }
  res.send(product);
});

app.put("/products/:id", verifyToken, async (req, res) => {
  let product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      price: req.body.price,
      category: req.body.category,
      company: req.body.company,
    },
    {
      new: true,
    }
  );
  if (!product) return res.send("Product with the given ID does not exist!");
  res.send(product);
});

app.delete("/products/:id", verifyToken, async (req, res) => {
  let product = await Product.deleteOne({ _id: req.params.id });
  if (!product) {
    return res.send("Product does not exist!");
  }
  res.send(product);
});

app.delete("/users", async (req, res) => {
  let user = await User.deleteMany();
  res.send("Deleted " + user.deletedCount + " users");
});

app.get("/search/:key", verifyToken, async (req, res) => {
  let result = await Product.find({
    $or: [
      {
        name: { $regex: req.params.key },
      },
      // {
      //     company:{$regex: req.params.key}
      // },
      // {
      //     category:{$regex: req.params.key}
      // }
    ],
  });
  res.send(result);
});

function verifyToken(req, res, next) {
  let token = req.headers["authorization"];
  if (token) {
    token = token.split(" ")[1];
    Jwt.verify(token, jwtKey, (err, valid) => {
      if (err) {
        res.status(403).send("Please provide a token");
      } else {
        next();
      }
    });
  } else {
    res.status(403).send("Please provide a token");
  }
}

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
