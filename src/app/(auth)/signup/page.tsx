import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isCloud } from "@/lib/cloud";
import { CloudSignIn } from "@/components/auth/cloud-sign-in";
import { getPlanDef, publicPlans } from "@/lib/plans";

const FREE_PLAN = getPlanDef("free");

function param(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** The pricing page links here with ?plan=pro&billing=annual (or =monthly, the
 *  default). Sign-up itself always creates a Free account — the paid plan is a
 *  Polar checkout from /billing — so the only honest thing to do with the
 *  params is acknowledge the choice, with the same price shown on /pricing
 *  (Task #249). */
function intent(planParam: string | string[] | undefined, billingParam: string | string[] | undefined): string {
  const slug = param(planParam);
  const plan = publicPlans().find(
    (p) => p.slug === slug && p.slug !== "free" && p.priceMonthly !== null,
  );
  if (!plan) {
    return `No credit card. ${FREE_PLAN.limits.projects} project and ${FREE_PLAN.limits.endpoints} MCP endpoints on the free plan.`;
  }
  const annual = param(billingParam) === "annual";
  const price = annual ? plan.priceYearly : plan.priceMonthly;
  const suffix = annual ? ", billed annually" : "";
  return `You picked ${plan.name} — $${price}/mo${suffix}. Create your account first, then upgrade from Billing.`;
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string | string[]; billing?: string | string[] }>;
}) {
  // Self-hosted is invite-only by design — admins generate invite links from
  // the dashboard, so there is no public sign-up route there at all.
  if (!isCloud()) {
    notFound();
  }

  const googleEnabled = Boolean(process.env.GOOGLE_SIGNIN_CLIENT_ID);
  const { plan, billing } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block cursor-pointer">
            <Image src="/logo.png" alt="ScopeGate" width={64} height={64} className="mx-auto" />
            <h1 className="text-3xl font-bold tracking-tight">Start free</h1>
          </Link>
          <p className="text-muted-foreground">{intent(plan, billing)}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription>
              Sign up with Google or get a one-time link by email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CloudSignIn googleEnabled={googleEnabled} />
          </CardContent>
          <CardFooter>
            <p className="w-full text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="cursor-pointer underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
