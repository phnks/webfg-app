import React, { useState, useCallback, useMemo } from 'react';
import './SearchFilterSort.css';

const SearchFilterSort = ({ 
  entityType, 
  onFilterChange, 
  initialFilters = {},
  onClearFilters 
}) => {
  const [filters, setFilters] = useState(initialFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Entity-specific filter configurations
  const filterConfig = useMemo(() => {
    const configs = {
      characters: {
        searchPlaceholder: "Search characters by name...",
        categories: [
          { value: 'HUMAN', label: 'Human' },
          { value: 'TREPIDITE', label: 'Trepidite' },
          { value: 'MONSTER', label: 'Monster' },
          { value: 'CARVED', label: 'Carved' },
          { value: 'ANTHRO', label: 'Anthro' },
          { value: 'ICER', label: 'Icer' },
          { value: 'DAXMC', label: 'Daxmc' },
          { value: 'QRTIS', label: 'Qrtis' },
          { value: 'TYVIR', label: 'Tyvir' }
        ],
        attributes: [
          'weight', 'size', 'armour', 'endurance', 'lethality',
          'speed', 'strength', 'dexterity', 'agility',
          'resolve', 'morale', 'intelligence', 'charisma',
          'perception', 'seeing', 'hearing', 'smelling', 'light', 'noise', 'scent'
        ],
        numericFields: ['will', 'fatigue'],
        sortFields: [
          { value: 'name', label: 'Name' },
          { value: 'characterCategory', label: 'Category' },
          { value: 'will', label: 'Will' },
          { value: 'fatigue', label: 'Fatigue' },
          { value: 'armour.attribute.attributeValue', label: 'Armour' },
          { value: 'endurance.attribute.attributeValue', label: 'Endurance' },
          { value: 'strength.attribute.attributeValue', label: 'Strength' },
          { value: 'dexterity.attribute.attributeValue', label: 'Dexterity' }
        ]
      },
      objects: {
        searchPlaceholder: "Search objects by name...",
        categories: [
          { value: 'TOOL', label: 'Tool' },
          { value: 'WEAPON', label: 'Weapon' },
          { value: 'ARMOR', label: 'Armor' },
          { value: 'CONTAINER', label: 'Container' },
          { value: 'STRUCTURE', label: 'Structure' },
          { value: 'JEWLERY', label: 'Jewelry' },
          { value: 'DEVICE', label: 'Device' },
          { value: 'MATERIAL', label: 'Material' },
          { value: 'CLOTHING', label: 'Clothing' },
          { value: 'LIGHT_SOURCE', label: 'Light Source' },
          { value: 'DOCUMENT', label: 'Document' },
          { value: 'COMPONENT', label: 'Component' },
          { value: 'ARTIFACT', label: 'Artifact' }
        ],
        attributes: [
          'weight', 'size', 'armour', 'endurance', 'lethality',
          'speed', 'strength', 'dexterity', 'agility',
          'resolve', 'morale', 'intelligence', 'charisma',
          'perception', 'seeing', 'hearing', 'smelling', 'light', 'noise', 'scent'
        ],
        sortFields: [
          { value: 'name', label: 'Name' },
          { value: 'objectCategory', label: 'Category' },
          { value: 'weight.attributeValue', label: 'Weight' },
          { value: 'size.attributeValue', label: 'Size' },
          { value: 'armour.attributeValue', label: 'Armour' },
          { value: 'lethality.attributeValue', label: 'Lethality' }
        ]
      },
      actions: {
        searchPlaceholder: "Search actions by name or description...",
        categories: [
          { value: 'MOVE', label: 'Move' },
          { value: 'ATTACK', label: 'Attack' },
          { value: 'DEFEND', label: 'Defend' },
          { value: 'RECOVER', label: 'Recover' },
          { value: 'INTERACT', label: 'Interact' },
          { value: 'MANIPULATE', label: 'Manipulate' },
          { value: 'ASSIST', label: 'Assist' }
        ],
        attributes: [
          'SPEED', 'WEIGHT', 'SIZE', 'ARMOUR', 'ENDURANCE', 'LETHALITY',
          'STRENGTH', 'DEXTERITY', 'AGILITY', 'PERCEPTION', 'INTENSITY',
          'RESOLVE', 'MORALE', 'INTELLIGENCE', 'CHARISMA'
        ],
        targetTypes: [
          { value: 'OBJECT', label: 'Object' },
          { value: 'CHARACTER', label: 'Character' },
          { value: 'ACTION', label: 'Action' }
        ],
        effectTypes: [
          { value: 'HELP', label: 'Help' },
          { value: 'HINDER', label: 'Hinder' },
          { value: 'DESTROY', label: 'Destroy' },
          { value: 'TRIGGER_ACTION', label: 'Trigger Action' }
        ],
        sortFields: [
          { value: 'name', label: 'Name' },
          { value: 'actionCategory', label: 'Category' },
          { value: 'sourceAttribute', label: 'Source Attribute' },
          { value: 'targetAttribute', label: 'Target Attribute' },
          { value: 'targetType', label: 'Target Type' },
          { value: 'effectType', label: 'Effect Type' }
        ]
      },
      conditions: {
        searchPlaceholder: "Search conditions by name or description...",
        categories: [
          { value: 'PHYSICAL', label: 'Physical' },
          { value: 'MENTAL', label: 'Mental' },
          { value: 'ENVIRONMENTAL', label: 'Environmental' },
          { value: 'MAGICAL', label: 'Magical' },
          { value: 'DISEASE', label: 'Disease' },
          { value: 'BUFF', label: 'Buff' },
          { value: 'DEBUFF', label: 'Debuff' },
          { value: 'STATUS', label: 'Status' }
        ],
        conditionTypes: [
          { value: 'HELP', label: 'Help' },
          { value: 'HINDER', label: 'Hinder' }
        ],
        attributes: [
          'SPEED', 'WEIGHT', 'SIZE', 'ARMOUR', 'ENDURANCE', 'LETHALITY',
          'STRENGTH', 'DEXTERITY', 'AGILITY', 'PERCEPTION', 'INTENSITY',
          'RESOLVE', 'MORALE', 'INTELLIGENCE', 'CHARISMA'
        ],
        sortFields: [
          { value: 'name', label: 'Name' },
          { value: 'conditionCategory', label: 'Category' },
          { value: 'conditionType', label: 'Type' },
          { value: 'conditionTarget', label: 'Target Attribute' }
        ]
      }
    };
    return configs[entityType] || {};
  }, [entityType]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const applyFilters = useCallback(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const updateFilter = useCallback((key, value) => {
    const newFilters = { ...filters, [key]: value };
    if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) {
      delete newFilters[key];
    }
    handleFilterChange(newFilters);
  }, [filters, handleFilterChange]);

  const clearAllFilters = useCallback(() => {
    setFilters({});
    onClearFilters && onClearFilters();
    onFilterChange({});
  }, [onFilterChange, onClearFilters]);

  const renderSearch = () => (
    <div className="search-section">
      <input
        type="text"
        placeholder={filterConfig.searchPlaceholder}
        value={filters.search || ''}
        onChange={(e) => updateFilter('search', e.target.value)}
        className="search-input"
      />
    </div>
  );

  const renderCategoryFilter = () => {
    const categoryKey = entityType === 'characters' ? 'characterCategory' : 
                       entityType === 'objects' ? 'objectCategory' :
                       entityType === 'actions' ? 'actionCategory' : 'conditionCategory';
    
    return (
      <div className="filter-group">
        <label>Category:</label>
        <select
          value={filters[categoryKey] || ''}
          onChange={(e) => updateFilter(categoryKey, e.target.value)}
          className="filter-select"
        >
          <option value="">All Categories</option>
          {filterConfig.categories?.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>
    );
  };

  const renderNumericFilter = (field, label) => (
    <div className="filter-group numeric-filter" key={field}>
      <label>{label}:</label>
      <div className="numeric-inputs">
        <input
          type="number"
          placeholder="Min"
          value={filters[field]?.ge || ''}
          onChange={(e) => updateFilter(field, { 
            ...filters[field], 
            ge: e.target.value ? parseInt(e.target.value) : undefined 
          })}
          className="numeric-input"
        />
        <span>to</span>
        <input
          type="number"
          placeholder="Max"
          value={filters[field]?.le || ''}
          onChange={(e) => updateFilter(field, { 
            ...filters[field], 
            le: e.target.value ? parseInt(e.target.value) : undefined 
          })}
          className="numeric-input"
        />
      </div>
    </div>
  );

  const renderSortControls = () => (
    <div className="sort-section">
      <div className="filter-group">
        <label>Sort by:</label>
        <select
          value={filters.sort?.[0]?.field || ''}
          onChange={(e) => updateFilter('sort', e.target.value ? 
            [{ field: e.target.value, direction: filters.sort?.[0]?.direction || 'ASC' }] : 
            []
          )}
          className="filter-select"
        >
          <option value="">Default Order</option>
          {filterConfig.sortFields?.map(field => (
            <option key={field.value} value={field.value}>{field.label}</option>
          ))}
        </select>
      </div>
      {filters.sort?.[0]?.field && (
        <div className="filter-group">
          <label>Direction:</label>
          <select
            value={filters.sort[0].direction}
            onChange={(e) => updateFilter('sort', 
              [{ ...filters.sort[0], direction: e.target.value }]
            )}
            className="filter-select"
          >
            <option value="ASC">Ascending</option>
            <option value="DESC">Descending</option>
          </select>
        </div>
      )}
    </div>
  );

  const renderActionFilters = () => {
    if (entityType !== 'actions') return null;
    
    return (
      <>
        <div className="filter-group">
          <label>Source Attribute:</label>
          <select
            value={filters.sourceAttribute || ''}
            onChange={(e) => updateFilter('sourceAttribute', e.target.value)}
            className="filter-select"
          >
            <option value="">Any Attribute</option>
            {filterConfig.attributes?.map(attr => (
              <option key={attr} value={attr}>{attr}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Target Attribute:</label>
          <select
            value={filters.targetAttribute || ''}
            onChange={(e) => updateFilter('targetAttribute', e.target.value)}
            className="filter-select"
          >
            <option value="">Any Attribute</option>
            {filterConfig.attributes?.map(attr => (
              <option key={attr} value={attr}>{attr}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Target Type:</label>
          <select
            value={filters.targetType || ''}
            onChange={(e) => updateFilter('targetType', e.target.value)}
            className="filter-select"
          >
            <option value="">Any Target</option>
            {filterConfig.targetTypes?.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Effect Type:</label>
          <select
            value={filters.effectType || ''}
            onChange={(e) => updateFilter('effectType', e.target.value)}
            className="filter-select"
          >
            <option value="">Any Effect</option>
            {filterConfig.effectTypes?.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </>
    );
  };

  const renderConditionFilters = () => {
    if (entityType !== 'conditions') return null;
    
    return (
      <>
        <div className="filter-group">
          <label>Condition Type:</label>
          <select
            value={filters.conditionType || ''}
            onChange={(e) => updateFilter('conditionType', e.target.value)}
            className="filter-select"
          >
            <option value="">Any Type</option>
            {filterConfig.conditionTypes?.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Target Attribute:</label>
          <select
            value={filters.conditionTarget || ''}
            onChange={(e) => updateFilter('conditionTarget', e.target.value)}
            className="filter-select"
          >
            <option value="">Any Attribute</option>
            {filterConfig.attributes?.map(attr => (
              <option key={attr} value={attr}>{attr}</option>
            ))}
          </select>
        </div>
      </>
    );
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="search-filter-sort">
      <div className="search-filter-header">
        <h3>Search & Filter</h3>
        <div className="header-controls">
          <button
            type="button"
            onClick={applyFilters}
            className="apply-filters"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="toggle-advanced"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="clear-filters"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {renderSearch()}

      <div className="basic-filters">
        {renderCategoryFilter()}
        {renderSortControls()}
      </div>

      {showAdvanced && (
        <div className="advanced-filters">
          <h4>Advanced Filters</h4>
          
          {entityType === 'characters' && (
            <>
              {renderNumericFilter('will', 'Will')}
              {renderNumericFilter('fatigue', 'Fatigue')}
            </>
          )}
          
          {renderActionFilters()}
          {renderConditionFilters()}
        </div>
      )}
    </div>
  );
};

export default SearchFilterSort;