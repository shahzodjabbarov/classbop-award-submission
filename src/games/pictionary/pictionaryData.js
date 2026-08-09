const CATEGORY_SEEDS = [
  {
    id: 'animals',
    name: 'Animals',
    icon: '🦁',
    color: '#FFB84D',
    accent: '#FFF2CC',
    description: 'Cute, wild, and classroom-friendly animal prompts.',
    words: [
      ['Lion', '🦁', 'easy'],
      ['Elephant', '🐘', 'easy'],
      ['Giraffe', '🦒', 'easy'],
      ['Monkey', '🐒', 'easy'],
      ['Penguin', '🐧', 'easy'],
      ['Tiger', '🐯', 'easy'],
      ['Rabbit', '🐰', 'easy'],
      ['Turtle', '🐢', 'easy'],
      ['Dolphin', '🐬', 'medium'],
      ['Kangaroo', '🦘', 'medium'],
      ['Crocodile', '🐊', 'medium'],
      ['Butterfly', '🦋', 'medium'],
      ['Octopus', '🐙', 'medium'],
      ['Owl', '🦉', 'medium'],
      ['Shark', '🦈', 'medium',
      ],
      ['Zebra', '🦓', 'easy'],
      ['Koala', '🐨', 'medium'],
      ['Snake', '🐍', 'easy'],
      ['Panda', '🐼', 'easy'],
      ['Whale', '🐋', 'medium'],
    ],
  },
  {
    id: 'food',
    name: 'Food',
    icon: '🍕',
    color: '#FF6B6B',
    accent: '#FFE5E5',
    description: 'Simple foods students can draw fast.',
    words: [
      ['Pizza', '🍕', 'easy'],
      ['Hamburger', '🍔', 'easy'],
      ['Ice Cream', '🍦', 'easy'],
      ['Apple', '🍎', 'easy'],
      ['Banana', '🍌', 'easy'],
      ['Cake', '🎂', 'easy'],
      ['Cookie', '🍪', 'easy'],
      ['Sandwich', '🥪', 'medium'],
      ['Sushi', '🍣', 'medium'],
      ['Taco', '🌮', 'medium'],
      ['Popcorn', '🍿', 'easy'],
      ['Donut', '🍩', 'easy'],
      ['Carrot', '🥕', 'easy'],
      ['Watermelon', '🍉', 'easy'],
      ['Spaghetti', '🍝', 'medium'],
      ['Hot Dog', '🌭', 'easy'],
      ['Pancakes', '🥞', 'medium'],
      ['Cheese', '🧀', 'easy'],
      ['Strawberry', '🍓', 'easy'],
      ['Soup', '🍲', 'medium'],
    ],
  },
  {
    id: 'countries',
    name: 'Countries',
    icon: '🌍',
    color: '#51B7FF',
    accent: '#E4F5FF',
    description: 'Country prompts with recognizable flags.',
    words: [
      ['Korea', '🇰🇷', 'easy'],
      ['Japan', '🇯🇵', 'easy'],
      ['China', '🇨🇳', 'easy'],
      ['United States', '🇺🇸', 'easy'],
      ['Canada', '🇨🇦', 'easy'],
      ['Brazil', '🇧🇷', 'medium'],
      ['France', '🇫🇷', 'medium'],
      ['Italy', '🇮🇹', 'medium'],
      ['Spain', '🇪🇸', 'medium'],
      ['Germany', '🇩🇪', 'medium'],
      ['Mexico', '🇲🇽', 'medium'],
      ['Australia', '🇦🇺', 'easy'],
      ['India', '🇮🇳', 'medium'],
      ['Thailand', '🇹🇭', 'medium'],
      ['Vietnam', '🇻🇳', 'medium'],
      ['Egypt', '🇪🇬', 'hard'],
      ['Turkey', '🇹🇷', 'hard'],
      ['South Africa', '🇿🇦', 'hard'],
      ['United Kingdom', '🇬🇧', 'medium'],
      ['Philippines', '🇵🇭', 'medium'],
    ],
  },
  {
    id: 'clothes',
    name: 'Clothes',
    icon: '👕',
    color: '#845EF7',
    accent: '#EEE8FF',
    description: 'Wearables and accessories for quick sketches.',
    words: [
      ['T-shirt', '👕', 'easy'],
      ['Jeans', '👖', 'easy'],
      ['Dress', '👗', 'easy'],
      ['Hat', '🧢', 'easy'],
      ['Shoes', '👟', 'easy'],
      ['Socks', '🧦', 'easy'],
      ['Coat', '🧥', 'easy'],
      ['Gloves', '🧤', 'medium'],
      ['Scarf', '🧣', 'medium'],
      ['Boots', '🥾', 'easy'],
      ['Sunglasses', '🕶️', 'easy'],
      ['Backpack', '🎒', 'easy'],
      ['Crown', '👑', 'medium'],
      ['Ring', '💍', 'medium'],
      ['Watch', '⌚', 'medium'],
      ['Tie', '👔', 'medium'],
      ['Kimono', '👘', 'hard'],
      ['Swimsuit', '🩱', 'medium'],
      ['Umbrella', '☂️', 'easy'],
      ['Handbag', '👜', 'medium'],
    ],
  },
  {
    id: 'movies',
    name: 'Movies',
    icon: '🎬',
    color: '#2DDBA4',
    accent: '#DDFBF1',
    description: 'Movie-themed objects and scenes without needing titles.',
    words: [
      ['Robot', '🤖', 'easy'],
      ['Superhero', '🦸', 'easy'],
      ['Pirate', '🏴‍☠️', 'medium'],
      ['Alien', '👽', 'easy'],
      ['Castle', '🏰', 'medium'],
      ['Dragon', '🐉', 'medium'],
      ['Ghost', '👻', 'easy'],
      ['Detective', '🕵️', 'hard'],
      ['Treasure Map', '🗺️', 'hard'],
      ['Spaceship', '🚀', 'medium'],
      ['Magic Wand', '🪄', 'medium'],
      ['Camera', '📷', 'easy'],
      ['Popcorn', '🍿', 'easy'],
      ['Movie Ticket', '🎟️', 'medium'],
      ['Monster', '👾', 'medium'],
      ['Crown', '👑', 'easy'],
      ['Sword', '⚔️', 'medium'],
      ['Island', '🏝️', 'medium'],
      ['Train Chase', '🚂', 'hard'],
      ['Red Carpet', '🎞️', 'hard'],
    ],
  },
  {
    id: 'jobs',
    name: 'Jobs',
    icon: '👩‍🏫',
    color: '#FF914D',
    accent: '#FFEBDD',
    description: 'People and professions students recognize.',
    words: [
      ['Teacher', '👩‍🏫', 'easy'],
      ['Doctor', '🧑‍⚕️', 'easy'],
      ['Chef', '🧑‍🍳', 'easy'],
      ['Police Officer', '👮', 'medium'],
      ['Firefighter', '🧑‍🚒', 'medium'],
      ['Pilot', '🧑‍✈️', 'medium'],
      ['Artist', '🎨', 'easy'],
      ['Singer', '🎤', 'easy'],
      ['Farmer', '🧑‍🌾', 'medium'],
      ['Scientist', '🧑‍🔬', 'medium'],
      ['Dentist', '🦷', 'medium'],
      ['Nurse', '💉', 'easy'],
      ['Builder', '👷', 'easy'],
      ['Driver', '🚕', 'easy'],
      ['Astronaut', '🧑‍🚀', 'medium'],
      ['Waiter', '🍽️', 'medium'],
      ['Photographer', '📸', 'medium'],
      ['Librarian', '📚', 'hard'],
      ['Mechanic', '🔧', 'medium'],
      ['Veterinarian', '🐾', 'hard'],
    ],
  },
  {
    id: 'sports',
    name: 'Sports',
    icon: '⚽',
    color: '#3EAF55',
    accent: '#E4F8E9',
    description: 'Action-filled sports prompts.',
    words: [
      ['Soccer', '⚽', 'easy'],
      ['Basketball', '🏀', 'easy'],
      ['Baseball', '⚾', 'easy'],
      ['Tennis', '🎾', 'easy'],
      ['Swimming', '🏊', 'medium'],
      ['Running', '🏃', 'easy'],
      ['Cycling', '🚴', 'medium'],
      ['Skiing', '⛷️', 'hard'],
      ['Boxing', '🥊', 'medium'],
      ['Golf', '⛳', 'medium'],
      ['Volleyball', '🏐', 'medium'],
      ['Bowling', '🎳', 'medium'],
      ['Surfing', '🏄', 'hard'],
      ['Skateboarding', '🛹', 'medium'],
      ['Table Tennis', '🏓', 'medium'],
      ['Badminton', '🏸', 'medium'],
      ['Hockey', '🏒', 'hard'],
      ['Archery', '🏹', 'hard'],
      ['Weightlifting', '🏋️', 'hard'],
      ['Martial Arts', '🥋', 'hard'],
    ],
  },
  {
    id: 'transportation',
    name: 'Transportation',
    icon: '🚗',
    color: '#00BCD4',
    accent: '#DDF9FC',
    description: 'Vehicles for classroom races and guessing.',
    words: [
      ['Car', '🚗', 'easy'],
      ['Bus', '🚌', 'easy'],
      ['Train', '🚆', 'easy'],
      ['Airplane', '✈️', 'easy'],
      ['Bicycle', '🚲', 'easy'],
      ['Motorcycle', '🏍️', 'medium'],
      ['Boat', '⛵', 'easy'],
      ['Taxi', '🚕', 'easy'],
      ['Subway', '🚇', 'medium'],
      ['Truck', '🚚', 'easy'],
      ['Ambulance', '🚑', 'medium'],
      ['Fire Truck', '🚒', 'medium'],
      ['Helicopter', '🚁', 'medium'],
      ['Scooter', '🛴', 'easy'],
      ['Rocket', '🚀', 'medium'],
      ['Tractor', '🚜', 'medium'],
      ['Police Car', '🚓', 'medium'],
      ['Ship', '🚢', 'medium'],
      ['Cable Car', '🚠', 'hard'],
      ['Hot Air Balloon', '🎈', 'hard'],
    ],
  },
  {
    id: 'household',
    name: 'Household Objects',
    icon: '🏠',
    color: '#F06292',
    accent: '#FFE3EE',
    description: 'Everyday objects students can find at home.',
    words: [
      ['Chair', '🪑', 'easy'],
      ['Table', '🧾', 'easy'],
      ['Bed', '🛏️', 'easy'],
      ['Lamp', '💡', 'easy'],
      ['Clock', '🕒', 'easy'],
      ['Mirror', '🪞', 'medium'],
      ['Sofa', '🛋️', 'easy'],
      ['Toothbrush', '🪥', 'medium'],
      ['Television', '📺', 'easy'],
      ['Refrigerator', '🧊', 'medium'],
      ['Washing Machine', '🧺', 'hard'],
      ['Door', '🚪', 'easy'],
      ['Window', '🪟', 'easy'],
      ['Key', '🔑', 'easy'],
      ['Candle', '🕯️', 'medium'],
      ['Phone', '📱', 'easy'],
      ['Computer', '💻', 'easy'],
      ['Trash Can', '🗑️', 'medium'],
      ['Vacuum Cleaner', '🧹', 'hard'],
      ['Plant', '🪴', 'easy'],
    ],
  },
  {
    id: 'school',
    name: 'School Items',
    icon: '✏️',
    color: '#FFEB00',
    accent: '#FFF9B8',
    description: 'Classroom supplies and school-day objects.',
    words: [
      ['Pencil', '✏️', 'easy'],
      ['Book', '📘', 'easy'],
      ['Notebook', '📓', 'easy'],
      ['Eraser', '🧽', 'easy'],
      ['Ruler', '📏', 'easy'],
      ['Backpack', '🎒', 'easy'],
      ['Desk', '🪑', 'easy'],
      ['Whiteboard', '⬜', 'medium'],
      ['Marker', '🖊️', 'easy'],
      ['Scissors', '✂️', 'medium'],
      ['Glue', '🧴', 'medium'],
      ['Calculator', '🧮', 'medium'],
      ['Bell', '🔔', 'easy'],
      ['Lunchbox', '🍱', 'medium'],
      ['Crayons', '🖍️', 'easy'],
      ['Paper Clip', '📎', 'medium'],
      ['Map', '🗺️', 'medium'],
      ['Trophy', '🏆', 'medium'],
      ['Microscope', '🔬', 'hard'],
      ['Globe', '🌐', 'medium'],
    ],
  },
];

function makePrompt(category, wordTuple, index) {
  const [word, image, difficulty] = wordTuple;
  return {
    id: `${category.id}-${String(index + 1).padStart(3, '0')}`,
    cardId: `${category.name.charAt(0).toUpperCase()}${String(index + 1).padStart(2, '0')}`,
    category: category.name,
    categoryId: category.id,
    word,
    image,
    difficulty,
  };
}

export const PICTIONARY_CATEGORIES = CATEGORY_SEEDS.map((category, index) => ({
  id: category.id,
  name: category.name,
  icon: category.icon,
  color: category.color,
  accent: category.accent,
  description: category.description,
  artX: `${(index % 5) * 25}%`,
  artY: `${Math.floor(index / 5) * 100}%`,
  promptCount: category.words.length,
}));

export const PICTIONARY_PROMPTS = CATEGORY_SEEDS.flatMap((category) =>
  category.words.map((wordTuple, index) => makePrompt(category, wordTuple, index))
);

// Custom (teacher-made) sets are fetched from Supabase and registered here so
// the rest of the game logic can stay synchronous.
const customCategories = new Map();
const customPrompts = new Map();

export function registerCustomPictionarySet(category, prompts) {
  if (!category?.id) return;
  customCategories.set(category.id, category);
  customPrompts.set(category.id, prompts || []);
}

export function unregisterCustomPictionarySet(categoryId) {
  customCategories.delete(categoryId);
  customPrompts.delete(categoryId);
}

export function getCachedCustomCategory(categoryId) {
  return customCategories.get(categoryId) || null;
}

export function getPictionaryCategory(categoryId) {
  return (
    PICTIONARY_CATEGORIES.find((category) => category.id === categoryId) ||
    customCategories.get(categoryId) ||
    undefined
  );
}

export function getPromptsByCategory(categoryId) {
  if (customPrompts.has(categoryId)) return customPrompts.get(categoryId);
  return PICTIONARY_PROMPTS.filter((prompt) => prompt.categoryId === categoryId);
}

export function getPromptById(promptId) {
  const builtIn = PICTIONARY_PROMPTS.find((prompt) => prompt.id === promptId);
  if (builtIn) return builtIn;

  for (const prompts of customPrompts.values()) {
    const found = prompts.find((prompt) => prompt.id === promptId);
    if (found) return found;
  }

  return undefined;
}
