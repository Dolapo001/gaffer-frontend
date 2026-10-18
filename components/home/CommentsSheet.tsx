'use client'

import { X } from 'lucide-react'
import { CommentThread } from './CommentThread'

/** Comments on a post, as threads, in a sheet that slides up from the bottom like a social app. */
export function CommentsSheet({ postId, allowComments, onClose, onAdded }: { postId: string; allowComments: boolean; onClose: () => void; onAdded: () => void }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Comments">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#1E2032] rounded-t-3xl border-t border-white/10 h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="text-white font-bold">Comments</h3>
          <button onClick={onClose} aria-label="Close" className="text-white/50 hover:text-white"><X size={20} /></button>
        </div>
        <CommentThread postId={postId} allowComments={allowComments} composer="bottom" onAdded={onAdded} />
      </div>
    </div>
  )
}
