import express from "express";
import axios from "axios";
import ejs from "ejs";

const port = process.env.PORT || 3000;
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

const API_URL = "https://api.tvmaze.com";

// app.get("/", (req, res) => {
//   res.render("index.ejs");
// });

/*app.get("/search", (req, res) => {
  res.redirect("/");
});*/

app.get("/", async (req, res) => {
  try {
    const trendingRes = await axios.get(`${API_URL}/shows`);
    const allShows = trendingRes.data.filter((show) => show.image); // only shows with images
    const trending = allShows.slice(0, 6);

    // Pick 1 random show from the trending list
    const randomIndex = Math.floor(Math.random() * trending.length);
    const randomShow = trending[randomIndex];

    // Add a static or rotating quote list
    const quotes = [
      "Binge watching is my cardio.",
      "One more episode won’t hurt… right?",
      "Some people run marathons, I finish series.",
      "TV taught me how to feel things.",
      "I speak fluent quotes from my favorite shows.",
      "I could quit watching... but why risk it?",
      "I don't need therapy, I need spoilers.",
      "Reality called, but I missed it for a plot twist.",
      "My weekend plans? Intro + Recap + Play.",
      "Friends come and go, but seasons stay forever.",
      "First I binge, then I rewatch with commentary.",
      "Just one more episode — the biggest lie I tell myself.",
      "I measure time in episodes, not hours.",
      "TV doesn’t ask questions. TV understands.",
      "If I had a dollar for every cliffhanger, I’d own Netflix.",
      "Shows end. Pain remains.",
      "I have commitment issues… unless it’s a 7-season show.",
      "Finished the series. Emotionally ruined. 10/10 would recommend.",
      "Sleep is temporary, binge is eternal.",
      "Intro skipped. Emotions not.",
    ];

    const quote = quotes[Math.floor(Math.random() * quotes.length)];

    res.render("index.ejs", {
      trending,
      randomShow,
      quote,
    });
  } catch (err) {
    console.error("Error loading homepage:", err.message);
    res
      .status(500)
      .render("error.ejs", { message: "Unable to load homepage." });
  }
});

app.get("/search", async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.render("search.ejs", { shows: [] });
  }

  try {
    const response = await axios.get(`${API_URL}/search/shows?q=${query}`);
    const shows = response.data.map((result) => result.show);

    if (!shows.length) {
      return res.render("error.ejs", { message: "No show found!" });
    }

    res.render("search.ejs", { shows });
  } catch (error) {
    res.status(500).render("error.ejs", { message: "Something went wrong." });
  }
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
