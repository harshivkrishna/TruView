import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface LanguageOption {
    code: string;
    name: string;
    nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
];

interface LanguageContextType {
    appLanguage: string;
    reviewLanguage: string;
    setAppLanguage: (lang: string) => void;
    setReviewLanguage: (lang: string) => void;
    getLanguageName: (code: string) => string;
    getNativeLanguageName: (code: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

// Detect browser language and map to supported language
const detectBrowserLanguage = (): string => {
    const browserLang = navigator.language?.split('-')[0] || 'en';
    const supported = SUPPORTED_LANGUAGES.find(l => l.code === browserLang);
    return supported ? supported.code : 'en';
};

interface LanguageProviderProps {
    children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
    const [appLanguage, setAppLanguageState] = useState<string>(() => {
        return localStorage.getItem('truview_app_lang') || detectBrowserLanguage();
    });

    const [reviewLanguage, setReviewLanguageState] = useState<string>(() => {
        return localStorage.getItem('truview_review_lang') || detectBrowserLanguage();
    });

    const setAppLanguage = useCallback((lang: string) => {
        setAppLanguageState(lang);
        localStorage.setItem('truview_app_lang', lang);
    }, []);

    const setReviewLanguage = useCallback((lang: string) => {
        setReviewLanguageState(lang);
        localStorage.setItem('truview_review_lang', lang);
    }, []);

    const getLanguageName = useCallback((code: string): string => {
        return SUPPORTED_LANGUAGES.find(l => l.code === code)?.name || code;
    }, []);

    const getNativeLanguageName = useCallback((code: string): string => {
        return SUPPORTED_LANGUAGES.find(l => l.code === code)?.nativeName || code;
    }, []);

    // Sync with localStorage changes from other tabs
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'truview_app_lang' && e.newValue) {
                setAppLanguageState(e.newValue);
            }
            if (e.key === 'truview_review_lang' && e.newValue) {
                setReviewLanguageState(e.newValue);
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const value: LanguageContextType = {
        appLanguage,
        reviewLanguage,
        setAppLanguage,
        setReviewLanguage,
        getLanguageName,
        getNativeLanguageName,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};
