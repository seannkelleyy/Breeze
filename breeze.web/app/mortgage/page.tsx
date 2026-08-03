'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const MortgageRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/tools/mortgage');
  }, [router]);

  return null;
};

export default MortgageRedirect;
