const axios = require("axios");
const sqlite3 = require("sqlite3").verbose();

const express = require("express");
const app = express();
const port = 3000;

// เชื่อมต่อฐานข้อมูล SQLite
const db = new sqlite3.Database("mydatabase.db");

// API endpoint สำหรับดึงข้อมูลจากฐานข้อมูลและส่งคืนในรูปแบบ JSON
app.get("/api/data", (req, res) => {
  // ดึงข้อมูลจากฐานข้อมูล (ตัวอย่าง: ดึงข้อมูลจากตาราง covid_data)
  db.all("SELECT * FROM covid_data", (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    res.json(rows); // ส่งข้อมูลในรูปแบบ JSON กลับไปยังผู้ร้องขอ
  });
});

// เริ่มเซิร์ฟเวอร์ Express
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const url = "https://disease.sh/v3/covid-19/countries";
axios
  .get(url)
  .then((response) => {
    const data = response.data;
    const data2 = [
      {
        country: "Afghanistan",
        cases: 2000,
      },
    ];
    storeDataInDatabase(data);
  })
  .catch((error) => {
    console.error("Error fetching data:", error);
  });

function storeDataInDatabase(newData) {
  // ดูรายชื่อตารางในฐานข้อมูล
  db.serialize(() => {
    db.run("BEGIN TRANSACTION"); // เริ่มทรานแซกชัน

    const stmtUpdate = db.prepare(
      "UPDATE covid_data SET cases = ? WHERE country = ?"
    );
    const stmtInsert = db.prepare(
      "INSERT INTO covid_data (country, cases) VALUES (?, ?)"
    );

    newData.forEach((countryData) => {
      const { country, cases } = countryData;

      // ลองอัพเดตข้อมูล
      stmtUpdate.run(cases, country);

      // ถ้าไม่มีข้อมูลให้ทำการเพิ่มใหม่
      if (stmtUpdate.changes === 0) {
        stmtInsert.run(country, cases);
      }
    });

    stmtUpdate.finalize();
    stmtInsert.finalize();

    db.run("COMMIT");
  });

  // ดึงข้อมูลทั้งหมดจากตาราง covid_data
  db.all("SELECT * FROM covid_data", (err, rows) => {
    if (err) {
      console.error(err.message);
      return;
    }
    // แสดงข้อมูลที่ดึงออกมา
    rows.forEach((row) => {
      console.log(`Country: ${row.country}, Cases: ${row.cases}`);
    });
  });

  //   db.close();
}
