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

const apiRouter = express.Router();
app.use(apiPath + version, apiRouter);

// SONGS ENDPOINTS
apiRouter.get("/songs", (req, res) => {
  // http://localhost:3000/api/v1/songs?filter=Abracadabra,Róa
  // Error if incorrect filter parameter (/songs/) t.d
  const requestedUrl = req.url;
  if (requestedUrl === "/songs/") return res.status(400).send("Bad Request");

  const { filter } = req.query;
  // Return all songs if no filter is provided and no filter error
  if (!filter) {
    return res.json(songs);
  }

  // Convert filter to an array to handle multiple filters if so
  const arrayfilters = Array.isArray(filter) ? filter : filter.split(","); // if filter is a string then split it to make it array
  arrayfilters = arrayfilters.map((f) => f.toLowerCase().trim()); //  Convert strings in arrayfilters array to lower case

  // Filter songs based on arrayfilters array
  const filteredSongs = songs.filter((song) =>
    arrayfilters.some(
      (filterValue) =>
        song.title.toLowerCase().includes(filterValue) ||
        song.artist.toLowerCase().includes(filterValue)
    )
  );
  // filteredSongs.length;
  // if (filteredSongs.length == 0) return res.status(400).send("Bad Request");
  return res.json(filteredSongs);
});

apiRouter.post("/songs", (req, res) => {
  if (typeof req.body.title !== "string" || typeof req.body.artist !== "string")
    return res.status(400).send("Title or aetist is not a string");

  const newSong = {
    id: nextSongId,
    title: req.body.title,
    artist: req.body.artist,
  };

  if (!newSong.title || !newSong.artist)
    // Error if no title or aetist in req.body
    return res.status(400).send("Missing title or artist");
  // Error if the song exists in the db
  const exists = checkIfExists(newSong);
  if (exists === true) {
    return res.status(403).send("The song exists");
  }

  songs.push(newSong);
  nextSongId++;

  return res.status(201).json(newSong);
});

apiRouter.get("/songs/:id", (req, res) => {
  const { id } = req.params;

  const foundSong = songs.find((song) => song.id == id);

  if (foundSong) return res.status(200).json(foundSong);
  else return res.status(400).send(`No song has the id of ${id}`);
});

apiRouter.patch("/songs/:songId", (req, res) => {
  const { songId } = req.params;
  const { title, artist } = req.body;

  if (isNaN(songId)) return res.status(400).send("SongId is not a number");

  const foundSong = songs.find((song) => song.id == songId);

  if (!foundSong) return res.status(404).send("Not Found");
  if (title) foundSong.title = title;
  if (artist) foundSong.artist = artist;

  res.status(200).json(foundSong);
});

apiRouter.delete("/songs/:id", (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(405).send("Method Not Allowed");
  if (isNaN(id)) return res.status(400).send("SongId is not a number");
  const foundSong = songs.find((song) => song.id == id);
  if (!foundSong) return res.status(404).send("Not Found");

  songs = songs.filter((song) => song.id != id);
  fixSongIdInPlaylists(id);
  return res.status(200).json(foundSong);
});

// PLAYLISTS ENDPOINTS
apiRouter.get("/playlists", (req, res) => {
  res.status(200).json(playlists);
});

apiRouter.get("/playlists/:id", (req, res) => {
  const { id } = req.params;
  let arraySongObj = [];

  const foundPlayList = playlists.find((playlist) => playlist.id == id);

  foundPlayList.songIds.forEach((id) => {
    foundSong = songs.find((song) => song.id == id);
    arraySongObj.push(foundSong);
  });

  foundPlayList.songIds = arraySongObj;

  if (foundPlayList) return res.status(200).json(foundPlayList);
  else return res.status(400).send(`No playlist has the id of ${id}`);
});

apiRouter.post("/playlists", (req, res) => {
  const { name } = req.body;
  // Error if there is no name
  if (!name) return res.status(400).send(`Requested has no name`);

  const newPlaylists = { id: nextPlaylistId, name: name, songIds: [] };
  playlists.push(newPlaylists);

  res.status(201).json(newPlaylists);
});

apiRouter.patch("/playlists/:playlistId/songs/:songId", (req, res) => {
  const { playlistId, songId } = req.params;
  const { songIds } = req.body;
  // Error if req.body is a bad request
  if (
    !req.body ||
    !Array.isArray(req.body.songIds) ||
    req.body.songIds.length <= 0
  ) {
    return res.status(400).json({
      error: `Song ids has to be an array form and not of length 0`,
      data: req.body,
    });
  }

  const foundPlayList = playlists.find((playlist) => playlist.id == playlistId);
  const foundSong = songs.find((song) => song.id == songId);

  // Erorr 400
  if (!foundPlayList || !foundSong)
    return res
      .status(400)
      .send(`No playlist has the id of ${playlistId} or song ${songId}`);
  // add the song ids to the found playlist
  if (songId) {
    songIds.forEach((id) => {
      foundPlayList.songIds.push(id);
    });
  }

  return res.status(200).json(foundPlayList);
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
