import * as fs from "fs";
import yaml from "js-yaml";
import path from "path";

console.log("Reforging Symlinks");

// Check if we're running in WSL
const isWSL =
	process.platform === "linux" &&
	fs.existsSync("/proc/version") &&
	fs.readFileSync("/proc/version", "utf8").toLowerCase().includes("wsl");

if (isWSL) {
	console.log("Detected WSL environment");
}

// Helper function to convert Windows paths to WSL paths
function windowsToWSLPath(windowsPath) {
	if (!isWSL || !windowsPath.match(/^[A-Za-z]:\\/)) {
		return windowsPath;
	}

	// Convert C:\path\to\file to /mnt/c/path/to/file
	const drive = windowsPath[0].toLowerCase();
	const pathWithoutDrive = windowsPath.slice(3); // Remove "C:\"
	return `/mnt/${drive}/${pathWithoutDrive.replace(/\\/g, "/")}`;
}

// Helper function to create symlinks with proper cross-platform support
async function createSymlink(target, linkPath) {
	try {
		console.log(`Creating symlink: ${linkPath} -> ${target}`);

		// Check if target exists and determine type
		const targetStats = await fs.promises.stat(target);
		const symlinkType = targetStats.isDirectory() ? "dir" : "file";

		// Create the symlink
		await fs.promises.symlink(target, linkPath, symlinkType);
		console.log(`✓ Successfully created ${symlinkType} symlink`);
	} catch (error) {
		if (error.code === "EEXIST") {
			console.log(`⚠ Symlink already exists: ${linkPath}`);
		} else if (error.code === "EPERM") {
			if (isWSL) {
				console.error(
					`❌ Permission denied. In WSL, try running with sudo if needed.`,
				);
			} else {
				console.error(
					`❌ Permission denied. On Windows, you need to either:`,
				);
				console.error(`   1. Run as Administrator, OR`);
				console.error(
					`   2. Enable Developer Mode in Windows Settings`,
				);
			}
			throw error;
		} else {
			console.error(`❌ Failed to create symlink: ${error.message}`);
			throw error;
		}
	}
}

if (fs.existsSync("foundry-config.yaml")) {
	let fileRoot = "";
	try {
		const fc = await fs.promises.readFile("foundry-config.yaml", "utf-8");

		const foundryConfig = yaml.load(fc);

		// Convert Windows path to WSL path if needed
		let installPath = foundryConfig.installPath;
		if (isWSL) {
			installPath = windowsToWSLPath(installPath);
			console.log(
				`Converted Windows path to WSL: ${foundryConfig.installPath} -> ${installPath}`,
			);
		}

		// As of 13.338, the Node install is *not* nested but electron installs *are*
		const nested = fs.existsSync(
			path.join(installPath, "resources", "app"),
		);

		if (nested) fileRoot = path.join(installPath, "resources", "app");
		else fileRoot = installPath;

		console.log(`Using Foundry installation at: ${fileRoot}`);
	} catch (err) {
		console.error(`Error reading foundry-config.yaml: ${err}`);
		process.exit(1);
	}

	try {
		await fs.promises.mkdir("foundry", { recursive: true });
		console.log("Created foundry directory");
	} catch (e) {
		if (e.code !== "EEXIST") {
			console.error(`Failed to create foundry directory: ${e.message}`);
			throw e;
		}
	}

	// Javascript files
	console.log("\nCreating JavaScript file symlinks...");
	for (const p of ["client", "common", "tsconfig.json"]) {
		const targetPath = path.join(fileRoot, p);
		const linkPath = path.join("foundry", p);

		// Check if target exists before trying to create symlink
		if (fs.existsSync(targetPath)) {
			await createSymlink(targetPath, linkPath);
		} else {
			console.log(
				`⚠ Skipping ${p} - target does not exist at ${targetPath}`,
			);
		}
	}

	// Language files
	console.log("\nCreating language file symlinks...");
	const langTargetPath = path.join(fileRoot, "public", "lang");
	const langLinkPath = path.join("foundry", "lang");

	if (fs.existsSync(langTargetPath)) {
		await createSymlink(langTargetPath, langLinkPath);
	} else {
		console.log(
			`⚠ Skipping lang - target does not exist at ${langTargetPath}`,
		);
	}

	console.log("\n✓ Symlink creation completed!");
} else {
	console.log("❌ Foundry config file did not exist.");
	process.exit(1);
}
