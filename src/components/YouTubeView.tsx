import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Play, ThumbsUp, Eye, DollarSign, Video as VideoIcon, Flame,
  Edit2, Trash2, Check, X, Upload, Users, Bot, Image as ImageIcon,
  Film, Loader2,
} from 'lucide-react';
import { supabase, Video } from '@/lib/supabase';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { VIDEO_CATEGORIES } from '@/lib/catalog';
import { formatMoney } from '@/lib/format';

const BOT_CREATORS = [
  'GamerZone99', 'FinancePro', 'CarEnthusiast', 'TechGuru', 'DailyVlogs',
  'ComedyCentral', 'EduTuber', 'MusicVibes', 'StreetRacer88', 'CryptoKing',
  'LuxeLife', 'GadgetFreak', 'StoryTime', 'ViralVault', 'ProGamerX',
];

const BOT_VIDEO_TITLES = [
  'I Bought Every Car on the Black Market', 'Day Trading Gone Wrong', 'INSANE Casino Win',
  'Building the Ultimate Backrooms', 'Testing Black Market Cars', 'How I Made $1M Trading',
  'Poolrooms Exploration Gone Wrong', 'Ranking Every Gun in the Workshop',
  'I Gambled Everything at the Casino', 'Investing $100K in Crypto',
  'My Garage Tour 2024', 'Backrooms 3D Walkthrough', 'Crash Game Strategy',
  'Buying a Supercar with Trading Profits', 'The Truth About Black Market Cars',
];

const VIRAL_TITLES = [
  'THIS CHANGED EVERYTHING', 'I CAN\'T BELIEVE THIS HAPPENED', 'THE MOST INSANE THING EVER',
  'YOU WON\'T BELIEVE WHAT HAPPENED', 'I ALMOST DIED', 'EVERYTHING WENT WRONG',
];

interface VideoWithStats extends Video { liked?: boolean; }
type FeedTab = 'bots' | 'players';

function generateThumbnail(seed: number, category: string): string {
  const hues = [0, 30, 60, 120, 180, 240, 280, 320];
  const hue = hues[(seed + category.length) % hues.length];
  const hue2 = hues[(seed + 3) % hues.length];
  return `linear-gradient(135deg, hsl(${hue}, 60%, 25%), hsl(${hue2}, 70%, 15%))`;
}

export function YouTubeView() {
  const wallet = useWallet();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videos, setVideos] = useState<VideoWithStats[]>([]);
  const [botVideos, setBotVideos] = useState<VideoWithStats[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Gaming');
  const [posting, setPosting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoWithStats | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [uploadCount, setUploadCount] = useState(0);
  const [viralChance, setViralChance] = useState(0);
  const [activeTab, setActiveTab] = useState<FeedTab>('players');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  const loadVideos = useCallback(async () => {
    const [playerRes, botRes] = await Promise.all([
      supabase.from('videos').select('*').eq('is_bot', false).order('posted_at', { ascending: false }),
      supabase.from('videos').select('*').eq('is_bot', true).order('views', { ascending: false }).limit(30),
    ]);
    setVideos((playerRes.data ?? []) as VideoWithStats[]);
    setBotVideos((botRes.data ?? []) as VideoWithStats[]);
    setUploadCount((playerRes.data ?? []).filter((v) => !v.is_bot && v.user_id === user?.id).length);
  }, [user?.id]);

  useEffect(() => { loadVideos(); }, [loadVideos]);

  useEffect(() => {
    const baseChance = Math.min(uploadCount * 2, 40);
    const bonusFromVideos = Math.floor(uploadCount / 20) * 15;
    const ownLikes = videos.filter(v => v.user_id === user?.id).reduce((s, v) => s + v.likes, 0);
    setViralChance(Math.min(95, baseChance + bonusFromVideos + Math.min(ownLikes * 0.01, 20)));
  }, [uploadCount, videos, user?.id]);

  useEffect(() => {
    if (botVideos.length < 10) {
      const needed = 12 - botVideos.length;
      const newBots: Partial<Video>[] = [];
      for (let i = 0; i < needed; i++) {
        const creator = BOT_CREATORS[Math.floor(Math.random() * BOT_CREATORS.length)];
        const titleBase = BOT_VIDEO_TITLES[Math.floor(Math.random() * BOT_VIDEO_TITLES.length)];
        const cat = VIDEO_CATEGORIES[Math.floor(Math.random() * VIDEO_CATEGORIES.length)];
        const views = Math.floor(1000 + Math.random() * 500000);
        newBots.push({
          title: titleBase,
          category: cat,
          views,
          earnings: 0,
          likes: Math.floor(views * (0.02 + Math.random() * 0.08)),
          is_bot: true,
          creator_name: creator,
          description: `A ${cat.toLowerCase()} video by ${creator}.`,
          is_viral: views > 200000,
          thumbnail_seed: Math.floor(Math.random() * 1000),
          media_url: null,
          media_type: null,
        });
      }
      if (newBots.length > 0) supabase.from('videos').insert(newBots).then(() => loadVideos());
    }
  }, [botVideos.length, loadVideos]);

  useEffect(() => {
    if (videos.length === 0 && botVideos.length === 0) return;
    const interval = window.setInterval(async () => {
      const catMult: Record<string, number> = {
        Gaming: 1.5, Finance: 0.8, Cars: 1.2, 'Tech Reviews': 1.0, Vlogs: 0.7, Comedy: 1.3, Education: 0.9, Music: 1.1,
      };
      for (const v of videos) {
        let growth = 5 + Math.random() * 50;
        if (v.is_viral) growth *= 20;
        const mult = catMult[v.category] ?? 1;
        await supabase.from('videos').update({
          views: Math.floor(v.views + growth * mult),
          earnings: v.earnings + growth * 0.002 * mult,
          likes: v.likes + Math.floor(Math.random() * 3),
          last_update: new Date().toISOString(),
        }).eq('id', v.id);
      }
      for (const v of botVideos) {
        let growth = 2 + Math.random() * 20;
        if (v.is_viral) growth *= 5;
        await supabase.from('videos').update({ views: Math.floor(v.views + growth), likes: v.likes + Math.floor(Math.random() * 2) }).eq('id', v.id);
      }
      loadVideos();
    }, 5000);
    return () => clearInterval(interval);
  }, [videos.length, botVideos.length, loadVideos]);

  const showMsg = useCallback((type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }, []);

  const chooseMedia = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      showMsg('error', 'Please choose an image or video file.');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      showMsg('error', 'Media must be 100MB or smaller.');
      return;
    }
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  useEffect(() => () => { if (mediaPreview) URL.revokeObjectURL(mediaPreview); }, [mediaPreview]);

  const postVideo = async () => {
    if (!title.trim()) return showMsg('error', 'Enter a video title');
    if (!user) return showMsg('error', 'You need to be signed in to post.');
    setPosting(true);
    setUploading(!!mediaFile);

    const goesViral = Math.random() * 100 < viralChance;
    const finalTitle = goesViral ? `${VIRAL_TITLES[Math.floor(Math.random() * VIRAL_TITLES.length)]} ${title.trim()}` : title.trim();
    let mediaUrl: string | null = null;
    let mediaType: 'image' | 'video' | null = null;

    if (mediaFile) {
      const extension = mediaFile.name.split('.').pop()?.toLowerCase() || 'bin';
      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from('creator-media').upload(path, mediaFile, {
        contentType: mediaFile.type,
        upsert: false,
      });
      if (uploadError) {
        setPosting(false); setUploading(false);
        return showMsg('error', `Media upload failed: ${uploadError.message}`);
      }
      mediaUrl = supabase.storage.from('creator-media').getPublicUrl(path).data.publicUrl;
      mediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image';
    }

    const creatorName = user.email?.split('@')[0] || 'Player';
    const { data, error } = await supabase.from('videos').insert({
      title: finalTitle,
      description: description.trim(),
      category,
      views: goesViral ? Math.floor(5000 + Math.random() * 20000) : 0,
      earnings: 0,
      likes: 0,
      is_bot: false,
      creator_name: creatorName,
      is_viral: goesViral,
      thumbnail_seed: Math.floor(Math.random() * 1000),
      media_url: mediaUrl,
      media_type: mediaType,
      user_id: user.id,
    }).select().single();

    setPosting(false); setUploading(false);
    if (error) return showMsg('error', error.message);
    if (data) {
      await loadVideos();
      setTitle(''); setDescription(''); setMediaFile(null); setMediaPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      showMsg('success', goesViral
        ? `VIRAL HIT! "${finalTitle}" is blowing up with ${data.views.toLocaleString()} views already!`
        : `Posted "${finalTitle}" — players can now see it in the Players tab.`);
    }
  };

  const collectEarnings = async (video: Video) => {
    if (video.earnings <= 0) return;
    await wallet.addFunds(video.earnings);
    await supabase.from('videos').update({ earnings: 0 }).eq('id', video.id);
    showMsg('success', `Collected ${formatMoney(video.earnings)} from "${video.title}"`);
    await loadVideos();
    if (selectedVideo?.id === video.id) setSelectedVideo({ ...video, earnings: 0 });
  };

  const collectAll = async () => {
    const total = videos.filter(v => v.user_id === user?.id).reduce((s, v) => s + v.earnings, 0);
    if (total <= 0) return showMsg('error', 'No earnings to collect');
    await wallet.addFunds(total);
    for (const v of videos) if (v.user_id === user?.id && v.earnings > 0) await supabase.from('videos').update({ earnings: 0 }).eq('id', v.id);
    showMsg('success', `Collected ${formatMoney(total)} from all your videos`);
    await loadVideos();
  };

  const likeVideo = async (video: VideoWithStats) => {
    const liked = likedVideos.has(video.id);
    setLikedVideos(prev => {
      const next = new Set(prev);
      liked ? next.delete(video.id) : next.add(video.id);
      return next;
    });
    await supabase.from('videos').update({ likes: Math.max(0, video.likes + (liked ? -1 : 1)) }).eq('id', video.id);
    await loadVideos();
    setSelectedVideo(prev => prev?.id === video.id ? { ...prev, likes: Math.max(0, video.likes + (liked ? -1 : 1)) } : prev);
  };

  const startEdit = (video: Video) => { setEditingId(video.id); setEditTitle(video.title); setEditDesc(video.description); };

  const saveEdit = async () => {
    if (!editingId) return;
    const { data } = await supabase.from('videos').update({ title: editTitle.trim(), description: editDesc.trim() }).eq('id', editingId).select().single();
    setEditingId(null); await loadVideos();
    if (data) setSelectedVideo(data as VideoWithStats);
    showMsg('success', 'Video updated');
  };

  const deleteVideo = async (video: Video) => {
    await supabase.from('videos').delete().eq('id', video.id);
    setSelectedVideo(null); await loadVideos(); showMsg('success', 'Video deleted');
  };

  const ownVideos = videos.filter(v => v.user_id === user?.id);
  const totalViews = ownVideos.reduce((s, v) => s + v.views, 0);
  const totalEarnings = ownVideos.reduce((s, v) => s + v.earnings, 0);
  const totalLikes = ownVideos.reduce((s, v) => s + v.likes, 0);

  const renderMedia = (video: VideoWithStats, large = false) => {
    if (video.media_url && video.media_type === 'image') {
      return <img src={video.media_url} alt={video.title} className={`w-full h-full object-cover ${large ? '' : 'group-hover:scale-105'} transition-transform`} />;
    }
    if (video.media_url && video.media_type === 'video') {
      return <video src={video.media_url} className="w-full h-full object-cover" muted playsInline preload="metadata" />;
    }
    return <div className="w-full h-full" style={{ background: generateThumbnail(video.thumbnail_seed, video.category) }} />;
  };

  const renderVideoCard = (video: VideoWithStats) => {
    const liked = likedVideos.has(video.id);
    const mine = !video.is_bot && video.user_id === user?.id;
    return (
      <div key={video.id} className="group rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden hover:border-zinc-600 transition-colors cursor-pointer" onClick={() => setSelectedVideo(video)}>
        <div className="relative h-40 flex items-center justify-center overflow-hidden">
          {renderMedia(video)}
          {!video.media_url && <div className="absolute w-14 h-14 rounded-full bg-red-600/85 flex items-center justify-center"><Play className="w-6 h-6 text-white fill-white ml-1" /></div>}
          {video.media_type === 'video' && <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/70 text-white text-xs flex items-center gap-1"><Film className="w-3 h-3" /> Video</div>}
          {video.media_type === 'image' && <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/70 text-white text-xs flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Photo</div>}
          {video.is_viral && <div className="absolute top-2 left-2 px-2 py-1 rounded bg-red-600 text-white text-xs font-bold flex items-center gap-1"><Flame className="w-3 h-3" /> VIRAL</div>}
          <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/65 text-zinc-300 text-xs font-medium">{video.category}</div>
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/65 text-zinc-300 text-xs tabular-nums">{video.views.toLocaleString()} views</div>
        </div>
        <div className="p-3">
          <h3 className="text-sm font-semibold text-zinc-100 mb-1 line-clamp-2">{video.title}</h3>
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><span>{video.creator_name}</span>{video.is_bot ? <Bot className="w-3 h-3" /> : mine ? <span className="text-red-400">You</span> : <Users className="w-3 h-3" />}</span>
            <span className="flex items-center gap-1"><ThumbsUp className={`w-3 h-3 ${liked ? 'fill-red-500 text-red-500' : ''}`} /> {video.likes.toLocaleString()}</span>
          </div>
          {mine && video.earnings > 0 && <div className="mt-2 flex items-center justify-between"><span className="text-xs text-emerald-400 font-medium">{formatMoney(video.earnings)} uncollected</span><button onClick={(e) => { e.stopPropagation(); collectEarnings(video); }} className="text-xs px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium">Collect</button></div>}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h2 className="text-2xl font-bold text-zinc-100 mb-1">Creator Studio</h2><p className="text-zinc-500 text-sm">Post videos, share media, get views, and earn ad revenue</p></div>
        {totalEarnings > 0 && <button onClick={collectAll} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold"><DollarSign className="w-4 h-4" /> Collect All ({formatMoney(totalEarnings)})</button>}
      </div>

      {/* The two main Creator Studio feeds */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-full sm:w-fit">
        <button onClick={() => setActiveTab('bots')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'bots' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}><Bot className="w-4 h-4" /> Bots</button>
        <button onClick={() => setActiveTab('players')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'players' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}><Users className="w-4 h-4" /> Players</button>
      </div>

      {activeTab === 'players' && <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4"><div className="text-xs text-zinc-500 mb-1">Your Videos</div><div className="text-xl font-bold text-zinc-100">{ownVideos.length}</div></div>
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4"><div className="text-xs text-zinc-500 mb-1 flex items-center gap-1"><Eye className="w-3 h-3" /> Your Views</div><div className="text-xl font-bold text-zinc-100 tabular-nums">{totalViews.toLocaleString()}</div></div>
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4"><div className="text-xs text-zinc-500 mb-1 flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> Your Likes</div><div className="text-xl font-bold text-zinc-100 tabular-nums">{totalLikes.toLocaleString()}</div></div>
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4"><div className="text-xs text-zinc-500 mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Uncollected</div><div className="text-xl font-bold text-emerald-400 tabular-nums">{formatMoney(totalEarnings)}</div></div>
      </div>}

      {activeTab === 'players' && <div className="bg-gradient-to-r from-red-950/40 to-orange-950/40 rounded-xl border border-red-900/30 p-4">
        <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><Flame className="w-5 h-5 text-red-500" /><h3 className="text-sm font-semibold text-red-400">Viral Chance Meter</h3></div><span className="text-lg font-bold text-red-400 tabular-nums">{viralChance}%</span></div>
        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden mb-2"><div className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all rounded-full" style={{ width: `${viralChance}%` }} /></div>
        <p className="text-xs text-zinc-400">Upload {20 - (uploadCount % 20)} more video{20 - (uploadCount % 20) !== 1 ? 's' : ''} for a viral bonus. Every like adds to your chance. Viral videos get 20x more views!</p>
      </div>}

      {msg && <div className={`px-4 py-2.5 rounded-lg text-sm ${msg.type === 'success' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>{msg.text}</div>}

      {activeTab === 'players' && <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2"><Upload className="w-4 h-4" /> Upload New Video</h3>
        <div className="flex flex-col gap-3">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Video title..." className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-600" />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)..." rows={2} className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-600 resize-none" />
          <div className="flex flex-col sm:flex-row gap-3">
            <select value={category} onChange={e => setCategory(e.target.value)} className="bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-red-600">{VIDEO_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={e => chooseMedia(e.target.files?.[0] ?? null)} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-medium flex items-center justify-center gap-2"><ImageIcon className="w-4 h-4" /> Import Photo / Video</button>
            <button onClick={postVideo} disabled={posting || !title.trim()} className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg text-sm disabled:opacity-50 flex items-center justify-center gap-2">{posting ? <><Loader2 className="w-4 h-4 animate-spin" /> {uploading ? 'Uploading...' : 'Posting...'}</> : <><Upload className="w-4 h-4" /> Post Video</>}</button>
          </div>
          {mediaFile && mediaPreview && <div className="relative rounded-xl overflow-hidden border border-zinc-700 bg-black h-44"><button onClick={() => { setMediaFile(null); URL.revokeObjectURL(mediaPreview); setMediaPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute z-10 top-2 right-2 p-1.5 rounded-full bg-black/70 text-white"><X className="w-4 h-4" /></button>{mediaFile.type.startsWith('video/') ? <video src={mediaPreview} controls className="w-full h-full object-contain" /> : <img src={mediaPreview} alt="Upload preview" className="w-full h-full object-contain" />}</div>}
          <p className="text-xs text-zinc-600">Images and videos up to 100MB. Uploaded media is saved so other players can view it.</p>
        </div>
      </div>}

      <div>
        <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold text-zinc-300">{activeTab === 'bots' ? 'Bot Videos' : 'Player Videos'}</h3><span className="text-xs text-zinc-600">{activeTab === 'bots' ? botVideos.length : videos.length} videos</span></div>
        {activeTab === 'bots' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{botVideos.map(renderVideoCard)}</div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-600"><VideoIcon className="w-16 h-16 mb-4" /><p className="text-lg">No player videos yet.</p><p className="text-sm">Be the first player to upload one.</p></div>
        ) : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{videos.map(renderVideoCard)}</div>}
      </div>

      {selectedVideo && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => { setSelectedVideo(null); setEditingId(null); }}>
        <div className="bg-zinc-900 rounded-2xl border border-zinc-700 max-w-3xl w-full max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
            {selectedVideo.media_url && selectedVideo.media_type === 'video' ? <video src={selectedVideo.media_url} controls autoPlay playsInline className="w-full h-full object-contain" /> : selectedVideo.media_url && selectedVideo.media_type === 'image' ? <img src={selectedVideo.media_url} alt={selectedVideo.title} className="w-full h-full object-contain" /> : <><div className="absolute inset-0" style={{ background: generateThumbnail(selectedVideo.thumbnail_seed, selectedVideo.category) }} /><div className="relative w-20 h-20 rounded-full bg-red-600/90 flex items-center justify-center"><Play className="w-10 h-10 text-white fill-white ml-1" /></div></>}
            {selectedVideo.is_viral && <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-bold flex items-center gap-1.5"><Flame className="w-4 h-4" /> VIRAL</div>}
            <button onClick={() => { setSelectedVideo(null); setEditingId(null); }} className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-zinc-300 hover:bg-black"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-5">
            {editingId === selectedVideo.id && !selectedVideo.is_bot ? <div className="flex flex-col gap-3 mb-4"><input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100" /><textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 resize-none" /><div className="flex gap-2"><button onClick={saveEdit} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium"><Check className="w-4 h-4" /> Save</button><button onClick={() => setEditingId(null)} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm">Cancel</button></div></div> : <><h2 className="text-lg font-bold text-zinc-100 mb-2">{selectedVideo.title}</h2><div className="flex items-center gap-3 text-sm text-zinc-500 mb-3"><span className="text-zinc-300 font-medium">{selectedVideo.creator_name}</span><span>{selectedVideo.views.toLocaleString()} views</span><span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-xs">{selectedVideo.category}</span></div>{selectedVideo.description && <p className="text-sm text-zinc-400 mb-4 bg-zinc-800/40 rounded-lg p-3">{selectedVideo.description}</p>}</>}
            <div className="flex items-center justify-between flex-wrap gap-3"><div className="flex items-center gap-3"><button onClick={() => likeVideo(selectedVideo)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${likedVideos.has(selectedVideo.id) ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}><ThumbsUp className={`w-4 h-4 ${likedVideos.has(selectedVideo.id) ? 'fill-white' : ''}`} /> {selectedVideo.likes.toLocaleString()}</button>{selectedVideo.user_id === user?.id && selectedVideo.earnings > 0 && <button onClick={() => collectEarnings(selectedVideo)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold"><DollarSign className="w-4 h-4" /> {formatMoney(selectedVideo.earnings)}</button>}</div>{selectedVideo.user_id === user?.id && !selectedVideo.is_bot && editingId !== selectedVideo.id && <div className="flex gap-2"><button onClick={() => startEdit(selectedVideo)} className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm"><Edit2 className="w-4 h-4" /> Edit</button><button onClick={() => deleteVideo(selectedVideo)} className="flex items-center gap-1.5 px-3 py-2 bg-red-900/40 text-red-400 rounded-lg text-sm"><Trash2 className="w-4 h-4" /> Delete</button></div>}</div>
          </div>
        </div>
      </div>}
    </div>
  );
}
