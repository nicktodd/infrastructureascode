# cloudformationexamples
Sample CloudFormation Deployment Options

There are four demos in this repository.

1. Deploy a basic Lambda using Cloudformation
2. Deploy a VPC and a Lambda into the VPC using nested stacks for the VPC and the Lambda
In this example, the public subnet and security group ID of the VPC from the network template are shared with the Lambda template.
3. Deploy a VPC and a Lambda into the VPC, but using two separate stacks where output variables from the network stack are then used by the Lambda stack.
4. Deploy a Lambda and a Step Functions state machine using two separate stacks.

The deployed artifacts are deliberately very basic, so focus on the principles of how nested stacks and output variables with Cloudformation works.

## How to Deploy Yourself at the Command Line
We suggest you begin with the cloudformation_basic_lambda example before moving on to more advanced examples.

1. First, you will need to have a machine with the AWS CLI installed on it. If you do not have access to a machine with the AWS CLI, then we recommend you launch a Cloud9 Environment on AWS. You can use this to checkout the code and run the example. The project assumes your default region is eu-west-1.
2. Clone the repository onto the machine where you plan to complete the deployment from.
3. If you are on Windows, open the `cloudformation_basic_lambda\deploy.bat` file. On Linux, Mac, or Cloud9, open `cloudformation_basic_lambda\deploy.sh`
4. Edit the BUCKET_NAME variable to be a bucket you have in the account you are using (create a bucket if you need to).
5. Edit the S3_PATH variable to be a folder you would like to use in the bucket for the Lambda function. 
6. Edit the STACK_NAME variable to be a name that you can use. If you are doing this exercise with others, we recommend using your name or initials in the name somewhere.
7. Review the contents of the file, and then from a terminal, run the script.
8. Using the AWS Web console, go the CloudFormation service, and locate your deployment. You should see it going through correctly.
9. If it is appearing with ROLLBACK_COMPLETE. Review the Events tab to see what went wrong, delete the stack and then try running the script again.

## To Run via an Azure Devops Pipeline
The `cloudformation_basic_lambda` folder already has an AzureDevops pipeline file ready to be executed. If you wish to try it yourself, you will need a Git repository and access to an AzureDevops project.

1. Clone this Git project into a project of your own.
2. Review the azure-pipelines.yaml pipeline file. If you are using your own account, you will need to set the bucket name to match a bucket in your account. Change the StackSet name to be something unique if you are using a shared account.
3. Now login to your AzureDevops console and create a new Pipeline. When prompted, connect it to your GitHub and specify that you have an existing pipeline file. Reference the azure-pipelines.yaml file that is in the project.
4. Before you run it, you must set two variables on the pipeline. They are the `AWS.AccessKeyID` and the `AWS.SecretAccessKey`. Set those variables as secrets and use an appropriate access key and secret key.
5. Now you can run your pipeline.
