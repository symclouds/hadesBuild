import { CreateAccessKeyCommand, DeleteAccessKeyCommand, ListAccessKeysCommand, IAMClient } from "@aws-sdk/client-iam";
import { GetRestApisCommand, APIGatewayClient, GetApiKeysCommand } from "@aws-sdk/client-api-gateway";

// Configure AWS SDK
const iamClient = new IAMClient({});
const apiClient = new APIGatewayClient({});

// Constants
const apiName = "erasure";
const stageName = "fec"
const iamUser = "api-user";
const region = process.env.AWS_REGION;

export const handler = async (event) => {
  //console.log(JSON.stringify(event));
  
  // User Bootstraps using the current access keys
  // This function: 
  // 0. Receives 2 header parameter: x-format: 'base64' or 'qr' x-access-id: 'asdfasdfasdfasdf'
  // 1. generates new access keys for user (cerberus-iam-user)
  // 2. deletes the bootstrap keys for user (cerberus-iam-user)
  // 3. if base64: generates base64 string of enpoint url, region, key id, secret 
  //    if qr: generates qr code of enpoint url, region, key id, secret
  // 4. if base64: returns the base64 string in the body of message
  //    if qr: generates the QR Code and prints it to console 
  
  // Get the REST API ID for 'erasure' API
  let input = { 
    position: null,
    limit: Number("10"),
  };
  let command = new GetRestApisCommand(input);
  let response = await apiClient.send(command);
  let apiID = null;
  for(let i = 0; i < response.items.length; i++) {
    if(response.items[i].name == apiName)
      apiID = response.items[i].id;
  }
  // Construct StateURI Endpoint for return statement
  const stageURI = "https://" + apiID + ".execute-api." + region + ".amazonaws.com/" + stageName + "/";
  
  // Get the existing IAM User's Access Key IDs and Delete them all
  input = {                                               // ListAccessKeysRequest
    UserName: iamUser,
    Marker: null,
    MaxItems: Number("10"),
  };
  command = new ListAccessKeysCommand(input);
  const keys = await iamClient.send(command);
  const numKeys = keys.AccessKeyMetadata.length;
  for(let i = 0; i<numKeys; i++) {
    input = {                                           // DeleteAccessKeyRequest
      UserName: iamUser,
      AccessKeyId: keys.AccessKeyMetadata[i].AccessKeyId,
    };
    command = new DeleteAccessKeyCommand(input);
    response = await iamClient.send(command);
  }
  
  // Generate a new access key for the iam user:        // CreateAccessKeyRequest
  command = new CreateAccessKeyCommand({ UserName: iamUser });
  const key = await iamClient.send(command);
  const newAccessKeyId = key.AccessKey.AccessKeyId;
  const newSecretAccessKey = key.AccessKey.SecretAccessKey;

  // Get the API KEY for the erasure api
  let apiKey;
  input = { // GetApiKeysRequest
    position: null,
    limit: Number("10"),
    includeValues: true
  };
  command = new GetApiKeysCommand(input);
  response = await apiClient.send(command);
  // Loop over all returned keys and find the one named 'hades'
  response.items.forEach(key => {
      if(key.name === 'hades') {
        apiKey = key.value;
      }
  });

  // Get the storage ID from the environment variables 
  // it will be base64 encoded
  let storageID = process.env.storageID;

  
  // Generate Return json data structure
  const result = {
    endpointUri: stageURI,
    accessKeyId: newAccessKeyId,
    accessKeySecret: newSecretAccessKey,
    region: region,
    apiKey: apiKey,
    storageID: storageID
  }
  
  // Print return string to console for cases that it needs to be copied
  console.log(JSON.stringify(result));

  // Base64 encode the returned information
  let stringResult = new Buffer.from(JSON.stringify(result));
  let base64data = stringResult.toString('base64');
  
  try
  {
    const resp = {
      "statusCode": 200,
      "isBase64Encoded": true,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: base64data,
    };
    return resp;
  }
  // Catch and throw errors
  catch (e)
  {
    console.log("Failure In Sending E-Mail!", e);
  }
};