const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');

// Stack name is used to get the exported bucket name
const STACK_NAME = process.env.STACK_NAME || 'webfg-gql';
// Allow direct specification of bucket name to bypass CloudFormation lookups
const MANUAL_BUCKET_NAME = process.env.SCHEMA_S3_BUCKET || '';
const s3Key = process.env.SCHEMA_S3_KEY || 'schemas/schema_v5.graphql';
const outputFile = path.join(__dirname, '../schema.graphql');

// Function to get the S3 bucket name using multiple strategies
function getSchemaS3BucketName() {
  // 1. If manually specified, use that
  if (MANUAL_BUCKET_NAME) {
    console.log(`Using manually specified bucket: ${MANUAL_BUCKET_NAME}`);
    return MANUAL_BUCKET_NAME;
  }
  
  try {
    // 2. Try to find the bucket from stack resources directly
    console.log(`Looking for schema bucket in stack ${STACK_NAME} resources...`);
    
    // Get all resources for the stack that are S3 buckets
    const stackResourcesCommand = `aws cloudformation list-stack-resources --stack-name ${STACK_NAME}`;
    const resources = JSON.parse(execSync(stackResourcesCommand, { encoding: 'utf-8' }));
    
    // Find bucket resources that match our naming pattern
    const bucketResources = resources.StackResourceSummaries.filter(resource => 
      resource.ResourceType === 'AWS::S3::Bucket' && 
      resource.PhysicalResourceId.includes('schema')
    );
    
    if (bucketResources.length > 0) {
      const bucketName = bucketResources[0].PhysicalResourceId;
      console.log(`Found schema bucket in stack resources: ${bucketName}`);
      return bucketName;
    }
    
    // 3. Try from exports as originally implemented
    console.log(`No schema bucket found in resources, trying exports...`);
    const exportsCommand = `aws cloudformation list-exports --query "Exports[?Name=='${STACK_NAME}-SchemaS3BucketName'].Value" --output text`;
    const bucketName = execSync(exportsCommand, { encoding: 'utf-8' }).trim();
    
    if (bucketName && bucketName !== 'None') {
      console.log(`Found schema bucket in exports: ${bucketName}`);
      return bucketName;
    }
    
    // 4. Hardcode the bucket name based on the pattern we know
    console.log(`No exports found, trying default bucket name pattern...`);
    const region = process.env.AWS_REGION || 'us-east-1';
    const accountId = execSync('aws sts get-caller-identity --query "Account" --output text', { encoding: 'utf-8' }).trim();
    const defaultBucketName = `${STACK_NAME}-schema-${accountId}-${region}`;
    
    // Check if bucket exists
    try {
      execSync(`aws s3api head-bucket --bucket ${defaultBucketName}`, { stdio: 'ignore' });
      console.log(`Found bucket using default pattern: ${defaultBucketName}`);
      return defaultBucketName;
    } catch (e) {
      console.error(`Bucket ${defaultBucketName} could not be accessed.`);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting S3 bucket name:', error.message);
    return null;
  }
}

// Function to combine schemas in specific order
function combineSchemas() {
  // Define schema files in the specific order you want them combined
  const schemaFiles = [
    'Character.graphql',
    'Attributes.graphql',
    'Skills.graphql',
    'Stats.graphql',
    'Physical.graphql',
    'Equipment.graphql',
    'Object.graphql',
    'Action.graphql',
    'Schema.graphql',
    'Encounter.graphql'
  ];
  
  console.log('Combining schema files in specified order...');
  
  let combinedSchema = '';
  
  // Combine files in the specified order
  schemaFiles.forEach(filename => {
    const filePath = path.join(__dirname, filename);
    
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        combinedSchema += content + '\n\n';
        console.log(`Added schema from ${filename}`);
      } else {
        console.warn(`Warning: File ${filename} not found, skipping`);
      }
    } catch (error) {
      console.error(`Error reading ${filename}:`, error.message);
    }
  });
  
  if (!combinedSchema) {
    console.error('No schema content generated!');
    return false;
  }
  
  // Write the combined schema to the output file
  try {
    fs.writeFileSync(outputFile, combinedSchema);
    console.log(`Combined schema written to ${outputFile}`);
    return true;
  } catch (error) {
    console.error('Error writing combined schema:', error.message);
    return false;
  }
}

// Function to upload schema to S3
function uploadToS3(s3Bucket) {
  return new Promise((resolve, reject) => {
    console.log(`Uploading schema to s3://${s3Bucket}/${s3Key}...`);
    
    exec(`aws s3 cp ${outputFile} s3://${s3Bucket}/${s3Key}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error uploading to S3: ${error.message}`);
        reject(error);
        return;
      }
      console.log(`Schema successfully uploaded to S3`);
      console.log(stdout);
      resolve();
    });
  });
}

// Main execution
async function main() {
  // First get the S3 bucket name from CloudFormation
  const s3Bucket = getSchemaS3BucketName();
  
  if (!s3Bucket) {
    console.error('Failed to get S3 bucket name. Please specify manually with SCHEMA_S3_BUCKET environment variable.');
    console.error('Example: SCHEMA_S3_BUCKET=webfg-gql-schema-519721258290-us-east-1 npm run build:schema');
    process.exit(1);
  }
  
  // Then combine schemas and upload
  if (combineSchemas()) {
    try {
      await uploadToS3(s3Bucket);
      console.log('\nSchema successfully combined and uploaded!');
      console.log(`S3 Location: s3://${s3Bucket}/${s3Key}`);
    } catch (error) {
      console.error('Failed to complete S3 upload process');
      process.exit(1);
    }
  } else {
    console.error('Failed to combine schemas, exiting');
    process.exit(1);
  }
}

main();
