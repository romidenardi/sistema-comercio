// Sin tildes y en minúsculas, para que "lopez" encuentre "López"
export const normalizeText = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export const matchesSearch = (query, fields) => {
  const words = normalizeText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalizeText(fields.filter((f) => f !== null && f !== undefined).join(' '));
  return words.every((word) => haystack.includes(word));
};
