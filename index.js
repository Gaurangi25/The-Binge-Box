import express from "express";
import axios from "axios";
import ejs from "ejs";

const port = process.env.PORT || 3000;
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

const API_URL = "https://api.tvmaze.com";

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/search", (req, res) => {
  res.redirect("/");
});

app.post("/search", async (req, res) => {
  const userInput = req.body.showName;

  try {
    const response = await axios.get(`${API_URL}/search/shows?q=${userInput}`);

    console.log(response.data);

    console.log("User searched for : ", userInput);

    //To get top results
    //const shows = response.data[0]?.show;

    //To get all shows with the desired input
    const shows = response.data.map((result) => result.show);
    //It'll be going to show.ejs from here if i get some length else error is shown

    if (!shows.length) {
      return res.render("error.ejs", { message: "No show found!" });
    }

    //displays an array of shows to search.ejs
    res.render("search.ejs", {
      shows: shows,
    });
  } catch (error) {
    res.status(500).render("error.ejs", { message: "Something went wrong." });
  }
});

//To display complete information of he clicked show
app.get("/show/:id", async (req, res) => {
  const showId = req.params.id;

  try {
    const response = await axios.get(
      `${API_URL}/shows/${showId}?embed[]=episodes&embed[]=cast`
    );
    const showDetails = response.data;

    res.render("show.ejs", {
      show: showDetails,
      episodes: showDetails._embedded.episodes,
      cast: showDetails._embedded.cast,
    });
  } catch (error) {
    res
      .status(500)
      .render("error.ejs", { message: "Could not load show details." });
  }
});


app.listen(port, () => {
  console.log(`Running on port ${port}`);
});
