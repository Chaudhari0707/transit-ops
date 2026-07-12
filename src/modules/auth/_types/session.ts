export type AppSessionUser = {
  email: string;
  id: string;
  name: string;
  role: AppUserRole;
};

export type AppUserRole = "dispatcher" | "financial_analyst" | "fleet_manager" | "safety_officer";
