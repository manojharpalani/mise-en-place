/**
 * Mapping from dish name keywords to locally cached thumbnail paths.
 * Images sourced from TheMealDB API (Indian category), stored at 150x150px.
 *
 * Keys are lowercase keywords extracted from the meal name.
 * Values are public-folder paths served by Next.js at runtime.
 */
export const DISH_IMAGE_MAP: Record<string, string> = {
  // Baingan Bharta
  "baingan bharta": "/dish-images/baingan-bharta.jpg",
  baingan: "/dish-images/baingan-bharta.jpg",
  bharta: "/dish-images/baingan-bharta.jpg",

  // Beef Mandi
  "beef mandi": "/dish-images/beef-mandi.jpg",

  // Bread Omelette
  "bread omelette": "/dish-images/bread-omelette.jpg",
  omelette: "/dish-images/bread-omelette.jpg",

  // Chicken Handi
  "chicken handi": "/dish-images/chicken-handi.jpg",
  handi: "/dish-images/chicken-handi.jpg",

  // Chicken Mandi
  "chicken mandi": "/dish-images/chicken-mandi.jpg",
  mandi: "/dish-images/chicken-mandi.jpg",

  // Dal Fry
  "dal fry": "/dish-images/dal-fry.jpg",
  dal: "/dish-images/dal-fry.jpg",
  daal: "/dish-images/dal-fry.jpg",

  // Kidney Bean Curry
  "kidney bean curry": "/dish-images/kidney-bean-curry.jpg",
  "kidney bean": "/dish-images/kidney-bean-curry.jpg",
  rajma: "/dish-images/kidney-bean-curry.jpg",

  // Lamb Biryani
  "lamb biryani": "/dish-images/lamb-biryani.jpg",
  biryani: "/dish-images/lamb-biryani.jpg",

  // Lamb Rogan Josh
  "lamb rogan josh": "/dish-images/lamb-rogan-josh.jpg",
  "rogan josh": "/dish-images/lamb-rogan-josh.jpg",
  rogan: "/dish-images/lamb-rogan-josh.jpg",

  // Matar Paneer
  "matar paneer": "/dish-images/matar-paneer.jpg",
  paneer: "/dish-images/matar-paneer.jpg",
  matar: "/dish-images/matar-paneer.jpg",

  // Nutty Chicken Curry
  "nutty chicken curry": "/dish-images/nutty-chicken-curry.jpg",
  "chicken curry": "/dish-images/nutty-chicken-curry.jpg",
  curry: "/dish-images/nutty-chicken-curry.jpg",

  // Recheado Masala Fish
  "recheado masala fish": "/dish-images/recheado-masala-fish.jpg",
  recheado: "/dish-images/recheado-masala-fish.jpg",
  "masala fish": "/dish-images/recheado-masala-fish.jpg",

  // Smoked Haddock Kedgeree
  "smoked haddock kedgeree": "/dish-images/smoked-haddock-kedgeree.jpg",
  kedgeree: "/dish-images/smoked-haddock-kedgeree.jpg",
  haddock: "/dish-images/smoked-haddock-kedgeree.jpg",

  // Tandoori Chicken
  "tandoori chicken": "/dish-images/tandoori-chicken.jpg",
  tandoori: "/dish-images/tandoori-chicken.jpg",
  chicken: "/dish-images/tandoori-chicken.jpg",
};

/**
 * Look up a dish thumbnail by name.
 *
 * Checks whether any key in DISH_IMAGE_MAP is a substring of the lowercased
 * dish name. Longer (more specific) keys are checked first so that
 * "chicken curry" wins over "chicken" when both would match.
 *
 * @param name - The dish name as entered by the user or returned by the API.
 * @returns The public image path (e.g. "/dish-images/dal-fry.jpg") or null.
 */
export function getDishImage(name: string): string | null {
  const lower = name.toLowerCase();

  // Sort keys longest-first so more specific matches take priority.
  const sortedKeys = Object.keys(DISH_IMAGE_MAP).sort(
    (a, b) => b.length - a.length
  );

  for (const key of sortedKeys) {
    if (lower.includes(key)) {
      return DISH_IMAGE_MAP[key];
    }
  }

  return null;
}
