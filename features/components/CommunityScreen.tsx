import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, Trash2, Send } from "lucide-react";

interface Comment {
  id: string;
  author_name: string;
  content: string;
}

interface Post {
  id: string;
  user_id: string;
  medication_name: string;
  content: string;
  comments?: Comment[];
  showComments?: boolean;
}

export default function CommunityScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [medTag, setMedTag] = useState("");
  const [commentText, setCommentText] = useState("");

  useEffect(() => { fetchPosts(); }, []);

  async function fetchPosts() {
    const { data } = await supabase.from("community_posts").select("*, comments:community_comments(*)").order("created_at", { ascending: false });
    if (data) setPosts(data.map(p => ({ ...p, showComments: false })));
  }

  async function handleShare() {
    if (!newPost.trim() || !medTag.trim() || !user) return;
    await supabase.from("community_posts").insert({
      user_id: user.id,
      medication_name: medTag.trim(),
      content: newPost.trim(),
      author_name: "Medoki Üyesi"
    });
    setNewPost("");
    setMedTag("");
    fetchPosts();
  }

  async function handleDeletePost(postId: string) {
    await supabase.from("community_posts").delete().eq("id", postId);
    fetchPosts();
  }

  async function handleAddComment(postId: string) {
    if (!commentText.trim()) return;
    await supabase.from("community_comments").insert({ post_id: postId, user_id: user?.id, author_name: "Medoki Üyesi", content: commentText });
    setCommentText("");
    fetchPosts();
  }

  const toggleComments = (postId: string) => {
    setPosts(posts.map(p => p.id === postId ? { ...p, showComments: !p.showComments } : p));
  };

  return (
    <main className="min-h-screen bg-background p-4 pb-24">
      {/* Paylaşım Alanı */}
      <div className="bg-card border border-border/50 p-5 rounded-3xl shadow-sm mb-6">
        <input
          value={medTag}
          onChange={(e) => setMedTag(e.target.value)}
          placeholder="İlaç/Takviye ismi..."
          className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2 text-sm mb-2 focus:ring-2 focus:ring-primary/50 outline-none"
        />
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Deneyimini paylaş..."
          className="w-full h-20 bg-muted/40 border border-border rounded-xl p-3 text-sm mb-2 focus:ring-2 focus:ring-primary/50 outline-none"
        />
        <button 
          onClick={handleShare} 
          className="w-full bg-primary text-white py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all"
        >
          Paylaş
        </button>
      </div>

      {/* Gönderi Listesi */}
      {posts.map((post) => (
        <div key={post.id} className="bg-card border border-border/50 p-5 rounded-3xl shadow-sm mb-4">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-primary">💊 {post.medication_name}</span>
            {user?.id === post.user_id && (
              <button onClick={() => handleDeletePost(post.id)} className="text-red-500 hover:text-red-700">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-sm text-foreground/90">{post.content}</p>
          <div className="flex gap-4 pt-4 mt-4 border-t border-border/50">
            <button onClick={() => toggleComments(post.id)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary">
              <MessageSquare className="w-4 h-4" /> Yorumlar ({post.comments?.length || 0})
            </button>
          </div>
          {post.showComments && (
            <div className="mt-4 pt-4 border-t border-dashed border-border/50 space-y-3">
              {post.comments?.map((c) => (
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
