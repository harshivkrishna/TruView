import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useAnimation } from 'framer-motion';
import { 
  Star, TrendingUp, Users, Shield, Award, Zap, Globe, CheckCircle, 
  ArrowRight, Play, MessageSquare, ThumbsUp, Eye, Sparkles, Clock, ArrowRight as ArrowRightIcon
} from 'lucide-react';
import ReviewCard from '../components/ReviewCard';
import Footer from '../components/Footer';
import { getMostViewedReviewsWeek } from '../services/api';

// Type assertions for Lucide icons and Link to fix TypeScript compatibility
const StarIcon = Star as React.ComponentType<any>;
const TrendingUpIcon = TrendingUp as React.ComponentType<any>;
const UsersIcon = Users as React.ComponentType<any>;
const ShieldIcon = Shield as React.ComponentType<any>;
const AwardIcon = Award as React.ComponentType<any>;
const ZapIcon = Zap as React.ComponentType<any>;
const GlobeIcon = Globe as React.ComponentType<any>;
const CheckCircleIcon = CheckCircle as React.ComponentType<any>;
const PlayIcon = Play as React.ComponentType<any>;
const MessageSquareIcon = MessageSquare as React.ComponentType<any>;
const ThumbsUpIcon = ThumbsUp as React.ComponentType<any>;
const EyeIcon = Eye as React.ComponentType<any>;
const SparklesIcon = Sparkles as React.ComponentType<any>;
const ClockIcon = Clock as React.ComponentType<any>;
const LinkComponent = Link as React.ComponentType<any>;

const HomePage = () => {

  
  const [mostViewedReviews, setMostViewedReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('HomePage useEffect running');
    
    const fetchMostViewedReviews = async () => {
      try {
        setLoading(true);
        console.log('Fetching most viewed reviews...');
        const reviews = await getMostViewedReviewsWeek();
        console.log('Most viewed reviews fetched:', reviews);
        setMostViewedReviews(reviews);
      } catch (error) {
        console.error('Error fetching most viewed reviews:', error);
        setError('Failed to load most viewed reviews');
        // Don't let API errors block the page render
        setMostViewedReviews([]);
      } finally {
        setLoading(false);
      }
    };

    // Fetch the most viewed reviews
    fetchMostViewedReviews();
    
    console.log('HomePage useEffect completed');
  }, []);

  // Retry function for failed requests
  const retryFetch = () => {
    const fetchMostViewedReviews = async () => {
      try {
        setLoading(true);
        const reviews = await getMostViewedReviewsWeek();
        setMostViewedReviews(reviews);
      } catch (error) {
        console.error('Error fetching most viewed reviews:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMostViewedReviews();
  };

  return (
    <div className="min-h-screen">
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* Stats Section */}
      <StatsSection />
      
      {/* How It Works Section */}
      <HowItWorksSection />
      
      {/* Features Section */}
      <FeaturesSection />

            {/* Most Viewed Reviews */}
      <TrendingSection 
        reviews={mostViewedReviews} 
        loading={loading} 
        error={error} 
        onRetry={retryFetch}
      />

      {/* Trust & Safety Section */}
      <TrustSection />

      {/* CTA Section */}
      <CTASection />

      <Footer />
    </div>
  );
};

const HeroSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white min-h-screen overflow-hidden flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative z-10"
          >
            <motion.h1 
              className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Real People.<br />
              <span className="text-orange-500">Real Reviews.</span><br />
              No Bull.
            </motion.h1>
            
            <motion.p 
              className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Discover authentic, unfiltered reviews from real people. Share your honest experiences and help others make better decisions.
            </motion.p>
            
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LinkComponent 
                  to="/submit" 
                  className="bg-orange-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-600 transition-all transform hover:scale-105 inline-flex items-center gap-2"
                >
                  Start Reviewing
                  <ArrowRightIcon className="w-5 h-5" />
                </LinkComponent>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LinkComponent 
                  to="/categories" 
                  className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-gray-900 transition-all inline-flex items-center gap-2"
                >
                  Browse Reviews
                  <EyeIcon className="w-5 h-5" />
                </LinkComponent>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Floating Elements */}
          <motion.div
            className="absolute top-20 left-10 w-20 h-20 bg-orange-500 rounded-full opacity-20"
            initial={{ opacity: 0, scale: 0 }}
            animate={isInView ? { 
              opacity: 0.2, 
              y: [0, -20, 0],
              rotate: [0, 180, 360]
            } : {}}
            transition={{ 
              opacity: { duration: 1, delay: 0.8 },
              y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" }
            }}
          />
          
          <motion.div
            className="absolute bottom-32 right-16 w-16 h-16 bg-blue-500 rounded-full opacity-20"
            initial={{ opacity: 0, scale: 0 }}
            animate={isInView ? { 
              opacity: 0.2, 
              y: [0, 20, 0],
              rotate: [360, 180, 0]
            } : {}}
            transition={{ 
              opacity: { duration: 1, delay: 1 },
              y: { duration: 8, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 8, repeat: Infinity, ease: "easeInOut" }
            }}
          />
        </div>
      </div>
    </section>
  );
};

const StatsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const highlights = [
    { 
      metric: "24/7", 
      label: "Platform Availability", 
      description: "Always online and ready",
      icon: ClockIcon,
      gradient: "from-blue-500 to-blue-700",
      delay: 0
    },
    { 
      metric: "AI", 
      label: "Trust Prediction", 
      description: "Smart reliability scoring",
      icon: SparklesIcon,
      gradient: "from-purple-500 to-purple-700", 
      delay: 0.1
    },
    { 
      metric: "Free", 
      label: "For All Users", 
      description: "No hidden charges",
      icon: StarIcon,
      gradient: "from-green-500 to-green-700",
      delay: 0.2
    },
    { 
      metric: "Secure", 
      label: "Data Protection", 
      description: "Your privacy matters",
      icon: ShieldIcon,
      gradient: "from-red-500 to-red-700",
      delay: 0.3
    }
  ];

  return (
    <section ref={ref} className="py-20 bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <motion.div 
          className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-orange-500 to-red-500 transform -skew-y-6"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={isInView ? { opacity: 0.05, scaleX: 1 } : {}}
          transition={{ duration: 1.2, delay: 0.3 }}
          style={{ transformOrigin: "left" }}
        />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial="hidden"
          animate={controls}
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { 
              opacity: 1, 
              y: 0,
              transition: { duration: 0.6 }
            }
          }}
          className="text-center mb-16"
        >
          <motion.div
            className="inline-block"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent text-sm font-semibold tracking-wide uppercase mb-2 block">
              Platform Excellence
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why We're Different
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience cutting-edge technology designed for transparency, security, and user satisfaction
            </p>
          </motion.div>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {highlights.map((highlight, index) => {
            const Icon = highlight.icon;
            return (
              <motion.div
                key={index}
                initial="hidden"
                animate={controls}
                variants={{
                  hidden: { opacity: 0, y: 50, rotateX: -15 },
                  visible: { 
                    opacity: 1, 
                    y: 0,
                    rotateX: 0,
                    transition: { 
                      duration: 0.6,
                      delay: highlight.delay
                    }
                  }
                }}
                whileHover={{ 
                  y: -8, 
                  rotateX: 5,
                  transition: { duration: 0.2 }
                }}
                className="group perspective-1000"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 relative overflow-hidden">
                  {/* Background Gradient */}
                  <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${highlight.gradient} opacity-10 rounded-full transform translate-x-6 -translate-y-6 group-hover:scale-150 transition-transform duration-500`}></div>
                  
                  {/* Icon */}
                  <motion.div
                    className={`w-16 h-16 bg-gradient-to-br ${highlight.gradient} rounded-xl flex items-center justify-center mb-6 relative z-10`}
                    whileHover={{ rotateY: 180 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </motion.div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="text-3xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                      {highlight.metric}
                    </div>
                    <div className="text-lg font-semibold text-gray-700 mb-3">
                      {highlight.label}
                    </div>
                    <div className="text-gray-600 text-sm leading-relaxed">
                      {highlight.description}
                    </div>
                  </div>
                  
                  {/* Bottom accent */}
                  <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${highlight.gradient} w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const HowItWorksSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const steps = [
    {
      number: "01",
      title: "Share Your Experience",
      description: "Write honest reviews about products, services, or experiences. Upload photos and videos to make your review more impactful.",
      icon: MessageSquareIcon,
      color: "from-blue-400 to-blue-600",
      glowColor: "blue-400",
      delay: 0.2
    },
    {
      number: "02", 
      title: "Community Engagement",
      description: "Get upvotes from the community, engage in discussions, and build your reputation as a trusted reviewer.",
      icon: UsersIcon,
      color: "from-emerald-400 to-emerald-600",
      glowColor: "emerald-400",
      delay: 0.4
    },
    {
      number: "03",
      title: "Make an Impact",
      description: "Help others make informed decisions while earning recognition for your valuable contributions to the community.",
      icon: AwardIcon,
      color: "from-orange-400 to-orange-600",
      glowColor: "orange-400",
      delay: 0.6
    }
  ];

  return (
    <section ref={ref} className="relative py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? {
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          } : {}}
          transition={{
            opacity: { duration: 1, delay: 0.3 },
            scale: { duration: 8, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 8, repeat: Infinity, ease: "easeInOut" }
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl"
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? {
            opacity: [0.4, 0.2, 0.4],
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0]
          } : {}}
          transition={{
            opacity: { duration: 1, delay: 0.5 },
            scale: { duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 },
            rotate: { duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? {
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.3, 1]
          } : {}}
          transition={{
            opacity: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 4 },
            scale: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 4 }
          }}
        />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            initial={{ opacity: 0, y: 0 }}
            animate={isInView ? {
              opacity: [0, 1, 0],
              y: [0, -100, 0],
            } : {}}
            transition={{
              opacity: { duration: Math.random() * 3 + 2, repeat: Infinity, delay: 0.8 + (i * 0.05), ease: "easeInOut" },
              y: { duration: Math.random() * 3 + 2, repeat: Infinity, delay: 0.8 + (i * 0.05), ease: "easeInOut" }
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={isInView ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-block"
          >
            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold tracking-wider uppercase mb-3 inline-block">
              Process Overview
            </span>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              How <span className="text-white">Truviews</span> Works
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Transform your experiences into powerful insights through our streamlined three-step process
            </p>
          </motion.div>
        </motion.div>

        {/* Timeline Container */}
        <div className="relative mb-32">
          {/* Vertical Timeline Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 hidden lg:block">
            <motion.div
              className="h-full bg-gradient-to-b from-blue-400 via-emerald-400 to-orange-400 rounded-full shadow-lg"
              initial={{ scaleY: 0 }}
              animate={isInView ? { scaleY: 1 } : {}}
              transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
              style={{ transformOrigin: "top" }}
            />
            {/* Animated glow effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-blue-400 via-emerald-400 to-orange-400 rounded-full blur-sm opacity-50"
              initial={{ scaleY: 0 }}
              animate={isInView ? { scaleY: 1 } : {}}
              transition={{ duration: 2, delay: 0.7, ease: "easeOut" }}
              style={{ transformOrigin: "top" }}
            />
          </div>

          {/* Timeline Steps */}
          <div className="space-y-32">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: isEven ? -100 : 100, y: 50 }}
                  animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
                  transition={{ 
                    duration: 0.8, 
                    delay: step.delay,
                    type: "spring",
                    stiffness: 100
                  }}
                  className={`relative flex items-center ${
                    isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  } flex-col lg:justify-between`}
                >
                  {/* Content Card */}
                  <motion.div
                    className={`lg:w-5/12 w-full ${isEven ? 'lg:pr-16' : 'lg:pl-16'}`}
                  >
                    <div className="relative group">
                      {/* Card Background with Glow */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-20 rounded-3xl blur-xl group-hover:opacity-30 transition-opacity duration-500`} />
                      
                      <div className={`relative bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/20 transition-all duration-500 group ${
                        step.color === 'from-blue-400 to-blue-600' ? 'hover:border-blue-400/50' :
                        step.color === 'from-emerald-400 to-emerald-600' ? 'hover:border-emerald-400/50' :
                        'hover:border-orange-400/50'
                      }`}>
                        {/* Step Number Badge */}
                        <div className={`absolute -top-4 ${isEven ? '-right-4' : '-left-4'} w-12 h-12 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-lg transition-all duration-700 group-hover:scale-110 group-hover:[transform:perspective(1000px)_rotateY(360deg)]`} 
                             style={{ 
                               transformStyle: 'preserve-3d'
                             }}
                        >
                          <span className="text-white font-bold text-lg">{step.number}</span>
                        </div>

                        {/* Content */}
                        <div className="space-y-4">
                          <motion.h3
                            className={`text-2xl lg:text-3xl font-bold text-white transition-all duration-500 ${
                              step.color === 'from-blue-400 to-blue-600' ? 'group-hover:text-blue-400' :
                              step.color === 'from-emerald-400 to-emerald-600' ? 'group-hover:text-emerald-400' :
                              'group-hover:text-orange-400'
                            }`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: step.delay + 0.2 }}
                          >
                            {step.title}
                          </motion.h3>
                          
                          <motion.p
                            className="text-gray-300 leading-relaxed text-lg"
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: step.delay + 0.4 }}
                          >
                            {step.description}
                          </motion.p>
                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-3xl pointer-events-none">
                          <div className={`absolute -top-10 -right-10 w-20 h-20 bg-${step.glowColor}/20 rounded-full blur-xl`} />
                          <div className={`absolute -bottom-10 -left-10 w-16 h-16 bg-${step.glowColor}/15 rounded-full blur-lg`} />
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Center Icon */}
                  <motion.div
                    className="lg:absolute lg:left-1/2 lg:transform lg:-translate-x-1/2 my-8 lg:my-0 z-10"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={isInView ? { scale: 1, rotate: 0 } : {}}
                    transition={{ 
                      duration: 0.8, 
                      delay: step.delay + 0.3,
                      type: "spring",
                      stiffness: 200
                    }}
                    whileHover={{ 
                      scale: 1.2, 
                      rotate: [0, -10, 10, -10, 0],
                      transition: { duration: 0.5 }
                    }}
                  >
                    <div className="relative">
                      {/* Outer Glow Ring */}
                      <motion.div
                        className={`absolute inset-0 w-24 h-24 bg-gradient-to-br ${step.color} rounded-full blur-lg opacity-50`}
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 0.8, 0.5]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      
                      {/* Main Icon Container */}
                      <div className={`relative w-24 h-24 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center shadow-2xl border-4 border-white/20`}>
                        <Icon className="w-12 h-12 text-white" />
                        
                        {/* Inner Sparkle Effect */}
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          animate={{
                            background: [
                              "radial-gradient(circle at 30% 30%, white 0%, transparent 50%)",
                              "radial-gradient(circle at 70% 70%, white 0%, transparent 50%)",
                              "radial-gradient(circle at 30% 30%, white 0%, transparent 50%)"
                            ]
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>


      </div>
    </section>
  );
};

const FeaturesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const features = [
    {
      icon: ShieldIcon,
      title: "Verified Reviews",
      description: "Every review is verified to ensure authenticity and prevent fake content.",
      color: "from-blue-500 to-indigo-600",
      pattern: "bg-blue-50",
      number: "01"
    },
    {
      icon: UsersIcon,
      title: "Real Community", 
      description: "Join a community of honest reviewers sharing genuine experiences.",
      color: "from-emerald-500 to-teal-600",
      pattern: "bg-emerald-50",
      number: "02"
    },
    {
      icon: TrendingUpIcon,
      title: "Trending Insights",
      description: "Discover what's trending and make informed decisions based on community feedback.",
      color: "from-orange-500 to-red-600",
      pattern: "bg-orange-50",
      number: "03"
    }
  ];

  return (
    <section ref={ref} className="py-24 bg-white relative overflow-hidden">
      {/* Decorative Elements */}
      <motion.div 
        className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-orange-100 to-red-100 rounded-full opacity-30 transform -translate-x-1/2 -translate-y-1/2"
        initial={{ opacity: 0, scale: 0 }}
        animate={isInView ? { opacity: 0.3, scale: 1 } : {}}
        transition={{ duration: 1, delay: 0.2 }}
      />
      <motion.div 
        className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-100 to-purple-100 rounded-full opacity-30 transform translate-x-1/2 translate-y-1/2"
        initial={{ opacity: 0, scale: 0 }}
        animate={isInView ? { opacity: 0.3, scale: 1 } : {}}
        transition={{ duration: 1, delay: 0.4 }}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
            className="inline-block"
          >
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent text-sm font-semibold tracking-wider uppercase mb-3 block">
              Our Advantages
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose Truviews?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We believe in transparency, authenticity, and the power of honest feedback that drives meaningful change.
            </p>
          </motion.div>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50, rotateX: -15 }}
                animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                whileHover={{ 
                  rotateX: 8, 
                  y: -12,
                  transition: { duration: 0.3 }
                }}
                className="group perspective-1000"
              >
                <div className={`relative bg-white rounded-3xl p-8 lg:p-10 shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 ${feature.pattern} bg-opacity-30`}>
                  {/* Number Badge */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-sm">{feature.number}</span>
                  </div>
                  
                  {/* Icon Container */}
                  <motion.div
                    className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-8 relative`}
                    whileHover={{ 
                      rotateX: 15,
                      rotateY: 15,
                      scale: 1.1
                    }}
                    transition={{ duration: 0.4 }}
                  >
                    <Icon className="w-10 h-10 text-white" />
                    
                    {/* Floating dots */}
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-white rounded-full opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-white rounded-full opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  </motion.div>
                  
                  {/* Content */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-orange-600 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    {feature.description}
                  </p>
                  
                  {/* Bottom gradient line */}
                  <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${feature.color} w-full rounded-b-3xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}></div>
                  
                  {/* Subtle pattern overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white opacity-5 rounded-3xl"></div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const TrendingSection = ({ reviews, loading, error, onRetry }: any) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  // Limit reviews to 3 cards maximum (most viewed in past week)
  const displayedReviews = reviews.slice(0, 3);

  return (
    <section ref={ref} className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4"
        >
          <div>
            <motion.h2 
              className="text-4xl font-bold text-gray-900 mb-2"
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Most Viewed Reviews
            </motion.h2>
            <motion.p 
              className="text-gray-600"
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Top 3 most viewed reviews in the past 7 days
            </motion.p>
          </div>
          {/* Desktop View All Button */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <LinkComponent 
              to="/discover" 
              className="hidden md:flex text-orange-500 hover:text-orange-600 font-semibold items-center gap-2 group"
            >
              View All 
              <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </LinkComponent>
          </motion.div>
        </motion.div>
        
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className="bg-white p-6 rounded-lg shadow-sm animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </motion.div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">{error}</p>
            <button 
              onClick={onRetry}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
            >
              Retry
            </button>
          </div>
        ) : displayedReviews.length > 0 ? (
          <>
            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {displayedReviews.map((review: any, index: number) => (
                <motion.div
                  key={review._id}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ 
                    y: -5, 
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                >
                  <ReviewCard review={review} />
                </motion.div>
              ))}
            </motion.div>
            {/* Mobile View All Button */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex justify-center mt-8 md:hidden"
            >
              <LinkComponent 
                to="/discover" 
                className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold flex items-center gap-2 group"
              >
                View All Reviews
                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </LinkComponent>
            </motion.div>
          </>
        ) : (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <p className="text-gray-500 text-lg">No trending reviews yet. Be the first to share your experience!</p>
            <LinkComponent 
              to="/submit" 
              className="inline-block mt-4 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Write a Review
            </LinkComponent>
          </motion.div>
        )}
      </div>
    </section>
  );
};

const TrustSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const trustFeatures = [
    { 
      icon: CheckCircleIcon, 
      title: "Verified Reviews", 
      description: "Every review goes through our verification process", 
      color: "from-green-400 to-emerald-600",
      accent: "bg-green-500",
      stats: "99.9%"
    },
    { 
      icon: ShieldIcon, 
      title: "Anti-Spam Protection", 
      description: "Advanced algorithms detect and prevent fake reviews", 
      color: "from-blue-400 to-blue-600",
      accent: "bg-blue-500",
      stats: "24/7"
    },
    { 
      icon: ZapIcon, 
      title: "Real-time Moderation", 
      description: "24/7 monitoring ensures quality content standards", 
      color: "from-purple-400 to-purple-600",
      accent: "bg-purple-500",
      stats: "Instant"
    },
    { 
      icon: GlobeIcon, 
      title: "Global Community", 
      description: "Diverse perspectives from reviewers worldwide", 
      color: "from-orange-400 to-red-600",
      accent: "bg-orange-500",
      stats: "Global"
    }
  ];

  return (
    <section ref={ref} className="py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? { 
            opacity: 1, 
            scale: 1
          } : {}}
          transition={{ duration: 1, delay: 0.3 }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-full blur-3xl"
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? { 
            opacity: 1, 
            scale: 1
          } : {}}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent text-sm font-semibold tracking-wider uppercase mb-3 block">
              Security & Trust
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Built on Trust & Transparency
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              We maintain the highest standards to ensure authentic, reliable reviews through cutting-edge technology
            </p>
          </motion.div>
        </motion.div>
        
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">
          {trustFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50, rotateX: -20 }}
                animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.15 }}
                whileHover={{ 
                  rotateX: 10,
                  y: -8,
                  transition: { duration: 0.3 }
                }}
                className="group perspective-1000"
              >
                <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-6 lg:p-8 border border-white/10 hover:border-white/20 transition-all duration-500 hover:bg-white/10">
                  {/* Stats Badge */}
                  <div className="absolute -top-3 -right-3 px-3 py-1 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm rounded-full border border-white/20">
                    <span className="text-xs font-bold text-white">{feature.stats}</span>
                  </div>
                  
                  {/* Icon with animated background */}
                  <motion.div
                    className="relative mb-6"
                    whileHover={{ 
                      rotateX: 20,
                      rotateY: 10,
                      scale: 1.05
                    }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center relative overflow-hidden`}>
                      <Icon className="w-8 h-8 text-white relative z-10" />
                      
                      {/* Animated gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-x-full group-hover:translate-x-0"></div>
                    </div>
                    
                    {/* Floating elements */}
                    <div className={`absolute -top-1 -right-1 w-3 h-3 ${feature.accent} rounded-full opacity-60 group-hover:opacity-100 transition-opacity`}></div>
                    <div className={`absolute -bottom-1 -left-1 w-2 h-2 ${feature.accent} rounded-full opacity-40 group-hover:opacity-80 transition-opacity`}></div>
                  </motion.div>
                  
                  {/* Content */}
                  <h3 className="text-lg font-bold text-white mb-3 group-hover:text-orange-300 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed group-hover:text-gray-200 transition-colors">
                    {feature.description}
                  </p>
                  
                  {/* Bottom accent line */}
                  <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r ${feature.color} w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-b-2xl`}></div>
                  
                  {/* Hover glow effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-2xl`}></div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-16"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <LinkComponent to="/categories" className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-shadow inline-block">
              Experience Trusted Reviews
            </LinkComponent>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const CTASection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="py-20 bg-gradient-to-r from-orange-500 to-red-500 relative overflow-hidden">
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-10 left-10 w-32 h-32 bg-white opacity-10 rounded-full"
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? { 
            opacity: 0.1, 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          } : {}}
          transition={{ 
            opacity: { duration: 1, delay: 0.3 },
            scale: { duration: 8, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 8, repeat: Infinity, ease: "easeInOut" }
          }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-24 h-24 bg-white opacity-10 rounded-full"
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? { 
            opacity: 0.1, 
            scale: [1.2, 1, 1.2],
            y: [0, -20, 0]
          } : {}}
          transition={{ 
            opacity: { duration: 1, delay: 0.5 },
            scale: { duration: 6, repeat: Infinity, ease: "easeInOut" },
            y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
          }}
        />
      </div>
      
      <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, scale: 0 }}
            animate={isInView ? { 
              opacity: 1, 
              scale: 1,
              rotate: [0, 10, -10, 0]
            } : {}}
            transition={{ 
              opacity: { duration: 0.8, delay: 0.2 },
              scale: { duration: 0.6, delay: 0.2 },
              rotate: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <SparklesIcon className="w-16 h-16 text-white mx-auto" />
          </motion.div>
          
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Ready to Share Your Experience?
          </motion.h2>
          <motion.p 
            className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Join thousands of users sharing honest, authentic reviews that help others make better decisions.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LinkComponent 
              to="/submit" 
              className="bg-white text-orange-500 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 inline-flex items-center gap-2 shadow-lg"
            >
              Write Your Review
              <ArrowRightIcon className="w-5 h-5" />
            </LinkComponent>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HomePage;