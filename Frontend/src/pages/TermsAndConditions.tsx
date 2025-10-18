import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, CheckCircle, AlertCircle, Scale, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { updateMetaTags } from '../utils/seo';

const TermsAndConditions = () => {
  useEffect(() => {
    // Update SEO meta tags
    updateMetaTags({
      title: 'Terms & Conditions - TruView',
      description: 'Read the Terms and Conditions for using TruView, the authentic reviews and ratings platform. Learn about user rights, responsibilities, and platform guidelines.',
      keywords: 'terms and conditions, user agreement, terms of service, TruView terms, legal agreement',
      canonical: `${window.location.origin}/terms`
    });
  }, []);

  const sections = [
    {
      icon: FileText,
      title: '1. Acceptance of Terms',
      content: [
        'By accessing and using TruView ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement.',
        'If you do not agree to abide by these Terms and Conditions, please do not use this Platform.',
        'These Terms apply to all users of the Platform, including browsers, vendors, customers, merchants, and/or contributors of content.',
      ]
    },
    {
      icon: CheckCircle,
      title: '2. User Accounts',
      content: [
        'You must be at least 18 years old to create an account on TruView.',
        'You are responsible for maintaining the confidentiality of your account credentials.',
        'You agree to provide accurate, current, and complete information during registration.',
        'You are responsible for all activities that occur under your account.',
        'We reserve the right to suspend or terminate accounts that violate these terms.',
      ]
    },
    {
      icon: Shield,
      title: '3. Review Guidelines',
      content: [
        '<strong>Authentic Reviews:</strong> All reviews must be based on genuine personal experiences.',
        '<strong>No False Information:</strong> Reviews containing false, misleading, or defamatory content will be removed.',
        '<strong>Appropriate Language:</strong> Use respectful language. Hate speech, profanity, and discriminatory content are prohibited.',
        '<strong>No Spam:</strong> Promotional content, advertisements, or irrelevant information is not allowed.',
        '<strong>Privacy:</strong> Do not share personal information of others without consent.',
        '<strong>Original Content:</strong> Submit only your own original content. Plagiarism is prohibited.',
      ]
    },
    {
      icon: Scale,
      title: '4. Intellectual Property',
      content: [
        'All content on TruView, including text, graphics, logos, and images, is the property of TruView or its content suppliers.',
        'Users retain ownership of their reviews and uploaded content.',
        'By submitting content, you grant TruView a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content on the Platform.',
        'You may not reproduce, distribute, or create derivative works from any content on TruView without explicit permission.',
      ]
    },
    {
      icon: AlertCircle,
      title: '5. Prohibited Activities',
      content: [
        'Posting fake reviews or reviews for products/services you haven\'t experienced.',
        'Manipulating ratings or trust scores.',
        'Attempting to gain unauthorized access to the Platform or other users\' accounts.',
        'Uploading viruses, malware, or any malicious code.',
        'Harassing, threatening, or intimidating other users.',
        'Using automated systems or bots to scrape data from the Platform.',
        'Impersonating others or providing false identity information.',
      ]
    },
    {
      icon: FileText,
      title: '6. Content Moderation',
      content: [
        'TruView reserves the right to review, edit, or remove any content that violates these Terms.',
        'We employ automated and manual moderation systems to maintain content quality.',
        'Content removal decisions are final and at TruView\'s sole discretion.',
        'Repeat violations may result in account suspension or permanent ban.',
      ]
    },
    {
      icon: Shield,
      title: '7. Privacy and Data Protection',
      content: [
        'Your use of TruView is also governed by our Privacy Policy.',
        'We collect and process personal data as described in our Privacy Policy.',
        'You consent to the collection, use, and sharing of your information as outlined in our Privacy Policy.',
        'We implement security measures to protect your data, but cannot guarantee absolute security.',
      ]
    },
    {
      icon: CheckCircle,
      title: '8. Disclaimer of Warranties',
      content: [
        'TruView is provided "as is" and "as available" without warranties of any kind.',
        'We do not guarantee the accuracy, completeness, or reliability of user-generated content.',
        'We are not responsible for the quality of products or services reviewed on the Platform.',
        'Use of the Platform is at your own risk.',
      ]
    },
    {
      icon: Scale,
      title: '9. Limitation of Liability',
      content: [
        'TruView shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from your use of the Platform.',
        'This includes, but is not limited to, damages for loss of profits, data, or other intangible losses.',
        'Our liability is limited to the maximum extent permitted by applicable law.',
      ]
    },
    {
      icon: FileText,
      title: '10. Indemnification',
      content: [
        'You agree to indemnify and hold harmless TruView and its affiliates from any claims, losses, damages, or expenses arising from:',
        '• Your violation of these Terms and Conditions',
        '• Your violation of any rights of another person or entity',
        '• Your use of the Platform',
      ]
    },
    {
      icon: AlertCircle,
      title: '11. Third-Party Links',
      content: [
        'TruView may contain links to third-party websites or services.',
        'We are not responsible for the content, accuracy, or practices of third-party websites.',
        'Your interactions with third-party websites are governed by their terms and policies.',
      ]
    },
    {
      icon: Shield,
      title: '12. Modifications to Terms',
      content: [
        'TruView reserves the right to modify these Terms at any time.',
        'Changes will be effective immediately upon posting to the Platform.',
        'Your continued use of the Platform after changes constitute acceptance of the modified Terms.',
        'We will notify users of significant changes via email or platform notifications.',
      ]
    },
    {
      icon: Scale,
      title: '13. Termination',
      content: [
        'We may terminate or suspend your account and access to the Platform immediately, without prior notice, for conduct that we believe violates these Terms.',
        'You may terminate your account at any time by contacting us.',
        'Upon termination, all licenses granted to you will terminate immediately.',
        'Sections that by their nature should survive termination will survive (including intellectual property provisions, disclaimers, and limitations of liability).',
      ]
    },
    {
      icon: FileText,
      title: '14. Governing Law',
      content: [
        'These Terms shall be governed by and construed in accordance with the laws of India.',
        'Any disputes arising from these Terms or your use of the Platform shall be subject to the exclusive jurisdiction of the courts in [Your City], India.',
      ]
    },
    {
      icon: CheckCircle,
      title: '15. Contact Information',
      content: [
        'If you have any questions about these Terms and Conditions, please contact us at:',
        '<strong>Email:</strong> legal@truviews.in',
        '<strong>Support:</strong> support@truviews.in',
        '<strong>Website:</strong> www.truviews.in',
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-16 px-4"
      >
        <div className="max-w-4xl mx-auto text-center">
          <Scale className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms & Conditions</h1>
          <p className="text-xl opacity-95">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <p className="mt-4 text-lg opacity-90">
            Please read these terms and conditions carefully before using TruView
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to TruView</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            These Terms and Conditions ("Terms") govern your access to and use of TruView, including any content, functionality, and services offered on or through www.truviews.in (the "Platform").
          </p>
          <p className="text-gray-700 leading-relaxed">
            By using TruView, you agree to these Terms. If you disagree with any part of these Terms, you may not access the Platform.
          </p>
        </motion.div>

        {/* Terms Sections */}
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
                <section.icon className="w-8 h-8 text-orange-500" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">{section.title}</h2>
            </div>
            <div className="space-y-3 text-gray-700 leading-relaxed ml-12">
              {section.content.map((paragraph, idx) => (
                <p key={idx} dangerouslySetInnerHTML={{ __html: paragraph }} />
              ))}
            </div>
          </motion.div>
        ))}

        {/* Agreement Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6 md:p-8 mb-8"
        >
          <h2 className="text-xl font-bold text-orange-900 mb-4 flex items-center">
            <CheckCircle className="w-6 h-6 mr-2" />
            Your Agreement
          </h2>
          <p className="text-orange-900 leading-relaxed mb-4">
            By creating an account or using TruView, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
          </p>
          <p className="text-orange-900 leading-relaxed">
            For questions or concerns about these Terms, please contact us at <a href="mailto:legal@truviews.in" className="font-semibold underline">legal@truviews.in</a>
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
            to="/privacy"
            className="px-6 py-3 bg-white border-2 border-orange-500 text-orange-500 rounded-lg font-semibold hover:bg-orange-50 transition-colors text-center"
          >
            Read Privacy Policy
          </Link>
          <Link
            to="/"
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-colors text-center"
          >
            Back to Home
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsAndConditions;

