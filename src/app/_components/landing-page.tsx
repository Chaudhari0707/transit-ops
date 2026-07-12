import Link from "next/link";
import {
  ArrowRightIcon,
  BarChart3Icon,
  FuelIcon,
  RouteIcon,
  ShieldCheckIcon,
  TruckIcon,
  UsersIcon,
  WrenchIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: TruckIcon,
    title: "Fleet Registry",
    description:
      "Register every vehicle with capacity, odometer, and live status — available, on trip, in shop, or retired.",
  },
  {
    icon: UsersIcon,
    title: "Driver Compliance",
    description:
      "Track licenses, safety scores, and availability. Block expired or suspended drivers from dispatch automatically.",
  },
  {
    icon: RouteIcon,
    title: "Trip Dispatch",
    description:
      "Create and dispatch trips with cargo weight checks, route details, and atomic complete workflows.",
  },
  {
    icon: WrenchIcon,
    title: "Maintenance",
    description:
      "Open and close maintenance logs that pull vehicles into the shop and roll costs into operational totals.",
  },
  {
    icon: FuelIcon,
    title: "Fuel & Expenses",
    description:
      "Log fuel liters and tolls per trip. Operational cost auto-calculates fuel plus maintenance in INR.",
  },
  {
    icon: BarChart3Icon,
    title: "Analytics Dashboard",
    description:
      "KPIs for active fleet, on-trip vehicles, fuel efficiency, and cost trends — filter by type and status.",
  },
];

const roles = [
  { name: "Fleet Manager", scope: "Vehicles, maintenance, masters, analytics" },
  { name: "Dispatcher", scope: "Trips lifecycle, dispatch, trip completion" },
  { name: "Safety Officer", scope: "Driver compliance and trip visibility" },
  { name: "Financial Analyst", scope: "Fuel logs, expenses, cost analytics" },
];

const stats = [
  { value: "24", label: "Active vehicles" },
  { value: "8", label: "On trip right now" },
  { value: "₹4.2L", label: "Monthly op. cost" },
  { value: "11.4 km/L", label: "Fleet efficiency" },
];

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <TruckIcon className="size-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">TransitOps</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm md:flex">
            <a
              href="#features"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#roles"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Roles
            </a>
            <a
              href="#platform"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Platform
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" nativeButton={false} render={<Link href="/sign-in" />}>
              Sign in
            </Button>
            <Button nativeButton={false} render={<Link href="/dashboard" />}>
              Open dashboard
              <ArrowRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <section className="landing-grid relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-primary/10 via-background to-background" />
        <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-24">
          <Badge variant="outline" className="mb-6 border-primary/30 bg-primary/5 text-primary">
            Smart Transport Operations Platform
          </Badge>
          <h1 className="max-w-3xl text-4xl leading-[1.1] font-bold tracking-tight sm:text-6xl">
            Run your logistics fleet with{" "}
            <span className="text-primary">confidence and control</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            TransitOps helps transport companies digitize vehicle management, driver compliance,
            trip dispatch, maintenance, and fuel expenses — with enforced business rules and
            real-time operational KPIs.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button size="lg" nativeButton={false} render={<Link href="/dashboard" />}>
              Explore live dashboard
              <ArrowRightIcon className="size-4" />
            </Button>
            <Button size="lg" variant="outline" render={<a href="#features">See how it works</a>} />
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="border-primary/10 bg-card/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <p className="text-3xl font-bold tabular-nums">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight">Everything your fleet needs</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From vehicle registration to trip completion — one platform covering the full transport
            operations lifecycle.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group border-border/80 transition-shadow hover:shadow-md"
            >
              <CardHeader>
                <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="size-5" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section id="roles" className="border-y bg-muted/50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <h2 className="text-3xl font-bold tracking-tight">Role-based access</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Each team member sees exactly what they need — fleet managers, dispatchers, safety
                officers, and financial analysts each get a scoped workspace.
              </p>
            </div>
            <ShieldCheckIcon className="size-12 shrink-0 text-primary" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {roles.map((role) => (
              <Card key={role.name}>
                <CardHeader>
                  <CardTitle className="text-lg">{role.name}</CardTitle>
                  <CardDescription>{role.scope}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="platform" className="mx-auto max-w-6xl px-6 py-20">
        <Card className="overflow-hidden border-primary/20 bg-linear-to-br from-primary/5 to-card">
          <CardContent className="flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Ready to streamline your transport operations?
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                Jump into the operations dashboard to monitor fleet status, track active trips, and
                analyze fuel and maintenance costs across your entire logistics network.
              </p>
            </div>
            <Button size="lg" nativeButton={false} render={<Link href="/dashboard" />}>
              Go to dashboard
              <ArrowRightIcon className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <TruckIcon className="size-4 text-primary" />
            <span>TransitOps — Odoo Hackathon 2026</span>
          </div>
          <p>Smart Transport Operations Platform</p>
        </div>
      </footer>
    </div>
  );
}
