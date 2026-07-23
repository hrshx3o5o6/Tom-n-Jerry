import React from 'react';

function App() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2>Users</h2>
          <p className="text-2xl">42</p>
        </div>
        <div className="bg-gray-100 p-4 rounded">
          <h2>Revenue</h2>
          <p className="text-2xl">$12,430</p>
        </div>
        <div className="bg-gray-100 p-4 rounded">
          <h2>Orders</h2>
          <p className="text-2xl">156</p>
        </div>
      </div>
    </div>
  );
}

export default App;
