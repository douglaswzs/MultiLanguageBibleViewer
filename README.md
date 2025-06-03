# Multi-Language Bible Viewer

A lightweight and flexible web-based tool for reading and comparing Bible verses in multiple languages side-by-side. Includes pronunciation support for Chinese (Jyutping and Pinyin) to help with learning and understanding the text.

## ✨ Features

- Select up to **three languages** to compare Bible verses
- Supports a wide variety of Bible translations (e.g., KJV, NCV, Reina Valera, Korean, Arabic)
- **Jump to verse** via reference input (e.g., `John 3:16` or `3:16`)
- **Toggle pronunciations** for Chinese (Jyutping, Pinyin, or both)
- **Responsive layout** for mobile-friendly viewing
- Highlights selected verse and remembers last position

## 🧩 Technologies Used

- HTML / CSS / Vanilla JavaScript (ES6 Modules)
- [to-jyutping](https://github.com/Canop/to-jyutping) for Cantonese romanization
- [pinyin-pro](https://github.com/zh-lx/pinyin-pro) for Mandarin pinyin generation
- Bible JSON data from [`thiagobodruk/bible`](https://github.com/thiagobodruk/bible)

## 📁 Folder Structure
.
├── index.html # Main HTML file (contains all logic)
├── /json # Bible JSON files (place bible JSONs here)
└── README.md # This file


## 📦 Usage

1. **Clone or download** this repository.
2. Make sure the `json` folder contains the Bible JSON files you want to use.
   - These can be downloaded from: [thiagobodruk/bible/json](https://github.com/thiagobodruk/bible/tree/master/json)
3. Open `index.html` in your browser.
4. Select your desired languages and start browsing the Bible!

## 🔗 Permalinks

You can generate and copy permalink URLs to specific books, chapters, and verse selections. The app will auto-load the state based on the query parameters.

Example: ?lang1=en_kjv&lang2=zh_cuv&book=jn&chapter=3&verse=16


## 🌍 Supported Languages

Here are some of the translations supported by default:

- English (KJV, BBE)
- Chinese (CUV, NCV) with Jyutping + Pinyin
- Arabic
- Spanish (Reina Valera)
- Portuguese (AA, ACF, NVI)
- French (Apee)
- German (Schlachter)
- Korean
- Vietnamese
- Russian
- Greek
- Finnish
- Romanian
- Esperanto

## 🔧 Customization Tips

- To support more languages, just add their respective JSON files into the `/json` directory and update the `availableBibles` object in the HTML.
- You can modify the CSS directly in the `<style>` tag for further UI customizations.

## 📜 License

This project is open-source and available under the [MIT License](https://opensource.org/licenses/MIT).

---

Made with ❤️ to help people engage with Scripture across languages.
