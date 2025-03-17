import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const templatesDir = path.join(process.cwd(), "data", "templates");

    // Return empty array if directory doesn't exist
    if (!fs.existsSync(templatesDir)) {
      return NextResponse.json([]);
    }

    // Read all template files
    const files = fs.readdirSync(templatesDir);
    const templates = files
      .filter((file) => file.endsWith(".json"))
      .map((file) => ({
        name: path.basename(file, ".json"),
        path: file,
      }));

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error listing predefined templates:", error);
    return NextResponse.json(
      { error: "Failed to list templates" },
      { status: 500 }
    );
  }
}
