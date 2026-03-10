const express = require("express");
const app = express();
const path = require("path");

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("accueil");
});

app.listen(3000, () => {
  console.log("Serveur lancé sur http://localhost:3000");
});
