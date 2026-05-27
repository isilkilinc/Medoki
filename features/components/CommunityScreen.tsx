// ... önceki importlara ek olarak 'MessageSquare' ekledik
import { MessageCircleHeart, Heart, Sparkles, Send, MessageSquare } from "lucide-react";

// ... (Interface Post kısmı aynı kalıyor)

// ... (handleShare ve handleLike fonksiyonları aynı kalıyor)

// Yeni fonksiyon: Yorum ekleme
async function handleAddComment(postId: string, content: string) {
  if (!content.trim()) return;
  await supabase.from("community_comments").insert({
    post_id: postId,
    user_id: user?.id,
    author_name: "Medoki Üyesi",
    content: content.trim(),
  });
  // Yorum ekledikten sonra gönderileri/yorumları tazelemek için fetchPosts() tekrar çağrılabilir
}

// ... (Return kısmındaki JSX'e şu küçük dokunuşu ekliyoruz)
// Gönderi kartının altındaki buton kısmına şunu ekle:
<div className="flex items-center gap-4 border-t border-border/50 pt-4">
  <button 
    onClick={() => handleLike(post.id, post.likes_count)}
    className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-red-500 transition-colors"
  >
    <Heart className="w-4 h-4" /> {post.likes_count}
  </button>
  
  {/* Yorum Butonu */}
  <button className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">
    <MessageSquare className="w-4 h-4" /> Yorum Yap
  </button>
</div>
