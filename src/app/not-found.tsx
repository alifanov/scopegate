import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold tracking-tight">404</h1>
        <p className="text-lg text-muted-foreground">
          This page doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
