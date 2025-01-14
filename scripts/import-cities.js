const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function importCities() {
  try {
    const csvFilePath = path.resolve(__dirname, "./data/cities.csv");
    const csvData = fs.readFileSync(csvFilePath, "utf-8");

    const rows = csvData.split("\n").map((row) =>
      row
        .replace('"', "")
        .split(",")
        .map((value) => value.trim())
    );

    const [headers, ...data] = rows;

    const dataToSave = [];

    for (const row of data) {
      if (row[0]?.trim?.() && row[1]?.trim?.()) {
        dataToSave.push({
          nameInHebrew: row[0]?.trim?.(),
          cityCode: row[1],
        });
      }
    }

    const existing = await prisma.city.findMany({
      where: {
        cityCode: {
          in: dataToSave.map((city) => city.cityCode),
        },
      },
    });
    const existingCityCodes = existing.map((city) => city.cityCode);
    const newData = dataToSave.filter(
      (city) => !existingCityCodes.includes(city.cityCode)
    );

    if (existing.length) {
      let countOfUpdates = 0;
      for (const city of existing) {
        const updatedCity = dataToSave.find(
          (newCity) => newCity.cityCode === city.cityCode
        );
        if (updatedCity) {
          await prisma.city.update({
            where: {
              id: city.id,
            },
            data: updatedCity,
          });
          countOfUpdates++;
        }
      }
    }
    if (newData.length === 0) {
      return;
    }
    await prisma.city.createMany({
      data: newData,
    });
    console.log(`${newData.length} cities imported successfully`);
  } catch (error) {
    console.error("Error importing data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

importCities();
