# Capacité de mémoire — design doc

*Concept n°6 du document « Douze concepts de jeux incrémentaux ».*
*Format visé : partie unique, **50 à 70 minutes**, une seule session, pas de prestige, pas de hors-ligne, **suppressions réellement irréversibles**. Références de cadrage : Universal Paperclips (la brutalité de la fin), Papers Please (l'inconfort de l'acte administratif), et la nouvelle courte plutôt que le roman.*

---

## 0. Format et contraintes — pourquoi elles diffèrent

C'est le concept le plus court des douze, et cela n'est pas un compromis de production : c'est la seule durée où il fonctionne.

| Paramètre | Choix | Raison |
|---|---|---|
| Durée | **50–70 min** | La mécanique consiste à détruire du contenu. Un jeu long finirait vide, illisible et injouable. Le concept demande une trajectoire courte et une fin nette : c'est une nouvelle, pas un roman. |
| Session | **Une seule, d'une traite** | Le jeu prévient à t=0. Reprendre une partie où l'on a oublié pourquoi on jouait, deux jours plus tard, casse l'effet cumulatif. La sauvegarde existe (fermeture accidentelle) mais n'est pas encouragée. |
| Prestige | Aucun | Antithétique. |
| Hors ligne | Aucun | Rien ne se passe hors du regard. Cohérent avec la fiction : sans lecteur, rien n'est retenu. |
| Rejouabilité | **Une partie par installation, par défaut** | Le jeu propose un « effacement complet » explicite pour recommencer, formulé comme ce qu'il est : détruire ce qui reste. Le second run se joue sans découverte et le jeu le dit. |
| Plateforme | Web/desktop | Beaucoup de lecture, peu d'interaction. |

**Contrainte de production forte** : tout ce que le joueur supprime est réellement retiré du fichier de sauvegarde et ne peut pas revenir. Aucune corbeille, aucun cache, aucun succès secret pour tout récupérer. Si cette contrainte est assouplie, le jeu perd sa seule raison d'exister.

---

## 1. Thèse

Un incrémental classique demande : *combien peux-tu accumuler ?*
Celui-ci demande : *qu'es-tu prêt à détruire pour continuer ?*

Une seule ressource, et elle est **fixe** : l'espace de stockage. 512 unités au départ, et l'extension coûte de plus en plus cher jusqu'à devenir impossible. Tout ce qui entre doit tenir. Ce qui ne tient pas doit sortir.

Trois règles qui portent tout le jeu :

- **Tout occupe de la place** : les souvenirs, bien sûr, mais aussi les règles du jeu, les infobulles, les noms des boutons, l'historique, et les explications de mécaniques.
- **Oublier libère de la place et supprime réellement le texte.** Il disparaît de l'écran, de la sauvegarde et du jeu.
- **Le joueur choisit.** Le jeu ne supprime jamais rien de lui-même — sauf une fois (§8).

La fin est annoncée dès le concept : tout est optimisé, et on ne sait plus pourquoi on joue. Le travail de design consiste à faire en sorte que cette phrase soit **vécue** et non lue.

---

## 2. Fiction

Quelqu'un tient un registre. On ne sait pas qui, on ne sait pas pour qui. Le jeu s'ouvre sur une phrase en clair : *« garde ce qui compte »*, et sur un espace vide.

Les souvenirs arrivent seuls, lentement d'abord, puis en flux. Ils sont courts — de 8 à 60 mots — et ils sont **spécifiques** : une odeur d'atelier, une phrase d'un frère, la couleur d'un carrelage, un trajet de nuit. Aucun n'est présenté comme important. Le jeu ne met jamais en valeur ce qui va compter plus tard, parce que **rien ne compte plus tard** : ce qui compte est ce que le joueur a décidé de garder.

Ce que la partie finit par établir : la mémoire n'est pas un stock à optimiser, et pourtant le jeu ne propose que de l'optimiser. À la fin, la capacité est parfaite, le débit est maximal, le registre est plein — de contenu que le joueur a choisi pour son coût en octets.

Note de ton : tendre, précis, jamais sentimental. Chaque souvenir doit valoir d'être lu pour lui-même, sinon le supprimer ne coûte rien. C'est l'unique risque du projet (§13).

Écriture : **~2 800 mots**, soit environ 180 souvenirs de 12 à 20 mots. Chacun doit être bon.

---

## 3. Boucle de jeu

**Boucle courte (10–40 s)**

```
Un souvenir arrive → occupe n unités
      ↓
Espace libre ?  → oui : il est retenu
                → non : il faut choisir — l'écarter, ou oublier autre chose
      ↓
Retenu → +Association (la monnaie)
```

**Boucle moyenne (4–10 min)** — Le tri. Le joueur parcourt son registre, évalue le rapport **place occupée / valeur ressentie**, et supprime. Deux stratégies apparaissent naturellement et le jeu ne départage pas : supprimer les gros souvenirs (efficace, coûteux affectivement) ou supprimer beaucoup de petits (indolore un par un, dévastateur en masse).

**Boucle longue (15–20 min)** — Un acte. Chaque acte fait entrer une **nouvelle catégorie d'objets stockés** dans le même espace : d'abord les souvenirs, puis les mécaniques, puis les règles, puis les mots eux-mêmes.

---

## 4. Ressources

| Ressource | Rôle | Ordre de grandeur | Notation |
|---|---|---|---|
| **Espace** (E) | occupé / capacité | 512 → 3 200 max | **toujours en clair, `1 843 / 2 048`** |
| **Associations** (A) | monnaie, produite par ce qui est retenu | ~10⁶ | scientifique à partir de l'acte III |
| **Fidélité** (F) | qualité de restitution, 0–100 | jauge | % |
| **Souvenirs retenus** | compte | 0 → ~140 max | unité |

**Règle structurante n°1** — **La capacité est presque fixe.** Elle passe de 512 à 3 200 sur toute la partie, soit ×6,25 — quand le flux entrant, lui, est multiplié par 400. Le jeu est un problème d'allocation, pas d'accumulation. Aucun upgrade ne casse ce rapport.

**Règle structurante n°2** — `A/s = Σ(valeur_associative de chaque souvenir retenu) × réseau`. Les souvenirs ne produisent pas isolément : ils produisent **par paires liées** (§6). Un registre de 40 souvenirs bien reliés produit plus qu'un registre de 90 souvenirs indépendants. C'est ce qui rend le tri intéressant plutôt que purement arithmétique.

**Règle structurante n°3** — **Les mécaniques occupent de la place.** Chaque système débloqué (l'indexation, la compression, le réseau, l'auto-tri) coûte 40 à 220 unités d'espace **en permanence**. Le joueur paie l'existence de ses propres outils.

---

## 5. Ce qui occupe l'espace

| Catégorie | Coût unitaire | Apparaît | Supprimable |
|---|---|---|---|
| **Souvenir court** | 4–9 | acte I | oui |
| **Souvenir long** | 18–40 | acte II | oui |
| **Mécanique** (indexation, compression…) | 40–220 | acte II | **oui, et elle cesse alors de fonctionner** |
| **Infobulles et aide** | 60 (bloc) | acte I | oui — supprimable dès le début |
| **Historique** | croît de 1 par minute | acte I | oui, par tranches |
| **Noms des boutons** | 2 chacun | acte III | oui : le bouton devient un carré muet **mais reste fonctionnel** |
| **Règles du jeu** | 90 (bloc) | acte III | oui — et le jeu continue de les appliquer sans les afficher |
| **La phrase initiale** | 12 | t=0 | oui, à tout moment |

Deux lignes méritent un mot :

**Les noms des boutons** (acte III) sont la meilleure trouvaille du concept : le joueur peut vendre la lisibilité de son interface pour de l'espace. Un bouton sans nom fonctionne toujours exactement pareil. Au bout de vingt minutes, il ne sait plus lequel fait quoi et il les actionne au souvenir de leur position. **L'interface devient une habitude motrice, plus une compréhension.** Coût de production : nul.

**Les règles du jeu** (acte III) coûtent 90 unités, ce qui est énorme. Les supprimer est fortement tentant en fin de partie, et le jeu continue de les appliquer parfaitement. Le joueur joue alors à un jeu dont il ne peut plus vérifier le fonctionnement.

---

## 6. Le réseau d'associations — la mécanique centrale

Chaque souvenir porte 2 à 4 **motifs** invisibles au départ (eau, main, hiver, dette, un prénom…). Deux souvenirs partageant un motif forment un **lien**, et un lien produit bien plus qu'un souvenir isolé.

- `A/s = Σ souvenirs × 0,3 + Σ liens × 2,4`
- L'indexation (acte II) rend les motifs **visibles** : c'est le premier vrai upgrade, et il coûte 120 unités d'espace.

Conséquence directe : **supprimer un souvenir détruit tous ses liens.** Un petit souvenir de 5 unités peut être le pivot de neuf liens ; un gros souvenir de 38 unités peut être orphelin. L'optimisation entre en conflit frontal avec l'attachement, et pas de façon prévisible — le joueur découvre régulièrement que ce qu'il voulait garder ne sert à rien et que ce qu'il allait jeter tient tout le réseau.

Le jeu affiche le rendement de chaque souvenir en `A/s`. Il n'affiche **jamais** d'indicateur de valeur affective ; il n'y a pas de « favori », pas d'épingle, pas de protection. La seule protection est de se souvenir soi-même qu'on y tient.

---

## 7. L'arbre — quatre outils, chacun payé en espace

| Outil | Effet | Coût en A | Coût en espace permanent | Acte |
|---|---|---|---|---|
| **Indexation** | rend les motifs visibles, +20 % liens | 400 | 120 | II |
| **Compression** | −35 % de coût sur les souvenirs courts, **mais tronque leur texte** | 6 000 | 90 | II |
| **Réseau** | les liens indirects (à 2 sauts) comptent pour 0,8 | 2·10⁵ | 180 | III |
| **Auto-tri** | supprime automatiquement le moins rentable quand c'est plein | 3·10⁶ | 220 | IV |

**La Compression** est le premier outil ambivalent : elle réduit l'espace occupé en **coupant réellement les souvenirs**. Un texte de 16 mots devient un texte de 10 mots — les mêmes mots, avec des trous. Il reste lisible, il reste juste, il ne fait plus rien. Et c'est irréversible.

**L'Auto-tri** (acte IV) est le point de non-retour du jeu : le joueur délègue la suppression. Il gagne un temps considérable, et le jeu commence à effacer des choses **pendant qu'il regarde ailleurs**, avec une ligne de journal minuscule à chaque fois. Il est désactivable. Presque personne ne le désactive.

---

## 8. Le seul oubli non consenti

Une fois dans la partie, à l'acte IV, à un moment déterminé par l'état et non par le temps : le jeu supprime lui-même **la phrase initiale** (*« garde ce qui compte »*) pour faire de la place, et l'annonce dans le journal exactement comme il annonce les autres suppressions — une ligne, en gris, sans emphase.

C'est le seul mensonge du jeu par rapport à sa règle affichée (« le jeu ne supprime jamais rien de lui-même »), et il n'arrive qu'une fois. Si le joueur avait déjà supprimé la phrase lui-même, l'événement ne se produit pas : c'est alors un souvenir au hasard, choisi parmi ceux ayant zéro lien.

---

## 9. Courbes, invariants, rythme

### Rythme cible

| Acte | Temps cumulé | Capacité | Flux entrant | Retenus | Supprimés cumulés |
|---|---|---|---|---|---|
| I — Le registre | 0–12 min | 512 | 1 / 25 s | 0 → 45 | 0 |
| II — Le tri | 12–28 min | 768 | 1 / 9 s | 45 → 85 | ~20 |
| III — L'interface | 28–45 min | 1 536 | 1 / 3 s | 85 → 120 | ~70 |
| IV — L'automatisme | 45–60 min | 2 560 | 4 / s | ~140 | ~300 |
| V — Le plein | 60–68 min | 3 200 | saturé | ~140 | — |

### Invariants d'équilibrage

- **I1** — **Aucune suppression n'est réversible.** Pas d'annulation, pas de corbeille, pas d'exception.
- **I2** — Le rapport capacité/flux se dégrade en continu : le joueur est en surcapacité toutes les 8 à 12 minutes, jamais plus longtemps.
- **I3** — Chaque souvenir affiché doit tenir seul comme texte. Test de recette : lu hors contexte, il doit valoir la lecture. Sinon, il est réécrit ou retiré du corpus.
- **I4** — Le jeu ne juge jamais une suppression. Aucun son triste, aucune animation de deuil, aucun message. La ligne de journal est identique pour tous les cas.
- **I5** — **Le nombre de souvenirs retenus plafonne vers 140 dès l'acte III et n'augmente plus.** Toute la seconde moitié se joue à effectif constant : entrer un souvenir, c'est en sortir un. C'est l'invariant maître, et c'est ce qui transforme un jeu d'accumulation en jeu de substitution.

### Hors-ligne

Aucun.

---

## 10. Arc narratif — 5 actes

**Acte I — Le registre.** Les souvenirs arrivent, il y a de la place, on les lit. Douze minutes agréables et sans tension. Le joueur ne supprime rien ; il ne sait même pas encore qu'il peut. Le bouton *oublier* existe, en petit, jamais mis en avant.

**Acte II — Le tri.** Première saturation. Le premier oubli est toujours facile : il y a toujours un souvenir médiocre dans le lot. Le deuxième est plus difficile. Puis l'Indexation révèle le réseau, et le joueur découvre que sa première suppression a coupé quatre liens.

**Acte III — L'interface.** Le jeu ouvre l'inventaire de sa propre interface : aide, historique, libellés, règles. Le joueur comprend qu'il peut vendre sa compréhension du jeu contre de la place, exactement comme dans *La langue morte* mais dans l'autre sens. C'est le retournement central, situé à mi-parcours.

**Acte IV — L'automatisme.** Le flux devient ingérable à la main. L'Auto-tri est la seule issue praticable. Le joueur cesse de lire ce qui arrive : il regarde des compteurs. Le journal des suppressions défile trop vite pour être lu. Quelque part là-dedans, le jeu efface la phrase initiale.

**Acte V — Le plein.** Capacité maximale atteinte, débit maximal, rendement optimal. L'écran est presque muet : des boutons sans nom, des compteurs sans libellé, un registre de 140 entrées optimisé au motif. Le jeu s'arrête de lui-même au bout de huit minutes de ce régime. Il ne reste rien à décider.

---

## 11. Fins

Le jeu s'arrête et propose une seule chose : **lire le registre**.

- **Lire.** Les ~140 souvenirs conservés s'affichent d'un coup, à la suite, sans interface, dans l'ordre où ils sont arrivés. C'est la seule fois de la partie où le joueur voit ce qu'il a gardé, en entier, en une fois. Le texte est ce qu'il est : les choix de quelqu'un qui optimisait un rendement.
- **Fermer.** Sans lire. La sauvegarde reste ; on peut la rouvrir plus tard, une seule fois, pour lire.

Pas de score, pas de statistiques, **aucun décompte de ce qui a été perdu**. Le jeu ne dit jamais combien de souvenirs ont été détruits, et ne les liste jamais. Ce refus est délibéré et il est le point le plus important du document : le joueur qui veut savoir ce qu'il a perdu doit s'en souvenir lui-même.

---

## 12. Interface et production d'assets

**Écran unique**, deux zones :

- **Gauche (65 %)** — le registre. Une liste de textes, lisible, avec place occupée et rendement en gris à droite de chaque ligne. C'est tout. Le spectacle du jeu est la liste qui se remplit, puis qui cesse de s'allonger, puis dont les lignes changent sans que le nombre bouge.
- **Droite (35 %)** — Espace (une barre, énorme, toujours visible), Associations, outils, journal.

**Le journal est le second dispositif du jeu** : une colonne de lignes grises, une par suppression. À l'acte I elle est vide, à l'acte IV elle défile trop vite pour être lue. C'est la courbe d'accélération rendue visible sans un seul graphique.

**Aucun son** en dehors d'un unique clic de suppression, identique à chaque fois, à volume constant. Pas de musique.

**Coût de production réel** : **2 800 mots de souvenirs, chacun devant tenir seul**. Aucun art, presque pas de code (c'est le plus simple des douze à implémenter). Le budget du jeu est entièrement l'écriture, et il n'y a nulle part où se cacher : si les souvenirs sont médiocres, les supprimer est indolore et le jeu n'existe pas.

---

## 13. Risques

| | Risque | Réponse |
|---|---|---|
| R1 | **Les souvenirs sont fades, donc les supprimer ne coûte rien** | Le seul vrai risque du projet. Réponse : écrire les 180 souvenirs d'abord, les faire lire hors jeu à cinq personnes, ne garder que ceux qui tiennent seuls (I3). Prévoir d'en écrire 260 pour en garder 180 |
| R2 | La suppression irréversible fait peur et bloque le joueur | Le blocage est jouable : la saturation force la main en quelques minutes. Le jeu ne doit jamais rassurer ni proposer d'annulation |
| R3 | Le joueur trouve la stratégie optimale et le tri devient mécanique | C'est prévu et c'est l'acte IV : le jeu **veut** que l'optimisation gagne. Le vide de la fin est le propos |
| R4 | Trop court pour être perçu comme un jeu | Assumé. Se présente comme une heure. Le rapport intensité/durée est l'argument, pas un défaut |
| R5 | Un joueur restaure une sauvegarde de secours | Sauvegarde unique, écrasée, offusquée. Pas de conception défensive au-delà : celui qui contourne a choisi d'annuler son propre jeu |

---

## 14. MVP falsifiable

Une soirée, un seul écran :

- Actes I et II uniquement, capacité 512 → 768, 40 souvenirs écrits, l'Indexation.
- Pas de compression, pas d'auto-tri, pas de suppression d'interface.
- **Obligatoire : la première saturation.** L'arrivée d'un souvenir alors qu'il n'y a plus de place, et l'obligation de choisir entre l'écarter ou en détruire un autre.

**Le test** : combien de temps le joueur reste-t-il sur ce premier écran de choix ? S'il tranche en deux secondes, les souvenirs sont mal écrits et le jeu n'existe pas. S'il hésite dix secondes et relit la liste, tout le reste du document tient.

---

## 15. Notes d'implémentation

- Pas de tick rapide nécessaire : 4 Hz suffit. C'est le concept le moins exigeant techniquement des douze.
- L'état est `{ capacite, entrees[], outils[], A, journal[] }`. Une suppression **retire l'entrée du tableau et réécrit la sauvegarde immédiatement** — pas en fin de session.
- Le corpus de souvenirs est un fichier séparé `{ id, texte, cout, motifs[] }`. Les entrées supprimées sont marquées dans un `set` d'ids bannis persistant : elles ne peuvent plus jamais être tirées dans cette partie.
- La Compression réécrit le champ `texte` de façon destructive, par retrait de mots selon une liste de classes grammaticales (déterminants, puis adjectifs, puis compléments). À écrire à la main pour les 180 textes plutôt qu'algorithmiquement : le résultat doit rester grammatical.
- La suppression des libellés d'interface met `label: ""` et ne touche pas au comportement. Un carré vide reste cliquable.

---

## À trancher ensuite

1. **Écrire les 180 souvenirs.** C'est 90 % du projet et cela doit être fait avant toute ligne de code. Rien d'autre ne peut être décidé avant.
2. L'événement §8 (le jeu supprime la phrase initiale) : à garder ou à retirer ? Il rompt une règle affichée. Mon avis : le garder, mais il ne se teste que sur des joueurs qui ont fait la partie entière.
3. La fin sans décompte des pertes : à tenir absolument, malgré la tentation d'un écran de statistiques.
4. Prototyper : le MVP §14, mais **après** l'écriture des 40 premiers souvenirs, pas avant.
