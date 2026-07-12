export type DocumentEntityTypeUi = "maintenance_log" | "vehicle";

export type DocumentRowUi = {
  createdAt: string;
  entityId: string;
  entityLabel: string | null;
  entityType: DocumentEntityTypeUi;
  fileName: string;
  id: string;
  mimeType: string;
  sizeBytes: number;
};

export type DocumentsPageClientProps = {
  canWrite: boolean;
};

export type MaintenanceLogOptionUi = {
  id: string;
  label: string;
  vehicleRegistration: string;
};

export type VehicleOptionUi = {
  id: string;
  nameModel: string;
  registrationNumber: string;
  status: string;
};
