export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="border-line bg-surface w-full max-w-4xl rounded-3xl border p-8 text-center shadow-sm backdrop-blur sm:p-12">
        <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-foreground/70 uppercase">
          Odoo Hackathon 2026
        </p>

        <h1 className="font-display text-4xl leading-none sm:text-6xl">Transit Ops</h1>

        <p className="mx-auto mt-5 max-w-2xl text-base text-foreground/80 sm:text-lg">
          A simple operations dashboard concept to help teams track routes, monitor shipments, and
          keep transit workflows moving smoothly.
        </p>
      </section>
    </main>
  );
}
