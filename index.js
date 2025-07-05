import express from "express";
import axios from "axios";
import ejs from "ejs";

const port = process.env.PORT || 3000;
const app = express();

//Global safety: Catch all unhandled async errors
process.on("unhandledRejection", (reason, promise) => {
  console.error("🔴 Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("🔴 Uncaught Exception:", err);
});

let trendingCache = [];
let cacheLastUpdated = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

const API_URL = "https://api.tvmaze.com";

async function fetchTrendingShows() {
  try {
    const response = await axios.get(`${API_URL}/shows?page=1`, {
      timeout: 5000,
    });
    const allShows = response.data.filter((show) => show.image?.medium);
    trendingCache = allShows.slice(0, 6);
    cacheLastUpdated = Date.now();
    console.log("✅ Trending cache updated");
  } catch (err) {
    console.error(
      "❌ Failed to update trending cache:",
      err.message || err.code
    );
  }
}

// app.get("/", (req, res) => {
//   res.render("index.ejs");
// });

/*app.get("/search", (req, res) => {
  res.redirect("/");
});*/

app.get("/", async (req, res) => {
  let trending = [];
  let randomShow = null;

  try {
    if (!trendingCache.length || Date.now() - cacheLastUpdated > CACHE_TTL) {
      await fetchTrendingShows();
    }

    trending = trendingCache;
    randomShow = trending.length
      ? trending[Math.floor(Math.random() * trending.length)]
      : null;

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
    console.error("Error loading homepage:", {
      message: err.message,
      code: err.code,
      status: err.response?.status,
      data: err.response?.data,
      stack: err.stack,
    });
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

    // console.log(response.data);
    // console.log("User searched for : ", userInput);

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
      episodes: showDetails._embedded.episodes || [],
      cast: showDetails._embedded.cast || [],
    });
  } catch (error) {
    res
      .status(500)
      .render("error.ejs", { message: "Could not load show details." });
  }
});

// Catch-all 404 handler
app.use((req, res) => {
  res.status(404).render("error.ejs", { message: "Page Not Found." });
});

// Global internal error handler
app.use((err, req, res, next) => {
  console.error("🔴 Express Internal Error:", err.stack);
  res.status(500).render("error.ejs", { message: "Internal Server Error." });
});

app.listen(port, () => {
  console.log(`Running on port ${port}`);
});

// Preload cache so homepage is fast on first request
fetchTrendingShows();

// every 5 mins
setInterval(fetchTrendingShows, CACHE_TTL);

app.get("/health", (req, res) => res.status(200).send("OK"));
