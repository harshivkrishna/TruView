import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useReviewContext } from '../contexts/ReviewContext';
import { translateReview } from '../services/translationApi';

interface TranslatedReviewContentProps {
    review: {
        _id: string;
        title?: string;
        description: string;
        originalLanguage?: string;
        translations?: Record<string, string> | Map<string, string>;
        titleTranslations?: Record<string, string> | Map<string, string>;
    };
    /** When true, renders only the translated title as an inline span (no badges/shimmer). */
    titleOnly?: boolean;
    compact?: boolean;
    maxLength?: number;
}

const TranslatedReviewContent: React.FC<TranslatedReviewContentProps> = ({
    review,
    titleOnly = false,
    compact = false,
    maxLength = 200
}) => {
    const { reviewLanguage } = useLanguage();
    const { updateReview } = useReviewContext();
    const [translating, setTranslating] = useState(false);
    const [onDemandTranslation, setOnDemandTranslation] = useState<string | null>(null);
    const [onDemandTitleTranslation, setOnDemandTitleTranslation] = useState<string | null>(null);
    const [lastFetchedLang, setLastFetchedLang] = useState<string | null>(null);

    // Helper to get translation from either Map or plain object
    const getTranslation = useCallback((
        map: Record<string, string> | Map<string, string> | undefined,
        lang: string
    ): string | undefined => {
        if (!map) return undefined;
        if (map instanceof Map) return map.get(lang);
        return (map as Record<string, string>)[lang];
    }, []);

    const isOriginalLang = !reviewLanguage || reviewLanguage === review.originalLanguage;

    // Determine which description text to display
    const displayContent = useMemo(() => {
        if (onDemandTranslation && lastFetchedLang === reviewLanguage) {
            return {
                text: onDemandTranslation,
                isTranslated: true,
                fromLanguage: review.originalLanguage || null,
            };
        }

        if (isOriginalLang) {
            return { text: review.description, isTranslated: false, fromLanguage: null };
        }

        const cached = getTranslation(review.translations, reviewLanguage);
        const cachedTitle = getTranslation(review.titleTranslations, reviewLanguage);

        // Needs translation if description is missing OR if title exists but its translation is missing
        const titleNeedsTranslation = review.title && !cachedTitle;

        if (cached && !titleNeedsTranslation) {
            return { text: cached, isTranslated: true, fromLanguage: review.originalLanguage || null };
        }

        return {
            text: cached || review.description,
            isTranslated: !!cached,
            fromLanguage: null,
            needsTranslation: true,
        };
    }, [reviewLanguage, review.description, review.title, review.originalLanguage, review.translations, review.titleTranslations, onDemandTranslation, lastFetchedLang, isOriginalLang, getTranslation]);

    // Determine which title to display
    const displayTitle = useMemo(() => {
        if (!review.title) return review.title || '';

        if (onDemandTitleTranslation && lastFetchedLang === reviewLanguage) {
            return onDemandTitleTranslation;
        }

        if (isOriginalLang) return review.title;

        const cached = getTranslation(review.titleTranslations, reviewLanguage);
        if (cached) return cached;

        return review.title; // fallback to original while fetching
    }, [reviewLanguage, review.title, review.originalLanguage, review.titleTranslations, onDemandTitleTranslation, lastFetchedLang, isOriginalLang, getTranslation]);

    // Auto-translate when language changes — fetches BOTH title + description in one API call
    useEffect(() => {
        const needsTranslation = (displayContent as any).needsTranslation;
        if (!needsTranslation) return;
        if (translating) return;
        if (lastFetchedLang === reviewLanguage) return;
        if (!review._id) return; // Guard: don't call API if _id is undefined

        const langToFetch = reviewLanguage;
        setTranslating(true);

        translateReview(review._id, langToFetch)
            .then((result) => {
                if (result?.translatedText && !result.unavailable) {
                    setOnDemandTranslation(result.translatedText);
                }
                if (result?.translatedTitle) {
                    setOnDemandTitleTranslation(result.translatedTitle);
                }

                // Sync with global context so all cards/views get the translation
                if (result && !result.unavailable && review._id) {
                    updateReview(review._id, {
                        translations: {
                            ...(review.translations as Record<string, string> || {}),
                            [langToFetch]: result.translatedText
                        },
                        titleTranslations: {
                            ...(review.titleTranslations as Record<string, string> || {}),
                            [langToFetch]: result.translatedTitle
                        }
                    });
                }

                setLastFetchedLang(langToFetch);
            })
            .catch(() => {
                setLastFetchedLang(langToFetch);
            })
            .finally(() => {
                setTranslating(false);
            });
    }, [reviewLanguage, (displayContent as any).needsTranslation]);

    // Reset on-demand translations when language changes
    useEffect(() => {
        if (lastFetchedLang && lastFetchedLang !== reviewLanguage) {
            setOnDemandTranslation(null);
            setOnDemandTitleTranslation(null);
        }
    }, [reviewLanguage]);

    // ── TITLE-ONLY mode: renders just the translated title inline ─────────
    if (titleOnly) {
        return (
            <span className={translating ? 'opacity-60 transition-opacity' : ''}>
                {displayTitle}
            </span>
        );
    }

    // ── DESCRIPTION mode ─────────────────────────────────────────────────────
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

            {/* Translated badge removed as per user request */}

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
