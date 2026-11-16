import { redirect } from "next/navigation";

export default async function DomesticHolidaysPage({
  params,
}: {
  params: Promise<{ site: string; lang: string }>;
}) {
  const { site, lang } = await params;
  redirect(`/${site}/${lang}/holidays?domestic=true&categorySlug=domestic-holidays`);
}
