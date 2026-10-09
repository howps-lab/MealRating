import { MealRating } from '../types/meal';

// Import local generated images as initial seed photos
import salmonImg from '../assets/images/sample_grilled_salmon_1791518756257.jpg';
import ramenImg from '../assets/images/sample_ramen_bowl_1791518768389.jpg';
import pancakeImg from '../assets/images/sample_berry_pancakes_1791518778348.jpg';

export const INITIAL_SAMPLE_MEALS: MealRating[] = [
  {
    id: 'b12a83e0-0c48-43d9-9524-850bf35f0a01',
    description: 'Grilled Norwegian Salmon with Roasted Lemon & Asparagus',
    amount: 26.50,
    location: 'The Coastal Grill, Marina Bay',
    rating: 5,
    meal_date: '2026-10-08',
    photo_url: salmonImg,
    created_at: '2026-10-08T19:30:00Z',
  },
  {
    id: 'c23b94f1-1d59-44ea-a635-961cg46g1b02',
    description: 'Special Tonkotsu Ramen with Chashu & Soft-Boiled Egg',
    amount: 18.80,
    location: 'Menya Hanabi Ramen Bar, Bugis',
    rating: 5,
    meal_date: '2026-10-06',
    photo_url: ramenImg,
    created_at: '2026-10-06T13:15:00Z',
  },
  {
    id: 'd34c05a2-2e60-45fb-b746-072dh57h2c03',
    description: 'Fluffy Soufflé Berry Pancakes with Maple Drizzle',
    amount: 16.50,
    location: 'Mori Cafe & Bakery, Orchard',
    rating: 4,
    meal_date: '2026-10-04',
    photo_url: pancakeImg,
    created_at: '2026-10-04T15:45:00Z',
  },
  {
    id: 'e45d16b3-3f71-46ac-c857-183ei68i3d04',
    description: 'Hainanese Steamed Chicken Rice with Chili Sauce',
    amount: 7.20,
    location: 'Maxwell Food Centre, Chinatown',
    rating: 4,
    meal_date: '2026-10-02',
    photo_url: null,
    created_at: '2026-10-02T12:30:00Z',
  },
  {
    id: 'f56e27c4-4a82-47bd-d968-294fj79j4e05',
    description: 'Artisanal Sourdough Avocado Toast with Poached Egg',
    amount: 14.00,
    location: 'Common Ground Coffeehouse, Tiong Bahru',
    rating: 3,
    meal_date: '2026-09-28',
    photo_url: null,
    created_at: '2026-09-28T09:40:00Z',
  },
  {
    id: 'a67f38d5-5b93-48ce-ea79-305gk80k5f06',
    description: 'Char Kway Teow with Cockles and Lap Cheong',
    amount: 6.50,
    location: 'Old Airport Road Food Centre',
    rating: 5,
    meal_date: '2026-09-20',
    photo_url: null,
    created_at: '2026-09-20T18:20:00Z',
  }
];
