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
  const requestedUrl = req.url;
  const { filter } = req.query;
  // Return all songs if the url is /songs
  if (requestedUrl === "/songs") return res.status(200).json(songs);

  // Error if url is /songs/ or no filter or id
  if (!filter || requestedUrl === "/songs/") {
    return res.status(400).send("Bad Request");
  }

  // Convert filter to an array to handle multiple filters if so
  let arrayfilters = Array.isArray(filter) ? filter : filter.split(","); // if filter is a string then split it to make it array
  arrayfilters = arrayfilters.map((f) => f.toLowerCase().trim()); //  Convert strings in arrayfilters array to lower case

  // Filter songs based on arrayfilters array
  const filteredSongs = songs.filter((song) =>
    arrayfilters.some(
      (filterValue) =>
        song.title.toLowerCase().includes(filterValue) ||
        song.artist.toLowerCase().includes(filterValue)
    )
  );
  return res.json(filteredSongs);
});
// SONGS POST
apiRouter.post("/songs", (req, res) => {
  // If the req.body props are not a string then error 400
  if (typeof req.body.title !== "string" || typeof req.body.artist !== "string")
    return res.status(400).json({ message: "Title or aetist is not a string" });

  const newSong = {
    id: nextSongId,
    title: req.body.title.trim(),
    artist: req.body.artist.trim(),
  };

  // Error if no title or aetist in req.body
  if (!newSong.title || !newSong.artist)
    return res.status(400).json({ message: "Missing title or artist" });
  // Error if the song exists in the db
  const exists = checkIfExists(newSong);
  if (exists === true) {
    return res.status(400).json({ message: "Bad Request" });
  }

  songs.push(newSong);
  nextSongId++;

  return res.status(201).json(newSong);
});
// SONGS GET :ID
apiRouter.get("/songs/:songId", (req, res) => {
  const { songId } = req.params;
  // Find the song id
  const foundSong = songs.find((song) => song.id == songId);
  // Error if ther is no song found
  if (foundSong) return res.status(200).json(foundSong);
  else return res.status(400).json({ message: "Bad Request" });
});
// SONGS PATCH
apiRouter.patch("/songs/:songId", (req, res) => {
  const { songId } = req.params;
  const { title, artist } = req.body;
  // Error if songId is Nan and if title and artist are not given properly
  if (!title && !artist)
    return res.status(400).json({ message: "Bad Request" });
  if (isNaN(songId))
    return res.status(400).json({ message: "SongId is not a number" });
  // Error if ther is no found song
  const foundSong = songs.find((song) => song.id == songId);
  if (!foundSong) return res.status(404).json({ message: "Not Found" });
  // See if the title or artist is new
  if (title) foundSong.title = title;
  if (artist) foundSong.artist = artist;

  res.status(200).json(foundSong);
});
// SONGS DELETE
apiRouter.delete("/songs/:songId", (req, res) => {
  const { songId } = req.params;

  // Ensure an songId is provided
  if (!songId) return res.status(405).json({ message: "Method Not Allowed" });
  // Ensure ID is a valid number
  if (isNaN(songId)) return res.status(400).json({ message: "Bad Request" });

  // Find song by songId
  const foundSong = songs.find((song) => song.id == songId);
  if (!foundSong) return res.status(404).json({ message: "Not Found" });
  // Check if the song is in a playlist
  playlists.forEach((playlist) => {
    const inPlaylist = playlist.songIds.find((song) => song == foundSong.id);
    if (inPlaylist) res.status(400).json({ message: "Bad Request" }); // If song is in playlist return 400
  });
  // If song is not in playlist remove it
  if (res.statusCode !== 400) {
    songs = songs.filter((song) => song.id != songId);
    return res.status(200).json(foundSong);
  }
});

// Error for requests to "/songs" without an ID (return 405)
apiRouter.all("/songs", (req, res) => {
  res.status(405).json({ message: "Method Not Allowed" });
});

// PLAYLISTS ENDPOINTS
apiRouter.get("/playlists", (req, res) => {
  const requestedUrl = req.url;
  if (requestedUrl === "/playlists/")
    return res.status(400).json({ message: "Bad Request" });
  res.status(200).json(playlists);
});
// PLAYLISTS GET :ID / specific playlist
apiRouter.get("/playlists/:playlistId", (req, res) => {
  const { playlistId } = req.params;
  let arraySongObj = [];
  // Error if palylistId is not a number
  if (isNaN(playlistId))
    return res.status(400).json({ message: "Bad Request" });

  const foundPlayList = playlists.find((playlist) => playlist.id == playlistId);

  // Error if no playlist found
  if (!foundPlayList)
    return res.status(404).json({ message: "No playlist found" });
  // Find the songs in the songIds array and add the song objects to arraySongObj
  foundPlayList.songIds.forEach((playlistId) => {
    foundSong = songs.find((song) => song.id == playlistId);
    arraySongObj.push(foundSong);
  });

  //! The object to return to not fock upp the ids
  const resObs = {
    ...foundPlayList,
    songs: arraySongObj,
  };
  return res.status(200).json(resObs);
});
// PLAYLISTS POST
apiRouter.post("/playlists", (req, res) => {
  const { name } = req.body;
  // Error if there is no name or if name is not a string or if name contains only spaces
  if (!name || typeof name !== "string" || name.match(/^ *$/) !== null)
    return res.status(400).json({ message: "Bad Request" });
  // Error if playlist exist
  const exists = playlists.find(
    (playlist) => playlist.name.toLowerCase() == name.toLowerCase().trim()
  );
  if (exists) return res.status(400).json({ message: "Bad Request" });

  const newPlaylists = { id: nextPlaylistId, name: name, songIds: [] };
  playlists.push(newPlaylists);

  res.status(201).json(newPlaylists);
});
// PLAYLISTS PATCH
apiRouter.patch("/playlists/:playlistId/songs/:songId", (req, res) => {
  const { playlistId, songId } = req.params;
  let arraySongObj = [];
  // Error 400 if playlist id or song id is not a number
  if (isNaN(playlistId) || isNaN(songId))
    return res.status(400).json({ message: "Bad Request" });

  // Erorr 404 if playlist or song is not found
  let foundPlayList = playlists.find((playlist) => playlist.id == playlistId);
  const foundSong = songs.find((song) => song.id == songId);
  if (!foundPlayList || !foundSong)
    return res.status(404).json({ message: "Not Found" });

  // Error if playlist exists
  const exists = foundPlayList.songIds.find((song) => song == foundSong.id);
  if (exists) return res.status(400).json({ message: "Bad Request" });
  // Add the new id and song objects
  foundPlayList.songIds.push(foundSong.id);
  foundPlayList.songIds.forEach((id) => {
    arrayOfSongs = songs.find((song) => song.id == id);
    arraySongObj.push(arrayOfSongs);
  });
  //! The object to return to not fock upp the ids
  const resObs = {
    ...foundPlayList,
    songs: arraySongObj,
  };

  return res.status(200).json(resObs);
});

// Error for requests to "/playlists" without an ID (return 405)
apiRouter.all("/playlists", (req, res) => {
  res.status(405).json({ message: "Method Not Allowed" });
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
