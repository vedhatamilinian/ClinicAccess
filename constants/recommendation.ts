// Keeping weights together makes the scoring model easy to explain and adjust.
export const recommendationWeights: Record<string, number> = {
  insurance: 40,
  affordability: 40,
  distance: 20,
  language: 15,
  accessibility: 10,
  transportation: 10,
  appointment: 0,
  hours: 5,
  services: 0,
};

export const maxPreferredDistanceMiles = 3;
