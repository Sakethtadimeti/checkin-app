import {
  LambdaClient,
  UpdateFunctionCodeCommand,
  UpdateFunctionConfigurationCommand,
  GetFunctionCommand,
  AddPermissionCommand,
  CreateFunctionCommand,
} from "@aws-sdk/client-lambda";
import {
  APIGatewayClient,
  CreateRestApiCommand,
  GetResourcesCommand,
  CreateResourceCommand,
  PutMethodCommand,
  PutIntegrationCommand,
  CreateDeploymentCommand,
  GetRestApisCommand,
  DeleteRestApiCommand,
  PutMethodResponseCommand,
  PutIntegrationResponseCommand,
} from "@aws-sdk/client-api-gateway";
import { readFileSync } from "fs";
import { join } from "path";

// Accessing localstack from the host machine
// so the endpoint is the host machine's ip address
// TODO: read from env file
const endpoint = "http://localhost:4566";
const region = "us-east-1";
const credentials = {
  accessKeyId: "test",
  secretAccessKey: "test",
};

const lambdaClient = new LambdaClient({ endpoint, region, credentials });
const apiGatewayClient = new APIGatewayClient({
  endpoint,
  region,
  credentials,
});

interface LambdaConfig {
  name: string;
  handler: string;
  path: string;
  method: string;
}

const lambdaConfigs: LambdaConfig[] = [
  {
    name: "getUsers",
    handler: "getUsers.handler",
    path: "/users",
    method: "GET",
  },
  {
    name: "createCheckIn",
    handler: "createCheckIn.handler",
    path: "/checkins",
    method: "POST",
  },
  {
    name: "getCheckInsByManager",
    handler: "getCheckInsByManager.handler",
    path: "/checkins/manager",
    method: "GET",
  },
  {
    name: "getAssignedCheckIns",
    handler: "getAssignedCheckIns.handler",
    path: "/checkins/assigned",
    method: "GET",
  },
  {
    name: "submitResponse",
    handler: "submitResponse.handler",
    path: "/checkins/{checkInId}/responses",
    method: "POST",
  },
  {
    name: "getCheckInDetails",
    handler: "getCheckInDetails.handler",
    path: "/checkins/{checkInId}/details",
    method: "GET",
  },
  {
    name: "getMembersByManager",
    handler: "getMembersByManager.handler",
    path: "/users/manager/members",
    method: "GET",
  },
];

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function deploy() {
  console.log("\u{1F680} Starting deployment to LocalStack...");
  const apiId = await getOrCreateApi();
  const rootResource = await getRootResource(apiId);

  for (const config of lambdaConfigs) {
    await deployLambda(config);
    const resourceId = await createApiResource(apiId, rootResource.id!, config);
    await addCorsSupport(apiId, resourceId);
    await addLambdaPermission(config.name, apiId);
    await wait(1000);
  }

  await apiGatewayClient.send(
    new CreateDeploymentCommand({ restApiId: apiId, stageName: "dev" })
  );

  const baseUrl = `http://localhost:4566/restapis/${apiId}/dev/_user_request_`;
  console.log("\n\u{2705} Deployment successful!");
  console.log(`\u{1F310} Base URL: ${baseUrl}`);
  lambdaConfigs.forEach(({ method, path }) =>
    console.log(`${method} ${path}: curl ${baseUrl}${path}`)
  );
}

async function deployLambda({ name, handler }: LambdaConfig) {
  const zipPath = join(__dirname, "zipped-lambdas", `${name}.zip`);
  const zipBuffer = readFileSync(zipPath);

  try {
    await lambdaClient.send(new GetFunctionCommand({ FunctionName: name }));
    await lambdaClient.send(
      new UpdateFunctionCodeCommand({ FunctionName: name, ZipFile: zipBuffer })
    );
    await wait(1000);
    await lambdaClient.send(
      new UpdateFunctionConfigurationCommand({
        FunctionName: name,
        Environment: {
          Variables: {
            AWS_REGION: region,
            AWS_ACCESS_KEY_ID: "test",
            AWS_SECRET_ACCESS_KEY: "test",
            AWS_ENDPOINT: "http://localstack:4566",
            JWT_SECRET: "your-super-secret-jwt-key-change-in-production",
          },
        },
      })
    );
    await wait(1000);
    console.log(`\u{1F501} Updated Lambda: ${name}`);
  } catch (err: any) {
    if (err.name === "ResourceNotFoundException") {
      await lambdaClient.send(
        new CreateFunctionCommand({
          FunctionName: name,
          Runtime: "nodejs20.x",
          Role: "arn:aws:iam::000000000000:role/lambda-role",
          Handler: handler,
          Code: { ZipFile: zipBuffer },
          Environment: {
            Variables: {
              AWS_ENDPOINT: "http://localstack:4566",
              AWS_REGION: region,
              AWS_ACCESS_KEY_ID: "test",
              AWS_SECRET_ACCESS_KEY: "test",
              JWT_SECRET: "your-super-secret-jwt-key-change-in-production",
            },
          },
        })
      );
      await wait(1000);
      console.log(`🆕 Created Lambda: ${name}`);
    } else {
      throw err;
    }
  }
}

async function getOrCreateApi(): Promise<string> {
  const { items } = await apiGatewayClient.send(new GetRestApisCommand({}));
  const existing = items?.find((api) => api.name === "checkin-api");

  if (existing) {
    console.log(`🗑️ Deleting existing API: ${existing.id}`);
    await apiGatewayClient.send(
      new DeleteRestApiCommand({ restApiId: existing.id! })
    );
  }

  console.log(`🆕 Creating new API Gateway: checkin-api`);
  const created = await apiGatewayClient.send(
    new CreateRestApiCommand({
      name: "checkin-api",
      tags: { _custom_id_: "checkin-api" },
    })
  );
  console.log(`✅ Created new API with ID: ${created.id}`);
  return created.id!;
}

async function getRootResource(apiId: string) {
  const { items } = await apiGatewayClient.send(
    new GetResourcesCommand({ restApiId: apiId })
  );
  const root = items?.find((r) => r.path === "/");
  if (!root) throw new Error("Root resource not found");
  return root;
}

async function createApiResource(
  apiId: string,
  rootResourceId: string,
  config: LambdaConfig
): Promise<string> {
  const { name, path, method } = config;
  const segments = path.split("/").filter(Boolean);
  let parentId = rootResourceId;
  let resourceId = parentId;
  let currentPath = "";

  const { items: allResources } = await apiGatewayClient.send(
    new GetResourcesCommand({ restApiId: apiId })
  );

  for (const segment of segments) {
    currentPath += "/" + segment;
    let resource = allResources?.find((r) => r.path === currentPath);
    if (!resource) {
      const created = await apiGatewayClient.send(
        new CreateResourceCommand({
          restApiId: apiId,
          parentId,
          pathPart: segment,
        })
      );
      resourceId = created.id!;
      allResources?.push({ id: resourceId, path: currentPath } as any);
    } else {
      resourceId = resource.id!;
    }
    parentId = resourceId;
  }

  await apiGatewayClient.send(
    new PutMethodCommand({
      restApiId: apiId,
      resourceId,
      httpMethod: method,
      authorizationType: "NONE",
    })
  );

  const uri = `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${region}:000000000000:function:${name}/invocations`;

  await apiGatewayClient.send(
    new PutIntegrationCommand({
      restApiId: apiId,
      resourceId,
      httpMethod: method,
      type: "AWS_PROXY",
      integrationHttpMethod: "POST",
      uri,
    })
  );

  console.log(`\u{2705} Wired ${method} ${path} → ${name}`);
  return resourceId;
}

async function addCorsSupport(apiId: string, resourceId: string) {
  await apiGatewayClient.send(
    new PutMethodCommand({
      restApiId: apiId,
      resourceId,
      httpMethod: "OPTIONS",
      authorizationType: "NONE",
    })
  );

  await apiGatewayClient.send(
    new PutIntegrationCommand({
      restApiId: apiId,
      resourceId,
      httpMethod: "OPTIONS",
      type: "MOCK",
      requestTemplates: { "application/json": '{"statusCode": 200}' },
      integrationHttpMethod: "OPTIONS",
    })
  );

  await apiGatewayClient.send(
    new PutMethodResponseCommand({
      restApiId: apiId,
      resourceId,
      httpMethod: "OPTIONS",
      statusCode: "200",
      responseParameters: {
        "method.response.header.Access-Control-Allow-Origin": true,
        "method.response.header.Access-Control-Allow-Methods": true,
        "method.response.header.Access-Control-Allow-Headers": true,
      },
      responseModels: { "application/json": "Empty" },
    })
  );

  await apiGatewayClient.send(
    new PutIntegrationResponseCommand({
      restApiId: apiId,
      resourceId,
      httpMethod: "OPTIONS",
      statusCode: "200",
      responseParameters: {
        "method.response.header.Access-Control-Allow-Origin": "'*'",
        "method.response.header.Access-Control-Allow-Methods":
          "'GET,POST,OPTIONS'",
        "method.response.header.Access-Control-Allow-Headers":
          "'Content-Type,Authorization'",
      },
    })
  );
}

async function addLambdaPermission(functionName: string, apiId: string) {
  const statementId = `${functionName}-invoke`;
  try {
    await lambdaClient.send(
      new AddPermissionCommand({
        Action: "lambda:InvokeFunction",
        FunctionName: functionName,
        Principal: "apigateway.amazonaws.com",
        StatementId: statementId,
        SourceArn: `arn:aws:execute-api:${region}:000000000000:${apiId}/*/*/*`,
      })
    );
    console.log(`🔐 Added invoke permission for ${functionName}`);
  } catch (err: any) {
    if (err.name === "ResourceConflictException") {
      console.log(
        `⚠️  Permission for ${functionName} already exists. Skipping.`
      );
    } else {
      throw err;
    }
  }
}

deploy().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});
