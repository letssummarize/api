<h1>Summarization Options & Customization</h1>

The Summarization API allows users to customize how summaries are generated. Options include adjusting the **length, format, language, model, speed,** and **additional parameters** to better control the output.

These options can be applied to:

- **YouTube Video Summarization (`POST /summarize/video`)**
- **File Summarization (`POST /summarize/file`)**
- **Raw Text Summarization (`POST /summarize/text`)**

- [Available Customization Options](#available-customization-options)
- [Example Usage in Requests](#example-usage-in-requests)
  - [YouTube Video Summarization Request](#youtube-video-summarization-request)
  - [File Summarization Request](#file-summarization-request)
  - [Text Summarization Request](#text-summarization-request)
- [Choosing the Right Speed for YouTube Videos](#choosing-the-right-speed-for-youtube-videos)
- [Next Steps](#next-steps)

## Available Customization Options

| Option               | Description                                                                                                                            | Possible Values                                                         | Default Value             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------- |
| `length`             | Controls the summary detail level. _(Ignored if `customInstructions` is provided)_                                                     | `"brief"`, `"standard"`, `"comprehensive"`                              | `"standard"`              |
| `format`             | Defines the structure of the summary. _(Ignored if `customInstructions` is provided)_                                                  | `"bullet-points"`, `"narrative"`, `"default"`                           | `"default"`               |
| `model`              | Specifies which AI model to use                                                                                                        | `"openai"`: GPT-4o, `"deepseek"`: DeepSeek-V3                           | `"openai"`                |
| `speed`              | Determines processing mode for YouTube videos                                                                                          | `"fast"` (quick but less reliable), `"slow"` (more accurate but slower) | `"fast"`                  |
| `lang`               | Specifies the output language of the summary. (if the content is in another language, the summary will be in the language you choose.) | `"english"`, `"arabic"`                                                 | Original Content Language |
| `listen`             | If `true`, generates an audio version (TTS) of the summary                                                                             | `true`, `false`                                                         | `false`                   |
| `customInstructions` | Allows adding special instructions for AI                                                                                              | Any string                                                              | None                      |

### Choosing the Right `speed` for YouTube Videos

| Speed Mode | Description                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------- |
| **Fast**   | Uses YouTube's **automated transcript** (if available). Faster but less reliable.              |
| **Slow**   | Downloads and **manually transcribes** the audio for better accuracy. Slower but always works. |

## Next Steps

- [File Storage](./file-storage.md) – Understand how uploaded files are stored and managed.
- [Error Handling & Debugging](./error-handling-debugging.md) – Learn about API errors and how to resolve them.
