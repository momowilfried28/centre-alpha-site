const express = require("express");
const app = express();
const path = require("path");

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("accueil", { currentPath: "/" });
});

app.get("/alphabetisation", (req, res) => {
  res.render("alphabetisation", { currentPath: "/alphabetisation" });
});

app.get("/services", (req, res) => {
  res.render("services", { currentPath: "/services" });
});
app.get("/benevolat", (req, res) => {
  res.render("benevolat", { currentPath: "/benevolat" });
});

function renderNotreHistoire(req, res) {
  res.render("notrehistoire", { currentPath: req.path });
}

app.get("/qui-sommes-nous", renderNotreHistoire);
app.get("/notrehistoire", renderNotreHistoire);

app.listen(8080, () => {
  console.log("Serveur lancé sur http://localhost:8080");
});
