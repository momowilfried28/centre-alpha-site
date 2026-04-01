const express = require("express");
const app = express();
const path = require("path");

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

//route pour le fichier json
const fs = require("fs");
const dataFilePath = path.join(__dirname, "public", "data", "dictee.json");
function readData() {
  try {
    const raw = fs.readFileSync(dataFilePath, "utf-8");
    const parsed = JSON.parse(raw);
    return typeof parsed.text === "string" ? parsed.text : "";
  } catch (err) {
    console.error("Erreur de lecture du fichier JSON:", err);
    return "";
  }
}

function writeData(text) {
  try {
    const payload = { text: typeof text === "string" ? text : "" };
    fs.writeFileSync(dataFilePath, JSON.stringify(payload, null, 2), "utf-8");
  } catch (err) {
    console.error("Erreur d'écriture du fichier JSON:", err);
  }
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || "";
  const [scheme, encoded] = auth.split(" ");

  if (scheme !== "Basic" || !encoded) {
    res.set("WWW-Authenticate", 'Basic realm="Admin"');
    return res.status(401).send("Authentification requise.");
  }

  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  const sepIdx = decoded.indexOf(":");
  const user = sepIdx >= 0 ? decoded.slice(0, sepIdx) : "";
  const pass = sepIdx >= 0 ? decoded.slice(sepIdx + 1) : "";

  const expectedUser = process.env.ADMIN_USER || "admin";
  const expectedPass = process.env.ADMIN_PASS || "change-me";

  if (user !== expectedUser || pass !== expectedPass) {
    res.set("WWW-Authenticate", 'Basic realm="Admin"');
    return res.status(401).send("Identifiants invalides.");
  }

  next();
}

//route pour la dictee
app.get("/dictee", (req, res) => {
  const text = readData();
  res.render("dictee", { currentPath: "/dictee", text });
});
//route pour la gestion de la dictee par admin
app.get("/admin/dictee", requireAdmin, (req, res) => {
  const text = readData();
  res.render("admin-dictee", { currentPath: "/admin/dictee", text, saved: false });
});
app.post("/admin/dictee", requireAdmin, (req, res) => {
  writeData(req.body.text || "");
  const text = readData();
  res.render("admin-dictee", {
    currentPath: "/admin/dictee",
    text,
    saved: true,
  });
});

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

app.get("/faireundon", (req, res) => {
  res.render("faireundon", { currentPath: "/faireundon" });
});
app.get("/Nous_Joindre", (req, res) => {
  res.render("Nous_Joindre", { currentPath: "/Nous_Joindre" });
});
app.get("/Temoignages", (req, res) => {
  res.render("Temoignages", { currentPath: "/Temoignages" });
});

function renderNotreHistoire(req, res) {
  res.render("notrehistoire", { currentPath: req.path });
}

app.get("/qui-sommes-nous", renderNotreHistoire);
app.get("/notrehistoire", renderNotreHistoire);

app.listen(8080, () => {
  console.log("Serveur lancé sur http://localhost:8080");
});
