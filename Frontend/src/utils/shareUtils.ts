export interface ReviewData {
  _id: string;
  title: string;
  description: string;
  rating: number;
  category?: string;
  tags?: string[];
  author?: {
    name: string;
  };
}

export const generateShareMessage = (
  review: ReviewData,
  platform: string
): string => {
  const baseUrl = window.location.origin;
  const reviewUrl = `${baseUrl}/review/${review._id}`;
  
  // Default message
  const defaultMessage = `Check out this honest review on TruView!`;
  
  // Generate hashtags
  const categoryHashtag = review.category ? `#${review.category.replace(/\s+/g, '')}` : '';
  const tagHashtags = review.tags?.slice(0, 2).map(tag => `#${tag}`).join(' ') || '';
  const hashtags = `${categoryHashtag} ${tagHashtags} #TruView #Reviews`.trim();
  
  // Platform-specific formatting
  switch (platform.toLowerCase()) {
    case 'twitter':
    case 'x':
      // Twitter has 280 character limit - ensure link is always included
      const twitterText = `${defaultMessage}\n\n"${review.title}"\nRating: ${review.rating}/5 stars\n\n${hashtags}\n\nRead more: ${reviewUrl}`;
      return twitterText.length > 280 ? twitterText.substring(0, 277) + '...' : twitterText;
      
    case 'facebook':
      // Facebook allows longer posts - include full review link
      return `${defaultMessage}\n\n"${review.title}"\nRating: ${review.rating}/5 stars\n\n${review.description.substring(0, 200)}...\n\n${hashtags}\n\nRead full review: ${reviewUrl}`;
      
    case 'linkedin':
      // LinkedIn for professional sharing - include review link
      return `${defaultMessage}\n\n"${review.title}"\nRating: ${review.rating}/5 stars\n\n${review.description.substring(0, 150)}...\n\n${hashtags}\n\nRead the full review: ${reviewUrl}`;
      
    case 'whatsapp':
      // WhatsApp - cleaner format with proper formatting and link
      return `${defaultMessage}\n\n*${review.title}*\nRating: ${review.rating}/5 stars\n\n${review.description.substring(0, 100)}...\n\nRead full review: ${reviewUrl}`;
      
    case 'email':
      // Email - more formal format with review link
      return `${defaultMessage}\n\nReview: "${review.title}"\nRating: ${review.rating}/5 stars\nCategory: ${review.category || 'General'}\n\n${review.description.substring(0, 200)}...\n\nRead full review: ${reviewUrl}`;
      
    case 'instagram':
      // Instagram - focus on hashtags with review link reference
      return `${defaultMessage}\n\n"${review.title}"\nRating: ${review.rating}/5 stars\n\n${hashtags}\n\nLink: ${reviewUrl}`;
      
    case 'telegram':
      // Telegram - similar to WhatsApp with link
      return `${defaultMessage}\n\n"${review.title}"\nRating: ${review.rating}/5 stars\n\n${review.description.substring(0, 100)}...\n\nRead full review: ${reviewUrl}`;
      
    default:
      // Default format always includes review link
      return `${defaultMessage}\n\n"${review.title}"\nRating: ${review.rating}/5 stars\n\nRead full review: ${reviewUrl}`;
  }
};

export const generateShareUrl = (
  review: ReviewData,
  platform: string
): string => {
  const reviewUrl = `${window.location.origin}/review/${review._id}`;
  const shareText = generateShareMessage(review, platform);
  
  switch (platform.toLowerCase()) {
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(reviewUrl)}&quote=${encodeURIComponent(shareText)}`;
      
    case 'twitter':
    case 'x':
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
      
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(reviewUrl)}&title=${encodeURIComponent(review.title)}&summary=${encodeURIComponent(shareText)}`;
      
    case 'whatsapp':
      return `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      
    case 'telegram':
      return `https://t.me/share/url?url=${encodeURIComponent(reviewUrl)}&text=${encodeURIComponent(shareText)}`;
      
    case 'email':
      const subject = `Check out this review: ${review.title}`;
      return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareText)}`;
      
    default:
      return reviewUrl;
  }
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}; 