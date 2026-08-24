import './TopBar.css';

export default function TopBar() {
  return (
    <div className="top-bar">
      <div className="top-bar-container">
        <span className="top-bar-brand">Dominika Świokło</span>
        <div className="top-bar-contact">
          <a href="tel:+48797194841">📞 +48 797 194 841</a>
          <span className="top-bar-divider">|</span>
          <a href="mailto:dzienkiewicz2@gmail.com">✉️ dzienkiewicz2@gmail.com</a>
        </div>
      </div>
    </div>
  );
}
