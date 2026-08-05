export const PRIMARY = "#3b6347";
export const FONT = "Poppins, sans-serif";

/** Content column, calibrated to the original absolute coordinates (left 426, sidebar 195). */
export const COLUMN_LEFT = 231;
export const COLUMN_WIDTH = 569;
export const COLUMN_TOP = 211;
export const CARD_GAP = 30;

export const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" as const, delay },
});
