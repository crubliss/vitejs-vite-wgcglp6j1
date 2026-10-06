import { useEffect, useState, useCallback, useRef } from 'react';
import { Crosshair, Target, Trophy, Clock, Play, RotateCcw } from 'lucide-react';
import { supabase, Gun, RangeScore } from '@/lib/supabase';

interface TargetObj {
  id: number;
  x: number;
  y: number;
  size: number;
  hit: boolean;
  spawnTime: number;
}

type Phase = 'idle' | 'playing' | 'finished';

const ROUND_DURATION = 30; // seconds

export function ShootingRange() {
  const [guns, setGuns] = useState<Gun[]>([]);
  const [selectedGun, setSelectedGun] = useState<Gun | null>(null);
  const [scores, setScores] = useState<RangeScore[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [targets, setTargets] = useState<TargetObj[]>([]);
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(0);
  const [hits, setHits] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const targetIdRef = useRef(0);
  const areaRef = useRef<HTMLDivElement | null>(null);

  const loadGuns = useCallback(async () => {
    const { data } = await supabase.from('guns').select('*').order('created_at', { ascending: false });
    setGuns((data ?? []) as Gun[]);
    if (data && data.length > 0 && !selectedGun) setSelectedGun(data[0] as Gun);
  }, []);

  const loadScores = useCallback(async () => {
    const { data } = await supabase.from('range_scores').select('*').order('score', { ascending: false }).limit(10);
    setScores((data ?? []) as RangeScore[]);
  }, []);

  useEffect(() => { loadGuns(); loadScores(); }, [loadGuns, loadScores]);

  const showMsg = useCallback((type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }, []);

  // Game loop
  useEffect(() => {
    if (phase !== 'playing') return;

    // Spawn targets based on fire rate
    const spawnInterval = Math.max(400, 2000 - (selectedGun?.fire_rate ?? 30) * 30);
    const spawnTimer = window.setInterval(() => {
      setTargets((prev) => {
        const id = targetIdRef.current++;
        const size = 30 + Math.random() * 40;
        const x = 5 + Math.random() * 90;
        const y = 10 + Math.random() * 75;
        return [...prev, { id, x, y, size, hit: false, spawnTime: Date.now() }];
      });
    }, spawnInterval);

    // Remove old targets
    const cleanupTimer = window.setInterval(() => {
      setTargets((prev) => prev.filter((t) => !t.hit && Date.now() - t.spawnTime < 3000));
    }, 500);

    // Countdown
    const countdownTimer = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      clearInterval(spawnTimer);
      clearInterval(cleanupTimer);
      clearInterval(countdownTimer);
    };
  }, [phase, selectedGun]);

  // End game when time runs out
  useEffect(() => {
    if (phase === 'playing' && timeLeft <= 0) {
      endGame();
    }
  }, [timeLeft, phase]);

  const startGame = () => {
    if (!selectedGun) return showMsg('error', 'Build a gun in the workshop first');
    setPhase('playing');
    setScore(0);
    setShots(0);
    setHits(0);
    setTimeLeft(ROUND_DURATION);
    setTargets([]);
    targetIdRef.current = 0;
  };

  const endGame = async () => {
    setPhase('finished');
    const accuracy = shots > 0 ? (hits / shots) * 100 : 0;
    if (selectedGun) {
      await supabase.from('range_scores').insert({
        score,
        targets_hit: hits,
        accuracy_pct: accuracy,
        gun_name: selectedGun.name,
      });
      await loadScores();
    }
  };

  const resetGame = () => {
    setPhase('idle');
    setTargets([]);
    setScore(0);
    setShots(0);
    setHits(0);
    setTimeLeft(ROUND_DURATION);
  };

  const handleShoot = (e: React.MouseEvent, target: TargetObj) => {
    if (phase !== 'playing' || target.hit) return;
    e.stopPropagation();

    // Accuracy check — gun accuracy affects hit chance
    const hitChance = (selectedGun?.accuracy ?? 50) / 100;
    const actuallyHit = Math.random() < hitChance;

    setShots((s) => s + 1);

    if (actuallyHit) {
      setHits((h) => h + 1);
      // Score based on target size (smaller = more points) and gun damage
      const sizeBonus = Math.round((80 - target.size) * 2);
      const dmgBonus = (selectedGun?.damage ?? 10) * 2;
      const points = Math.max(10, sizeBonus + dmgBonus);
      setScore((s) => s + points);
      setTargets((prev) => prev.map((t) => (t.id === target.id ? { ...t, hit: true } : t)));
      // Remove hit target after animation
      setTimeout(() => {
        setTargets((prev) => prev.filter((t) => t.id !== target.id));
      }, 300);
    }
  };

  const handleMiss = () => {
    if (phase !== 'playing') return;
    setShots((s) => s + 1);
  };

  const accuracy = shots > 0 ? (hits / shots) * 100 : 0;
  const bestScore = scores.length > 0 ? scores[0].score : 0;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 mb-1">Shooting Range</h2>
        <p className="text-zinc-500 text-sm">Test your custom guns against moving targets. Click targets to shoot.</p>
      </div>

      {msg && (
        <div className={`px-4 py-2.5 rounded-lg text-sm ${msg.type === 'success' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      {/* Gun selector + stats */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <Crosshair className="w-5 h-5 text-amber-500" />
          <select value={selectedGun?.id ?? ''} onChange={(e) => {
            const gun = guns.find((g) => g.id === e.target.value);
            if (gun) setSelectedGun(gun);
          }} disabled={phase === 'playing'}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-600 disabled:opacity-50">
          {guns.length === 0 ? <option value="">No guns built yet</option> :
            guns.map((g) => <option key={g.id} value={g.id}>{g.name} (DMG {g.damage} / ACC {g.accuracy})</option>)}
        </select>
        </div>
        {selectedGun && (
          <div className="flex gap-3 text-xs">
            <span className="px-2 py-1 rounded bg-red-900/40 text-red-400 font-medium">DMG {selectedGun.damage}</span>
            <span className="px-2 py-1 rounded bg-blue-900/40 text-blue-400 font-medium">ACC {selectedGun.accuracy}%</span>
            <span className="px-2 py-1 rounded bg-amber-900/40 text-amber-400 font-medium">ROF {selectedGun.fire_rate}</span>
          </div>
        )}
      </div>

      {/* Game area */}
      <div
        ref={areaRef}
        onClick={handleMiss}
        className="relative w-full rounded-xl border-2 border-zinc-700 overflow-hidden cursor-crosshair bg-gradient-to-b from-zinc-800 to-zinc-900"
        style={{ height: '400px' }}
      >
        {/* Range background */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.05) 60px, rgba(255,255,255,0.05) 61px)',
        }} />

        {phase === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <Target className="w-16 h-16 text-amber-500 mb-2" />
            <h3 className="text-xl font-bold text-zinc-100">Ready to Shoot?</h3>
            <p className="text-sm text-zinc-500 text-center max-w-md">
              {selectedGun ? `Using "${selectedGun.name}". You have ${ROUND_DURATION} seconds to hit as many targets as you can.` : 'Build a gun in the workshop first, then select it above.'}
            </p>
            <button onClick={startGame} disabled={!selectedGun}
              className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50">
              <Play className="w-5 h-5" /> Start Shooting
            </button>
          </div>
        )}

        {phase === 'playing' && (
          <>
            {/* HUD */}
            <div className="absolute top-3 left-3 flex gap-3 z-10 pointer-events-none">
              <div className="bg-black/60 backdrop-blur rounded-lg px-3 py-2 text-xs">
                <span className="text-zinc-500">Score: </span>
                <span className="text-amber-400 font-bold text-base tabular-nums">{score}</span>
              </div>
              <div className="bg-black/60 backdrop-blur rounded-lg px-3 py-2 text-xs">
                <span className="text-zinc-500">Hits: </span>
                <span className="text-emerald-400 font-bold text-base">{hits}/{shots}</span>
              </div>
              <div className="bg-black/60 backdrop-blur rounded-lg px-3 py-2 text-xs">
                <span className="text-zinc-500">ACC: </span>
                <span className="text-blue-400 font-bold text-base">{accuracy.toFixed(0)}%</span>
              </div>
            </div>

            {/* Timer */}
            <div className="absolute top-3 right-3 z-10 pointer-events-none">
              <div className="bg-black/60 backdrop-blur rounded-lg px-3 py-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className={`font-bold text-base tabular-nums ${timeLeft <= 5 ? 'text-red-400' : 'text-zinc-200'}`}>{timeLeft}s</span>
              </div>
            </div>

            {/* Targets */}
            {targets.map((target) => (
              <div
                key={target.id}
                onClick={(e) => handleShoot(e, target)}
                className="absolute cursor-pointer transition-all"
                style={{
                  left: `${target.x}%`,
                  top: `${target.y}%`,
                  width: `${target.size}px`,
                  height: `${target.size}px`,
                  transform: target.hit ? 'scale(0)' : 'scale(1)',
                  opacity: target.hit ? 0 : 1,
                }}
              >
                <div className="w-full h-full rounded-full border-4 border-red-500 bg-red-600/30 flex items-center justify-center hover:border-amber-400 transition-colors">
                  <div className="w-1/2 h-1/2 rounded-full border-2 border-red-400 bg-red-500/40" />
                </div>
              </div>
            ))}
          </>
        )}

        {phase === 'finished' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 backdrop-blur">
            <Trophy className="w-16 h-16 text-amber-500 mb-2" />
            <h3 className="text-2xl font-bold text-zinc-100">Round Complete!</h3>
            <div className="flex gap-6 text-center">
              <div>
                <div className="text-xs text-zinc-500">Score</div>
                <div className="text-2xl font-bold text-amber-400 tabular-nums">{score}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Targets Hit</div>
                <div className="text-2xl font-bold text-emerald-400">{hits}/{shots}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Accuracy</div>
                <div className="text-2xl font-bold text-blue-400">{accuracy.toFixed(0)}%</div>
              </div>
            </div>
            <button onClick={resetGame} className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors">
              <RotateCcw className="w-5 h-5" /> Play Again
            </button>
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" /> Top Scores {bestScore > 0 && <span className="text-zinc-500 font-normal">(Best: {bestScore})</span>}
        </h3>
        {scores.length === 0 ? (
          <p className="text-sm text-zinc-600">No scores yet. Play a round to get on the leaderboard.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {scores.map((s, i) => (
              <div key={s.id} className="flex items-center justify-between text-sm bg-zinc-800/40 rounded-lg px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-600 text-white' : i === 1 ? 'bg-zinc-400 text-zinc-900' : i === 2 ? 'bg-amber-800 text-white' : 'bg-zinc-700 text-zinc-300'}`}>
                    {i + 1}
                  </span>
                  <span className="text-zinc-200 font-medium">{s.gun_name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-zinc-500">{s.targets_hit} hits</span>
                  <span className="text-zinc-500">{Number(s.accuracy_pct).toFixed(0)}% acc</span>
                  <span className="text-amber-400 font-bold tabular-nums">{s.score}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
