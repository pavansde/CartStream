import React from "react";

export default function ErrorState({ onRetry, message }) {
  return (
    <div className="min-h-max w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="text-center w-full max-w-md">

        {/* Illustration with subtle enhancements */}
        <div className="mx-auto mb-10">
          <div className="relative inline-block">
            <img
              src="/images/error-illustration1.svg"
              alt="Error illustration"
              className="mx-auto w-56 h-56 object-contain drop-shadow-sm"
              onError={(e) => {
                // Fallback if image fails to load
                e.target.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'w-56 h-56 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center';
                fallback.innerHTML = `
                <svg class="w-24 h-24 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
              `;
                e.target.parentNode.appendChild(fallback);
              }}
            />
            {/* Subtle floating animation */}
            <div className="absolute inset-0 animate-float">
              <div className="w-full h-full bg-blue-200/10 rounded-full blur-xl"></div>
            </div>
          </div>
        </div>

        {/* Content with improved typography and spacing */}
        <div className="space-y-6 mb-10">
          {/* Heading with gradient text */}
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-4 tracking-tight">
              Oops! Something went wrong
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
          </div>

          {/* Message with better readability */}
          <div className="space-y-3">
            <p className="text-lg text-slate-600 leading-relaxed font-medium">
              We're working on fixing it and will be back soon.
            </p>
            <p className="text-base text-slate-500 leading-relaxed">
              Please try again in a little while.
            </p>
          </div>
        </div>

        {/* Enhanced buttons with better visual hierarchy */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            onClick={onRetry}
            className="group relative px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-blue-200 focus:ring-offset-2"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          <button
            onClick={() => (window.location.href = "/")}
            className="group px-10 py-4 border-2 border-slate-300 text-slate-700 rounded-xl hover:border-slate-400 hover:bg-white transition-all duration-300 font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-slate-200 focus:ring-offset-2"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back to Home
            </span>
          </button>
        </div>



        {/* Reference ID for support */}
        <div className="mt-8 text-xs text-slate-400 font-mono">
          Ref: {Date.now().toString(36).toUpperCase()}
        </div>
      </div>
    </div>
  );
}