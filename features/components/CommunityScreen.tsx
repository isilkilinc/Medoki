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
      author_name: "Medoki Üyesi", // İleride kullanıcının kendi profil adını çekebiliriz
      medication_name: medTag.trim(),
      content: newPost.trim(),
    });

    if (!error) {
      setNewPost("");
      setMedTag("");
      fetchPosts(); // Listeyi yenile
    }
    setLoading(false);
  }

  // Beğeni (Bana da İyi Geldi) Butonu
  async function handleLike(postId: string, currentLikes: number) {
    // UI'ı anında güncelle (Optimistic Update)
    setPosts(posts.map(p => p.id === postId ? { ...p, likes_count: currentLikes + 1 } : p));
    
    // Veritabanını güncelle
    await supabase.rpc('increment_like', { post_id: postId }); 
  }

  return (
    <div className="flex flex-col gap-5 pb-10 animate-fade-in-up">
      {/* Üst Başlık */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-primary/20 rounded-2xl">
          <MessageCircleHeart className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Deneyim Ağı</h2>
          <p className="text-sm text-muted-foreground">Seninle aynı süreçten geçenler</p>
        </div>
      </div>

      {/* Gönderi Paylaşma Alanı */}
      <div className="glass-card p-4 rounded-3xl border border-border/50">
        <input
          type="text"
          value={medTag}
          onChange={(e) => setMedTag(e.target.value)}
          placeholder="Hangi ilaç/takviye hakkında? (Örn: Magnezyum)"
          className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground mb-3 focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Deneyimini paylaş... İlk haftan nasıldı? Yan etki yaşadın mı?"
          className="w-full h-24 bg-background/50 border border-border/50 rounded-xl p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none mb-3"
        />
        <button
          onClick={handleShare}
          disabled={!newPost.trim() || !medTag.trim() || loading}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? "Paylaşılıyor..." : <><Send className="w-4 h-4" /> Toplulukla Paylaş</>}
        </button>
      </div>

      {/* Gönderi Akışı (Feed) */}
      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-card/40 border border-border/50 p-4 rounded-2xl">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                  {post.author_name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{post.author_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-1 rounded-full border border-primary/20">
                💊 {post.medication_name}
              </span>
            </div>
            
            <p className="text-sm text-foreground/90 mt-3 mb-4 leading-relaxed">
              {post.content}
            </p>
            
            <div className="flex items-center gap-4 border-t border-border/40 pt-3 mt-2">
              <button 
                onClick={() => handleLike(post.id, post.likes_count)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-red-400 transition-colors"
              >
                <Heart className="w-4 h-4" /> 
                {post.likes_count > 0 ? `${post.likes_count} kişi faydalı buldu` : "Faydalı Buldum"}
              </button>
            </div>
          </div>
        ))}
        
        {posts.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Henüz kimse deneyim paylaşmamış. İlk sen ol!
          </div>
        )}
      </div>
    </div>
  );
}
