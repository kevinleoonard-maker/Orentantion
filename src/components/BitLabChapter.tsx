import React, { useState } from 'react';
import { charToByte, bitsToByte, toggleBit, applyBitwise, ByteRepresentation } from '../utils/binary';
import { sound } from '../utils/sound';
import { Binary, Sparkles, RefreshCw } from 'lucide-react';

interface BitLabChapterProps {
  onBitFlipped: () => void;
}

export const BitLabChapter: React.FC<BitLabChapterProps> = ({ onBitFlipped }) => {
  const [inputText, setInputText] = useState<string>('Ciao');
  const [byteRows, setByteRows] = useState<ByteRepresentation[]>(() => {
    return 'Ciao'.split('').map(charToByte);
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 8);
    setInputText(val);
    setByteRows(val.split('').map(charToByte));
  };

  const handleToggle = (charIdx: number, bitIdx: number) => {
    const target = byteRows[charIdx];
    if (!target) return;

    const newBits = toggleBit(target.bits, bitIdx);
    const updatedByte = bitsToByte(newBits);

    const updatedRows = [...byteRows];
    updatedRows[charIdx] = updatedByte;
    setByteRows(updatedRows);

    // Sync input text
    const updatedChars = updatedRows.map(r => r.char).join('');
    setInputText(updatedChars);

    onBitFlipped();
    sound.playFlipBit(newBits[bitIdx]);
  };

  const handleApplyBitwiseAll = (op: 'AND' | 'OR' | 'XOR', mask: number) => {
    const updatedRows = byteRows.map(row => {
      const newBits = applyBitwise(row.bits, op, mask);
      return bitsToByte(newBits);
    });
    setByteRows(updatedRows);
    setInputText(updatedRows.map(r => r.char).join(''));
    onBitFlipped();
    sound.playSuccess();
  };

  const resetTo = (text: string) => {
    setInputText(text);
    setByteRows(text.split('').map(charToByte));
    sound.playBlip(500, 'sine', 0.08);
  };

  return (
    <section id="bit" className="py-20 bg-slate-950 border-t border-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2">
            <span>Capitolo 3</span>
            <span className="text-slate-600">·</span>
            <span>La lingua nativa dei transistor</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Sotto il codice, esistono solo 0 e 1.
          </h2>
          <p className="text-slate-300 max-w-2xl leading-relaxed">
            Per un processore ogni lettera, colore o suono è una sequenza di byte.
            Ogni byte è formato da 8 piccoli interruttori fisici (bit). Scrivi una parola, poi clicca sui singoli bit per vedere come il testo muta istantaneamente!
          </p>
        </div>

        {/* Input Field & Presets */}
        <div className="mb-8 p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <label htmlFor="bit-word-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Scrivi una parola (max 8 lettere):
            </label>
            <input
              id="bit-word-input"
              type="text"
              maxLength={8}
              value={inputText}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-cyan-400 font-mono text-lg font-bold tracking-wider focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              placeholder="Scrivi qui..."
              spellCheck={false}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 mr-1">Esempi rapidi:</span>
            <button
              onClick={() => resetTo('Vallauri')}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            >
              Vallauri
            </button>
            <button
              onClick={() => resetTo('Robot')}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            >
              Robot
            </button>
            <button
              onClick={() => resetTo('Hacker')}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            >
              Hacker
            </button>
          </div>
        </div>

        {/* Bitwise Tools Strip */}
        <div className="mb-8 p-4 rounded-xl border border-cyan-500/20 bg-slate-950 flex flex-wrap items-center gap-3">
          <span className="text-xs font-mono font-semibold text-cyan-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Operazioni Bitwise CPU:
          </span>
          <button
            onClick={() => handleApplyBitwiseAll('AND', 0xDF)}
            className="px-3 py-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-mono text-sky-300 transition-all hover:border-sky-500/40"
          >
            AND 0xDF (MAIUSCOLO)
          </button>
          <button
            onClick={() => handleApplyBitwiseAll('OR', 0x20)}
            className="px-3 py-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-mono text-emerald-300 transition-all hover:border-emerald-500/40"
          >
            OR 0x20 (minuscolo)
          </button>
          <button
            onClick={() => handleApplyBitwiseAll('XOR', 0x20)}
            className="px-3 py-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-mono text-amber-300 transition-all hover:border-amber-500/40"
          >
            XOR 0x20 (Inverti Caso)
          </button>
        </div>

        {/* Interactive Byte Rows */}
        <div className="space-y-4 mb-10 overflow-x-auto">
          {byteRows.map((row, charIdx) => {
            const weights = [128, 64, 32, 16, 8, 4, 2, 1];
            return (
              <div
                key={charIdx}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 min-w-[620px] flex items-center justify-between gap-4"
              >
                {/* Character & Codes Badge */}
                <div className="flex items-center gap-4 w-44 shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-cyan-500/30 flex items-center justify-center font-mono text-2xl font-black text-cyan-400 shadow-inner">
                    {row.char}
                  </div>
                  <div className="text-xs font-mono space-y-0.5">
                    <div className="text-slate-300">
                      DEC: <b className="text-amber-400 tabular-nums">{row.code}</b>
                    </div>
                    <div className="text-slate-400">
                      HEX: <b className="text-sky-400">{row.hex}</b>
                    </div>
                  </div>
                </div>

                {/* 8 Bits Interactive Switches */}
                <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-center">
                  {row.bits.map((bitVal, bitIdx) => (
                    <div key={bitIdx} className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-mono text-slate-500">
                        {weights[bitIdx]}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggle(charIdx, bitIdx)}
                        aria-label={`Carattere ${row.char}, bit ${weights[bitIdx]}, stato ${bitVal ? 1 : 0}`}
                        className={`w-9 h-11 sm:w-11 sm:h-12 rounded-lg font-mono text-base font-bold transition-all shadow-md flex items-center justify-center ${
                          bitVal
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-cyan-500/30 hover:bg-cyan-400 scale-[1.02]'
                            : 'bg-slate-950 text-slate-500 border border-slate-800 hover:border-slate-700 hover:text-slate-300'
                        }`}
                      >
                        {bitVal ? '1' : '0'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Code Explanation Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5">
          <div className="flex items-center gap-2 mb-2 text-xs font-mono text-cyan-400">
            <Binary className="w-4 h-4" />
            <span>Come il computer gestisce i bit in memoria:</span>
          </div>
          <pre className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
            <code>{`// 1. Estrae il codice numerico ASCII/Unicode del carattere
const charCode = "${inputText[0] || 'A'}".charCodeAt(0); // -> ${byteRows[0]?.code || 65}

// 2. Converte il numero in stringa binaria a 8 bit
const binary = charCode.toString(2).padStart(8, '0'); // -> "${byteRows[0]?.bits.map(b => b ? '1' : '0').join('') || '01000001'}"

// 3. Modifica istantanea con operazioni bitwise hardware
const invertito = charCode ^ 0x20; // Inverte il 6° bit (32) convertendo tra maiuscolo e minuscolo!`}</code>
          </pre>
        </div>
      </div>
    </section>
  );
};
