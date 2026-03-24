const express = require("express");
const app = express();
const path = require("path");

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Données de démonstration : catégories avec titre, description, produits
const categories = {
  1: {
    id: 1,
    titre: "Alphabétisation",
    description: "Programmes et ressources pour l'apprentissage de la lecture et de l'écriture pour adultes.",
    produits: [
      { nom: "Ateliers lecture", prix: "Gratuit" },
      { nom: "Cours d'écriture", prix: "Gratuit" },
      { nom: "Matériel pédagogique", prix: "Sur demande" },
    ],
  },
  2: {
    id: 2,
    titre: "Français langue seconde",
    description: "Formation en français pour les personnes dont ce n'est pas la langue maternelle.",
    produits: [
      { nom: "Cours FLS débutant", prix: "Gratuit" },
      { nom: "Cours FLS intermédiaire", prix: "Gratuit" },
      { nom: "Conversation", prix: "Gratuit" },
    ],
  },
  3: {
    id: 3,
    titre: "Calcul et numératie",
    description: "Renforcement des compétences en calcul et utilisation des nombres au quotidien.",
    produits: [
      { nom: "Atelier calcul de base", prix: "Gratuit" },
      { nom: "Budget personnel", prix: "Gratuit" },
    ],
  },
};

app.get("/", (req, res) => {
  res.render("accueil");
});

// Categories/Details/{id} – infos de la catégorie (titre, description, produits)
app.get("/categories/details/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const category = categories[id];
  if (!category) {
    return res.status(404).send("Catégorie non trouvée");
  }
  res.render("categories-details", { category });
});

app.listen(3000, () => {
  console.log("Serveur lancé sur http://localhost:3000");
});
