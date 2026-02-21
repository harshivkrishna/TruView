import api from './api';

export const translateReview = async (reviewId: string, targetLang: string) => {
    try {
        const response = await api.get(`/reviews/${reviewId}/translate/${targetLang}`);
        return response.data;
    } catch (error) {
        console.error('Translation API error:', error);
        return null;
    }
};
