'use client';

import '@/lib/AWS/cognito';

const AmplifyProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default AmplifyProvider;
