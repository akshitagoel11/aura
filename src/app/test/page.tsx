// src/app/test/page.tsx

import React from 'react';
import TestIntegration from '../../components/TestIntegration';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <style jsx global>{`
        * {
          box-sizing: border-box;
          padding: 0;
          margin: 0;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>

      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                🧠 Aura AI
              </h1>
              <span className="ml-2 text-sm text-gray-500">
                Integration Test
              </span>
            </div>
            <nav className="flex space-x-8">
              <a href="/" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                ← Back to App
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main>
        <TestIntegration />
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2024 Aura AI Productivity Platform. Test Environment.
          </p>
        </div>
      </footer>
    </div>
  );
}
