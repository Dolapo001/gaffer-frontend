'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, Trash2, Plus, Trophy, LayoutGrid, 
  GitFork, Layers, Settings2, ShieldCheck, Calendar,
  User, Building2, ChevronDown, Check
} from 'lucide-react'
import { GradientButton } from '@/components/GradientButton'
import { useTournamentStore } from '@/store/tournamentStore'
import { useAuthStore } from '@/store/authStore'

const STEPS = ['Details', 'Format', 'Setup']

const FORMAT_OPTIONS = [
  { id: 'round_robin', label: 'Round Robbin', subtitle: 'e.g Premier league', icon: Trophy },
  { id: 'groups', label: 'Groups', subtitle: 'e.g Premier league', icon: LayoutGrid, accent: true },
  { id: 'knockout', label: 'Knockout', subtitle: 'e.g English FA Cup', icon: GitFork, accent: true },
  { id: 'group_knockout', label: 'Group + Knockout', subtitle: 'e.g World Cup', icon: Layers, accent: true },
  { id: 'league_knockout', label: 'League + Knockout', subtitle: 'e.g Champions league', icon: Layers, accent: true },
  { id: 'league_playoff', label: 'League+Playoff', subtitle: '', icon: Layers },
  { id: 'custom', label: 'Custom', subtitle: '', icon: Settings2 }
]

const ROUNDS = ['Round of 64', 'Round of 32', 'Round of 16', 'Quarterfinals', 'Semifinals', 'Finals']
const GROUP_COUNTS = ['2 Groups', '4 Groups', '8 Groups', '16 Groups']
const TEAMS_PER_GROUP = ['4 Teams', '6 Teams', '8 Teams']

interface CreateTournamentProps {
  onClose: () => void
}

export function CreateTournamentModal({ onClose }: CreateTournamentProps) {
  const { addTournament } = useTournamentStore()
  const { user } = useAuthStore()

  const [step, setStep] = useState(0)
  const [showConfirm, setShowConfirm] = useState(false)
  const [activeConfigType, setActiveConfigType] = useState<string | null>(null)
  const [editingFormatId, setEditingFormatId] = useState<string | null>(null)
  
  // Form State
  const [details, setDetails] = useState({
    name: 'Charlie Westervelt',
    host: 'Charlie Westervelt',
    sport: 'Football',
    gender: 'Male',
    startDate: '20/4/26',
    endDate: '20/3/26',
    photo: '/images/hero-bg.jpg'
  })

  const [selectedFormat, setSelectedFormat] = useState('round_robin')
  const [pointSystem, setPointSystem] = useState('Standard')
  const [addedFormats, setAddedFormats] = useState<any[]>([
    { id: '1', type: 'Groups', name: 'Groups A', info: '4 Teams', teamCount: '4 Teams' },
    { id: '2', type: 'Groups', name: 'Groups B', info: '4 Teams', teamCount: '4 Teams' },
    { id: '3', type: 'Knockout', name: 'Knockout', info: 'Starts at Round of 16', startingRound: 'Round of 16' }
  ])

  const nextStep = () => {
    if (step === 1 && addedFormats.length === 0) {
      addSelectedFormat()
    }
    setStep(s => Math.min(s + 1, 2))
  }
  const prevStep = () => setStep(s => Math.max(s - 1, 0))

  const addSelectedFormat = () => {
    const format = FORMAT_OPTIONS.find(f => f.id === selectedFormat)
    if (format) {
      const newId = crypto.randomUUID()
      const newFormat = {
        id: newId,
        type: format.label.includes('Groups') || format.id === 'groups' ? 'Groups' : 
              format.id === 'knockout' ? 'Knockout' : 'League',
        name: format.label === 'Knockout' ? 'Knockout' : `${format.label} ${addedFormats.length + 1}`,
        formatId: format.id,
        info: format.id === 'knockout' ? 'Starts at Round of 16' : '4 Teams',
        startingRound: 'Round of 16',
        teamCount: '4 Teams'
      }
      setAddedFormats([...addedFormats, newFormat])
    }
  }

  const removeFormat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setAddedFormats(addedFormats.filter(f => f.id !== id))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setDetails({ ...details, photo: url })
    }
  }

  const handleFinalConfirm = () => {
    addTournament({
      name: details.name || 'Untitled Tournament',
      sport: details.sport,
      startDate: details.startDate,
      endDate: details.endDate,
      status: 'upcoming',
      location: 'Main Stadium',
      format: addedFormats.map(f => f.type).join(' + '),
      createdBy: user?.id || 'org_id',
      maxTeams: 16
    })
    setShowConfirm(false)
    onClose()
  }

  const renderConfigScreen = () => {
    const format = addedFormats.find(f => f.id === editingFormatId)
    if (!format) return null

    if (format.type === 'Knockout') {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-start">
          <h3 className="text-[12px] text-white font-chakra font-black uppercase tracking-[0.2em] ml-1">Knockout</h3>
          <div className="bg-[#1C1F2D] border border-white/5 rounded-[28px] p-6 space-y-6">
            <div className="space-y-4">
              <label className="text-base text-white font-chakra font-black uppercase">Starting Round</label>
              <div className="space-y-3">
                <button className="w-full h-14 bg-transparent border border-white/10 rounded-2xl px-6 flex items-center justify-between text-white text-sm font-medium">
                  {format.startingRound}
                  <ChevronDown size={20} className="text-white/40 rotate-180" />
                </button>
                <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0F111A]/20">
                  {ROUNDS.map((r) => (
                    <button 
                      key={r}
                      onClick={() => {
                        setAddedFormats(addedFormats.map(af => af.id === editingFormatId ? {...af, info: `Starts at ${r}`, startingRound: r} : af))
                        setActiveConfigType(null)
                      }}
                      className={`w-full h-12 px-6 text-left text-[14px] font-bold transition-all border-b border-white/5 last:border-0 ${
                        format.startingRound === r ? 'text-white bg-white/5' : 'text-white/30 hover:text-white/60'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="pt-8">
            <GradientButton onClick={() => setShowConfirm(true)} className="h-14 w-full rounded-2xl font-chakra font-black text-base uppercase tracking-wider">
              Create Tournament
            </GradientButton>
          </div>
        </motion.div>
      )
    }

    if (format.type === 'Groups') {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-start">
          <h3 className="text-[12px] text-white font-chakra font-black uppercase tracking-[0.2em] ml-1">Groups Configuration</h3>
          <div className="bg-[#1C1F2D] border border-white/5 rounded-[28px] p-6 space-y-8">
            <div className="space-y-4">
              <label className="text-base text-white font-chakra font-black uppercase">Teams per Group</label>
              <div className="grid grid-cols-1 gap-2">
                {TEAMS_PER_GROUP.map((t) => (
                  <button 
                    key={t}
                    onClick={() => {
                      setAddedFormats(addedFormats.map(af => af.id === editingFormatId ? {...af, info: t, teamCount: t} : af))
                      setActiveConfigType(null)
                    }}
                    className={`w-full h-14 px-6 rounded-2xl flex items-center justify-between border transition-all ${
                      format.teamCount === t ? 'border-orange-500 bg-orange-500/5 text-white' : 'border-white/5 bg-transparent text-white/40'
                    }`}
                  >
                    <span className="font-chakra font-bold">{t}</span>
                    {format.teamCount === t && <Check size={18} className="text-orange-500" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-8">
            <GradientButton onClick={() => setShowConfirm(true)} className="h-14 w-full rounded-2xl font-chakra font-black text-base uppercase tracking-wider">
              Create Tournament
            </GradientButton>
          </div>
        </motion.div>
      )
    }

    if (format.type === 'League') {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-start">
          <h3 className="text-[12px] text-white font-chakra font-black uppercase tracking-[0.2em] ml-1">League Setup</h3>
          <div className="bg-[#1C1F2D] border border-white/5 rounded-[28px] p-6 space-y-6">
            <div className="space-y-4">
              <label className="text-base text-white font-chakra font-black uppercase">Number of Teams</label>
              <input 
                type="number"
                placeholder="Enter number of teams"
                className="w-full h-14 bg-transparent border border-white/10 rounded-2xl px-6 text-white text-sm"
              />
              <div className="pt-4 space-y-4">
                <label className="text-base text-white font-chakra font-black uppercase">Rounds</label>
                <div className="flex gap-4">
                  {['Single', 'Double'].map(r => (
                    <button key={r} className="flex-1 h-12 rounded-xl border border-white/10 text-white font-chakra font-bold text-xs uppercase tracking-widest hover:bg-white/5">
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="pt-8">
            <GradientButton onClick={() => setShowConfirm(true)} className="h-14 w-full rounded-2xl font-chakra font-black text-base uppercase tracking-wider">
              Create Tournament
            </GradientButton>
          </div>
        </motion.div>
      )
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#0F111A]">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 pt-12 pb-4">
        <button 
          onClick={step === 0 ? onClose : prevStep} 
          className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-chakra font-bold text-lg text-white tracking-tight uppercase">Create Tournament</h1>
      </div>

      {/* Stepper */}
      <div className="px-12 py-10 relative">
        <div className="absolute top-[84px] left-20 right-20 h-[2px] -z-0">
          <div className="absolute inset-0 border-b-2 border-dashed border-white/5" />
          <motion.div 
            className="absolute inset-y-0 left-0 border-b-2 border-dashed border-orange-600/60"
            initial={{ width: 0 }}
            animate={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        <div className="flex justify-between relative z-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-col items-center gap-4 w-20">
              <span className={`text-[10px] font-chakra font-black uppercase tracking-[0.2em] transition-colors duration-300 ${i <= step ? 'text-white' : 'text-white/20'}`}>
                {s}
              </span>
              <div 
                className={`w-5 h-5 rounded-full transition-all duration-500 relative z-10 ${
                  i <= step ? 'shadow-[0_0_15px_rgba(255,102,0,0.4)]' : ''
                }`}
                style={{
                  background: i <= step 
                    ? 'linear-gradient(180deg, #FF8A00 0%, #FD0200 100%)' 
                    : '#8E8E8E'
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-32">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div 
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 py-4"
            >
              <div className="flex flex-col items-center gap-3">
                <label className="cursor-pointer">
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-[#1C1F2D] shadow-2xl relative group">
                    <img src={details.photo} className="w-full h-full object-cover" alt="Profile" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus size={24} className="text-white" />
                    </div>
                  </div>
                </label>
                <span className="text-[13px] text-white/60 font-medium tracking-tight">Choose Photo</span>
              </div>

              <div className="space-y-5">
                <div className="space-y-2 text-start">
                  <label className="text-[13px] text-white/50 font-medium ml-1">Tournament Name</label>
                  <input type="text" value={details.name} onChange={(e) => setDetails({...details, name: e.target.value})} className="w-full h-14 bg-[#1C1F2D] border border-white/5 rounded-2xl px-6 text-white text-sm focus:outline-none focus:border-orange-500/30 transition-all font-medium" />
                </div>
                <div className="space-y-2 text-start">
                  <label className="text-[13px] text-white/50 font-medium ml-1">Host Organization</label>
                  <input type="text" value={details.host} onChange={(e) => setDetails({...details, host: e.target.value})} className="w-full h-14 bg-[#1C1F2D] border border-white/5 rounded-2xl px-6 text-white text-sm focus:outline-none focus:border-orange-500/30 transition-all font-medium" />
                </div>
                <div className="space-y-2 text-start">
                  <label className="text-[13px] text-white/50 font-medium ml-1">Sport</label>
                  <div className="relative">
                    <select value={details.sport} onChange={(e) => setDetails({...details, sport: e.target.value})} className="w-full h-14 bg-[#1C1F2D] border border-white/5 rounded-2xl px-6 text-white text-sm focus:outline-none focus:border-orange-500/30 transition-all font-medium appearance-none">
                      <option>Football</option>
                      <option>Basketball</option>
                    </select>
                    <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2 text-start">
                  <label className="text-[13px] text-white/50 font-medium ml-1">Gender</label>
                  <div className="relative">
                    <select value={details.gender} onChange={(e) => setDetails({...details, gender: e.target.value})} className="w-full h-14 bg-[#1C1F2D] border border-white/5 rounded-2xl px-6 text-white text-sm focus:outline-none focus:border-orange-500/30 transition-all font-medium appearance-none">
                      <option>Male</option>
                      <option>Female</option>
                    </select>
                    <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 text-start">
                    <label className="text-[13px] text-white/50 font-medium ml-1">Start Date</label>
                    <input type="text" value={details.startDate} onChange={(e) => setDetails({...details, startDate: e.target.value})} className="w-full h-14 bg-[#1C1F2D] border border-white/5 rounded-2xl px-6 text-white text-sm focus:outline-none focus:border-orange-500/30 transition-all font-medium" />
                  </div>
                  <div className="space-y-2 text-start">
                    <label className="text-[13px] text-white/50 font-medium ml-1">End date</label>
                    <input type="text" value={details.endDate} onChange={(e) => setDetails({...details, endDate: e.target.value})} className="w-full h-14 bg-[#1C1F2D] border border-white/5 rounded-2xl px-6 text-white text-sm focus:outline-none focus:border-orange-500/30 transition-all font-medium" />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <GradientButton onClick={nextStep} className="h-14 w-full rounded-2xl font-chakra font-black text-base uppercase tracking-wider">Next</GradientButton>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div 
              key="format-select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 py-4"
            >
              <div className="space-y-4 text-start">
                <h3 className="text-[13px] text-white/50 font-medium ml-1">Format</h3>
                <div className="grid grid-cols-2 gap-3">
                  {FORMAT_OPTIONS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFormat(f.id)}
                      className={`h-40 p-4 rounded-2xl border transition-all flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden group ${
                        selectedFormat === f.id ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.1)]' : 'bg-[#1C1F2D] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <f.icon size={28} className={selectedFormat === f.id ? 'text-orange-500' : 'text-white/20'} />
                      <div className="space-y-1">
                        <p className={`text-[13px] font-chakra font-bold transition-colors ${selectedFormat === f.id ? 'text-white' : 'text-white/80'}`}>{f.label}</p>
                        {f.subtitle && <p className="text-[9px] text-orange-500/80 font-medium italic">{f.subtitle}</p>}
                      </div>
                      {f.accent && selectedFormat === f.id && (
                        <div className="absolute top-2 right-2 flex gap-0.5">
                           <div className="w-1.5 h-1.5 rounded-sm bg-orange-500" />
                           <div className="w-1.5 h-1.5 rounded-sm bg-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 text-start">
                <h3 className="text-[13px] text-white/50 font-medium ml-1">Point System</h3>
                <div className="bg-[#1C1F2D] rounded-[24px] p-2 border border-white/5">
                  <div className="flex bg-[#0F111A]/60 rounded-xl p-1">
                    {['Standard', 'Custom'].map(t => (
                      <button key={t} onClick={() => setPointSystem(t)} className={`flex-1 h-10 rounded-[10px] text-xs font-chakra font-bold transition-all ${pointSystem === t ? 'bg-[#1C1F2D] text-white shadow-xl' : 'text-white/40'}`}>{t}</button>
                    ))}
                  </div>
                  <div className="flex justify-around py-5">
                    <div className="text-center"><span className="text-green-500 text-[11px] font-bold">Win</span><span className="text-white text-xs font-bold ml-1.5">- 3 points</span></div>
                    <div className="text-center"><span className="text-orange-500 text-[11px] font-bold">Draw</span><span className="text-white text-xs font-bold ml-1.5">- 1 points</span></div>
                    <div className="text-center"><span className="text-red-500 text-[11px] font-bold">Loss</span><span className="text-white text-xs font-bold ml-1.5">- 1 points</span></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-6">
                <button onClick={prevStep} className="font-chakra font-black text-sm text-white/40 uppercase tracking-widest hover:text-white transition-colors pl-4">Back</button>
                <GradientButton onClick={nextStep} className="h-14 flex-1 rounded-2xl font-chakra font-black text-base uppercase tracking-wider">Next</GradientButton>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="setup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 py-4"
            >
              {!activeConfigType ? (
                <>
                  <div className="space-y-6 text-start">
                    <h3 className="text-[13px] text-white/50 font-medium ml-1 uppercase tracking-wider">Format</h3>
                    
                    <div className="bg-[#1C1F2D] border border-white/5 rounded-[24px] overflow-hidden">
                      {addedFormats.filter(f => f.type === 'Groups').map((f, i, arr) => (
                        <div 
                          key={f.id}
                          onClick={() => { setEditingFormatId(f.id); setActiveConfigType('Groups'); }}
                          className={`p-6 flex items-center gap-4 group cursor-pointer hover:bg-white/5 transition-all ${i !== arr.length - 1 ? 'border-b border-white/5' : ''}`}
                        >
                          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                            <div className="grid grid-cols-2 gap-0.5">
                              <div className="w-2.5 h-2.5 bg-orange-500 rounded-sm" />
                              <div className="w-2.5 h-2.5 bg-white/40 rounded-sm" />
                              <div className="w-2.5 h-2.5 bg-orange-600 rounded-sm" />
                              <div className="w-2.5 h-2.5 bg-white rounded-sm" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-chakra font-black text-base text-white uppercase tracking-tight leading-none mb-1">{f.name}</h4>
                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest leading-none">Groups • {f.teamCount}</p>
                          </div>
                          <button onClick={(e) => removeFormat(f.id, e)} className="p-2 text-white/20 hover:text-red-500 transition-colors">
                            <Trash2 size={24} strokeWidth={2.5} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="px-10">
                      <button 
                        onClick={addSelectedFormat}
                        className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-white/20 text-white font-chakra font-bold text-[11px] uppercase tracking-widest hover:bg-white/5 transition-all"
                      >
                        <Plus size={14} /> Add Format
                      </button>
                    </div>

                    {addedFormats.filter(f => f.type !== 'Groups').map((f) => (
                      <div 
                        key={f.id}
                        onClick={() => { setEditingFormatId(f.id); setActiveConfigType(f.type); }}
                        className="bg-[#1C1F2D] border border-white/5 rounded-[24px] p-6 flex items-center gap-4 cursor-pointer hover:border-white/10 transition-all text-start"
                      >
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                          {f.type === 'Knockout' ? (
                            <div className="relative">
                              <div className="w-3 h-3 bg-orange-600 rounded-sm mb-1" />
                              <div className="w-3 h-3 bg-orange-500 rounded-sm absolute left-3 top-2" />
                              <div className="w-3 h-3 bg-white rounded-sm absolute left-5 top-0" />
                            </div>
                          ) : <Trophy className="text-orange-500" size={24} />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-chakra font-black text-base text-white uppercase tracking-tight leading-none mb-1">{f.name}</h4>
                          <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest leading-none">{f.info || f.type}</p>
                        </div>
                        <button onClick={(e) => removeFormat(f.id, e)} className="p-2 text-white/20 hover:text-red-500 transition-colors">
                          <Trash2 size={24} strokeWidth={2.5} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-8 w-full">
                    <GradientButton 
                      onClick={() => addedFormats.length > 0 && setShowConfirm(true)} 
                      disabled={addedFormats.length === 0}
                      className="h-14 w-full rounded-2xl font-chakra font-black text-base uppercase tracking-wider"
                    >
                      Create Tournament
                    </GradientButton>
                  </div>
                </>
              ) : renderConfigScreen()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowConfirm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-sm bg-[#1C1F2D] rounded-[40px] p-8 border border-white/10 shadow-3xl text-center space-y-6">
              <div className="space-y-2 text-center">
                <h2 className="text-3xl font-chakra font-black text-white uppercase tracking-tight">Last chance !</h2>
                <p className="text-sm text-white/50 font-medium px-4">Are you sure you want to create this Tournament?</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowConfirm(false)} className="flex-1 h-14 rounded-2xl border border-white/10 text-white font-chakra font-bold text-sm hover:bg-white/5 transition-all">Back</button>
                <button onClick={handleFinalConfirm} className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 text-white font-chakra font-black text-sm uppercase tracking-wider shadow-lg shadow-orange-600/20">Confirm</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 inset-x-0 h-24 bg-[#141621] border-t border-white/5 flex items-center justify-around px-10 pb-6 rounded-t-[40px] z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col items-center gap-1.5 opacity-40">
           <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              <Building2 size={24} className="text-white" />
           </div>
           <span className="text-[11px] font-bold text-white tracking-wide">Home</span>
        </div>
        
        <div className="flex flex-col items-center gap-1.5">
           <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              <Trophy size={24} className="text-orange-500" />
           </div>
           <span className="text-[11px] font-bold text-orange-500 tracking-wide">League</span>
        </div>

        <div className="flex flex-col items-center gap-1.5 opacity-40">
           <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              <Layers size={24} className="text-white" />
           </div>
           <span className="text-[11px] font-bold text-white tracking-wide">News</span>
        </div>
      </div>
    </div>
  )
}
