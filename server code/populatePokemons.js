const mongoose = require("mongoose");
const https = require("https");

const populatePokemons = async (pokeSchema) => {
  const pokeModel = mongoose.model("pokemons", pokeSchema, "pokemons");
  return new Promise((resolve, reject) => {
    https.get("https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/pokedex.json", (res) => {
      let chunks = "";

      res.on("data", (chunk) => {
        chunks += chunk;
      });

      res.on("end", async () => {
        try {
          const arr = JSON.parse(chunks);
          await Promise.all(
            arr.map(async (element) => {
              element["base"]["Speed Attack"] = element["base"]["Sp. Attack"];
              delete element["base"]["Sp. Attack"];
              element["base"]["Speed Defense"] = element["base"]["Sp. Defense"];
              delete element["base"]["Sp. Defense"];
              await pokeModel.findOneAndUpdate(
                {id: element.id},
                element,
                { upsert: true, new: true }
              );
            })
          );
          resolve(pokeModel);
        } catch (err) {
          reject(err);
        }
      });
    });
  });
};

module.exports = { populatePokemons };
