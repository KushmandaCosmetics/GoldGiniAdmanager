'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function RedirectToCampaign() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params.id) {
      router.replace(`/campaigns/${params.id}`);
    } else {
      router.replace('/campaigns');
    }
  }, [params.id, router]);

  return (
    <div className="p-16 text-center text-xs font-bold text-[#4F23D6] animate-pulse">
      Redirecting to campaign workspace...
    </div>
  );
}
