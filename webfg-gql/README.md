# WEBFG GraphQL API

This is the GraphQL API for the Webfg project.

## Deployment

### `npm run build:schema`

This will build the schema and save it to the `schemas` folder. Then upload to S3

### `sam build`

This will build the SAM template.

### `sam deploy`

This will deploy the SAM template. Make sure to update the template with the latest schema from S3.

# Trigger GitHub Actions
