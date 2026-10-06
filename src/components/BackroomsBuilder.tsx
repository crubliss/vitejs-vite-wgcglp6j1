import { useEffect, useState, useCallback, useRef } from 'react';
import { Box, Save, Trash2, Eye, Grid3x3, BookOpen, ChevronRight, Camera, RotateCw } from 'lucide-react';
import { supabase, BackroomBuild } from '@/lib/supabase';

type TileType = 0 | 1 | 2 | 3 | 4 | 5;
// 0 = empty, 1 = wall, 2 = floor, 3 = pillar, 4 = light, 5 = water/pool

const TILE_INFO: Record<TileType, { name: string; color: string; label: string }> = {
  0: { name: 'Empty', color: 'transparent', label: 'Erase' },
  1: { name: 'Wall', color: '#c9a84c', label: 'Wall' },
  2: { name: 'Floor', color: '#d4b85a', label: 'Floor' },
  3: { name: 'Pillar', color: '#a88a30', label: 'Pillar' },
  4: { name: 'Light', color: '#fff8dc', label: 'Light' },
  5: { name: 'Pool', color: '#4a9eff', label: 'Pool Water' },
};

const GRID_SIZE = 12;

type Theme = 'backrooms' | 'poolrooms';

const THEMES: Record<Theme, { wall: [string, string]; floor: string; ceiling: string; accent: string; name: string; lightColor: string; fog: string }> = {
  backrooms: {
    wall: ['#d4b85a', '#a88a30'],
    floor: '#c9a84c',
    ceiling: '#e0c870',
    accent: '#8a7020',
    name: 'The Backrooms',
    lightColor: '#fff8dc',
    fog: '#1a1400',
  },
  poolrooms: {
    wall: ['#c8e0ec', '#7ba8c4'],
    floor: '#5a98c0',
    ceiling: '#d8e8f0',
    accent: '#4a8aaa',
    name: 'The Poolrooms',
    lightColor: '#a0e0ff',
    fog: '#0a1820',
  },
};

const INSTRUCTIONS = [
  { title: 'Choose a Theme', text: 'Select between the iconic yellow Backrooms or the eerie blue Poolrooms aesthetic.' },
  { title: 'Select a Tile Type', text: 'Pick from Wall, Floor, Pillar, Light, or Pool Water. Click tiles on the grid to place them.' },
  { title: 'Build Your Room', text: 'Click and drag across the grid to paint tiles. Right-click or use Erase to remove tiles.' },
  { title: 'Enter 3D Walk Mode', text: 'Click "Enter 3D" to walk through your creation in first-person. Use WASD or arrow keys to move, A/D to turn.' },
  { title: 'Save Your Build', text: 'Give your room a name and save it. You can load saved builds anytime from the list below.' },
];

function isWall(grid: TileType[][], r: number, c: number): boolean {
  if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) return true;
  const t = grid[r][c];
  return t === 1 || t === 3;
}

export function BackroomsBuilder() {
  const [theme, setTheme] = useState<Theme>('backrooms');
  const [grid, setGrid] = useState<TileType[][]>(() => {
    const g: TileType[][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row: TileType[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        if (r === 0 || r === GRID_SIZE - 1 || c === 0 || c === GRID_SIZE - 1) row.push(1);
        else row.push(2);
      }
      g.push(row);
    }
    return g;
  });
  const [selectedTile, setSelectedTile] = useState<TileType>(2);
  const [mode, setMode] = useState<'build' | '3d'>('build');
  const [buildName, setBuildName] = useState('');
  const [savedBuilds, setSavedBuilds] = useState<BackroomBuild[]>([]);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [activeInstruction, setActiveInstruction] = useState(0);

  // 3D state stored in refs to avoid re-renders during animation
  const camXRef = useRef(GRID_SIZE / 2 + 0.5);
  const camZRef = useRef(GRID_SIZE / 2 + 0.5);
  const camRotRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const gridRef = useRef(grid);
  const themeRef = useRef(theme);
  const [hudData, setHudData] = useState({ x: 0, z: 0, rot: 0 });

  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { themeRef.current = theme; }, [theme]);

  const loadBuilds = useCallback(async () => {
    const { data } = await supabase.from('backroom_builds').select('*').order('updated_at', { ascending: false });
    setSavedBuilds((data ?? []) as BackroomBuild[]);
  }, []);

  useEffect(() => {
    loadBuilds();
  }, [loadBuilds]);

  const showMsg = useCallback((type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }, []);

  const paintTile = (r: number, c: number) => {
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = selectedTile;
      return next;
    });
  };

  const saveBuild = async () => {
    if (!buildName.trim()) return showMsg('error', 'Enter a build name');
    await supabase.from('backroom_builds').insert({ name: buildName.trim(), layout: grid, theme });
    showMsg('success', `Saved "${buildName}" build`);
    setBuildName('');
    await loadBuilds();
  };

  const loadBuild = (build: BackroomBuild) => {
    setGrid(build.layout as TileType[][]);
    setTheme(build.theme as Theme);
    showMsg('success', `Loaded "${build.name}"`);
  };

  const deleteBuild = async (id: string) => {
    await supabase.from('backroom_builds').delete().eq('id', id);
    await loadBuilds();
  };

  const clearGrid = () => {
    setGrid(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0) as TileType[]));
  };

  // Raycaster rendering on canvas
  useEffect(() => {
    if (mode !== '3d') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const FOV = Math.PI / 3;
    const numRays = Math.floor(W / 2);
    const maxDist = 20;

    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let hudCounter = 0;

    const animate = () => {
      const keys = keysRef.current;
      const speed = 0.04;
      const rotSpeed = 0.035;
      const g = gridRef.current;
      const th = THEMES[themeRef.current];

      if (keys.has('a') || keys.has('arrowleft')) camRotRef.current -= rotSpeed;
      if (keys.has('d') || keys.has('arrowright')) camRotRef.current += rotSpeed;

      let dx = 0, dz = 0;
      if (keys.has('w') || keys.has('arrowup')) {
        dx += Math.sin(camRotRef.current) * speed;
        dz -= Math.cos(camRotRef.current) * speed;
      }
      if (keys.has('s') || keys.has('arrowdown')) {
        dx -= Math.sin(camRotRef.current) * speed;
        dz += Math.cos(camRotRef.current) * speed;
      }

      if (dx !== 0 || dz !== 0) {
        const nx = camXRef.current + dx;
        const nz = camZRef.current + dz;
        if (!isWall(g, Math.floor(nz), Math.floor(camXRef.current))) camZRef.current = nz;
        if (!isWall(g, Math.floor(camZRef.current), Math.floor(nx))) camXRef.current = nx;
      }

      // Cast rays
      const camX = camXRef.current;
      const camZ = camZRef.current;
      const camRot = camRotRef.current;

      // Draw ceiling and floor
      const horizon = H / 2;
      const floorGrad = ctx.createLinearGradient(0, horizon, 0, H);
      floorGrad.addColorStop(0, th.floor);
      floorGrad.addColorStop(1, th.fog);
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, horizon, W, H / 2);

      const ceilGrad = ctx.createLinearGradient(0, 0, 0, horizon);
      ceilGrad.addColorStop(0, th.fog);
      ceilGrad.addColorStop(1, th.ceiling);
      ctx.fillStyle = ceilGrad;
      ctx.fillRect(0, 0, W, horizon);

      for (let i = 0; i < numRays; i++) {
        const rayAngle = camRot - FOV / 2 + (i / numRays) * FOV;
        const rayDirX = Math.sin(rayAngle);
        const rayDirZ = -Math.cos(rayAngle);

        // DDA raycast
        let dist = 0;
        let hitTile: TileType = 0;
        let hitWater = false;
        const step = 0.02;

        while (dist < maxDist) {
          const px = camX + rayDirX * dist;
          const pz = camZ + rayDirZ * dist;
          const col = Math.floor(px);
          const row = Math.floor(pz);
          if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) break;
          const tile = g[row][col];
          if (tile === 1 || tile === 3) { hitTile = tile; break; }
          if (tile === 5 && dist > 0.3) hitWater = true;
          dist += step;
        }

        if (hitTile === 0 && dist >= maxDist) continue;

        // Correct fisheye
        const correctedDist = dist * Math.cos(rayAngle - camRot);
        const wallHeight = Math.min(H, (H / correctedDist) * 0.8);
        const wallTop = horizon - wallHeight / 2;
        const x = i * (W / numRays);
        const colWidth = Math.ceil(W / numRays) + 1;

        // Wall coloring
        let wallColor = th.wall[0];
        if (hitTile === 3) wallColor = th.accent;

        // Distance shading
        const shade = Math.max(0, 1 - correctedDist / maxDist);
        const r = parseInt(wallColor.slice(1, 3), 16);
        const g2 = parseInt(wallColor.slice(3, 5), 16);
        const b = parseInt(wallColor.slice(5, 7), 16);
        const fr = Math.floor(r * shade + parseInt(th.fog.slice(1, 3), 16) * (1 - shade));
        const fg = Math.floor(g2 * shade + parseInt(th.fog.slice(3, 5), 16) * (1 - shade));
        const fb = Math.floor(b * shade + parseInt(th.fog.slice(5, 7), 16) * (1 - shade));

        ctx.fillStyle = `rgb(${fr},${fg},${fb})`;
        ctx.fillRect(x, wallTop, colWidth, wallHeight);

        // Wall texture lines
        if (correctedDist < maxDist * 0.6) {
          ctx.fillStyle = `rgba(0,0,0,0.15)`;
          const stripeH = wallHeight / 8;
          for (let s = 0; s < 8; s += 2) {
            ctx.fillRect(x, wallTop + s * stripeH, colWidth, stripeH);
          }
        }

        // Water reflection on lower half
        if (hitWater && hitTile === 0) {
          ctx.fillStyle = `rgba(74, 158, 255, ${0.3 * shade})`;
          ctx.fillRect(x, horizon, colWidth, H / 2);
        }
      }

      // Light glows
      for (let r2 = 0; r2 < GRID_SIZE; r2++) {
        for (let c2 = 0; c2 < GRID_SIZE; c2++) {
          if (g[r2][c2] !== 4) continue;
          const lx = c2 + 0.5;
          const lz = r2 + 0.5;
          const ldx = lx - camX;
          const ldz = lz - camZ;
          const ldist = Math.sqrt(ldx * ldx + ldz * ldz);
          if (ldist > maxDist) continue;
          // Check line of sight (simple)
          const lang = Math.atan2(ldx, -ldz);
          const ldiff = Math.abs(((lang - camRot + Math.PI) % (Math.PI * 2)) - Math.PI);
          if (ldiff > FOV / 2) continue;
          const lscreenX = ((lang - camRot + FOV / 2) / FOV) * W;
          const lshade = Math.max(0, 1 - ldist / maxDist);
          const glowR = 15 + 30 * lshade;
          const grad = ctx.createRadialGradient(lscreenX, horizon - 20, 0, lscreenX, horizon - 20, glowR);
          grad.addColorStop(0, th.lightColor + Math.floor(lshade * 200).toString(16).padStart(2, '0'));
          grad.addColorStop(1, th.lightColor + '00');
          ctx.fillStyle = grad;
          ctx.fillRect(lscreenX - glowR, horizon - 20 - glowR, glowR * 2, glowR * 2);
        }
      }

      // Crosshair
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(W / 2 - 8, H / 2 - 1, 16, 2);
      ctx.fillRect(W / 2 - 1, H / 2 - 8, 2, 16);

      // Update HUD occasionally
      hudCounter++;
      if (hudCounter % 10 === 0) {
        setHudData({ x: camX, z: camZ, rot: (camRot * 180 / Math.PI) % 360 });
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [mode]);

  const enter3D = () => {
    camXRef.current = GRID_SIZE / 2 + 0.5;
    camZRef.current = GRID_SIZE / 2 + 0.5;
    camRotRef.current = 0;
    setMode('3d');
    setShowInstructions(false);
  };

  const t = THEMES[theme];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 mb-1">Backrooms Builder</h2>
          <p className="text-zinc-500 text-sm">Build and explore your own liminal spaces in 3D</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('build')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'build' ? 'bg-amber-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <Grid3x3 className="w-4 h-4" /> Build
          </button>
          <button
            onClick={enter3D}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === '3d' ? 'bg-amber-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <Eye className="w-4 h-4" /> Enter 3D
          </button>
        </div>
      </div>

      {msg && (
        <div className={`px-4 py-2.5 rounded-lg text-sm ${msg.type === 'success' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      {showInstructions && mode === 'build' && (
        <div className="bg-zinc-900/60 rounded-xl border border-amber-900/30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-amber-950/20">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-amber-400">How to Build Your Backrooms</h3>
            </div>
            <button onClick={() => setShowInstructions(false)} className="text-zinc-500 hover:text-zinc-300 text-xs">Dismiss</button>
          </div>
          <div className="p-4">
            <div className="flex gap-2 mb-3">
              {INSTRUCTIONS.map((_, i) => (
                <button key={i} onClick={() => setActiveInstruction(i)}
                  className={`flex-1 h-1.5 rounded-full transition-colors ${i === activeInstruction ? 'bg-amber-500' : 'bg-zinc-700'}`} />
              ))}
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white font-bold text-sm">
                {activeInstruction + 1}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-zinc-200 mb-1">{INSTRUCTIONS[activeInstruction].title}</h4>
                <p className="text-sm text-zinc-400">{INSTRUCTIONS[activeInstruction].text}</p>
              </div>
              {activeInstruction < INSTRUCTIONS.length - 1 && (
                <button onClick={() => setActiveInstruction((i) => i + 1)} className="flex-shrink-0 p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400">
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {mode === 'build' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
          <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4 overflow-x-auto">
            <div className="inline-grid gap-0 mx-auto" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 32px)` }}>
              {grid.map((row, r) =>
                row.map((tile, c) => (
                  <div
                    key={`${r}-${c}`}
                    onMouseDown={() => paintTile(r, c)}
                    onMouseEnter={(e) => { if (e.buttons === 1) paintTile(r, c); }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setGrid((prev) => { const next = prev.map((r2) => [...r2]); next[r][c] = 0; return next; });
                    }}
                    className="w-8 h-8 border border-zinc-800/50 cursor-pointer transition-colors hover:opacity-80"
                    style={{
                      backgroundColor: tile === 0 ? '#1a1a1a' : TILE_INFO[tile].color,
                      backgroundImage: tile === 2 ? 'repeating-linear-gradient(0deg, transparent, transparent 7px, rgba(0,0,0,0.1) 7px, rgba(0,0,0,0.1) 8px)' : undefined,
                    }}
                    title={TILE_INFO[tile].name}
                  />
                )),
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full lg:w-56">
            <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-3">
              <h3 className="text-xs font-semibold text-zinc-400 mb-2">Theme</h3>
              <div className="flex flex-col gap-2">
                {(['backrooms', 'poolrooms'] as Theme[]).map((th) => (
                  <button key={th} onClick={() => setTheme(th)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${theme === th ? 'ring-2 ring-amber-400' : ''}`}
                    style={{ background: THEMES[th].wall[0], color: '#1a1a1a' }}>
                    {THEMES[th].name}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-3">
              <h3 className="text-xs font-semibold text-zinc-400 mb-2">Tiles</h3>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(TILE_INFO) as unknown as TileType[]).map((tt) => (
                  <button key={tt} onClick={() => setSelectedTile(tt)}
                    className={`flex items-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                      selectedTile === tt ? 'bg-zinc-700 ring-2 ring-amber-400 text-zinc-100' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: TILE_INFO[tt].color === 'transparent' ? '#333' : TILE_INFO[tt].color }} />
                    {TILE_INFO[tt].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-3">
              <h3 className="text-xs font-semibold text-zinc-400 mb-2">Save Build</h3>
              <input type="text" value={buildName} onChange={(e) => setBuildName(e.target.value)} placeholder="Build name..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-600 mb-2" />
              <div className="flex gap-2">
                <button onClick={saveBuild} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-colors">
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
                <button onClick={clearGrid} className="px-2 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-400 rounded-lg text-xs transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="relative w-full rounded-xl border border-zinc-800 overflow-hidden bg-black" style={{ height: '480px' }}>
            <canvas ref={canvasRef} width={800} height={480} className="w-full h-full block" />

            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur rounded-lg px-3 py-2 text-xs text-zinc-300 pointer-events-none">
              <div className="flex items-center gap-2 mb-1">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-medium text-amber-400">{t.name}</span>
              </div>
              <div>Pos: ({hudData.x.toFixed(1)}, {hudData.z.toFixed(1)})</div>
              <div>Rot: {hudData.rot.toFixed(0)}°</div>
            </div>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur rounded-lg px-4 py-2 text-xs text-zinc-400 pointer-events-none">
              <span className="text-zinc-300 font-medium">W/S</span> forward/back &middot; <span className="text-zinc-300 font-medium">A/D</span> turn
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center">
            <button onClick={() => setMode('build')} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors">
              <Grid3x3 className="w-4 h-4" /> Back to Editor
            </button>
            <button onClick={enter3D} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors">
              <RotateCw className="w-4 h-4" /> Reset Position
            </button>
          </div>
        </div>
      )}

      {savedBuilds.length > 0 && (
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
            <Box className="w-4 h-4 text-zinc-500" /> Saved Builds ({savedBuilds.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedBuilds.map((build) => (
              <div key={build.id} className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-200 truncate">{build.name}</div>
                  <div className="text-xs text-zinc-500">
                    {THEMES[build.theme as Theme]?.name ?? build.theme} &middot; {(build.layout as number[][]).length}x{(build.layout as number[][])[0]?.length}
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <button onClick={() => loadBuild(build)} className="px-2 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium">Load</button>
                  <button onClick={() => deleteBuild(build.id)} className="px-2 py-1.5 bg-red-900/40 hover:bg-red-900/60 text-red-400 rounded text-xs">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
