import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Timer, Trophy, Activity } from 'lucide-react';
import useRunnerStore from '../store/runnerStore';
import useSettingsStore from '../store/settingsStore';

export default function Dashboard() {
  const { runners, simulateLiveUpdates } = useRunnerStore();
  const checkpoints = useSettingsStore(state => state.checkpoints);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      simulateLiveUpdates();
    }, 2000);
    return () => clearInterval(interval);
  }, [simulateLiveUpdates]);

  const activeRunners = runners.filter(r => r.status === 'Running').length;
  const finishedRunners = runners.filter(r => r.status === 'Finished').length;

  const getColumns = () => {
    let cols = ['Start', 'Mid1'];
    if (checkpoints >= 3) cols.push('Mid2');
    if (checkpoints === 4) cols.push('Finish');
    return cols;
  };

  const columns = getColumns();

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Runners" value={runners.length} icon={Users} color="bg-blue-500" />
        <StatCard title="Active Now" value={activeRunners} icon={Activity} color="bg-green-500" pulse />
        <StatCard title="Finished" value={finishedRunners} icon={Trophy} color="bg-indigo-500" />
        <StatCard title="Checkpoints" value={checkpoints} icon={Timer} color="bg-orange-500" />
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="relative flex h-3 w-3 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            Live Race Status
          </h2>
          <div className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">
            System Online
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold">RFID Tag</th>
                <th className="px-6 py-4 font-semibold">Runner Name</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                {columns.map(col => (
                  <th key={col} className="px-6 py-4 font-semibold">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runners.map((runner, index) => (
                <motion.tr
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={runner.rfid}
                  className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-4 font-mono font-medium text-slate-700 dark:text-slate-300">{runner.rfid}</td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{runner.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${runner.status === 'Running'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                      }`}>
                      {runner.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">{runner.timestamps.start || '--:--:--'}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">{runner.timestamps.mid1 || '--:--:--'}</td>
                  {checkpoints >= 3 && (
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">{runner.timestamps.mid2 || '--:--:--'}</td>
                  )}
                  {checkpoints === 4 && (
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">{runner.timestamps.finish || '--:--:--'}</td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, pulse }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4"
    >
      <div className={`p-4 rounded-xl text-white ${color} relative`}>
        <Icon size={24} />
        {pulse && (
          <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
    </motion.div>
  );
}
