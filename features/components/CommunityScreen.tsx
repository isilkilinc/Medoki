import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { MessageCircleHeart, Heart, Sparkles, Send } from "lucide-react";

interface Post {
  id: string;
  author_name: string;
  medication_name: string;
  content: string;
  likes_count: number;
  created_at: string;
}

export default function CommunityScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [medTag, setMedTag] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false); // YENİ: Anonimlik seçeneği
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    const { data } = await supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setPosts(data);
  }

  async function handleShare() {
    if (!user || !newPost.trim() || !medTag.trim()) return;
    setLoading(true);

    const { error } = await supabase.from("community_posts").insert({
      user_id: user.id,
      author_name: isAnonymous ? "Anonim Kullanıcı" : "Medoki Üyesi", 
      medication_name: medTag.trim(),
      content: newPost.trim(),
    });

    if (!error) {
      setNewPost("");
      setMedTag("");
      setIsAnonymous(false);
      fetchPosts(); 
    }
    setLoading(false);
  }

  async function handleLike(postId: string, currentLikes: number) {
    setPosts(posts.map(p => p.id === postId ? { ...p, likes_count: currentLikes + 1 } : p));
    await supabase.rpc('increment_like', { post_id: postId }); 
  }

  return (
    <main className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-md mx-auto flex flex-col gap-5 animate-fade-in-up">
        
        {/* Üst Başlık */}
        <div className="flex items-center gap-3 mb-2 pt-4">
          <div className="p-3 bg-primary/20 rounded-2xl">
            <MessageCircleHeart className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Deneyim Ağı</h2>
            <p className="text-sm text-muted-foreground">Seninle aynı süreçten geçenler</p>
          </div>
        </div>

        {/* Gönderi Paylaşma Alanı */}
        <div className="glass-card p-5 rounded-3xl border border-border/50 bg-background/60 backdrop-blur-xl shadow-lg">
          <input
            type="text"
            value={medTag}
            onChange={(e) => setMedTag(e.target.value)}
            placeholder="Hangi ilaç/takviye? (Örn: Magnezyum)"
            className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground mb-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="İlk haftan nasıldı? Yan etki yaşadın mı? Deneyimini paylaş..."
            className="w-full h-24 bg-muted/40 border border-border rounded-xl p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none mb-3 transition-all"
          />
          
          <div className="flex items-center justify-between mt-1">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              <input 
                type="checkbox" 
                checked={isAnonymous} 
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary/50 w-4 h-4 accent-primary"
              />
              Anonim Paylaş
            </label>

            <button
              onClick={handleShare}
              disabled={!newPost.trim() || !medTag.trim() || loading}
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "..." : <><Send className="w-4 h-4" /> Paylaş</>}
            </button>
          </div>
        </div>

        {/* Gönderi Akışı (Feed) */}
        <div className="flex flex-col gap-4 mt-2">
          {posts.map((post) => (
            <div key={post.id} className="bg-card border border-border/50 p-5 rounded-3xl shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/20">
                    {post.author_name === "Anonim Kullanıcı" ? "👻" : post.author_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{post.author_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(post.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
                <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full border border-primary/20">
                  💊 {post.medication_name}
                </span>
              </div>
              
              <p className="text-sm text-foreground/90 mt-4 mb-5 leading-relaxed">
                {post.content}
              </p>
              
              <div className="flex items-center gap-4 border-t border-border/50 pt-4">
                <button 
                  onClick={() => handleLike(post.id, post.likes_count)}
                  className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-red-500 transition-colors bg-muted/30 px-3 py-1.5 rounded-lg"
                >
                  <Heart className={`w-4 h-4 ${post.likes_count > 0 ? "text-red-500 fill-red-500" : ""}`} /> 
                  {post.likes_count > 0 ? `${post.likes_count} kişi faydalı buldu` : "Faydalı Buldum"}
                </button>
              </div>
            </div>
          ))}
          
          {posts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm glass-card rounded-3xl border border-border/50">
              <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-40 text-primary" />
              <p className="font-medium">Henüz kimse deneyim paylaşmamış.</p>
              <p className="opacity-70 mt-1">İlk paylaşan sen ol!</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
