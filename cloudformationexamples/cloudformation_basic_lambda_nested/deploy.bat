
set BUCKET_NAME=cloudformation.conygre.com
set S3_PREFIX=nestedstack
set STACK_NAME=NestedStack

# 1. Remove any previous zipped up lambda code
del lambda.zip

# 2. Create the zip of the Lambda code
powershell Compress-Archive ./lambda/* lambda.zip

# 3. Upload the Lambda code to an S3 bucket that you have access to along with the two templates
aws s3 cp lambda.zip s3://%BUCKET_NAME%/%S3_PREFIX%/lambda.zip
aws s3 cp lambda_template.yaml s3://%BUCKET_NAME%/%S3_PREFIX%/lambda_template.yaml
aws s3 cp network_template.yaml s3://%BUCKET_NAME%/%S3_PREFIX%/network_template.yaml


#4. Deploy the Cloudformation template to your cloud account
aws cloudformation deploy --template-file main_template.yaml --stack-name %STACK_NAME% --capabilities CAPABILITY_IAM --parameter-overrides UploadBucketName=%BUCKET_NAME% UploadS3KeyPrefix=%S3_PREFIX%


