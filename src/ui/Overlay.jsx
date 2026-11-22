import { VIEWPOINTS } from '../viewpoints.js';

const FACTS = [
  ['49,54 m', 'de hauteur'],
  ['44,82 m', 'de largeur'],
  ['22,21 m', 'de profondeur'],
  ['29,19 m', 'sous la grande voûte'],
];

function Sym({ children }) {
  return <span className="material-symbols-outlined" aria-hidden="true">{children}</span>;
}

export default function Overlay({ view, night, touring, onView, onToggleNight, onToggleTour }) {
  return (
    <div className="arc-overlay">
      <section className="arc-card" aria-label="Fiche du monument">
        <div className="arc-kicker">Paris · place Charles-de-Gaulle</div>
        <h1>Arc de triomphe de l'Étoile</h1>
        <p className="arc-dates">Commandé en 1806 · inauguré en 1836</p>
        <dl className="arc-facts">
          {FACTS.map(([v, l]) => (
            <div key={l}>
              <dt>{v}</dt>
              <dd>{l}</dd>
            </div>
          ))}
        </dl>
        <p className="arc-note">Reproduction stylisée, entièrement modélisée en code</p>
      </section>

      <nav className="arc-bar" aria-label="Points de vue">
        {VIEWPOINTS.map((v, i) => (
          <button key={v.id} type="button" className={view === v.id ? 'on' : ''} onClick={() => onView(v.id)} title={`Touche ${i + 1}`}>
            <Sym>{v.icon}</Sym>
            <span>{v.label}</span>
            <kbd>{i + 1}</kbd>
          </button>
        ))}
        <span className="arc-sep" />
        <button type="button" onClick={onToggleNight} title="Ambiance de jour ou de nuit">
          <Sym>{night ? 'light_mode' : 'dark_mode'}</Sym>
          <span>{night ? 'Jour' : 'Nuit'}</span>
        </button>
        <button type="button" className={touring ? 'on' : ''} onClick={onToggleTour} title="Rotation lente autour du monument">
          <Sym>{touring ? 'stop_circle' : 'play_circle'}</Sym>
          <span>{touring ? 'Arrêter' : 'Visite'}</span>
        </button>
      </nav>

      <div className="arc-help">Glisser : tourner · Molette : zoomer · Clic droit : déplacer</div>
    </div>
  );
}
