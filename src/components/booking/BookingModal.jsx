import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { authFetch } from '../../config/api';
import './BookingModal.css';

const SERVICES = [
  'Terapia NDT Bobath',
  'Fizjoterapia',
  'Terapia Wad Postawy',
  'Terapia Integracji Sensorycznej',
];

export default function BookingModal({ isOpen, onClose, language, preselectedService }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedService, setSelectedService] = useState(preselectedService || '');
  const [notes, setNotes] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [availableHours, setAvailableHours] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [allSlots, setAllSlots] = useState([]);
  const [allExceptions, setAllExceptions] = useState([]);

  const isPL = language === 'pl';

  useEffect(() => {
    if (isOpen && preselectedService) {
      setSelectedService(preselectedService);
    }
  }, [isOpen, preselectedService]);

  useEffect(() => {
    if (isOpen) {
      // Prefetch ALL data at once when modal opens
      Promise.all([
        fetch('/api/services').then(r => r.json()),
        fetch('/api/availability').then(r => r.json()),
        fetch('/api/exceptions').then(r => r.json()),
      ]).then(([servicesData, slotsData, exceptionsData]) => {
        setServices((servicesData.data || []).map(s => language === 'pl' ? s.name_pl : s.name_en));
        setAllSlots(slotsData.data || []);
        setAllExceptions(exceptionsData.data || []);
      }).catch(() => {});
    }
  }, [isOpen, language]);

  useEffect(() => {
    if (selectedDate) {
      fetchBookedSlots(selectedDate);

      // Calculate available hours from cached data (instant!)
      const date = new Date(selectedDate);
      const dayOfWeek = date.getDay();

      // Check exceptions
      const exception = allExceptions.find(e => e.date === selectedDate);
      if (exception && exception.is_blocked) {
        setAvailableHours([]);
      } else if (exception && exception.available_hours && exception.available_hours.length > 0) {
        setAvailableHours(exception.available_hours);
      } else {
        // Normal schedule from cached slots
        const hours = allSlots.filter(s => s.day_of_week === dayOfWeek && s.is_available).map(s => s.time_slot);
        setAvailableHours(hours);
      }
    }
  }, [selectedDate, allSlots, allExceptions]);

  const fetchBookedSlots = async (date) => {
    try {
      const response = await authFetch(`/api/bookings?date=${date}`);
      const data = await response.json();
      const slots = (data.data || [])
        .filter(b => b.status !== 'cancelled')
        .map(b => b.time_slot);
      setBookedSlots(slots);
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !selectedService) {
      setError(isPL ? 'Wybierz datę, godzinę i usługę' : 'Select date, time and service');
      return;
    }

    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError(isPL ? 'Musisz być zalogowany' : 'You must be logged in');
      setLoading(false);
      return;
    }

    try {
      const response = await authFetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          client_name: user.user_metadata?.full_name || user.email,
          client_email: user.email,
          phone: user.user_metadata?.phone || '',
          date: selectedDate,
          time_slot: selectedTime,
          service: selectedService,
          notes: notes || null,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(result.error || (isPL ? 'Nie udało się zarezerwować' : 'Booking failed'));
      }
    } catch (err) {
      setError(isPL ? 'Błąd połączenia' : 'Connection error');
    }

    setLoading(false);
  };

  const handleClose = () => {
    setSelectedDate('');
    setSelectedTime('');
    setSelectedService(preselectedService || '');
    setNotes('');
    setSuccess(false);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  if (success) {
    return (
      <div className="booking-overlay" onClick={handleClose}>
        <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
          <div className="booking-success">
            <div className="success-icon">&#10003;</div>
            <h2>{isPL ? 'Wizyta zarezerwowana!' : 'Appointment booked!'}</h2>
            <p>{isPL ? 'Otrzymasz potwierdzenie na email.' : 'You will receive a confirmation email.'}</p>
            <p className="booking-summary">
              {selectedDate} | {selectedTime} | {selectedService}
            </p>
            <button className="booking-btn" onClick={handleClose}>
              {isPL ? 'Zamknij' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calendar logic
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // Monday first

  const monthNames = isPL
    ? ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const dayNames = isPL
    ? ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd']
    : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const isDateSelectable = (day) => {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    // Exclude weekends (0=Sunday, 6=Saturday) and past dates
    return date >= today && dayOfWeek !== 0 && dayOfWeek !== 6;
  };

  const formatDate = (day) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  return (
    <div className="booking-overlay" onClick={handleClose}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        <button className="booking-close" onClick={handleClose}>&times;</button>
        <h2>{isPL ? 'Umów Wizytę' : 'Book Appointment'}</h2>

        {/* Calendar */}
        <div className="booking-calendar">
          <div className="calendar-header">
            <button onClick={prevMonth}>&lt;</button>
            <span>{monthNames[month]} {year}</span>
            <button onClick={nextMonth}>&gt;</button>
          </div>
          <div className="calendar-days">
            {dayNames.map(d => <div key={d} className="day-name">{d}</div>)}
            {Array(adjustedFirstDay).fill(null).map((_, i) => <div key={`e-${i}`} className="day empty"></div>)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const dateStr = formatDate(day);
              const selectable = isDateSelectable(day);
              const isSelected = selectedDate === dateStr;
              return (
                <button
                  key={day}
                  className={`day ${selectable ? 'selectable' : 'disabled'} ${isSelected ? 'selected' : ''}`}
                  onClick={() => selectable && setSelectedDate(dateStr)}
                  disabled={!selectable}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time slots */}
        {selectedDate && (
          <div className="booking-times">
            <h3>{isPL ? 'Wybierz godzinę:' : 'Select time:'}</h3>
            <div className="time-grid">
              {availableHours.map(time => {
                const isBooked = bookedSlots.includes(time);
                const isSelected = selectedTime === time;
                return (
                  <button
                    key={time}
                    className={`time-slot ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => !isBooked && setSelectedTime(time)}
                    disabled={isBooked}
                  >
                    {time}
                    {isBooked && <span className="booked-label">{isPL ? 'zajęte' : 'taken'}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Service */}
        {selectedTime && !preselectedService && (
          <div className="booking-service">
            <h3>{isPL ? 'Wybierz usługę:' : 'Select service:'}</h3>
            <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
              <option value="">{isPL ? '-- Wybierz --' : '-- Select --'}</option>
              {services.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}

        {selectedTime && preselectedService && (
          <div className="booking-service">
            <h3>{isPL ? 'Usługa:' : 'Service:'}</h3>
            <p className="preselected-service">{preselectedService}</p>
          </div>
        )}

        {/* Notes */}
        {selectedTime && selectedService && (
          <div className="booking-notes">
            <h3>{isPL ? 'Notatka (opcjonalnie):' : 'Notes (optional):'}</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isPL ? 'Dodatkowe informacje...' : 'Additional info...'}
              rows={3}
            />
          </div>
        )}

        {error && <p className="booking-error">{error}</p>}

        {selectedTime && selectedService && (
          <button className="booking-btn" onClick={handleSubmit} disabled={loading}>
            {loading
              ? (isPL ? 'Rezerwacja...' : 'Booking...')
              : (isPL ? 'Zarezerwuj wizytę' : 'Book appointment')}
          </button>
        )}
      </div>
    </div>
  );
}
