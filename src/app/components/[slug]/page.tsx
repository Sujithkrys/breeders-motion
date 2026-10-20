import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MOTION_META } from "@/motion/meta.generated";
import { ComponentPage } from "@/components/detail/ComponentPage";

// Server code reads the generated metadata, never the registry: components use client-only hooks.
const findMeta = (slug: string) => MOTION_META.find((m) => m.slug === slug);

export const dynamicParams = false;
export const generateStaticParams = () => MOTION_META.map((m) => ({ slug: m.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const m = findMeta((await params).slug);
  return m ? { title: m.name, description: m.description } : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!findMeta(slug)) notFound();
  return <ComponentPage slug={slug} />;
}
