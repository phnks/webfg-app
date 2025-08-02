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
        categories: [{
          value: 'HUMAN',
          label: 'Human'
        }, {
          value: 'TREPIDITE',
          label: 'Trepidite'
        }, {
          value: 'MONSTER',
          label: 'Monster'
        }, {
          value: 'CARVED',
          label: 'Carved'
        }, {
          value: 'ANTHRO',
          label: 'Anthro'
        }, {
          value: 'ICER',
          label: 'Icer'
        }, {
          value: 'DAXMC',
          label: 'Daxmc'
        }, {
          value: 'QRTIS',
          label: 'Qrtis'
        }, {
          value: 'TYVIR',
          label: 'Tyvir'
        }],
        attributes: ['weight', 'size', 'armour', 'endurance', 'lethality', 'speed', 'strength', 'dexterity', 'agility', 'resolve', 'morale', 'intelligence', 'charisma', 'obscurity', 'seeing', 'hearing', 'light', 'noise'],
        numericFields: ['will'],
        sortFields: [{
          value: 'name',
          label: 'Name'
        }, {
          value: 'characterCategory',
          label: 'Category'
        }, {
          value: 'will',
          label: 'Will'
        }, {
          value: 'armour.attribute.attributeValue',
          label: 'Armour'
        }, {
          value: 'endurance.attribute.attributeValue',
          label: 'Endurance'
        }, {
          value: 'strength.attribute.attributeValue',
          label: 'Strength'
        }, {
          value: 'dexterity.attribute.attributeValue',
          label: 'Dexterity'
        }]
      },
      objects: {
        searchPlaceholder: "Search objects by name...",
        categories: [{
          value: 'TOOL',
          label: 'Tool'
        }, {
          value: 'WEAPON',
          label: 'Weapon'
        }, {
          value: 'ARMOR',
          label: 'Armor'
        }, {
          value: 'CONTAINER',
          label: 'Container'
        }, {
          value: 'STRUCTURE',
          label: 'Structure'
        }, {
          value: 'JEWLERY',
          label: 'Jewelry'
        }, {
          value: 'DEVICE',
          label: 'Device'
        }, {
          value: 'MATERIAL',
          label: 'Material'
        }, {
          value: 'CLOTHING',
          label: 'Clothing'
        }, {
          value: 'LIGHT_SOURCE',
          label: 'Light Source'
        }, {
          value: 'DOCUMENT',
          label: 'Document'
        }, {
          value: 'COMPONENT',
          label: 'Component'
        }, {
          value: 'ARTIFACT',
          label: 'Artifact'
        }],
        attributes: ['weight', 'size', 'armour', 'endurance', 'lethality', 'speed', 'strength', 'dexterity', 'agility', 'resolve', 'morale', 'intelligence', 'charisma', 'obscurity', 'seeing', 'hearing', 'light', 'noise'],
        sortFields: [{
          value: 'name',
          label: 'Name'
        }, {
          value: 'objectCategory',
          label: 'Category'
        }, {
          value: 'weight.attributeValue',
          label: 'Weight'
        }, {
          value: 'size.attributeValue',
          label: 'Size'
        }, {
          value: 'armour.attributeValue',
          label: 'Armour'
        }, {
          value: 'lethality.attributeValue',
          label: 'Lethality'
        }]
      },
      actions: {
        searchPlaceholder: "Search actions by name or description...",
        categories: [{
          value: 'MOVE',
          label: 'Move'
        }, {
          value: 'ATTACK',
          label: 'Attack'
        }, {
          value: 'DEFEND',
          label: 'Defend'
        }, {
          value: 'RECOVER',
          label: 'Recover'
        }, {
          value: 'INTERACT',
          label: 'Interact'
        }, {
          value: 'MANIPULATE',
          label: 'Manipulate'
        }, {
          value: 'ASSIST',
          label: 'Assist'
        }],
        attributes: ['SPEED', 'WEIGHT', 'SIZE', 'ARMOUR', 'ENDURANCE', 'LETHALITY', 'STRENGTH', 'DEXTERITY', 'AGILITY', 'PERCEPTION', 'INTENSITY', 'RESOLVE', 'MORALE', 'INTELLIGENCE', 'CHARISMA'],
        targetTypes: [{
          value: 'OBJECT',
          label: 'Object'
        }, {
          value: 'CHARACTER',
          label: 'Character'
        }, {
          value: 'ACTION',
          label: 'Action'
        }],
        effectTypes: [{
          value: 'HELP',
          label: 'Help'
        }, {
          value: 'HINDER',
          label: 'Hinder'
        }, {
          value: 'DESTROY',
          label: 'Destroy'
        }, {
          value: 'TRIGGER_ACTION',
          label: 'Trigger Action'
        }],
        sortFields: [{
          value: 'name',
          label: 'Name'
        }, {
          value: 'actionCategory',
          label: 'Category'
        }, {
          value: 'sourceAttribute',
          label: 'Source Attribute'
        }, {
          value: 'targetAttribute',
          label: 'Target Attribute'
        }, {
          value: 'targetType',
          label: 'Target Type'
        }, {
          value: 'effectType',
          label: 'Effect Type'
        }]
      },
      conditions: {
        searchPlaceholder: "Search conditions by name or description...",
        categories: [{
          value: 'PHYSICAL',
          label: 'Physical'
        }, {
          value: 'MENTAL',
          label: 'Mental'
        }, {
          value: 'ENVIRONMENTAL',
          label: 'Environmental'
        }, {
          value: 'MAGICAL',
          label: 'Magical'
        }, {
          value: 'DISEASE',
          label: 'Disease'
        }, {
          value: 'BUFF',
          label: 'Buff'
        }, {
          value: 'DEBUFF',
          label: 'Debuff'
        }, {
          value: 'STATUS',
          label: 'Status'
        }],
        conditionTypes: [{
          value: 'HELP',
          label: 'Help'
        }, {
          value: 'HINDER',
          label: 'Hinder'
        }],
        attributes: ['SPEED', 'WEIGHT', 'SIZE', 'ARMOUR', 'ENDURANCE', 'LETHALITY', 'STRENGTH', 'DEXTERITY', 'AGILITY', 'PERCEPTION', 'INTENSITY', 'RESOLVE', 'MORALE', 'INTELLIGENCE', 'CHARISMA'],
        sortFields: [{
          value: 'name',
          label: 'Name'
        }, {
          value: 'conditionCategory',
          label: 'Category'
        }, {
          value: 'conditionType',
          label: 'Type'
        }, {
          value: 'conditionTarget',
          label: 'Target Attribute'
        }]
      },
      thoughts: {
        searchPlaceholder: "Search thoughts by name or description...",
        categories: [],
        // Thoughts have no categories in the simple schema
        sortFields: [{
          value: 'name',
          label: 'Name'
        }]
      }
    };
    return configs[entityType] || {};
  }, [entityType]);
  const handleFilterChange = useCallback(newFilters => {
    setFilters(newFilters);
  }, []);
  const applyFilters = useCallback(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);
  const updateFilter = useCallback((key, value) => {
    const newFilters = {
      ...filters,
      [key]: value
    };
    if (!value || typeof value === 'object' && Object.keys(value).length === 0) {
      delete newFilters[key];
    }
    handleFilterChange(newFilters);
  }, [filters, handleFilterChange]);
  const clearAllFilters = useCallback(() => {
    setFilters({});
    onClearFilters && onClearFilters();
    onFilterChange({});
  }, [onFilterChange, onClearFilters]);
  const renderSearch = () => /*#__PURE__*/React.createElement("div", {
    className: "search-section"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: filterConfig.searchPlaceholder,
    value: filters.search || '',
    onChange: e => updateFilter('search', e.target.value),
    className: "search-input"
  }));
  const renderCategoryFilter = () => {
    const categoryKey = entityType === 'characters' ? 'characterCategory' : entityType === 'objects' ? 'objectCategory' : entityType === 'actions' ? 'actionCategory' : 'conditionCategory';
    return /*#__PURE__*/React.createElement("div", {
      className: "filter-group"
    }, /*#__PURE__*/React.createElement("label", null, "Category:"), /*#__PURE__*/React.createElement("select", {
      value: filters[categoryKey] || '',
      onChange: e => updateFilter(categoryKey, e.target.value),
      className: "filter-select"
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "All Categories"), filterConfig.categories?.map(cat => /*#__PURE__*/React.createElement("option", {
      key: cat.value,
      value: cat.value
    }, cat.label))));
  };
  const renderNumericFilter = (field, label) => /*#__PURE__*/React.createElement("div", {
    className: "filter-group numeric-filter",
    key: field
  }, /*#__PURE__*/React.createElement("label", null, label, ":"), /*#__PURE__*/React.createElement("div", {
    className: "numeric-inputs"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    placeholder: "Min",
    value: filters[field]?.ge || '',
    onChange: e => updateFilter(field, {
      ...filters[field],
      ge: e.target.value ? parseInt(e.target.value) : undefined
    }),
    className: "numeric-input"
  }), /*#__PURE__*/React.createElement("span", null, "to"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    placeholder: "Max",
    value: filters[field]?.le || '',
    onChange: e => updateFilter(field, {
      ...filters[field],
      le: e.target.value ? parseInt(e.target.value) : undefined
    }),
    className: "numeric-input"
  })));
  const renderSortControls = () => /*#__PURE__*/React.createElement("div", {
    className: "sort-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "filter-group"
  }, /*#__PURE__*/React.createElement("label", null, "Sort by:"), /*#__PURE__*/React.createElement("select", {
    value: filters.sort?.[0]?.field || '',
    onChange: e => updateFilter('sort', e.target.value ? [{
      field: e.target.value,
      direction: filters.sort?.[0]?.direction || 'ASC'
    }] : []),
    className: "filter-select"
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Default Order"), filterConfig.sortFields?.map(field => /*#__PURE__*/React.createElement("option", {
    key: field.value,
    value: field.value
  }, field.label)))), filters.sort?.[0]?.field && /*#__PURE__*/React.createElement("div", {
    className: "filter-group"
  }, /*#__PURE__*/React.createElement("label", null, "Direction:"), /*#__PURE__*/React.createElement("select", {
    value: filters.sort[0].direction,
    onChange: e => updateFilter('sort', [{
      ...filters.sort[0],
      direction: e.target.value
    }]),
    className: "filter-select"
  }, /*#__PURE__*/React.createElement("option", {
    value: "ASC"
  }, "Ascending"), /*#__PURE__*/React.createElement("option", {
    value: "DESC"
  }, "Descending"))));
  const renderActionFilters = () => {
    if (entityType !== 'actions') return null;
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "filter-group"
    }, /*#__PURE__*/React.createElement("label", null, "Source Attribute:"), /*#__PURE__*/React.createElement("select", {
      value: filters.sourceAttribute || '',
      onChange: e => updateFilter('sourceAttribute', e.target.value),
      className: "filter-select"
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "Any Attribute"), filterConfig.attributes?.map(attr => /*#__PURE__*/React.createElement("option", {
      key: attr,
      value: attr
    }, attr)))), /*#__PURE__*/React.createElement("div", {
      className: "filter-group"
    }, /*#__PURE__*/React.createElement("label", null, "Target Attribute:"), /*#__PURE__*/React.createElement("select", {
      value: filters.targetAttribute || '',
      onChange: e => updateFilter('targetAttribute', e.target.value),
      className: "filter-select"
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "Any Attribute"), filterConfig.attributes?.map(attr => /*#__PURE__*/React.createElement("option", {
      key: attr,
      value: attr
    }, attr)))), /*#__PURE__*/React.createElement("div", {
      className: "filter-group"
    }, /*#__PURE__*/React.createElement("label", null, "Target Type:"), /*#__PURE__*/React.createElement("select", {
      value: filters.targetType || '',
      onChange: e => updateFilter('targetType', e.target.value),
      className: "filter-select"
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "Any Target"), filterConfig.targetTypes?.map(type => /*#__PURE__*/React.createElement("option", {
      key: type.value,
      value: type.value
    }, type.label)))), /*#__PURE__*/React.createElement("div", {
      className: "filter-group"
    }, /*#__PURE__*/React.createElement("label", null, "Effect Type:"), /*#__PURE__*/React.createElement("select", {
      value: filters.effectType || '',
      onChange: e => updateFilter('effectType', e.target.value),
      className: "filter-select"
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "Any Effect"), filterConfig.effectTypes?.map(type => /*#__PURE__*/React.createElement("option", {
      key: type.value,
      value: type.value
    }, type.label)))));
  };
  const renderConditionFilters = () => {
    if (entityType !== 'conditions') return null;
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "filter-group"
    }, /*#__PURE__*/React.createElement("label", null, "Condition Type:"), /*#__PURE__*/React.createElement("select", {
      value: filters.conditionType || '',
      onChange: e => updateFilter('conditionType', e.target.value),
      className: "filter-select"
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "Any Type"), filterConfig.conditionTypes?.map(type => /*#__PURE__*/React.createElement("option", {
      key: type.value,
      value: type.value
    }, type.label)))), /*#__PURE__*/React.createElement("div", {
      className: "filter-group"
    }, /*#__PURE__*/React.createElement("label", null, "Target Attribute:"), /*#__PURE__*/React.createElement("select", {
      value: filters.conditionTarget || '',
      onChange: e => updateFilter('conditionTarget', e.target.value),
      className: "filter-select"
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "Any Attribute"), filterConfig.attributes?.map(attr => /*#__PURE__*/React.createElement("option", {
      key: attr,
      value: attr
    }, attr)))));
  };
  const hasActiveFilters = Object.keys(filters).length > 0;
  return /*#__PURE__*/React.createElement("div", {
    className: "search-filter-sort"
  }, /*#__PURE__*/React.createElement("div", {
    className: "search-filter-header"
  }, /*#__PURE__*/React.createElement("h3", null, "Search & Filter"), /*#__PURE__*/React.createElement("div", {
    className: "header-controls"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: applyFilters,
    className: "apply-filters"
  }, "Search"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setShowAdvanced(!showAdvanced),
    className: "toggle-advanced"
  }, showAdvanced ? 'Hide' : 'Show', " Advanced Filters"), hasActiveFilters && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: clearAllFilters,
    className: "clear-filters"
  }, "Clear All"))), renderSearch(), /*#__PURE__*/React.createElement("div", {
    className: "basic-filters"
  }, renderCategoryFilter(), renderSortControls()), showAdvanced && /*#__PURE__*/React.createElement("div", {
    className: "advanced-filters"
  }, /*#__PURE__*/React.createElement("h4", null, "Advanced Filters"), entityType === 'characters' && /*#__PURE__*/React.createElement(React.Fragment, null, renderNumericFilter('will', 'Will')), renderActionFilters(), renderConditionFilters()));
};
export default SearchFilterSort;