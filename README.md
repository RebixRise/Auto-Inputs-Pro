# Auto-Inputs-Pro

<div align="center">
  <img src="assets/icons/icon128.png" alt="Auto-Inputs-Pro Logo" width="128" height="128">
  <h3>Intelligent Form Auto-Completion with AI</h3>
  <p>A browser extension for automatic form field completion powered by advanced AI models</p>
  
  ![Version](https://img.shields.io/badge/version-1.0.0-blue)
  ![License](https://img.shields.io/badge/license-Proprietary-red)
  ![Made by](https://img.shields.io/badge/made%20by-RebixRise-purple)
</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Installation](#-installation)
- [Usage Guide](#-usage-guide)
- [Configuration](#-configuration)
- [Technical Architecture](#-technical-architecture)
- [Security & Privacy](#-security--privacy)
- [Development](#-development)
- [Browser Compatibility](#-browser-compatibility)
- [Troubleshooting](#-troubleshooting)
- [Roadmap](#-roadmap)
- [License](#-license)
- [About RebixRise](#-about-rebixrise)

---

## 🔍 Overview

**Auto-Inputs-Pro** is an advanced browser extension that automatically fills form fields using artificial intelligence. Leveraging the power of Google Gemini AI (with support for additional AI models coming soon), this extension intelligently analyzes page context and form field labels to generate appropriate, realistic information based on the context and language used on the webpage.

The extension is designed to save time when testing forms, creating accounts, or filling out repetitive information, while providing contextually appropriate responses that make sense for each field.

---

## ✨ Key Features

- **Intelligent Form Detection**: Automatically identifies forms and their fields on any webpage
- **Contextual Understanding**: Analyzes surrounding content to provide relevant, appropriate field inputs
- **Multiple Filling Options**:
  - Fill all form fields on a page at once
  - Fill a specific form when clicking on any field within it
  - Fill a single field on demand
- **Multi-AI Model Support**: Currently supports Google Gemini AI, with OpenAI and Claude AI integration coming soon
- **Automatic Form Submission**: Optional automatic submission after filling (configurable)
- **Settings Import/Export**: Backup or transfer your configuration between devices
- **Custom Delay Settings**: Configure delays between field completions to avoid rate limits
- **Field Type Support**: Handles various input types:
  - Text and textarea fields
  - Email inputs
  - Password fields
  - Dropdown menus
  - Checkboxes and radio buttons
  - Date pickers
  - Number fields
- **Multi-language Support**: Generates content in the language of the website
- **Smart Form Association**: Intelligently identifies which fields belong to which forms
- **User-friendly Interface**: Intuitive popup panel for configuration
- **In-page Notifications**: Customizable notifications integrated into the webpage

---

## 📥 Installation

### From Browser Web Store
1. Visit the browser extension store for your browser:
   - [Chrome Web Store](https://chrome.google.com/webstore) (Coming soon)
   - [Firefox Add-ons](https://addons.mozilla.org/firefox/) (Coming soon)
   - [Edge Add-ons](https://microsoftedge.microsoft.com/addons/) (Coming soon)
2. Search for "Auto-Inputs-Pro"
3. Click "Add to [Browser]"

### Manual Installation (Developer Mode)
1. Download the latest release from the [GitHub repository](https://github.com/RebixRise/Auto-Inputs-Pro/releases)
2. Extract the ZIP file to a folder on your computer
3. Open your browser's extension management page:
   - Chrome: `chrome://extensions/`
   - Firefox: `about:addons`
   - Edge: `edge://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked" (Chrome/Edge) or "Load Temporary Add-on" (Firefox)
6. Select the folder containing the extracted extension files

---

## 🚀 Usage Guide

### Initial Setup
1. Install the extension
2. Click the extension icon in your browser toolbar
3. Select your preferred AI model (currently Gemini AI)
4. Enter your API key and click "Save"
5. Customize additional settings according to your preferences:
   - Enable/disable automatic form submission
   - Enable/disable notifications
   - Adjust field completion delay

### Using the Extension

#### Method 1: Context Menu
1. Right-click on any part of a webpage to access the context menu
2. Select one of the following options:
   - **Fill All Inputs**: Completes all form fields on the page
   - **Fill This Form**: Completes only the form containing the field you right-clicked
   - **Fill This Input**: Completes only the specific field you right-clicked

#### Method 2: Extension Popup
1. Click the extension icon in your browser toolbar
2. Use the provided buttons to:
   - Fill all inputs on the current page
   - Configure your settings
   - View usage statistics

### Settings Backup
- **Export Settings**: Click the "Export Settings" button to save a JSON file with your configuration
- **Import Settings**: Click the "Import Settings" button and select a previously exported settings file

---

## ⚙️ Configuration

### API Keys
To use Auto-Inputs-Pro, you need an API key from at least one supported AI service:
- [Google Gemini AI](https://makersuite.google.com/app/apikey) (Currently supported)
- OpenAI (Coming soon)
- Claude AI (Coming soon)

### Available Settings

| Setting | Description | Default |
|---------|-------------|---------|
| AI Model | Select which AI model to use for generating content | Gemini AI |
| API Key | Your API key for the selected AI service | (Required) |
| Auto-Submit Forms | Automatically submit forms after filling | Disabled |
| Show Notifications | Display on-screen notifications | Enabled |
| Field Delay | Time delay between filling each field (ms) | 300 |
| Detection Accuracy | Adjust form field detection sensitivity | Medium |
| Content Type | Type of content to generate (Realistic/Random/Test) | Realistic |
| Dark Mode | Toggle dark mode for the extension UI | System default |
| Language | Extension UI language | Browser default |

---

## 🔧 Technical Architecture

Auto-Inputs-Pro is built as a browser extension using the WebExtensions API, making it compatible with most modern browsers.

### Component Structure

- **Manifest (manifest.json)**: Defines extension metadata, permissions, and component relationships
- **Background Script (js/background.js)**: Handles context menu creation, background processes, and communication between components
- **Content Script (js/content.js)**: Interacts with webpage DOM to identify and fill form fields
- **Popup UI (popup.html, js/popup.js, css/popup.css)**: Provides the user interface for configuration and manual actions
- **Supporting Libraries (js/lib/)**: Contains third-party libraries for enhanced functionality

### Key Technologies

- **JavaScript (ES6+)**: Core programming language
- **Chrome Extension API**: For browser integration
- **Fetch API**: For communication with AI services
- **Local Storage API**: For saving user preferences
- **DOM Manipulation**: For form field detection and completion
- **Chart.js**: For usage statistics visualization

### Form Field Detection Algorithm

The extension uses a sophisticated algorithm to detect form fields:
1. Identifies all input, select, and textarea elements
2. Associates fields with their corresponding forms
3. Analyzes field attributes (type, name, id, placeholder)
4. Examines nearby text nodes and labels
5. Determines the purpose of each field based on contextual clues

### AI Integration Process

1. Collects form field information (field types, labels, existing values)
2. Gathers page context (URL, title, surrounding text)
3. Constructs a prompt for the AI service
4. Sends the request to the selected AI model
5. Processes the AI response
6. Maps generated content to appropriate form fields
7. Applies the content with proper formatting for each field type

---

## 🔒 Security & Privacy

### Data Handling
- Your API key is stored locally in your browser's secure storage
- API keys are never shared with any third party
- Context data (such as field labels) is only sent to your selected AI service to help generate appropriate information
- No personal information is collected or stored

### Permissions Explained

| Permission | Usage |
|------------|-------|
| `storage` | Stores your settings and API keys locally |
| `contextMenus` | Provides right-click menu options |
| `activeTab` | Allows the extension to interact with the current webpage |
| `scripting` | Enables form field detection and filling |
| `notifications` | Displays status updates |
| `<all_urls>` | Allows the extension to work on any website |

---

## 💻 Development

### Setting Up Development Environment

1. Clone the repository:
   ```
   git clone https://github.com/RebixRise/Auto-Inputs-Pro.git
   ```

2. Open the project in your preferred code editor

3. Load the extension in your browser (see Manual Installation above)

### Project Structure

```
Auto-Inputs-Pro/
├── manifest.json          # Extension manifest
├── popup.html             # Extension popup UI
├── .gitignore             # Git ignore file
├── README.md              # This documentation
├── assets/                # Static assets
│   └── icons/             # Extension icons
├── css/                   # Stylesheets
│   └── popup.css          # Styles for popup UI
└── js/                    # JavaScript files
    ├── background.js      # Background service worker
    ├── content.js         # Content script for webpage interaction
    ├── popup.js           # Popup UI functionality
    ├── translations.js    # Localization strings
    ├── stats.js           # Usage statistics
    └── lib/               # Third-party libraries
        └── chart.min.js   # Chart.js for statistics
```

### Building for Production

1. Ensure all code is properly formatted and tested
2. Create a ZIP file containing all the necessary files
3. Submit to browser extension stores or distribute for manual installation

---

## 🌐 Browser Compatibility

Auto-Inputs-Pro is compatible with all major browsers that support the WebExtensions API:

| Browser | Minimum Version | Status |
|---------|----------------|--------|
| Google Chrome | 91+ | ✅ Fully supported |
| Mozilla Firefox | 89+ | ✅ Fully supported |
| Microsoft Edge | 91+ | ✅ Fully supported |
| Opera | 77+ | ✅ Fully supported |
| Safari | 14+ | ⚠️ Limited support |

---

## ❓ Troubleshooting

### Common Issues

#### API Key Issues
- **Error: Invalid API Key**: Verify your API key is correct and has not expired
- **Error: API Quota Exceeded**: Your API usage limit may have been reached; check your AI service dashboard

#### Field Detection Problems
- **Some fields not detected**: Try adjusting the detection accuracy setting to "High"
- **Wrong information in fields**: The AI might need more context; try filling a specific form or field

#### Extension Not Working
- **Extension not appearing**: Ensure the extension is enabled in your browser
- **Context menu missing**: Try restarting your browser
- **No response when clicking options**: Check the browser console for errors

### Getting Support

If you encounter issues not covered here, please:
1. Check the [GitHub Issues](https://github.com/RebixRise/Auto-Inputs-Pro/issues) for similar problems
2. Create a new issue with detailed information if your problem is not listed
3. Include your browser version, extension version, and steps to reproduce the issue

---

## 🛣️ Roadmap

### Upcoming Features (Planned for v1.1.0)
- Support for additional AI models (OpenAI, Claude AI)
- Saved custom responses for specific websites
- Multiple profiles for different use cases
- Improved relationship detection between fields

### Future Enhancements (v1.2.0 and beyond)
- Custom rules and templates
- Local AI model options for improved privacy
- Browser sync support for settings
- Form field detection using computer vision
- Learning capability to improve over time
- Advanced form interaction (multi-step forms, CAPTCHA handling)

---

## 📄 License

All rights reserved © 2025 RebixRise

This project is proprietary software. Unauthorized copying, modification, distribution, or use of this software, via any medium, is strictly prohibited without express permission from RebixRise.

---

## 🏢 About RebixRise

RebixRise is a technology company focused on creating innovative tools that enhance productivity and streamline digital workflows. Our mission is to develop intelligent solutions that save time and simplify complex tasks for users worldwide.

- Website: [RebixRise.com](https://rebixrise.com) (Coming soon)
- GitHub: [@RebixRise](https://github.com/RebixRise)
- Contact: [support@rebixrise.com](mailto:support@rebixrise.com)

---

<div align="center">
  <p>Developed with ❤️ by RebixRise</p>
  <p>© 2025 RebixRise. All rights reserved.</p>
</div> 