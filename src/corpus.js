// Corpus du MVP : 40 souvenirs (24 courts, 16 longs).
// Chaque entrée : { id, texte, cout, motifs }.
// Le coût est en unités d'espace ; les motifs servent au réseau d'associations (§6).
// Règle I3 : chaque texte doit tenir seul, lu hors contexte.

export const CORPUS = [
  // ——— Souvenirs courts (4–9) — acte I ———
  {
    id: 'regle-fer',
    texte: 'La règle en fer de mon père, tiède parce qu’elle avait passé l’après-midi au soleil sur l’établi.',
    cout: 9,
    motifs: ['père', 'atelier'],
  },
  {
    id: 'carrelage',
    texte: 'Le carrelage de la cuisine, blanc et bleu, et la case fêlée près de l’évier qu’on évitait pieds nus.',
    cout: 8,
    motifs: ['cuisine', 'eau'],
  },
  {
    id: 'ne-regarde-pas',
    texte: 'Ma sœur qui dit « ne regarde pas », et je regarde, et c’est seulement un chat sur le mur.',
    cout: 6,
    motifs: ['sœur', 'chat'],
  },
  {
    id: 'colle-a-bois',
    texte: 'L’odeur de la colle à bois, et la radio qu’on n’écoutait jamais vraiment, mais qu’on n’éteignait pas.',
    cout: 8,
    motifs: ['odeur', 'atelier'],
  },
  {
    id: 'trajet-de-nuit',
    texte: 'Un trajet de nuit, la route mouillée, personne ne parle, et la lumière verte du tableau de bord sur nos genoux.',
    cout: 9,
    motifs: ['nuit', 'voiture', 'lumière'],
  },
  {
    id: 'sel-cheveux',
    texte: 'Le sel dans les cheveux, le soir, quand on se couchait sans les laver.',
    cout: 6,
    motifs: ['mer', 'sel'],
  },
  {
    id: 'compter-soixante',
    texte: 'Mon frère qui compte à voix haute jusqu’à ce que je m’endorme. Il n’a jamais dépassé soixante.',
    cout: 8,
    motifs: ['frère', 'voix', 'nuit'],
  },
  {
    id: 'buee-bus',
    texte: 'La buée sur la vitre du bus, et un mot écrit dedans avec le doigt, que je ne sais plus.',
    cout: 7,
    motifs: ['fenêtre', 'hiver', 'école'],
  },
  {
    id: 'chien-boulangerie',
    texte: 'Un chien noir qui attendait devant la boulangerie tous les matins. Il n’était à personne.',
    cout: 7,
    motifs: ['chien', 'ville'],
  },
  {
    id: 'piece-scotch',
    texte: 'La pièce de dix francs collée avec du scotch au bas d’une lettre, « pour le bus ».',
    cout: 9,
    motifs: ['argent', 'papier'],
  },
  {
    id: 'manche-cuillere',
    texte: 'Ma mère qui goûte la sauce avec le manche de la cuillère, jamais avec le côté creux.',
    cout: 8,
    motifs: ['mère', 'cuisine'],
  },
  {
    id: 'premier-gel',
    texte: 'Le premier gel : les flaques qui craquent sous la roue du vélo, et le froid dans les dents.',
    cout: 9,
    motifs: ['hiver', 'vélo'],
  },
  {
    id: 'telephone-maison-vide',
    texte: 'Le téléphone qui sonne dans la maison vide, longtemps, et on décide de ne pas courir.',
    cout: 7,
    motifs: ['téléphone', 'silence'],
  },
  {
    id: 'rue-des-lices',
    texte: 'Un nom de rue lu de travers pendant des années : c’était « Lices », pas « Lilas ».',
    cout: 5,
    motifs: ['ville', 'papier'],
  },
  {
    id: 'levier-vitesse',
    texte: 'La main de mon père sur le levier de vitesse, la mienne dessus, et il me laissait passer la troisième.',
    cout: 9,
    motifs: ['père', 'main', 'voiture'],
  },
  {
    id: 'tarot-contre-le-mur',
    texte: 'Un été où il a plu tous les jours, et ma sœur qui a appris le tarot toute seule, contre le mur.',
    cout: 9,
    motifs: ['pluie', 'sœur', 'jeu'],
  },
  {
    id: 'carnet-reste',
    texte: 'Le carnet à spirale avec les comptes de la semaine, et le mot « reste » souligné deux fois.',
    cout: 8,
    motifs: ['argent', 'papier', 'mère'],
  },
  {
    id: 'feu-novembre',
    texte: 'Le feu dans le jardin en novembre, les feuilles mouillées qui fument plus qu’elles ne brûlent.',
    cout: 8,
    motifs: ['feu', 'jardin', 'odeur'],
  },
  {
    id: 'silence-neige',
    texte: 'Le silence après la neige. Même la voiture du voisin qui démarre a l’air de s’excuser.',
    cout: 7,
    motifs: ['hiver', 'silence'],
  },
  {
    id: 'pain-sur-le-capot',
    texte: 'On a mangé le pain sur le capot, encore chaud, en attendant la dépanneuse.',
    cout: 7,
    motifs: ['voiture', 'attente'],
  },
  {
    id: 'lac-sept-heures',
    texte: 'L’eau du lac à sept heures : on n’entre pas, on se laisse tomber, et on crie sans le faire exprès.',
    cout: 9,
    motifs: ['eau', 'été', 'voix'],
  },
  {
    id: 'vernis-rouge',
    texte: 'Le vernis rouge écaillé sur les ongles de ma grand-mère, et elle qui dit qu’elle n’a plus l’âge.',
    cout: 8,
    motifs: ['main', 'grand-mère'],
  },
  {
    id: 'minuterie-escalier',
    texte: 'La minuterie de l’escalier qui s’éteint toujours entre le deuxième et le troisième.',
    cout: 6,
    motifs: ['lumière', 'maison'],
  },
  {
    id: 'billet-dans-un-livre',
    texte: 'Un billet de train gardé dans un livre, et le livre prêté, et jamais revenu.',
    cout: 7,
    motifs: ['train', 'papier'],
  },

  // ——— Souvenirs longs (18–40) — acte II ———
  {
    id: 'plier-la-carte',
    texte: 'Mon père avait une manière de plier la carte routière qui ne marchait jamais du premier coup. Il recommençait, sans rien dire, jusqu’à ce que les plis reprennent leur place, et on ne repartait que quand la carte était comme neuve.',
    cout: 40,
    motifs: ['père', 'voiture', 'papier'],
  },
  {
    id: 'lit-au-carre',
    texte: 'Le matin de son départ, ma sœur a fait son lit au carré, ce qu’elle n’avait jamais fait. Je l’ai défait le soir même pour dormir dedans, et je l’ai refait avant que ma mère monte.',
    cout: 40,
    motifs: ['sœur', 'mère', 'maison'],
  },
  {
    id: 'tas-de-copeaux',
    texte: 'L’atelier sentait la sciure et l’huile de machine. On avait le droit de balayer, pas de toucher aux lames. Le tas de copeaux sous l’établi était tiède si on y plongeait la main.',
    cout: 36,
    motifs: ['odeur', 'atelier', 'main'],
  },
  {
    id: 'train-six-heures-quarante',
    texte: 'Le train de six heures quarante, en hiver, quand la vitre est encore noire et qu’on y voit sa propre tête. Une femme lisait le même livre que moi et on ne s’est jamais rien dit.',
    cout: 40,
    motifs: ['train', 'hiver', 'fenêtre'],
  },
  {
    id: 'dette-du-jeudi',
    texte: 'Il y avait une dette entre mon frère et moi, quarante francs, et on la faisait durer exprès. Rembourser aurait voulu dire qu’on n’avait plus de raison de se voir le jeudi.',
    cout: 34,
    motifs: ['frère', 'argent', 'jeu'],
  },
  {
    id: 'mer-en-octobre',
    texte: 'La mer en octobre, quand il n’y a plus personne et que l’eau est plus chaude que l’air. On restait dedans jusqu’aux lèvres bleues et on courait jusqu’à la voiture.',
    cout: 40,
    motifs: ['mer', 'eau', 'voiture'],
  },
  {
    id: 'chanter-faux',
    texte: 'Ma mère chantait faux dans la cuisine, seulement quand elle se croyait seule. Si on entrait, elle s’arrêtait net et continuait à couper les oignons comme si de rien n’était.',
    cout: 33,
    motifs: ['mère', 'cuisine', 'voix'],
  },
  {
    id: 'sous-le-prunier',
    texte: 'Le chien est mort un dimanche, et on a creusé dans le jardin, sous le prunier, là où la terre était molle. Mon père a mis le collier dans sa poche et je ne l’ai jamais revu.',
    cout: 40,
    motifs: ['chien', 'jardin', 'père'],
  },
  {
    id: 'toit-de-tole',
    texte: 'La pluie sur le toit de tôle du garage, si forte qu’il aurait fallu crier, et on ne criait pas : on attendait, assis sur les bidons, que ça passe.',
    cout: 30,
    motifs: ['pluie', 'silence', 'attente'],
  },
  {
    id: 'trois-minutes',
    texte: 'Le téléphone à cadran du couloir, et la règle de ne pas dépasser trois minutes. On tirait le fil jusque dans le placard pour parler bas, et tout le monde entendait quand même.',
    cout: 40,
    motifs: ['téléphone', 'voix', 'maison'],
  },
  {
    id: 'volets-verts',
    texte: 'Un été à repeindre les volets, ma sœur et moi, en vert, et la peinture qui n’a jamais tenu. Dix ans après, le vert était encore là par plaques, sous le bleu.',
    cout: 36,
    motifs: ['été', 'sœur', 'maison'],
  },
  {
    id: 'feu-d-artifice-du-toit',
    texte: 'Le feu d’artifice vu du toit, trop loin pour entendre les explosions. Les lumières arrivaient d’abord, puis le bruit, et mon frère comptait les secondes entre les deux.',
    cout: 32,
    motifs: ['feu', 'lumière', 'frère'],
  },
  {
    id: 'muret-de-l-ecole',
    texte: 'L’école fermait à seize heures trente et ma mère arrivait à dix-sept. Une demi-heure sur le muret, tous les jours, à regarder les autres partir, sans être triste, juste à attendre.',
    cout: 40,
    motifs: ['école', 'mère', 'attente'],
  },
  {
    id: 'lumiere-de-janvier',
    texte: 'La lumière de janvier dans la cuisine, basse, qui passe sous la table et éclaire les pieds. Mon père lisait le journal debout, à cause de son dos.',
    cout: 30,
    motifs: ['lumière', 'hiver', 'cuisine'],
  },
  {
    id: 'velo-trop-grand',
    texte: 'Le vélo trop grand, hérité de mon frère, la selle au plus bas et les pieds qui ne touchaient pas. On m’a poussé dans la descente, et j’ai eu peur, et j’ai aimé ça.',
    cout: 35,
    motifs: ['vélo', 'frère'],
  },
  {
    id: 'robinet-qui-fuit',
    texte: 'Dans le jardin, un robinet qui fuyait depuis toujours, et l’herbe autour plus verte que le reste. On n’a jamais fait réparer. Ma mère disait que c’était le seul endroit qui poussait sans qu’on s’en occupe.',
    cout: 40,
    motifs: ['jardin', 'eau', 'mère'],
  },
];

export const SEUIL_LONG = 18; // à partir de ce coût, un souvenir est « long » (acte II)

export function estLong(souvenir) {
  return souvenir.cout >= SEUIL_LONG;
}

export function parId(id) {
  return CORPUS.find((s) => s.id === id) || null;
}
