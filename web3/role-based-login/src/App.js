// src/App.js
import React from 'react';
import Register from './Register';
import Login from './Login';

function App() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🚀 Role-Based Auth</h1>
      <div style={styles.card}>
        <Register />
      </div>
      <div style={styles.card}>
        <Login />
      </div>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '40px',
    padding: '40px',
    backgroundColor: '#f9f9f9',
    minHeight: '100vh',
  },
  title: {
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
  },
};

export default App;
