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
  user_id: string; // Gönderi sahibini kontrol etmek için gerekli
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
  const [newPost, setNewPost] = useState("");
  const [medTag, setMedTag] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [commentText, setCommentText] = useState("");

  useEffect(() => { fetchPosts(); }, []);

  async function fetchPosts() {
    const { data } = await supabase.from("community_posts").select("*, comments:community_comments(*)").order("created_at", { ascending: false });
    if (data) setPosts(data.map(p => ({ ...p, showComments: false })));
  }

  // SİLME FONKSİYONU
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
      {/* ... (Header ve Paylaşım kısmı aynı kalabilir) ... */}

      {posts.map((post) => (
        <div key={post.id} className="bg-card border border-border/50 p-5 rounded-3xl shadow
