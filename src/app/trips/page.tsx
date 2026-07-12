import { Suspense } from "react";

import { TripsPageClient } from "@/app/trips/_components/trips-page-client";
import { loadExpenseCategories } from "@/app/trips/_lib/load-expense-categories";

export default async function TripsPage() {
  const expenseCategories = await loadExpenseCategories();

  return (
    <Suspense fallback={null}>
      <TripsPageClient expenseCategories={expenseCategories} />
    </Suspense>
  );
}
