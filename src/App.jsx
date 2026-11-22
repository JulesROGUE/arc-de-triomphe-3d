import { useEffect, useRef, useState } from 'react';
import { createScene } from './scene/createScene.js';
import Overlay from './ui/Overlay.jsx';
import './ui/overlay.css';

// Monte la scène Three.js plein écran et la petite surcouche HTML.
export default function App() {
  const stageRef = useRef(null);
  const apiRef = useRef(null);
  const [view, setView] = useState('facade');
  const [night, setNight] = useState(false);
  const [touring, setTouring] = useState(false);

  useEffect(() => {
    const api = createScene(stageRef.current, { onView: setView, onNight: setNight, onTour: setTouring });
    apiRef.current = api;
    return () => {
      api.dispose();
      apiRef.current = null;
    };
  }, []);

  return (
    <div className="arc-root">
      <div ref={stageRef} className="arc-stage" />
      <Overlay
        view={view}
        night={night}
        touring={touring}
        onView={(id) => apiRef.current?.goTo(id)}
        onToggleNight={() => apiRef.current?.toggleNight()}
        onToggleTour={() => apiRef.current?.toggleTour()}
      />
    </div>
  );
}
