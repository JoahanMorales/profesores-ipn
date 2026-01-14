import { useState, useRef, useEffect } from 'react';

/**
 * Select con búsqueda integrada
 * Ideal para listas largas (50+ items)
 */
const SearchableSelect = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = 'Seleccionar...', 
  searchPlaceholder = 'Buscar...',
  label,
  error,
  disabled = false,
  className = '',
  valueKey = 'id',
  labelKey = 'nombre',
  secondaryKey = null // Para mostrar info adicional como "abreviatura"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filtrar opciones basado en búsqueda
  const filteredOptions = options.filter(option => {
    const searchLower = searchQuery.toLowerCase();
    const labelValue = option[labelKey]?.toLowerCase() || '';
    const secondaryValue = secondaryKey ? (option[secondaryKey]?.toLowerCase() || '') : '';
    
    return labelValue.includes(searchLower) || secondaryValue.includes(searchLower);
  });

  // Obtener la opción seleccionada
  const selectedOption = options.find(opt => opt[valueKey] === value);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus en input de búsqueda al abrir
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Manejar navegación con teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredOptions[highlightedIndex]) {
            handleSelect(filteredOptions[highlightedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSearchQuery('');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, filteredOptions]);

  // Reset highlighted cuando cambia la búsqueda
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

  const handleSelect = (option) => {
    onChange(option[valueKey]);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-900 mb-2">
          {label}
        </label>
      )}

      {/* Select Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full px-3 py-2 text-left border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
            {selectedOption 
              ? (
                <>
                  {selectedOption[labelKey]}
                  {secondaryKey && selectedOption[secondaryKey] && (
                    <span className="ml-2 text-gray-500 text-xs">
                      ({selectedOption[secondaryKey]})
                    </span>
                  )}
                </>
              )
              : placeholder
            }
          </span>
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
            <div className="relative">
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-64">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={option[valueKey]}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                    index === highlightedIndex ? 'bg-gray-50' : ''
                  } ${
                    option[valueKey] === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option[labelKey]}</span>
                    {secondaryKey && option[secondaryKey] && (
                      <span className="text-xs text-gray-500 ml-2">
                        {option[secondaryKey]}
                      </span>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-8 text-center text-sm text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No se encontraron resultados</p>
                {searchQuery && (
                  <p className="mt-1 text-xs">
                    para "{searchQuery}"
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer with count */}
          {filteredOptions.length > 0 && (
            <div className="px-3 py-1.5 border-t border-gray-200 bg-gray-50 text-xs text-gray-600 sticky bottom-0">
              {filteredOptions.length} de {options.length} {filteredOptions.length === 1 ? 'resultado' : 'resultados'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
