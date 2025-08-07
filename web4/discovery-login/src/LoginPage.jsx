import React from 'react';
import './LoginPage.css';

const LoginPage = () => {
  return (
    <div className="login-container d-flex">
      {/* Left side (Form) */}
      <div className="form-section p-5">
        <div className="mb-4 d-flex align-items-center">
          <div className="logo-icon me-2">🎁</div>
          <h4 className="fw-bold">Discovery Gift</h4>
        </div>

        <h2 className="fw-bold mb-2">Log in.</h2>
        <p className="text-muted mb-4">Log in with your data that you entered during your registration</p>

        <form>
          <div className="mb-3">
            <label className="form-label">Enter your email address</label>
            <input type="email" className="form-control" placeholder="name@example.com" />
          </div>
          <div className="mb-3">
            <label className="form-label">Enter your password</label>
            <input type="password" className="form-control" placeholder="atleast 8 characters" />
          </div>

          <div className="text-end mb-3">
            <a href="/" className="text-decoration-none">Forgot password?</a>
          </div>

          <button className="btn btn-primary w-100 mb-3" type="submit">Log in</button>

          <button className="btn btn-outline-dark w-100 mb-3">
            <img src="https://www.citypng.com/public/uploads/preview/google-logo-icon-gsuite-hd-701751694791470gzbayltphh.png" alt="Google" width="20" className="me-2" />
            Sign in with Google
          </button>

          <p className="text-center mt-3">
            Don’t have an account? <a href="/" className="text-decoration-none">Register</a>
          </p>
        </form>
      </div>

      {/* Right side (Illustration) */}
      <div className="illustration-section d-flex flex-column justify-content-center align-items-center text-center">
        <h6 className="text-muted">Nice to see you again</h6>
        <h2 className="fw-bold">Welcome back</h2>
        <img
          src="https://onlinelifeguide.com/wp-content/uploads/2019/12/social-media-use-1024x824.jpg"
          alt="Illustration"
          className="illustration-img mt-4"
        />
      </div>
    </div>
  );
};

export default LoginPage;
