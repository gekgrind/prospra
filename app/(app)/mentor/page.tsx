import { Suspense } from "react";

import { MentorWorkspace, MentorWorkspaceSkeleton } from "@/components/mentor/MentorWorkspace";

export default function MentorPage() {
  return (
    <Suspense fallback={<MentorWorkspaceSkeleton />}>
      <MentorWorkspace />
    </Suspense>
  );
}
