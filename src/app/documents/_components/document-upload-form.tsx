"use client";

import type {
  DocumentEntityTypeUi,
  MaintenanceLogOptionUi,
  VehicleOptionUi,
} from "@/app/documents/_types/documents-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DocumentUploadFormProps = {
  canWrite: boolean;
  entityId: string;
  entityType: DocumentEntityTypeUi;
  file: File | null;
  maintenanceLogs: MaintenanceLogOptionUi[];
  onEntityIdChange: (value: string) => void;
  onEntityTypeChange: (value: DocumentEntityTypeUi) => void;
  onFileChange: (file: File | null) => void;
  onSubmit: () => void;
  submitting: boolean;
  vehicles: VehicleOptionUi[];
};

export function DocumentUploadForm({
  canWrite,
  entityId,
  entityType,
  file,
  maintenanceLogs,
  onEntityIdChange,
  onEntityTypeChange,
  onFileChange,
  onSubmit,
  submitting,
  vehicles,
}: DocumentUploadFormProps) {
  if (!canWrite) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload document</CardTitle>
          <CardDescription>Fleet Manager role is required to upload documents.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upload document</CardTitle>
        <CardDescription>
          Attach files to a vehicle or maintenance log. Max size and MIME types come from ENV
          (ADR-040).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="entityType">Entity type</FieldLabel>
            <Select
              value={entityType}
              onValueChange={(value) => {
                if (value === "vehicle" || value === "maintenance_log") {
                  onEntityTypeChange(value);
                }
              }}
            >
              <SelectTrigger id="entityType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vehicle">Vehicle</SelectItem>
                <SelectItem value="maintenance_log">Maintenance log</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="entityId">
              {entityType === "vehicle" ? "Vehicle" : "Maintenance log"}
            </FieldLabel>
            <Select value={entityId} onValueChange={(value) => onEntityIdChange(value ?? "")}>
              <SelectTrigger id="entityId">
                <SelectValue placeholder="Select target" />
              </SelectTrigger>
              <SelectContent>
                {entityType === "vehicle"
                  ? vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.registrationNumber} · {vehicle.nameModel}
                      </SelectItem>
                    ))
                  : maintenanceLogs.map((log) => (
                      <SelectItem key={log.id} value={log.id}>
                        {log.label}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </Field>

          <Field className="md:col-span-2">
            <FieldLabel htmlFor="file">File</FieldLabel>
            <Input
              id="file"
              type="file"
              onChange={(event) => {
                const next = event.target.files?.[0] ?? null;
                onFileChange(next);
              }}
            />
            {file ? (
              <p className="text-xs text-muted-foreground">
                Selected: {file.name} ({Math.round(file.size / 1024)} KB)
              </p>
            ) : null}
          </Field>

          <div className="md:col-span-2">
            <Button
              type="button"
              disabled={submitting || !entityId || !file}
              onClick={() => onSubmit()}
            >
              {submitting ? "Uploading…" : "Upload document"}
            </Button>
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
