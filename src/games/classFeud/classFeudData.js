/**
 * Class Feud — built-in survey boards.
 *
 * Topics were picked from the kinds of survey questions teachers actually run
 * in ESL and homeroom classes (home, school, food, animals, sports, travel,
 * weather, jobs, screens, music, tech, clothes, health, family, holidays,
 * space, transport, birthdays, heroes, and Korea/world culture).
 *
 * Board shape:
 * - id / title / subtitle / level: menu copy.
 * - emoji + color + accent: the generated cover art (no image files needed).
 * - rounds[]: one survey question each.
 *   - prompt: the question read out to the class.
 *   - image: optional picture URL or data URL (custom boards use this a lot).
 *   - answers[]: ordered best-first. `points` is the survey score and should
 *     add up to about 100 per round. `aliases` are extra spellings/synonyms
 *     that still count as the same answer when a team types or says them.
 */

// Menu cover art. Each board shows a still frame from a GIPHY clip and swaps
// to the animated loop while the card is hovered, so the menu stays light
// until someone actually looks at a card.
function cover(gifId, rendition = '200w.webp') {
  return {
    thumbnail: `https://media.giphy.com/media/${gifId}/480w_s.jpg`,
    thumbnailGif: `https://media.giphy.com/media/${gifId}/${rendition}`,
  };
}

export const FEUD_BOARDS = [
  {
    id: 'around-the-house',
    title: 'Around The House',
    subtitle: 'Rooms, furniture, chores, and the stuff every home has.',
    level: 'Easy ESL',
    emoji: '🏠',
    color: '#38BDF8',
    ...cover('KZeFGzrpU7DbErrTRD'),
    accent: '#0F172A',
    hashtags: ['home', 'vocabulary'],
    rounds: [
      {
        prompt: 'Name something you find in a kitchen.',
        answers: [
          { text: 'Fridge', points: 31, aliases: ['refrigerator', 'freezer'] },
          { text: 'Stove', points: 22, aliases: ['oven', 'cooker'] },
          { text: 'Sink', points: 17, aliases: ['tap', 'faucet'] },
          { text: 'Table', points: 13, aliases: ['kitchen table', 'dining table'] },
          { text: 'Microwave', points: 10, aliases: [] },
          { text: 'Spoon', points: 7, aliases: ['fork', 'chopsticks', 'cutlery'] },
        ],
      },
      {
        prompt: 'Name a room in a house.',
        answers: [
          { text: 'Bedroom', points: 34, aliases: ['my room'] },
          { text: 'Bathroom', points: 25, aliases: ['toilet', 'restroom'] },
          { text: 'Kitchen', points: 21, aliases: [] },
          { text: 'Living room', points: 14, aliases: ['lounge', 'family room'] },
          { text: 'Garage', points: 6, aliases: ['basement'] },
        ],
      },
      {
        prompt: 'Name something you sit or lie on at home.',
        answers: [
          { text: 'Sofa', points: 33, aliases: ['couch'] },
          { text: 'Bed', points: 30, aliases: ['mattress'] },
          { text: 'Chair', points: 24, aliases: ['stool'] },
          { text: 'The floor', points: 8, aliases: ['floor', 'carpet', 'rug'] },
          { text: 'Beanbag', points: 5, aliases: ['bean bag', 'cushion', 'pillow'] },
        ],
      },
      {
        prompt: 'Name something people always forget to turn off.',
        answers: [
          { text: 'The lights', points: 38, aliases: ['lights', 'light', 'lamp'] },
          { text: 'The TV', points: 22, aliases: ['tv', 'television'] },
          { text: 'The tap', points: 16, aliases: ['water', 'faucet', 'shower'] },
          { text: 'Air conditioner', points: 13, aliases: ['aircon', 'ac', 'fan', 'heater'] },
          { text: 'The stove', points: 11, aliases: ['oven', 'gas'] },
        ],
      },
      {
        prompt: 'Name something you keep in the bathroom.',
        answers: [
          { text: 'Toothbrush', points: 30, aliases: ['toothpaste'] },
          { text: 'Towel', points: 24, aliases: ['towels'] },
          { text: 'Soap', points: 20, aliases: ['hand soap', 'body wash'] },
          { text: 'Shampoo', points: 15, aliases: ['conditioner'] },
          { text: 'Mirror', points: 11, aliases: [] },
        ],
      },
      {
        prompt: 'Name a chore kids hate doing.',
        answers: [
          { text: 'Washing dishes', points: 29, aliases: ['dishes', 'wash the dishes', 'do the dishes'] },
          { text: 'Cleaning their room', points: 27, aliases: ['clean my room', 'tidy up', 'cleaning'] },
          { text: 'Taking out the trash', points: 18, aliases: ['trash', 'garbage', 'rubbish'] },
          { text: 'Laundry', points: 15, aliases: ['washing clothes', 'folding clothes'] },
          { text: 'Vacuuming', points: 11, aliases: ['sweeping', 'mopping', 'vacuum'] },
        ],
      },
    ],
  },
  {
    id: 'school-days',
    title: 'School Days',
    subtitle: 'Pencil cases, subjects, homework excuses, and break time.',
    level: 'Easy ESL',
    emoji: '🎒',
    color: '#FBBF24',
    ...cover('1g7yRP9ZBjKRG0qeg7', 'giphy.webp'),
    accent: '#111827',
    hashtags: ['school', 'vocabulary'],
    rounds: [
      {
        prompt: 'Name something in your pencil case.',
        answers: [
          { text: 'Pencil', points: 32, aliases: ['pencils'] },
          { text: 'Eraser', points: 25, aliases: ['rubber'] },
          { text: 'Ruler', points: 17, aliases: [] },
          { text: 'Pen', points: 15, aliases: ['pens', 'ballpoint'] },
          { text: 'Sharpener', points: 11, aliases: ['pencil sharpener'] },
        ],
      },
      {
        prompt: 'Name a school subject.',
        answers: [
          { text: 'Math', points: 30, aliases: ['maths', 'mathematics'] },
          { text: 'English', points: 26, aliases: [] },
          { text: 'Science', points: 18, aliases: ['biology', 'chemistry', 'physics'] },
          { text: 'PE', points: 15, aliases: ['gym', 'physical education', 'sports'] },
          { text: 'Art', points: 11, aliases: ['music', 'drawing'] },
        ],
      },
      {
        prompt: "Name a place at school that isn't a classroom.",
        answers: [
          { text: 'Cafeteria', points: 28, aliases: ['lunchroom', 'canteen'] },
          { text: 'Playground', points: 24, aliases: ['schoolyard', 'field'] },
          { text: 'Library', points: 20, aliases: [] },
          { text: 'Gym', points: 17, aliases: ['gymnasium', 'sports hall'] },
          { text: "Nurse's office", points: 11, aliases: ['nurse', 'infirmary', 'sick room'] },
        ],
      },
      {
        prompt: 'Name an excuse for not doing your homework.',
        answers: [
          { text: 'I forgot it', points: 35, aliases: ['i forgot', 'left it at home', 'forgot'] },
          { text: 'My dog ate it', points: 22, aliases: ['dog ate it', 'my pet ate it'] },
          { text: 'I was sick', points: 18, aliases: ['sick', 'i was ill'] },
          { text: 'I lost it', points: 14, aliases: ['lost it', 'i lost my book'] },
          { text: 'The wifi was down', points: 11, aliases: ['no wifi', 'no internet', 'computer broke'] },
        ],
      },
      {
        prompt: 'Name something a teacher says every single day.',
        answers: [
          { text: 'Sit down', points: 27, aliases: ['sit', 'take your seat'] },
          { text: 'Be quiet', points: 25, aliases: ['quiet', 'silence', 'shh', 'stop talking'] },
          { text: 'Open your books', points: 20, aliases: ['open your book', 'page number', 'turn to page'] },
          { text: 'Good job', points: 16, aliases: ['well done', 'nice work', 'good'] },
          { text: "Don't forget your homework", points: 12, aliases: ['homework', 'do your homework'] },
        ],
      },
      {
        prompt: 'Name a game kids play at break time.',
        answers: [
          { text: 'Tag', points: 30, aliases: ['chase', 'catch'] },
          { text: 'Soccer', points: 26, aliases: ['football', 'kickball'] },
          { text: 'Hide and seek', points: 18, aliases: ['hide n seek', 'hiding'] },
          { text: 'Jump rope', points: 14, aliases: ['skipping', 'skipping rope'] },
          { text: 'Rock paper scissors', points: 12, aliases: ['rps', 'kai bai bo'] },
        ],
      },
    ],
  },
  {
    id: 'food-fight',
    title: 'Food Fight',
    subtitle: 'Pizza toppings, breakfast, and the food kids push around the plate.',
    level: 'Easy ESL',
    emoji: '🍕',
    color: '#F97316',
    ...cover('a9ztVUf2PEdxu9KZwR'),
    accent: '#111827',
    hashtags: ['food', 'vocabulary'],
    rounds: [
      {
        prompt: 'Name a pizza topping.',
        answers: [
          { text: 'Cheese', points: 33, aliases: ['mozzarella', 'extra cheese'] },
          { text: 'Pepperoni', points: 25, aliases: ['salami', 'sausage'] },
          { text: 'Mushroom', points: 15, aliases: ['mushrooms'] },
          { text: 'Pineapple', points: 14, aliases: [] },
          { text: 'Olives', points: 13, aliases: ['olive', 'onion', 'peppers'] },
        ],
      },
      {
        prompt: 'Name a food kids refuse to eat.',
        answers: [
          { text: 'Broccoli', points: 30, aliases: [] },
          { text: 'Carrots', points: 20, aliases: ['carrot'] },
          { text: 'Onions', points: 19, aliases: ['onion'] },
          { text: 'Spinach', points: 17, aliases: ['greens', 'vegetables'] },
          { text: 'Tomatoes', points: 14, aliases: ['tomato'] },
        ],
      },
      {
        prompt: 'Name a breakfast food.',
        answers: [
          { text: 'Eggs', points: 30, aliases: ['egg', 'fried egg', 'scrambled eggs'] },
          { text: 'Toast', points: 24, aliases: ['bread'] },
          { text: 'Cereal', points: 20, aliases: ['cornflakes'] },
          { text: 'Rice', points: 15, aliases: ['rice and soup'] },
          { text: 'Pancakes', points: 11, aliases: ['pancake', 'waffles'] },
        ],
      },
      {
        prompt: 'Name something you eat with your hands.',
        answers: [
          { text: 'Burger', points: 28, aliases: ['hamburger', 'cheeseburger'] },
          { text: 'Pizza', points: 24, aliases: [] },
          { text: 'Chicken', points: 20, aliases: ['fried chicken', 'chicken wings', 'wings'] },
          { text: 'Fries', points: 18, aliases: ['french fries', 'chips'] },
          { text: 'Sandwich', points: 10, aliases: ['toast', 'sandwiches'] },
        ],
      },
      {
        prompt: 'Name a yellow food.',
        answers: [
          { text: 'Banana', points: 34, aliases: ['bananas'] },
          { text: 'Corn', points: 24, aliases: ['sweetcorn'] },
          { text: 'Cheese', points: 18, aliases: [] },
          { text: 'Lemon', points: 15, aliases: ['lemons'] },
          { text: 'Egg yolk', points: 9, aliases: ['yolk', 'egg'] },
        ],
      },
      {
        prompt: 'Name a drink people order at a cafe.',
        answers: [
          { text: 'Coffee', points: 33, aliases: ['americano', 'espresso'] },
          { text: 'Latte', points: 22, aliases: ['cafe latte', 'cappuccino'] },
          { text: 'Hot chocolate', points: 17, aliases: ['cocoa', 'chocolate milk'] },
          { text: 'Tea', points: 16, aliases: ['green tea', 'milk tea'] },
          { text: 'Smoothie', points: 12, aliases: ['juice', 'shake', 'milkshake'] },
        ],
      },
    ],
  },
  {
    id: 'animal-planet',
    title: 'Animal Planet',
    subtitle: 'Zoo animals, pets, ocean life, and the slowest creatures alive.',
    level: 'Easy ESL',
    emoji: '🦁',
    color: '#22C55E',
    ...cover('xT9IgxKsLc9nFM7n32'),
    accent: '#0F172A',
    hashtags: ['animals', 'vocabulary'],
    rounds: [
      {
        prompt: "Name an animal you'd see at the zoo.",
        answers: [
          { text: 'Lion', points: 30, aliases: ['lions'] },
          { text: 'Elephant', points: 25, aliases: ['elephants'] },
          { text: 'Monkey', points: 20, aliases: ['monkeys', 'gorilla', 'chimpanzee'] },
          { text: 'Giraffe', points: 15, aliases: ['giraffes'] },
          { text: 'Tiger', points: 10, aliases: ['tigers'] },
        ],
      },
      {
        prompt: 'Name a pet people keep at home.',
        answers: [
          { text: 'Dog', points: 40, aliases: ['dogs', 'puppy'] },
          { text: 'Cat', points: 32, aliases: ['cats', 'kitten'] },
          { text: 'Fish', points: 12, aliases: ['goldfish'] },
          { text: 'Hamster', points: 9, aliases: ['guinea pig', 'rabbit', 'bunny'] },
          { text: 'Bird', points: 7, aliases: ['parrot', 'budgie'] },
        ],
      },
      {
        prompt: 'Name an animal that can fly.',
        answers: [
          { text: 'Bird', points: 32, aliases: ['birds', 'pigeon', 'sparrow'] },
          { text: 'Bat', points: 24, aliases: ['bats'] },
          { text: 'Butterfly', points: 18, aliases: ['butterflies', 'moth'] },
          { text: 'Bee', points: 15, aliases: ['bees', 'wasp'] },
          { text: 'Eagle', points: 11, aliases: ['hawk', 'owl'] },
        ],
      },
      {
        prompt: 'Name an animal that lives in the ocean.',
        answers: [
          { text: 'Fish', points: 27, aliases: ['fishes'] },
          { text: 'Shark', points: 24, aliases: ['sharks'] },
          { text: 'Whale', points: 20, aliases: ['whales'] },
          { text: 'Dolphin', points: 17, aliases: ['dolphins'] },
          { text: 'Octopus', points: 12, aliases: ['squid', 'jellyfish'] },
        ],
      },
      {
        prompt: 'Name an animal that is really, really slow.',
        answers: [
          { text: 'Snail', points: 32, aliases: ['slug', 'snails'] },
          { text: 'Turtle', points: 30, aliases: ['tortoise', 'turtles'] },
          { text: 'Sloth', points: 24, aliases: ['sloths'] },
          { text: 'Koala', points: 8, aliases: [] },
          { text: 'Panda', points: 6, aliases: [] },
        ],
      },
      {
        prompt: 'Name an animal with stripes or spots.',
        answers: [
          { text: 'Zebra', points: 31, aliases: ['zebras'] },
          { text: 'Tiger', points: 26, aliases: ['tigers'] },
          { text: 'Leopard', points: 19, aliases: ['cheetah', 'jaguar'] },
          { text: 'Giraffe', points: 14, aliases: [] },
          { text: 'Ladybug', points: 10, aliases: ['ladybird', 'dalmatian'] },
        ],
      },
    ],
  },
  {
    id: 'sports-day',
    title: 'Sports Day',
    subtitle: 'Ball games, warm-ups, Olympic events, and what winners take home.',
    level: 'Easy-Medium ESL',
    emoji: '⚽',
    color: '#0EA5E9',
    ...cover('FlTz8GGCnhrl3FHaQQ'),
    accent: '#0F172A',
    hashtags: ['sports', 'vocabulary'],
    rounds: [
      {
        prompt: 'Name a sport you play with a ball.',
        answers: [
          { text: 'Soccer', points: 33, aliases: ['football'] },
          { text: 'Basketball', points: 26, aliases: [] },
          { text: 'Baseball', points: 17, aliases: [] },
          { text: 'Volleyball', points: 14, aliases: [] },
          { text: 'Tennis', points: 10, aliases: ['table tennis', 'ping pong'] },
        ],
      },
      {
        prompt: 'Name something an athlete wears.',
        answers: [
          { text: 'Sneakers', points: 30, aliases: ['running shoes', 'trainers', 'cleats'] },
          { text: 'Jersey', points: 24, aliases: ['uniform', 'shirt', 'team shirt'] },
          { text: 'Shorts', points: 18, aliases: [] },
          { text: 'Helmet', points: 15, aliases: [] },
          { text: 'Cap', points: 13, aliases: ['hat', 'headband'] },
        ],
      },
      {
        prompt: 'Name an Olympic sport.',
        answers: [
          { text: 'Swimming', points: 28, aliases: ['swim'] },
          { text: 'Running', points: 25, aliases: ['track', 'sprint', 'marathon', 'athletics'] },
          { text: 'Gymnastics', points: 19, aliases: ['gymnastic'] },
          { text: 'Skating', points: 16, aliases: ['figure skating', 'ice skating', 'speed skating'] },
          { text: 'Weightlifting', points: 12, aliases: ['lifting', 'archery', 'judo'] },
        ],
      },
      {
        prompt: 'Name something you do to warm up.',
        answers: [
          { text: 'Stretch', points: 33, aliases: ['stretching', 'stretches'] },
          { text: 'Jog', points: 26, aliases: ['jogging', 'run', 'running'] },
          { text: 'Jumping jacks', points: 18, aliases: ['jumping', 'star jumps'] },
          { text: 'Push-ups', points: 13, aliases: ['pushups', 'push ups', 'sit-ups'] },
          { text: 'Run laps', points: 10, aliases: ['laps', 'lap of the field'] },
        ],
      },
      {
        prompt: "Name a sport that doesn't use a ball.",
        answers: [
          { text: 'Swimming', points: 30, aliases: ['swim'] },
          { text: 'Running', points: 24, aliases: ['track', 'marathon'] },
          { text: 'Boxing', points: 18, aliases: ['taekwondo', 'judo', 'wrestling'] },
          { text: 'Skiing', points: 15, aliases: ['snowboarding', 'skating'] },
          { text: 'Cycling', points: 13, aliases: ['biking', 'bike racing'] },
        ],
      },
      {
        prompt: 'Name something you win in a competition.',
        answers: [
          { text: 'A medal', points: 34, aliases: ['medal', 'gold medal', 'medals'] },
          { text: 'A trophy', points: 28, aliases: ['trophy', 'cup'] },
          { text: 'Prize money', points: 16, aliases: ['money', 'cash', 'prize'] },
          { text: 'A certificate', points: 12, aliases: ['certificate', 'diploma'] },
          { text: 'A ribbon', points: 10, aliases: ['ribbon', 'badge'] },
        ],
      },
    ],
  },
  {
    id: 'travel-time',
    title: 'Travel Time',
    subtitle: 'Packing, airports, holiday spots, and everything tourists photograph.',
    level: 'Medium ESL',
    emoji: '✈️',
    color: '#6366F1',
    ...cover('W307DdkjIsRHVWvoFE', 'giphy.webp'),
    accent: '#FFFFFF',
    hashtags: ['travel', 'vocabulary'],
    rounds: [
      {
        prompt: 'Name something you pack in a suitcase.',
        answers: [
          { text: 'Clothes', points: 36, aliases: ['shirts', 'clothing', 'underwear'] },
          { text: 'Toothbrush', points: 20, aliases: ['toothpaste', 'toiletries'] },
          { text: 'Phone charger', points: 17, aliases: ['charger', 'cable'] },
          { text: 'Shoes', points: 15, aliases: ['sneakers', 'sandals'] },
          { text: 'Passport', points: 12, aliases: ['ticket', 'documents'] },
        ],
      },
      {
        prompt: 'Name a place people go on vacation.',
        answers: [
          { text: 'The beach', points: 32, aliases: ['beach', 'seaside', 'ocean'] },
          { text: 'The mountains', points: 20, aliases: ['mountain', 'mountains'] },
          { text: 'A theme park', points: 18, aliases: ['theme park', 'amusement park', 'disneyland'] },
          { text: 'Another country', points: 16, aliases: ['abroad', 'overseas', 'a foreign country'] },
          { text: "Grandma's house", points: 14, aliases: ['grandparents', 'hometown', 'family'] },
        ],
      },
      {
        prompt: 'Name something you do on an airplane.',
        answers: [
          { text: 'Sleep', points: 30, aliases: ['nap', 'sleeping'] },
          { text: 'Watch a movie', points: 25, aliases: ['movies', 'watch tv', 'watch a film'] },
          { text: 'Eat', points: 19, aliases: ['eat food', 'airplane food', 'snacks'] },
          { text: 'Read', points: 14, aliases: ['read a book', 'reading'] },
          { text: 'Listen to music', points: 12, aliases: ['music', 'headphones'] },
        ],
      },
      {
        prompt: 'Name something tourists always take a photo of.',
        answers: [
          { text: 'A famous building', points: 30, aliases: ['landmark', 'monument', 'tower', 'castle'] },
          { text: 'Food', points: 22, aliases: ['their meal', 'the food'] },
          { text: 'Themselves', points: 20, aliases: ['selfie', 'selfies'] },
          { text: 'The sunset', points: 16, aliases: ['sunset', 'sunrise', 'the view'] },
          { text: 'Animals', points: 12, aliases: ['pets', 'birds', 'dogs'] },
        ],
      },
      {
        prompt: "Name a way to travel that isn't a car.",
        answers: [
          { text: 'Airplane', points: 30, aliases: ['plane', 'flight', 'fly'] },
          { text: 'Train', points: 25, aliases: ['subway', 'ktx', 'metro'] },
          { text: 'Bus', points: 20, aliases: ['coach'] },
          { text: 'Bike', points: 14, aliases: ['bicycle', 'cycling'] },
          { text: 'Boat', points: 11, aliases: ['ship', 'ferry'] },
        ],
      },
      {
        prompt: 'Name something people lose while traveling.',
        answers: [
          { text: 'Their phone', points: 27, aliases: ['phone', 'mobile'] },
          { text: 'Their luggage', points: 24, aliases: ['luggage', 'suitcase', 'bag'] },
          { text: 'Their wallet', points: 20, aliases: ['wallet', 'money', 'purse'] },
          { text: 'Their ticket', points: 17, aliases: ['ticket', 'passport', 'boarding pass'] },
          { text: 'Their keys', points: 12, aliases: ['keys', 'hotel key'] },
        ],
      },
    ],
  },
  {
    id: 'weather-and-seasons',
    title: 'Weather & Seasons',
    subtitle: 'Rainy days, winter gear, and what everyone loves about summer.',
    level: 'Easy ESL',
    emoji: '🌦️',
    color: '#60A5FA',
    ...cover('ZOTH39U1aT8K9VCoao'),
    accent: '#0F172A',
    hashtags: ['weather', 'seasons'],
    rounds: [
      {
        prompt: 'Name a type of weather.',
        answers: [
          { text: 'Rainy', points: 30, aliases: ['rain', 'raining'] },
          { text: 'Sunny', points: 27, aliases: ['sun', 'hot'] },
          { text: 'Snowy', points: 18, aliases: ['snow', 'snowing'] },
          { text: 'Windy', points: 14, aliases: ['wind'] },
          { text: 'Cloudy', points: 11, aliases: ['clouds', 'foggy'] },
        ],
      },
      {
        prompt: 'Name something you do on a rainy day.',
        answers: [
          { text: 'Stay inside', points: 30, aliases: ['stay home', 'stay at home', 'stay indoors'] },
          { text: 'Watch TV', points: 24, aliases: ['tv', 'watch movies', 'netflix'] },
          { text: 'Read a book', points: 18, aliases: ['read', 'reading'] },
          { text: 'Play games', points: 16, aliases: ['video games', 'board games', 'play'] },
          { text: 'Jump in puddles', points: 12, aliases: ['puddles', 'splash'] },
        ],
      },
      {
        prompt: 'Name something you need in winter.',
        answers: [
          { text: 'A coat', points: 30, aliases: ['coat', 'jacket', 'padding'] },
          { text: 'Gloves', points: 22, aliases: ['mittens', 'glove'] },
          { text: 'A scarf', points: 19, aliases: ['scarf', 'muffler'] },
          { text: 'A hat', points: 16, aliases: ['hat', 'beanie'] },
          { text: 'Boots', points: 13, aliases: ['snow boots', 'warm shoes'] },
        ],
      },
      {
        prompt: 'Name something you see in the sky.',
        answers: [
          { text: 'The sun', points: 30, aliases: ['sun'] },
          { text: 'Clouds', points: 25, aliases: ['cloud'] },
          { text: 'The moon', points: 19, aliases: ['moon'] },
          { text: 'Stars', points: 15, aliases: ['star'] },
          { text: 'A rainbow', points: 11, aliases: ['rainbow', 'plane', 'birds'] },
        ],
      },
      {
        prompt: 'Name the best thing about summer.',
        answers: [
          { text: 'Vacation', points: 30, aliases: ['holiday', 'holidays', 'travel'] },
          { text: 'Swimming', points: 26, aliases: ['the pool', 'the beach', 'swim'] },
          { text: 'No school', points: 20, aliases: ['school is out', 'no classes'] },
          { text: 'Ice cream', points: 14, aliases: ['cold drinks', 'popsicles'] },
          { text: 'Long days', points: 10, aliases: ['sunshine', 'warm nights'] },
        ],
      },
      {
        prompt: 'Name something that happens in spring.',
        answers: [
          { text: 'Flowers bloom', points: 33, aliases: ['flowers', 'blossoms', 'cherry blossoms'] },
          { text: 'It rains a lot', points: 22, aliases: ['rain', 'showers'] },
          { text: 'Trees get leaves', points: 18, aliases: ['leaves', 'green trees'] },
          { text: 'A new school year', points: 15, aliases: ['new school year', 'school starts'] },
          { text: 'Birds come back', points: 12, aliases: ['birds', 'animals wake up'] },
        ],
      },
    ],
  },
  {
    id: 'when-i-grow-up',
    title: 'When I Grow Up',
    subtitle: 'Dream jobs, uniforms, and what it takes to get hired.',
    level: 'Medium ESL',
    emoji: '👩‍🚀',
    color: '#A855F7',
    ...cover('b8bEOkbHLv2ftJxsTV'),
    accent: '#FFFFFF',
    hashtags: ['jobs', 'vocabulary'],
    rounds: [
      {
        prompt: 'Name a job kids say they want when they grow up.',
        answers: [
          { text: 'Doctor', points: 28, aliases: ['surgeon'] },
          { text: 'Teacher', points: 22, aliases: [] },
          { text: 'YouTuber', points: 20, aliases: ['youtube', 'streamer', 'influencer', 'content creator'] },
          { text: 'Athlete', points: 16, aliases: ['soccer player', 'football player', 'sports player'] },
          { text: 'Astronaut', points: 14, aliases: ['space explorer'] },
        ],
      },
      {
        prompt: 'Name a job where you wear a uniform.',
        answers: [
          { text: 'Police officer', points: 30, aliases: ['police', 'policeman', 'cop'] },
          { text: 'Firefighter', points: 24, aliases: ['fireman', 'fire fighter'] },
          { text: 'Nurse', points: 20, aliases: ['doctor'] },
          { text: 'Chef', points: 15, aliases: ['cook'] },
          { text: 'Pilot', points: 11, aliases: ['flight attendant'] },
        ],
      },
      {
        prompt: 'Name something a doctor uses.',
        answers: [
          { text: 'Stethoscope', points: 32, aliases: [] },
          { text: 'A needle', points: 24, aliases: ['needle', 'syringe', 'injection', 'shot'] },
          { text: 'Thermometer', points: 18, aliases: [] },
          { text: 'Gloves', points: 14, aliases: ['rubber gloves'] },
          { text: 'A mask', points: 12, aliases: ['mask', 'face mask'] },
        ],
      },
      {
        prompt: 'Name a job that helps people.',
        answers: [
          { text: 'Doctor', points: 30, aliases: [] },
          { text: 'Teacher', points: 25, aliases: [] },
          { text: 'Firefighter', points: 20, aliases: ['fireman'] },
          { text: 'Police officer', points: 15, aliases: ['police'] },
          { text: 'Nurse', points: 10, aliases: ['vet', 'social worker'] },
        ],
      },
      {
        prompt: 'Name a job you can do from home.',
        answers: [
          { text: 'Programmer', points: 28, aliases: ['coder', 'developer', 'software engineer'] },
          { text: 'YouTuber', points: 24, aliases: ['streamer', 'influencer'] },
          { text: 'Writer', points: 20, aliases: ['author', 'blogger'] },
          { text: 'Online teacher', points: 16, aliases: ['teacher', 'tutor'] },
          { text: 'Designer', points: 12, aliases: ['artist', 'illustrator'] },
        ],
      },
      {
        prompt: 'Name something you need to get a job.',
        answers: [
          { text: 'An interview', points: 30, aliases: ['interview'] },
          { text: 'A resume', points: 26, aliases: ['resume', 'cv'] },
          { text: 'Good grades', points: 18, aliases: ['a degree', 'education', 'diploma'] },
          { text: 'Experience', points: 15, aliases: ['skills'] },
          { text: 'Nice clothes', points: 11, aliases: ['a suit', 'good clothes'] },
        ],
      },
    ],
  },
  {
    id: 'movies-and-tv',
    title: 'Movies & TV',
    subtitle: 'Popcorn, genres, superhero clichés, and sofa habits.',
    level: 'Medium ESL',
    emoji: '🍿',
    color: '#EF4444',
    ...cover('l1J9Dk6zwXyi7pVba'),
    accent: '#FFFFFF',
    hashtags: ['movies', 'entertainment'],
    rounds: [
      {
        prompt: 'Name something you eat at the movies.',
        answers: [
          { text: 'Popcorn', points: 45, aliases: [] },
          { text: 'Soda', points: 22, aliases: ['coke', 'cola', 'a drink'] },
          { text: 'Candy', points: 15, aliases: ['sweets', 'chocolate'] },
          { text: 'Nachos', points: 10, aliases: ['chips', 'crisps'] },
          { text: 'Ice cream', points: 8, aliases: [] },
        ],
      },
      {
        prompt: 'Name a type of movie.',
        answers: [
          { text: 'Action', points: 28, aliases: ['action movie'] },
          { text: 'Comedy', points: 25, aliases: ['funny movie'] },
          { text: 'Horror', points: 20, aliases: ['scary movie'] },
          { text: 'Cartoon', points: 15, aliases: ['animation', 'animated'] },
          { text: 'Romance', points: 12, aliases: ['romantic', 'love story'] },
        ],
      },
      {
        prompt: 'Name something every superhero movie has.',
        answers: [
          { text: 'A villain', points: 32, aliases: ['villain', 'bad guy', 'enemy'] },
          { text: 'A costume', points: 24, aliases: ['costume', 'suit', 'cape'] },
          { text: 'An explosion', points: 18, aliases: ['explosions', 'fighting'] },
          { text: 'A city getting destroyed', points: 15, aliases: ['destroyed city', 'broken buildings'] },
          { text: 'A rescue', points: 11, aliases: ['saving someone', 'the hero saves the day'] },
        ],
      },
      {
        prompt: 'Name a place people watch movies.',
        answers: [
          { text: 'At home', points: 34, aliases: ['home', 'living room', 'on the sofa'] },
          { text: 'The cinema', points: 30, aliases: ['cinema', 'movie theater', 'theatre'] },
          { text: 'On their phone', points: 18, aliases: ['phone', 'mobile'] },
          { text: 'On a plane', points: 10, aliases: ['plane', 'airplane'] },
          { text: 'At school', points: 8, aliases: ['school', 'in class'] },
        ],
      },
      {
        prompt: 'Name something people do while watching TV.',
        answers: [
          { text: 'Eat snacks', points: 30, aliases: ['snacks', 'eat', 'eating'] },
          { text: 'Lie on the sofa', points: 25, aliases: ['lie down', 'sit on the couch', 'relax'] },
          { text: 'Use their phone', points: 20, aliases: ['phone', 'scroll', 'text'] },
          { text: 'Talk', points: 14, aliases: ['chat', 'talking'] },
          { text: 'Fall asleep', points: 11, aliases: ['sleep', 'nap'] },
        ],
      },
      {
        prompt: 'Name a famous cartoon character.',
        answers: [
          { text: 'Mickey Mouse', points: 28, aliases: ['mickey'] },
          { text: 'SpongeBob', points: 24, aliases: ['sponge bob'] },
          { text: 'Pikachu', points: 20, aliases: ['pokemon'] },
          { text: 'Doraemon', points: 16, aliases: [] },
          { text: 'Bugs Bunny', points: 12, aliases: ['tom and jerry', 'looney tunes'] },
        ],
      },
    ],
  },
  {
    id: 'music-and-dance',
    title: 'Music & Dance',
    subtitle: 'Instruments, genres, and moves everyone has tried at least once.',
    level: 'Medium ESL',
    emoji: '🎵',
    color: '#EC4899',
    ...cover('G5RBedfINS79J9akEY'),
    accent: '#FFFFFF',
    hashtags: ['music', 'entertainment'],
    rounds: [
      {
        prompt: 'Name a musical instrument.',
        answers: [
          { text: 'Piano', points: 30, aliases: ['keyboard'] },
          { text: 'Guitar', points: 27, aliases: ['electric guitar'] },
          { text: 'Drums', points: 20, aliases: ['drum'] },
          { text: 'Violin', points: 13, aliases: ['cello'] },
          { text: 'Flute', points: 10, aliases: ['recorder', 'trumpet'] },
        ],
      },
      {
        prompt: 'Name a place you hear music.',
        answers: [
          { text: 'A concert', points: 28, aliases: ['concert', 'festival'] },
          { text: 'In the car', points: 24, aliases: ['car', 'the radio'] },
          { text: 'In a shop', points: 18, aliases: ['shop', 'store', 'cafe', 'mall'] },
          { text: 'On your phone', points: 16, aliases: ['phone', 'headphones', 'earbuds'] },
          { text: 'At a party', points: 14, aliases: ['party', 'club'] },
        ],
      },
      {
        prompt: 'Name something people do while listening to music.',
        answers: [
          { text: 'Dance', points: 30, aliases: ['dancing'] },
          { text: 'Sing', points: 26, aliases: ['sing along', 'singing'] },
          { text: 'Clean', points: 16, aliases: ['cleaning', 'chores'] },
          { text: 'Study', points: 15, aliases: ['do homework', 'work'] },
          { text: 'Exercise', points: 13, aliases: ['run', 'workout', 'gym'] },
        ],
      },
      {
        prompt: 'Name a style of music.',
        answers: [
          { text: 'Pop', points: 32, aliases: ['pop music'] },
          { text: 'K-pop', points: 24, aliases: ['kpop', 'k pop'] },
          { text: 'Hip hop', points: 18, aliases: ['rap', 'hiphop'] },
          { text: 'Rock', points: 15, aliases: ['metal'] },
          { text: 'Classical', points: 11, aliases: ['jazz', 'classic music'] },
        ],
      },
      {
        prompt: 'Name something a singer needs.',
        answers: [
          { text: 'A microphone', points: 34, aliases: ['microphone', 'mic'] },
          { text: 'A good voice', points: 26, aliases: ['voice', 'talent'] },
          { text: 'A stage', points: 16, aliases: ['stage', 'concert hall'] },
          { text: 'Fans', points: 13, aliases: ['an audience', 'listeners'] },
          { text: 'A band', points: 11, aliases: ['band', 'music', 'backup dancers'] },
        ],
      },
      {
        prompt: 'Name a dance move everyone knows.',
        answers: [
          { text: 'The floss', points: 26, aliases: ['floss', 'flossing'] },
          { text: 'The moonwalk', points: 22, aliases: ['moonwalk'] },
          { text: 'The worm', points: 18, aliases: ['worm'] },
          { text: 'The Macarena', points: 18, aliases: ['macarena'] },
          { text: 'The robot', points: 16, aliases: ['robot dance', 'robot'] },
        ],
      },
    ],
  },
  {
    id: 'phones-and-tech',
    title: 'Phones & Tech',
    subtitle: 'Apps, dead batteries, broken wifi, and helpful robots.',
    level: 'Medium ESL',
    emoji: '📱',
    color: '#14B8A6',
    ...cover('AX2bP2bq4fT5iowBMS'),
    accent: '#0F172A',
    hashtags: ['technology', 'daily-life'],
    rounds: [
      {
        prompt: 'Name something you do on your phone every day.',
        answers: [
          { text: 'Text', points: 28, aliases: ['message', 'messages', 'chat', 'kakaotalk'] },
          { text: 'Watch videos', points: 24, aliases: ['youtube', 'videos', 'tiktok'] },
          { text: 'Take photos', points: 18, aliases: ['photos', 'pictures', 'selfies'] },
          { text: 'Play games', points: 16, aliases: ['games', 'gaming'] },
          { text: 'Check the time', points: 14, aliases: ['the time', 'clock', 'alarm'] },
        ],
      },
      {
        prompt: 'Name an app on almost every phone.',
        answers: [
          { text: 'YouTube', points: 30, aliases: ['you tube'] },
          { text: 'Instagram', points: 22, aliases: ['insta', 'tiktok'] },
          { text: 'Camera', points: 18, aliases: ['photos', 'gallery'] },
          { text: 'Maps', points: 16, aliases: ['google maps', 'naver map', 'navigation'] },
          { text: 'Calculator', points: 14, aliases: ['calendar', 'clock', 'notes'] },
        ],
      },
      {
        prompt: 'Name something that always runs out of battery.',
        answers: [
          { text: 'Your phone', points: 40, aliases: ['phone', 'mobile', 'smartphone'] },
          { text: 'Earbuds', points: 20, aliases: ['airpods', 'headphones', 'earphones'] },
          { text: 'Laptop', points: 17, aliases: ['computer', 'tablet', 'ipad'] },
          { text: 'TV remote', points: 13, aliases: ['remote', 'remote control'] },
          { text: 'Game controller', points: 10, aliases: ['controller', 'joystick'] },
        ],
      },
      {
        prompt: 'Name something people use instead of a computer.',
        answers: [
          { text: 'Phone', points: 38, aliases: ['smartphone', 'mobile'] },
          { text: 'Tablet', points: 26, aliases: ['ipad'] },
          { text: 'Game console', points: 15, aliases: ['playstation', 'xbox', 'nintendo', 'switch'] },
          { text: 'Smart TV', points: 12, aliases: ['tv', 'television'] },
          { text: 'Notebook and pen', points: 9, aliases: ['paper', 'notebook', 'pen and paper'] },
        ],
      },
      {
        prompt: 'Name a reason the wifi stops working.',
        answers: [
          { text: 'Too many people using it', points: 27, aliases: ['too many users', 'too many devices'] },
          { text: 'Bad weather', points: 22, aliases: ['storm', 'rain'] },
          { text: 'The router is broken', points: 20, aliases: ['router', 'modem', 'restart the router'] },
          { text: 'Nobody paid the bill', points: 17, aliases: ['bill', 'no money', 'didnt pay'] },
          { text: "You're too far away", points: 14, aliases: ['too far', 'weak signal', 'bad signal'] },
        ],
      },
      {
        prompt: 'Name something a robot could do better than you.',
        answers: [
          { text: 'Math', points: 30, aliases: ['maths', 'calculating'] },
          { text: 'Cleaning', points: 24, aliases: ['clean', 'chores', 'vacuuming'] },
          { text: 'Remembering things', points: 20, aliases: ['memory', 'remember'] },
          { text: 'Driving', points: 14, aliases: ['drive a car'] },
          { text: 'Working all night', points: 12, aliases: ['never sleeping', 'work without rest'] },
        ],
      },
    ],
  },
  {
    id: 'clothes-and-style',
    title: 'Clothes & Style',
    subtitle: 'Feet, rain gear, looking cool, and what lives in your bag.',
    level: 'Easy ESL',
    emoji: '👕',
    color: '#F472B6',
    ...cover('XPuYaLdIlY6QKlWPSz'),
    accent: '#0F172A',
    hashtags: ['clothes', 'vocabulary'],
    rounds: [
      {
        prompt: 'Name something you wear on your feet.',
        answers: [
          { text: 'Shoes', points: 34, aliases: ['sneakers', 'trainers'] },
          { text: 'Socks', points: 28, aliases: ['sock'] },
          { text: 'Sandals', points: 16, aliases: ['flip flops'] },
          { text: 'Boots', points: 13, aliases: ['boot'] },
          { text: 'Slippers', points: 9, aliases: ['house shoes'] },
        ],
      },
      {
        prompt: 'Name something you wear in the rain.',
        answers: [
          { text: 'Raincoat', points: 32, aliases: ['rain jacket', 'poncho'] },
          { text: 'Rain boots', points: 26, aliases: ['boots', 'wellies', 'rubber boots'] },
          { text: 'A hood', points: 18, aliases: ['hoodie', 'hood'] },
          { text: 'A jacket', points: 13, aliases: ['jacket', 'coat'] },
          { text: 'Nothing special', points: 11, aliases: ['nothing', 'normal clothes'] },
        ],
      },
      {
        prompt: 'Name something people wear to look cool.',
        answers: [
          { text: 'Sunglasses', points: 30, aliases: ['shades', 'sun glasses'] },
          { text: 'Sneakers', points: 24, aliases: ['nice shoes', 'trainers'] },
          { text: 'A cap', points: 20, aliases: ['cap', 'hat', 'baseball cap'] },
          { text: 'A leather jacket', points: 15, aliases: ['jacket', 'leather jacket'] },
          { text: 'A watch', points: 11, aliases: ['watch', 'jewelry', 'necklace'] },
        ],
      },
      {
        prompt: 'Name a colour of clothes almost everyone owns.',
        answers: [
          { text: 'Black', points: 32, aliases: [] },
          { text: 'White', points: 28, aliases: [] },
          { text: 'Blue', points: 18, aliases: ['navy', 'denim'] },
          { text: 'Grey', points: 12, aliases: ['gray'] },
          { text: 'Red', points: 10, aliases: [] },
        ],
      },
      {
        prompt: 'Name something you would never wear to school.',
        answers: [
          { text: 'Pajamas', points: 33, aliases: ['pyjamas', 'pjs'] },
          { text: 'A swimsuit', points: 24, aliases: ['swimsuit', 'bikini', 'swimming trunks'] },
          { text: 'A costume', points: 18, aliases: ['costume', 'halloween costume'] },
          { text: 'High heels', points: 14, aliases: ['heels'] },
          { text: 'A wedding dress', points: 11, aliases: ['a suit', 'formal clothes'] },
        ],
      },
      {
        prompt: 'Name something in your bag every day.',
        answers: [
          { text: 'Phone', points: 30, aliases: ['mobile', 'smartphone'] },
          { text: 'Wallet', points: 22, aliases: ['money', 'card', 'purse'] },
          { text: 'Water bottle', points: 18, aliases: ['water', 'bottle', 'tumbler'] },
          { text: 'Keys', points: 16, aliases: ['key'] },
          { text: 'Snacks', points: 14, aliases: ['snack', 'candy', 'gum'] },
        ],
      },
    ],
  },
  {
    id: 'body-and-health',
    title: 'Body & Health',
    subtitle: 'Faces, staying healthy, sick days, and things people overdo.',
    level: 'Easy-Medium ESL',
    emoji: '💪',
    color: '#10B981',
    ...cover('xUPGcuomRFMUcsB9nO'),
    accent: '#0F172A',
    hashtags: ['health', 'body'],
    rounds: [
      {
        prompt: 'Name a part of your face.',
        answers: [
          { text: 'Eyes', points: 30, aliases: ['eye'] },
          { text: 'Nose', points: 26, aliases: [] },
          { text: 'Mouth', points: 20, aliases: ['lips'] },
          { text: 'Ears', points: 14, aliases: ['ear'] },
          { text: 'Eyebrows', points: 10, aliases: ['eyebrow', 'cheeks', 'chin', 'forehead'] },
        ],
      },
      {
        prompt: 'Name something you do to stay healthy.',
        answers: [
          { text: 'Exercise', points: 32, aliases: ['work out', 'play sports', 'run'] },
          { text: 'Eat vegetables', points: 25, aliases: ['eat healthy', 'vegetables', 'fruit'] },
          { text: 'Sleep well', points: 20, aliases: ['sleep', 'get enough sleep', 'rest'] },
          { text: 'Drink water', points: 14, aliases: ['water'] },
          { text: 'Wash your hands', points: 9, aliases: ['wash hands', 'stay clean'] },
        ],
      },
      {
        prompt: 'Name a reason people go to the doctor.',
        answers: [
          { text: 'A fever', points: 28, aliases: ['fever', 'temperature', 'flu'] },
          { text: 'A cough', points: 24, aliases: ['cough', 'cold', 'sore throat'] },
          { text: 'A stomach ache', points: 20, aliases: ['stomachache', 'stomach pain', 'tummy ache'] },
          { text: 'A broken bone', points: 16, aliases: ['broken arm', 'broken leg', 'injury'] },
          { text: 'A check-up', points: 12, aliases: ['checkup', 'health check', 'vaccine'] },
        ],
      },
      {
        prompt: "Name something that hurts when you're sick.",
        answers: [
          { text: 'Your head', points: 30, aliases: ['head', 'headache'] },
          { text: 'Your throat', points: 25, aliases: ['throat', 'sore throat'] },
          { text: 'Your stomach', points: 20, aliases: ['stomach', 'belly', 'tummy'] },
          { text: 'Your whole body', points: 14, aliases: ['body', 'muscles', 'everything'] },
          { text: 'Your ears', points: 11, aliases: ['ears', 'ear', 'nose', 'eyes'] },
        ],
      },
      {
        prompt: 'Name something you should do before eating.',
        answers: [
          { text: 'Wash your hands', points: 45, aliases: ['wash hands', 'clean your hands'] },
          { text: 'Say thank you', points: 18, aliases: ['say grace', 'thank you', 'jal meokgesseumnida'] },
          { text: 'Set the table', points: 15, aliases: ['prepare the table', 'get plates'] },
          { text: 'Sit down', points: 12, aliases: ['sit'] },
          { text: 'Take a photo of it', points: 10, aliases: ['take a picture', 'photo'] },
        ],
      },
      {
        prompt: 'Name something people do way too much of.',
        answers: [
          { text: 'Use their phone', points: 25, aliases: ['phone', 'scrolling', 'social media'] },
          { text: 'Sleep', points: 25, aliases: ['sleeping', 'nap'] },
          { text: 'Eat', points: 20, aliases: ['eating', 'snacking'] },
          { text: 'Watch TV', points: 16, aliases: ['tv', 'youtube', 'netflix'] },
          { text: 'Talk', points: 14, aliases: ['talking', 'complain'] },
        ],
      },
    ],
  },
  {
    id: 'family-life',
    title: 'Family Life',
    subtitle: 'Relatives, weekend plans, sibling fights, and pet names.',
    level: 'Easy ESL',
    emoji: '👨‍👩‍👧',
    color: '#FB923C',
    ...cover('gsCpOApSfUZDklghCx'),
    accent: '#111827',
    hashtags: ['family', 'daily-life'],
    rounds: [
      {
        prompt: 'Name someone in your family.',
        answers: [
          { text: 'Mom', points: 32, aliases: ['mother', 'mum', 'mommy'] },
          { text: 'Dad', points: 28, aliases: ['father', 'daddy'] },
          { text: 'Brother', points: 16, aliases: ['brothers'] },
          { text: 'Sister', points: 14, aliases: ['sisters'] },
          { text: 'Grandma', points: 10, aliases: ['grandmother', 'grandpa', 'grandfather', 'grandparents'] },
        ],
      },
      {
        prompt: 'Name something families do together on the weekend.',
        answers: [
          { text: 'Eat out', points: 30, aliases: ['go to a restaurant', 'eat dinner', 'go out to eat'] },
          { text: 'Watch a movie', points: 24, aliases: ['movie', 'watch tv'] },
          { text: 'Go shopping', points: 18, aliases: ['shopping', 'the mall'] },
          { text: 'Visit grandparents', points: 16, aliases: ['visit family', 'grandma house'] },
          { text: 'Go to the park', points: 12, aliases: ['park', 'picnic', 'hiking'] },
        ],
      },
      {
        prompt: 'Name something parents always tell their kids.',
        answers: [
          { text: 'Do your homework', points: 30, aliases: ['homework', 'study'] },
          { text: 'Clean your room', points: 25, aliases: ['tidy your room', 'clean up'] },
          { text: 'Go to bed', points: 20, aliases: ['go to sleep', 'bedtime'] },
          { text: 'Be careful', points: 14, aliases: ['careful', 'be safe'] },
          { text: 'Eat your vegetables', points: 11, aliases: ['eat your food', 'finish your dinner'] },
        ],
      },
      {
        prompt: 'Name something brothers and sisters fight about.',
        answers: [
          { text: 'The TV', points: 28, aliases: ['tv', 'the remote', 'what to watch'] },
          { text: 'Toys', points: 24, aliases: ['toy', 'games'] },
          { text: 'The phone', points: 20, aliases: ['phone', 'computer', 'tablet'] },
          { text: 'Food', points: 16, aliases: ['snacks', 'the last piece'] },
          { text: 'Who sits in the front seat', points: 12, aliases: ['the front seat', 'the car seat'] },
        ],
      },
      {
        prompt: "Name a popular name for a family pet.",
        answers: [
          { text: 'Lucky', points: 26, aliases: [] },
          { text: 'Coco', points: 24, aliases: ['cocoa'] },
          { text: 'Max', points: 20, aliases: ['maxi'] },
          { text: 'Bella', points: 16, aliases: ['belle'] },
          { text: 'Choco', points: 14, aliases: ['chocolate', 'chocopie'] },
        ],
      },
      {
        prompt: 'Name something you do to help at home.',
        answers: [
          { text: 'Wash the dishes', points: 28, aliases: ['dishes', 'do the dishes'] },
          { text: 'Clean my room', points: 24, aliases: ['clean', 'tidy up'] },
          { text: 'Take out the trash', points: 20, aliases: ['trash', 'garbage', 'recycling'] },
          { text: 'Cook', points: 16, aliases: ['help cook', 'make food'] },
          { text: 'Walk the dog', points: 12, aliases: ['feed the pet', 'take care of the pet'] },
        ],
      },
    ],
  },
  {
    id: 'holidays-and-parties',
    title: 'Holidays & Parties',
    subtitle: 'Cake, costumes, gifts, and what everyone decorates.',
    level: 'Medium ESL',
    emoji: '🎉',
    color: '#8B5CF6',
    ...cover('26tOZ42Mg6pbTUPHW'),
    accent: '#FFFFFF',
    hashtags: ['holidays', 'celebrations'],
    rounds: [
      {
        prompt: 'Name something at every party.',
        answers: [
          { text: 'Cake', points: 30, aliases: ['birthday cake'] },
          { text: 'Music', points: 25, aliases: ['songs', 'dancing'] },
          { text: 'Balloons', points: 20, aliases: ['balloon', 'decorations'] },
          { text: 'Food', points: 15, aliases: ['snacks', 'pizza'] },
          { text: 'Games', points: 10, aliases: ['party games'] },
        ],
      },
      {
        prompt: 'Name a holiday people look forward to.',
        answers: [
          { text: 'Christmas', points: 32, aliases: ['xmas'] },
          { text: 'New Year', points: 24, aliases: ["new year's", 'seollal', 'lunar new year'] },
          { text: 'Your birthday', points: 18, aliases: ['birthday'] },
          { text: 'Summer vacation', points: 16, aliases: ['summer holiday', 'vacation', 'chuseok'] },
          { text: 'Halloween', points: 10, aliases: [] },
        ],
      },
      {
        prompt: 'Name a Halloween costume.',
        answers: [
          { text: 'Ghost', points: 26, aliases: ['a ghost'] },
          { text: 'Witch', points: 22, aliases: ['a witch', 'wizard'] },
          { text: 'Zombie', points: 20, aliases: ['a zombie', 'skeleton'] },
          { text: 'Superhero', points: 18, aliases: ['spiderman', 'batman', 'super hero'] },
          { text: 'Vampire', points: 14, aliases: ['dracula'] },
        ],
      },
      {
        prompt: 'Name a gift people give.',
        answers: [
          { text: 'Money', points: 28, aliases: ['cash', 'gift card'] },
          { text: 'Clothes', points: 22, aliases: ['a shirt', 'socks'] },
          { text: 'Toys', points: 20, aliases: ['a toy', 'games'] },
          { text: 'Chocolate', points: 18, aliases: ['candy', 'sweets', 'snacks'] },
          { text: 'Flowers', points: 12, aliases: ['a bouquet'] },
        ],
      },
      {
        prompt: "Name something people do on New Year's Day.",
        answers: [
          { text: 'Make a resolution', points: 28, aliases: ['resolution', 'new year goals', 'make a plan'] },
          { text: 'Eat special food', points: 24, aliases: ['tteokguk', 'rice cake soup', 'special meal'] },
          { text: 'Visit family', points: 20, aliases: ['see relatives', 'go to grandparents'] },
          { text: 'Watch the sunrise', points: 16, aliases: ['sunrise', 'first sunrise'] },
          { text: 'Sleep all day', points: 12, aliases: ['sleep', 'rest'] },
        ],
      },
      {
        prompt: 'Name something that gets decorated for a holiday.',
        answers: [
          { text: 'A tree', points: 32, aliases: ['christmas tree', 'tree'] },
          { text: 'The house', points: 24, aliases: ['house', 'home', 'the door'] },
          { text: 'The table', points: 18, aliases: ['table', 'dinner table'] },
          { text: 'The classroom', points: 15, aliases: ['classroom', 'school'] },
          { text: 'A cake', points: 11, aliases: ['cake', 'cookies'] },
        ],
      },
    ],
  },
  {
    id: 'space-and-science',
    title: 'Space & Science',
    subtitle: 'Planets, astronauts, lab gear, and world-changing inventions.',
    level: 'Medium ESL',
    emoji: '🚀',
    color: '#1D4ED8',
    ...cover('RLLQg0mHR95YhotdMv'),
    accent: '#FFFFFF',
    hashtags: ['science', 'space'],
    rounds: [
      {
        prompt: 'Name something in space.',
        answers: [
          { text: 'Stars', points: 30, aliases: ['star'] },
          { text: 'Planets', points: 26, aliases: ['planet'] },
          { text: 'The moon', points: 20, aliases: ['moon'] },
          { text: 'The sun', points: 14, aliases: ['sun'] },
          { text: 'Aliens', points: 10, aliases: ['alien', 'ufo', 'satellites', 'astronauts'] },
        ],
      },
      {
        prompt: 'Name a planet.',
        answers: [
          { text: 'Mars', points: 30, aliases: [] },
          { text: 'Earth', points: 26, aliases: [] },
          { text: 'Jupiter', points: 18, aliases: [] },
          { text: 'Saturn', points: 15, aliases: [] },
          { text: 'Venus', points: 11, aliases: ['mercury', 'neptune', 'uranus'] },
        ],
      },
      {
        prompt: 'Name something an astronaut needs.',
        answers: [
          { text: 'A space suit', points: 34, aliases: ['space suit', 'spacesuit', 'suit'] },
          { text: 'Oxygen', points: 24, aliases: ['air', 'oxygen tank'] },
          { text: 'A helmet', points: 18, aliases: ['helmet'] },
          { text: 'A rocket', points: 14, aliases: ['rocket', 'spaceship', 'space ship'] },
          { text: 'Food', points: 10, aliases: ['space food', 'water'] },
        ],
      },
      {
        prompt: 'Name something you find in a science lab.',
        answers: [
          { text: 'A microscope', points: 30, aliases: ['microscope'] },
          { text: 'Test tubes', points: 26, aliases: ['test tube', 'beaker', 'flask'] },
          { text: 'Chemicals', points: 18, aliases: ['liquids', 'acid'] },
          { text: 'Safety goggles', points: 15, aliases: ['goggles', 'glasses', 'lab coat'] },
          { text: 'A scientist', points: 11, aliases: ['scientist', 'a teacher'] },
        ],
      },
      {
        prompt: 'Name something that makes a big explosion.',
        answers: [
          { text: 'A volcano', points: 30, aliases: ['volcano'] },
          { text: 'A bomb', points: 26, aliases: ['bomb', 'dynamite'] },
          { text: 'Fireworks', points: 20, aliases: ['firework'] },
          { text: 'A rocket', points: 14, aliases: ['rocket launch'] },
          { text: 'Baking soda and vinegar', points: 10, aliases: ['baking soda', 'coke and mentos'] },
        ],
      },
      {
        prompt: 'Name an invention that changed the world.',
        answers: [
          { text: 'The internet', points: 30, aliases: ['internet', 'computer'] },
          { text: 'Electricity', points: 25, aliases: ['the light bulb', 'lightbulb'] },
          { text: 'The wheel', points: 18, aliases: ['wheel'] },
          { text: 'The telephone', points: 15, aliases: ['phone', 'smartphone'] },
          { text: 'Medicine', points: 12, aliases: ['vaccines', 'antibiotics'] },
        ],
      },
    ],
  },
  {
    id: 'getting-around',
    title: 'Getting Around',
    subtitle: 'Roads, buses, bikes, and the classic reasons people run late.',
    level: 'Easy-Medium ESL',
    emoji: '🚗',
    color: '#EAB308',
    ...cover('X8zvH3HmNWsu2Yrg46', 'giphy.webp'),
    accent: '#111827',
    hashtags: ['transport', 'vocabulary'],
    rounds: [
      {
        prompt: 'Name something you see on the road.',
        answers: [
          { text: 'Cars', points: 32, aliases: ['car'] },
          { text: 'Traffic lights', points: 22, aliases: ['traffic light', 'stop light'] },
          { text: 'Buses', points: 18, aliases: ['bus'] },
          { text: 'People', points: 15, aliases: ['pedestrians', 'a crosswalk'] },
          { text: 'Bikes', points: 13, aliases: ['bicycles', 'motorcycles', 'scooters'] },
        ],
      },
      {
        prompt: 'Name a reason people are late.',
        answers: [
          { text: 'Traffic', points: 32, aliases: ['traffic jam', 'the roads were busy'] },
          { text: 'They woke up late', points: 26, aliases: ['woke up late', 'overslept', 'slept in'] },
          { text: 'They missed the bus', points: 18, aliases: ['missed the bus', 'missed the train'] },
          { text: 'They lost something', points: 14, aliases: ['lost their keys', 'couldnt find something'] },
          { text: 'Bad weather', points: 10, aliases: ['rain', 'snow'] },
        ],
      },
      {
        prompt: 'Name something inside a car.',
        answers: [
          { text: 'Steering wheel', points: 28, aliases: ['wheel', 'handle'] },
          { text: 'Seats', points: 22, aliases: ['seat', 'chairs'] },
          { text: 'The radio', points: 20, aliases: ['radio', 'music', 'speakers'] },
          { text: 'Mirror', points: 16, aliases: ['rear view mirror', 'mirrors'] },
          { text: 'Seatbelt', points: 14, aliases: ['seat belt', 'belt'] },
        ],
      },
      {
        prompt: 'Name something you need to ride a bike.',
        answers: [
          { text: 'A bike', points: 30, aliases: ['bike', 'bicycle'] },
          { text: 'A helmet', points: 26, aliases: ['helmet'] },
          { text: 'Balance', points: 18, aliases: ['practice', 'skill'] },
          { text: 'Legs', points: 14, aliases: ['strong legs', 'energy'] },
          { text: 'A road or a path', points: 12, aliases: ['a road', 'bike lane', 'a path'] },
        ],
      },
      {
        prompt: 'Name a rule everyone should follow on the bus.',
        answers: [
          { text: 'Pay the fare', points: 28, aliases: ['pay', 'tap your card', 'buy a ticket'] },
          { text: "Don't shout", points: 24, aliases: ['be quiet', 'no shouting', 'no loud talking'] },
          { text: 'Hold on', points: 20, aliases: ['hold the handle', 'hold the rail'] },
          { text: "Don't eat", points: 16, aliases: ['no eating', 'no food', 'no drinks'] },
          { text: 'Give up your seat', points: 12, aliases: ['give your seat', 'let old people sit'] },
        ],
      },
      {
        prompt: 'Name a place you can walk to.',
        answers: [
          { text: 'School', points: 30, aliases: [] },
          { text: 'The store', points: 24, aliases: ['store', 'shop', 'convenience store', 'supermarket'] },
          { text: 'The park', points: 20, aliases: ['park', 'playground'] },
          { text: "A friend's house", points: 15, aliases: ['friends house', 'my friend'] },
          { text: 'The bus stop', points: 11, aliases: ['bus stop', 'the station'] },
        ],
      },
    ],
  },
  {
    id: 'birthday-bash',
    title: 'Birthday Bash',
    subtitle: 'Cake flavours, presents, party disasters, and birthday money.',
    level: 'Easy ESL',
    emoji: '🎂',
    color: '#F43F5E',
    ...cover('SUA9E0GcSyhCU'),
    accent: '#FFFFFF',
    hashtags: ['birthday', 'celebrations'],
    rounds: [
      {
        prompt: 'Name something you do on your birthday.',
        answers: [
          { text: 'Eat cake', points: 32, aliases: ['cake', 'have cake'] },
          { text: 'Get presents', points: 26, aliases: ['presents', 'gifts', 'open gifts'] },
          { text: 'Sing Happy Birthday', points: 18, aliases: ['sing', 'happy birthday song'] },
          { text: 'Blow out the candles', points: 14, aliases: ['candles', 'blow candles', 'make a wish'] },
          { text: 'Take photos', points: 10, aliases: ['photos', 'pictures'] },
        ],
      },
      {
        prompt: 'Name a birthday present kids really want.',
        answers: [
          { text: 'A phone', points: 28, aliases: ['phone', 'smartphone'] },
          { text: 'A video game', points: 24, aliases: ['games', 'game console', 'nintendo', 'playstation'] },
          { text: 'Money', points: 20, aliases: ['cash', 'gift card'] },
          { text: 'Toys', points: 16, aliases: ['a toy', 'lego'] },
          { text: 'A pet', points: 12, aliases: ['a puppy', 'a dog', 'a cat'] },
        ],
      },
      {
        prompt: 'Name a flavour of birthday cake.',
        answers: [
          { text: 'Chocolate', points: 36, aliases: [] },
          { text: 'Strawberry', points: 22, aliases: ['fruit'] },
          { text: 'Vanilla', points: 20, aliases: ['cream'] },
          { text: 'Ice cream cake', points: 13, aliases: ['ice cream'] },
          { text: 'Cheesecake', points: 9, aliases: ['cheese cake', 'carrot cake'] },
        ],
      },
      {
        prompt: 'Name something people write on a birthday card.',
        answers: [
          { text: 'Happy Birthday', points: 40, aliases: ['happy bday'] },
          { text: 'Best wishes', points: 20, aliases: ['all the best', 'wishing you the best'] },
          { text: 'Their name', points: 16, aliases: ['name', 'from me', 'love from'] },
          { text: 'A joke', points: 14, aliases: ['something funny', 'how old you are'] },
          { text: 'Have a great day', points: 10, aliases: ['have a good day', 'enjoy your day'] },
        ],
      },
      {
        prompt: 'Name something that goes wrong at a party.',
        answers: [
          { text: 'Someone cries', points: 26, aliases: ['crying', 'a kid cries'] },
          { text: 'The cake falls', points: 22, aliases: ['cake drops', 'the cake is ruined'] },
          { text: 'Nobody comes', points: 20, aliases: ['no guests', 'nobody shows up'] },
          { text: 'It rains', points: 18, aliases: ['bad weather', 'rain'] },
          { text: 'The food runs out', points: 14, aliases: ['no food', 'not enough food'] },
        ],
      },
      {
        prompt: 'Name something you do with birthday money.',
        answers: [
          { text: 'Save it', points: 30, aliases: ['put it in the bank', 'saving'] },
          { text: 'Buy games', points: 24, aliases: ['video games', 'game'] },
          { text: 'Buy clothes', points: 18, aliases: ['clothes', 'shoes'] },
          { text: 'Buy food', points: 16, aliases: ['snacks', 'candy', 'eat out'] },
          { text: 'Give it to my parents', points: 12, aliases: ['give it to mom', 'give it away'] },
        ],
      },
    ],
  },
  {
    id: 'heroes-and-cartoons',
    title: 'Heroes & Cartoons',
    subtitle: 'Superpowers, capes, villain lines, and loyal sidekicks.',
    level: 'Medium ESL',
    emoji: '🦸',
    color: '#DC2626',
    ...cover('J6QtjufvowMqSml3LM'),
    accent: '#FFEB00',
    hashtags: ['cartoon', 'movies'],
    rounds: [
      {
        prompt: 'Name a superpower everyone wants.',
        answers: [
          { text: 'Flying', points: 32, aliases: ['fly', 'flight'] },
          { text: 'Invisibility', points: 24, aliases: ['being invisible', 'invisible'] },
          { text: 'Super strength', points: 18, aliases: ['strength', 'strong'] },
          { text: 'Time travel', points: 15, aliases: ['stopping time', 'control time'] },
          { text: 'Teleporting', points: 11, aliases: ['teleport', 'teleportation'] },
        ],
      },
      {
        prompt: 'Name a superhero.',
        answers: [
          { text: 'Spider-Man', points: 30, aliases: ['spiderman', 'spider man'] },
          { text: 'Superman', points: 25, aliases: ['super man'] },
          { text: 'Batman', points: 20, aliases: ['bat man'] },
          { text: 'Iron Man', points: 15, aliases: ['ironman'] },
          { text: 'Wonder Woman', points: 10, aliases: ['wonderwoman', 'captain america', 'hulk'] },
        ],
      },
      {
        prompt: 'Name something a villain always says.',
        answers: [
          { text: "You'll never win", points: 28, aliases: ['you will never win', 'you cant stop me'] },
          { text: "I'll be back", points: 24, aliases: ['i will be back', 'this is not over'] },
          { text: 'An evil laugh', points: 20, aliases: ['hahaha', 'evil laugh', 'muahaha'] },
          { text: 'Give up', points: 16, aliases: ['surrender', 'its over'] },
          { text: 'It was all my plan', points: 12, aliases: ['my plan', 'everything went to plan'] },
        ],
      },
      {
        prompt: 'Name an animal that is a cartoon character.',
        answers: [
          { text: 'Mouse', points: 28, aliases: ['mickey mouse', 'jerry', 'rat'] },
          { text: 'Dog', points: 24, aliases: ['snoopy', 'pluto', 'scooby doo'] },
          { text: 'Cat', points: 20, aliases: ['tom', 'garfield', 'hello kitty'] },
          { text: 'Bear', points: 16, aliases: ['winnie the pooh', 'pooh'] },
          { text: 'Duck', points: 12, aliases: ['donald duck', 'daffy duck'] },
        ],
      },
      {
        prompt: "Name something in a hero's costume.",
        answers: [
          { text: 'A cape', points: 34, aliases: ['cape'] },
          { text: 'A mask', points: 26, aliases: ['mask'] },
          { text: 'Boots', points: 16, aliases: ['boot', 'shoes'] },
          { text: 'A symbol on the chest', points: 14, aliases: ['a logo', 'symbol', 'letter on the chest'] },
          { text: 'Gloves', points: 10, aliases: ['a belt', 'glove'] },
        ],
      },
      {
        prompt: "Name a sidekick's job.",
        answers: [
          { text: 'Help the hero', points: 30, aliases: ['help', 'assist the hero'] },
          { text: 'Carry the stuff', points: 24, aliases: ['carry things', 'hold the gadgets'] },
          { text: 'Give advice', points: 20, aliases: ['advice', 'make the plan'] },
          { text: 'Get rescued', points: 16, aliases: ['get captured', 'need saving'] },
          { text: 'Be funny', points: 10, aliases: ['make jokes', 'comic relief'] },
        ],
      },
    ],
  },
  {
    id: 'korea-and-the-world',
    title: 'Korea & The World',
    subtitle: 'Food foreigners love, noraebang nights, and greetings everywhere.',
    level: 'Medium ESL',
    emoji: '🌏',
    color: '#0D9488',
    ...cover('l9BkgiHSy9yOau69A5'),
    accent: '#FFFFFF',
    hashtags: ['korea', 'culture'],
    rounds: [
      {
        prompt: 'Name a Korean food foreigners love.',
        answers: [
          { text: 'Kimchi', points: 30, aliases: ['kim chi'] },
          { text: 'Korean BBQ', points: 25, aliases: ['bbq', 'samgyeopsal', 'galbi', 'bulgogi'] },
          { text: 'Tteokbokki', points: 18, aliases: ['ddeokbokki', 'rice cakes', 'topokki'] },
          { text: 'Bibimbap', points: 15, aliases: ['bibim bap'] },
          { text: 'Korean fried chicken', points: 12, aliases: ['fried chicken', 'chicken'] },
        ],
      },
      {
        prompt: 'Name a country you want to visit.',
        answers: [
          { text: 'Japan', points: 24, aliases: [] },
          { text: 'The USA', points: 22, aliases: ['usa', 'america', 'united states'] },
          { text: 'France', points: 20, aliases: ['paris'] },
          { text: 'Australia', points: 18, aliases: [] },
          { text: 'Canada', points: 16, aliases: ['italy', 'england', 'uk'] },
        ],
      },
      {
        prompt: 'Name something you do at a noraebang.',
        answers: [
          { text: 'Sing', points: 40, aliases: ['singing', 'karaoke'] },
          { text: 'Shake the tambourine', points: 22, aliases: ['tambourine', 'play tambourine'] },
          { text: 'Eat snacks', points: 16, aliases: ['snacks', 'drink', 'eat'] },
          { text: 'Pick songs', points: 12, aliases: ['choose songs', 'use the remote', 'book'] },
          { text: 'Dance', points: 10, aliases: ['dancing', 'jump around'] },
        ],
      },
      {
        prompt: 'Name something every big city has.',
        answers: [
          { text: 'Bus stops', points: 26, aliases: ['buses', 'subway', 'public transport'] },
          { text: 'Restaurants', points: 24, aliases: ['restaurant', 'cafes', 'food'] },
          { text: 'Convenience stores', points: 20, aliases: ['convenience store', 'shops', 'stores'] },
          { text: 'Parks', points: 16, aliases: ['a park', 'green space'] },
          { text: 'Traffic', points: 14, aliases: ['traffic jams', 'lots of cars'] },
        ],
      },
      {
        prompt: 'Name something you say to greet someone.',
        answers: [
          { text: 'Hello', points: 34, aliases: ['annyeonghaseyo', 'hey'] },
          { text: 'Hi', points: 26, aliases: [] },
          { text: 'Good morning', points: 18, aliases: ['good afternoon', 'good evening'] },
          { text: 'How are you?', points: 12, aliases: ['how are you', "what's up", 'whats up'] },
          { text: 'Nice to meet you', points: 10, aliases: ['pleased to meet you'] },
        ],
      },
      {
        prompt: 'Name something Korea is famous for.',
        answers: [
          { text: 'K-pop', points: 32, aliases: ['kpop', 'bts', 'idols'] },
          { text: 'K-dramas', points: 24, aliases: ['kdrama', 'dramas', 'squid game'] },
          { text: 'Kimchi', points: 18, aliases: ['korean food'] },
          { text: 'Fast internet', points: 14, aliases: ['internet', 'technology', 'wifi'] },
          { text: 'Samsung', points: 12, aliases: ['hyundai', 'lg', 'phones', 'cars'] },
        ],
      },
    ],
  },
];

export function getFeudBoard(boardId) {
  return FEUD_BOARDS.find((board) => board.id === boardId) || null;
}

/**
 * Picks the rounds actually played this game. `count` of 0 (or anything past
 * the end) keeps the whole board.
 */
export function pickFeudRounds(board, count, shuffle) {
  const rounds = [...(board?.rounds || [])];
  if (shuffle) {
    for (let index = rounds.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [rounds[index], rounds[swapIndex]] = [rounds[swapIndex], rounds[index]];
    }
  }
  if (!count || count >= rounds.length) return rounds;
  return rounds.slice(0, count);
}
