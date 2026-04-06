export interface SeedAssetDefinition {
  name: string;
  prompt: string;
  art_style: string;
  category: string;
  tags: string[];
  description: string;
}

export const SEED_ASSETS: SeedAssetDefinition[] = [
  // --- Characters ---
  {
    name: "Knight Warrior",
    prompt: "A medieval knight warrior in full plate armor, standing in a heroic pose with a longsword and shield, detailed steel armor with engravings",
    art_style: "realistic",
    category: "character",
    tags: ["character", "knight", "warrior", "medieval", "human"],
    description: "Armored knight character with sword and shield",
  },
  {
    name: "Forest Archer",
    prompt: "A female elven ranger archer with a longbow, wearing leather armor and a forest green cloak, pointed ears, quiver of arrows on back",
    art_style: "realistic",
    category: "character",
    tags: ["character", "archer", "ranger", "elf", "female"],
    description: "Elven archer character with bow and leather armor",
  },
  {
    name: "Dark Wizard",
    prompt: "A mysterious wizard mage in dark robes holding a glowing magical staff, long beard, pointy hat, arcane runes on robe",
    art_style: "realistic",
    category: "character",
    tags: ["character", "wizard", "mage", "magic", "human"],
    description: "Wizard character with magical staff and robes",
  },
  {
    name: "Goblin Scout",
    prompt: "A small green goblin creature with pointy ears, wearing tattered leather scraps, holding a crude dagger, menacing expression",
    art_style: "realistic",
    category: "character",
    tags: ["character", "goblin", "enemy", "creature", "monster"],
    description: "Goblin enemy creature with dagger",
  },
  {
    name: "Skeleton Warrior",
    prompt: "An undead skeleton warrior holding a rusted sword and broken shield, glowing eye sockets, tattered remnants of armor",
    art_style: "realistic",
    category: "character",
    tags: ["character", "skeleton", "undead", "enemy", "monster"],
    description: "Undead skeleton enemy with rusty weapons",
  },
  {
    name: "Fire Dragon",
    prompt: "A fierce red dragon with large wings spread open, sharp claws and teeth, scales with ember glow, long spiked tail, breathing fire",
    art_style: "realistic",
    category: "character",
    tags: ["character", "dragon", "boss", "creature", "flying"],
    description: "Fearsome red fire dragon boss creature",
  },

  // --- Vegetation ---
  {
    name: "Oak Tree",
    prompt: "A large oak tree with a thick gnarled trunk and wide spreading canopy of green leaves, detailed bark texture",
    art_style: "realistic",
    category: "vegetation",
    tags: ["tree", "oak", "vegetation", "environment", "nature"],
    description: "Large oak tree with spreading canopy",
  },
  {
    name: "Pine Tree",
    prompt: "A tall conifer pine tree with dark green needles in a classic triangular shape, brown textured trunk",
    art_style: "realistic",
    category: "vegetation",
    tags: ["tree", "pine", "conifer", "vegetation", "environment"],
    description: "Tall pine tree with triangular shape",
  },
  {
    name: "Flowering Bush",
    prompt: "A round leafy green bush shrub with small pink and white flowers blooming, garden hedgerow style",
    art_style: "realistic",
    category: "vegetation",
    tags: ["bush", "shrub", "vegetation", "environment", "flowers"],
    description: "Flowering garden bush with pink blooms",
  },
  {
    name: "Giant Mushroom",
    prompt: "A large fantasy mushroom with a wide red cap dotted with white spots, thick pale stem, magical forest mushroom, bioluminescent glow",
    art_style: "realistic",
    category: "vegetation",
    tags: ["mushroom", "vegetation", "fantasy", "environment", "magical"],
    description: "Fantasy red-capped mushroom with bioluminescent glow",
  },
  {
    name: "Willow Tree",
    prompt: "A weeping willow tree with long drooping branches and delicate green leaves cascading down, peaceful and elegant",
    art_style: "realistic",
    category: "vegetation",
    tags: ["tree", "willow", "vegetation", "environment", "nature"],
    description: "Elegant weeping willow with drooping branches",
  },

  // --- Structures ---
  {
    name: "Medieval Cottage",
    prompt: "A small medieval cottage house with timber frame walls, thatched roof, stone chimney, wooden door, flower boxes in windows",
    art_style: "realistic",
    category: "structure",
    tags: ["building", "cottage", "house", "medieval", "structure"],
    description: "Cozy medieval cottage with thatched roof",
  },
  {
    name: "Stone Watchtower",
    prompt: "A tall cylindrical stone watchtower with battlements at top, arrow slits, wooden door at base, medieval castle tower",
    art_style: "realistic",
    category: "structure",
    tags: ["building", "tower", "watchtower", "medieval", "structure"],
    description: "Defensive stone watchtower with battlements",
  },
  {
    name: "Wooden Bridge",
    prompt: "A rustic wooden plank bridge with rope railings spanning a gap, weathered timber, sturdy construction",
    art_style: "realistic",
    category: "structure",
    tags: ["bridge", "wooden", "structure", "environment", "path"],
    description: "Rope and plank wooden bridge",
  },
  {
    name: "Stone Well",
    prompt: "A medieval stone well with a wooden roof frame, iron chain and bucket, moss-covered stone base, cobblestone surround",
    art_style: "realistic",
    category: "structure",
    tags: ["well", "stone", "structure", "interactive", "medieval"],
    description: "Stone well with wooden roof and bucket",
  },
  {
    name: "Castle Gate",
    prompt: "A large stone castle gatehouse with iron portcullis gate, two flanking towers, crenellations, torches on walls",
    art_style: "realistic",
    category: "structure",
    tags: ["gate", "castle", "structure", "medieval", "entrance"],
    description: "Fortified castle gatehouse with portcullis",
  },

  // --- Props & Items ---
  {
    name: "Treasure Chest",
    prompt: "A wooden treasure chest with iron bands, padlock, slightly open revealing gold coins and gems inside, ornate metal corners",
    art_style: "realistic",
    category: "item",
    tags: ["chest", "treasure", "item", "interactive", "loot"],
    description: "Ornate treasure chest with gold and gems",
  },
  {
    name: "Wooden Barrel",
    prompt: "A traditional wooden barrel with metal hoops, slightly worn and weathered, tavern or storage barrel",
    art_style: "realistic",
    category: "item",
    tags: ["barrel", "wooden", "item", "prop", "storage"],
    description: "Weathered wooden storage barrel",
  },
  {
    name: "Iron Anvil",
    prompt: "A heavy blacksmith iron anvil on a thick wooden stump base, scratched and dented from use, blacksmith workshop",
    art_style: "realistic",
    category: "item",
    tags: ["anvil", "blacksmith", "item", "prop", "crafting"],
    description: "Blacksmith iron anvil on wooden stump",
  },
  {
    name: "Campfire",
    prompt: "A stone-ringed campfire with burning logs, orange flames and glowing embers, small sparks rising, warm light",
    art_style: "realistic",
    category: "item",
    tags: ["campfire", "fire", "interactive", "environment", "light"],
    description: "Stone-ringed campfire with burning logs",
  },
  {
    name: "Magic Crystal",
    prompt: "A cluster of large glowing blue magical crystals emerging from a stone base, translucent with inner light, arcane energy",
    art_style: "realistic",
    category: "item",
    tags: ["crystal", "magical", "item", "resource", "glowing"],
    description: "Glowing blue magical crystal cluster",
  },

  // --- Weapons ---
  {
    name: "Longsword",
    prompt: "A medieval longsword with a steel crossguard, leather-wrapped grip, pommel, and a sharp double-edged blade, resting upright",
    art_style: "realistic",
    category: "weapon",
    tags: ["sword", "weapon", "melee", "equipment", "steel"],
    description: "Classic medieval longsword",
  },
  {
    name: "War Hammer",
    prompt: "A large two-handed war hammer with a heavy iron head, wooden shaft reinforced with metal bands, battle-worn",
    art_style: "realistic",
    category: "weapon",
    tags: ["hammer", "weapon", "melee", "equipment", "heavy"],
    description: "Heavy two-handed war hammer",
  },
  {
    name: "Wooden Shield",
    prompt: "A round wooden shield with iron boss center, metal rim, leather straps on back, painted heraldic design",
    art_style: "realistic",
    category: "weapon",
    tags: ["shield", "weapon", "defense", "equipment", "wooden"],
    description: "Round wooden shield with heraldic design",
  },

  // --- Terrain & Environment ---
  {
    name: "Boulder Rock",
    prompt: "A large natural boulder rock formation, rough granite texture, moss on one side, realistic weathered stone",
    art_style: "realistic",
    category: "terrain",
    tags: ["rock", "boulder", "terrain", "environment", "natural"],
    description: "Large natural granite boulder",
  },
  {
    name: "Ancient Ruins",
    prompt: "Crumbling ancient stone ruins with broken pillars, collapsed archway, ivy growing on walls, mysterious carved symbols",
    art_style: "realistic",
    category: "terrain",
    tags: ["ruins", "ancient", "structure", "environment", "stone"],
    description: "Crumbling ancient stone ruins with broken pillars",
  },
  {
    name: "Wooden Cart",
    prompt: "A medieval wooden horse-drawn cart with two large wheels, open bed for cargo, weathered timber construction",
    art_style: "realistic",
    category: "prop",
    tags: ["cart", "vehicle", "wooden", "prop", "medieval"],
    description: "Medieval wooden cargo cart",
  },
  {
    name: "Street Lantern",
    prompt: "A wrought iron medieval street lantern on a tall pole, glass panes with warm candlelight inside, ornate metalwork",
    art_style: "realistic",
    category: "prop",
    tags: ["lantern", "light", "prop", "street", "medieval"],
    description: "Wrought iron street lantern with warm glow",
  },
  {
    name: "Gravestone",
    prompt: "An old weathered stone gravestone with carved cross on top, moss and lichen growing, slightly tilted, cemetery headstone",
    art_style: "realistic",
    category: "prop",
    tags: ["gravestone", "cemetery", "prop", "environment", "stone"],
    description: "Weathered stone gravestone with carved cross",
  },
  {
    name: "Wooden Crate",
    prompt: "A sturdy wooden storage crate with metal reinforcement corners and nails, shipping crate with rope handles",
    art_style: "realistic",
    category: "item",
    tags: ["crate", "wooden", "item", "storage", "interactive"],
    description: "Reinforced wooden storage crate",
  },
];

export const SEED_CATEGORIES = [
  { key: "all", label: "All Assets" },
  { key: "character", label: "Characters" },
  { key: "vegetation", label: "Vegetation" },
  { key: "structure", label: "Structures" },
  { key: "item", label: "Items & Props" },
  { key: "weapon", label: "Weapons" },
  { key: "terrain", label: "Terrain" },
  { key: "prop", label: "Props" },
];
