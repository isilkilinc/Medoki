import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { MessageCircleHeart, Heart, Sparkles, Send, MessageSquare, Trash2 } from "lucide-react";

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

interface Post {
  id: string;
  user_id: string;
  author_name: string;
  medication_name: string;
  content: string;
  likes_count: number;
  created_at: string;
  comments?: Comment[];
  showComments?: boolean;
}

export default function CommunityScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [commentText, setCommentText] = useState("");

  useEffect(() => { fetchPosts(); }, []);

  async function fetchPosts() {
    const { data } = await supabase.from("community_posts").select("*, comments:community_comments(*)").order("created_at", { ascending: false });
    if (data) setPosts(data.map(p => ({ ...p, showComments: false })));
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
              {
