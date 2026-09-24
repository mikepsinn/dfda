'use client';

import { submitReferendumVoteAction } from '@/lib/actions/referendumActions';

export function ReferendumSection() {
  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Support the Decentralized FDA Initiative</h2>
        <p className="mb-8 text-lg text-gray-700">
          Show your support for a more transparent, efficient, and patient-centric approach to medical approvals and research.
          Your signature counts towards building a future where medical progress is accelerated through decentralization.
        </p>
        <form action={submitReferendumVoteAction}>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition duration-150 ease-in-out"
          >
            Sign to Support
          </button>
        </form>
      </div>
    </section>
  );
} 