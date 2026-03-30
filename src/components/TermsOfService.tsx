import React from 'react';

export default function TermsOfService() {
  return (
    <div className='max-w-2xl mx-auto py-12 px-4'>
      <h1 className='text-3xl font-bold mb-4'>Terms of Service</h1>
      <p className='mb-2 text-gray-700'>
        These are the terms of service for Spot On Shelves. By using this
        application, you agree to the following terms:
      </p>
      <ul className='list-disc ml-6 text-gray-700 mb-4'>
        <li>This app is provided as-is, without warranty of any kind.</li>
        <li>
          All data is stored locally in your browser unless you export it.
        </li>
        <li>No personal data is collected or shared by the developer.</li>
        <li>
          Use this app at your own risk. Always follow safety guidelines for
          installations.
        </li>
        <li>
          The developer is not responsible for any damages or losses resulting
          from use.
        </li>
      </ul>
      <p className='text-gray-500 text-xs mt-8'>
        For questions, contact the developer via GitHub or LinkedIn (see
        footer).
      </p>
    </div>
  );
}
