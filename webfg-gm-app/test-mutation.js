const https = require('https');

// Configuration
const apiUrl = 'https://webfg-gql-qa34.phnks.com/graphql';
const apiKey = 'da2-amw35phinvg3vjneaiziev7kcm';

// Test mutation to create a character with the new schema
const testMutation = JSON.stringify({
  query: `
    mutation CreateCharacter($input: CharacterInput!) {
      createCharacter(input: $input) {
        characterId
        name
        characterCategory
        will
        lethality {
          attribute {
            attributeValue
            isGrouped
          }
          fatigue
        }
        values {
          valueName
          valueType
        }
      }
    }
  `,
  variables: {
    input: {
      name: "Test Character",
      characterCategory: "HUMAN",
      will: 5,
      values: [
        { valueName: "IDEALISM", valueType: "GOOD" },
        { valueName: "SURVIVAL", valueType: "BAD" }
      ],
      lethality: {
        attribute: {
          attributeValue: 4,
          isGrouped: true
        },
        fatigue: 0
      },
      armour: {
        attribute: {
          attributeValue: 2,
          isGrouped: true
        },
        fatigue: 0
      },
      endurance: {
        attribute: {
          attributeValue: 3,
          isGrouped: true
        },
        fatigue: 0
      },
      strength: {
        attribute: {
          attributeValue: 4,
          isGrouped: true
        },
        fatigue: 0
      },
      dexterity: {
        attribute: {
          attributeValue: 3,
          isGrouped: true
        },
        fatigue: 0
      },
      agility: {
        attribute: {
          attributeValue: 3,
          isGrouped: true
        },
        fatigue: 0
      },
      obscurity: {
        attribute: {
          attributeValue: 3,
          isGrouped: true
        },
        fatigue: 0
      },
      charisma: {
        attribute: {
          attributeValue: 2,
          isGrouped: true
        },
        fatigue: 0
      },
      intelligence: {
        attribute: {
          attributeValue: 3,
          isGrouped: true
        },
        fatigue: 0
      },
      resolve: {
        attribute: {
          attributeValue: 3,
          isGrouped: true
        },
        fatigue: 0
      },
      morale: {
        attribute: {
          attributeValue: 3,
          isGrouped: true
        },
        fatigue: 0
      }
    }
  }
});

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey
  }
};

const req = https.request(apiUrl, options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('API Response Status:', res.statusCode);
    const response = JSON.parse(data);
    console.log('Response:', JSON.stringify(response, null, 2));
    
    if (response.data && response.data.createCharacter) {
      console.log('\n✅ Successfully created character with new schema!');
      const char = response.data.createCharacter;
      console.log('Character details:');
      console.log('- ID:', char.characterId);
      console.log('- Name:', char.name);
      console.log('- Category:', char.characterCategory);
      console.log('- Will:', char.will);
      console.log('- Lethality:', char.lethality?.attribute?.attributeValue || 'Not set');
      console.log('- Values:', char.values.map(v => `${v.valueName} (${v.valueType})`).join(', '));
    } else if (response.errors) {
      console.log('\n❌ GraphQL Errors:', response.errors);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(testMutation);
req.end();