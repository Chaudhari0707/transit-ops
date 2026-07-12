export type SeedCredentialUser = {
  email: string;
  fullName: string;
  password: string;
  phoneNumber: string;
  role: SeedRole;
  username?: string;
};

export type SeedRole = "dispatcher" | "financial_analyst" | "fleet_manager" | "safety_officer";
