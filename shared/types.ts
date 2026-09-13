export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  guess: string | null;
  roundPoints: number;
}

export interface Group {
  id: number;
  playerIds: string[];
  isInGroup: boolean;
}

export type GamePhase = 'lobby' | 'playing' | 'roundEnd' | 'finished';

/** Minimum players required to start a game. */
export const MIN_PLAYERS = 3;

/** In Group must have at least this many players; out groups may have 1. */
export const MIN_IN_GROUP_SIZE = 2;

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
}

export interface RoomState {
  code: string;
  phase: GamePhase;
  numGroups: number;
  wordSetId: string;
  wordSetName: string;
  players: Player[];
  groups: Group[];
  roundWords: string[];
  roundTimer: number | null;
  roundStartedAt: number | null;
  /** 0 = no timer; 1–15 = round length in minutes. Host sets between rounds. */
  roundDurationMinutes: number;
  hostId: string;
  waitingForHost: boolean;
  chatMessages: ChatMessage[];
  needsReshuffle: boolean;
  roundNotice: string | null;
}

export interface WordSet {
  id: string;
  name: string;
  words: string[];
  isPremium: boolean;
  isCustom: boolean;
  ownerId?: string;
}

export interface LicenseInfo {
  key: string;
}

/** Round timer: 0 = off; 1–15 = minutes per round. */
export const MIN_ROUND_DURATION_MINUTES = 0;
export const MAX_ROUND_DURATION_MINUTES = 15;
export const DEFAULT_ROUND_DURATION_MINUTES = 0;

/** One-time license purchase — unlocks premium word sets for one account. */
export const LICENSE_UNIT_PRICE_CENTS = 4900;
export const LICENSE_MIN_QUANTITY = 1;
export const LICENSE_MAX_QUANTITY = 100;

export interface PurchasedLicenseKey {
  key: string;
  activated: boolean;
}

export interface LicensePurchaseSummary {
  activeLicense: LicenseInfo | null;
  purchasedKeys: PurchasedLicenseKey[];
}

export interface LicenseCheckoutResponse {
  url: string;
}

export interface ClientPlayer extends Player {
  groupId: number | null;
  isInGroup: boolean;
}

export interface ClientRoomState {
  code: string;
  phase: GamePhase;
  numGroups: number;
  wordSetId: string;
  wordSetName: string;
  players: ClientPlayer[];
  groups: Group[];
  roundWords: string[];
  roundTimer: number | null;
  roundDurationMinutes: number;
  hostId: string;
  waitingForHost: boolean;
  myPlayerId: string;
  myRole: 'inGroup' | 'outGroup' | null;
  myGroupId: number | null;
  chatMessages: ChatMessage[];
  needsReshuffle: boolean;
  roundNotice: string | null;
}

export const FREE_WORD_SETS: WordSet[] = [
  {
    id: 'animals',
    name: 'Animals',
    isPremium: false,
    isCustom: false,
    words: [
      'Cat', 'Dog', 'Horse', 'Cow', 'Pig', 'Sheep', 'Goat', 'Chicken', 'Duck', 'Goose',
      'Turkey', 'Rabbit', 'Hamster', 'Mouse', 'Rat', 'Squirrel', 'Beaver', 'Deer', 'Moose', 'Bear',
      'Wolf', 'Fox', 'Coyote', 'Lion', 'Tiger', 'Leopard', 'Cheetah', 'Elephant', 'Giraffe', 'Zebra',
      'Hippo', 'Rhino', 'Monkey', 'Gorilla', 'Chimp', 'Kangaroo', 'Koala', 'Panda', 'Sloth', 'Bat',
      'Owl', 'Eagle', 'Hawk', 'Parrot', 'Penguin', 'Seal', 'Walrus', 'Whale', 'Dolphin', 'Shark',
      'Octopus', 'Crab', 'Lobster', 'Fish', 'Frog', 'Snake', 'Turtle', 'Lizard', 'Crocodile', 'Butterfly',
    ],
  },
  {
    id: 'objects',
    name: 'Objects',
    isPremium: true,
    isCustom: false,
    words: [
      'Chair', 'Table', 'Desk', 'Bed', 'Sofa', 'Lamp', 'Clock', 'Mirror', 'Phone', 'Computer',
      'Television', 'Radio', 'Camera', 'Book', 'Pen', 'Pencil', 'Paper', 'Notebook', 'Envelope', 'Stamp',
      'Key', 'Lock', 'Door', 'Window', 'Cup', 'Plate', 'Bowl', 'Fork', 'Knife', 'Spoon',
      'Pot', 'Pan', 'Bottle', 'Bag', 'Box', 'Basket', 'Ball', 'Doll', 'Toy', 'Bicycle',
      'Car', 'Bus', 'Train', 'Plane', 'Boat', 'Anchor', 'Umbrella', 'Hat', 'Coat', 'Shirt',
      'Shoes', 'Belt', 'Wallet', 'Watch', 'Ring', 'Necklace', 'Candle', 'Flashlight', 'Hammer', 'Rope',
    ],
  },
  {
    id: 'countries',
    name: 'Countries',
    isPremium: true,
    isCustom: false,
    words: [
      'United States', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Chile', 'Peru', 'Colombia', 'Cuba', 'Venezuela',
      'Ecuador', 'France', 'Germany', 'Italy', 'Spain', 'Portugal', 'Greece', 'Poland', 'Russia', 'Ukraine',
      'Sweden', 'Norway', 'Denmark', 'Finland', 'Ireland', 'England', 'Scotland', 'Wales', 'Netherlands', 'Belgium',
      'Switzerland', 'Austria', 'Czech Republic', 'Hungary', 'Romania', 'Turkey', 'Egypt', 'Morocco', 'Nigeria', 'Kenya',
      'South Africa', 'Ethiopia', 'Ghana', 'India', 'China', 'Japan', 'South Korea', 'Thailand', 'Vietnam', 'Philippines',
      'Indonesia', 'Malaysia', 'Pakistan', 'Bangladesh', 'Australia', 'New Zealand', 'Israel', 'Saudi Arabia', 'Iran', 'Iraq',
    ],
  },
  {
    id: 'celebrities',
    name: 'Celebrities',
    isPremium: true,
    isCustom: false,
    words: [
      'Einstein', 'Newton', 'Shakespeare', 'Lincoln', 'Washington', 'Jefferson', 'Churchill', 'Gandhi', 'Mandela', 'Cleopatra',
      'Napoleon', 'Darwin', 'Edison', 'Tesla', 'Curie', 'Beethoven', 'Mozart', 'Elvis', 'Chaplin', 'Picasso',
      'Disney', 'Oprah', 'Beyoncé', 'Madonna', 'Monroe', 'Jordan', 'Ali', 'Hitchcock', 'Spielberg', 'Hanks',
      'Streep', 'Pitt', 'Jolie', 'Cruise', 'Obama', 'Kennedy', 'Reagan', 'Roosevelt', 'Diana', 'Gates',
      'Jobs', 'Musk', 'Zuckerberg', 'Buffett', 'Rowling', 'Hemingway', 'Twain', 'Poe', 'Austen', 'Bronte',
      'Sinatra', 'Lennon', 'McCartney', 'Jackson', 'Whitney', 'Streisand', 'Aretha', 'Marley', 'Dylan', 'Swift',
    ],
  },
  {
    id: 'colors',
    name: 'Colors',
    isPremium: false,
    isCustom: false,
    words: [
      'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'Brown', 'Black', 'White',
      'Gray', 'Gold', 'Silver', 'Bronze', 'Beige', 'Tan', 'Cream', 'Ivory', 'Navy', 'Teal',
      'Turquoise', 'Cyan', 'Aqua', 'Maroon', 'Burgundy', 'Crimson', 'Scarlet', 'Coral', 'Salmon', 'Peach',
      'Apricot', 'Lavender', 'Violet', 'Indigo', 'Magenta', 'Fuchsia', 'Lilac', 'Plum', 'Olive', 'Lime',
      'Mint', 'Emerald', 'Jade', 'Sage', 'Amber', 'Rust', 'Copper', 'Rose', 'Blush', 'Mauve',
      'Wine', 'Charcoal', 'Slate', 'Cobalt', 'Azure', 'Ruby', 'Sapphire', 'Lemon', 'Mustard', 'Khaki',
    ],
  },
  {
    id: 'numbers',
    name: 'Numbers',
    isPremium: true,
    isCustom: false,
    words: [
      'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
      'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety', 'Hundred', 'Thousand',
      'Million', 'Billion', 'Dozen', 'Half', 'Quarter', 'Double', 'Triple', 'Pair', 'Even', 'Odd',
      'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth',
      'Percent', 'Plus', 'Minus', 'Total', 'Sum', 'Count', 'Digit', 'Single', 'Twice', 'Thrice',
    ],
  },
  {
    id: 'grabbag',
    name: 'Grab Bag',
    isPremium: true,
    isCustom: false,
    words: [
      'Love', 'Hope', 'Dream', 'Friend', 'Family', 'Home', 'School', 'Work', 'Money', 'Time',
      'Sun', 'Moon', 'Star', 'Sky', 'Cloud', 'Rain', 'Snow', 'Wind', 'Fire', 'Water',
      'Earth', 'Tree', 'Flower', 'Garden', 'Mountain', 'River', 'Ocean', 'Beach', 'Island', 'City',
      'Town', 'Road', 'Bridge', 'Park', 'Pizza', 'Coffee', 'Cake', 'Bread', 'Music', 'Dance',
      'Game', 'Sport', 'Soccer', 'Basketball', 'Football', 'Baseball', 'Movie', 'Book', 'Story', 'Joke',
      'Secret', 'Surprise', 'Party', 'Holiday', 'Birthday', 'Wedding', 'Vacation', 'Summer', 'Winter', 'Spring',
    ],
  },
  {
    id: 'foods',
    name: 'Foods',
    isPremium: true,
    isCustom: false,
    words: [
      'Pizza', 'Burger', 'Hot Dog', 'Sandwich', 'Taco', 'Burrito', 'Salad', 'Soup', 'Steak', 'Chicken',
      'Bacon', 'Eggs', 'Toast', 'Pancake', 'Waffle', 'Cereal', 'Oatmeal', 'Yogurt', 'Cheese', 'Butter',
      'Milk', 'Coffee', 'Tea', 'Juice', 'Soda', 'Water', 'Apple', 'Banana', 'Orange', 'Grape',
      'Strawberry', 'Blueberry', 'Peach', 'Pear', 'Lemon', 'Tomato', 'Potato', 'Carrot', 'Broccoli', 'Corn',
      'Rice', 'Pasta', 'Noodles', 'Bread', 'Bagel', 'Muffin', 'Cookie', 'Cake', 'Pie', 'Ice Cream',
      'Chocolate', 'Candy', 'Popcorn', 'Chips', 'Fries', 'Ketchup', 'Mustard', 'Honey', 'Peanut Butter', 'Jam',
    ],
  },
  {
    id: 'vehicles',
    name: 'Vehicles',
    isPremium: true,
    isCustom: false,
    words: [
      'Car', 'Truck', 'Bus', 'Van', 'Taxi', 'Motorcycle', 'Bicycle', 'Scooter', 'Skateboard', 'Train',
      'Subway', 'Airplane', 'Helicopter', 'Jet', 'Rocket', 'Boat', 'Ship', 'Ferry', 'Yacht', 'Canoe',
      'Kayak', 'Sailboat', 'Submarine', 'Ambulance', 'Tractor', 'Bulldozer', 'Crane', 'Forklift', 'Golf Cart', 'Snowmobile',
      'ATV', 'RV', 'Limousine', 'Sedan', 'SUV', 'Minivan', 'Pickup', 'Hatchback', 'Wagon', 'Convertible',
      'Cable Car', 'Balloon', 'Glider', 'Segway', 'Wheelchair', 'Trolley', 'Monorail', 'Speedboat', 'Paddleboat', 'Jet Ski',
      'Tank', 'Jeep', 'Buggy', 'Carriage', 'Spaceship', 'Drone', 'Hovercraft', 'Moped', 'Unicycle', 'Sled',
    ],
  },
  {
    id: 'office-supplies',
    name: 'Office Supplies',
    isPremium: false,
    isCustom: false,
    words: [
      'Pen', 'Pencil', 'Marker', 'Highlighter', 'Eraser', 'Sharpener', 'Ruler', 'Scissors', 'Stapler', 'Staples',
      'Paper Clip', 'Binder', 'Folder', 'Notebook', 'Notepad', 'Sticky Notes', 'Envelope', 'Stamp', 'Paper', 'Printer',
      'Ink', 'Toner', 'Calculator', 'Calendar', 'Planner', 'Desk', 'Chair', 'Lamp', 'Monitor', 'Keyboard',
      'Mouse', 'Laptop', 'Tablet', 'Headphones', 'Webcam', 'Microphone', 'Speaker', 'Whiteboard', 'Chalkboard', 'Chalk',
      'Dry Erase Marker', 'Push Pin', 'Thumbtack', 'Tape', 'Glue', 'Label', 'Clipboard', 'Briefcase', 'Filing Cabinet', 'Drawer',
      'Bookshelf', 'Document', 'Report', 'Memo', 'Invoice', 'Receipt', 'Rubber Band', 'Index Card', 'Name Tag', 'Badge',
    ],
  },
  {
    id: 'landmarks',
    name: 'Landmarks',
    isPremium: true,
    isCustom: false,
    words: [
      'Statue of Liberty', 'Eiffel Tower', 'Big Ben', 'Colosseum', 'Great Wall', 'Taj Mahal', 'Pyramids', 'Sphinx', 'Mount Rushmore', 'Golden Gate Bridge',
      'Brooklyn Bridge', 'Empire State Building', 'White House', 'Lincoln Memorial', 'Washington Monument', 'Hollywood Sign', 'Space Needle', 'Gateway Arch', 'Niagara Falls', 'Grand Canyon',
      'Mount Everest', 'Stonehenge', 'Leaning Tower', 'Notre Dame', 'Buckingham Palace', 'Tower of London', 'London Eye', 'Times Square', 'Central Park', 'Disneyland',
      'Mount Fuji', 'Sydney Opera House', 'CN Tower', 'Christ the Redeemer', 'Machu Picchu', 'Angkor Wat', 'Burj Khalifa', 'Louvre', 'Vatican', 'Alcatraz',
      'Red Square', 'Kremlin', 'Berlin Wall', 'Yellowstone', 'Pearl Harbor', 'Hoover Dam', 'Acropolis', 'Parthenon', 'Sagrada Familia', 'Forbidden City',
      'Terracotta Army', 'Mount Kilimanjaro', 'Victoria Falls', 'Panama Canal', 'Suez Canal', 'Hollywood', 'Las Vegas Strip', 'Wall Street', 'Silicon Valley', 'Route 66',
    ],
  },
  {
    id: 'sports',
    name: 'Sports',
    isPremium: true,
    isCustom: false,
    words: [
      'Soccer', 'Football', 'Basketball', 'Baseball', 'Softball', 'Tennis', 'Golf', 'Hockey', 'Volleyball', 'Bowling',
      'Cricket', 'Rugby', 'Lacrosse', 'Badminton', 'Ping Pong', 'Swimming', 'Diving', 'Surfing', 'Skiing', 'Snowboarding',
      'Skating', 'Gymnastics', 'Wrestling', 'Boxing', 'Fencing', 'Archery', 'Track', 'Marathon', 'Cycling', 'Racing',
      'Horse Racing', 'Rodeo', 'Field Hockey', 'Curling', 'Bobsled', 'Triathlon', 'Rowing', 'Canoeing', 'Sailing', 'Climbing',
      'Yoga', 'Weightlifting', 'CrossFit', 'Cheerleading', 'Dance', 'Handball', 'Water Polo', 'Squash', 'Racquetball', 'Billiards',
      'Darts', 'Fishing', 'Hunting', 'Camping', 'Hiking', 'Running', 'Jogging', 'Stretching', 'Kickboxing', 'Karate',
    ],
  },
  {
    id: 'appliances',
    name: 'Appliances',
    isPremium: true,
    isCustom: false,
    words: [
      'Fridge', 'Freezer', 'Oven', 'Stove', 'Microwave', 'Toaster', 'Blender', 'Mixer', 'Coffee Maker', 'Kettle',
      'Dishwasher', 'Washer', 'Dryer', 'Iron', 'Vacuum', 'Fan', 'Heater', 'Air Conditioner', 'Humidifier', 'Dehumidifier',
      'Hair Dryer', 'Water Heater', 'Furnace', 'Thermostat', 'Smoke Alarm', 'Doorbell', 'Slow Cooker', 'Rice Cooker', 'Pressure Cooker', 'Food Processor',
      'Juicer', 'Waffle Maker', 'Griddle', 'Air Fryer', 'Deep Fryer', 'Ice Maker', 'Bread Maker', 'Sewing Machine', 'Space Heater', 'Ceiling Fan',
      'Box Fan', 'Water Filter', 'Electric Blanket', 'Clothes Steamer', 'Hand Mixer', 'Stand Mixer', 'Garbage Disposal', 'Range Hood', 'Mini Fridge', 'Chest Freezer',
      'Window AC', 'Portable Heater', 'Curling Iron', 'Electric Shaver', 'Electric Toothbrush', 'Robot Vacuum', 'Steam Cleaner', 'Electric Grill', 'Hot Plate', 'Popcorn Maker',
    ],
  },
  {
    id: 'tools',
    name: 'Tools',
    isPremium: true,
    isCustom: false,
    words: [
      'Hammer', 'Screwdriver', 'Wrench', 'Pliers', 'Saw', 'Drill', 'Nail', 'Screw', 'Bolt', 'Nut',
      'Tape Measure', 'Level', 'Utility Knife', 'Chisel', 'File', 'Sandpaper', 'Paintbrush', 'Roller', 'Ladder', 'Shovel',
      'Rake', 'Hoe', 'Ax', 'Hatchet', 'Pickaxe', 'Crowbar', 'Mallet', 'Sledgehammer', 'Socket Wrench', 'Allen Key',
      'Clamp', 'Vise', 'Staple Gun', 'Glue Gun', 'Power Drill', 'Circular Saw', 'Jigsaw', 'Chainsaw', 'Leaf Blower', 'Lawn Mower',
      'Hedge Trimmer', 'Pressure Washer', 'Soldering Iron', 'Wire Cutters', 'Pipe Wrench', 'Plunger', 'Caulking Gun', 'Putty Knife', 'Wire Brush', 'Bench Grinder',
      'Toolbox', 'Hard Hat', 'Safety Goggles', 'Work Gloves', 'Extension Cord', 'Flashlight', 'Multimeter', 'Spirit Level', 'Wheelbarrow', 'Weed Whacker',
    ],
  },
  {
    id: 'places',
    name: 'Places',
    isPremium: true,
    isCustom: false,
    words: [
      'Park', 'Hospital', 'School', 'Library', 'Museum', 'Zoo', 'Aquarium', 'Beach', 'Mall', 'Grocery Store',
      'Restaurant', 'Cafe', 'Bar', 'Hotel', 'Airport', 'Train Station', 'Bus Stop', 'Gas Station', 'Parking Lot', 'Church',
      'Temple', 'Mosque', 'Cemetery', 'Courthouse', 'City Hall', 'Post Office', 'Bank', 'Pharmacy', 'Gym', 'Stadium',
      'Theater', 'Movie Theater', 'Amusement Park', 'Playground', 'Campground', 'Farm', 'Factory', 'Warehouse', 'Office', 'Home',
      'Apartment', 'Neighborhood', 'Downtown', 'Suburb', 'Forest', 'Lake', 'River', 'Mountain', 'Desert', 'Island',
      'Backyard', 'Garage', 'Basement', 'Attic', 'Kitchen', 'Bathroom', 'Bedroom', 'Living Room', 'Classroom', 'Fire Station',
    ],
  },
  {
    id: 'occupations',
    name: 'Occupations',
    isPremium: true,
    isCustom: false,
    words: [
      'Teacher', 'Doctor', 'Nurse', 'Dentist', 'Lawyer', 'Judge', 'Police Officer', 'Firefighter', 'Chef', 'Waiter',
      'Cashier', 'Clerk', 'Manager', 'CEO', 'Accountant', 'Engineer', 'Architect', 'Scientist', 'Artist', 'Writer',
      'Journalist', 'Photographer', 'Actor', 'Singer', 'Musician', 'Coach', 'Pilot', 'Driver', 'Mechanic', 'Electrician',
      'Plumber', 'Carpenter', 'Builder', 'Farmer', 'Soldier', 'Guard', 'Janitor', 'Babysitter', 'Librarian', 'Barber',
      'Designer', 'Programmer', 'Veterinarian', 'Pharmacist', 'Therapist', 'Counselor', 'Social Worker', 'Realtor', 'Salesperson', 'Secretary',
      'Receptionist', 'Paramedic', 'Surgeon', 'EMT', 'Mail Carrier', 'Delivery Driver', 'Truck Driver', 'Astronaut', 'Detective', 'Banker',
    ],
  },
  {
    id: 'first-names',
    name: 'First Names',
    isPremium: true,
    isCustom: false,
    words: [
      'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth',
      'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen',
      'Christopher', 'Lisa', 'Daniel', 'Nancy', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra',
      'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
      'Kenneth', 'Kevin', 'Brian', 'George', 'Timothy', 'Edward', 'Jason', 'Jeffrey', 'Ryan', 'Jacob',
      'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon', 'Benjamin',
    ],
  },
  {
    id: 'homonyms',
    name: 'Homonyms',
    isPremium: true,
    isCustom: false,
    words: [
      'Bear', 'Bat', 'Bank', 'Bark', 'Bow', 'Box', 'Can', 'Cast', 'Change', 'Count',
      'Date', 'Duck', 'Eye', 'Fair', 'File', 'Fly', 'Foot', 'Grave', 'Hand', 'Head',
      'Hide', 'Hit', 'Host', 'Iron', 'Jam', 'Kind', 'Land', 'Lap', 'Lead', 'Left',
      'Letter', 'Light', 'Like', 'Match', 'Mine', 'Miss', 'Moon', 'Nail', 'Novel', 'Palm',
      'Park', 'Pitch', 'Plant', 'Play', 'Pool', 'Pound', 'Pupil', 'Ring', 'Rock', 'Rose',
      'Scale', 'School', 'Season', 'Sink', 'Sole', 'Spring', 'Star', 'Trip', 'Watch', 'Wave',
    ],
  },
  {
    id: 'companies',
    name: 'Big Companies',
    isPremium: true,
    isCustom: false,
    words: [
      'Apple', 'Microsoft', 'Google', 'Amazon', 'Tesla', 'Meta', 'Netflix', 'Disney', 'Nike', 'Adidas',
      'Coca-Cola', 'Pepsi', 'Starbucks', 'Walmart', 'Target', 'Samsung', 'Sony', 'Intel', 'Nvidia', 'Boeing',
      'Ford', 'Toyota', 'Honda', 'BMW', 'Mercedes', 'Visa', 'PayPal', 'Uber', 'Airbnb', 'Spotify',
      'YouTube', 'Instagram', 'LinkedIn', 'Salesforce', 'Oracle', 'Dell', 'Verizon', 'AT&T', 'Comcast', 'FedEx',
      'UPS', 'Costco', 'Home Depot', 'Lowe\'s', 'IBM', 'AMD', 'Volkswagen', 'Audi', 'General Motors', 'Hyundai',
      'Mastercard', 'Lyft', 'TikTok', 'Snapchat', 'Cisco', 'HP', 'Lenovo', 'Huawei', 'CNN', 'BBC',
    ],
  },
  {
    id: 'fast-food',
    name: 'Fast Food',
    isPremium: true,
    isCustom: false,
    words: [
      'McDonald\'s', 'Burger King', 'Wendy\'s', 'Taco Bell', 'KFC', 'Subway', 'Pizza Hut', 'Domino\'s', 'Chipotle', 'Dunkin',
      'Chick-fil-A', 'Popeyes', 'Arby\'s', 'Sonic', 'Dairy Queen', 'Jack in the Box', 'Carl\'s Jr', 'White Castle', 'In-N-Out', 'Five Guys',
      'Panera', 'Panda Express', 'Qdoba', 'Jersey Mike\'s', 'Jimmy John\'s', 'Little Caesars', 'Papa John\'s', 'Wingstop', 'Chili\'s', 'Applebee\'s',
      'Olive Garden', 'Red Lobster', 'IHOP', 'Denny\'s', 'Waffle House', 'Cracker Barrel', 'Whataburger', 'Zaxby\'s', 'Raising Cane\'s', 'Culver\'s',
      'Steak n Shake', 'Bojangles', 'Del Taco', 'Long John Silver\'s', 'A&W', 'Krispy Kreme', 'Cinnabon', 'Baskin-Robbins', 'Cold Stone', 'Jamba',
      'Auntie Anne\'s', 'Tim Hortons', 'Jollibee', 'Hardee\'s', 'Checkers', 'Rally\'s', 'El Pollo Loco', 'Smoothie King', 'Firehouse Subs', 'Moe\'s',
    ],
  },
  {
    id: 'retail-stores',
    name: 'Retail Stores',
    isPremium: true,
    isCustom: false,
    words: [
      'Walmart', 'Target', 'Costco', 'Amazon', 'eBay', 'Etsy', 'Best Buy', 'Home Depot', 'Lowe\'s', 'Macy\'s',
      'Nordstrom', 'Kohl\'s', 'Gap', 'Old Navy', 'H&M', 'Zara', 'Uniqlo', 'Forever 21', 'Urban Outfitters', 'GameStop',
      'Barnes & Noble', 'Staples', 'Office Depot', 'IKEA', 'Pottery Barn', 'Whole Foods', 'Trader Joe\'s', 'Kroger', 'Safeway', 'Publix',
      'CVS', 'Walgreens', 'Rite Aid', 'Dollar General', 'Dollar Tree', 'Family Dollar', 'Five Below', 'TJ Maxx', 'Marshalls', 'Ross',
      'PetSmart', 'Petco', 'AutoZone', 'Michaels', 'Joann', 'Hobby Lobby', 'Ulta', 'Sephora', 'Victoria\'s Secret', 'Bed Bath & Beyond',
      'Albertsons', 'O\'Reilly', 'Advance Auto', 'Burlington', 'Banana Republic', 'Abercrombie', 'Nike', 'Apple Store', '7-Eleven', 'Circle K',
    ],
  },
  {
    id: 'video-game-objects',
    name: 'Video Game Objects',
    isPremium: true,
    isCustom: false,
    words: [
      'Sword', 'Shield', 'Potion', 'Key', 'Coin', 'Gem', 'Chest', 'Map', 'Torch', 'Bow',
      'Arrow', 'Axe', 'Hammer', 'Armor', 'Helmet', 'Boots', 'Ring', 'Amulet', 'Scroll', 'Spell',
      'Wand', 'Staff', 'Crystal', 'Heart', 'Bomb', 'Gun', 'Ammo', 'Grenade', 'Rocket', 'Laser',
      'Power Up', 'Mushroom', 'Star', 'Flag', 'Checkpoint', 'Health Bar', 'Mana', 'Inventory', 'Quest', 'Boss',
      'Level', 'Portal', 'Gate', 'Door', 'Ladder', 'Switch', 'Button', 'Lever', 'Trap', 'Treasure',
      'Gold', 'Trophy', 'Badge', 'Loot', 'Crate', 'Barrel', 'Cannon', 'Turret', 'Mount', 'Companion',
    ],
  },
  {
    id: 'medieval',
    name: 'Medieval',
    isPremium: true,
    isCustom: false,
    words: [
      'Knight', 'Castle', 'King', 'Queen', 'Prince', 'Princess', 'Lord', 'Lady', 'Peasant', 'Serf',
      'Jester', 'Bard', 'Monk', 'Priest', 'Bishop', 'Archer', 'Sword', 'Shield', 'Armor', 'Helmet',
      'Chain Mail', 'Horse', 'Siege', 'Moat', 'Drawbridge', 'Tower', 'Dungeon', 'Throne', 'Crown', 'Scepter',
      'Chalice', 'Goblet', 'Feast', 'Tavern', 'Inn', 'Market', 'Village', 'Kingdom', 'Manor', 'Mill',
      'Forge', 'Blacksmith', 'Anvil', 'Axe', 'Mace', 'Crossbow', 'Catapult', 'Trebuchet', 'Arrow', 'Banner',
      'Squire', 'Noble', 'Duke', 'Earl', 'Baron', 'Abbey', 'Cathedral', 'Chapel', 'Altar', 'Camelot',
    ],
  },
  {
    id: 'fantasy',
    name: 'Fantasy',
    isPremium: true,
    isCustom: false,
    words: [
      'Wizard', 'Witch', 'Mage', 'Warlock', 'Druid', 'Paladin', 'Ranger', 'Rogue', 'Warrior', 'Barbarian',
      'Cleric', 'Necromancer', 'Dragon', 'Unicorn', 'Griffin', 'Phoenix', 'Troll', 'Goblin', 'Orc', 'Elf',
      'Dwarf', 'Halfling', 'Fairy', 'Demon', 'Angel', 'Vampire', 'Werewolf', 'Zombie', 'Ghost', 'Skeleton',
      'Golem', 'Giant', 'Ogre', 'Hydra', 'Kraken', 'Basilisk', 'Chimera', 'Minotaur', 'Centaur', 'Mermaid',
      'Spellbook', 'Potion', 'Amulet', 'Crystal Ball', 'Magic Ring', 'Enchanted Forest', 'Portal', 'Prophecy', 'Artifact', 'Spell',
      'Cauldron', 'Broomstick', 'Crystal', 'Rune', 'Scroll', 'Lair', 'Hero', 'Villain', 'Dark Lord', 'Magic Mirror',
    ],
  },
  {
    id: 'car-brands',
    name: 'Car Brands',
    isPremium: true,
    isCustom: false,
    words: [
      'Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Nissan', 'Hyundai',
      'Kia', 'Mazda', 'Subaru', 'Lexus', 'Acura', 'Infiniti', 'Cadillac', 'Buick', 'GMC', 'Jeep',
      'Ram', 'Dodge', 'Chrysler', 'Tesla', 'Rivian', 'Porsche', 'Ferrari', 'Lamborghini', 'Maserati', 'Bentley',
      'Rolls-Royce', 'Aston Martin', 'Jaguar', 'Land Rover', 'Volvo', 'Mini', 'Fiat', 'Alfa Romeo', 'Mitsubishi', 'Suzuki',
      'Genesis', 'Lincoln', 'Hummer', 'Pontiac', 'Saturn', 'Bugatti', 'McLaren', 'Peugeot', 'Renault', 'Citroen',
      'Skoda', 'Seat', 'Isuzu', 'Scion', 'Mercury', 'Plymouth', 'Oldsmobile', 'Lucid', 'Saab', 'Range Rover',
    ],
  },
  {
    id: 'deities',
    name: 'Deities',
    isPremium: true,
    isCustom: false,
    words: [
      'Zeus', 'Hera', 'Poseidon', 'Athena', 'Apollo', 'Artemis', 'Ares', 'Aphrodite', 'Hermes', 'Hades',
      'Demeter', 'Dionysus', 'Odin', 'Thor', 'Loki', 'Freya', 'Frigg', 'Ra', 'Isis', 'Osiris',
      'Anubis', 'Horus', 'Bastet', 'Shiva', 'Vishnu', 'Brahma', 'Krishna', 'Lakshmi', 'Ganesha', 'Kali',
      'Buddha', 'Jesus', 'Allah', 'Gabriel', 'Michael', 'Raphael', 'Satan', 'Lucifer', 'Hercules', 'Perseus',
      'Prometheus', 'Medusa', 'Achilles', 'Jupiter', 'Neptune', 'Mars', 'Venus', 'Mercury', 'Saturn', 'Cupid',
      'Pan', 'Atlas', 'Cronus', 'Persephone', 'Nike', 'Eros', 'Hecate', 'Set', 'Thoth', 'Amaterasu',
    ],
  },
  {
    id: 'snack-brands',
    name: 'Snack Brands',
    isPremium: true,
    isCustom: false,
    words: [
      'Lay\'s', 'Doritos', 'Cheetos', 'Fritos', 'Tostitos', 'Ruffles', 'Pringles', 'Oreo', 'Chips Ahoy', 'Keebler',
      'Ritz', 'Triscuit', 'Wheat Thins', 'Cheez-It', 'Goldfish', 'Pop-Tarts', 'Eggo', 'Nutella', 'Reese\'s', 'M&M\'s',
      'Snickers', 'Twix', 'Milky Way', 'Butterfinger', 'Skittles', 'Starburst', 'Hershey', 'Kit Kat', 'Dove', 'Cadbury',
      'Toblerone', 'Mars', 'Almond Joy', 'PayDay', 'Baby Ruth', 'Sour Patch', 'Swedish Fish', 'Haribo', 'Welch\'s', 'Planters',
      'Nature Valley', 'Clif Bar', 'Kind Bar', 'Quaker', 'Chex Mix', 'Combos', 'Slim Jim', 'Jack Link\'s', 'Hostess', 'Twinkie',
      'Little Debbie', 'Nabisco', 'Pepperidge Farm', 'Annie\'s', 'Pirate\'s Booty', 'Smartfood', 'SkinnyPop', 'Orville Redenbacher', 'Jiffy Pop', 'Takis',
    ],
  },
  {
    id: 'books',
    name: 'Books',
    isPremium: true,
    isCustom: false,
    words: [
      'Harry Potter', 'Lord of the Rings', 'The Hobbit', 'Narnia', 'Game of Thrones', 'Hunger Games', 'Twilight', 'Percy Jackson', 'Charlotte\'s Web', 'Green Eggs and Ham',
      'Cat in the Hat', 'Great Gatsby', 'To Kill a Mockingbird', '1984', 'Animal Farm', 'Brave New World', 'Catcher in the Rye', 'Little Women', 'Pride and Prejudice', 'Jane Eyre',
      'Frankenstein', 'Dracula', 'Sherlock Holmes', 'Moby Dick', 'War and Peace', 'The Odyssey', 'The Bible', 'Alice in Wonderland', 'Wizard of Oz', 'Peter Pan',
      'Jungle Book', 'Grapes of Wrath', 'Old Man and the Sea', 'Fahrenheit 451', 'Handmaid\'s Tale', 'Dune', 'Ender\'s Game', 'Da Vinci Code', 'Book Thief', 'Catch-22',
      'Gone Girl', 'Kite Runner', 'Hitchhiker\'s Guide', 'Shogun', 'Pinocchio', 'Robin Hood', 'Don Quixote', 'Wuthering Heights', 'Crime and Punishment', 'The Alchemist',
      'Where the Wild Things Are', 'Diary of a Wimpy Kid', 'Maze Runner', 'Divergent', 'Name of the Wind', 'Wheel of Time', 'Mistborn', 'Way of Kings', 'Gone with the Wind', 'Secret Garden',
    ],
  },
  {
    id: 'movies',
    name: 'Movies',
    isPremium: true,
    isCustom: false,
    words: [
      'Star Wars', 'Titanic', 'Avatar', 'The Avengers', 'Batman', 'Superman', 'Spider-Man', 'Iron Man', 'Jaws', 'E.T.',
      'Jurassic Park', 'Forrest Gump', 'Shawshank Redemption', 'The Godfather', 'Pulp Fiction', 'The Matrix', 'Inception', 'Interstellar', 'Gladiator', 'Rocky',
      'Terminator', 'Alien', 'Ghostbusters', 'Back to the Future', 'Indiana Jones', 'James Bond', 'Mission Impossible', 'Top Gun', 'The Lion King', 'Frozen',
      'Toy Story', 'Finding Nemo', 'Shrek', 'The Incredibles', 'Up', 'Coco', 'Moana', 'Aladdin', 'Beauty and the Beast', 'The Little Mermaid',
      'Cinderella', 'Snow White', 'The Wizard of Oz', 'The Sound of Music', 'Grease', 'Home Alone', 'Ghost', 'Pretty Woman', 'Dirty Dancing', 'Mean Girls',
      'Black Panther', 'Wonder Woman', 'Deadpool', 'Guardians of the Galaxy', 'Oppenheimer', 'Barbie', 'Knives Out', 'Get Out', 'Fast and Furious', 'The Hangover',
    ],
  },
  {
    id: 'vegetables',
    name: 'Vegetables',
    isPremium: true,
    isCustom: false,
    words: [
      'Carrot', 'Broccoli', 'Celery', 'Spinach', 'Lettuce', 'Kale', 'Cabbage', 'Cauliflower', 'Brussels Sprouts', 'Asparagus',
      'Corn', 'Peas', 'Green Beans', 'Potato', 'Sweet Potato', 'Onion', 'Garlic', 'Shallot', 'Leek', 'Tomato',
      'Cucumber', 'Zucchini', 'Squash', 'Pumpkin', 'Eggplant', 'Bell Pepper', 'Jalapeno', 'Mushroom', 'Radish', 'Beet',
      'Turnip', 'Parsnip', 'Artichoke', 'Okra', 'Bok Choy', 'Arugula', 'Fennel', 'Watercress', 'Swiss Chard', 'Rutabaga',
      'Yam', 'Bean Sprouts', 'Collard Greens', 'Endive', 'Rhubarb', 'Kohlrabi', 'Scallion', 'Red Pepper', 'Butternut Squash', 'Acorn Squash',
      'Snow Pea', 'Snap Pea', 'Lima Bean', 'Chard', 'Hubbard Squash', 'Spaghetti Squash', 'Daikon', 'Chicory', 'Mustard Greens', 'Beet Greens',
    ],
  },
  {
    id: 'fruits',
    name: 'Fruits',
    isPremium: true,
    isCustom: false,
    words: [
      'Apple', 'Banana', 'Orange', 'Grape', 'Strawberry', 'Blueberry', 'Raspberry', 'Blackberry', 'Cranberry', 'Cherry',
      'Peach', 'Plum', 'Apricot', 'Nectarine', 'Pear', 'Mango', 'Pineapple', 'Kiwi', 'Watermelon', 'Cantaloupe',
      'Honeydew', 'Lemon', 'Lime', 'Grapefruit', 'Tangerine', 'Clementine', 'Coconut', 'Papaya', 'Guava', 'Passion Fruit',
      'Dragon Fruit', 'Fig', 'Date', 'Pomegranate', 'Avocado', 'Persimmon', 'Lychee', 'Kumquat', 'Mulberry', 'Gooseberry',
      'Currant', 'Plantain', 'Starfruit', 'Jackfruit', 'Melon', 'Mandarin', 'Pomelo', 'Quince', 'Elderberry', 'Boysenberry',
      'Blood Orange', 'Soursop', 'Breadfruit', 'Cloudberry', 'Marionberry', 'Huckleberry', 'Rambutan', 'Durian', 'Acai', 'Longan',
    ],
  },
  {
    id: 'spices',
    name: 'Spices',
    isPremium: true,
    isCustom: false,
    words: [
      'Salt', 'Pepper', 'Paprika', 'Cumin', 'Cinnamon', 'Nutmeg', 'Cloves', 'Ginger', 'Turmeric', 'Curry',
      'Chili Powder', 'Cayenne', 'Oregano', 'Basil', 'Thyme', 'Rosemary', 'Sage', 'Parsley', 'Cilantro', 'Dill',
      'Mint', 'Bay Leaf', 'Cardamom', 'Coriander', 'Fennel Seed', 'Mustard Seed', 'Celery Seed', 'Caraway', 'Anise', 'Star Anise',
      'Allspice', 'Saffron', 'Vanilla', 'Garlic Powder', 'Onion Powder', 'Chili Flakes', 'Red Pepper Flakes', 'Garam Masala', 'Five Spice', 'Italian Seasoning',
      'Lemon Pepper', 'Old Bay', 'Sesame Seed', 'Poppy Seed', 'Wasabi', 'Horseradish', 'Smoked Paprika', 'Black Pepper', 'White Pepper', 'Pink Salt',
      'Steak Seasoning', 'Poultry Seasoning', 'Taco Seasoning', 'Everything Bagel', 'Herbs de Provence', 'Sumac', 'Tarragon', 'Marjoram', 'Chervil', 'Lavender',
    ],
  },
  {
    id: 'animes',
    name: 'Animes',
    isPremium: true,
    isCustom: false,
    words: [
      'Naruto', 'One Piece', 'Dragon Ball Z', 'Bleach', 'Pokemon', 'Digimon', 'Sailor Moon', 'Attack on Titan', 'Demon Slayer', 'My Hero Academia',
      'One Punch Man', 'Death Note', 'Fullmetal Alchemist', 'Cowboy Bebop', 'Evangelion', 'Spirited Away', 'Totoro', 'Jujutsu Kaisen', 'Chainsaw Man', 'Spy x Family',
      'Haikyuu', 'Yu-Gi-Oh', 'JoJo', 'Hunter x Hunter', 'Fairy Tail', 'Black Clover', 'Soul Eater', 'Code Geass', 'Steins Gate', 'Tokyo Ghoul',
      'Mob Psycho 100', 'Sword Art Online', 'Inuyasha', 'Rurouni Kenshin', 'Akira', 'Ghost in the Shell', 'Your Name', 'Dragon Ball Super', 'Toradora', 'Frieren',
      'Assassination Classroom', 'Kill la Kill', 'Gurren Lagann', 'Made in Abyss', 'Vinland Saga', 'Berserk', 'Monster', 'Psycho Pass', 'Danganronpa', 'Erased',
      'Violet Evergarden', 'K-On', 'Lucky Star', 'Trigun', 'Gundam', 'Slam Dunk', 'Beyblade', 'Death Parade', 'Naruto Shippuden', 'Howl\'s Moving Castle',
    ],
  },
  {
    id: 'cartoons',
    name: 'Cartoons',
    isPremium: true,
    isCustom: false,
    words: [
      'SpongeBob', 'The Simpsons', 'Family Guy', 'South Park', 'Tom and Jerry', 'Looney Tunes', 'Bugs Bunny', 'Mickey Mouse', 'Donald Duck', 'Goofy',
      'Scooby-Doo', 'The Flintstones', 'The Jetsons', 'Rugrats', 'Hey Arnold', 'Avatar', 'Adventure Time', 'Regular Show', 'Steven Universe', 'Gravity Falls',
      'Rick and Morty', 'Futurama', 'Bob\'s Burgers', 'King of the Hill', 'Phineas and Ferb', 'Kim Possible', 'Fairly OddParents', 'Jimmy Neutron', 'Powerpuff Girls', 'Teen Titans',
      'Ben 10', 'Total Drama', 'Arthur', 'Sesame Street', 'Bluey', 'Peppa Pig', 'Paw Patrol', 'Dora the Explorer', 'Teenage Mutant Ninja Turtles', 'Transformers',
      'He-Man', 'She-Ra', 'Thundercats', 'Voltron', 'Inspector Gadget', 'Pink Panther', 'Yogi Bear', 'The Smurfs', 'Garfield', 'Charlie Brown',
      'The Muppet Show', 'Dexter\'s Laboratory', 'Courage the Cowardly Dog', 'Ed Edd n Eddy', 'Danny Phantom', 'Legend of Korra', 'Animaniacs', 'Pinky and the Brain', 'Ren and Stimpy', 'Rocko\'s Modern Life',
    ],
  },
  {
    id: 'fonts',
    name: 'Fonts',
    isPremium: true,
    isCustom: false,
    words: [
      'Arial', 'Helvetica', 'Times New Roman', 'Courier', 'Verdana', 'Georgia', 'Tahoma', 'Comic Sans', 'Impact', 'Trebuchet',
      'Palatino', 'Garamond', 'Futura', 'Gill Sans', 'Calibri', 'Cambria', 'Consolas', 'Lucida', 'Franklin Gothic', 'Book Antiqua',
      'Century Gothic', 'Rockwell', 'Baskerville', 'Didot', 'Bodoni', 'Optima', 'Avenir', 'Proxima Nova', 'Roboto', 'Open Sans',
      'Lato', 'Montserrat', 'Poppins', 'Oswald', 'Raleway', 'Playfair Display', 'Merriweather', 'Source Sans', 'Noto Sans', 'Ubuntu',
      'Fira Sans', 'PT Sans', 'Cabin', 'Josefin Sans', 'Nunito', 'Quicksand', 'Arial Black', 'Brush Script', 'Papyrus', 'Wingdings',
      'Copperplate', 'American Typewriter', 'Courier New', 'Lucida Console', 'Segoe UI', 'Times', 'Helvetica Neue', 'Chalkboard', 'Marker Felt', 'Sans Serif',
    ],
  },
  {
    id: 'mobile-games',
    name: 'Mobile Games',
    isPremium: true,
    isCustom: false,
    words: [
      'Candy Crush', 'Clash of Clans', 'Clash Royale', 'Angry Birds', 'Pokemon Go', 'Among Us', 'Subway Surfers', 'Temple Run', 'Flappy Bird', 'Wordle',
      'Crossy Road', 'Fruit Ninja', 'Cut the Rope', 'Doodle Jump', 'Plants vs Zombies', 'Hay Day', 'Farmville', 'Words with Friends', 'Bejeweled', 'Tetris',
      'Roblox', 'Fortnite Mobile', 'PUBG Mobile', 'Call of Duty Mobile', 'Genshin Impact', 'Monument Valley', 'Gardenscapes', 'Homescapes', 'Coin Master', 'Brawl Stars',
      'Mobile Legends', 'Free Fire', 'Stumble Guys', 'Royal Match', 'Merge Dragons', 'Township', 'Dragon City', 'Sims Mobile', 'Asphalt 9', 'Geometry Dash',
      'Talking Tom', 'Two Dots', 'Bubble Shooter', 'Solitaire', 'Sudoku', 'Mahjong', 'Monopoly Go', 'Mario Kart Tour', 'Fire Emblem Heroes', 'Alto\'s Odyssey',
      'Pou', 'Trivia Crack', 'Phase 10', 'Uno Mobile', 'Crossword', 'HQ Trivia', 'My Talking Angela', 'Real Racing', 'Jetpack Joyride', 'Temple Run 2',
    ],
  },
  {
    id: 'video-games',
    name: 'Video Games',
    isPremium: true,
    isCustom: false,
    words: [
      'Minecraft', 'Fortnite', 'Roblox', 'Zelda', 'Mario', 'Pokemon', 'Call of Duty', 'Halo', 'Grand Theft Auto', 'Red Dead Redemption',
      'The Witcher', 'Skyrim', 'Fallout', 'Elden Ring', 'Dark Souls', 'God of War', 'Horizon Zero Dawn', 'Uncharted', 'The Last of Us', 'Metal Gear Solid',
      'Resident Evil', 'Final Fantasy', 'Kingdom Hearts', 'Persona', 'Animal Crossing', 'Splatoon', 'Super Smash Bros', 'Kirby', 'Metroid', 'Donkey Kong',
      'Pac-Man', 'Street Fighter', 'Mortal Kombat', 'Tekken', 'Overwatch', 'League of Legends', 'Valorant', 'Apex Legends', 'Counter-Strike', 'World of Warcraft',
      'Diablo', 'StarCraft', 'Hearthstone', 'Stardew Valley', 'Terraria', 'Portal', 'Half-Life', 'Bioshock', 'Mass Effect', 'Assassin\'s Creed',
      'Far Cry', 'Civilization', 'The Sims', 'RollerCoaster Tycoon', 'SimCity', 'Tetris', 'Sonic', 'Crash Bandicoot', 'Spyro', 'Hollow Knight',
    ],
  },
  {
    id: 'tv-shows',
    name: 'TV Shows',
    isPremium: true,
    isCustom: false,
    words: [
      'Friends', 'Seinfeld', 'The Office', 'Parks and Recreation', 'Brooklyn Nine-Nine', 'How I Met Your Mother', 'Big Bang Theory', 'Modern Family', 'Cheers', 'Frasier',
      'Breaking Bad', 'Better Call Saul', 'The Sopranos', 'The Wire', 'Mad Men', 'Game of Thrones', 'The Walking Dead', 'Lost', 'Grey\'s Anatomy', 'House',
      'Scrubs', 'NCIS', 'Law and Order', 'Sherlock', 'Doctor Who', 'Downton Abbey', 'Bridgerton', 'The Crown', 'Stranger Things', 'Wednesday',
      'The Umbrella Academy', 'Succession', 'The White Lotus', 'Euphoria', 'Ozark', 'Narcos', 'Peaky Blinders', 'The Mandalorian', 'WandaVision', 'Loki',
      'Ted Lasso', 'The Bear', 'Curb Your Enthusiasm', 'Arrested Development', 'Community', '30 Rock', 'The West Wing', 'The X-Files', 'Twin Peaks', 'Buffy',
      'Gilmore Girls', 'Veep', 'Yellowjackets', 'The Simpsons', 'South Park', 'Family Guy', 'Black Mirror', 'True Detective', 'Fargo', 'The Boys',
    ],
  },
  {
    id: 'transportation',
    name: 'Transportation',
    isPremium: true,
    isCustom: false,
    words: [
      'Bicycle', 'Car', 'Truck', 'Bus', 'Van', 'Taxi', 'Train', 'Subway', 'Metro', 'Tram',
      'Trolley', 'Airplane', 'Helicopter', 'Boat', 'Ship', 'Ferry', 'Canoe', 'Kayak', 'Sailboat', 'Yacht',
      'Motorcycle', 'Scooter', 'Skateboard', 'Wheelchair', 'Stroller', 'Sled', 'Hot Air Balloon', 'Jet Ski', 'Speedboat', 'Cruise Ship',
      'Cargo Ship', 'Raft', 'Horse', 'Carriage', 'Rickshaw', 'Tuk Tuk', 'Gondola', 'Cable Car', 'Monorail', 'Bullet Train',
      'Freight Train', 'Steam Engine', 'Ambulance', 'Fire Truck', 'Police Car', 'Tractor', 'Bulldozer', 'Forklift', 'Golf Cart', 'Segway',
      'Hoverboard', 'Unicycle', 'Moped', 'Rollerblades', 'Hang Glider', 'Barge', 'Tanker', 'Submarine', 'Spaceship', 'Rocket',
    ],
  },
  {
    id: 'mansion-parts',
    name: 'Parts of a Mansion',
    isPremium: true,
    isCustom: false,
    words: [
      'Basement', 'Attic', 'Roof', 'Chimney', 'Kitchen', 'Library', 'Dining Room', 'Living Room', 'Bedroom', 'Bathroom',
      'Master Bedroom', 'Guest Room', 'Nursery', 'Study', 'Office', 'Ballroom', 'Gallery', 'Foyer', 'Entryway', 'Hallway',
      'Staircase', 'Balcony', 'Terrace', 'Patio', 'Porch', 'Veranda', 'Garage', 'Wine Cellar', 'Pantry', 'Laundry Room',
      'Mudroom', 'Closet', 'Walk-in Closet', 'Powder Room', 'Sunroom', 'Conservatory', 'Solarium', 'Tower', 'Turret', 'Courtyard',
      'Garden', 'Fountain', 'Pool', 'Pool House', 'Gatehouse', 'Servants Quarters', 'Butler\'s Pantry', 'Breakfast Nook', 'Den', 'Parlor',
      'Sitting Room', 'Great Hall', 'Grand Staircase', 'Elevator', 'East Wing', 'West Wing', 'Corridor', 'Landing', 'Greenhouse', 'Carport',
    ],
  },
  {
    id: 'weapons',
    name: 'Weapons',
    isPremium: true,
    isCustom: false,
    words: [
      'Sword', 'Knife', 'Dagger', 'Axe', 'Spear', 'Bow', 'Arrow', 'Crossbow', 'Gun', 'Pistol',
      'Rifle', 'Shotgun', 'Revolver', 'Cannon', 'Tank', 'Missile', 'Rocket', 'Grenade', 'Bomb', 'Mine',
      'Shield', 'Armor', 'Helmet', 'Mace', 'Club', 'Bat', 'Whip', 'Slingshot', 'Boomerang', 'Shuriken',
      'Katana', 'Sabre', 'Rapier', 'Halberd', 'Trident', 'Hatchet', 'Tomahawk', 'Bayonet', 'Flail', 'Morning Star',
      'Catapult', 'Trebuchet', 'Lance', 'Javelin', 'Blowgun', 'Dart', 'Taser', 'Stun Gun', 'Pepper Spray', 'Machete',
      'Chainsaw', 'Laser', 'Turret', 'Machine Gun', 'Sniper Rifle', 'Water Gun', 'Nunchucks', 'Brass Knuckles', 'Crowbar', 'Sickle',
    ],
  },
  {
    id: 'computing-devices',
    name: 'Computing Devices',
    isPremium: true,
    isCustom: false,
    words: [
      'iPhone', 'Samsung Galaxy', 'Google Pixel', 'iPad', 'Android Tablet', 'MacBook', 'Windows Laptop', 'Chromebook', 'Surface Pro', 'iMac',
      'Desktop PC', 'Gaming PC', 'Kindle', 'Apple Watch', 'Samsung Watch', 'Fitbit', 'AirPods', 'Smart Speaker', 'Amazon Echo', 'Google Home',
      'Apple TV', 'Roku', 'Fire Stick', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Steam Deck', 'VR Headset', 'Meta Quest', 'GoPro',
      'Digital Camera', 'Webcam', 'Router', 'Modem', 'Hard Drive', 'SSD', 'USB Drive', 'Memory Card', 'Printer', 'Scanner',
      'Keyboard', 'Mouse', 'Monitor', 'Graphics Card', 'CPU', 'Server', 'Raspberry Pi', 'Smartphone', 'Smart TV', 'Tablet',
      'Smartwatch', 'Earbuds', 'Headphones', 'Bluetooth Speaker', 'Drone', 'Calculator', 'Smart Display', 'NAS Drive', 'Projector', 'Docking Station',
    ],
  },
  {
    id: 'global-holidays',
    name: 'Global Holidays',
    isPremium: true,
    isCustom: false,
    words: [
      'Christmas', 'Easter', 'Thanksgiving', 'Halloween', 'New Year', 'Valentine\'s Day', 'Independence Day', 'Labor Day', 'Memorial Day', 'Mother\'s Day',
      'Father\'s Day', 'Hanukkah', 'Passover', 'Ramadan', 'Eid', 'Diwali', 'Holi', 'Chinese New Year', 'Lunar New Year', 'Mid-Autumn Festival',
      'Dragon Boat Festival', 'Cinco de Mayo', 'St. Patrick\'s Day', 'Mardi Gras', 'Carnival', 'Oktoberfest', 'Day of the Dead', 'Kwanzaa', 'Boxing Day', 'Good Friday',
      'Ash Wednesday', 'Epiphany', 'Pentecost', 'All Saints Day', 'All Souls Day', 'Veterans Day', 'Presidents Day', 'Martin Luther King Day', 'Juneteenth', 'Earth Day',
      'Arbor Day', 'Groundhog Day', 'April Fools', 'Black Friday', 'Cyber Monday', 'Super Bowl Sunday', 'Olympics Opening', 'World Cup Final', 'Nobel Prize Day', 'United Nations Day',
      'International Women\'s Day', 'Children\'s Day', 'Teachers Day', 'Grandparents Day', 'Boss Day', 'Secretary Day', 'Flag Day', 'Constitution Day', 'Victory Day', 'Armistice Day',
    ],
  },
  {
    id: 'religions',
    name: 'Religions',
    isPremium: true,
    isCustom: false,
    words: [
      'Christianity', 'Islam', 'Judaism', 'Hinduism', 'Buddhism', 'Sikhism', 'Taoism', 'Confucianism', 'Shinto', 'Bahai',
      'Catholicism', 'Protestantism', 'Orthodox', 'Sunni', 'Shia', 'Mormonism', 'Jehovah\'s Witness', 'Seventh-day Adventist', 'Methodist', 'Baptist',
      'Lutheran', 'Presbyterian', 'Episcopal', 'Anglican', 'Pentecostal', 'Evangelical', 'Zen', 'Theravada', 'Mahayana', 'Vajrayana',
      'Jainism', 'Zoroastrianism', 'Paganism', 'Wicca', 'Druidism', 'Animism', 'Atheism', 'Agnosticism', 'Humanism', 'Unitarian',
      'Quaker', 'Amish', 'Mennonite', 'Hasidic', 'Kabbalah', 'Sufism', 'Vedanta', 'Yoga', 'Meditation', 'Prayer',
      'Worship', 'Church', 'Mosque', 'Synagogue', 'Temple', 'Shrine', 'Monastery', 'Cathedral', 'Chapel', 'Pilgrimage',
    ],
  },
  {
    id: 'clothing',
    name: 'Clothing',
    isPremium: true,
    isCustom: false,
    words: [
      'Shirt', 'T-Shirt', 'Blouse', 'Sweater', 'Hoodie', 'Jacket', 'Coat', 'Vest', 'Blazer', 'Suit',
      'Pants', 'Jeans', 'Shorts', 'Skirt', 'Dress', 'Gown', 'Romper', 'Jumpsuit', 'Overalls', 'Leggings',
      'Socks', 'Stockings', 'Tights', 'Underwear', 'Boxers', 'Briefs', 'Bra', 'Undershirt', 'Pajamas', 'Robe',
      'Bathrobe', 'Swimsuit', 'Bikini', 'Trunks', 'Wetsuit', 'Raincoat', 'Windbreaker', 'Parka', 'Peacoat', 'Trench Coat',
      'Cardigan', 'Polo Shirt', 'Tank Top', 'Crop Top', 'Turtleneck', 'Flannel', 'Scrubs', 'Uniform', 'Apron', 'Tie',
      'Bow Tie', 'Scarf', 'Gloves', 'Mittens', 'Hat', 'Cap', 'Beanie', 'Visor', 'Belt', 'Suspenders',
    ],
  },
  {
    id: 'luxury-brands',
    name: 'Luxury Brands',
    isPremium: true,
    isCustom: false,
    words: [
      'Gucci', 'Louis Vuitton', 'Chanel', 'Hermes', 'Prada', 'Dior', 'Versace', 'Armani', 'Burberry', 'Balenciaga',
      'Fendi', 'Givenchy', 'Valentino', 'Saint Laurent', 'Bottega Veneta', 'Celine', 'Loewe', 'Cartier', 'Tiffany', 'Rolex',
      'Omega', 'Patek Philippe', 'Audemars Piguet', 'Tag Heuer', 'Breitling', 'Montblanc', 'Ferragamo', 'Tod\'s', 'Moncler', 'Canada Goose',
      'Ralph Lauren Purple Label', 'Tom Ford', 'Brioni', 'Zegna', 'Brunello Cucinelli', 'Loro Piana', 'Goyard', 'Moynat', 'Delvaux', 'Bulgari',
      'Van Cleef', 'Harry Winston', 'Chopard', 'Piaget', 'IWC', 'Jaeger-LeCoultre', 'Hublot', 'Panerai', 'Richard Mille', 'Rimowa',
      'Rolls-Royce', 'Lamborghini', 'Ferrari', 'Porsche Design', 'Aston Martin', 'Maserati', 'Bugatti', 'Maybach', 'Bentley', 'McLaren',
    ],
  },
  {
    id: 'accessories',
    name: 'Accessories',
    isPremium: true,
    isCustom: false,
    words: [
      'Earrings', 'Necklace', 'Bracelet', 'Ring', 'Watch', 'Sunglasses', 'Glasses', 'Hat', 'Scarf', 'Belt',
      'Wallet', 'Purse', 'Handbag', 'Backpack', 'Tote Bag', 'Clutch', 'Crossbody Bag', 'Fanny Pack', 'Keychain', 'Lanyard',
      'Hair Clip', 'Headband', 'Barrette', 'Scrunchie', 'Brooch', 'Pin', 'Cufflinks', 'Tie Clip', 'Pocket Square', 'Gloves',
      'Mittens', 'Umbrella', 'Fan', 'Mask', 'Bandana', 'Bow', 'Tiara', 'Crown', 'Anklet', 'Toe Ring',
      'Nose Ring', 'Belly Ring', 'Choker', 'Pendant', 'Locket', 'Charm', 'Bangle', 'Cuff', 'Ear Cuff', 'Chain',
      'Beanie', 'Visor', 'Beret', 'Fedora', 'Baseball Cap', 'Snapback', 'Tie', 'Bow Tie', 'Suspenders', 'Leg Warmers',
    ],
  },
  {
    id: 'entertainment-venues',
    name: 'Entertainment Venues',
    isPremium: true,
    isCustom: false,
    words: [
      'Bowling Alley', 'Movie Theater', 'Bar', 'Zoo', 'Aquarium', 'Museum', 'Art Gallery', 'Concert Hall', 'Stadium', 'Arena',
      'Amusement Park', 'Theme Park', 'Water Park', 'Arcade', 'Casino', 'Nightclub', 'Comedy Club', 'Karaoke Bar', 'Sports Bar', 'Pub',
      'Restaurant', 'Cafe', 'Food Court', 'Drive-In Theater', 'IMAX', 'Planetarium', 'Observatory', 'Botanical Garden', 'National Park', 'Beach Boardwalk',
      'Skating Rink', 'Ice Rink', 'Roller Rink', 'Go-Kart Track', 'Mini Golf', 'Laser Tag', 'Escape Room', 'Trampoline Park', 'Indoor Playground', 'Children\'s Museum',
      'Science Center', 'History Museum', 'Natural History Museum', 'Opera House', 'Ballet Theater', 'Jazz Club', 'Music Festival', 'Fairground', 'Circus', 'Rodeo',
      'Race Track', 'Golf Course', 'Driving Range', 'Batting Cage', 'Climbing Gym', 'Axe Throwing', 'Paintball Field', 'Shooting Range', 'Spa', 'Resort',
    ],
  },
  {
    id: 'exercise',
    name: 'Exercise',
    isPremium: true,
    isCustom: false,
    words: [
      'Running', 'Jogging', 'Walking', 'Hiking', 'Sprinting', 'Cycling', 'Swimming', 'Rowing', 'Jumping', 'Skipping',
      'Push-ups', 'Pull-ups', 'Sit-ups', 'Crunches', 'Plank', 'Squats', 'Lunges', 'Deadlift', 'Bench Press', 'Weightlifting',
      'Yoga', 'Pilates', 'Stretching', 'Aerobics', 'Zumba', 'CrossFit', 'Calisthenics', 'Cardio', 'Spin Class', 'Treadmill',
      'Elliptical', 'Stair Climber', 'Rowing Machine', 'Exercise Bike', 'Jump Rope', 'Boxing', 'Kickboxing', 'Martial Arts', 'Karate', 'Judo',
      'Taekwondo', 'Fencing', 'Rock Climbing', 'Skating', 'Skiing', 'Snowboarding', 'Surfing', 'Paddleboarding', 'Kayaking', 'Dancing',
      'Barre', 'Boot Camp', 'HIIT', 'Circuit Training', 'Resistance Bands', 'Kettlebell', 'Medicine Ball', 'Foam Rolling', 'Cooldown', 'Warm-up',
    ],
  },
  {
    id: 'actions',
    name: 'Actions',
    isPremium: true,
    isCustom: false,
    words: [
      'Running', 'Walking', 'Eating', 'Sleeping', 'Drinking', 'Talking', 'Listening', 'Reading', 'Writing', 'Drawing',
      'Painting', 'Singing', 'Dancing', 'Laughing', 'Crying', 'Smiling', 'Frowning', 'Thinking', 'Dreaming', 'Waiting',
      'Sitting', 'Standing', 'Lying Down', 'Jumping', 'Climbing', 'Falling', 'Throwing', 'Catching', 'Kicking', 'Hitting',
      'Hugging', 'Kissing', 'Waving', 'Pointing', 'Clapping', 'Whistling', 'Shouting', 'Whispering', 'Cooking', 'Cleaning',
      'Washing', 'Brushing', 'Showering', 'Dressing', 'Driving', 'Riding', 'Flying', 'Swimming', 'Diving', 'Shopping',
      'Working', 'Studying', 'Teaching', 'Learning', 'Building', 'Fixing', 'Opening', 'Closing', 'Pushing', 'Pulling',
    ],
  },
  {
    id: 'emotions',
    name: 'Emotions',
    isPremium: true,
    isCustom: false,
    words: [
      'Happy', 'Sad', 'Angry', 'Afraid', 'Scared', 'Excited', 'Nervous', 'Calm', 'Relaxed', 'Stressed',
      'Anxious', 'Worried', 'Hopeful', 'Proud', 'Ashamed', 'Embarrassed', 'Guilty', 'Jealous', 'Lonely', 'Bored',
      'Curious', 'Surprised', 'Shocked', 'Confused', 'Frustrated', 'Annoyed', 'Grateful', 'Thankful', 'Content', 'Peaceful',
      'Joyful', 'Cheerful', 'Miserable', 'Heartbroken', 'Devastated', 'Furious', 'Irritated', 'Disgusted', 'Repulsed', 'Delighted',
      'Amused', 'Thrilled', 'Ecstatic', 'Overjoyed', 'Melancholy', 'Gloomy', 'Depressed', 'Optimistic', 'Pessimistic', 'Inspired',
      'Motivated', 'Determined', 'Confident', 'Insecure', 'Shy', 'Bold', 'Brave', 'Courageous', 'Terrified', 'Homesick',
    ],
  },
];

export const BRAND = {
  red: '#A43741',
  orange: '#AA6839',
  teal: '#246B61',
  green: '#408E2F',
  dark: '#262626',
  white: '#FFFFFF',
  gray100: '#F5F5F5',
  gray200: '#E8E8E8',
  gray400: '#999999',
  gray600: '#666666',
};
