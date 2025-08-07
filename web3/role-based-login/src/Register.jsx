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
      <h2 style={styles.heading}>Register</h2>
      <input
        placeholder="Email"
        style={styles.input}
        onChange={e => setForm({ ...form, email: e.target.value })}
      />
      <input
        type="password"
        placeholder="Password"
        style={styles.input}
        onChange={e => setForm({ ...form, password: e.target.value })}
      />
      <select
        style={styles.input}
        onChange={e => setForm({ ...form, role: e.target.value })}
      >
        <option value="user">User</option>
        <option value="vendor">Vendor</option>
        <option value="shipper">Shipper</option>
      </select>
      <button style={styles.button} type="submit">Register</button>
    </form>
  );
}

const styles = {
  heading: {
    marginBottom: '20px',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '15px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '16px',
  },
  button: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer',
  },
};
