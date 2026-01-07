import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, RotateCcw, Trophy, Skull, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Point, GameStatus } from './types';
import { 
  GRID_SIZE, 
  INITIAL_SPEED, 
  INITIAL_SNAKE, 
  INITIAL_DIRECTION, 
  KEYS,
  SPEED_DECREMENT,
  FOOD_THRESHOLD,
  MIN_SPEED 
} from './constants';

const App: React.FC = () => {
  // Game State
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [speed, setSpeed] = useState<number>(INITIAL_SPEED);
  
  // Refs for mutable values accessed inside interval/events to avoid stale closures
  const directionRef = useRef<Point>(INITIAL_DIRECTION);
  const lastProcessedDirectionRef = useRef<Point>(INITIAL_DIRECTION);

  // --- Game Logic Helpers ---

  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    let isOnSnake = true;
    while (isOnSnake) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // eslint-disable-next-line no-loop-func
      isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) return newFood;
    }
    return { x: 0, y: 0 }; // Fallback
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    lastProcessedDirectionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setFood(generateFood(INITIAL_SNAKE));
    setStatus(GameStatus.PLAYING);
  };

  const gameOver = () => {
    setStatus(GameStatus.GAME_OVER);
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('cyber_snake_highscore', score.toString());
    }
  };

  // --- Game Loop ---

  // We split the movement and food check to handle the state dependency cleaner
  useEffect(() => {
    if (status !== GameStatus.PLAYING) return;

    const tick = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const currentDir = directionRef.current;
        lastProcessedDirectionRef.current = currentDir;

        const newHead = {
          x: head.x + currentDir.x,
          y: head.y + currentDir.y,
        };

        // Wall Collision
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          gameOver();
          return prevSnake;
        }

        // Self Collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          gameOver();
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Food Collision
        if (newHead.x === food.x && newHead.y === food.y) {
          // Calculate new score and check for speed increase
          const newScore = score + 10;
          setScore(newScore);
          
          // Speed up every FOOD_THRESHOLD (e.g., 5 foods = 50 points)
          const foodsEaten = newScore / 10;
          if (foodsEaten > 0 && foodsEaten % FOOD_THRESHOLD === 0) {
            setSpeed(prev => Math.max(MIN_SPEED, prev - SPEED_DECREMENT));
          }

          setFood(generateFood(newSnake));
          // Visual feedback can be triggered here if needed
          return newSnake;
        } else {
          // Didn't eat: Remove tail
          newSnake.pop();
          return newSnake;
        }
      });
    };

    const intervalId = setInterval(tick, speed);
    return () => clearInterval(intervalId);
  }, [status, food, speed, generateFood, score]); // Added score to deps so we have fresh score in closure

  // --- Input Handling ---

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== GameStatus.PLAYING) return;

      const key = e.key;
      const lastDir = lastProcessedDirectionRef.current;

      // Prevent 180 degree turns
      if (KEYS.UP.includes(key) && lastDir.y !== 1) {
        directionRef.current = { x: 0, y: -1 };
      } else if (KEYS.DOWN.includes(key) && lastDir.y !== -1) {
        directionRef.current = { x: 0, y: 1 };
      } else if (KEYS.LEFT.includes(key) && lastDir.x !== 1) {
        directionRef.current = { x: -1, y: 0 };
      } else if (KEYS.RIGHT.includes(key) && lastDir.x !== -1) {
        directionRef.current = { x: 1, y: 0 };
      }
      
      setDirection(directionRef.current);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status]);

  // Load High Score
  useEffect(() => {
    const stored = localStorage.getItem('cyber_snake_highscore');
    if (stored) setHighScore(parseInt(stored));
  }, []);

  // --- Control Handlers ---
  const handleDirection = (dx: number, dy: number) => {
    // Only allow direction change if it's not a 180 turn
    const lastDir = lastProcessedDirectionRef.current;
    if (dx === 1 && lastDir.x === -1) return;
    if (dx === -1 && lastDir.x === 1) return;
    if (dy === 1 && lastDir.y === -1) return;
    if (dy === -1 && lastDir.y === 1) return;
    
    directionRef.current = { x: dx, y: dy };
    setDirection({ x: dx, y: dy });
  };

  // --- Rendering ---

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none touch-none">
      
      {/* Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header UI */}
      <div className="z-10 w-full max-w-2xl flex justify-between items-end mb-4 font-mono text-[#39ff14] relative">
        <div>
          <h1 className="font-cyber text-4xl md:text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#39ff14] to-emerald-600 drop-shadow-[0_0_10px_rgba(57,255,20,0.5)]">
            NEO<span className="text-white">SNAKE</span>
          </h1>
          <div className="flex items-center gap-2 mt-2 opacity-80 text-sm">
            <span className="w-2 h-2 bg-[#39ff14] rounded-full animate-pulse" />
            SYSTEM_ONLINE
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
           <div className="text-xs text-slate-400 uppercase tracking-widest">Score Data</div>
           <div className="flex items-center gap-6">
             <div className="flex flex-col items-end">
               <span className="text-[10px] text-slate-500">SESSION</span>
               <span className="text-3xl font-bold font-cyber tabular-nums leading-none drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]">
                 {score.toString().padStart(4, '0')}
               </span>
             </div>
             <div className="flex flex-col items-end opacity-50">
                <span className="text-[10px] text-slate-500">RECORD</span>
                <span className="text-xl font-bold font-cyber tabular-nums leading-none">
                  {highScore.toString().padStart(4, '0')}
                </span>
             </div>
           </div>
        </div>
      </div>

      {/* Game Board Container */}
      <div className="relative z-10 group">
        
        {/* The Game Grid */}
        <div 
          className="relative bg-slate-900/80 border-2 border-slate-800 backdrop-blur-sm shadow-[0_0_50px_-10px_rgba(57,255,20,0.1)] rounded-sm overflow-hidden"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
            width: 'min(90vw, 500px)',
            height: 'min(90vw, 500px)',
          }}
        >
          {/* Grid Lines (Subtle) */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-10" 
             style={{ 
               backgroundImage: `linear-gradient(#39ff14 1px, transparent 1px), linear-gradient(90deg, #39ff14 1px, transparent 1px)`,
               backgroundSize: `${100/GRID_SIZE}% ${100/GRID_SIZE}%`
             }}
          />

          {/* Render Snake and Food */}
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);
            
            const isFood = food.x === x && food.y === y;
            const snakeIndex = snake.findIndex(s => s.x === x && s.y === y);
            const isHead = snakeIndex === 0;
            const isBody = snakeIndex > 0;

            // Optimizing render: only render content if cell is active
            if (!isFood && !isHead && !isBody) return <div key={i} />;

            return (
              <div 
                key={i} 
                className={`relative w-full h-full flex items-center justify-center z-10`}
              >
                {/* Food */}
                {isFood && (
                  <div className="w-[60%] h-[60%] bg-[#ff00ff] shadow-[0_0_15px_#ff00ff] rounded-sm animate-pulse rotate-45" />
                )}

                {/* Snake Head */}
                {isHead && (
                  <div className="w-[90%] h-[90%] bg-[#39ff14] shadow-[0_0_20px_#39ff14] rounded-sm z-20 relative">
                     {/* Eyes to show direction */}
                     <div className={`absolute w-full h-full flex justify-between px-[10%] py-[10%] 
                       ${direction.y === -1 ? '' : 
                         direction.y === 1 ? 'items-end' : 
                         direction.x === -1 ? 'flex-col items-start' : 'flex-col items-end'}`}>
                        <div className="w-[20%] h-[20%] bg-black/80 rounded-full" />
                        <div className="w-[20%] h-[20%] bg-black/80 rounded-full" />
                     </div>
                  </div>
                )}

                {/* Snake Body with Trail Effect */}
                {isBody && (
                  <div 
                    className="w-[85%] h-[85%] bg-green-600 rounded-sm"
                    style={{
                      // Trail Effect: Opacity fades towards the tail
                      opacity: Math.max(0.3, 1 - (snakeIndex / (snake.length + 5))),
                      // Trail Effect: Glow reduces towards the tail
                      boxShadow: snakeIndex < 5 ? `0 0 ${10 - snakeIndex}px rgba(57,255,20,0.4)` : 'none',
                      borderColor: `rgba(57,255,20, ${Math.max(0.1, 0.5 - snakeIndex/10)})`,
                      borderWidth: '1px'
                    }}
                  />
                )}
              </div>
            );
          })}
          
          {/* Game Over Overlay */}
          {status === GameStatus.GAME_OVER && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
               <div className="border border-red-500/50 p-6 md:p-8 bg-slate-900/90 relative overflow-hidden text-center max-w-[85%]">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse" />
                 
                 <Skull className="w-12 h-12 md:w-16 md:h-16 text-red-500 mx-auto mb-4 animate-bounce" />
                 <h2 className="text-3xl md:text-5xl font-cyber font-bold text-white mb-2 tracking-widest drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">
                   CRITICAL<br/>FAILURE
                 </h2>
                 <p className="text-slate-400 font-mono mb-6">SYSTEM TERMINATED</p>
                 
                 <div className="flex flex-col gap-2 mb-6">
                    <span className="text-xs text-slate-500 uppercase">Final Score</span>
                    <span className="text-3xl font-bold text-[#39ff14] font-cyber">{score}</span>
                 </div>

                 <button 
                   onClick={resetGame}
                   className="group relative px-6 py-3 md:px-8 bg-red-600 hover:bg-red-500 text-white font-bold font-cyber tracking-widest transition-all clip-path-slant"
                   style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }}
                 >
                   <span className="relative z-10 flex items-center gap-2">
                     <RotateCcw size={18} /> REBOOT
                   </span>
                   <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                 </button>
               </div>
            </div>
          )}

          {/* Start Screen Overlay */}
          {status === GameStatus.IDLE && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm">
               <div className="text-center px-4">
                 <Trophy className="w-12 h-12 text-[#39ff14] mx-auto mb-4" />
                 <h2 className="text-2xl md:text-3xl font-cyber text-white mb-8 tracking-wider">READY PLAYER ONE</h2>
                 <button 
                   onClick={resetGame}
                   className="group relative px-8 py-4 bg-[#39ff14] hover:bg-[#32d611] text-black font-black font-cyber text-lg tracking-widest transition-all hover:scale-105 active:scale-95"
                   style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }}
                 >
                   <span className="flex items-center gap-2">
                     <Play fill="black" size={20} /> INITIALIZE
                   </span>
                 </button>
                 <div className="mt-8 text-xs text-slate-500 font-mono flex flex-col gap-1">
                    <p>USE ARROWS, WASD, OR CONTROLS</p>
                    <p>DO NOT COLLIDE WITH WALLS</p>
                 </div>
               </div>
            </div>
          )}

        </div>

        {/* Decorative corner accents for the board */}
        <div className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-[#39ff14] rounded-tl-lg" />
        <div className="absolute -top-1 -right-1 w-8 h-8 border-t-2 border-r-2 border-[#39ff14] rounded-tr-lg" />
        <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-2 border-l-2 border-[#39ff14] rounded-bl-lg" />
        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-[#39ff14] rounded-br-lg" />

      </div>

      {/* Enhanced Mobile Controls - Always Visible on Touch/Mobile, or just below lg */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div />
        <button 
           className="w-16 h-16 bg-slate-900/80 border border-[#39ff14]/30 rounded-lg active:bg-[#39ff14] active:text-black active:shadow-[0_0_20px_#39ff14] text-[#39ff14] flex items-center justify-center transition-all backdrop-blur-sm"
           onPointerDown={(e) => { e.preventDefault(); handleDirection(0, -1); }}
           aria-label="Up"
        ><ChevronUp size={32} /></button>
        <div />
        
        <button 
           className="w-16 h-16 bg-slate-900/80 border border-[#39ff14]/30 rounded-lg active:bg-[#39ff14] active:text-black active:shadow-[0_0_20px_#39ff14] text-[#39ff14] flex items-center justify-center transition-all backdrop-blur-sm"
           onPointerDown={(e) => { e.preventDefault(); handleDirection(-1, 0); }}
           aria-label="Left"
        ><ChevronLeft size={32} /></button>
        <button 
           className="w-16 h-16 bg-slate-900/80 border border-[#39ff14]/30 rounded-lg active:bg-[#39ff14] active:text-black active:shadow-[0_0_20px_#39ff14] text-[#39ff14] flex items-center justify-center transition-all backdrop-blur-sm"
           onPointerDown={(e) => { e.preventDefault(); handleDirection(0, 1); }}
           aria-label="Down"
        ><ChevronDown size={32} /></button>
        <button 
           className="w-16 h-16 bg-slate-900/80 border border-[#39ff14]/30 rounded-lg active:bg-[#39ff14] active:text-black active:shadow-[0_0_20px_#39ff14] text-[#39ff14] flex items-center justify-center transition-all backdrop-blur-sm"
           onPointerDown={(e) => { e.preventDefault(); handleDirection(1, 0); }}
           aria-label="Right"
        ><ChevronRight size={32} /></button>
      </div>

    </div>
  );
};

export default App;