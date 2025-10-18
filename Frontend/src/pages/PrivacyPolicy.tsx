import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, Database, UserCheck, Bell, Globe, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { updateMetaTags } from '../utils/seo';

const PrivacyPolicy = () => {
  useEffect(() => {
    // Update SEO meta tags
    updateMetaTags({
      title: 'Privacy Policy - TruView',
      description: 'Learn how TruView collects, uses, and protects your personal information. Our commitment to your privacy and data security.',
      keywords: 'privacy policy, data protection, user privacy, GDPR, data security, TruView privacy',
      canonical: `${window.location.origin}/privacy`
    });
  }, []);

  const sections = [
    {
      icon: Database,
      title: '1. Information We Collect',
      content: [
        {
          subtitle: 'Personal Information',
          items: [
            '<strong>Account Information:</strong> Name, email address, phone number, and password',
            '<strong>Profile Information:</strong> Bio, profile picture, location (optional)',
            '<strong>Review Content:</strong> Reviews, ratings, comments, images, and videos you upload',
          ]
        },
        {
          subtitle: 'Automatically Collected Information',
          items: [
            '<strong>Usage Data:</strong> Pages visited, time spent, clicks, and interactions',
            '<strong>Device Information:</strong> Browser type, operating system, IP address',
            '<strong>Cookies:</strong> We use cookies to enhance your experience and analyze usage patterns',
          ]
        },
      ]
    },
    {
      icon: Eye,
      title: '2. How We Use Your Information',
      content: [
        {
          subtitle: 'We use your information to:',
          items: [
            'Provide, maintain, and improve our Platform services',
            'Create and manage your user account',
            'Process and display your reviews and ratings',
            'Send you important notifications about your account and Platform updates',
            'Respond to your comments, questions, and customer service requests',
            'Analyze usage patterns to improve user experience',
            'Detect, prevent, and address fraud and security issues',
            'Comply with legal obligations and enforce our Terms and Conditions',
            'Send marketing communications (only with your consent)',
          ]
        },
      ]
    },
    {
      icon: UserCheck,
      title: '3. Information Sharing and Disclosure',
      content: [
        {
          subtitle: 'We may share your information with:',
          items: [
            '<strong>Public Display:</strong> Your reviews, ratings, profile information, and username are publicly visible',
            '<strong>Service Providers:</strong> Third-party vendors who help us operate the Platform (hosting, analytics, email services)',
            '<strong>Legal Requirements:</strong> When required by law, court order, or government regulations',
            '<strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets',
            '<strong>With Your Consent:</strong> When you explicitly agree to share information',
          ]
        },
        {
          subtitle: 'We DO NOT:',
          items: [
            'Sell your personal information to third parties',
            'Share your password or sensitive account details',
            'Use your data for purposes other than those described in this policy',
          ]
        },
      ]
    },
    {
      icon: Lock,
      title: '4. Data Security',
      content: [
        {
          subtitle: 'Security Measures:',
          items: [
            '<strong>Encryption:</strong> We use SSL/TLS encryption to protect data in transit',
            '<strong>Secure Storage:</strong> Passwords are hashed and securely stored',
            '<strong>Access Controls:</strong> Limited employee access to personal data',
            '<strong>Regular Audits:</strong> We conduct security audits and vulnerability assessments',
            '<strong>Monitoring:</strong> Continuous monitoring for suspicious activities',
          ]
        },
        {
          subtitle: '',
          items: [
            'While we implement industry-standard security measures, no system is 100% secure. You are responsible for maintaining the confidentiality of your account credentials.',
          ]
        },
      ]
    },
    {
      icon: Shield,
      title: '5. Your Privacy Rights',
      content: [
        {
          subtitle: 'You have the right to:',
          items: [
            '<strong>Access:</strong> Request a copy of your personal data',
            '<strong>Correction:</strong> Update or correct inaccurate information',
            '<strong>Deletion:</strong> Request deletion of your account and data',
            '<strong>Opt-Out:</strong> Unsubscribe from marketing emails',
            '<strong>Data Portability:</strong> Request your data in a portable format',
            '<strong>Object:</strong> Object to certain data processing activities',
          ]
        },
        {
          subtitle: 'To exercise these rights, contact us at:',
          items: [
            '<strong>Email:</strong> privacy@truviews.in',
            '<strong>Account Settings:</strong> Manage preferences in your account dashboard',
          ]
        },
      ]
    },
    {
      icon: Database,
      title: '6. Cookies and Tracking Technologies',
      content: [
        {
          subtitle: 'Types of Cookies We Use:',
          items: [
            '<strong>Essential Cookies:</strong> Required for Platform functionality (login, sessions)',
            '<strong>Analytics Cookies:</strong> Help us understand how users interact with the Platform',
            '<strong>Preference Cookies:</strong> Remember your settings and preferences',
            '<strong>Marketing Cookies:</strong> Used for targeted advertising (optional)',
          ]
        },
        {
          subtitle: '',
          items: [
            'You can control cookie preferences through your browser settings. Note that disabling cookies may affect Platform functionality.',
          ]
        },
      ]
    },
    {
      icon: Globe,
      title: '7. International Data Transfers',
      content: [
        {
          subtitle: '',
          items: [
            'TruView is based in India, and your information may be stored and processed in India or other countries.',
            'If you access the Platform from outside India, your information may be transferred across borders.',
            'We ensure appropriate safeguards are in place for international data transfers in compliance with applicable data protection laws.',
          ]
        },
      ]
    },
    {
      icon: UserCheck,
      title: '8. Children\'s Privacy',
      content: [
        {
          subtitle: '',
          items: [
            'TruView is not intended for users under the age of 18.',
            'We do not knowingly collect personal information from children under 18.',
            'If we become aware that a child under 18 has provided personal information, we will take steps to delete such information.',
            'If you believe we have collected information from a child, please contact us immediately.',
          ]
        },
      ]
    },
    {
      icon: Bell,
      title: '9. Data Retention',
      content: [
        {
          subtitle: '',
          items: [
            'We retain your personal information for as long as your account is active or as needed to provide services.',
            'After account deletion, we may retain certain information for legal, security, and business purposes.',
            '<strong>Review Content:</strong> May be retained to maintain Platform integrity',
            '<strong>Account Data:</strong> Deleted within 90 days of account deletion request',
            '<strong>Analytics Data:</strong> May be retained in anonymized form',
          ]
        },
      ]
    },
    {
      icon: Mail,
      title: '10. Marketing Communications',
      content: [
        {
          subtitle: '',
          items: [
            'We may send you promotional emails about new features, special offers, and Platform updates.',
            'You can opt out of marketing emails by clicking the "unsubscribe" link in any email.',
            'Even if you opt out of marketing communications, we will still send you important account-related notifications.',
          ]
        },
      ]
    },
    {
      icon: Shield,
      title: '11. Third-Party Services',
      content: [
        {
          subtitle: 'We use third-party services for:',
          items: [
            '<strong>Amazon AWS:</strong> Cloud hosting and storage',
            '<strong>Google Analytics:</strong> Usage analytics (optional)',
            '<strong>Email Services:</strong> Sending transactional emails',
          ]
        },
        {
          subtitle: '',
          items: [
            'These services have their own privacy policies. We recommend reviewing them.',
            'We do not control third-party privacy practices.',
          ]
        },
      ]
    },
    {
      icon: Bell,
      title: '12. Changes to Privacy Policy',
      content: [
        {
          subtitle: '',
          items: [
            'We may update this Privacy Policy from time to time.',
            'Changes will be posted on this page with an updated "Last Updated" date.',
            'Significant changes will be communicated via email or platform notification.',
            'Your continued use of TruView after changes indicates acceptance of the updated policy.',
          ]
        },
      ]
    },
    {
      icon: Lock,
      title: '13. Data Breach Notification',
      content: [
        {
          subtitle: '',
          items: [
            'In the event of a data breach that affects your personal information, we will:',
            '• Notify affected users within 72 hours of discovery',
            '• Provide details about the breach and affected data',
            '• Advise on steps to protect yourself',
            '• Report to relevant authorities as required by law',
          ]
        },
      ]
    },
    {
      icon: Mail,
      title: '14. Contact Us',
      content: [
        {
          subtitle: 'For privacy-related questions or concerns, contact us at:',
          items: [
            '<strong>Privacy Email:</strong> privacy@truviews.in',
            '<strong>General Support:</strong> support@truviews.in',
            '<strong>Data Protection Officer:</strong> dpo@truviews.in',
            '<strong>Address:</strong> [Your Company Address], India',
            '<strong>Response Time:</strong> We aim to respond within 5 business days',
          ]
        },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-16 px-4"
      >
        <div className="max-w-4xl mx-auto text-center">
          <Shield className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-xl opacity-95">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <p className="mt-4 text-lg opacity-90">
            Your privacy is important to us. Learn how we collect, use, and protect your information.
          </p>
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Commitment to Your Privacy</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            At TruView, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Platform.
          </p>
          <p className="text-gray-700 leading-relaxed">
            By using TruView, you consent to the data practices described in this policy. Please read this Privacy Policy carefully.
          </p>
        </motion.div>

        {/* Privacy Sections */}
        {sections.map((section, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-6"
          >
            <div className="flex items-start space-x-4 mb-4">
              <div className="flex-shrink-0">
                <section.icon className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">{section.title}</h2>
            </div>
            <div className="ml-12 space-y-4">
              {section.content.map((subsection, subIdx) => (
                <div key={subIdx}>
                  {subsection.subtitle && (
                    <h3 className="font-semibold text-gray-900 mb-2">{subsection.subtitle}</h3>
                  )}
                  <ul className="space-y-2 text-gray-700 leading-relaxed">
                    {subsection.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        <span dangerouslySetInnerHTML={{ __html: item }} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* GDPR Compliance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 md:p-8 mb-8"
        >
          <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
            <Shield className="w-6 h-6 mr-2" />
            Data Protection Compliance
          </h2>
          <p className="text-blue-900 leading-relaxed mb-4">
            TruView is committed to compliance with applicable data protection laws, including GDPR (General Data Protection Regulation) and India's IT Act.
          </p>
          <p className="text-blue-900 leading-relaxed">
            We implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk of processing your personal data.
          </p>
        </motion.div>

        {/* Navigation Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4"
        >
          <Link
            to="/terms"
            className="px-6 py-3 bg-white border-2 border-blue-500 text-blue-500 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-center"
          >
            Read Terms & Conditions
          </Link>
          <Link
            to="/"
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-colors text-center"
          >
            Back to Home
          </Link>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-lg shadow-md p-6 md:p-8 mt-8 text-center"
        >
          <Mail className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Questions About Your Privacy?</h3>
          <p className="text-gray-700 mb-4">
            We're here to help. Contact our privacy team for any concerns.
          </p>
          <a
            href="mailto:privacy@truviews.in"
            className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Contact Privacy Team
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

