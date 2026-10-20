import { Suspense } from "react";
import { Library } from "@/components/library/Library";

export default function Home() {
  return (
    <Suspense>
      <Library />
    </Suspense>
  );
}
