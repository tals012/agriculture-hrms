const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function importBanks() {
  try {
    const csvFilePath = path.resolve(__dirname, "./data/banks-list.csv");
    const csvData = fs.readFileSync(csvFilePath, "utf-8");

    const rows = csvData.split("\n").map((row) =>
      row
        .replace('"', "")
        .split(",")
        .map((value) => value.trim())
    );

    const [headers, ...data] = rows;

    const _data = [];
    for (const row of data) {
      if (row[0] && row[1] && row[2] && row[3]) {
        let data = {
          bankId: String(row[0]),
          hebrewName: row[1],
          bankNumber: String(row[2]),
          countryId: row[3],
        };
        _data.push(data);
      }
    }
    if (_data.length > 0) {
      await prisma.bank.createMany({
        data: _data,
      });
    }

    console.log("Banks imported successfully");
  } catch (error) {
    console.error("Error importing data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function importBranches() {
  try {
    const csvFilePath = path.resolve(__dirname, "./data/branches-list.csv");
    const csvData = fs.readFileSync(csvFilePath, "utf-8");

    const rows = csvData.split("\n").map((row) =>
      row
        .replace('"', "")
        .split(",")
        .map((value) => value.trim())
    );

    const [headers, ...data] = rows;
    const _data = [];

    const bankIds = new Set();

    for (const row of data) {
      if (row[0] && row[1] && row[2]) {
        let data = {
          branchId: String(row[0]),
          hebrewName: row[2],
        };
        if (row[4]) {
          data.address = row[4];
        }
        if (row[5]) {
          data.code = row[5];
        }
        if (row[6]) {
          data.phone = row[6];
        }
        if (row[7]) {
          data.secondaryPhone = row[7];
        }
        if (row[8]) {
          data.fax = row[8];
        }
        if (row[9]) {
          data.email = row[9];
        }
        if (row[10]) {
          data.comment = row[10];
        }

        bankIds.add(String(row[1]));
        data.bankId = String(row[1]);
        _data.push(data);
      }
    }

    const bankRecords = await prisma.bank.findMany({
      where: {
        bankId: {
          in: Array.from(bankIds)
        }
      }
    });

    console.log('Found banks:', bankRecords.map(b => ({
      id: b.id,
      bankId: b.bankId,
      name: b.hebrewName
    })));

    const bankIdToId = bankRecords.reduce((acc, bankRecord) => {
      acc[bankRecord.bankId] = bankRecord.id;
      return acc;
    }, {});

    const newData = _data.reduce((acc, d) => {
      if (bankIdToId[d.bankId]) {
        acc.push({
          ...d,
          bankId: bankIdToId[d.bankId],
        });
      } else {
        console.log(`Warning: No matching bank found for bank ID ${d.bankId}`);
      }
      return acc;
    }, []);

    console.log(`Preparing to create ${newData.length} branches`);

    if (newData.length > 0) {
      await prisma.branch.createMany({
        data: newData,
      });
    }

    console.log("Branches imported successfully");
  } catch (error) {
    console.error("Error importing data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await importBanks();
  await importBranches();
}

main().catch(console.error);
