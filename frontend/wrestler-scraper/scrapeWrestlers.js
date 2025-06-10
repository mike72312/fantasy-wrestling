const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

const baseUrl = "https://wwe.dropthebelt.com/Wrestler/?page=";
const totalPages = 7;
const wrestlers = [];

(async () => {
  for (let page = 0; page < totalPages; page++) {
    const { data } = await axios.get(`${baseUrl}${page}`);
    const $ = cheerio.load(data);

    $(".wrestlerItem").each((_, el) => {
      const name = $(el).find(".wrestlerTitle a").text().trim();
      const slug = $(el).find(".wrestlerTitle a").attr("href")?.split("/").pop();
      const brandLine = $(el).find(".wrestlerSumText").text();
      const brandMatch = brandLine.match(/Brand:\s*(.*?)\s*(?:Points|$)/);
      const brand = brandMatch ? brandMatch[1].trim() : "";
      const pointsMatch = brandLine.match(/Points this week:\s*(\d+)/);
      const points = pointsMatch ? parseInt(pointsMatch[1]) : 0;
      const image = $(el).find("img.wrestlerSumImg").attr("src") || "";

      wrestlers.push({ name, slug, brand, points, image });
    });
  }

  fs.writeFileSync("wrestlers.json", JSON.stringify(wrestlers, null, 2));
  console.log(`✅ Saved ${wrestlers.length} wrestlers to wrestlers.json`);
})();