const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const ACTIONS_TABLE_NAME = process.env.ACTIONS_TABLE_NAME;

// Default and maximum pagination limits
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

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
        TableName: ACTIONS_TABLE_NAME,
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
            // Also search in description field for actions
            filterExpressions.push('(contains(#name, :search) OR (attribute_exists(#nameLowerCase) AND contains(#nameLowerCase, :searchLower)) OR contains(#description, :search))');
            expressionAttributeNames['#name'] = 'name';
            expressionAttributeNames['#nameLowerCase'] = 'nameLowerCase';
            expressionAttributeNames['#description'] = 'description';
            expressionAttributeValues[':search'] = filter.search;
            expressionAttributeValues[':searchLower'] = filter.search.toLowerCase();
        }

        // Basic string filters
        if (filter.name) {
            addStringFilter(filter.name, 'name', '#name', filterExpressions, expressionAttributeNames, expressionAttributeValues);
        }

        if (filter.description) {
            addStringFilter(filter.description, 'description', '#description', filterExpressions, expressionAttributeNames, expressionAttributeValues);
        }

        // Enum filters
        if (filter.actionCategory) {
            filterExpressions.push('#actionCategory = :actionCategory');
            expressionAttributeNames['#actionCategory'] = 'actionCategory';
            expressionAttributeValues[':actionCategory'] = filter.actionCategory;
        }

        if (filter.sourceAttribute) {
            filterExpressions.push('#sourceAttribute = :sourceAttribute');
            expressionAttributeNames['#sourceAttribute'] = 'sourceAttribute';
            expressionAttributeValues[':sourceAttribute'] = filter.sourceAttribute;
        }

        if (filter.targetAttribute) {
            filterExpressions.push('#targetAttribute = :targetAttribute');
            expressionAttributeNames['#targetAttribute'] = 'targetAttribute';
            expressionAttributeValues[':targetAttribute'] = filter.targetAttribute;
        }

        if (filter.targetType) {
            filterExpressions.push('#targetType = :targetType');
            expressionAttributeNames['#targetType'] = 'targetType';
            expressionAttributeValues[':targetType'] = filter.targetType;
        }

        if (filter.effectType) {
            filterExpressions.push('#effectType = :effectType');
            expressionAttributeNames['#effectType'] = 'effectType';
            expressionAttributeValues[':effectType'] = filter.effectType;
        }

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
        console.log("Executing Scan with params:", JSON.stringify(params, null, 2));
        
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

        console.log(`Returning ${items.length} actions, hasNextPage: ${hasNextPage}`);

        return {
            items,
            nextCursor,
            hasNextPage,
            totalCount: null // DynamoDB doesn't easily provide total count without full scan
        };

    } catch (error) {
        console.error('Error listing actions from DynamoDB:', error);
        throw new Error(`Error fetching actions: ${error.message}`);
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
    // Handle nested paths
    const parts = path.split('.');
    let value = obj;
    
    for (const part of parts) {
        if (value == null) return null;
        value = value[part];
    }
    
    return value;
}