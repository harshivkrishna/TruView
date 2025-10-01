import React, { useState, useEffect } from 'react';

const TestHooks: React.FC = () => {
  useEffect(() => {
    // Component mounted
    return () => {
      // Component unmounted
    };
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Test Hooks Component</h2>
      <p>This component is used for testing React hooks behavior.</p>
    </div>
  );
};

export default TestHooks; 