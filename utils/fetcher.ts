// utils/fetcher.ts
export default async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw j;
  }
  return res.json();
}
