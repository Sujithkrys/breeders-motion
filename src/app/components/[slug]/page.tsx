import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MOTIONS, getMotion } from "@/motion/registry";
import { ComponentPage } from "@/components/detail/ComponentPage";

export const generateStaticParams = () => MOTIONS.map((m) => ({ slug: m.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const m = getMotion((await params).slug);
  return m ? { title: m.name, description: m.description } : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getMotion(slug)) notFound();
  return <ComponentPage slug={slug} />;
}
