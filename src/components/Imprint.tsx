import React from 'react';

export default function Imprint() {
  return (
    <div className='max-w-2xl mx-auto py-12 px-4'>
      <h1 className='text-3xl font-bold mb-4'>Imprint</h1>
      <p className='mb-2 text-gray-700'>
        This application is developed and maintained by Jan Horak.
      </p>
      <ul className='list-disc ml-6 text-gray-700 mb-4'>
        <li>Developer: Jan Horak</li>
        <li>
          Contact:{' '}
          <a
            href='https://github.com/MrJanHorak'
            className='underline text-blue-600'
            target='_blank'
            rel='noopener noreferrer'
          >
            GitHub
          </a>{' '}
          |{' '}
          <a
            href='https://www.linkedin.com/in/jan-horak/'
            className='underline text-blue-600'
            target='_blank'
            rel='noopener noreferrer'
          >
            LinkedIn
          </a>
        </li>
        <li>Location: Czech Republic</li>
      </ul>
      <p className='text-gray-500 text-xs mt-8'>
        This is a personal project. For legal or privacy inquiries, contact via
        the links above.
      </p>
    </div>
  );
}
