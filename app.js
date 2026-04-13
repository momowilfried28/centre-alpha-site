const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const dataFilePath = path.join(__dirname, "public", "data", "dictee.json");

function renderDicteeForPublic(raw) {
  if (typeof raw !== "string" || raw === "") return "";
  const trimmed = raw.trim();
  if (/^<[a-z]/i.test(trimmed) || /<\/[a-z][a-z0-9]*>/i.test(raw)) {
    return raw;
  }
  return raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function readDicteeData() {
  try {
    const raw = fs.readFileSync(dataFilePath, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      text: typeof parsed.text === "string" ? parsed.text : "",
      text_1: typeof parsed.text_1 === "string" ? parsed.text_1 : "",
      text_2: typeof parsed.text_2 === "string" ? parsed.text_2 : "",
    };
  } catch (err) {
    console.error("Erreur de lecture du fichier JSON:", err);
    return { text: "", text_1: "", text_2: "" };
  }
}

function writeDicteeData({ text, text_1, text_2 }) {
  try {
    const payload = {
      text: typeof text === "string" ? text : "",
      text_1: typeof text_1 === "string" ? text_1 : "",
      text_2: typeof text_2 === "string" ? text_2 : "",
    };
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

app.get("/dictee", (req, res) => {
  const { text, text_1, text_2 } = readDicteeData();
  res.render("dictee", {
    currentPath: "/dictee",
    rendered: renderDicteeForPublic(text),
    rendered_1: renderDicteeForPublic(text_1),
    rendered_2: renderDicteeForPublic(text_2),
  });
});

app.get("/admin/dictee", requireAdmin, (req, res) => {
  const { text, text_1, text_2 } = readDicteeData();
  res.render("admin-dictee", {
    currentPath: "/admin/dictee",
    text,
    text_1,
    text_2,
    saved: false,
  });
});

app.post("/admin/dictee", requireAdmin, (req, res) => {
  const text = req.body.text || "";
  const text_1 = req.body.text_1 || "";
  const text_2 = req.body.text_2 || "";
  writeDicteeData({ text, text_1, text_2 });
  res.render("admin-dictee", {
    currentPath: "/admin/dictee",
    text,
    text_1,
    text_2,
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
app.get("/temoignages", (req, res) => {
  res.render("temoignages", { currentPath: "/temoignages" });
});

function renderNotreHistoire(req, res) {
  res.render("notrehistoire", { currentPath: req.path });
}

app.get("/qui-sommes-nous", renderNotreHistoire);
app.get("/notrehistoire", renderNotreHistoire);

app.listen(8080, () => {
  console.log("Serveur lancé sur http://localhost:8080");
});
