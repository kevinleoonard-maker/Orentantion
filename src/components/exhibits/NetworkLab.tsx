import React, { useState, useEffect, useRef } from 'react';
import { Packet, fragmentMessage, assembleMessage } from '../../utils/networkSim';
import { sound } from '../../utils/sound';
import { Network, Send, ShieldAlert, CheckCircle2, RotateCcw, Radio } from 'lucide-react';

export const NetworkLab: React.FC<{ onActivity: () => void }> = ({ onActivity }) => {
  const [inputMessage, setInputMessage] = useState<string>('QUOTA 120M OK');
  const [packets, setPackets] = useState<Packet[]>([]);
  const [deliveredPackets, setDeliveredPackets] = useState<Packet[]>([]);
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [droppedCount, setDroppedCount] = useState<number>(0);
  const [retransmitCount, setRetransmitCount] = useState<number>(0);

  const startTransmission = () => {
    const rawPackets = fragmentMessage(inputMessage);
    setPackets(rawPackets);
    setDeliveredPackets([]);
    setIsTransmitting(true);
    setDroppedCount(0);
    setRetransmitCount(0);
    sound.playBlip(550, 'sine', 0.08);
    onActivity();
  };

  // Packet transit simulation loop
  useEffect(() => {
    if (!isTransmitting || packets.length === 0) return;

    const interval = setInterval(() => {
      setPackets((currentPackets) => {
        // Find next packet in transit
        const inTransit = currentPackets.filter(p => p.status === 'transit');
        if (inTransit.length === 0) {
          // Check if any packet is dropped and needs TCP retransmit
          const dropped = currentPackets.filter(p => p.status === 'dropped');
          if (dropped.length > 0) {
            // TCP Retransmit!
            setRetransmitCount(r => r + 1);
            sound.playBlip(700, 'sawtooth', 0.05);
            return currentPackets.map(p => p.status === 'dropped' ? { ...p, status: 'transit', attempts: p.attempts + 1 } : p);
          } else {
            // All delivered!
            setIsTransmitting(false);
            sound.playSuccess();
            return currentPackets;
          }
        }

        // Deliver one packet
        const target = inTransit[0];
        setDeliveredPackets(prev => [...prev, target]);
        sound.playBlip(440 + target.seq * 20, 'sine', 0.03);

        return currentPackets.map(p => p.seq === target.seq ? { ...p, status: 'delivered' } : p);
      });
    }, 450);

    return () => clearInterval(interval);
  }, [isTransmitting, packets]);

  // Drop packet on user click (Chaos Monkey)
  const dropPacket = (seq: number) => {
    setPackets(prev => prev.map(p => p.seq === seq ? { ...p, status: 'dropped' } : p));
    setDroppedCount(d => d + 1);
    sound.playCrash();
    onActivity();
  };

  const reassembledText = assembleMessage(deliveredPackets, inputMessage.length);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
      {/* Exhibit Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-purple-400 mb-1">
            <Network className="w-4 h-4 text-purple-400" />
            <span>Prova 04 · Collegamento radio</span>
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            Il drone chiama la base
          </h3>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed mt-1">
            Il messaggio non parte intero: viene fatto a pezzetti numerati che viaggiano da soli.
            Clicca su un pezzo mentre vola per <b>distruggerlo</b>. Riuscirai a far arrivare alla base un messaggio rovinato?
          </p>
        </div>

        {/* Transmission Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={startTransmission}
            disabled={isTransmitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs shadow-md transition-all disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5 fill-current" />
            <span>Trasmetti</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Message Input Strip */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <label htmlFor="net-msg-input" className="block text-xs font-mono text-slate-400 mb-1">
              Messaggio del drone (max 16 caratteri):
            </label>
            <input
              id="net-msg-input"
              type="text"
              maxLength={16}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isTransmitting}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-purple-300 font-mono text-base font-bold focus:outline-none focus:border-purple-400"
            />
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500 block">Pezzi distrutti:</span>
              <span className="font-bold text-rose-400 tabular-nums">{droppedCount}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Rispediti:</span>
              <span className="font-bold text-amber-400 tabular-nums">{retransmitCount}</span>
            </div>
          </div>
        </div>

        {/* Visual Pipeline: Fossano Client -> Internet Routers -> Tokyo Server */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-[#0a0f1d] shadow-inner space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Sender Node */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 w-44 text-center shrink-0">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Mittente</span>
              <h4 className="text-sm font-bold text-white mt-0.5">Drone KS-01</h4>
              <span className="text-xs font-mono text-purple-400 block mt-1">IP: 10.0.0.42</span>
            </div>

            {/* In-Flight Packets Router Track */}
            <div className="flex-1 w-full p-4 rounded-xl border border-slate-800/80 bg-slate-900/60 overflow-x-auto min-h-[110px] flex items-center justify-center gap-2">
              {packets.length === 0 ? (
                <span className="text-xs font-mono text-slate-500 italic">
                  Premi "Trasmetti" e prova a sabotare il segnale
                </span>
              ) : (
                packets.map((pkt) => {
                  const isTransit = pkt.status === 'transit';
                  const isDelivered = pkt.status === 'delivered';
                  const isDropped = pkt.status === 'dropped';

                  return (
                    <button
                      key={pkt.seq}
                      type="button"
                      onClick={() => {
                        if (isTransit) dropPacket(pkt.seq);
                      }}
                      className={`p-2.5 rounded-lg border text-center transition-all min-w-[55px] ${
                        isTransit
                          ? 'bg-purple-500/20 border-purple-400 text-purple-300 animate-bounce cursor-pointer hover:bg-rose-500/30 hover:border-rose-500'
                          : isDelivered
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 opacity-60'
                          : 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                      }`}
                      title={isTransit ? 'Clicca per distruggere questo pezzo' : undefined}
                    >
                      <span className="text-[9px] font-mono text-slate-400 block">Seq #{pkt.seq}</span>
                      <span className="text-base font-mono font-black block">'{pkt.char}'</span>
                      <span className="text-[9px] font-mono text-slate-500">chk:{pkt.checksum}</span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Receiver Node */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 w-44 text-center shrink-0">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Destinatario</span>
              <h4 className="text-sm font-bold text-white mt-0.5">Base Vallauri</h4>
              <span className="text-xs font-mono text-emerald-400 block mt-1">IP: 10.0.0.1</span>
            </div>
          </div>

          {/* Reassembled Stream at Destination */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block">Messaggio ricevuto dalla base:</span>
              <span className="text-xl font-bold text-emerald-400 tracking-wider">
                {reassembledText || 'In attesa pacchetti...'}
              </span>
            </div>

            <div className="text-right text-slate-400">
              <span>Stato Handshake: </span>
              <b className={isTransmitting ? 'text-amber-400' : 'text-emerald-400'}>
                {isTransmitting ? 'ESTABLISHED (Trasferimento attivo)' : 'SYN-ACK CONFERMATO'}
              </b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
