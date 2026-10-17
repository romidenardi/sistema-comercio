import './SearchInput.css';
const SearchInput = ({ id, value, onChange, placeholder = 'Buscar...', label = 'Buscar' }) => (
  <div className="list-search">
    <input
      id={id}
      type="text"
      autoComplete="off"
      aria-label={label}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.preventDefault();
        if (event.key === 'Escape') onChange('');
      }}
    />
    {value && (
      <button type="button" className="list-search-clear" aria-label="Limpiar búsqueda" onClick={() => onChange('')}>
        ×
      </button>
    )}
  </div>
);

export default SearchInput;
