const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const CHARACTERS_TABLE_NAME = process.env.CHARACTERS_TABLE_NAME;

// Default and maximum pagination limits
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

exports.handler = async (event) => {
    // console.log('Received event:', JSON.stringify(event, null, 2));

    const { filter } = event;

    // Setup pagination parameters
    const limit = Math.min(
        (filter?.pagination?.limit || DEFAULT_LIMIT),
        MAX_LIMIT
    );
    const exclusiveStartKey = filter?.pagination?.cursor ? 
        JSON.parse(Buffer.from(filter.pagination.cursor, 'base64').toString()) : 
        undefined;

    const params = {
        TableName: CHARACTERS_TABLE_NAME,
        Limit: limit,
        ...(exclusiveStartKey && { ExclusiveStartKey: exclusiveStartKey })
    };

    // Build filter expression
    if (filter) {
        const filterExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};

        // Text search - handle both old and new records
        // For backwards compatibility, we search both the original name field and the new nameLowerCase field
        if (filter.search) {
            // Search in name field (case-sensitive) OR in nameLowerCase field if it exists (case-insensitive)
            filterExpressions.push('(contains(#name, :search) OR (attribute_exists(#nameLowerCase) AND contains(#nameLowerCase, :searchLower)))');
            expressionAttributeNames['#name'] = 'name';
            expressionAttributeNames['#nameLowerCase'] = 'nameLowerCase';
            expressionAttributeValues[':search'] = filter.search;
            expressionAttributeValues[':searchLower'] = filter.search.toLowerCase();
        }

        // Basic string filters
        if (filter.name) {
            addStringFilter(filter.name, 'name', '#name', filterExpressions, expressionAttributeNames, expressionAttributeValues);
        }

        // Category filter
        if (filter.characterCategory) {
            filterExpressions.push('#characterCategory = :characterCategory');
            expressionAttributeNames['#characterCategory'] = 'characterCategory';
            expressionAttributeValues[':characterCategory'] = filter.characterCategory;
        }

        // Numeric filters
        if (filter.will) {
            addNumericFilter(filter.will, 'will', '#will', filterExpressions, expressionAttributeNames, expressionAttributeValues);
        }

        if (filter.fatigue) {
            addNumericFilter(filter.fatigue, 'fatigue', '#fatigue', filterExpressions, expressionAttributeNames, expressionAttributeValues);
        }

        // Attribute filters
        const attributes = ['speed', 'weight', 'size', 'armour', 'endurance', 'lethality', 
                           'strength', 'dexterity', 'agility', 'perception', 'intensity', 
                           'resolve', 'morale', 'intelligence', 'charisma'];
        
        attributes.forEach(attr => {
            if (filter[attr]) {
                addAttributeFilter(filter[attr], attr, filterExpressions, expressionAttributeNames, expressionAttributeValues);
            }
        });

        // Apply filters to params
        if (filterExpressions.length > 0) {
            params.FilterExpression = filterExpressions.join(' AND ');
            if (Object.keys(expressionAttributeNames).length > 0) {
                params.ExpressionAttributeNames = expressionAttributeNames;
            }
            if (Object.keys(expressionAttributeValues).length > 0) {
                params.ExpressionAttributeValues = expressionAttributeValues;
            }
        }
    }

    try {
        // console.log("Executing Scan with params:", JSON.stringify(params, null, 2));
        
        // Execute scan
        let allItems = [];
        let lastEvaluatedKey;
        let scannedCount = 0;
        const maxScans = 10; // Prevent infinite loops
        let scanCount = 0;

        do {
            if (lastEvaluatedKey) {
                params.ExclusiveStartKey = lastEvaluatedKey;
            }

            const command = new ScanCommand(params);
            const result = await ddbDocClient.send(command);
            
            scannedCount += result.ScannedCount || 0;
            
            if (result.Items) {
                allItems = allItems.concat(result.Items);
            }
            
            lastEvaluatedKey = result.LastEvaluatedKey;
            scanCount++;

        } while (lastEvaluatedKey && allItems.length < limit && scanCount < maxScans);

        // Apply sorting if specified
        if (filter?.sort && filter.sort.length > 0) {
            allItems = applySorting(allItems, filter.sort);
        }

        // Trim to exact limit
        const items = allItems.slice(0, limit);
        const hasNextPage = allItems.length > limit || !!lastEvaluatedKey;
        
        // Create next cursor if there are more items
        let nextCursor = null;
        if (hasNextPage && lastEvaluatedKey) {
            nextCursor = Buffer.from(JSON.stringify(lastEvaluatedKey)).toString('base64');
        }

        // console.log(`Returning ${items.length} characters, hasNextPage: ${hasNextPage}`);

        return {
            items,
            nextCursor,
            hasNextPage,
            totalCount: null // DynamoDB doesn't easily provide total count without full scan
        };

    } catch (error) {
        console.error('Error listing characters from DynamoDB:', error);
        throw new Error(`Error fetching characters: ${error.message}`);
    }
};

// Helper functions
function addStringFilter(stringFilter, fieldName, attributeName, filterExpressions, expressionAttributeNames, expressionAttributeValues) {
    if (stringFilter.eq) {
        filterExpressions.push(`${attributeName} = :${fieldName}_eq`);
        expressionAttributeNames[attributeName] = fieldName;
        expressionAttributeValues[`:${fieldName}_eq`] = stringFilter.eq;
    }
    if (stringFilter.contains) {
        filterExpressions.push(`contains(${attributeName}, :${fieldName}_contains)`);
        expressionAttributeNames[attributeName] = fieldName;
        expressionAttributeValues[`:${fieldName}_contains`] = stringFilter.contains;
    }
    if (stringFilter.beginsWith) {
        filterExpressions.push(`begins_with(${attributeName}, :${fieldName}_beginsWith)`);
        expressionAttributeNames[attributeName] = fieldName;
        expressionAttributeValues[`:${fieldName}_beginsWith`] = stringFilter.beginsWith;
    }
}

function addNumericFilter(numericFilter, fieldName, attributeName, filterExpressions, expressionAttributeNames, expressionAttributeValues) {
    expressionAttributeNames[attributeName] = fieldName;
    
    if (numericFilter.eq) {
        filterExpressions.push(`${attributeName} = :${fieldName}_eq`);
        expressionAttributeValues[`:${fieldName}_eq`] = numericFilter.eq;
    }
    if (numericFilter.ne) {
        filterExpressions.push(`${attributeName} <> :${fieldName}_ne`);
        expressionAttributeValues[`:${fieldName}_ne`] = numericFilter.ne;
    }
    if (numericFilter.lt) {
        filterExpressions.push(`${attributeName} < :${fieldName}_lt`);
        expressionAttributeValues[`:${fieldName}_lt`] = numericFilter.lt;
    }
    if (numericFilter.le) {
        filterExpressions.push(`${attributeName} <= :${fieldName}_le`);
        expressionAttributeValues[`:${fieldName}_le`] = numericFilter.le;
    }
    if (numericFilter.gt) {
        filterExpressions.push(`${attributeName} > :${fieldName}_gt`);
        expressionAttributeValues[`:${fieldName}_gt`] = numericFilter.gt;
    }
    if (numericFilter.ge) {
        filterExpressions.push(`${attributeName} >= :${fieldName}_ge`);
        expressionAttributeValues[`:${fieldName}_ge`] = numericFilter.ge;
    }
    if (numericFilter.between && Array.isArray(numericFilter.between) && numericFilter.between.length === 2) {
        filterExpressions.push(`${attributeName} BETWEEN :${fieldName}_between_low AND :${fieldName}_between_high`);
        expressionAttributeValues[`:${fieldName}_between_low`] = numericFilter.between[0];
        expressionAttributeValues[`:${fieldName}_between_high`] = numericFilter.between[1];
    }
}

function addAttributeFilter(attributeFilter, fieldName, filterExpressions, expressionAttributeNames, expressionAttributeValues) {
    const attributeName = `#${fieldName}`;
    
    if (attributeFilter.isGrouped !== undefined) {
        filterExpressions.push(`${attributeName}.#attr.#isGrouped = :${fieldName}_isGrouped`);
        expressionAttributeNames[attributeName] = fieldName;
        expressionAttributeNames['#attr'] = 'attribute';
        expressionAttributeNames['#isGrouped'] = 'isGrouped';
        expressionAttributeValues[`:${fieldName}_isGrouped`] = attributeFilter.isGrouped;
    }
    
    if (attributeFilter.attributeValue) {
        const valuePath = `${attributeName}.#attr.#attributeValue`;
        expressionAttributeNames[attributeName] = fieldName;
        expressionAttributeNames['#attr'] = 'attribute';
        expressionAttributeNames['#attributeValue'] = 'attributeValue';
        
        addFloatFilter(attributeFilter.attributeValue, `${fieldName}_attributeValue`, valuePath, filterExpressions, expressionAttributeNames, expressionAttributeValues);
    }
}

function addFloatFilter(floatFilter, fieldName, attributePath, filterExpressions, expressionAttributeNames, expressionAttributeValues) {
    if (floatFilter.eq) {
        filterExpressions.push(`${attributePath} = :${fieldName}_eq`);
        expressionAttributeValues[`:${fieldName}_eq`] = floatFilter.eq;
    }
    if (floatFilter.ne) {
        filterExpressions.push(`${attributePath} <> :${fieldName}_ne`);
        expressionAttributeValues[`:${fieldName}_ne`] = floatFilter.ne;
    }
    if (floatFilter.lt) {
        filterExpressions.push(`${attributePath} < :${fieldName}_lt`);
        expressionAttributeValues[`:${fieldName}_lt`] = floatFilter.lt;
    }
    if (floatFilter.le) {
        filterExpressions.push(`${attributePath} <= :${fieldName}_le`);
        expressionAttributeValues[`:${fieldName}_le`] = floatFilter.le;
    }
    if (floatFilter.gt) {
        filterExpressions.push(`${attributePath} > :${fieldName}_gt`);
        expressionAttributeValues[`:${fieldName}_gt`] = floatFilter.gt;
    }
    if (floatFilter.ge) {
        filterExpressions.push(`${attributePath} >= :${fieldName}_ge`);
        expressionAttributeValues[`:${fieldName}_ge`] = floatFilter.ge;
    }
    if (floatFilter.between && Array.isArray(floatFilter.between) && floatFilter.between.length === 2) {
        filterExpressions.push(`${attributePath} BETWEEN :${fieldName}_between_low AND :${fieldName}_between_high`);
        expressionAttributeValues[`:${fieldName}_between_low`] = floatFilter.between[0];
        expressionAttributeValues[`:${fieldName}_between_high`] = floatFilter.between[1];
    }
}

function applySorting(items, sortOptions) {
    return items.sort((a, b) => {
        for (const sortOption of sortOptions) {
            const { field, direction } = sortOption;
            
            let aValue = getNestedValue(a, field);
            let bValue = getNestedValue(b, field);
            
            // Handle null/undefined values
            if (aValue == null && bValue == null) continue;
            if (aValue == null) return direction === 'ASC' ? -1 : 1;
            if (bValue == null) return direction === 'ASC' ? 1 : -1;
            
            // Convert to comparable values
            if (typeof aValue === 'string') aValue = aValue.toLowerCase();
            if (typeof bValue === 'string') bValue = bValue.toLowerCase();
            
            let comparison = 0;
            if (aValue < bValue) comparison = -1;
            else if (aValue > bValue) comparison = 1;
            
            if (comparison !== 0) {
                return direction === 'ASC' ? comparison : -comparison;
            }
        }
        return 0;
    });
}

function getNestedValue(obj, path) {
    // Handle nested paths like "attribute.attributeValue"
    const parts = path.split('.');
    let value = obj;
    
    for (const part of parts) {
        if (value == null) return null;
        value = value[part];
    }
    
    return value;
}