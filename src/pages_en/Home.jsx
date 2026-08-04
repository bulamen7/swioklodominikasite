import { Link } from 'react-router-dom';
import Testimonials from '../components/Testimonials';
import './Home.css';

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>Professional Therapy Services</h1>
          <p>Supporting your mental health journey with compassionate, evidence-based care</p>
        </div>
      </section>

      <section className="services-preview">
        <div className="container">
          <h2>Our Services</h2>
          <div className="services-grid">
            <div className="service-card">
              <h3>Individual Therapy</h3>
              <p>One-on-one sessions tailored to your personal needs and goals</p>
            </div>
            <div className="service-card">
              <h3>Couples Therapy</h3>
              <p>Strengthen your relationship through guided communication and understanding</p>
            </div>
            <div className="service-card">
              <h3>Group Sessions</h3>
              <p>Connect with others facing similar challenges in a supportive environment</p>
            </div>
          </div>
          <Link to="/prices" className="view-prices">View All Services & Prices →</Link>
        </div>
      </section>

      <section className="about-preview">
        <div className="container">
          <h2>Why Choose Us</h2>
          <p>We provide a safe, confidential space where you can explore your thoughts and feelings. Our approach combines proven therapeutic techniques with genuine care and understanding.</p>
          <Link to="/about" className="learn-more">Learn More About Our Approach →</Link>
        </div>
      </section>
      <Testimonials />
    </div>
  );
}
