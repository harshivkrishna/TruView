import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { translateReview } from '../services/api';

interface TranslatedReviewContentProps {
    review: {
        _id: string;
        description: string;
        originalLanguage?: string;
        translations?: Record<string, string> | Map<string, string>;
    };
    compact?: boolean;
    maxLength?: number;
}

const TranslatedReviewContent: React.FC<TranslatedReviewContentProps> = ({
    review,
    compact = false,
    maxLength = 200
}) => {
    const { reviewLanguage, getLanguageName } = useLanguage();
    const [translating, setTranslating] = useState(false);
    const [onDemandTranslation, setOnDemandTranslation] = useState<string | null>(null);
    const [lastFetchedLang, setLastFetchedLang] = useState<string | null>(null);

    // Helper to get translation from either Map or plain object
    const getTranslation = useCallback((lang: string): string | undefined => {
        if (!review.translations) return undefined;
        if (review.translations instanceof Map) {
            return review.translations.get(lang);
        }
        return (review.translations as Record<string, string>)[lang];
    }, [review.translations]);

    // Determine which text to display
    const displayContent = useMemo(() => {
        // If a translation was fetched on-demand for current lang, use it
        if (onDemandTranslation && lastFetchedLang === reviewLanguage) {
            return {
                text: onDemandTranslation,
                isTranslated: true,
                fromLanguage: review.originalLanguage || null,
            };
        }

        // If review language matches original, show original
        if (!reviewLanguage || reviewLanguage === review.originalLanguage) {
            return {
                text: review.description,
                isTranslated: false,
                fromLanguage: null,
            };
        }

        // Check cached translations (already fetched from backend)
        const cached = getTranslation(reviewLanguage);
        if (cached) {
            return {
                text: cached,
                isTranslated: true,
                fromLanguage: review.originalLanguage || null,
            };
        }

        // No translation available yet — show original while auto-fetching
        return {
            text: review.description,
            isTranslated: false,
            fromLanguage: null,
            needsTranslation: true,
        };
    }, [reviewLanguage, review.description, review.originalLanguage, review.translations, onDemandTranslation, lastFetchedLang, getTranslation]);

    // Auto-translate when language changes and no cached translation exists
    useEffect(() => {
        const needsTranslation = (displayContent as any).needsTranslation;

        if (!needsTranslation) return;
        if (translating) return;
        if (lastFetchedLang === reviewLanguage) return; // already tried for this lang

        const langToFetch = reviewLanguage;
        setTranslating(true);

        translateReview(review._id, langToFetch)
            .then((result) => {
                if (result?.translatedText && !result.unavailable) {
                    setOnDemandTranslation(result.translatedText);
                }
                // Always mark as attempted (unavailable, null, or success) to stop retrying
                setLastFetchedLang(langToFetch);
            })
            .catch(() => {
                setLastFetchedLang(langToFetch);
            })
            .finally(() => {
                setTranslating(false);
            });
    }, [reviewLanguage, (displayContent as any).needsTranslation]);

    // Reset on-demand translation when review language changes to a different lang
    useEffect(() => {
        if (lastFetchedLang && lastFetchedLang !== reviewLanguage) {
            setOnDemandTranslation(null);
        }
    }, [reviewLanguage]);

    const text = displayContent.text || '';
    const displayText = compact && text.length > maxLength
        ? text.substring(0, maxLength) + '...'
        : text;

    return (
        <div>
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${review._id}-${reviewLanguage}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {translating ? (
                        // Show shimmer while translating
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-100 animate-pulse rounded w-full" />
                            <div className="h-4 bg-gray-100 animate-pulse rounded w-5/6" />
                            {!compact && <div className="h-4 bg-gray-100 animate-pulse rounded w-4/6" />}
                        </div>
                    ) : (
                        <p className={compact
                            ? "text-gray-600 text-sm leading-relaxed"
                            : "text-gray-700 leading-relaxed whitespace-pre-wrap"
                        }>
                            {displayText}
                        </p>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Translated badge */}
            {displayContent.isTranslated && displayContent.fromLanguage && !translating && (
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 mt-1.5"
                >
                    <Languages className="w-3 h-3 text-blue-400" />
                    <span className="text-xs text-blue-400">
                        Translated from {getLanguageName(displayContent.fromLanguage)}
                    </span>
                </motion.div>
            )}

            {/* Loading badge */}
            {translating && (
                <div className="flex items-center gap-1.5 mt-1.5">
                    <Loader2 className="w-3 h-3 text-orange-400 animate-spin" />
                    <span className="text-xs text-orange-400">Translating…</span>
                </div>
            )}
        </div>
    );
};

export default TranslatedReviewContent;
