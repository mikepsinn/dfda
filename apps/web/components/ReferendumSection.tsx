'use client';

import { Button } from '@/components/ui/button';
import { submitReferendumVoteAction } from '@/lib/actions/referendumActions';

export function ReferendumSection() {
  return (
    <section className="band-soft -mb-6 py-12 md:-mb-10">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Support the dFDA Initiative</h2>
        <p className="mb-8 text-lg text-muted-foreground">
          Show your support for a more transparent, efficient, and patient-centric approach to medical approvals and research.
          Your signature counts towards building a future where medical progress is accelerated through decentralization.
        </p>
        <form action={submitReferendumVoteAction}>
          <Button type="submit" size="lg" className="px-8 font-semibold shadow-md">
            Sign to Support
          </Button>
        </form>
      </div>
    </section>
  );
}
