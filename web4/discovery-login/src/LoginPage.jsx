import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/login', {
        email,
        password,
      });
      const role = res.data.role;
      navigate(`/${role}`);
    } catch (err) {
      alert('Invalid email or password');
    }
  };

  return (
    <div className="login-container d-flex">
      <div className="form-section p-5">
        <h2 className="fw-bold mb-2">Log in.</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <input type="email" className="form-control" placeholder="name@role1.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="mb-3">
            <input type="password" className="form-control" placeholder="Password"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary w-100" type="submit">Log in</button>
        </form>
      </div>

      <div className="illustration-section d-flex flex-column justify-content-center align-items-center text-center">
        <h6 className="text-muted">Nice to see you again</h6>
        <h2 className="fw-bold">Welcome back</h2>
        <img src="/illustration.svg" alt="Illustration" className="illustration-img mt-4" />
      </div>
    </div>
  );
};

export default LoginPage;
