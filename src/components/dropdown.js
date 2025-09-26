import { useState } from 'react';

const Dropdown = ({ options, title, onItemClick }) => {
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
    <div className="relative inline-block text-left w-full">
      <div>
        <div
          onClick={toggleDropdown}
          type="button"
          className="inline-flex justify-center w-full bg-white cursor-pointer"
        >
          {title}
          <svg
            className="-mr-1 ml-2 h-5 w-5"
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

      {isOpen && (
        <div
          className="origin-top-right absolute left-0 md:left-8 mt-2 bg-white font-semibold shadow-lg z-50 w-full md:w-auto min-w-[200px] rounded"
        >
          <div className="py-1">
            {options.map((option, index) => (
              <div
                key={index}
                hidden={option.hidden}
              >
                <a
                  href={option.href || '#'}
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={handleItemClick}
                >
                  {option.icon && (
                    <span className="mr-3">
                      {option.icon}
                    </span>
                  )}
                  {option.label}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
