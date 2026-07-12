"use client";

import { ExternalLinkIcon, Trash2Icon } from "lucide-react";

import { documentDownloadUrl, formatBytes } from "@/app/documents/_lib/documents-api";
import type { DocumentRowUi } from "@/app/documents/_types/documents-ui";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableLoadingRows } from "@/lib/boneyard/table-row-shimmer";

type DocumentsTableProps = {
  canWrite: boolean;
  deletingId: string | null;
  items: DocumentRowUi[];
  loading?: boolean;
  onDelete: (id: string) => void;
};

export function DocumentsTable({
  canWrite,
  deletingId,
  items,
  loading = false,
  onDelete,
}: DocumentsTableProps) {
  if (!loading && items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No documents yet. Upload a vehicle RC, insurance, or maintenance invoice.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File</TableHead>
            <TableHead>Linked to</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableLoadingRows columnCount={6} rowCount={5} />
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="max-w-56 truncate font-medium" title={item.fileName}>
                  {item.fileName}
                </TableCell>
                <TableCell className="max-w-64 truncate text-sm text-muted-foreground">
                  <span className="capitalize">{item.entityType.replace("_", " ")}</span>
                  {item.entityLabel ? ` · ${item.entityLabel}` : ""}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.mimeType}</TableCell>
                <TableCell className="tabular-nums">{formatBytes(item.sizeBytes)}</TableCell>
                <TableCell className="text-sm text-muted-foreground tabular-nums">
                  {new Date(item.createdAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      render={
                        <a
                          href={documentDownloadUrl(item.id)}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Open ${item.fileName}`}
                        >
                          <ExternalLinkIcon className="size-4" />
                          Open
                        </a>
                      }
                    />
                    {canWrite ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={deletingId === item.id}
                        onClick={() => onDelete(item.id)}
                      >
                        <Trash2Icon className="size-4" />
                        {deletingId === item.id ? "Deleting…" : "Delete"}
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
