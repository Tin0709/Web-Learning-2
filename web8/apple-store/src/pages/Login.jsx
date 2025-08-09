export default function Login() {
  return (
    <section className="d-flex justify-content-center">
      <form
        className="card p-4 shadow-sm"
        style={{ maxWidth: 420, width: "100%" }}
      >
        <h1 className="h4 mb-3 text-center">Login</h1>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            className="form-control"
            type="email"
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            className="form-control"
            type="password"
            placeholder="••••••••"
            required
          />
        </div>
        <button className="btn btn-dark w-100">Sign in</button>
      </form>
    </section>
  );
}
