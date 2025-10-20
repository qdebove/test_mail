export const GAME_CATEGORIES = [
  "ABSTRACT",
  "ADVENTURE",
  "AREA_CONTROL",
  "CARD_GAME",
  "COOPERATIVE",
  "DEDUCTION",
  "DICE",
  "ENGINE_BUILDING",
  "FAMILY",
  "PARTY",
  "PUSH_YOUR_LUCK",
  "ROLL_AND_WRITE",
  "SET_COLLECTION",
  "SOCIAL_DEDUCTION",
  "STRATEGY",
  "THEMATIC",
  "TILE_PLACEMENT",
  "WAR",
  "WORKER_PLACEMENT",
] as const;

export type GameCategory = (typeof GAME_CATEGORIES)[number];

const LABEL_OVERRIDES: Partial<Record<GameCategory, string>> = {
  AREA_CONTROL: "Area control",
  CARD_GAME: "Card game",
  ENGINE_BUILDING: "Engine building",
  PUSH_YOUR_LUCK: "Push your luck",
  ROLL_AND_WRITE: "Roll & write",
  SET_COLLECTION: "Set collection",
  SOCIAL_DEDUCTION: "Social deduction",
  TILE_PLACEMENT: "Tile placement",
  WORKER_PLACEMENT: "Worker placement",
};

export function formatCategoryLabel(category: GameCategory) {
  return LABEL_OVERRIDES[category] ?? category.charAt(0) + category.slice(1).toLowerCase().replace(/_/g, " ");
}
