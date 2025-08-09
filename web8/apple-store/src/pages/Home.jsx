export default function Home() {
  return (
    <section>
      {/* Use a row so it stacks on small screens */}
      <div className="p-4 p-md-5 bg-light rounded-3 mb-4">
        <div className="row align-items-center g-4">
          <div className="col-12 col-md-6">
            <h1 className="display-6 fw-bold">Welcome to the Apple Store</h1>
            <p className="lead mb-3">
              Browse curated Apple products with a clean, responsive UI.
            </p>
            <a href="/products" className="btn btn-dark btn-lg">
              Shop Now
            </a>
          </div>
          <div className="col-12 col-md-6">
            <div className="detail-figure">
              <img
                src="https://qmacvn.hcm.ss.bfcplatform.vn/mbp132022silver-1.jpeg"
                alt="hero"
              />
            </div>
          </div>
        </div>
      </div>

      <h2 className="h4 mb-3">Featured</h2>
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">iPhone</h5>
              <p className="card-text">Performance, camera, design.</p>
              <a href="/products" className="btn btn-outline-dark">
                Explore
              </a>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Mac</h5>
              <p className="card-text">Power for work and play.</p>
              <a href="/products" className="btn btn-outline-dark">
                Explore
              </a>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Accessories</h5>
              <p className="card-text">Complete your setup.</p>
              <a href="/products" className="btn btn-outline-dark">
                Explore
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
