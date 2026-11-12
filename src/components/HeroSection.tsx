import React from 'react';
import { ArrowRight, Hand } from 'lucide-react';
import DroneScene from './DroneScene';
import FlightStatus from './FlightStatus';

// Hero come quello del sito di Kevin Saccato: testo a sinistra, piazzola con il drone 3D a destra.
export const HeroSection: React.FC = () => (
  // Telefono: hero alto una schermata, testo sopra e piazzola nello spazio che resta. Desktop: affiancati.
  <section
    id="top"
    className="px-[var(--gutter)] h-[var(--screen)] min-h-[560px] flex flex-col gap-6 py-6 min-[1100px]:h-auto min-[1100px]:min-h-[var(--screen)] min-[1100px]:grid min-[1100px]:grid-cols-[minmax(0,1fr)_420px] min-[1100px]:items-center min-[1100px]:gap-16 min-[1100px]:py-10"
  >
    <div>
      <p className="label flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full bg-pad" aria-hidden="true" />
        Open Day · Istituto Vallauri · Fossano
      </p>
      <h1 className="mt-5 text-[clamp(44px,8.4vw,136px)] font-semibold leading-[0.92] tracking-[-0.045em]">
        Questo drone
        <br />
        non sa fare niente.
      </h1>
      <p className="mt-5 min-[1100px]:mt-7 max-w-[36ch] text-[clamp(17px,1.8vw,24px)] leading-[1.5] text-muted">
        Tra dieci minuti volerà da solo. Sei prove, nessun manuale. Come ci sei riuscito? Te lo diciamo all'atterraggio.
      </p>
      <div className="mt-7 min-[1100px]:mt-10 flex flex-wrap gap-3">
        <a href="#prova-ai" className="btn btn-primary">
          Accendi i motori <ArrowRight className="w-[18px] h-[18px]" />
        </a>
        <a href="#prove" className="btn btn-secondary">
          Le sei prove
        </a>
      </div>
    </div>

    <div className="flex-1 min-h-0 flex flex-col items-center gap-3 min-[1100px]:flex-none min-[1100px]:gap-4">
      <DroneScene />
      <FlightStatus />
      <p className="label flex items-center gap-2 normal-case tracking-normal text-[13px]">
        <Hand className="w-4 h-4" aria-hidden="true" /> Puoi prenderlo e spostarlo
      </p>
    </div>
  </section>
);
