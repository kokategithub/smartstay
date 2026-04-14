import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">🏠 Smart<span>Stay</span></div>
          <p>Intelligent accommodation finder for students and working professionals. Find your perfect room near your workplace or college.</p>
          <div className="footer-social">
            <a href="#!" aria-label="Facebook">📘</a>
            <a href="#!" aria-label="Twitter">🐦</a>
            <a href="#!" aria-label="Instagram">📸</a>
            <a href="#!" aria-label="LinkedIn">💼</a>
          </div>
        </div>

        <div className="footer-links">
          <h4>Quick Links</h4>
          <Link to="/">Home</Link>
          <Link to="/rooms">Find Rooms</Link>
          <Link to="/auth">Login / Register</Link>
          <Link to="/dashboard">Owner Dashboard</Link>
        </div>

        <div className="footer-links">
          <h4>Cities</h4>
          <Link to="/rooms?city=Bangalore">Bangalore</Link>
          <Link to="/rooms?city=Mumbai">Mumbai</Link>
          <Link to="/rooms?city=Pune">Pune</Link>
          <Link to="/rooms?city=Delhi">Delhi</Link>
          <Link to="/rooms?city=Hyderabad">Hyderabad</Link>
          <Link to="/rooms?city=Chennai">Chennai</Link>
        </div>

        <div className="footer-links">
          <h4>Support</h4>
          <a href="#!">Help Center</a>
          <a href="#!">Safety Info</a>
          <a href="#!">Privacy Policy</a>
          <a href="#!">Terms of Service</a>
          <a href="#!">Contact Us</a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2024 SmartStay. All rights reserved. Built with ❤️ for students & professionals.</p>
      </div>
    </footer>
  );
}
