import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './Testimonials.css';

export default function Testimonials() {
  const { language } = useLanguage();
  const [reviews, setReviews] = useState([]);
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef(null);

  const t = language === 'pl' ? {
    title: 'Opinie Pacjentów',
    noReviews: 'Brak opinii',
  } : {
    title: 'Patient Reviews',
    noReviews: 'No reviews yet',
  };

  useEffect(() => {
    fetch('/api/reviews')
      .then(res => res.json())
      .then(data => setReviews(data.data || []))
      .catch(() => {});
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % reviews.length);
  }, [reviews.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + reviews.length) % reviews.length);
  }, [reviews.length]);

  // Auto-rotate every 5s
  useEffect(() => {
    if (reviews.length <= 1) return;
    intervalRef.current = setInterval(next, 5000);
    return () => clearInterval(intervalRef.current);
  }, [next, reviews.length]);

  const goTo = (index) => {
    setCurrent(index);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(next, 5000);
  };

  if (reviews.length === 0) return null;

  return (
    <section className="testimonials-section reveal-on-scroll">
      <div className="container">
        <h2>{t.title}</h2>
        <div className="testimonials-carousel">
          {reviews.length > 1 && (
            <button className="carousel-btn carousel-prev" onClick={prev} aria-label="Previous review">‹</button>
          )}
          <div className="carousel-track">
            {reviews.map((review, i) => (
              <div
                key={review.id}
                className={`testimonial-slide ${i === current ? 'active' : ''}`}
              >
                <div className="testimonial-stars">
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </div>
                <p className="testimonial-content">"{review.content}"</p>
                <p className="testimonial-author">— {review.client_name}</p>
              </div>
            ))}
          </div>
          {reviews.length > 1 && (
            <button className="carousel-btn carousel-next" onClick={next} aria-label="Next review">›</button>
          )}
        </div>
        {reviews.length > 1 && (
          <div className="carousel-dots">
            {reviews.map((_, i) => (
              <button
                key={i}
                className={`carousel-dot ${i === current ? 'active' : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Review ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
