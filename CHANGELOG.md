# Changelog

## [0.1.0](https://github.com/letssummarize/lets-summarize-api/compare/api-v0.0.1...api-v0.1.0) (2025-03-18)


### Features

* add ApiKeyGuard for external integrations, improve options, and clean up code ([1fc48bb](https://github.com/letssummarize/lets-summarize-api/commit/1fc48bbc5f38e3e21f6f1a3eff9ed21b0f45f611))
* add audio option for summary, implement automatic cleanup for audio files ([45dcefb](https://github.com/letssummarize/lets-summarize-api/commit/45dcefbebca7cba9235e290b2ac18e7873dea677))
* add audioFilePath to response ([f64319c](https://github.com/letssummarize/lets-summarize-api/commit/f64319ce1e5ab51cea0604ae511ea2903b231b41))
* add speed option (fast/slow) for YouTube summarization ([0178c5e](https://github.com/letssummarize/lets-summarize-api/commit/0178c5e170a42c03f949b38cb84463865bbab26f))
* added file summarization ([e9d3108](https://github.com/letssummarize/lets-summarize-api/commit/e9d310871858b0c5fa437130b602b7008657908f))
* added video summarazation ([d64dd34](https://github.com/letssummarize/lets-summarize-api/commit/d64dd3460650740dac22d988afd8faef731c6373))
* enable CORS ([1e46008](https://github.com/letssummarize/lets-summarize-api/commit/1e4600819f0e15616613d8cbc1cec260d918f6b0))
* improve response formatting and add video metadata ([045fb8c](https://github.com/letssummarize/lets-summarize-api/commit/045fb8c54aa75fcf62328033282ec496f4569122))
* init trascribe api using faster-whisper (WIP) ([869548b](https://github.com/letssummarize/lets-summarize-api/commit/869548b6b4627a219c1222cf81a05cda038e7613))
* **storage:** enable optional S3 upload for TTS-1 generated audio files ([87bb148](https://github.com/letssummarize/lets-summarize-api/commit/87bb1485271c8d4ad8b5e52066e855277d2e5eec))
* support deepseek model in request options ([ed66c2d](https://github.com/letssummarize/lets-summarize-api/commit/ed66c2d6788ffa3227cc2d9ceeee63092f46defb))
* validate options by setting defaults values and improve prompts ([b0a2c63](https://github.com/letssummarize/lets-summarize-api/commit/b0a2c63e2a9ada82ecc0c19b2578b21a51f94e73))
* **video summarization:** prioritize youtube-transcript api before downloading audio ([dd4ee88](https://github.com/letssummarize/lets-summarize-api/commit/dd4ee88d6c435e17dc0dc90575f8479e9f2be5d3))


### Bug Fixes

* **dockerfile:** update CMD path for transcribe_api ([8371112](https://github.com/letssummarize/lets-summarize-api/commit/83711128c2891cdd123463d81a0d0d37fc00496b))
* fix file type validation ([18d9949](https://github.com/letssummarize/lets-summarize-api/commit/18d99499d0837366f6bab413dc333a3d01431df2))
* **transcribe api:** FastAPI server was not running (WIP) ([98f0b20](https://github.com/letssummarize/lets-summarize-api/commit/98f0b208fb556b7c8567712071201055203770ff))
* **transcribe api:** resolve loading model and transcribe audio issues (WIP) ([fa31c3b](https://github.com/letssummarize/lets-summarize-api/commit/fa31c3bf7ac3c5527e480a101efac0bb32a6a27a))
* **transcribe-api:** optimize model loading and caching for better performance (WIP) ([1062be9](https://github.com/letssummarize/lets-summarize-api/commit/1062be91d5440482064cda7d110a711e6a60ba9a))
