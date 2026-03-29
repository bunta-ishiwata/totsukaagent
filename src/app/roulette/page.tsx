"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const MEMBERS = [
  "前田翼",
  "野口一馬",
  "関大二郎",
  "栗田優磨",
  "吉田隆介",
  "宮崎将明",
  "島倉有純",
  "大西わたる",
  "山田悠斗",
  "山下泰輝",
  "重久友也",
  "小手川純也",
  "戸田柾",
  "白土涼雅",
  "熊谷真聡",
  "立花京一",
  "根本祐輔",
  "石毛大哉",
  "小嶋里加子",
  "二平燎平",
  "戸谷海輝",
  "永山大地",
  "小平悠磨",
  "津久井さん",
  "竹内ありす",
  "Shotaro Takechi",
  "木村 帆天",
  "徳川裕喜隆",
  "中川心貴",
  "毛利",
  "大竹さん",
  "山田悠斗",
];

const COLORS = [
  "#FF6B6B", "#FF8E53", "#FFA952", "#FFD166",
  "#06D6A0", "#118AB2", "#073B4C", "#6A0572",
  "#F72585", "#7209B7", "#3A0CA3", "#4361EE",
  "#4CC9F0", "#0077B6", "#00B4D8", "#48CAE4",
  "#E63946", "#457B9D", "#1D3557", "#2D6A4F",
  "#40916C", "#52B788", "#74C69D", "#95D5B2",
  "#B7E4C7", "#FF006E", "#8338EC", "#3A86FF",
  "#FB5607", "#FFBE0B", "#80B918", "#2DC653",
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type: "circle" | "star" | "rect";
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export default function RoulettePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const particleFrameRef = useRef<number>(0);

  const angleRef = useRef(0);
  const velocityRef = useRef(0);
  const spinningRef = useRef(false);
  const particlesRef = useRef<Particle[]>([]);
  const sparksRef = useRef<Spark[]>([]);
  const winnerIndexRef = useRef(-1);
  const deceleratingRef = useRef(false);
  const targetAngleRef = useRef(0);
  const spinTimeRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastSliceRef = useRef(-1);

  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [showWinner, setShowWinner] = useState(false);
  const [bgFlash, setBgFlash] = useState(false);
  const [glowIntensity, setGlowIntensity] = useState(0);

  const sliceAngle = (2 * Math.PI) / MEMBERS.length;

  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  }, []);

  const playTick = useCallback((velocity: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const freq = 200 + velocity * 1800;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.03);
  }, []);

  const playWhoosh = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(300, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.3);
    filter.Q.value = 1.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(ctx.currentTime);
    source.stop(ctx.currentTime + 0.4);
  }, []);

  const playFanfare = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const notes = [261.6, 329.6, 392, 523.3, 659.3]; // C4 E4 G4 C5 E5
    notes.forEach((freq, i) => {
      const delay = i * 0.13;
      const isLast = i === notes.length - 1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + delay + 0.02);
      gain.gain.linearRampToValueAtTime(isLast ? 0.25 : 0, ctx.currentTime + delay + (isLast ? 0.5 : 0.1));
      if (isLast) gain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + (isLast ? 0.8 : 0.15));
    });
    // Harmony chord on last note
    [523.3, 659.3, 783.9].forEach((freq) => {
      const delay = (notes.length - 1) * 0.13;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.9);
    });
  }, []);

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = Math.min(cx, cy) - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Outer glow ring
    const glowVal = glowIntensity;
    if (glowVal > 0) {
      const gradient = ctx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius + 20);
      gradient.addColorStop(0, `rgba(255,200,50,0)`);
      gradient.addColorStop(1, `rgba(255,200,50,${glowVal * 0.6})`);
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 20, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Shadow
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 20;

    // Draw slices
    for (let i = 0; i < MEMBERS.length; i++) {
      const startAngle = angleRef.current + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.shadowBlur = 0;

    // Text on slices
    for (let i = 0; i < MEMBERS.length; i++) {
      const midAngle = angleRef.current + i * sliceAngle + sliceAngle / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(midAngle);

      const fontSize = MEMBERS.length > 20 ? 10 : 13;
      ctx.font = `bold ${fontSize}px 'Noto Sans JP', sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 4;

      const textX = radius * 0.6;
      const maxLen = 6;
      const name = MEMBERS[i];
      const displayName = name.length > maxLen ? name.slice(0, maxLen) + "…" : name;
      ctx.fillText(displayName, textX, 0);
      ctx.restore();
    }

    // Center circle
    const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
    centerGrad.addColorStop(0, "#ffffff");
    centerGrad.addColorStop(1, "#dddddd");
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, 2 * Math.PI);
    ctx.fillStyle = centerGrad;
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#aaaaaa";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
    ctx.fillStyle = "#ff4444";
    ctx.fill();

    // Arrow pointer (top center)
    const arrowSize = 22;
    ctx.save();
    ctx.translate(cx, 8);
    ctx.beginPath();
    ctx.moveTo(0, arrowSize);
    ctx.lineTo(-arrowSize / 2, 0);
    ctx.lineTo(arrowSize / 2, 0);
    ctx.closePath();
    ctx.fillStyle = "#FFD700";
    ctx.shadowColor = "rgba(255,180,0,0.8)";
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.strokeStyle = "#ff8800";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }, [glowIntensity, sliceAngle]);

  const spawnParticles = useCallback((cx: number, cy: number, burst = false) => {
    const count = burst ? 80 : 4;
    const types: Array<"circle" | "star" | "rect"> = ["circle", "star", "rect"];
    for (let i = 0; i < count; i++) {
      const angle = burst ? Math.random() * Math.PI * 2 : Math.random() * Math.PI * 2;
      const speed = burst ? 3 + Math.random() * 10 : 1 + Math.random() * 3;
      particlesRef.current.push({
        x: cx + (Math.random() - 0.5) * 60,
        y: cy + (Math.random() - 0.5) * 60,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (burst ? 3 : 1),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: burst ? 4 + Math.random() * 10 : 2 + Math.random() * 4,
        life: 1,
        maxLife: burst ? 120 + Math.random() * 60 : 40 + Math.random() * 20,
        type: types[Math.floor(Math.random() * types.length)],
      });
    }
  }, []);

  const spawnSparks = useCallback((cx: number, cy: number, radius: number) => {
    const count = 3;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = radius - 15;
      sparksRef.current.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5 - 2,
        color: Math.random() > 0.5 ? "#FFD700" : "#FF6B6B",
        size: 1 + Math.random() * 3,
        life: 1,
        maxLife: 20 + Math.random() * 20,
      });
    }
  }, []);

  const drawParticles = useCallback(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update + draw particles
    particlesRef.current = particlesRef.current.filter((p) => p.life > 0);
    for (const p of particlesRef.current) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;

      if (p.type === "circle") {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === "star") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.life * 0.1);
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const r = p.size;
          i === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.life * 0.05);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.vx *= 0.98;
      p.life -= 1;
    }

    // Sparks
    sparksRef.current = sparksRef.current.filter((s) => s.life > 0);
    for (const s of sparksRef.current) {
      const alpha = s.life / s.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.1;
      s.life -= 1;
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    particleFrameRef.current = requestAnimationFrame(drawParticles);
  }, []);

  const spin = useCallback(() => {
    if (spinningRef.current) return;

    setWinner(null);
    setShowWinner(false);
    setBgFlash(false);
    spinningRef.current = true;
    deceleratingRef.current = false;
    setIsSpinning(true);
    spinTimeRef.current = 0;
    initAudio();
    playWhoosh();

    // Pick winner
    const winIdx = Math.floor(Math.random() * MEMBERS.length);
    winnerIndexRef.current = winIdx;

    // Calculate target angle: spin many full rotations + land on winner
    const extraSpins = 5 + Math.floor(Math.random() * 4);
    const winnerMidAngle = -(winIdx * sliceAngle + sliceAngle / 2);
    // We want angleRef + targetAngle = winnerMidAngle (mod 2pi), pointing at top (π*1.5)
    const currentAngle = angleRef.current % (2 * Math.PI);
    const desiredPointerAngle = Math.PI * 1.5; // top
    let landAngle = desiredPointerAngle + winnerMidAngle;
    while (landAngle < currentAngle) landAngle += 2 * Math.PI;
    targetAngleRef.current = landAngle + extraSpins * 2 * Math.PI;

    // Initial fast velocity
    velocityRef.current = 0.25 + Math.random() * 0.1;

    const totalDuration = 280; // frames
    let frame = 0;

    const animate = () => {
      frame++;
      spinTimeRef.current = frame;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = Math.min(cx, cy) - 10;

      const progress = frame / totalDuration;

      // Tick sound on slice boundary crossing
      const currentSlice = Math.floor(((-angleRef.current % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)) / sliceAngle) % MEMBERS.length;
      if (currentSlice !== lastSliceRef.current) {
        lastSliceRef.current = currentSlice;
        playTick(velocityRef.current);
      }

      if (progress < 0.3) {
        // Accelerate
        velocityRef.current = Math.min(0.35, velocityRef.current + 0.008);
        angleRef.current += velocityRef.current;
        // Spawn sparks while spinning fast
        if (frame % 5 === 0) spawnSparks(cx, cy, radius);
        if (frame % 8 === 0) spawnParticles(cx, cy);
        setGlowIntensity(progress / 0.3);
      } else if (progress < 0.75) {
        // Constant fast
        angleRef.current += velocityRef.current;
        if (frame % 4 === 0) spawnSparks(cx, cy, radius);
        if (frame % 6 === 0) spawnParticles(cx, cy);
        setGlowIntensity(1);
      } else {
        // Decelerate toward target
        deceleratingRef.current = true;
        const remaining = totalDuration - frame;
        const totalDec = totalDuration * 0.25;
        const decProgress = 1 - remaining / totalDec;

        const currentTotal = angleRef.current;
        const needed = targetAngleRef.current - currentTotal;
        if (needed > 0 && remaining > 0) {
          const step = needed / (remaining + 1);
          velocityRef.current = step;
          angleRef.current += velocityRef.current;
        } else {
          angleRef.current = targetAngleRef.current;
        }

        setGlowIntensity(1 - decProgress * 0.5);
        if (frame % 10 === 0) spawnSparks(cx, cy, radius);
      }

      drawWheel();

      if (frame < totalDuration) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Done!
        angleRef.current = targetAngleRef.current;
        velocityRef.current = 0;
        spinningRef.current = false;
        setIsSpinning(false);
        setGlowIntensity(0);

        // Burst particles from center
        spawnParticles(cx, cy, true);
        spawnParticles(cx + radius * 0.5, cy - radius * 0.5, true);
        spawnParticles(cx - radius * 0.5, cy - radius * 0.5, true);

        setBgFlash(true);
        setTimeout(() => setBgFlash(false), 600);
        setTimeout(() => {
          setWinner(MEMBERS[winnerIndexRef.current]);
          setShowWinner(true);
          playFanfare();
        }, 300);

        drawWheel();
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, [drawWheel, sliceAngle, spawnParticles, spawnSparks, initAudio, playWhoosh, playTick, playFanfare]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  useEffect(() => {
    particleFrameRef.current = requestAnimationFrame(drawParticles);
    return () => {
      cancelAnimationFrame(particleFrameRef.current);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [drawParticles]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: bgFlash
          ? "radial-gradient(ellipse at center, #fffbe6 0%, #ffd700 40%, #ff8c00 100%)"
          : "radial-gradient(ellipse at center, #1a0533 0%, #0d001a 60%, #000000 100%)",
        transition: "background 0.3s ease",
      }}
    >
      {/* Animated starfield background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${1 + Math.random() * 3}px`,
              height: `${1 + Math.random() * 3}px`,
              backgroundColor: "#ffffff",
              opacity: 0.3 + Math.random() * 0.5,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <h1
        className="text-4xl font-black mb-6 text-center relative z-10"
        style={{
          background: "linear-gradient(135deg, #FFD700 0%, #FF6B6B 50%, #7209B7 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textShadow: "none",
          filter: "drop-shadow(0 0 20px rgba(255,215,0,0.5))",
          letterSpacing: "0.05em",
        }}
      >
        🎯 ルーレット 🎯
      </h1>
      <p className="text-purple-300 text-sm mb-6 relative z-10 font-medium tracking-widest">
        {MEMBERS.length}名 · さあ誰が選ばれる？
      </p>

      {/* Canvas stack */}
      <div className="relative z-10" style={{ width: 480, height: 480 }}>
        <canvas
          ref={canvasRef}
          width={480}
          height={480}
          className="absolute top-0 left-0 rounded-full"
          style={{
            filter: isSpinning
              ? `drop-shadow(0 0 ${20 + glowIntensity * 30}px rgba(255,200,50,${0.4 + glowIntensity * 0.4}))`
              : "drop-shadow(0 0 15px rgba(180,100,255,0.4))",
            transition: "filter 0.1s",
          }}
        />
        <canvas
          ref={particleCanvasRef}
          width={480}
          height={480}
          className="absolute top-0 left-0 pointer-events-none"
        />
      </div>

      {/* Spin button */}
      <button
        onClick={spin}
        disabled={isSpinning}
        className="mt-8 relative z-10 font-black text-2xl px-16 py-5 rounded-full transition-all duration-200 select-none"
        style={{
          background: isSpinning
            ? "linear-gradient(135deg, #555, #333)"
            : "linear-gradient(135deg, #FFD700 0%, #FF6B35 50%, #F72585 100%)",
          color: "#fff",
          boxShadow: isSpinning
            ? "none"
            : "0 0 30px rgba(255,100,50,0.6), 0 4px 20px rgba(0,0,0,0.4)",
          cursor: isSpinning ? "not-allowed" : "pointer",
          transform: isSpinning ? "scale(0.96)" : "scale(1)",
          letterSpacing: "0.1em",
          border: "2px solid rgba(255,255,255,0.2)",
        }}
      >
        {isSpinning ? "⚡ 回転中..." : "🚀 スピン！"}
      </button>

      {/* Winner overlay */}
      {showWinner && winner && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setShowWinner(false)}
          style={{
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            className="relative text-center px-16 py-12 rounded-3xl"
            style={{
              background: "linear-gradient(135deg, #1a0533 0%, #2d0a66 50%, #1a0533 100%)",
              border: "3px solid rgba(255,215,0,0.8)",
              boxShadow: "0 0 60px rgba(255,215,0,0.5), 0 0 120px rgba(247,37,133,0.3)",
              animation: "popIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275)",
            }}
          >
            <div className="text-6xl mb-4">🏆</div>
            <p
              className="text-yellow-300 font-bold text-lg mb-3 tracking-widest uppercase"
              style={{ textShadow: "0 0 10px rgba(255,215,0,0.6)" }}
            >
              Winner!
            </p>
            <p
              className="font-black text-5xl mb-6"
              style={{
                background: "linear-gradient(135deg, #FFD700 0%, #FF6B6B 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 15px rgba(255,215,0,0.4))",
                lineHeight: 1.2,
              }}
            >
              {winner}
            </p>
            <p className="text-purple-300 text-sm">タップして閉じる</p>
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="mt-8 relative z-10 max-w-2xl w-full px-4">
        <p className="text-purple-400 text-xs text-center mb-3 tracking-widest">参加メンバー</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {MEMBERS.map((name, i) => (
            <span
              key={i}
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{
                background: COLORS[i % COLORS.length] + "33",
                border: `1px solid ${COLORS[i % COLORS.length]}88`,
                color: COLORS[i % COLORS.length],
                boxShadow:
                  winner === name && showWinner
                    ? `0 0 12px ${COLORS[i % COLORS.length]}`
                    : "none",
                transform: winner === name && showWinner ? "scale(1.15)" : "scale(1)",
                transition: "all 0.3s ease",
              }}
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        @keyframes popIn {
          from { transform: scale(0.3) rotate(-10deg); opacity: 0; }
          to { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
