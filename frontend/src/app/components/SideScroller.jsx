import React, { useRef } from 'react';
import './SideScroller.css'; // CSS styles listed below

const SideScroller = ({ children, scrollAmount = 200 }) => {
  const scrollRef = useRef(null);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <div className="scroller-wrapper">
      <button className="scroll-btn left" onClick={scrollLeft}>←</button>
      <div className="scroll-container" ref={scrollRef}>
        <div className="scroll-track">
          {children}
        </div>
      </div>
      <button className="scroll-btn right" onClick={scrollRight}>→</button>
    </div>
  );
};

export default SideScroller;
