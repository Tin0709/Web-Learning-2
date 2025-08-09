export default function Register() {
  return (
    <section className="d-flex justify-content-center">
      <form
        className="card p-4 shadow-sm"
        style={{ maxWidth: 480, width: "100%" }}
      >
        <h1 className="h4 mb-3 text-center">Create Account</h1>
        <div className="mb-3">
          <label className="form-label">Full name</label>
          <input className="form-control" required />
        </div>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input className="form-control" type="email" required />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input className="form-control" type="password" required />
        </div>
        <button className="btn btn-dark w-100">Register</button>
      </form>
    </section>
  );
}
