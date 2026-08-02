import { useEffect, useRef } from 'react';
import { GOOGLE_CALENDAR_CONFIG } from '../../config/calendar';
import './CalendarModal.css';

export default function CalendarModal({ isOpen, onClose }) {
  const modalRef = useRef(null);
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Block body scroll when modal is open
    document.body.style.overflow = 'hidden';

    // Focus the close button when modal opens
    closeBtnRef.current?.focus();

    // Close on Escape key
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Book Appointment"
    >
      <div
        className="modal-content"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close"
          onClick={onClose}
          ref={closeBtnRef}
          aria-label="Close"
        >
          ×
        </button>
        <iframe
          src={GOOGLE_CALENDAR_CONFIG.url}
          className="calendar-iframe"
          title="Book Appointment"
        />
      </div>
    </div>
  );
}
