'use client'

import React, { useState, useLayoutEffect, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { OrganizationSidebar } from '@/components/organization/OrganizationSidebar'
import { AccountUpgradeModal } from '@/components/AccountUpgradeModal'
import { getGlobalFeed, type FeedItem } from '@/lib/services/feed.service'
import { getWallet } from '@/lib/services/payment.service'
import { getImageUrl } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { listOrgs } from '@/lib/services/org.service'
import { useUIStore } from '@/store/uiStore'

// --- Custom Inline SVGs ---
const CoinIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="20" cy="20" r="18" fill="url(#coin_grad1_dash)" />
    <circle cx="20" cy="20" r="15" fill="url(#coin_grad2_dash)" />
    <path d="M22.5 14H16.5C14.567 14 13 15.567 13 17.5V22.5C13 24.433 14.567 26 16.5 26H23.5C25.433 26 27 24.433 27 22.5V19.5H19V22H24V22.5C24 22.7761 23.7761 23 23.5 23H16.5C16.2239 23 16 22.7761 16 22.5V17.5C16 17.2239 16.2239 17 16.5 17H22.5V14Z" fill="#FFF2D1" />
    <defs>
      <linearGradient id="coin_grad1_dash" x1="2" y1="2" x2="38" y2="38" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFA000" />
        <stop offset="1" stopColor="#FF4D00" />
      </linearGradient>
      <linearGradient id="coin_grad2_dash" x1="20" y1="5" x2="20" y2="35" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFD54F" />
        <stop offset="1" stopColor="#FF8A00" />
      </linearGradient>
    </defs>
  </svg>
)

const FireIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C12 2 8 6 8 11.5C8 15.6421 11.3579 19 15.5 19C19.6421 19 23 15.6421 23 11.5C23 10.5 22.5 9 22.5 9C22.5 9 21.5 12 18.5 12C16.5 12 15 10 15 8C15 6 16 4 16 4C16 4 14.5 2 12 2Z" fill="url(#fire_grad)"/>
    <path d="M9 13C9 13 6 15 6 18C6 20.2091 7.79086 22 10 22C12.2091 22 14 20.2091 14 18C14 16 12 14 9 13Z" fill="url(#fire_grad2)"/>
    <defs>
      <linearGradient id="fire_grad" x1="15.5" y1="2" x2="15.5" y2="19" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF8A00"/>
        <stop offset="1" stopColor="#FF4D00"/>
      </linearGradient>
      <linearGradient id="fire_grad2" x1="10" y1="13" x2="10" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFD54F"/>
        <stop offset="1" stopColor="#FF8A00"/>
      </linearGradient>
    </defs>
  </svg>
)

const MenuIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6H20M4 12H20M4 18H14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const BellIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const UserBadgeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const ShareIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2"/>
    <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const NewsBadgeIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-6 h-6 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" />
    <path d="M7 7H17" />
    <path d="M7 12H17" />
    <path d="M7 17H12" />
  </svg>
)

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile, updateUser, setRole } = useAuthStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [news, setNews] = useState<FeedItem[]>([])
  const [isLoadingNews, setIsLoadingNews] = useState(true)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const { hideNavbar, showNavbar } = useUIStore()

  const { data: orgs } = useQuery({ queryKey: ['orgs'], queryFn: listOrgs, enabled: !!user })
  const hasOrg = (orgs && orgs.length > 0) || user?.isOrgActive

  useLayoutEffect(() => {
    const handleUpgrade = () => setUpgradeModalOpen(true)
    window.addEventListener('gaffer:upgrade-org', handleUpgrade)
    return () => window.removeEventListener('gaffer:upgrade-org', handleUpgrade)
  }, [])

  useEffect(() => {
    if (isSidebarOpen) hideNavbar()
    else showNavbar()
    return () => showNavbar()
  }, [isSidebarOpen, hideNavbar, showNavbar])

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const feed = await getGlobalFeed(1)
        setNews((feed.data || feed.items || []).slice(0, 3))
      } catch (err) {
        console.error('Failed to fetch news:', err)
      } finally {
        setIsLoadingNews(false)
      }
    }
    const fetchWallet = async () => {
      try {
        const wallet = await getWallet()
        setWalletBalance(wallet.balance)
      } catch (err) {
        console.error('Failed to fetch wallet:', err)
      }
    }
    fetchNews()
    fetchWallet()
  }, [])

  const displayName = profile?.fullName || profile?.username || user?.email?.split('@')[0] || 'Gaffer'

  return (
    <div className="h-dvh flex flex-col bg-[#14151f] overflow-hidden relative font-sans">
      
      <div className="absolute top-0 right-0 w-full h-[250px] bg-[#ff6b00]/10 blur-[80px] pointer-events-none -translate-y-1/2" />

      {/* ... Sidebar & Modal ... */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <React.Fragment key="sidebar-overlay">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[105]"
            />
            <OrganizationSidebar onClose={() => setIsSidebarOpen(false)} />
          </React.Fragment>
        )}
      </AnimatePresence>

      <AccountUpgradeModal 
          isOpen={upgradeModalOpen} 
          onClose={() => setUpgradeModalOpen(false)} 
          targetRole="organization" 
      />

      {/* Top Navbar */}
      <header className="px-4 md:px-6 pt-4 pb-3 flex items-center justify-between flex-shrink-0 transition-all z-50 relative">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="w-8 h-8 rounded-full flex items-center justify-start text-white/70 hover:text-[#ff6b00] active:scale-95 transition-all outline-none"
        >
          <MenuIcon className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-2">
          {walletBalance !== null && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => router.push('/app/shop')}
              className="flex items-center gap-1.5 bg-gradient-to-bl from-white/10 to-transparent border border-white/10 px-2.5 py-1.5 rounded-full cursor-pointer hover:border-[#ff6b00]/50 hover:bg-[#ff6b00]/10 transition-all mr-0.5 shadow-sm"
            >
              <CoinIcon className="w-4 h-4" />
              <span className="text-[11px] font-black tracking-tight text-white mb-0.5">{walletBalance}</span>
            </motion.div>
          )}
          <button 
            onClick={() => router.push('/app/notifications')}
            className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-full border border-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-95 shadow-sm flex-shrink-0"
          >
            <BellIcon className="w-4 h-4" />
          </button>
          <button 
             onClick={() => { router.push('/app/profile'); }}
            className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-full border border-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-95 shadow-sm flex-shrink-0"
          >
            <UserBadgeIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 md:px-6 relative z-10">
        <main className="space-y-6 pb-32 pt-2">
          <div>
             <p className="text-[#ff6b00] text-[10px] font-bold uppercase tracking-widest mb-0.5">Good Day,</p>
             <h2 className="font-black text-xl text-white uppercase tracking-tighter leading-none">{displayName}</h2>
          </div>

          {/* Top News Section */}
          <section>
            <h2 className="text-white/50 font-bold text-[13px] mb-4 uppercase tracking-[0.15em] ml-1">Top News</h2>
            
            {isLoadingNews ? (
              <div className="h-48 bg-[#1E2032] animate-pulse rounded-[28px] border border-white/5 shadow-lg" />
            ) : news.length > 0 ? (
              news.slice(0, 1).map(item => (
                <div key={item._id} className="bg-[#1E2032] rounded-[32px] overflow-hidden border border-white/10 shadow-xl group hover:border-[#ff6b00]/40 transition-colors duration-300">
                  <div className="relative h-44 bg-[#14151f] overflow-hidden">
                    {item.media?.[0]?.url ? (
                        <img 
                          src={getImageUrl(item.media[0].url)} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                          alt="" 
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#1E2032] to-[#14151f]" />
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1E2032] to-transparent pointer-events-none" />
                    
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] text-white font-bold uppercase tracking-widest border border-white/10">
                       {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  
                  <div className="px-5 pb-5 pt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-[#FF4D00] rounded-full flex items-center justify-center shadow-lg">
                          <span className="font-black text-[8px] text-white">G</span>
                        </div>
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">GAFFER</span>
                      </div>
                      
                      <button className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors active:scale-95">
                        <ShareIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <h3 className="text-white font-black text-[14px] leading-tight uppercase tracking-tight line-clamp-2 mb-1">{item.body.substring(0, 60)}{item.body.length > 60 ? '...' : ''}</h3>
                      <p className="text-white/50 text-[10px] font-medium leading-normal line-clamp-2">{item.body}</p>
                    </div>

                    <div className="pt-1 flex items-center gap-1.5">
                       <FireIcon className="w-3 h-3 translate-y-[-1px]" />
                       <span className="text-white font-bold text-[11px]">{item.likesCount || 0}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
                <div className="bg-[#1E2032] rounded-[24px] p-8 text-center border border-dashed border-white/10 shadow-inner">
                    <NewsBadgeIcon className="mx-auto text-white/20 mb-3" />
                    <p className="text-white/40 font-bold text-[11px] uppercase tracking-widest">No breaking news</p>
                </div>
            )}
          </section>

          {/* Tournament Section */}
          <section>
            <div className="bg-[#1E2032]/80 backdrop-blur-sm rounded-[32px] overflow-hidden border border-white/10 p-6 flex flex-col items-center text-center space-y-6 shadow-xl relative group hover:border-[#ff6b00]/30 transition-colors duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff6b00]/10 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              
              <div className="w-full h-40 rounded-2xl overflow-hidden bg-black/40 border border-white/5 flex items-center justify-center relative">
                 <img src="/images/empty_tournament.png" className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700" alt="" />
                 <div className="absolute inset-0 bg-gradient-to-t from-[#1E2032] via-transparent to-transparent opacity-80" />
              </div>
              
              {hasOrg ? (
                <div className="space-y-4 w-full relative z-10">
                  <div>
                    <h3 className="text-white font-black text-[16px] uppercase tracking-tight">Manager Area</h3>
                    <p className="text-white/50 text-[10px] font-medium leading-relaxed mt-1 max-w-[200px] mx-auto">Access your active tournaments and manage operations.</p>
                  </div>
                  <button
                    onClick={() => {
                      updateUser({ isOrgActive: true, lastRole: 'organization' })
                      setRole('organization')
                      router.push('/admin')
                    }}
                    className="w-full h-[48px] rounded-xl font-black text-[13px] bg-gradient-to-r from-[#FF8904] to-[#ff4d00] text-white uppercase tracking-wider shadow-[0_8px_20px_rgba(255,107,0,0.3)] hover:shadow-[0_8px_25px_rgba(255,107,0,0.4)] transition-shadow active:scale-[0.98]"
                  >
                    Go to Admin
                  </button>
                </div>
              ) : (
                <div className="space-y-4 w-full relative z-10">
                  <div>
                    <h3 className="text-white font-black text-[16px] uppercase tracking-tight">Become a Manager</h3>
                    <p className="text-white/50 text-[10px] font-medium leading-relaxed mt-1 max-w-[220px] mx-auto">Upgrade your account to create and manage professional tournaments.</p>
                  </div>
                  <button
                    onClick={() => setUpgradeModalOpen(true)}
                    className="w-full h-[48px] rounded-xl font-black text-[13px] bg-[#2a2b3d] border border-white/10 text-white uppercase tracking-wider hover:bg-[#34364c] hover:border-white/20 transition-all active:scale-[0.98] shadow-md"
                  >
                    Upgrade Account
                  </button>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
