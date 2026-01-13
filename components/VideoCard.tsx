
import React from 'react';
import { Drama } from '../types';

interface DramaCardProps {
  drama: Drama;
  onClick: () => void;
}

const DramaCard: React.FC<DramaCardProps> = ({ drama, onClick }) => {
  return (
    <div onClick={onClick} className="group cursor-pointer space-y-3">
      <div className="relative aspect-[9/16] rounded-3xl overflow-hidden border border-slate-800 shadow-xl bg-slate-900">
        <img src={drama.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={drama.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
           <p className="text-[10px] text-white font-bold">{drama.episodes.length} EPISODE</p>
        </div>
        <div className="absolute top-3 right-3 bg-red-600 text-white font-black text-[8px] px-2 py-1 rounded-md shadow-lg shimmer-brand">
           LOLONG #{Math.floor(Math.random() * 100) + 1}
        </div>
      </div>
      <h3 className="font-bold text-xs leading-tight text-slate-200 group-hover:text-red-500 transition-colors line-clamp-2 uppercase tracking-tighter">{drama.title}</h3>
    </div>
  );
};

export default DramaCard;
