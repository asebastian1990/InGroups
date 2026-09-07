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

/** One-time license purchase — unlocks premium word sets for one account. */
export const LICENSE_UNIT_PRICE_CENTS = 2000;
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
      'Alpaca', 'Bat', 'Camel', 'Dog', 'Elephant', 'Frog', 'Guinea Pig', 'Horse',
      'Iguana', 'Jackal', 'Kiwi', 'Lemur', 'Monkey', 'Newt', 'Owl', 'Parrot',
      'Quill', 'Rat', 'Snake', 'Tapir', 'Tiger', 'Unicorn', 'Vulture', 'Walrus',
      'Yak', 'Zebra', 'Antelope', 'Badger', 'Cobra', 'Dolphin',
    ],
  },
  {
    id: 'objects',
    name: 'Objects',
    isPremium: false,
    isCustom: false,
    words: [
      'Anchor', 'Balloon', 'Candle', 'Desk', 'Envelope', 'Feather', 'Globe', 'Hammer',
      'Inkwell', 'Journal', 'Key', 'Lantern', 'Mirror', 'Notebook', 'Ornament', 'Pillow',
      'Quilt', 'Ribbon', 'Scissors', 'Telescope', 'Umbrella', 'Vase', 'Wheel', 'Xylophone',
      'Yarn', 'Zipper', 'Basket', 'Compass', 'Drum', 'Flag',
    ],
  },
  {
    id: 'countries',
    name: 'Countries',
    isPremium: false,
    isCustom: false,
    words: [
      'Argentina', 'Brazil', 'Canada', 'Denmark', 'Egypt', 'France', 'Germany', 'Hungary',
      'India', 'Japan', 'Kenya', 'Lebanon', 'Mexico', 'Norway', 'Oman', 'Peru',
      'Qatar', 'Romania', 'Spain', 'Thailand', 'Uruguay', 'Vietnam', 'Wales', 'Yemen',
      'Zambia', 'Australia', 'Belgium', 'Chile', 'Finland', 'Greece',
    ],
  },
  {
    id: 'celebrities',
    name: 'Celebrities',
    isPremium: true,
    isCustom: false,
    words: [
      'Beyoncé', 'Chaplin', 'Darwin', 'Einstein', 'Frida', 'Gandhi', 'Hepburn', 'Jobs',
      'Kahlo', 'Lincoln', 'Monroe', 'Newton', 'Oprah', 'Picasso', 'Queen', 'Roosevelt',
      'Shakespeare', 'Tesla', 'Twain', 'Usher', 'Voltaire', 'Washington', 'Xena', 'Yeats',
      'Zorro', 'Ali', 'Bronte', 'Curie', 'Dylan', 'Edison',
    ],
  },
  {
    id: 'colors',
    name: 'Colors',
    isPremium: true,
    isCustom: false,
    words: [
      'Amber', 'Beige', 'Crimson', 'Denim', 'Emerald', 'Fuchsia', 'Gold', 'Honey',
      'Indigo', 'Jade', 'Khaki', 'Lavender', 'Magenta', 'Navy', 'Olive', 'Plum',
      'Quartz', 'Rose', 'Scarlet', 'Teal', 'Ultramarine', 'Violet', 'Wine', 'Xanthic',
      'Yellow', 'Zaffre', 'Azure', 'Bronze', 'Coral', 'Dun',
    ],
  },
  {
    id: 'numbers',
    name: 'Numbers',
    isPremium: true,
    isCustom: false,
    words: [
      'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
      'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
      'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty', 'Thirty', 'Forty', 'Fifty',
      'Sixty', 'Seventy', 'Eighty', 'Ninety', 'Hundred', 'Thousand',
    ],
  },
  {
    id: 'grabbag',
    name: 'Grab Bag',
    isPremium: true,
    isCustom: false,
    words: [
      'Adventure', 'Breeze', 'Cascade', 'Destiny', 'Echo', 'Fortune', 'Galaxy', 'Horizon',
      'Infinity', 'Journey', 'Karma', 'Legacy', 'Mirage', 'Nostalgia', 'Odyssey', 'Paradox',
      'Quest', 'Reverie', 'Serendipity', 'Twilight', 'Utopia', 'Vortex', 'Whimsy', 'Zenith',
      'Alchemy', 'Beacon', 'Cipher', 'Enigma', 'Fable', 'Glimmer',
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
