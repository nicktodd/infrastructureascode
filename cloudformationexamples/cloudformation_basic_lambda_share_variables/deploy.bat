rem TODO set this value before you launch the stack to be the name of your bucket that the archives will be placed into
set BUCKET_NAME=cloudformation.conygre.com
set S3_PREFIX=sharedvariables
set STACK_NAME=SharedVariables

# 1. Remove any previous zipped up lambda code
del lambda.zip

# 2. Create the zip of the Lambda code
powershell Compress-Archive ./lambda/* lambda.zip

# 3. Upload the Lambda code to an S3 bucket that you have access to
aws s3 cp lambda.zip s3://%BUCKET_NAME%/%S3_PREFIX%/lambda.zip

#4. Deploy the Cloudformation template to your cloud account
aws cloudformation deploy --template-file network_template.yaml --stack-name %STACK_NAME%Network --capabilities CAPABILITY_IAM --parameter-overrides UploadBucketName=%BUCKET_NAME% UploadS3KeyPrefix=%S3_PREFIX%
aws cloudformation deploy --template-file lambda_template.yaml --stack-name %STACK_NAME%Lambda --capabilities CAPABILITY_IAM --parameter-overrides UploadBucketName=%BUCKET_NAME% UploadS3KeyPrefix=%S3_PREFIX%

