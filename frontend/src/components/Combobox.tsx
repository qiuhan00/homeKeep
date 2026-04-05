import { useState, useRef, useEffect } from 'react';

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}

export default function Combobox({ value, onChange, options, placeholder, className = '' }: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputWidth, setInputWidth] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(value.toLowerCase())
  );

  useEffect(() => {
    if (inputRef.current) {
      setInputWidth(inputRef.current.offsetWidth);
    }
  }, []);

  const handleSelect = (opt: string) => {
    onChange(opt);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
  };

  // 修复：当下拉框打开时，始终显示预定义选项供选择
  const showDropdown = isOpen ? (value.length === 0 ? options : (filteredOptions.length > 0 ? filteredOptions : options)) : [];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        className="input w-full"
        placeholder={placeholder}
        autoComplete="off"
      />
      {isOpen && showDropdown.length > 0 && (
        <ul
          className="absolute z-50 bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto"
          style={{ width: inputWidth }}
        >
          {showDropdown.map((opt) => (
            <li
              key={opt}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(opt);
              }}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-left"
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}