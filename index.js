const express = require("express");

/* Import a body parser module to be able to access the request body as json */
const bodyParser = require("body-parser");

/* Use cors to avoid issues with testing on localhost */
const cors = require("cors");

const app = express();

/* Base url parameters and port settings */
const apiPath = "/api/";
const version = "v1";
const port = 3000;

/* Set Cors-related headers to prevent blocking of local requests */
app.use(bodyParser.json());
app.use(cors());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

/* Initial Data */
let songs = [
  { id: 1, title: "Cry For Me", artist: "The Weeknd" },
  { id: 2, title: "Busy Woman", artist: "Sabrina Carpenter" },
  {
    id: 3,
    title: "Call Me When You Break Up",
    artist: "Selena Gomez, benny blanco, Gracie Adams",
  },
  { id: 4, title: "Abracadabra", artist: "Lady Gaga" },
  { id: 5, title: "Róa", artist: "VÆB" },
  { id: 6, title: "Messy", artist: "Lola Young" },
  { id: 7, title: "Lucy", artist: "Idle Cave" },
  { id: 8, title: "Eclipse", artist: "parrow" },
];

let playlists = [
  { id: 1, name: "Hot Hits Iceland", songIds: [1, 2, 3, 4] },
  { id: 2, name: "Workout Playlist", songIds: [2, 5, 6] },
  { id: 3, name: "Lo-Fi Study", songIds: [] },
];

/*  Our id counters
    We use basic integer ids in this assignment, but other solutions (such as UUIDs) would be better. */
let nextSongId = 9;
let nextPlaylistId = 4;

const nextSongIDHeler = () => {
  //* Veit ekki ef þessi þarf að vera upp á að ids fyrir songs fara frá 1 ... n
  let fixID = 1;
  songs.forEach((song) => {
    song.id = fixID;
    fixID++;
  });
};

const fixSongIdInPlaylists = (songId) => {
  playlists.forEach((playlist) => {
    playlist.songIds = playlist.songIds.filter((id) => id != songId);
  });
};

const checkIfExists = (newSong) => {
  let valid = false;
  songs.forEach((song) => {
    if (
      song.artist.toLowerCase() === newSong.artist.toLowerCase() &&
      song.title.toLowerCase() === newSong.title.toLowerCase()
    ) {
      valid = true;
    }
  });
  return valid;
};

/*
const validKeys = (newSong) => {
  const validSongKeys = ["title", "artist"];
  const songKeys = Object.keys(newSong);
  if (JSON.stringify(songKeys) === JSON.stringify(validSongKeys)) return true;
  else false;
};
*/

const apiRouter = express.Router();
app.use(apiPath + version, apiRouter);

// todo: Skoða ef error mes á að vera sent með json í stað fyrir .send

// SONGS ENDPOINTS
apiRouter.get("/songs", (req, res) => {
  // nextSongIDHeler();
  console.log(req.query.filters.songs);
  console.log(req.query.fields);
  res.status(200).json(songs);
});

apiRouter.post("/songs", (req, res) => {
  const newSong = {
    id: nextSongId,
    title: req.body.title,
    artist: req.body.artist,
  };

  const exists = checkIfExists(newSong);
  if (exists === true) {
    res.status(403).json({ message: "The song exists" });
  }

  if (res.statusCode !== 403) {
    songs.push(newSong);
    nextSongId++;

    res.status(200).json({
      message: `A song was created with the id og ${nextSongId - 1}`,
      data: { newSong },
    });
  }

  // todo: búa til id funcsion sem passar upp á id sé rétt
});

apiRouter.get("/songs/:id", (req, res) => {
  const { id } = req.params;

  const foundSong = songs.find((song) => song.id == id);

  if (foundSong) res.status(200).json(foundSong);
  else res.status(400).json({ message: `No song has the id of ${id}` });
});

apiRouter.patch("/songs/:id", (req, res) => {
  const { id } = req.params;
  const { title, artist } = req.body;

  const foundSong = songs.find((song) => song.id == id);

  if (!foundSong) res.status(403).json({ message: "The song was not found" });
  if (title) foundSong.title = title;
  if (artist) foundSong.artist = artist;

  if (res.statusCode !== 403)
    res.status(200).json({
      message: `Song with the id of ${id} has been updated`,
      data: { foundSong },
    });
});

apiRouter.delete("/songs/:id", (req, res) => {
  // todo: Það þarf að passa upp á error handal
  const { id } = req.params;

  const foundSong = songs.find((song) => song.id == id);
  if (!foundSong)
    res.status(403).json({ message: `Song with id of ${id} was not found` });

  if (res.statusCode !== 403) {
    songs = songs.filter((song) => song.id != id);
    fixSongIdInPlaylists(id);
    res.status(200).json({
      message: `Song with the id of ${id} has been deleted`,
      data: { deletedSong: foundSong },
    });
  }
});

// PLAYLISTS ENDPOINTS
apiRouter.get("/playlists", (req, res) => {
  res.status(200).json(playlists);
});

apiRouter.get("/playlists/:id", (req, res) => {
  const { id } = req.params;

  const foundPlayList = playlists.find((playlist) => playlist.id == id);

  if (foundPlayList) res.status(200).json(foundPlayList);
  else res.status(400).send(`No playlist has the id of ${id}`);
});

/* --------------------------

      SERVER INITIALIZATION  
      
!! DO NOT REMOVE OR CHANGE THE FOLLOWING (IT HAS TO BE AT THE END OF THE FILE) !!
      
-------------------------- */
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

module.exports = app;
