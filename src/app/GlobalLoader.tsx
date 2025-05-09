import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const GlobalLoader = () => {
  return (
    <div style={{
      position: 'fixed',         // Sticks it to the viewport
      top: 0,                   // Starts at the top
      left: 0,                  // Starts at the left
      width: '100vw',           // Full fuckin' width
      height: '100vh',          // Full fuckin' height
      backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dims the shit behind it
      display: 'flex',          // Centers the animation
      justifyContent: 'center', // Horizontally centered
      alignItems: 'center',     // Vertically centered
      zIndex: 9999              // Sits on top of everything
    }}>
      <DotLottieReact
        src="https://lottie.host/c123de5b-0d4a-4d6f-bc48-a4938e17db21/rkj10JzY4x.lottie"
        loop
        autoplay
      />
    </div>
  );
};

export default GlobalLoader;