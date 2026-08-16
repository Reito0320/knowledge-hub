'use client';

import '@/lib/amplify';

const AmplifyProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default AmplifyProvider;
