export function filterActive(users, isActive) {
  if (typeof isActive !== "boolean") return users;
  return users.filter((u) => Boolean(u.active) === isActive);
}
