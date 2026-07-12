export type DocumentEntityType = "maintenance_log" | "vehicle";

export type DocumentListItem = {
  createdAt: string;
  entityId: string;
  entityLabel: string | null;
  entityType: DocumentEntityType;
  fileName: string;
  id: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  uploadedByUserId: string;
};

export type DocumentListQuery = {
  entityId?: string;
  entityType?: DocumentEntityType;
};

export type MaintenanceLogOption = {
  id: string;
  label: string;
  vehicleRegistration: string;
};

export type VehicleOption = {
  id: string;
  nameModel: string;
  registrationNumber: string;
  status: string;
};
