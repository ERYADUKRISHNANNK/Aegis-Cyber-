import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Line } from "@react-three/drei";
import * as THREE from "three";
import { Globe, Shield, AlertTriangle, RefreshCw, Zap, Activity } from "lucide-react";

interface ThreatEvent {
  _id: string;
  eventType: string;
  severity: string;
  sourceGeo: { city: string; country: string; countryCode: string; lat: number; lon: number };
  targetGeo: { city: string; country: string; countryCode: string; lat: number; lon: number };
  threatScore: number;
  description: string;
  createdAt: string;
}

// Convert lat/lon to 3D sphere position
const latLonToVec3 = (lat: number, lon: number, radius: number = 2): [number, number, number] => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return [x, y, z];
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#f59e0b",
  LOW: "#10b981"
};

// Animated attack line between source and target
const AttackLine: React.FC<{ source: [number, number, number]; target: [number, number, number]; color: string; progress: number }> = ({ source, target, color, progress }) => {
  const ref = useRef<any>(null);

  const curve = useMemo(() => {
    const mid: [number, number, number] = [
      (source[0] + target[0]) / 2,
      (source[1] + target[1]) / 2 + 0.5,
      (source[2] + target[2]) / 2
    ];
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...source),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...target)
    );
  }, [source, target]);

  const points = useMemo(() => {
    return curve.getPoints(30).map(p => [p.x, p.y, p.z] as [number, number, number]);
  }, [curve]);

  useFrame(({ clock }) => {
    if (ref.current) {
      const t = (clock.elapsedTime * 0.5) % 1;
      ref.current.material.dashOffset = -t * 2;
    }
  });

  return (
    <Line
      ref={ref}
      points={points}
      color={color}
      lineWidth={2}
      dashed
      dashScale={2}
      dashSize={0.5}
      dashOffset={0}
    />
  );
};

// Threat point on the globe
const ThreatPoint: React.FC<{ position: [number, number, number]; color: string; size?: number }> = ({ position, color, size = 0.03 }) => {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (ref.current) {
      const scale = 1 + Math.sin(clock.elapsedTime * 3 + position[0]) * 0.3;
      ref.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
    </mesh>
  );
};

// Globe wireframe
const GlobeWireframe: React.FC = () => {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.05;
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[2, 32, 32]} />
      <meshStandardMaterial
        color="#06b6d4"
        emissive="#06b6d4"
        emissiveIntensity={0.15}
        wireframe
        transparent
        opacity={0.3}
      />
    </mesh>
  );
};

// Globe solid core
const GlobeCore: React.FC = () => {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.05; });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1.95, 32, 32]} />
      <meshStandardMaterial color="#04030b" transparent opacity={0.6} />
    </mesh>
  );
};

// GlobeScene with threats
const ThreatGlobe: React.FC<{ threats: ThreatEvent[] }> = ({ threats }) => {
  return (
    <Canvas camera={{ position: [0, 2, 6], fov: 45 }}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <GlobeCore />
      <GlobeWireframe />
      <Stars radius={20} depth={10} count={1000} factor={3} saturation={0} fade speed={0.5} />

      {/* Attack lines and points */}
      {threats.map((threat, idx) => {
        const srcPos = latLonToVec3(threat.sourceGeo.lat, threat.sourceGeo.lon);
        const tgtPos = latLonToVec3(threat.targetGeo.lat, threat.targetGeo.lon);
        const color = SEVERITY_COLORS[threat.severity] || "#ffffff";

        return (
          <React.Fragment key={threat._id || idx}>
            <AttackLine source={srcPos} target={tgtPos} color={color} progress={0} />
            <ThreatPoint position={srcPos} color={color} size={0.04} />
            <ThreatPoint position={tgtPos} color={color} size={0.025} />
          </React.Fragment>
        );
      })}

      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
    </Canvas>
  );
};

export const ThreatTopology: React.FC = () => {
  const [threats, setThreats] = useState<ThreatEvent[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [autoSimulate, setAutoSimulate] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!autoSimulate) return;
    const interval = setInterval(async () => {
      try {
        await axios.post("/api/threats/simulate-live");
        loadData();
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [autoSimulate]);

  const loadData = async () => {
    try {
      const [threatsRes, statsRes] = await Promise.all([
        axios.get("/api/threats/active?limit=50"),
        axios.get("/api/threats/stats")
      ]);
      setThreats(threatsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to load threat data:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateMore = async () => {
    try {
      await axios.post("/api/threats/generate", { count: 15 });
      loadData();
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 text-cyber-cyan animate-spin mx-auto" />
          <p className="text-sm text-slate-400 font-mono">Initializing threat topology...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-cyber text-white">Global Threat Topology</h2>
          <p className="text-sm text-slate-400">Real-time 3D visualization of active cyber threats worldwide.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setAutoSimulate(!autoSimulate)} className={`px-4 py-2 rounded-3xl border text-xs font-cyber transition ${autoSimulate ? "bg-red-950/50 border-red-800 text-red-300" : "border-slate-800 text-slate-400 hover:border-cyber-cyan hover:text-cyber-cyan"}`}>
            <Zap className="h-3 w-3 inline mr-1" />
            {autoSimulate ? "Stop Simulation" : "Auto Simulate"}
          </button>
          <button onClick={generateMore} className="px-4 py-2 rounded-3xl border border-slate-800 text-slate-400 hover:border-cyber-cyan hover:text-cyber-cyan text-xs font-cyber">
            Generate Threats
          </button>
          <button onClick={loadData} className="px-4 py-2 rounded-3xl border border-slate-800 text-slate-400 hover:border-cyber-cyan hover:text-cyber-cyan">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-6">
        {/* 3D Globe */}
        <div className="glass-panel rounded-3xl border border-slate-900/80 overflow-hidden" style={{ height: "600px" }}>
          <ThreatGlobe threats={threats} />
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Severity Legend */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-900/80">
            <h3 className="text-xs font-bold font-cyber text-white uppercase tracking-[0.2em] mb-3">Severity Legend</h3>
            <div className="space-y-2">
              {Object.entries(SEVERITY_COLORS).map(([sev, color]) => (
                <div key={sev} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-slate-300">{sev}</span>
                  <span className="text-slate-500 ml-auto">{threats.filter(t => t.severity === sev).length}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="glass-panel rounded-2xl p-4 border border-slate-900/80">
              <h3 className="text-xs font-bold font-cyber text-white uppercase tracking-[0.2em] mb-3">Threat Statistics</h3>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Threats</span>
                  <span className="text-white font-bold">{stats.totalActive}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Events</span>
                  <span className="text-white">{stats.totalAll}</span>
                </div>
                {stats.byType?.map((t: any) => (
                  <div key={t._id} className="flex justify-between">
                    <span className="text-slate-400">{t._id}</span>
                    <span className="text-cyber-cyan">{t.count} <span className="text-slate-500">avg:{Math.round(t.avgScore)}</span></span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Threat Feed */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-900/80">
            <h3 className="text-xs font-bold font-cyber text-white uppercase tracking-[0.2em] mb-3">Live Threat Feed</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {threats.slice(0, 15).map((threat) => (
                <div key={threat._id} className="p-2 rounded-lg border border-slate-900/40 bg-[#04030a]/40">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-cyber" style={{ color: SEVERITY_COLORS[threat.severity] }}>
                      {threat.eventType}
                    </span>
                    <span className="text-[9px] text-slate-500">{new Date(threat.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">
                    {threat.sourceGeo.country} → {threat.targetGeo.country}
                  </p>
                  <p className="text-[9px] text-slate-500">{threat.description?.substring(0, 60)}...</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreatTopology;
