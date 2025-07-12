const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

/**
 * Build and package multiple Lambda functions using esbuild
 */
async function buildLambdas() {
  try {
    console.log("🔨 Building Lambda functions with esbuild...");

    // Ensure the dist and zipped-lambdas directories exist
    const distDir = path.join(__dirname, "dist");
    const zippedDir = path.join(__dirname, "zipped-lambdas");

    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }
    if (!fs.existsSync(zippedDir)) {
      fs.mkdirSync(zippedDir, { recursive: true });
    }

    // Get all TypeScript files from the lambda directory
    const lambdaDir = path.join(__dirname, "lambda");
    const lambdaFiles = fs
      .readdirSync(lambdaDir)
      .filter((file) => file.endsWith(".ts"))
      .map((file) => file.replace(".ts", ""));

    console.log(
      `📁 Found ${lambdaFiles.length} Lambda functions: ${lambdaFiles.join(
        ", "
      )}`
    );

    // Build each Lambda function
    for (const lambdaName of lambdaFiles) {
      console.log(`\n🔨 Building ${lambdaName}...`);

      const entryPoint = path.join(lambdaDir, `${lambdaName}.ts`);
      const outFile = path.join(distDir, `${lambdaName}.js`);
      const zipFile = path.join(zippedDir, `${lambdaName}.zip`);

      // Build with esbuild
      await esbuild.build({
        entryPoints: [entryPoint],
        bundle: true,
        outfile: outFile,
        platform: "node",
        target: "node20",
        format: "cjs",
        external: ["aws-sdk"], // AWS SDK is provided by Lambda runtime
        minify: false, // Keep readable for debugging
        sourcemap: true,
        define: {
          "process.env.NODE_ENV": '"production"',
        },
      });

      // Zip the bundled file
      try {
        execSync(`zip -j "${zipFile}" "${outFile}"`, { stdio: "inherit" });
        console.log(`✅ Bundled and zipped ${lambdaName} -> ${zipFile}`);
      } catch (zipError) {
        console.error(`❌ Failed to zip ${lambdaName}:`, zipError.message);
        // Continue with other lambdas even if one fails to zip
      }
    }

    console.log("\n🎉 All Lambda functions built and zipped successfully!");
    console.log(`📁 Bundled files: ${distDir}`);
    console.log(`📦 Zipped packages: ${zippedDir}`);
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

// Run the build
buildLambdas();
