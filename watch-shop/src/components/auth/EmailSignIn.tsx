import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface EmailSignInProps {
  onClose: () => void;
  onSwitchToSignUp: () => void;
}

export default function EmailSignIn({ onClose, onSwitchToSignUp }: EmailSignInProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<{text: string; isError: boolean} | null>(null);
  const { signInWithMagicLink, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    if (!email) {
      setMessage({ text: 'Please enter your email', isError: true });
      return;
    }

    const { error } = await signInWithMagicLink(email);
    
    if (error) {
      setMessage({ 
        text: error.message || 'Failed to send magic link. Please try again.', 
        isError: true 
      });
    } else {
      setMessage({ 
        text: 'Check your email for the magic link to sign in!', 
        isError: false 
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-center">Sign in with Email</h2>
        
        {message && (
          <div 
            className={`p-3 mb-4 rounded-md ${
              message.isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}
          >
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending magic link...' : 'Send Magic Link'}
            </button>
          </div>
        </form>
        
        <div className="mt-4 text-center text-sm">
          <span className="text-gray-600">Don't have an account? </span>
          <button
            onClick={onSwitchToSignUp}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}
