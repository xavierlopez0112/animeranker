// ELO scoring -----------------------------------------------------------------
export const START_ELO = 1000, K_GLOBAL = 32, K_LOCAL = 44;
export const expected = (a, b) => 1 / (1 + Math.pow(10, (b - a) / 400));
