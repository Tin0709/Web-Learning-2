import React from 'react';
import Register from './Register';
import Login from './Login';

function App() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Role-Based Auth</h1>
      <Register />
      <hr />
      <Login />
    </div>
  );
}

export default App;
