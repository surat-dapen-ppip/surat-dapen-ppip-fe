import { useState } from 'react';
import Link from 'next/link';

const SidebarDropdown = ({ options, title, onItemClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = () => {
    setIsOpen(false);
    if (onItemClick) {
      onItemClick();
    }
  };

  return (
    <div className="w-full">
      {/* Dropdown Header */}
      <div
        onClick={toggleDropdown}
        className="flex items-center justify-between w-full py-3 pl-4 md:pl-6 cursor-pointer hover:bg-gray-50"
      >
        <div className="flex items-center">
          {title}
        </div>
        <div className="mr-6">
          <svg
            className={`h-5 w-5 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* Dropdown Items */}
      {isOpen && (
        <div className="bg-gray-50">
          {options.map((option, index) => (
            !option.hidden && (
              <Link 
                key={index}
                href={option.href || '#'}
                onClick={handleItemClick}
                className="block ml-14 py-3 text-sm text-gray-700 hover:bg-gray-100"
              >
                {option.label}
              </Link>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default SidebarDropdown;
