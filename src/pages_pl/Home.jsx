import { Link } from 'react-router-dom';
import Testimonials from '../components/Testimonials';
import './Home.css';

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>Profesjonalne Usługi Terapeutyczne</h1>
          <p>Wspieranie Twojej drogi do zdrowia z troską i opartą na dowodach opieką</p>
        </div>
      </section>

      <section className="services-preview">
        <div className="container">
          <h2>Nasze Usługi</h2>
          <div className="services-grid">
            <div className="service-card">
              <h3>Terapia Indywidualna</h3>
              <p>Sesje jeden na jeden dostosowane do Twoich osobistych potrzeb i celów</p>
            </div>
            <div className="service-card">
              <h3>Terapia Par</h3>
              <p>Wzmocnij swoją relację poprzez ukierunkowaną komunikację i zrozumienie</p>
            </div>
            <div className="service-card">
              <h3>Sesje Grupowe</h3>
              <p>Połącz się z innymi osobami stającymi przed podobnymi wyzwaniami w wspierającym środowisku</p>
            </div>
          </div>
          <Link to="/prices" className="view-prices">Zobacz Wszystkie Usługi i Ceny →</Link>
        </div>
      </section>

      <section className="about-preview">
        <div className="container">
          <h2>Dlaczego My</h2>
          <p>Zapewniamy bezpieczną, poufną przestrzeń, w której możesz odkrywać swoje myśli i uczucia. Nasze podejście łączy sprawdzone techniki terapeutyczne z autentyczną troską i zrozumieniem.</p>
          <Link to="/about" className="learn-more">Dowiedz Się Więcej o Naszym Podejściu →</Link>
        </div>
      </section>
      <Testimonials />
    </div>
  );
}
