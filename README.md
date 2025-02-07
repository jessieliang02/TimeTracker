# Tab Time Tracker

A browser extension to track and analyze your time spent on different websites.

## Features

- Real-time tab tracking
- Categorized time statistics
- Daily usage summaries
- Customizable categories
- Privacy-focused (all data stored locally)

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory from this project

## Building for Production

```bash
npm run build
```

The built extension will be in the `dist` directory.

## Project Structure

```
├── src/
│   ├── components/     # React components
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Utility functions
│   ├── types/         # TypeScript type definitions
│   ├── adapters/      # Browser-specific adapters
│   ├── storage/       # Storage management
│   ├── popup.tsx      # Extension popup
│   ├── background.ts  # Background script
│   └── content.ts     # Content script
├── public/            # Static assets
└── dist/             # Built extension
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 