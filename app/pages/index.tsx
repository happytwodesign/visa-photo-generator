import React from 'react';
import RequirementsList from '../components/RequirementsList';
import { useMediaQuery } from '../hooks/useMediaQuery';

function FirstPage() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  // ... other code ...

  return (
    <div className="min-h-screen">
      <p className="text-red-500">isMobile: {isMobile ? 'true' : 'false'}</p>
      {/* ... other components ... */}
      <div className="border border-red-500 p-4 my-4">
        <p className="text-red-500">Debug: RequirementsList container</p>
        <RequirementsList />
      </div>
      <div className="border border-green-500 p-4 my-4">
        <p className="text-green-500">Debug: Always visible container</p>
        <p>This should always be visible on both mobile and desktop</p>
      </div>
      {/* ... other components ... */}
    </div>
  );
}

export default FirstPage;