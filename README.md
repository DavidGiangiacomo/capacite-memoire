# Capacité de mémoire — MVP

Prototype falsifiable (§14 du [design doc](docs/design-doc.md)) du concept n°6 des « Douze concepts de jeux incrémentaux ».

Une seule ressource, fixe : l'espace. Les souvenirs arrivent seuls ; tout ce qui entre doit tenir ; ce qui ne tient pas doit sortir. Oublier libère de la place et supprime réellement le texte, de l'écran, de la sauvegarde et du jeu.

## Lancer

Aucune dépendance. Les scripts sont des modules ES, il faut donc un serveur statique :

```sh
npm start            # python3 -m http.server 8000
# ou : npx http-server -p 8000
```

Puis ouvrir <http://localhost:8000/>. Une partie du MVP dure une dizaine de minutes, d'une traite.

## Tester

```sh
npm test             # node --test, 24 tests sur le moteur (aucune dépendance)
```

## Ce que couvre le MVP

- **Actes I et II** : 12 premiers tirages à 1 / 25 s (souvenirs courts), puis 1 / 9 s avec les souvenirs longs.
- **40 souvenirs écrits** (`src/corpus.js`) : 24 courts (5–9 unités), 16 longs (30–40 unités), 2 à 3 motifs chacun. 770 unités en tout : le corpus ne tient ni dans 512, ni dans 768.
- **Indexation** (6 000 A) : rend les motifs visibles, +20 % sur les liens, occupe 120 unités en permanence. C'est le premier outil, comme dans le doc.
- **Capacité 512 → 768** via l'outil *Extension* (10 000 A).
- **La première saturation**, obligatoire : un souvenir arrive sans place, et il faut l'écarter ou oublier autre chose. Le jeu ne suggère rien. Pendant ce choix, le temps du jeu s'arrête : rien n'arrive, rien n'est produit, rien ne s'achète. Hésiter ne rapporte rien.
- Le réseau d'associations (§6) : `A/s = Σ souvenirs × 0,3 + Σ liens × 2,4`. Le rendement de chaque entrée est affiché en gris.
- Tout occupe de la place : la phrase initiale (12), l'aide (60), l'historique (1 par minute, oubli par tranches de 5), les outils.
- Le journal : une ligne grise par suppression, identique dans tous les cas, sans le texte supprimé.
- Un seul son, un clic de suppression, identique à chaque fois.
- Sauvegarde unique dans `localStorage`, réécrite à chaque mutation, offusquée (base64). Rien ne se passe onglet caché.
- Fin : quand le corpus est épuisé, le jeu propose seulement de *lire* le registre, dans l'ordre d'arrivée, sans interface. Aucun décompte de ce qui a été perdu.
- Une partie par installation : « tout effacer » détruit ce qui reste ; la seconde partie se joue sans découverte et le jeu le dit.

Hors périmètre, conformément au §14 : compression, réseau à deux sauts, auto-tri, suppression des libellés et des règles, l'oubli non consenti (§8), les actes III à V.

## Le test du §14

Le jeu mesure combien de temps le joueur reste sur chaque écran de choix. Avec `?debug` dans l'URL, un cartouche en bas à gauche affiche pour chaque saturation : durée, décision (`oubli` ou `ecart`), nombre d'oublis. Les mêmes mesures sont dans la sauvegarde, champ `mesures.saturations`.

> S'il tranche en deux secondes, les souvenirs sont mal écrits et le jeu n'existe pas. S'il hésite dix secondes et relit la liste, tout le reste du document tient.

## Options d'URL (développement)

| Paramètre | Effet |
|---|---|
| `?vitesse=20` | accélère le temps (la première saturation arrive en ~20 s au lieu de ~7 min) |
| `?graine=1` | fixe le tirage |
| `?debug` | affiche les mesures de saturation |

Exemple : `http://localhost:8000/?vitesse=20&debug&graine=1`

## Structure

```
index.html        un seul écran, deux zones (registre 65 % / panneau 35 %)
style.css
src/corpus.js     les 40 souvenirs { id, texte, cout, motifs }
src/moteur.js     logique pure : état, tick 4 Hz, tirage, saturation, oubli, réseau, outils, sauvegarde
src/app.js        rendu DOM, clics, boucle, son
test/             tests du moteur (node --test)
docs/design-doc.md
```

## Choix d'implémentation à noter

- **Oublier à deux clics.** Le bouton passe à « sûr ? » pendant 2,5 s ; le second clic supprime. Ce n'est pas une annulation ni une réassurance (R2), c'est une garde contre le clic accidentel, qui fausserait la mesure du §14.
- **Rythme compressé.** Avec 40 souvenirs, la première saturation arrive vers 7 min et la partie dure 10–12 min de temps de jeu, plus le temps des choix. Les 12 minutes d'acte I du §9 supposent le corpus complet.
- **Le temps s'arrête pendant le choix.** Première version : les associations continuaient pendant l'écran de choix, donc en hésitant on finissait par pouvoir acheter l'Extension et résoudre la saturation sans rien oublier. Le premier test l'a montré. Maintenant le choix est fermé : écarter, ou oublier.
- **Équilibrage des outils.** Indexation 6 000 A, Extension 10 000 A, calés par simulation (cinq graines, trois stratégies de joueur) : l'Indexation devient abordable vers 6,5 min, juste avant la première saturation qu'elle précipite avec ses 120 unités ; l'Extension vers 9 min, après plusieurs oublis. Même à 768 avec l'aide et la phrase oubliées, il manque de la place : entre 5 et 12 choix forcés par partie selon la stratégie.
- **L'historique ne s'écrit pas quand c'est plein.** Tout ce qui entre doit tenir ; l'occupation ne dépasse jamais la capacité.
- **Historique.** Une ligne par minute (`min 7 — 23 retenus, 311 / 512`), oubliable par tranches de 5 lignes.
