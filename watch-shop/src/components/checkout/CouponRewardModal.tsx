import React from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { generateAndSaveCoupon } from '../../services/api/couponService';
import { jsPDF } from 'jspdf';
import { useAuth } from '../../context/AuthContext';

interface CouponRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderTotal: number;
  orderId: string;
  customerEmail: string;
}

export const CouponRewardModal: React.FC<CouponRewardModalProps> = ({
  isOpen,
  onClose,
  orderTotal,
  orderId,
  customerEmail,
}) => {
  const { t, i18n } = useTranslation();
  const { currentUser } = useAuth();
  const [couponCode, setCouponCode] = React.useState('');
  const [couponValue, setCouponValue] = React.useState(0);
  const [expiryDate, setExpiryDate] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  const generateCoupon = async () => {
    try {
      setIsSaving(true);
      const coupon = await generateAndSaveCoupon(
        orderTotal,
        customerEmail,
        currentUser?.id
      );
      
      setCouponCode(coupon.code);
      setCouponValue(coupon.amount);
      setExpiryDate(new Date(coupon.expires_at).toLocaleDateString());
      
      return true;
    } catch (error) {
      console.error('Failed to generate coupon:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && orderTotal > 120) {
      generateCoupon();
    }
  }, [isOpen, orderTotal, orderId, customerEmail]);

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      // Define colors as const tuples to fix TypeScript errors
      const primaryColor = [180, 83, 9] as const; // amber-700
      const textColor = [42, 42, 42] as const; // gray-800
      const secondaryTextColor = [75, 85, 99] as const; // gray-600
      
      // Set RTL for Arabic
      const isRTL = i18n.language === 'ar';
      if (isRTL) {
        doc.setR2L(true);
      }
      
      // Add logo or title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(t('coupon.title'), 105, 25, { align: 'center' });
      
      // Add coupon code
      doc.setFontSize(32);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(couponCode, 105, 50, { align: 'center' });
      
      // Add coupon value
      doc.setFontSize(16);
      doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
      doc.text(`${t('coupon.value')}: ${couponValue} TND`, 105, 70, { align: 'center' });
      
      // Add expiry date
      doc.setFontSize(12);
      doc.text(`${t('coupon.expires_on')} ${expiryDate}`, 105, 85, { align: 'center' });
      
      // Add how to use section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(t('coupon.how_to_use'), isRTL ? 180 : 20, 110);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
      
      // Add usage instructions
      const usageSteps = [
        t('coupon.usage_1'),
        t('coupon.usage_2'),
        t('coupon.usage_3')
      ];
      
      usageSteps.forEach((step, index) => {
        const yPos = 120 + (index * 8);
        doc.text('•', isRTL ? 175 : 25, yPos);
        doc.text(step, isRTL ? 170 : 30, yPos, { maxWidth: 150 });
      });
      
      // Add terms and conditions
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128); // gray-500
      const termsY = 150;
      doc.text(t('coupon.terms'), 20, termsY, { maxWidth: 170, align: isRTL ? 'right' : 'left' });
      
      // Add watermark
      doc.setFontSize(40);
      doc.setTextColor(229, 231, 235); // gray-200
      doc.setGState(new (doc as any).GState({ opacity: 0.2 }));
      doc.text('SILISTAIN', 105, 150, { angle: 45, align: 'center' });
      
      // Reset graphics state
      doc.setGState(new (doc as any).GState({ opacity: 1 }));
      
      // Add border
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(10, 10, 190, 280);
      
      // Save the PDF with localized filename
      doc.save(`${t('coupon.title')}-${couponCode}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  if (!isOpen || orderTotal <= 120) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t('coupon.congratulations')} 🎉</h2>
          <p className="mb-6 text-gray-700">{t('coupon.reward_message', { value: couponValue })}</p>
          
          <div className="border-2 border-dashed border-amber-400 p-6 rounded-lg mb-6 bg-amber-50">
            <div className="text-3xl font-bold text-amber-700 tracking-wider mb-2">{couponCode}</div>
            <div className="text-lg text-gray-700 font-medium">
              {t('coupon.value')}: <span className="text-green-600">{couponValue} TND</span>
            </div>
            <div className="text-sm text-amber-600 mt-2 font-medium">
              {t('coupon.expires_on')} {expiryDate}
            </div>
          </div>
          
          <div className="flex flex-col space-y-4 mt-6">
            <button
              onClick={handleDownloadPDF}
              disabled={isSaving}
              className={`flex items-center justify-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition-colors shadow-md hover:shadow-lg ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="font-medium">{t('coupon.download_pdf')}</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed py-2 font-medium"
            >
              {t('common.close')}
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t('coupon.how_to_use') || 'How to use your coupon:'}</h4>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li>{t('coupon.usage_1') || 'Copy the coupon code above'}</li>
              <li>{t('coupon.usage_2') || 'Apply it at checkout on your next order'}</li>
              <li>{t('coupon.usage_3') || 'Valid for one-time use only'}</li>
            </ul>
            <p className="text-xs text-gray-500 mt-3">
              {t('coupon.terms')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
