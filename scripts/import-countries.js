const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function importCountries() {
  try {
    const csvFilePath = path.resolve(__dirname, "./data/countries.csv");
    const csvData = fs.readFileSync(csvFilePath, "utf-8");

    const rows = csvData.split("\n").map((row) =>
      row
        .replace('"', "")
        .split(",")
        .map((value) => value.trim())
    );

    const [headers, ...data] = rows;

    const countriesToCreate = [];

    for (const row of data) {
      if (row[0] && row[1]) {
        let data = {
          nameInHebrew: row[1],
          code: row[0],
        };
        countriesToCreate.push(data);
      }
    }
    if (countriesToCreate.length > 0) {
      await prisma.country.createMany({
        data: countriesToCreate,
      });
    }
    console.log("Countries imported successfully");
  } catch (error) {
    console.error("Error importing data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

importCountries();
