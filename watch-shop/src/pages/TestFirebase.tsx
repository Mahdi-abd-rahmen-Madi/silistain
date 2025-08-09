import { Link } from 'react-router-dom';
import FirebaseTest from '../components/FirebaseTest';

export default function TestFirebase() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
          >
            <svg 
              className="h-5 w-5 mr-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10 19l-7-7m0 0l7-7m-7 7h18" 
              />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Firebase Test Page</h1>
          <p className="mt-2 text-gray-600">
            This page helps verify that your Firebase setup is working correctly.
          </p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <FirebaseTest />
        </div>
      </div>
    </div>
  );
}
