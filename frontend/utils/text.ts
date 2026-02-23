export const ensureChinese = (message: string, fallback: string) =>
  /[\u4e00-\u9fff]/.test(message) ? message : fallback;

export const formatDate = (timestamp: number | null | undefined, prefix: string) => {
  if (!timestamp) return `${prefix}中`;
  const ADOPTION_DAY_MS = 24 * 60 * 60 * 1000;
  const days = Math.max(1, Math.floor((Date.now() - timestamp) / ADOPTION_DAY_MS) + 1);
  return `${prefix}第${days}天`;
};
