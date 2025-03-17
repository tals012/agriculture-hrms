import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 }
      );
    }

    const templatesDir = path.join(process.cwd(), "data", "templates");
    const filePath = path.join(templatesDir, `${name}.json`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Read and parse the template file
    const templateJson = JSON.parse(fs.readFileSync(filePath, "utf8"));

    return NextResponse.json(templateJson);
  } catch (error) {
    console.error("Error getting predefined template:", error);
    return NextResponse.json(
      { error: "Failed to get template" },
      { status: 500 }
    );
  }
}
