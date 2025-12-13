import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Generate TypeScript type
async function generateIconTypes() {
    // Read all files in the icons folder
    const files = fs.readdirSync(__dirname)

    // Extract file names without extensions
    const iconNames = files
        .filter((file) => file.endsWith(".svg")) // Only include .svg files
        .map((file) => path.basename(file, ".svg"))

    // Generate the TypeScript type
    const typeDefinition = `export type IconName = ${iconNames
        .map((name) => `"${name}"`)
        .join(" | ")};\n`

    // Define the output path (3 levels up + /src/lib/types/Icons.ts)
    const outputPath = path.join(__dirname, "../../../src/lib/types/IconName.ts")

    // Ensure the directory exists
    const outputDir = path.dirname(outputPath)
    fs.mkdirSync(outputDir, { recursive: true })

    // Write the output to a file
    fs.writeFileSync(outputPath, typeDefinition)

    console.log(`TypeScript type written to: ${outputPath}`)
    console.log(typeDefinition)
}

// Run the script
generateIconTypes()
