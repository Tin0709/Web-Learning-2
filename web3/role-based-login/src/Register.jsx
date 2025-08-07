import React, { useState } from 'react';
import axios from 'axios';

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', role: 'user' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/register', form);
      alert('Registered successfully!');
    } catch (err) {
      alert('Registration failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
      <input placeholder="Email" onChange={e => setForm({ ...form, email: e.target.value })} /><br />
      <input type="password" placeholder="Password" onChange={e => setForm({ ...form, password: e.target.value })} /><br />
      <select onChange={e => setForm({ ...form, role: e.target.value })}>
        <option value="user">User</option>
        <option value="vendor">Vendor</option>
        <option value="shipper">Shipper</option>
      </select><br />
      <button type="submit">Register</button>
    </form>
  );
}
