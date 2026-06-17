"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

/** App-section error boundary. Calm, plain-language, with a retry. */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // A real build would report this; here it just surfaces in the console.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-h2">That screen didn&apos;t load</h1>
      <p className="text-body text-slate">
        Something went wrong on our side. Your data is safe — try again in a moment.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
