import { YoutubeTranscript } from 'youtube-transcript';
import { MAX_TRANSCRIPT_TOKENS } from './constants';

/**
 * Validates if a given URL is a valid YouTube URL
 * @param {string} url - The URL to validate
 * @returns {boolean} True if the URL matches YouTube's domain pattern, false otherwise
 */
export function isValidYouTubeUrl(url: string): boolean {
  const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/;
  return ytRegex.test(url);
}

/**
 * Extracts the YouTube video ID from various YouTube URL formats
 * @param {string} url - The YouTube video URL (supports standard watch URLs, youtu.be URLs, and YouTube Shorts)
 * @returns {string | null} The video ID if found, null otherwise
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:v=|\/)([\w-]{11})(?:\?|&|\/|$)/,
    /youtu\.be\/([\w-]{11})(?:\?|&|$)/,
    /\/shorts\/([\w-]{11})(?:\?|&|$)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Interface for YouTube video metadata
 * @interface YouTubeMetadata
 * @property {string | null} thumbnail - URL of the video thumbnail (hqdefault quality)
 * @property {string | null} title - Title of the video
 * @property {string | null} channelName - Name of the YouTube channel
 */
interface YouTubeMetadata {
  thumbnail: string | null;
  title: string | null;
  channelName: string | null;
}

/**
 * Extracts YouTube video metadata using the oEmbed API
 * @param {string} url - The YouTube video URL
 * @returns {Promise<YouTubeMetadata>} Object containing video thumbnail URL, title, and channel name
 * @throws {Error} When the oEmbed API request fails
 */
export async function extractYouTubeVideoMetadata(
  url: string,
): Promise<YouTubeMetadata> {
  const emptyResult = {
    thumbnail: null,
    title: null,
    channelName: null,
  };

  try {
    const videoId = extractVideoId(url);
    if (!videoId) return { ...emptyResult };

    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oEmbedUrl);

    if (!videoId) return { ...emptyResult };

    const data = await response.json();
    const title = (await data.title) || 'Unknown Title';
    const channelName = data.author_name || 'Unknown Channel';
    const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    return {
      thumbnail,
      title,
      channelName,
    };
  } catch (error) {
    console.error('Error extracting YouTube video metadata:', error);
    return { ...emptyResult };
  }
}

/**
 * Fetches and processes the transcript of a YouTube video.
 * 
 * @param videoId - The YouTube video ID to fetch the transcript for
 * @returns A promise that resolves to the processed transcript string
 * @throws Error if the transcript cannot be fetched from YouTube
 * 
 * @remarks
 * The transcript is processed by:
 * 1. Combining all transcript items with timestamps into a single text
 * 2. Limiting the length to 1/4 of MAX_TRANSCRIPT_TOKENS (3750 tokens) to ensure it fits within model context
 */
export async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  try {
    // Replaced with youtubei.js
    // const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    // const fullTranscript = transcriptItems
    //   .map((item) => item.text.trim())
    //   .filter((text) => text.length > 0)
    //   .join(' ');
      const youtubei = await import ('youtubei.js');
      const Innertube = youtubei.Innertube;
      const youtube = await Innertube.create({
        lang: 'en',
        location: 'US',
        retrieve_player: false,
      });

    const info = await youtube.getInfo(videoId);
		const transcriptData = await info.getTranscript();

    const segments = transcriptData?.transcript?.content?.body?.initial_segments || [];
    const fullTranscript = segments.map(segment => segment.snippet.text).join(' ');    
    // const words = fullTranscript.split(' ');
    const words = fullTranscript.split(/\s+/);
    const safeLength = Math.floor(MAX_TRANSCRIPT_TOKENS / 4);
    return words.slice(0, safeLength).join(' ');
  } catch (error) {
    throw new Error(  
      `Could not fetch transcript from YouTube: ${error.message}`,
    );
  }
}
