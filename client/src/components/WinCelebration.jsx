import React, { useEffect, useState } from 'react';

function WinCelebration({ winnerName, onClose }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF9F1C', '#B980F0', '#FF85A2', '#00C9A7'];
    const newParticles = Array.from({ length: 80 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 10 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 1.5,
      duration: Math.random() * 2 + 2,
      rotate: Math.random() * 360,
      shape: Math.random() > 0.5 ? 'circle' : 'square',
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="celebration-overlay">
      <div className="confetti-container">
        {particles.map((p, i) => (
          <div
            key={i}
            className={`confetti-particle ${p.shape}`}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              transform: `rotate(${p.rotate}deg)`,
            }}
          />
        ))}
      </div>
      <div className="celebration-content">
        <div className="winner-big-name">{winnerName}</div>
        <div className="winner-sub">wins the game! 🏆</div>
        <button className="celebration-close-btn" onClick={onClose}>
          ✨ Close
        </button>
      </div>
    </div>
  );
}

export default WinCelebration;