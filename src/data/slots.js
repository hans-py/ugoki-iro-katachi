// A display room seats up to four phones, in the order they connect.
export const SLOTS = ['A', 'B', 'C', 'D'];

export function slotMap(value) {
  return Object.fromEntries(SLOTS.map((s) => [s, value]));
}
