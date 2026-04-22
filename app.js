const express = require("express");
const app = express();
require("dotenv").config();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const dataFilePath = path.join(__dirname, "public", "data", "dictee.json");
const eventFilePath =
  process.env.EVENT_DATA_PATH ||
  path.join(__dirname, "public", "data", "evenement.json");
const eventImagedir =
  process.env.EVENT_IMAGE_DIR ||
  path.join(__dirname, "public", "images", "evenement");
const eventImageUrlPrefix = "/images/evenement/";

function ensureEventStorage() {
  const eventDataDir = path.dirname(eventFilePath);
  if (!fs.existsSync(eventDataDir)) {
    fs.mkdirSync(eventDataDir, { recursive: true });
  }
  if (!fs.existsSync(eventFilePath)) {
    fs.writeFileSync(
      eventFilePath,
      JSON.stringify({ images: [] }, null, 2),
      "utf-8",
    );
  }
  if (!fs.existsSync(eventImagedir)) {
    fs.mkdirSync(eventImagedir, { recursive: true });
  }
}
ensureEventStorage();
app.use(eventImageUrlPrefix, express.static(eventImagedir));

function displayNameFromUpload(file, publicUrl) {
  const raw = (file && file.originalname ? String(file.originalname) : "")
    .trim()
    .replace(/\0/g, "");
  if (raw === "") {
    return path.basename(publicUrl);
  }
  return path.basename(raw.replace(/\\/g, "/"));
}

function eventImageUrlToDisk(publicUrl) {
  if (
    typeof publicUrl !== "string" ||
    !publicUrl.startsWith(eventImageUrlPrefix)
  ) {
    return null;
  }
  const b = publicUrl.slice(eventImageUrlPrefix.length);
  if (!b || b.includes("/") || b.includes("..")) {
    return null;
  }
  const full = path.join(eventImagedir, b);
  const resolveDir = path.resolve(eventImagedir);
  const rFile = path.resolve(full);
  if (!rFile.startsWith(resolveDir + path.sep) && rFile !== resolveDir) {
    return null;
  }
  return full;
}

function normalizeEventImages(imgs) {
  return imgs
    .map((x) => {
      if (typeof x === "string") {
        return { url: x, label: path.basename(x) };
      }
      if (x && typeof x.url === "string") {
        const url = x.url;
        const label =
          typeof x.label === "string" && x.label.trim()
            ? x.label.trim()
            : path.basename(url);
        return { url, label };
      }
      return null;
    })
    .filter(Boolean);
}

function readEventData() {
  try {
    const raw = fs.readFileSync(eventFilePath, "utf-8");
    const parsed = JSON.parse(raw);
    const imgs = Array.isArray(parsed.images) ? parsed.images : [];
    const images = normalizeEventImages(imgs);
    return { images };
  } catch (err) {
    console.error("Erreur de lecture du fichier JSON:", err);
    return { images: [] };
  }
}

function writeEventData({ images }) {
  try {
    const list = normalizeEventImages(Array.isArray(images) ? images : []);
    const payload = {
      images: list,
    };
    fs.writeFileSync(eventFilePath, JSON.stringify(payload, null, 2), "utf-8");
  } catch (err) {
    console.error("Erreur d'écriture du fichier JSON:", err);
  }
}

const imageType = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const eventImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, eventImagedir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safe = [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)
      ? ext
      : ".jpg";
    cb(null, `img-${Date.now()}${safe}`);
  },
});

const eventImageUpload = multer({
  storage: eventImageStorage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: (req, file, cb) => {
    if (imageType.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Type de fichier non autorisé"));
    }
  },
});

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

  const expectedUser = process.env.ADMIN_USER;
  const expectedPass = process.env.ADMIN_PASS;

  if (user !== expectedUser || pass !== expectedPass) {
    res.set("WWW-Authenticate", 'Basic realm="Admin"');
    return res.status(401).send("Identifiants invalides.");
  }

  next();
}

app.post(
  "/admin/event/upload-image",
  requireAdmin,
  (req, res, next) => {
    eventImageUpload.single("image")(req, res, (err) => {
      if (err) {
        return res.redirect("/admin-event");
      }
      next();
    });
  },
  (req, res) => {
    if (!req.file) {
      return res.redirect("/admin-event");
    }
    const data = readEventData();
    const publicUrl = `/images/evenement/${req.file.filename}`;
    const label = displayNameFromUpload(req.file, publicUrl);
    const images = [{ url: publicUrl, label }, ...data.images];
    writeEventData({ images });
    res.redirect("/admin-event");
  },
);

app.post("/admin/event/delete-image", requireAdmin, (req, res) => {
  const targetUrl = (req.body.url || "").trim();
  const data = readEventData();
  if (!data.images.some((e) => e.url === targetUrl)) {
    return res.redirect("/admin-event");
  }
  const diskPath = eventImageUrlToDisk(targetUrl);
  if (diskPath && fs.existsSync(diskPath)) {
    try {
      fs.unlinkSync(diskPath);
    } catch (err) {
      console.error("Erreur de suppression de l'image:", err);
      return res.redirect("/admin-event");
    }
  }
  const images = data.images.filter((e) => e.url !== targetUrl);
  writeEventData({ images });
  res.redirect("/admin-event");
});

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
    text,
    text_1,
    text_2,
    tinyApiKey: process.env.TINYMCE_API_KEY,
  });
});

app.post("/admin/dictee", requireAdmin, (req, res) => {
  const text = req.body.text || "";
  const text_1 = req.body.text_1 || "";
  const text_2 = req.body.text_2 || "";
  writeDicteeData({ text, text_1, text_2 });
  res.redirect(303, "/admin/dictee");
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

app.get("/admin-event", requireAdmin, (req, res) => {
  const d = readEventData();
  res.render("admin-event", {
    images: d.images,
  });
});

app.get("/evenements", (req, res) => {
  const { images } = readEventData();
  res.render("evenements", {
    currentPath: "/evenements",
    images,
  });
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
