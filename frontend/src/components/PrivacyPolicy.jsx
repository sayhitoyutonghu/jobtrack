import React from 'react';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-[#f0f0f0] font-mono p-8 text-black">
            <div className="max-w-2xl mx-auto bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h1 className="text-3xl font-bold uppercase mb-6 border-b-4 border-black inline-block">
                    Privacy Policy
                </h1>

                <div className="space-y-4 text-sm">
                    <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>

                    <h2 className="text-xl font-bold uppercase mt-6">1. Introduction</h2>
                    <p>
                        JobTrack ("we", "our", or "us") is a personal portfolio project designed to demonstrate full-stack engineering capabilities. This Privacy Policy explains how we handle your data when you use our application.
                    </p>

                    <h2 className="text-xl font-bold uppercase mt-6">2. Data We Collect</h2>
                    <p>
                        We adhere to the principle of minimalism. We only access the data necessary for the application's core functionality:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Google User Data:</strong> When you sign in with Google, we receive your email address and basic profile information to identify you.</li>
                        <li><strong>Gmail Data:</strong> With your explicit permission, we scan your emails solely to identify job application statuses (e.g., "Applied", "Interview", "Offer"). We do <span className="underline font-bold">NOT</span> store the content of your emails permanently. We only store the extracted metadata (Company Name, Job Title, Status).</li>
                    </ul>

                    <h2 className="text-xl font-bold uppercase mt-6">3. How We Use Your Data</h2>
                    <p>
                        Your data is used exclusively to populate your personal JobTrack dashboard. We do not share, sell, or disclose your data to any third parties or advertisers.
                    </p>

                    <h2 className="text-xl font-bold uppercase mt-6">4. Data Deletion</h2>
                    <p>
                        This is a demo application. You can request full data deletion by contacting the developer or simply by revoking the app's access in your Google Account settings.
                    </p>

                    <div className="mt-8 pt-4 border-t-2 border-gray-200">
                        <a href="/" className="bg-black text-white px-4 py-2 font-bold hover:bg-green-500 hover:text-black transition-colors">
                            &lt; BACK TO DASHBOARD
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
