import type { ReactNode } from "react";

export default function Card({ title, children }: { title: string; children: ReactNode }) {
  return <section className="mx-auto max-w-full rounded-xl border bg-card p-3 text-card-foreground shadow-sm sm:p-6">
    {title && <h2 className="mb-5 text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>}
    {children}
  </section>;
}
