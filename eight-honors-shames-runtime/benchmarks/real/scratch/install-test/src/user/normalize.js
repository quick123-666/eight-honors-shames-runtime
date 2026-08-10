export function normalizeUser(user) {
  if (!user) return null;
  if (typeof user.nickname === "string" && user.nickname.trim() === "") return null;
  return { id: user.id, name: user.name, nickname: user.nickname || null };
}
