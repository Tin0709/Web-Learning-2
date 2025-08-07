import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';

const UserPage = () => <h1 className="text-center mt-5">Welcome, User!</h1>;
const VendorPage = () => <h1 className="text-center mt-5">Welcome, Vendor!</h1>;
const ShipperPage = () => <h1 className="text-center mt-5">Welcome, Shipper!</h1>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/user" element={<UserPage />} />
        <Route path="/vendor" element={<VendorPage />} />
        <Route path="/shipper" element={<ShipperPage />} />
      </Routes>
    </Router>
  );
}

export default App;
