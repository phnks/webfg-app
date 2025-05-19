const https = require('https');

// Configuration
const apiUrl = 'https://webfg-gql-qa34.phnks.com/graphql';
const apiKey = 'da2-amw35phinvg3vjneaiziev7kcm';

// Test query to list characters with the new schema
const testQuery = JSON.stringify({
  query: `
    query ListCharacters {
      listCharacters {
        characterId
        name
        characterCategory
        will
        lethality {
          attribute {
            attributeValue
            attributeType
          }
          fatigue
        }
        armour {
          attribute {
            attributeValue
            attributeType
          }
          fatigue
        }
        strength {
          attribute {
            attributeValue
            attributeType
          }
          fatigue
        }
        values {
          valueName
          valueType
        }
      }
    }
  `
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
    
    if (response.data && response.data.listCharacters) {
      console.log('\n✅ Successfully fetched characters with new schema!');
      console.log('Number of characters:', response.data.listCharacters.length);
      
      if (response.data.listCharacters.length > 0) {
        const char = response.data.listCharacters[0];
        console.log('\nFirst character details:');
        console.log('- Name:', char.name);
        console.log('- Category:', char.characterCategory);
        console.log('- Will:', char.will);
        console.log('- Lethality:', char.lethality?.attribute?.attributeValue || 'Not set');
        console.log('- Has values:', char.values ? char.values.length : 0);
      }
    } else if (response.errors) {
      console.log('\n❌ GraphQL Errors:', response.errors);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(testQuery);
req.end();