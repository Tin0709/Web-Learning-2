import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage';

const Role1 = () => <h1>Welcome Role 1 User</h1>;
const Role2 = () => <h1>Welcome Role 2 User</h1>;
const Role3 = () => <h1>Welcome Role 3 User</h1>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/role1" element={<Role1 />} />
        <Route path="/role2" element={<Role2 />} />
        <Route path="/role3" element={<Role3 />} />
      </Routes>
    </Router>
  );
}

export default App;
