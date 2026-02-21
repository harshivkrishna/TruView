const { Translate } = require('@google-cloud/translate').v2;
const Review = require('../models/Review');

// Target languages for background translation
const APP_LANGUAGES = ['en', 'hi', 'ta'];

// Initialize the translate client with API key
let translate = null;

const getTranslateClient = () => {
    if (!translate) {
        const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
        if (!apiKey) {
            console.warn('⚠️ GOOGLE_TRANSLATE_API_KEY not set. Translation features disabled.');
            return null;
        }
        translate = new Translate({ key: apiKey });
    }
    return translate;
};

/**
 * Detect the language of a given text
 * @param {string} text - Text to detect language for
 * @returns {Promise<string|null>} Language code or null on error
 */
const detectLanguage = async (text) => {
    try {
        const client = getTranslateClient();
        if (!client) return null;

        // Use first 500 chars for detection (saves API cost)
        const sample = text.substring(0, 500);
        const [detection] = await client.detect(sample);
        return detection.language || null;
    } catch (error) {
        console.error('❌ Language detection failed:', error.message);
        return null;
    }
};

/**
 * Translate text to a target language
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code
 * @param {string} [sourceLang] - Source language code (optional, auto-detect if not provided)
 * @returns {Promise<string|null>} Translated text or null on error
 */
const translateText = async (text, targetLang, sourceLang = null) => {
    try {
        const client = getTranslateClient();
        if (!client) return null;

        const options = { to: targetLang };
        if (sourceLang) options.from = sourceLang;

        const [translation] = await client.translate(text, options);
        return translation;
    } catch (error) {
        console.error(`❌ Translation to '${targetLang}' failed:`, error.message);
        return null;
    }
};

/**
 * Background processor: detect language and translate review into all app languages.
 * Called via process.nextTick after review creation — non-blocking.
 * @param {string} reviewId - MongoDB ObjectId of the review
 */
const processReviewTranslations = async (reviewId) => {
    const startTime = Date.now();

    try {
        const review = await Review.findById(reviewId).select('description originalLanguage translations').lean();
        if (!review || !review.description) {
            console.log(`⏭️ Skipping translation for review ${reviewId}: no description`);
            return;
        }

        // Step 1: Detect language
        const detectedLang = await detectLanguage(review.description);
        if (!detectedLang) {
            console.warn(`⚠️ Could not detect language for review ${reviewId}`);
            return;
        }

        // Step 2: Update originalLanguage
        await Review.updateOne(
            { _id: reviewId },
            { $set: { originalLanguage: detectedLang } }
        );

        // Step 3: Translate into each app language (skip the original)
        const translationUpdates = {};
        const translationPromises = APP_LANGUAGES
            .filter(lang => lang !== detectedLang)
            .map(async (targetLang) => {
                const translated = await translateText(review.description, targetLang, detectedLang);
                if (translated) {
                    translationUpdates[`translations.${targetLang}`] = translated;
                }
            });

        await Promise.all(translationPromises);

        // Also store the original text under its own language key for consistency
        translationUpdates[`translations.${detectedLang}`] = review.description;

        // Step 4: Batch update all translations in one DB call
        if (Object.keys(translationUpdates).length > 0) {
            await Review.updateOne(
                { _id: reviewId },
                { $set: translationUpdates }
            );
        }

        const elapsed = Date.now() - startTime;
        console.log(`✅ Background translations for review ${reviewId} completed in ${elapsed}ms (lang: ${detectedLang}, translated: ${Object.keys(translationUpdates).length} variants)`);
    } catch (error) {
        console.error(`❌ Background translation failed for review ${reviewId}:`, error.message);
        // Never throw — this is a background task, errors must not crash the process
    }
};

/**
 * On-demand: translate a review to a specific language and cache the result.
 * Used by the /api/reviews/:id/translate/:targetLang endpoint.
 * @param {string} reviewId - MongoDB ObjectId
 * @param {string} targetLang - Target language code
 * @returns {Promise<{translatedText: string, originalLanguage: string, cached: boolean}|null>}
 */
const translateAndCache = async (reviewId, targetLang) => {
    try {
        const review = await Review.findById(reviewId)
            .select('description originalLanguage translations')
            .lean();

        if (!review) return null;

        // Check if translation already cached
        const existingTranslation = review.translations && review.translations.get
            ? review.translations.get(targetLang)
            : review.translations?.[targetLang];

        if (existingTranslation) {
            return {
                translatedText: existingTranslation,
                originalLanguage: review.originalLanguage,
                cached: true
            };
        }

        // Detect original language if not set
        let sourceLang = review.originalLanguage;
        if (!sourceLang) {
            sourceLang = await detectLanguage(review.description);
            if (sourceLang) {
                await Review.updateOne(
                    { _id: reviewId },
                    { $set: { originalLanguage: sourceLang } }
                );
            }
        }

        // If target is same as source, return original
        if (targetLang === sourceLang) {
            return {
                translatedText: review.description,
                originalLanguage: sourceLang,
                cached: true
            };
        }

        // Translate
        const translatedText = await translateText(review.description, targetLang, sourceLang);
        if (!translatedText) {
            // Translation not available (no API key or API error) — return original text
            return {
                translatedText: review.description,
                originalLanguage: sourceLang || null,
                cached: false,
                unavailable: true
            };
        }

        // Cache in DB (atomic update)
        await Review.updateOne(
            { _id: reviewId },
            { $set: { [`translations.${targetLang}`]: translatedText } }
        );

        return {
            translatedText,
            originalLanguage: sourceLang,
            cached: false
        };
    } catch (error) {
        console.error(`❌ translateAndCache failed for review ${reviewId}:`, error.message);
        return null;
    }
};

module.exports = {
    detectLanguage,
    translateText,
    processReviewTranslations,
    translateAndCache,
    APP_LANGUAGES
};
