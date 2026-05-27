import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { MessageCircleHeart, Heart, Sparkles, Send, MessageSquare } from "lucide-react";

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

interface Post {
  id: string;
  author_name: string;
  medication_name: string;
  content: string;
  likes_count: number;
  created_at: string;
  comments?: Comment[]; // Yorumları gönderiye ekledik
  showComments?: boolean; // Yorum kutusu açık mı kontrolü
}

export default function CommunityScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [medTag, setMedTag] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [commentText, setCommentText] = useState("");

  useEffect(() => { fetchPosts(); }, []);

  async function fetchPosts() {
    const { data } = await supabase.from("community_posts").select("*, comments:community_comments(*)").order("created_at", { ascending: false });
    if (data) setPosts(data.map(p => ({ ...p, showComments: false })));
  }

  // Yorumu gönder ve listeyi güncelle
  async function handleAddComment(postId: string) {
    if (!commentText.trim()) return;
    await supabase.from("community_comments").insert({ post_id: postId, user_id: user?.id, author_name: "Medoki Üyesi", content: commentText });
    setCommentText("");
    fetchPosts();
  }

  // Yorum kutusunu aç/kapat
  const toggleComments = (postId: string) => {
    setPosts(posts.map(p => p.id === postId ? { ...p, showComments: !p.showComments } : p));
  };

  // ... (handleShare ve handleLike fonksiyonları aynı kalır)

  return (
    <main className="min-h-screen bg-background p-4 pb-24">
      {/* ... (Üst Başlık ve Paylaşım Alanı aynı) ... */}

      {posts.map((post) => (
        <div key={post.id} className="bg-card border border-border/50 p-5 rounded-3xl shadow-sm mb-4">
          <p className="text-sm">{post.content}</p>
          
          <div className="flex gap-4 pt-4 border-t border-border/50">
            <button onClick={() => toggleComments(post.id)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary">
              <MessageSquare className="w-4 h-4" /> Yorumlar ({post.comments?.length || 0})
            </button>
          </div>

          {/* Yorumlar Bölümü (Sadece showComments true ise görünür) */}
          {post.showComments && (
            <div className="mt-4 pt-4 border-t border-dashed border-border/50 space-y-3">
              {post.comments?.map(c => (
                <div key={c.id} className="bg-muted/30 p-3 rounded-xl text-xs">
                  <span className="font-bold">{c.author_name}:</span> {c.content}
                </div>
              ))}
              <div className="flex gap-2">
                <input 
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                  placeholder="Yorum yaz..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button onClick={() => handleAddComment(post.id)} className="p-2 bg-primary text-white rounded-lg"><Send className="w-4 h-4"/></button>
              </div>
            </div>
          )}
        </div>
      ))}
    </main>
  );
}
