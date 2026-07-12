import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AccessDeniedProps = {
  description?: string;
  title?: string;
};

export function AccessDenied({
  title = "Access denied",
  description = "You do not have permission to view this page.",
}: AccessDeniedProps) {
  return (
    <div className="px-4 py-10 lg:px-6">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
