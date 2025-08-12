import React from 'react';
import { X, Facebook, Twitter, MessageCircle, Instagram, Copy, Linkedin, Mail } from 'lucide-react';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateShareMessage, generateShareUrl, copyToClipboard, ReviewData } from '../utils/shareUtils';

interface SocialShareModalProps {
  review: ReviewData;
  onClose: () => void;
}

const SocialShareModal: React.FC<SocialShareModalProps> = ({ review, onClose }) => {
  const openInNewTab = (url: string, platform: string) => {
    try {
      // Open in new tab with proper security and window specifications
      const windowFeatures = platform === 'email' 
        ? '' // Email doesn't need specific window size
        : 'width=600,height=500,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no';
      
      const newWindow = window.open(url, '_blank', windowFeatures);
      
      // Check if popup was blocked
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Fallback: try to open without window features
        const fallbackWindow = window.open(url, '_blank');
        if (!fallbackWindow) {
          throw new Error('Popup blocked');
        }
      }
      
      // Add security measures
      if (newWindow && !newWindow.closed) {
        newWindow.opener = null; // Security: prevent access to parent window
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to open ${platform}:`, error);
      // Fallback: copy URL to clipboard if popup fails
      copyToClipboard(url).then(success => {
        if (success) {
          toast.error(`Popup blocked. Link copied to clipboard instead!`);
        } else {
          toast.error(`Failed to open ${platform}. Please allow popups and try again.`);
        }
      });
      return false;
    }
  };

  const shareOptions = [
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      description: 'Share with friends and family',
      action: () => {
        const url = generateShareUrl(review, 'facebook');
        return openInNewTab(url, 'facebook');
      }
    },
    {
      name: 'Twitter/X',
      icon: Twitter,
      color: 'bg-black hover:bg-gray-800',
      description: 'Share with your followers',
      action: () => {
        const url = generateShareUrl(review, 'twitter');
        return openInNewTab(url, 'twitter');
      }
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-700 hover:bg-blue-800',
      description: 'Share with professional network',
      action: () => {
        const url = generateShareUrl(review, 'linkedin');
        return openInNewTab(url, 'linkedin');
      }
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Share via WhatsApp',
      action: () => {
        const url = generateShareUrl(review, 'whatsapp');
        return openInNewTab(url, 'whatsapp');
      }
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600 hover:bg-gray-700',
      description: 'Share via email',
      action: () => {
        const url = generateShareUrl(review, 'email');
        return openInNewTab(url, 'email');
      }
    },
    {
      name: 'Instagram',
      icon: Instagram,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
      description: 'Copy text for Instagram',
      action: async () => {
        const shareText = generateShareMessage(review, 'instagram');
        const success = await copyToClipboard(shareText);
        if (success) {
          toast.success('Review text copied! You can now paste it on Instagram');
          // Also provide option to open Instagram
          const instagramUrl = 'https://www.instagram.com/';
          openInNewTab(instagramUrl, 'instagram');
        } else {
          toast.error('Failed to copy text');
        }
        return success;
      }
    },
    {
      name: 'Copy Link',
      icon: Copy,
      color: 'bg-gray-500 hover:bg-gray-600',
      description: 'Copy review link',
      action: async () => {
        const reviewUrl = `${window.location.origin}/review/${review._id}`;
        const success = await copyToClipboard(reviewUrl);
        if (success) {
          toast.success('Link copied to clipboard!');
        } else {
          toast.error('Failed to copy link');
        }
        return success;
      }
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Share Review</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Review Preview */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
          <div className="flex items-center mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < review.rating ? 'text-orange-500 fill-current' : 'text-gray-300'}`}
              />
            ))}
            <span className="ml-2 text-sm text-gray-600">({review.rating}/5)</span>
            {review.category && (
              <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                {review.category}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">
            {review.description.substring(0, 120)}...
          </p>
          {review.author?.name && (
            <p className="text-xs text-gray-500 mt-2">By {review.author.name}</p>
          )}
        </div>

        {/* Share Options */}
        <div className="space-y-3">
          {shareOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <button
                key={index}
                onClick={async () => {
                  try {
                    const success = await option.action();
                    if (success && !['Instagram', 'Copy Link'].includes(option.name)) {
                      // Social media opened successfully - close modal after short delay
                      setTimeout(() => onClose(), 500);
                    }
                  } catch (error) {
                    console.error(`Error sharing to ${option.name}:`, error);
                    toast.error(`Failed to share to ${option.name}`);
                  }
                }}
                className={`w-full ${option.color} text-white py-3 px-4 rounded-lg transition-all flex items-center justify-between font-medium hover:scale-[1.02] active:scale-[0.98]`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <div className="text-left">
                    <div>Share on {option.name}</div>
                    <div className="text-xs opacity-90">{option.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Popup Blocker Info */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Tip:</strong> If popups are blocked, we'll copy the link to your clipboard as a backup!
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default SocialShareModal;