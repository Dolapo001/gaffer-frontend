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

import { createCompetition } from '@/lib/services/competition.service'
import { listOrgs } from '@/lib/services/org.service'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToastStore } from '@/store/toastStore'

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
  const queryClient = useQueryClient()
  const toast = useToastStore()
  const { user } = useAuthStore()

  // Need OrgId
  const { data: orgs } = useQuery({ queryKey: ['orgs'], queryFn: listOrgs, enabled: !!user })
  const orgId = orgs?.[0]?._id

  const [step, setStep] = useState(0)
  const [showConfirm, setShowConfirm] = useState(false)
  const [activeConfigType, setActiveConfigType] = useState<string | null>(null)
  const [editingFormatId, setEditingFormatId] = useState<string | null>(null)
  
  // Form State
  const [details, setDetails] = useState({
    name: 'Gaffer League',
    host: 'Gaffer Admin',
    sport: 'Football',
    gender: 'male' as 'male' | 'female' | 'mixed',
    startDate: '2026-04-26',
    endDate: '2026-05-26',
    photo: '/images/hero-bg.jpg'
  })

  const [selectedFormat, setSelectedFormat] = useState('round_robin')
  const [pointSystem, setPointSystem] = useState('Standard')
  const [addedFormats, setAddedFormats] = useState<any[]>([
    { id: '1', type: 'Groups', name: 'Groups A', info: '4 Teams', teamCount: '4 Teams' },
    { id: '2', type: 'Groups', name: 'Groups B', info: '4 Teams', teamCount: '4 Teams' },
    { id: '3', type: 'Knockout', name: 'Knockout', info: 'Starts at Round of 16', startingRound: 'Round of 16' }
  ])

  // Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => createCompetition(orgId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions', orgId] })
      toast.addToast('Tournament created successfully!', 'success')
      onClose()
    },
    onError: (err: any) => {
      toast.addToast(err?.message || 'Failed to create tournament', 'error')
    }
  })

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
    if (!orgId) {
      toast.addToast('Please login to create tournament', 'error')
      return
    }

    createMutation.mutate({
      name: details.name,
      sport: details.sport,
      gender: details.gender,
      startDate: new Date(details.startDate).toISOString(),
      endDate: new Date(details.endDate).toISOString(),
      bannerUrl: details.photo,
      format: addedFormats.map(f => f.type).join(' + ')
    })
    setShowConfirm(false)
  }

  const renderConfigScreen = () => {
    const format = addedFormats.find(f => f.id === editingFormatId)
    if (!format) return null

    if (format.type === 'Knockout') {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-start">
          <h3 className="text-[12px] text-white font-chakra font-black uppercase tracking-[0.2em] ml-1">Knockout</h3>
          <div className="bg-[#1E2032] border border-white/5 rounded-[28px] p-6 space-y-6">
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
          <div className="bg-[#1E2032] border border-white/5 rounded-[28px] p-6 space-y-8">
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
          <div className="bg-[#1E2032] border border-white/5 rounded-[28px] p-6 space-y-6">
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
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#181928]">
      {/* Header */}
      <div className="flex items-center gap-6 px-6 pt-12 pb-4">
        <button 
          onClick={step === 0 ? onClose : prevStep} 
          className="w-11 h-11 rounded-full bg-[#1E2032] border border-white/5 flex items-center justify-center text-white/60 hover:text-white transition-all shadow-lg"
        >
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <h1 className="font-chakra font-black text-lg text-white tracking-widest uppercase">Create Tournament</h1>
      </div>

      {/* Stepper */}
      <div className="px-12 py-10 relative">
        <div className="absolute top-[84px] left-20 right-20 h-[1px] -z-0">
          <div className="absolute inset-x-0 border-b border-dashed border-white/10" />
        </div>

        <div className="flex justify-between relative z-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-col items-center gap-4 w-20">
              <span className={`text-[10px] font-chakra font-black uppercase tracking-[0.2em] transition-colors duration-300 ${i <= step ? 'text-white' : 'text-white/20'}`}>
                {s}
              </span>
              <div 
                className={`w-5 h-5 rounded-full transition-all duration-500 relative z-10 ${
                  i <= step ? 'bg-gradient-to-b from-[#FF8904] to-[#FD0200] shadow-[0_0_20px_rgba(255,102,0,0.5)]' : 'bg-[#1E2032] border border-white/10'
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-40 no-scrollbar">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div 
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 py-4"
            >
              <div className="flex flex-col items-center gap-3 mb-4">
                <label className="cursor-pointer">
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-[#1E2032] shadow-2xl relative group">
                    <img src={details.photo} className="w-full h-full object-cover" alt="Profile" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus size={24} className="text-white" />
                    </div>
                  </div>
                </label>
              </div>

              <div className="space-y-6">
                <div className="space-y-2 text-start">
                   <div className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-6 flex items-center shadow-inner">
                      <input type="text" value={details.name} onChange={(e) => setDetails({...details, name: e.target.value})} className="bg-transparent border-none outline-none text-white text-sm w-full font-chakra font-bold" />
                   </div>
                </div>

                <div className="space-y-2 text-start">
                  <label className="text-[11px] font-chakra font-black uppercase tracking-widest text-white/40 ml-1">Sport</label>
                  <div className="relative">
                    <select value={details.sport} onChange={(e) => setDetails({...details, sport: e.target.value})} className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-6 text-white text-sm focus:outline-none transition-all font-chakra font-bold appearance-none">
                      <option>Football</option>
                      <option>Basketball</option>
                    </select>
                    <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2 text-start">
                  <label className="text-[11px] font-chakra font-black uppercase tracking-widest text-white/40 ml-1">Gender</label>
                  <div className="relative">
                    <select 
                      value={details.gender} 
                      onChange={(e) => setDetails({...details, gender: e.target.value as 'male' | 'female' | 'mixed'})} 
                      className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-6 text-white text-sm focus:outline-none transition-all font-chakra font-bold appearance-none"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="mixed">Mixed</option>
                    </select>
                    <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 text-start">
                    <label className="text-[11px] font-chakra font-black uppercase tracking-widest text-white/40 ml-1">Start Date</label>
                    <div className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-6 flex items-center">
                        <input type="text" value={details.startDate} onChange={(e) => setDetails({...details, startDate: e.target.value})} className="bg-transparent border-none outline-none text-white text-sm w-full font-chakra font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2 text-start">
                    <label className="text-[11px] font-chakra font-black uppercase tracking-widest text-white/40 ml-1">End date</label>
                    <div className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-6 flex items-center">
                        <input type="text" value={details.endDate} onChange={(e) => setDetails({...details, endDate: e.target.value})} className="bg-transparent border-none outline-none text-white text-sm w-full font-chakra font-bold" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <button 
                  onClick={nextStep} 
                  className="w-full py-4 rounded-xl font-chakra font-black text-lg bg-gradient-to-r from-[#FF8904] to-[#E7000B] text-white uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all"
                >
                    Next
                </button>
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
                <h3 className="text-[11px] font-chakra font-black uppercase tracking-widest text-white/40 ml-1">Format</h3>
                <div className="grid grid-cols-2 gap-3">
                  {FORMAT_OPTIONS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFormat(f.id)}
                      className={`h-40 p-4 rounded-2xl border transition-all flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden group ${
                        selectedFormat === f.id ? 'bg-[#FF4D00]/10 border-[#FF4D00]/50' : 'bg-[#1E2032] border-white/5'
                      }`}
                    >
                      <f.icon size={28} className={selectedFormat === f.id ? 'text-[#FF4D00]' : 'text-white/20'} />
                      <div className="space-y-1">
                        <p className="text-[13px] font-chakra font-black text-white uppercase tracking-tight">{f.label}</p>
                        {f.subtitle && <p className="text-[9px] text-[#FF4D00]/80 font-chakra font-bold italic uppercase tracking-wider">{f.subtitle}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-6 pt-6 pb-12">
                <button onClick={prevStep} className="font-chakra font-black text-sm text-white/40 uppercase tracking-widest hover:text-white transition-colors pl-4">Back</button>
                <button 
                  onClick={nextStep} 
                  className="flex-1 py-4 rounded-xl font-chakra font-black text-lg bg-gradient-to-r from-[#FF8904] to-[#E7000B] text-white uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all"
                >
                    Next
                </button>
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
                    <h3 className="text-[11px] font-chakra font-black uppercase tracking-widest text-white/40 ml-1">Configuration</h3>
                    
                    <div className="bg-[#1E2032] border border-white/5 rounded-[24px] overflow-hidden">
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
                              <div className="w-2.5 h-2.5 bg-[#FF4D00] rounded-sm" />
                              <div className="w-2.5 h-2.5 bg-white rounded-sm" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-chakra font-black text-base text-white uppercase tracking-tight leading-none mb-1">{f.name}</h4>
                            <p className="text-[10px] text-white/30 font-chakra font-black uppercase tracking-widest leading-none">Groups • {f.teamCount}</p>
                          </div>
                          <button onClick={(e) => removeFormat(f.id, e)} className="p-2 text-white/20 hover:text-[#E7000B] transition-colors">
                            <Trash2 size={24} strokeWidth={2.5} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="px-10">
                      <button 
                        onClick={addSelectedFormat}
                        className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border border-white/10 text-white font-chakra font-black text-[11px] uppercase tracking-widest hover:bg-white/5 transition-all"
                      >
                        <Plus size={16} /> Add Format
                      </button>
                    </div>

                    {addedFormats.filter(f => f.type !== 'Groups').map((f) => (
                      <div 
                        key={f.id}
                        onClick={() => { setEditingFormatId(f.id); setActiveConfigType(f.type); }}
                        className="bg-[#1E2032] border border-white/5 rounded-[24px] p-6 flex items-center gap-4 cursor-pointer hover:border-white/10 transition-all text-start"
                      >
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                          {f.type === 'Knockout' ? (
                            <div className="relative">
                              <div className="w-3 h-3 bg-[#E7000B] rounded-sm mb-1" />
                              <div className="w-3 h-3 bg-[#FF8904] rounded-sm absolute left-3 top-2" />
                              <div className="w-3 h-3 bg-white rounded-sm absolute left-5 top-0" />
                            </div>
                          ) : <Trophy className="text-[#FF8904]" size={24} />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-chakra font-black text-base text-white uppercase tracking-tight leading-none mb-1">{f.name}</h4>
                          <p className="text-[10px] text-white/30 font-chakra font-black uppercase tracking-widest leading-none">{f.info || f.type}</p>
                        </div>
                        <button onClick={(e) => removeFormat(f.id, e)} className="p-2 text-white/20 hover:text-[#E7000B] transition-colors">
                          <Trash2 size={24} strokeWidth={2.5} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-8 w-full pb-12">
                    <button 
                      onClick={() => addedFormats.length > 0 && setShowConfirm(true)} 
                      disabled={addedFormats.length === 0}
                      className="w-full py-4 rounded-xl font-chakra font-black text-lg bg-gradient-to-r from-[#FF8904] to-[#E7000B] text-white uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      Create Tournament
                    </button>
                  </div>
                </>
              ) : (
                  <div className="pb-12">
                    {renderConfigScreen()}
                  </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowConfirm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-sm bg-[#1E2032] rounded-[40px] p-8 border border-white/10 shadow-3xl text-center space-y-6">
              <div className="space-y-2 text-center">
                <h2 className="text-3xl font-chakra font-black text-white uppercase tracking-tight">Last chance !</h2>
                <p className="text-sm text-white/50 font-chakra font-bold">Are you sure you want to create this Tournament?</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowConfirm(false)} className="flex-1 h-14 rounded-2xl border border-white/10 text-white font-chakra font-black text-sm uppercase hover:bg-white/5 transition-all">Back</button>
                <button onClick={handleFinalConfirm} className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-[#FF8904] to-[#E7000B] text-white font-chakra font-black text-sm uppercase tracking-widest shadow-lg shadow-[#FF8904]/20">Confirm</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
