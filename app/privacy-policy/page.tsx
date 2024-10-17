"use client";

import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="space-y-4">
        <p>Last updated: [Insert Date]</p>
        <p>[Your Company Name] ("us", "we", or "our") operates [Your Website URL] (the "Site"). This page informs you of our policies regarding the collection, use and disclosure of Personal Information we receive from users of the Site.</p>
        <p>We use your Personal Information only for providing and improving the Site. By using the Site, you agree to the collection and use of information in accordance with this policy.</p>
        
        <h2 className="text-2xl font-semibold mt-6 mb-3">Information Collection And Use</h2>
        <p>While using our Site, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you. Personally identifiable information may include, but is not limited to your name ("Personal Information").</p>
        
        {/* Add more sections as needed */}
        
      </div>
      <div className="mt-8">
        <Link href="/" className="text-blue-500 hover:underline">Back to Home</Link>
      </div>
    </div>
  );
}