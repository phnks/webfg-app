import React from 'react';
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { MemoryRouter } from 'react-router-dom';
import { mockCharacters, mockObjects, mockActions } from '../../test-utils';

describe('Test Utils', () => {
  describe('mockCharacters', () => {
    test('should contain expected character data', () => {
      expect(mockCharacters).toHaveLength(2);
      expect(mockCharacters[0]).toHaveProperty('id', '1');
      expect(mockCharacters[0]).toHaveProperty('name', 'The Guy');
      expect(mockCharacters[0]).toHaveProperty('category', 'HUMAN');
      expect(mockCharacters[0]).toHaveProperty('strength', 10);
      expect(mockCharacters[0]).toHaveProperty('dexterity', 10);
      expect(mockCharacters[0]).toHaveProperty('agility', 10);
      expect(mockCharacters[0]).toHaveProperty('endurance', 10);
      expect(mockCharacters[0]).toHaveProperty('vigor', 10);
      expect(mockCharacters[0]).toHaveProperty('perception', 10);
      expect(mockCharacters[0]).toHaveProperty('intelligence', 10);
      expect(mockCharacters[0]).toHaveProperty('will', 10);
      expect(mockCharacters[0]).toHaveProperty('social', 10);
      expect(mockCharacters[0]).toHaveProperty('faith', 10);
      expect(mockCharacters[0]).toHaveProperty('armor', 10);
      expect(mockCharacters[0]).toHaveProperty('lethality', 10);
      expect(mockCharacters[0]).toHaveProperty('createdAt');
      expect(mockCharacters[0]).toHaveProperty('updatedAt');
    });

    test('should contain Commoner character with low stats', () => {
      expect(mockCharacters[1]).toHaveProperty('id', '2');
      expect(mockCharacters[1]).toHaveProperty('name', 'Commoner');
      expect(mockCharacters[1]).toHaveProperty('category', 'HUMAN');
      expect(mockCharacters[1]).toHaveProperty('strength', 1);
      expect(mockCharacters[1]).toHaveProperty('dexterity', 1);
      expect(mockCharacters[1]).toHaveProperty('agility', 1);
      expect(mockCharacters[1]).toHaveProperty('endurance', 1);
      expect(mockCharacters[1]).toHaveProperty('vigor', 1);
      expect(mockCharacters[1]).toHaveProperty('perception', 1);
      expect(mockCharacters[1]).toHaveProperty('intelligence', 1);
      expect(mockCharacters[1]).toHaveProperty('will', 1);
      expect(mockCharacters[1]).toHaveProperty('social', 1);
      expect(mockCharacters[1]).toHaveProperty('faith', 1);
      expect(mockCharacters[1]).toHaveProperty('armor', 1);
      expect(mockCharacters[1]).toHaveProperty('lethality', 1);
    });
  });

  describe('mockObjects', () => {
    test('should contain expected object data', () => {
      expect(mockObjects).toHaveLength(2);
      expect(mockObjects[0]).toHaveProperty('id', '1');
      expect(mockObjects[0]).toHaveProperty('name', 'Longsword');
      expect(mockObjects[0]).toHaveProperty('category', 'WEAPON');
      expect(mockObjects[0]).toHaveProperty('description', 'A standard medieval longsword');
      expect(mockObjects[0]).toHaveProperty('speed', 3);
      expect(mockObjects[0]).toHaveProperty('weight', 15);
      expect(mockObjects[0]).toHaveProperty('size', 4);
      expect(mockObjects[0]).toHaveProperty('intensity', 8);
      expect(mockObjects[0]).toHaveProperty('armor', 0);
      expect(mockObjects[0]).toHaveProperty('lethality', 15);
      expect(mockObjects[0]).toHaveProperty('dexterity', 2);
      expect(mockObjects[0]).toHaveProperty('createdAt');
      expect(mockObjects[0]).toHaveProperty('updatedAt');
    });

    test('should contain Chainmail armor with expected stats', () => {
      expect(mockObjects[1]).toHaveProperty('id', '2');
      expect(mockObjects[1]).toHaveProperty('name', 'Chainmail');
      expect(mockObjects[1]).toHaveProperty('category', 'ARMOR');
      expect(mockObjects[1]).toHaveProperty('description', 'Flexible armor made of interlocking metal rings');
      expect(mockObjects[1]).toHaveProperty('speed', -2);
      expect(mockObjects[1]).toHaveProperty('weight', 40);
      expect(mockObjects[1]).toHaveProperty('size', 3);
      expect(mockObjects[1]).toHaveProperty('intensity', 0);
      expect(mockObjects[1]).toHaveProperty('armor', 20);
      expect(mockObjects[1]).toHaveProperty('agility', -3);
    });
  });

  describe('mockActions', () => {
    test('should contain expected action data', () => {
      expect(mockActions).toHaveLength(2);
      expect(mockActions[0]).toHaveProperty('id', '1');
      expect(mockActions[0]).toHaveProperty('name', 'Hit');
      expect(mockActions[0]).toHaveProperty('description', 'A basic attack action');
      expect(mockActions[0]).toHaveProperty('source', 'dexterity');
      expect(mockActions[0]).toHaveProperty('target', 'agility');
      expect(mockActions[0]).toHaveProperty('type', 'trigger');
      expect(mockActions[0]).toHaveProperty('triggersActionId', '2');
      expect(mockActions[0]).toHaveProperty('createdAt');
      expect(mockActions[0]).toHaveProperty('updatedAt');
    });

    test('should contain Break action with expected properties', () => {
      expect(mockActions[1]).toHaveProperty('id', '2');
      expect(mockActions[1]).toHaveProperty('name', 'Break');
      expect(mockActions[1]).toHaveProperty('description', 'Breaking armor or objects');
      expect(mockActions[1]).toHaveProperty('source', 'strength');
      expect(mockActions[1]).toHaveProperty('target', 'armor');
    });
  });

  describe('data consistency', () => {
    test('all characters should have consistent structure', () => {
      const expectedKeys = [
        'id', 'name', 'category', 'description', 'strength', 'dexterity', 
        'agility', 'endurance', 'vigor', 'perception', 'intelligence', 'will', 
        'social', 'faith', 'armor', 'lethality', 'createdAt', 'updatedAt'
      ];
      
      mockCharacters.forEach(character => {
        expectedKeys.forEach(key => {
          expect(character).toHaveProperty(key);
        });
      });
    });

    test('all objects should have consistent structure', () => {
      const commonKeys = ['id', 'name', 'category', 'description', 'createdAt', 'updatedAt'];
      
      mockObjects.forEach(object => {
        commonKeys.forEach(key => {
          expect(object).toHaveProperty(key);
        });
      });
    });

    test('all actions should have consistent structure', () => {
      const expectedKeys = ['id', 'name', 'description', 'source', 'target', 'createdAt', 'updatedAt'];
      
      mockActions.forEach(action => {
        expectedKeys.forEach(key => {
          expect(action).toHaveProperty(key);
        });
      });
    });
  });

  describe('data types', () => {
    test('character attributes should be numbers', () => {
      mockCharacters.forEach(character => {
        expect(typeof character.strength).toBe('number');
        expect(typeof character.dexterity).toBe('number');
        expect(typeof character.agility).toBe('number');
        expect(typeof character.endurance).toBe('number');
        expect(typeof character.vigor).toBe('number');
        expect(typeof character.perception).toBe('number');
        expect(typeof character.intelligence).toBe('number');
        expect(typeof character.will).toBe('number');
        expect(typeof character.social).toBe('number');
        expect(typeof character.faith).toBe('number');
        expect(typeof character.armor).toBe('number');
        expect(typeof character.lethality).toBe('number');
      });
    });

    test('object attributes should be numbers where applicable', () => {
      mockObjects.forEach(object => {
        if (object.speed !== undefined) expect(typeof object.speed).toBe('number');
        if (object.weight !== undefined) expect(typeof object.weight).toBe('number');
        if (object.size !== undefined) expect(typeof object.size).toBe('number');
        if (object.intensity !== undefined) expect(typeof object.intensity).toBe('number');
        if (object.armor !== undefined) expect(typeof object.armor).toBe('number');
        if (object.lethality !== undefined) expect(typeof object.lethality).toBe('number');
        if (object.dexterity !== undefined) expect(typeof object.dexterity).toBe('number');
        if (object.agility !== undefined) expect(typeof object.agility).toBe('number');
      });
    });

    test('all IDs should be strings', () => {
      mockCharacters.forEach(character => {
        expect(typeof character.id).toBe('string');
      });
      
      mockObjects.forEach(object => {
        expect(typeof object.id).toBe('string');
      });
      
      mockActions.forEach(action => {
        expect(typeof action.id).toBe('string');
      });
    });

    test('all names should be strings', () => {
      mockCharacters.forEach(character => {
        expect(typeof character.name).toBe('string');
      });
      
      mockObjects.forEach(object => {
        expect(typeof object.name).toBe('string');
      });
      
      mockActions.forEach(action => {
        expect(typeof action.name).toBe('string');
      });
    });

    test('all descriptions should be strings', () => {
      mockCharacters.forEach(character => {
        expect(typeof character.description).toBe('string');
      });
      
      mockObjects.forEach(object => {
        expect(typeof object.description).toBe('string');
      });
      
      mockActions.forEach(action => {
        expect(typeof action.description).toBe('string');
      });
    });

    test('all categories should be strings', () => {
      mockCharacters.forEach(character => {
        expect(typeof character.category).toBe('string');
      });
      
      mockObjects.forEach(object => {
        expect(typeof object.category).toBe('string');
      });
    });

    test('all timestamps should be strings', () => {
      mockCharacters.forEach(character => {
        expect(typeof character.createdAt).toBe('string');
        expect(typeof character.updatedAt).toBe('string');
      });
      
      mockObjects.forEach(object => {
        expect(typeof object.createdAt).toBe('string');
        expect(typeof object.updatedAt).toBe('string');
      });
      
      mockActions.forEach(action => {
        expect(typeof action.createdAt).toBe('string');
        expect(typeof action.updatedAt).toBe('string');
      });
    });
  });

  describe('specific data validation', () => {
    test('character categories should be valid', () => {
      mockCharacters.forEach(character => {
        expect(['HUMAN', 'ANIMAL', 'MONSTER', 'ROBOT', 'SPIRIT', 'OTHER']).toContain(character.category);
      });
    });

    test('object categories should be valid', () => {
      mockObjects.forEach(object => {
        expect(['WEAPON', 'ARMOR', 'TOOL', 'CONTAINER', 'OTHER']).toContain(object.category);
      });
    });

    test('timestamps should be valid ISO strings', () => {
      mockCharacters.forEach(character => {
        expect(new Date(character.createdAt).toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
        expect(new Date(character.updatedAt).toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
      });
    });
  });
});