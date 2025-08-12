import React, { useState, useEffect } from 'react';

const TestHooks = () => {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('Hooks are working!');

  useEffect(() => {
    console.log('TestHooks component mounted');
    return () => {
      console.log('TestHooks component unmounted');
    };
  }, []);

  const increment = () => {
    setCount(prev => prev + 1);
  };

  const changeMessage = () => {
    setMessage('Message changed!');
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">React Hooks Test</h3>
      <div className="space-y-4">
        <div>
          <p className="text-gray-600">Count: <span className="font-bold text-blue-600">{count}</span></p>
          <button 
            onClick={increment}
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            Increment
          </button>
        </div>
        <div>
          <p className="text-gray-600">Message: <span className="font-bold text-green-600">{message}</span></p>
          <button 
            onClick={changeMessage}
            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
          >
            Change Message
          </button>
        </div>
        <div className="text-sm text-gray-500">
          If you can see this component and the buttons work, React hooks are functioning correctly.
        </div>
      </div>
    </div>
  );
};

export default TestHooks; 