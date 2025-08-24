import React, { useEffect, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { motion } from "framer-motion";
import { Car } from "lucide-react";

export default function App() {
  const audioCtxRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [frequency, setFrequency] = useState(40);
  const [throttle, setThrottle] = useState(0);
  const [data, setData] = useState([]);
  const [tick, setTick] = useState(0);
  const [engineType, setEngineType] = useState("porsche");

  // Engine presets (frequency multipliers, gain, wave type)
  const enginePresets = {
    porsche: { baseFreq: 40, maxFreq: 2000, wave: "sawtooth", gain: 0.05 },
    ferrari: { baseFreq: 80, maxFreq: 4000, wave: "square", gain: 0.05 },
    mustang: { baseFreq: 50, maxFreq: 2500, wave: "triangle", gain: 0.07 },
  };

  useEffect(() => {
    if (isRunning && oscillatorRef.current && gainRef.current) {
      const preset = enginePresets[engineType];
      const newFreq =
        preset.baseFreq + (preset.maxFreq - preset.baseFreq) * throttle;
      oscillatorRef.current.frequency.setTargetAtTime(
        newFreq,
        audioCtxRef.current.currentTime,
        0.05
      );
      setFrequency(Math.round(newFreq));

      const speed = Math.round(newFreq / 100);
      setData((prev) =>
        [...prev.slice(-19), { index: tick, rpm: Math.round(newFreq), speed }]
      );
      setTick((t) => t + 1);
    }
  }, [throttle, isRunning, engineType]);

  const startAudio = () => {
    if (!isRunning) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      oscillatorRef.current = audioCtxRef.current.createOscillator();
      gainRef.current = audioCtxRef.current.createGain();

      const preset = enginePresets[engineType];
      oscillatorRef.current.type = preset.wave;
      oscillatorRef.current.frequency.setValueAtTime(
        preset.baseFreq,
        audioCtxRef.current.currentTime
      );

      oscillatorRef.current.connect(gainRef.current);
      gainRef.current.connect(audioCtxRef.current.destination);

      gainRef.current.gain.setValueAtTime(
        preset.gain,
        audioCtxRef.current.currentTime
      );

      oscillatorRef.current.start();
      setIsRunning(true);
    }
  };

  const handleScroll = (e) => {
    e.preventDefault();
    setThrottle((prev) => {
      let newThrottle = prev + (e.deltaY < 0 ? 0.02 : -0.02);
      return Math.min(1, Math.max(0, newThrottle));
    });
  };

  useEffect(() => {
    window.addEventListener("wheel", handleScroll, { passive: false });
    return () => window.removeEventListener("wheel", handleScroll);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 space-y-6">
      <h1 className="text-2xl font-bold">Electric Car Engine Sound Emulator</h1>

      {/* Engine Selector */}
      <div className="flex space-x-4">
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="engine"
            value="porsche"
            checked={engineType === "porsche"}
            onChange={(e) => setEngineType(e.target.value)}
          />
          <span>Porsche</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="engine"
            value="ferrari"
            checked={engineType === "ferrari"}
            onChange={(e) => setEngineType(e.target.value)}
          />
          <span>Ferrari</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="engine"
            value="mustang"
            checked={engineType === "mustang"}
            onChange={(e) => setEngineType(e.target.value)}
          />
          <span>Mustang</span>
        </label>
      </div>

      <button
        onClick={startAudio}
        className="px-6 py-3 bg-green-600 rounded-2xl shadow-lg hover:bg-green-500"
      >
        Start
      </button>

      <div className="flex items-center space-x-8">
        <div className="flex flex-col items-center">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={throttle}
            onChange={(e) => setThrottle(parseFloat(e.target.value))}
            className="h-48 w-4 appearance-none bg-gray-700 rounded-lg"
            orient="vertical"
          />
          <p className="mt-2">Throttle: {(throttle * 100).toFixed(0)}%</p>
        </div>
        <div className="text-center">
          <p className="text-lg">Engine RPM: {frequency} RPM</p>
          <p className="text-lg">Speed: {Math.round(frequency / 100)} km/h</p>
        </div>
      </div>

      {/* Animated Car */}
      <div className="w-full relative h-20 overflow-hidden bg-gray-800 rounded-xl flex items-center justify-center">
        <motion.div
          animate={{ x: throttle * 500 }}
          transition={{ type: "spring", stiffness: 50 }}
          className="absolute left-0"
        >
          <Car size={48} className="text-yellow-400" />
        </motion.div>
      </div>

      {/* Combined Graphs */}
      <div className="bg-white rounded-xl p-4 text-black">
        <LineChart width={600} height={350} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="index" label={{ value: "Time", position: "insideBottom", offset: -5 }} />
          <YAxis yAxisId="left" label={{ value: "Speed (km/h)", angle: -90, position: "insideLeft" }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: "RPM", angle: -90, position: "insideRight" }} />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="speed" stroke="#2563eb" strokeWidth={2} name="Speed (km/h)" />
          <Line yAxisId="right" type="monotone" dataKey="rpm" stroke="#ef4444" strokeWidth={2} name="RPM" />
        </LineChart>
      </div>
    </div>
  );
}
