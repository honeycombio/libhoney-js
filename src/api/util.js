export function ifThrow(check, msg) {
  if (check) {
    throw new Error(msg);
  }
}
