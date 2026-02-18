"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ServiceIcon } from "@/components/service-icons";
import {
  Menu,
  Plus,
  X,
  Check,
  Pencil,
  Trash2,
  Copy,
  Shield,
  Eye,
  EyeOff,
  Settings,
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
  User,
  LogOut,
  ExternalLink,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  MoreHorizontal,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <Separator />
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Color swatch
// ---------------------------------------------------------------------------
function Swatch({ name, cssVar }: { name: string; cssVar: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="size-14 rounded-lg border shadow-sm"
        style={{ backgroundColor: `var(${cssVar})` }}
      />
      <span className="text-[10px] leading-tight text-muted-foreground text-center max-w-16 break-words">
        {name}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function DesignSystemPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-12 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Design System</h1>
        <p className="text-muted-foreground mt-1">
          Living reference of all UI components, colors, typography, and design
          tokens used in ScopeGate.
        </p>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 1. Colors */}
      {/* ----------------------------------------------------------------- */}
      <Section title="Colors">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              Core
            </h3>
            <div className="flex flex-wrap gap-4">
              <Swatch name="background" cssVar="--background" />
              <Swatch name="foreground" cssVar="--foreground" />
              <Swatch name="primary" cssVar="--primary" />
              <Swatch name="primary-fg" cssVar="--primary-foreground" />
              <Swatch name="secondary" cssVar="--secondary" />
              <Swatch name="secondary-fg" cssVar="--secondary-foreground" />
              <Swatch name="muted" cssVar="--muted" />
              <Swatch name="muted-fg" cssVar="--muted-foreground" />
              <Swatch name="accent" cssVar="--accent" />
              <Swatch name="accent-fg" cssVar="--accent-foreground" />
              <Swatch name="destructive" cssVar="--destructive" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              UI
            </h3>
            <div className="flex flex-wrap gap-4">
              <Swatch name="border" cssVar="--border" />
              <Swatch name="input" cssVar="--input" />
              <Swatch name="ring" cssVar="--ring" />
              <Swatch name="card" cssVar="--card" />
              <Swatch name="card-fg" cssVar="--card-foreground" />
              <Swatch name="popover" cssVar="--popover" />
              <Swatch name="popover-fg" cssVar="--popover-foreground" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              Sidebar
            </h3>
            <div className="flex flex-wrap gap-4">
              <Swatch name="sidebar" cssVar="--sidebar" />
              <Swatch name="sidebar-fg" cssVar="--sidebar-foreground" />
              <Swatch name="sidebar-primary" cssVar="--sidebar-primary" />
              <Swatch name="sidebar-primary-fg" cssVar="--sidebar-primary-foreground" />
              <Swatch name="sidebar-accent" cssVar="--sidebar-accent" />
              <Swatch name="sidebar-accent-fg" cssVar="--sidebar-accent-foreground" />
              <Swatch name="sidebar-border" cssVar="--sidebar-border" />
              <Swatch name="sidebar-ring" cssVar="--sidebar-ring" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              Charts
            </h3>
            <div className="flex flex-wrap gap-4">
              <Swatch name="chart-1" cssVar="--chart-1" />
              <Swatch name="chart-2" cssVar="--chart-2" />
              <Swatch name="chart-3" cssVar="--chart-3" />
              <Swatch name="chart-4" cssVar="--chart-4" />
              <Swatch name="chart-5" cssVar="--chart-5" />
            </div>
          </div>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* 2. Typography */}
      {/* ----------------------------------------------------------------- */}
      <Section title="Typography">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              Font Families
            </h3>
            <div className="space-y-2">
              <p className="font-sans">
                Geist Sans (font-sans) &mdash; The quick brown fox jumps over the lazy dog
              </p>
              <p className="font-mono">
                Geist Mono (font-mono) &mdash; The quick brown fox jumps over the lazy dog
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              Font Sizes
            </h3>
            <div className="space-y-1.5">
              {(
                [
                  ["text-xs", "text-xs"],
                  ["text-sm", "text-sm"],
                  ["text-base", "text-base"],
                  ["text-lg", "text-lg"],
                  ["text-xl", "text-xl"],
                  ["text-2xl", "text-2xl"],
                  ["text-3xl", "text-3xl"],
                ] as const
              ).map(([cls, label]) => (
                <p key={cls} className={cls}>
                  {label} &mdash; The quick brown fox
                </p>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              Font Weights
            </h3>
            <div className="space-y-1.5">
              {(
                [
                  ["font-light", "font-light (300)"],
                  ["font-normal", "font-normal (400)"],
                  ["font-medium", "font-medium (500)"],
                  ["font-semibold", "font-semibold (600)"],
                  ["font-bold", "font-bold (700)"],
                ] as const
              ).map(([cls, label]) => (
                <p key={cls} className={`text-lg ${cls}`}>
                  {label} &mdash; The quick brown fox
                </p>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* 3. Buttons */}
      {/* ----------------------------------------------------------------- */}
      <Section title="Buttons">
        <div className="space-y-6">
          {(
            [
              "default",
              "destructive",
              "outline",
              "secondary",
              "ghost",
              "link",
            ] as const
          ).map((variant) => (
            <div key={variant}>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                {variant}
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant={variant} size="xs">
                  xs
                </Button>
                <Button variant={variant} size="sm">
                  sm
                </Button>
                <Button variant={variant} size="default">
                  default
                </Button>
                <Button variant={variant} size="lg">
                  lg
                </Button>
                <Button variant={variant} size="icon-xs">
                  <Plus />
                </Button>
                <Button variant={variant} size="icon-sm">
                  <Plus />
                </Button>
                <Button variant={variant} size="icon">
                  <Plus />
                </Button>
                <Button variant={variant} size="icon-lg">
                  <Plus />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* 4. Badges */}
      {/* ----------------------------------------------------------------- */}
      <Section title="Badges">
        <div className="flex flex-wrap gap-3">
          {(
            [
              "default",
              "secondary",
              "destructive",
              "outline",
              "ghost",
              "link",
            ] as const
          ).map((variant) => (
            <Badge key={variant} variant={variant}>
              {variant}
            </Badge>
          ))}
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* 5. Form Elements */}
      {/* ----------------------------------------------------------------- */}
      <Section title="Form Elements">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="demo-input">Label</Label>
            <Input id="demo-input" placeholder="Placeholder text..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="demo-disabled">Disabled Input</Label>
            <Input
              id="demo-disabled"
              placeholder="Disabled..."
              disabled
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="demo-check" />
            <Label htmlFor="demo-check">Checkbox label</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="demo-check-checked" defaultChecked />
            <Label htmlFor="demo-check-checked">Checked by default</Label>
          </div>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* 6. Cards */}
      {/* ----------------------------------------------------------------- */}
      <Section title="Cards">
        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>
                Card description with supporting text.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                This is the card content area. It can contain any elements.
              </p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button size="sm">Action</Button>
              <Button size="sm" variant="outline">
                Cancel
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Minimal Card</CardTitle>
              <CardDescription>Header and content only.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Cards adapt to their content and can be composed flexibly.
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* 7. Tabs */}
      {/* ----------------------------------------------------------------- */}
      <Section title="Tabs">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              Default variant
            </h3>
            <Tabs defaultValue="tab1">
              <TabsList>
                <TabsTrigger value="tab1">Overview</TabsTrigger>
                <TabsTrigger value="tab2">Settings</TabsTrigger>
                <TabsTrigger value="tab3">Analytics</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1" className="p-4 text-sm">
                Overview tab content
              </TabsContent>
              <TabsContent value="tab2" className="p-4 text-sm">
                Settings tab content
              </TabsContent>
              <TabsContent value="tab3" className="p-4 text-sm">
                Analytics tab content
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              Line variant
            </h3>
            <Tabs defaultValue="tab1">
              <TabsList variant="line">
                <TabsTrigger value="tab1">Overview</TabsTrigger>
                <TabsTrigger value="tab2">Settings</TabsTrigger>
                <TabsTrigger value="tab3">Analytics</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1" className="p-4 text-sm">
                Overview tab content
              </TabsContent>
              <TabsContent value="tab2" className="p-4 text-sm">
                Settings tab content
              </TabsContent>
              <TabsContent value="tab3" className="p-4 text-sm">
                Analytics tab content
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* 8. Icons */}
      {/* ----------------------------------------------------------------- */}
      <Section title="Icons">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              Lucide Icons
            </h3>
            <div className="flex flex-wrap gap-4">
              {[
                { icon: Menu, name: "Menu" },
                { icon: Plus, name: "Plus" },
                { icon: X, name: "X" },
                { icon: Check, name: "Check" },
                { icon: Pencil, name: "Pencil" },
                { icon: Trash2, name: "Trash2" },
                { icon: Copy, name: "Copy" },
                { icon: Shield, name: "Shield" },
                { icon: Eye, name: "Eye" },
                { icon: EyeOff, name: "EyeOff" },
                { icon: Settings, name: "Settings" },
                { icon: ChevronDown, name: "ChevronDown" },
                { icon: ChevronRight, name: "ChevronRight" },
                { icon: Search, name: "Search" },
                { icon: Bell, name: "Bell" },
                { icon: User, name: "User" },
                { icon: LogOut, name: "LogOut" },
                { icon: ExternalLink, name: "ExternalLink" },
                { icon: Info, name: "Info" },
                { icon: AlertTriangle, name: "AlertTriangle" },
                { icon: AlertCircle, name: "AlertCircle" },
                { icon: CheckCircle, name: "CheckCircle" },
                { icon: Loader2, name: "Loader2" },
                { icon: ArrowLeft, name: "ArrowLeft" },
                { icon: ArrowRight, name: "ArrowRight" },
                { icon: MoreHorizontal, name: "MoreHorizontal" },
              ].map(({ icon: Icon, name }) => (
                <div
                  key={name}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg border bg-card">
                    <Icon className="size-5" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              Service Icons
            </h3>
            <div className="flex flex-wrap gap-4">
              {[
                { provider: "gmail", name: "Gmail" },
                { provider: "calendar", name: "Calendar" },
                { provider: "drive", name: "Drive" },
                { provider: "googleAds", name: "Google Ads" },
                { provider: "searchConsole", name: "Search Console" },
                { provider: "twitter", name: "Twitter/X" },
                { provider: "openRouter", name: "OpenRouter" },
              ].map(({ provider, name }) => (
                <div
                  key={provider}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg border bg-card">
                    <ServiceIcon provider={provider} className="size-6" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* 9. Skeleton Loaders */}
      {/* ----------------------------------------------------------------- */}
      <Section title="Skeleton Loaders">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="size-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-24 w-full" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* 10. Separators */}
      {/* ----------------------------------------------------------------- */}
      <Section title="Separators">
        <div className="space-y-4">
          <div>
            <p className="text-sm mb-2 text-muted-foreground">Horizontal</p>
            <Separator />
          </div>
          <div>
            <p className="text-sm mb-2 text-muted-foreground">Vertical (in flex row)</p>
            <div className="flex h-8 items-center gap-4">
              <span className="text-sm">Left</span>
              <Separator orientation="vertical" />
              <span className="text-sm">Center</span>
              <Separator orientation="vertical" />
              <span className="text-sm">Right</span>
            </div>
          </div>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* 11. Border Radius */}
      {/* ----------------------------------------------------------------- */}
      <Section title="Border Radius">
        <div className="flex flex-wrap gap-6">
          {(
            [
              ["rounded-sm", "sm"],
              ["rounded-md", "md"],
              ["rounded-lg", "lg"],
              ["rounded-xl", "xl"],
              ["rounded-2xl", "2xl"],
            ] as const
          ).map(([cls, label]) => (
            <div key={cls} className="flex flex-col items-center gap-1.5">
              <div
                className={`size-16 border-2 border-primary bg-primary/10 ${cls}`}
              />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* 12. Spacing */}
      {/* ----------------------------------------------------------------- */}
      <Section title="Spacing">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              Gap scale (flex row)
            </h3>
            <div className="space-y-3">
              {(
                [
                  ["gap-1", "4px"],
                  ["gap-2", "8px"],
                  ["gap-3", "12px"],
                  ["gap-4", "16px"],
                  ["gap-6", "24px"],
                  ["gap-8", "32px"],
                ] as const
              ).map(([cls, px]) => (
                <div key={cls} className="flex items-center gap-4">
                  <span className="w-16 text-xs text-muted-foreground shrink-0">
                    {cls}
                  </span>
                  <div className={`flex ${cls}`}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="size-6 rounded bg-primary/80"
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">{px}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              Padding scale
            </h3>
            <div className="flex flex-wrap gap-4">
              {(
                [
                  ["p-1", "4px"],
                  ["p-2", "8px"],
                  ["p-3", "12px"],
                  ["p-4", "16px"],
                  ["p-6", "24px"],
                  ["p-8", "32px"],
                ] as const
              ).map(([cls, px]) => (
                <div key={cls} className="flex flex-col items-center gap-1.5">
                  <div className={`border border-dashed border-primary/50 ${cls}`}>
                    <div className="size-6 rounded bg-primary/80" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {cls} ({px})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
