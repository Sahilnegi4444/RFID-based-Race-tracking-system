import { Wifi, WifiOff, MapPin, Settings as SettingsIcon } from 'lucide-react';
import useSettingsStore from '../store/settingsStore';
import { motion } from 'framer-motion';

export default function Settings() {
  const { checkpoints, setCheckpoints, raceTitle, setRaceTitle, theme, toggleTheme, readers } = useSettingsStore();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <SettingsIcon size={20} />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">System Configuration</h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Race Title
            </label>
            <input 
              type="text" 
              value={raceTitle}
              onChange={(e) => setRaceTitle(e.target.value)}
              className="w-full sm:w-96 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Number of Checkpoints
            </label>
            <div className="flex gap-4">
              {[2, 3, 4].map(num => (
                <button
                  key={num}
                  onClick={() => setCheckpoints(num)}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    checkpoints === num 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Determines columns shown: {checkpoints === 2 ? 'Start, Mid1' : checkpoints === 3 ? 'Start, Mid1, Mid2' : 'Start, Mid1, Mid2, Finish'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Theme Preference
            </label>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Toggle {theme === 'light' ? 'Dark' : 'Light'} Mode
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <MapPin size={20} />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">RFID Reader Status</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {readers.slice(0, checkpoints).map((reader, idx) => (
            <motion.div 
              key={reader.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${reader.status === 'online' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {reader.status === 'online' ? <Wifi size={18} /> : <WifiOff size={18} />}
                </div>
                <div>
                  <h3 className="font-medium text-slate-800 dark:text-white">{reader.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Signal: {reader.signal}</p>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${reader.status === 'online' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                {reader.status.toUpperCase()}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
