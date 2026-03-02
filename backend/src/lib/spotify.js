const { config } = require('../config');

let cachedToken = null;
let tokenExpiresAt = 0;

function hasSpotifyCreds() {
  return Boolean(config.spotifyClientId && config.spotifyClientSecret);
}

async function getSpotifyToken() {
  if (!hasSpotifyCreds()) {
    throw new Error('Spotify credentials are not configured');
  }

  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 30_000) {
    return cachedToken;
  }

  const auth = Buffer.from(`${config.spotifyClientId}:${config.spotifyClientSecret}`).toString('base64');
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify token request failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = now + (Number(data.expires_in) || 3600) * 1000;
  return cachedToken;
}

async function getSpotifyTrack(trackId) {
  const token = await getSpotifyToken();
  const response = await fetch(`https://api.spotify.com/v1/tracks/${encodeURIComponent(trackId)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify track request failed (${trackId}): ${response.status} ${text}`);
  }

  const track = await response.json();
  return {
    trackId: track.id,
    name: track.name,
    artists: Array.isArray(track.artists) ? track.artists.map((a) => a.name) : [],
    popularity: Number(track.popularity || 0),
    spotifyUrl: track.external_urls?.spotify || null,
    album: track.album?.name || null,
  };
}

module.exports = {
  hasSpotifyCreds,
  getSpotifyTrack,
};
