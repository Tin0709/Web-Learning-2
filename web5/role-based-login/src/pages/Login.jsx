import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // We'll connect to the backend later

    // TEMP: Mock role logic
    if (email.includes('vendor')) {
      navigate('/vendor');
    } else if (email.includes('shipper')) {
      navigate('/shipper');
    } else {
      navigate('/user');
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <form onSubmit={handleLogin} className="w-100" style={{ maxWidth: '400px' }}>
        <h2 className="text-center mb-4">Login</h2>
        <div className="mb-3">
          <label>Email</label>
          <input
            type="email"
            className="form-control"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label>Password</label>
          <input
            type="password"
            className="form-control"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary w-100">
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
