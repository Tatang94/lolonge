
import React, { useState } from 'react';
import { extractSrcFromEmbed } from '../services/doodstreamService';

interface UploadModalProps {
  onClose: () => void;
  onUpload: (data: any) => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ onClose, onUpload }) => {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [description, setDescription] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Deteksi apakah input adalah iframe atau URL langsung
    let videoUrl = extractSrcFromEmbed(embedCode);
    
    // Jika bukan iframe, cek apakah URL Doodstream valid
    if (!videoUrl && (embedCode.includes('dood') || embedCode.includes('d0000d'))) {
        // Konversi link view ke link embed secara otomatis jika memungkinkan
        if (embedCode.includes('/d/')) videoUrl = embedCode.replace('/d/', '/e/');
        else if (embedCode.includes('/f/')) videoUrl = embedCode.replace('/f/', '/e/');
        else if (embedCode.includes('/e/')) videoUrl = embedCode;
        else videoUrl = embedCode; // Fallback
    }
    
    if (!videoUrl) {
      setError('FORMAT SALAH! GUNAKAN LINK DOOD ATAU KODE EMBED IFRAME.');
      return;
    }

    if (!title) {
        setError('JUDUL WAJIB DIISI.');
        return;
    }

    onUpload({
      title,
      genre,
      coverUrl,
      url: videoUrl,
      description: description
    });
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 rounded-[2.5rem] my-8 border border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-bottom-10">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900 sticky top-0 z-10 rounded-t-[2.5rem]">
          <h2 className="font-serif italic text-2xl text-white">Inject Konten</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-2xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/50">
              <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Judul Konten</label>
                <input 
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-600 transition-all"
                    placeholder="Judul Viral..."
                />
            </div>
            <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Kategori</label>
                <input 
                    type="text"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-600 transition-all"
                    placeholder="Eksklusif/Viral"
                />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Cover URL</label>
            <input 
                type="text"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-600 transition-all"
                placeholder="https://image-hosting.com/img.jpg"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Video Source (Doodstream Embed/Link)</label>
            <textarea 
              value={embedCode}
              onChange={(e) => setEmbedCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-amber-500 focus:outline-none focus:border-red-600 transition-all h-24 resize-none font-mono"
              placeholder="Masukkan link Doodstream atau <iframe> embed code..."
            />
            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-tight">Tips: Sistem akan otomatis konversi link view Doodstream ke link embed player.</p>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Sinopsis</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-red-600 transition-all h-20 resize-none"
              placeholder="Deskripsi singkat konten..."
            />
          </div>

          <button 
            type="submit"
            className="w-full py-5 rounded-2xl bg-red-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-red-600/20 active:scale-95 transition-all"
          >
            TERBITKAN VIDEO
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;
