import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Hand } from 'lucide-react';
import { doc, onSnapshot, updateDoc, increment, collection, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { db, initializeStats } from './firebase';

type HistoryEntry = {
  id: string;
  intensityLabel: string;
  time: string;
};

const INTENSITY_LABELS = ['Muito Suave', 'Suave', 'Média', 'Forte', 'Muito Forte'];

export default function App() {
  const [knocks, setKnocks] = useState(0);
  const [isKnocking, setIsKnocking] = useState(false);
  const [intensity, setIntensity] = useState<number>(3); // 0 to 4
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    initializeStats().catch(console.error);
  }, []);

  useEffect(() => {
    const statsRef = doc(db, 'doorStats', 'global');
    const unsubscribeStats = onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        setKnocks(docSnap.data().totalKnocks || 0);
      }
    });

    const historyRef = collection(db, 'knockHistory');
    const q = query(historyRef, orderBy('timestamp', 'desc'), limit(5));
    const unsubscribeHistory = onSnapshot(q, (snapshot) => {
      const historyData = snapshot.docs.map(doc => ({
        id: doc.id,
        intensityLabel: doc.data().intensityLabel,
        time: doc.data().time
      }));
      setHistory(historyData);
    });

    return () => {
      unsubscribeStats();
      unsubscribeHistory();
    };
  }, []);

  const handleKnock = useCallback(() => {
    setIsKnocking(true);
    
    // UI animation timeout
    setTimeout(() => setIsKnocking(false), 150);
    
    // Background Firestore updates (Fire-and-forget to keep UI responsive)
    try {
      const statsRef = doc(db, 'doorStats', 'global');
      updateDoc(statsRef, {
        totalKnocks: increment(1)
      }).catch(console.error);

      const now = new Date();
      const historyRef = collection(db, 'knockHistory');
      addDoc(historyRef, {
        intensityLabel: INTENSITY_LABELS[intensity],
        time: now.toLocaleTimeString('pt-BR', { hour12: false }),
        timestamp: Date.now()
      }).catch(console.error);
    } catch (error) {
      console.error("Error triggering knock:", error);
    }
  }, [intensity]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        // Prevent default action (like scrolling down on space)
        e.preventDefault();
        
        // If the user has focused the button using Tab, 
        // the browser will naturally trigger onClick on Space/Enter.
        // We ignore the global keydown in this case to avoid double counting.
        if (document.activeElement?.tagName === 'BUTTON') return;
        
        handleKnock();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKnock]);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 p-4 md:p-8 flex flex-col font-sans overflow-x-hidden">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-light tracking-tighter text-stone-400 uppercase">
            SIMULADOR BATIDA NA PORTA <br className="hidden md:block" /><span className="text-stone-100 font-bold">ENTRA E SAI RAFAEL</span>
          </h1>
          <p className="text-stone-500 text-sm tracking-widest mt-1">SIMULADOR DE ACÚSTICA RESIDENCIAL v1.0</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="px-3 py-1 border border-stone-800 rounded-full text-[10px] uppercase tracking-widest text-stone-500 font-semibold">
            Sessão Ativa: 12m 44s
          </div>
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
        </div>
      </header>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-6 gap-6 flex-grow">
        
        {/* Statistics Column */}
        <div className="md:col-span-3 md:row-span-3 bg-stone-900/50 border border-stone-800 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Total de Batidas</span>
            <motion.div
              key={knocks}
              initial={{ opacity: 0, y: -20, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="text-7xl font-light text-stone-100 mt-2 tracking-tighter tabular-nums"
            >
              {knocks}
            </motion.div>
          </div>
          <div className="h-[1px] bg-stone-800 w-full my-4 md:my-0"></div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-stone-400 italic">Média global</span>
            <span className="text-xs font-mono text-stone-500 uppercase font-bold">4.2 b/min</span>
          </div>
        </div>

        {/* Main Interaction Card (The Door) */}
        <div className="md:col-span-6 md:row-span-6 bg-stone-900 border-2 border-stone-800 rounded-[40px] relative overflow-hidden flex flex-col items-center justify-center group min-h-[400px]">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #ffffff 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          
          <motion.button
            onClick={handleKnock}
            animate={isKnocking ? { scale: 0.96, rotate: [-1, 2, -2, 1, 0] } : { scale: 1, rotate: 0 }}
            transition={{ duration: 0.2 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            className={`w-64 h-96 border-4 rounded-lg flex flex-col items-center justify-center relative cursor-pointer focus:outline-none focus:ring-4 focus:ring-stone-700/50 z-10 transition-colors duration-300 bg-stone-900 border-stone-800`}
            aria-label="Bater na porta"
          >
            <div className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-12 rounded-full transition-colors duration-300 bg-stone-800`}></div>
            <motion.div 
              animate={isKnocking ? { y: [0, 15, 0], rotate: [0, -10, 0] } : { y: 0, rotate: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className={`mb-4 transition-colors duration-300 text-stone-700 group-hover:text-stone-600`}
            >
              <Hand className="w-24 h-24" strokeWidth={1} />
            </motion.div>
            <div className="px-6 py-2 bg-stone-100 text-stone-950 font-bold rounded-full text-xs uppercase tracking-widest transition-colors group-hover:bg-white shadow-sm">Bater na Porta</div>
          </motion.button>
          
          <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
            <p className="text-stone-500 text-[10px] uppercase tracking-[0.3em] font-medium">Pressione [ESPAÇO] ou Clique</p>
          </div>
        </div>

        {/* History/Log Card */}
        <div className="md:col-span-3 md:row-span-6 bg-stone-900/50 border border-stone-800 rounded-3xl p-6 flex flex-col">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-4">Registro Recente</span>
          <div className="space-y-4 flex-grow overflow-hidden flex flex-col">
            {history.map((entry) => (
              <div key={entry.id} className="flex justify-between items-center text-xs border-b border-stone-800/50 pb-2">
                <span className="text-stone-300">{entry.intensityLabel}</span>
                <span className="text-stone-500 font-mono">{entry.time}</span>
              </div>
            ))}
            
            {/* Empty slots for visual consistency */}
            {Array.from({ length: Math.max(0, 5 - history.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="flex justify-between items-center text-xs border-b border-stone-800/50 pb-2 opacity-30">
                <span className="text-stone-300 italic">...vazio...</span>
                <span className="text-stone-500 font-mono">--:--:--</span>
              </div>
            ))}
          </div>
        </div>

        {/* Settings/Mode Card */}
        <div className="md:col-span-3 md:row-span-3 bg-stone-900/50 border border-stone-800 rounded-3xl p-6 flex flex-col justify-center">
          <div>
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Intensidade</span>
            <div className="flex gap-2 mt-4 justify-between items-end h-12">
              {[0, 1, 2, 3, 4].map((level) => (
                <button
                  key={level}
                  onClick={() => setIntensity(level)}
                  className={`w-full rounded-full transition-all duration-300 hover:bg-stone-500 ${
                    intensity === level
                      ? 'bg-stone-100 shadow-[0_0_8px_white]'
                      : 'bg-stone-800'
                  }`}
                  style={{ height: `${20 + level * 20}%` }}
                  aria-label={`Intensidade ${level + 1}`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-4">
               <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Suave</span>
               <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Forte</span>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Navigation */}
      <footer className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600">
        <div className="flex gap-8">
          <span className="text-stone-100 cursor-pointer hover:text-white transition-colors">Dashboard</span>
          <span className="hover:text-stone-400 cursor-pointer transition-colors">Acoustics</span>
          <span className="hover:text-stone-400 cursor-pointer transition-colors">History</span>
        </div>
        <div>
          EST. 2024 &copy; KNOCK SIM LABS
        </div>
      </footer>
    </div>
  );
}
