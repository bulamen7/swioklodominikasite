import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './Testimonials.css';

export default function Testimonials() {
  const { language } = useLanguage();
  const [reviews, setReviews] = useState([]);

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

  if (reviews.length === 0) return null;

  return (
    <section className="testimonials-section">
      <div className="container">
        <h2>{t.title}</h2>
        <div className="testimonials-grid">
          {reviews.slice(0, 6).map((review) => (
            <div key={review.id} className="testimonial-card">
              <div className="testimonial-stars">
                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
              </div>
              <p className="testimonial-content">"{review.content}"</p>
              <p className="testimonial-author">— {review.client_name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
