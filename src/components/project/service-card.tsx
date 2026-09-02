import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProviderDisplayName } from "@/lib/provider-names";
import { getCredentialGroup } from "@/lib/provider-registry";
import { formatOAuthErrorReason, isGoogleTestingModeError } from "@/lib/format-oauth-error";
import { Unplug, RefreshCw, AlertTriangle, XCircle, Plus } from "lucide-react";
import { ServiceIcon } from "@/components/service-icons";
import type { Service } from "@/components/project/use-project-services";

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface ServiceCardProps {
  service: Service;
  disconnecting: boolean;
  reconnecting: boolean;
  onReconnect: () => void;
  onDisconnect: () => void;
  onAddMcp: () => void;
}

export function ServiceCard({
  service,
  disconnecting,
  reconnecting,
  onReconnect,
  onDisconnect,
  onAddMcp,
}: ServiceCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ServiceIcon provider={service.provider} className="size-8 shrink-0" />
            <div>
              <CardTitle>{getProviderDisplayName(service.provider)}</CardTitle>
              <CardDescription>
                {service.accountEmail}
                {service.provider === "googleAds" && Boolean(service.metadata?.googleAdsCustomerName) && (
                  <span className="block">
                    {service.metadata!.googleAdsCustomerName as string}
                    {Boolean(service.metadata!.googleAdsCustomerId) && (
                      <span className="text-muted-foreground/70"> · ID: {service.metadata!.googleAdsCustomerId as string}</span>
                    )}
                  </span>
                )}
                {(service.status === "error" || service.status === "revoked") && (() => {
                  const reason = formatOAuthErrorReason(service.lastError);
                  return (
                    <>
                      {reason && (
                        <span className="block text-destructive">
                          {service.status === "revoked" ? "Revoked" : "Error"}{" "}
                          {formatShortDate(service.updatedAt)} · {reason}
                        </span>
                      )}
                      {service.status === "revoked" &&
                        isGoogleTestingModeError(reason) &&
                        getCredentialGroup(service.provider) === "google" && (
                          <span className="block text-muted-foreground/70">
                            This Google OAuth app is still in Testing — refresh tokens expire
                            every 7 days. Publish the consent screen to fix this permanently.
                          </span>
                        )}
                    </>
                  );
                })()}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {service.status === "revoked" && (
              <Badge
                variant="outline"
                className="border-yellow-500 text-yellow-600 dark:text-yellow-400"
                title={service.lastError || "Revoked — reconnect required"}
              >
                <AlertTriangle className="size-3 mr-1" />
                Revoked
              </Badge>
            )}
            {service.status === "error" && (
              <Badge
                variant="outline"
                className="border-red-500 text-red-600 dark:text-red-400"
                title={service.lastError || "Connection error"}
              >
                <XCircle className="size-3 mr-1" />
                Error
              </Badge>
            )}
            <Badge variant="secondary">{service._count.mcpEndpoints} endpoint(s)</Badge>
            {service._count.mcpEndpoints === 0 && (
              <Button variant="outline" size="sm" onClick={onAddMcp}>
                <Plus className="size-4" />
                Add MCP
              </Button>
            )}
            <Button variant="outline" size="sm" disabled={reconnecting} onClick={onReconnect}>
              <RefreshCw className={`size-4 ${reconnecting ? "animate-spin" : ""}`} />
              {reconnecting ? "Reconnecting..." : "Reconnect"}
            </Button>
            <Button variant="destructive" size="sm" disabled={disconnecting} onClick={onDisconnect}>
              <Unplug className="size-4" />
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Connected {new Date(service.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </CardContent>
    </Card>
  );
}
