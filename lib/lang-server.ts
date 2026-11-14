import { cookies } from "next/headers";
import { translate, type Lang, type TKey } from "./i18n";

export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get("lang")?.value;
  return v === "hi" ? "hi" : "en";
}
export async function getT() {
  const lang = await getLang();
  return { lang, t: (k: TKey) => translate(lang, k) };
}
