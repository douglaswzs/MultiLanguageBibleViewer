
import toJyutping from 'https://unpkg.com/to-jyutping@3.1.1?module';

const availableBibles = {
  "ar_svd": "Arabic 🇸🇦",
  "zh_cuv": "Chinese Union Version 🇭🇰",
  "zh_ncv": "New Chinese Version 🇹🇼",
  "de_schlachter": "German 🇩🇪",
  "el_greek": "Modern Greek 🇬🇷",
  "en_bbe": "Basic English 🇺🇸",
  "en_kjv": "King James Version 🇺🇸",
  "eo_esperanto": "Esperanto 🌍",
  "es_rvr": "Reina Valera 🇪🇸",
  "fi_finnish": "Finnish Bible 🇫🇮",
  "fi_pr": "Pyhä Raamattu 🇫🇮",
  "fr_apee": "Le Bible de l'Épée 🇫🇷",
  "ko_ko": "Korean Version 🇰🇷",
  "pt_aa": "Almeida Revisada Imprensa Bíblica 🇵🇹",
  "pt_acf": "Almeida Corrigida e Revisada Fiel 🇧🇷",
  "pt_nvi": "Nova Versão Internacional 🇧🇷",
  "ro_cornilescu": "Versiunea Dumitru Cornilescu 🇷🇴",
  "ru_synodal": "Синодальный перевод 🇷🇺",
  "vi_vietnamese": "Tiếng Việt 🇻🇳"
};

const selects = ["lang1Select", "lang2Select", "lang3Select"];
const bibleCache = {};
let pronunciationMode = localStorage.getItem("pronunciationMode") || 'both';
let cantonesePronunciationModeSelect = localStorage.getItem("cantonesePronunciationModeSelect") || '';
let isHorizontal = localStorage.getItem("layoutMode") === "horizontal";
// =======================
// Global State
// =======================
// const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const prefersDark = false;
let currentTheme = localStorage.getItem("theme") || (prefersDark ? "dark" : "light");

// =======================
// DOM Elements
// =======================

const bibleHeader = document.getElementById("bibleHeader");
const bibleBody = document.getElementById("bibleBody");
const bibleTable = document.getElementById("bibleTable");
const lang1Select = document.getElementById("lang1Select");
const lang2Select = document.getElementById("lang2Select");
const lang3Select = document.getElementById("lang3Select");
const themeToggle = document.getElementById("themeToggle");
const togglePronunciationButton = document.getElementById("togglePronunciation");
const verseJump = document.getElementById("verseJump");
const jumpBtn = document.getElementById("jumpBtn");
const layoutToggleBtn = document.getElementById("toggleLayout");
const copyPermalink = document.getElementById("copyPermalink");
const chapterSelect = document.getElementById("chapterSelect");
const bookSelect = document.getElementById("bookSelect");
const filterToggle = document.getElementById("filterToggle");
const filterPopup = document.getElementById("categoryFilterPopup");
const closePopupBtn = document.getElementById("closePopup");
const cantoneseModeSelect = document.getElementById("cantoneseModeSelect");

// =======================
// Labels & Cycles
// =======================
const soundLabels = {
  on: "🔊 Sound",
  off: "🔇 Muted"
};

const layoutLabels = {
  horizontal: "Toggle: Horizontal",
  side: "Toggle: Side-by-Side"
}
const pronunciationLabels = {
  jyutping: "Jyutping",
  pinyin: "Pinyin",
  both: "Jyutping + Pinyin",
  none: "None"
};
const themeLabels = {
  dark: "☀️",
  light: "🌙"
};


// =======================
// Utility Functions
// =======================
function populateCantoneseMode() {
  if (!cantoneseModeSelect) return;
  const cantoneseOptions = [
    { value: "ipatones", text: "IPATones" },
    { value: "diacritics", text: "Diacritics" },
    { value: "superscript", text: "Superscript" },
    { value: "numbers", text: "Numbers" }
  ];
  cantoneseOptions.forEach(optionData => {
    const option = document.createElement("option");
    option.value = optionData.value;
    option.textContent = optionData.text;
    cantoneseModeSelect.appendChild(option);
  });
  cantoneseModeSelect.value = cantonesePronunciationModeSelect;
}
function populateSelectors() {
  selects.forEach(id => {
    const select = document.getElementById(id);
    for (const key in availableBibles) {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = availableBibles[key];
      select.appendChild(opt);
    }
  });
}

function populateBookSelect(books) {
  bookSelect.innerHTML = "";
  books.forEach(book => {
    const opt = document.createElement("option");
    opt.value = book.abbrev;
    opt.textContent = book.name;
    bookSelect.appendChild(opt);
  });
}

function populateChapterSelect(book) {
  chapterSelect.innerHTML = "";
  book.chapters.forEach((_, idx) => {
    const opt = document.createElement("option");
    opt.value = idx;
    opt.textContent = `Chapter ${idx + 1}`;
    chapterSelect.appendChild(opt);
  });
}

function getQueryParams() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    lang1: urlParams.get('lang1'),
    lang2: urlParams.get('lang2'),
    lang3: urlParams.get('lang3'),
    book: urlParams.get('book'),
    chapter: urlParams.get('chapter'),
    verse: urlParams.get('verse')
  };
}

function applyQueryParams() {
  const { lang1, lang2, lang3, book, chapter, verse } = getQueryParams();

  if (lang1) lang1Select.value = lang1;
  if (lang2) lang2Select.value = lang2;
  if (lang3) lang3Select.value = lang3;

  if (book) localStorage.setItem("bookSelect", book);
  if (chapter) localStorage.setItem("chapterSelect", parseInt(chapter) - 1);

  // Defer jump to verse until after data loads
  if (verse) {
    setTimeout(() => {
      verseJump.value = `${chapter}:${verse}`;
      jumpToVerse();
    }, 1000);
  }
}

async function loadBibleData() {
  bibleHeader.innerHTML = "";
  const headerRow = document.createElement("tr");

  let firstBibleData = null;
  const booksForRender = [];

  for (let i = 0; i < selects.length; i++) {
    const langKey = document.getElementById(selects[i]).value;
    if (!langKey) { booksForRender.push(null); continue; }

    try {
      if (!bibleCache[langKey]) {
        // const res = await fetch(`https://raw.githubusercontent.com/thiagobodruk/bible/master/json/${langKey}.json`);
        const res = await fetch(`./json/${langKey}.json`);
        bibleCache[langKey] = await res.json();
      }
      const bible = bibleCache[langKey];

      if (!firstBibleData) {
        firstBibleData = bible;
        populateBookSelect(firstBibleData);

        const urlBook = getQueryParams().book;
        const savedBook = urlBook || localStorage.getItem("bookSelect") || firstBibleData[0].abbrev;
        bookSelect.value = savedBook;

        const selectedBook = bible.find(b => b.abbrev === savedBook);
        if (selectedBook) {
          populateChapterSelect(selectedBook);
          const urlChap = getQueryParams().chapter;
          const savedChapter = urlChap ? parseInt(urlChap) - 1 : (parseInt(localStorage.getItem("chapterSelect")) || 0);
          chapterSelect.value = savedChapter;
        }
      }

      const selectedBook = bookSelect.value || firstBibleData[0].abbrev;
      const book = bible.find(b => b.abbrev === selectedBook);
      const th = document.createElement("th");
      th.textContent = availableBibles[langKey];
      headerRow.appendChild(th);
      booksForRender.push({ ...book, langKey });
    } catch (err) {
      console.error(`Error loading ${langKey}:`, err);
      booksForRender.push(null);
    }
  }
  bibleHeader.appendChild(headerRow);
  renderChapter(booksForRender);
  checkZhLangSelected();
}

function getJyutpingText(verse) {
  function convertJyutpingToSuperscript(jyutpingString) {
    const superscriptMap = {
      '1': '¹',
      '2': '²',
      '3': '³',
      '4': '⁴',
      '5': '⁵',
      '6': '⁶'
    };

    return jyutpingString.replace(/[1-9]/g, match => superscriptMap[match]);
  }
  function convertJyutpingToIPATones(jyutpingString) {
    const ipaToneMap = {
      '1': '˥',   // High level
      '2': '˧˥',  // High rising
      '3': '˧',   // Mid level
      '4': '˨˩',  // Low falling
      '5': '˩˧',  // Low rising
      '6': '˩'    // Low level
    };

    return jyutpingString.replace(/[1-6]/g, match => ipaToneMap[match] || match);
  }
  function convertJyutpingToDiacritics(jyutpingString) {
    const toneMap = {
      'a': ['ā', 'á', 'a', 'à', 'ǎ', 'a̱'],
      'e': ['ē', 'é', 'e', 'è', 'ě', 'e̱'],
      'i': ['ī', 'í', 'i', 'ì', 'ǐ', 'i̱'],
      'o': ['ō', 'ó', 'o', 'ò', 'ǒ', 'o̱'],
      'u': ['ū', 'ú', 'u', 'ù', 'ǔ', 'u̱'],
      'oe': ['œ̄', 'œ́', 'œ', 'œ̀', 'œ̌', 'œ̱'],
      'yu': ['ǖ', 'ǘ', 'yu', 'ǜ', 'ǚ', 'y̱u']
    };

    // Match syllables ending with tone numbers 1–6
    return jyutpingString.replace(/([a-z]+)([1-6])/gi, (_, base, toneStr) => {
      const tone = parseInt(toneStr) - 1;

      // Search for vowel groups in order of complexity
      const vowels = ['yu', 'oe', 'a', 'e', 'i', 'o', 'u'];
      for (let v of vowels) {
        if (base.includes(v)) {
          const replacement = toneMap[v]?.[tone];
          if (!replacement) return base;

          // Replace only the first instance of the vowel
          const result = base.replace(v, replacement);
          return result;
        }
      }

      // If no vowel match, return original
      return base;
    });
  }

  let jyutpingString = toJyutping.getJyutpingText(verse);
  if (cantonesePronunciationModeSelect === "diacritics") {
    return convertJyutpingToDiacritics(jyutpingString);
  } else if (cantonesePronunciationModeSelect === "superscript") {
    return convertJyutpingToSuperscript(jyutpingString);
  } else if (cantonesePronunciationModeSelect === "ipatones") {
    return convertJyutpingToIPATones(jyutpingString);
  } else if (cantonesePronunciationModeSelect === "numbers") {
    return jyutpingString;
  } else {
    return jyutpingString;
  }
}
function createVerseLineWithTTS(verseText, langKey, translatedText = null) {
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.justifyContent = "space-between";
  container.style.alignItems = "center";
  container.style.gap = "12px";

  const span = document.createElement("span");
  span.textContent = translatedText ?? verseText;

  const btn = document.createElement("button");
  btn.textContent = "🔊";
  btn.title = "Read aloud";
  btn.style.cursor = "pointer";
  btn.onclick = () => speakText(verseText, langKey);

  container.appendChild(span);
  container.appendChild(btn);
  return container;
}
function renderChapter(books) {
  const chapIdx = parseInt(chapterSelect.value) || 0;
  const bibleBody = document.getElementById("bibleBody");
  bibleBody.innerHTML = "";

  const maxVerses = Math.max(...books.map(b => b?.chapters[chapIdx]?.length || 0));

  for (let v = 0; v < maxVerses; v++) {
    const tr = document.createElement("tr");
    tr.setAttribute("data-chapter-verse", `${chapIdx + 1}:${v + 1}`);
    tr.setAttribute("data-verse", `${v + 1}`);
    books.forEach(book => {
      if (!book) return; // skip rendering empty column
      const td = document.createElement("td");
      if (book && book.chapters[chapIdx][v]) {
        const verse = book.chapters[chapIdx][v];
        const verseTxt = `${v + 1}: ${verse}`;
        const verseDiv = document.createElement("div");

        const verseLine = createVerseLineWithTTS(`${v + 1}: ${verse}`, book.langKey);
        td.appendChild(verseLine);


        if (book.langKey === "zh_cuv" || book.langKey === "zh_ncv") {
          const showJ = pronunciationMode === "jyutping" || pronunciationMode === "both";
          const showP = pronunciationMode === "pinyin" || pronunciationMode === "both";

          if (showJ) {
            const j = createVerseLineWithTTS(verse, "zh-HK", getJyutpingText(verse));
            j.className = "jyutping";
            td.appendChild(j);
          }

          if (showP && window.pinyinPro && window.pinyinPro.pinyin) {
            const py = document.createElement("div");
            // py.textContent = window.pinyinPro.pinyin(verse, { toneType: 'num' });
            py.textContent = window.pinyinPro.pinyin(verse);
            py.className = "pinyin";
            td.appendChild(py);
          }
        }
      }
      tr.appendChild(td);
    });
    bibleBody.appendChild(tr);
  }
  document.querySelectorAll("#bibleBody tr").forEach(tr => {
    tr.addEventListener("click", () => {
      const selectedVerse = tr.getAttribute("data-verse");
      localStorage.setItem("selectedVerse", selectedVerse);
      const selectedChapterVerse = tr.getAttribute("data-chapter-verse");
      localStorage.setItem("selectedChapterVerse", selectedChapterVerse);

      document.querySelectorAll(".highlighted").forEach(el => el.classList.remove("highlighted"));
      tr.classList.add("highlighted");
    });
    const storedVerse = localStorage.getItem("selectedChapterVerse");
    if (storedVerse) {
      const previouslySelected = document.querySelector(`tr[data-chapter-verse='${storedVerse}']`);
      if (previouslySelected) {
        previouslySelected.classList.add("highlighted");
      }
    }
  });
}

function onBookOrChapterChange() {
  const bookAbbrev = bookSelect.value;
  localStorage.setItem("bookSelect", bookAbbrev);

  const books = selects.map(id => {
    const langKey = document.getElementById(id).value;
    const book = langKey && bibleCache[langKey]
      ? bibleCache[langKey].find(b => b.abbrev === bookAbbrev)
      : null;
    return book ? { ...book, langKey } : null;
  });

  renderChapter(books);
}

function checkZhLangSelected() {
  const show = selects.some(id => {
    const val = document.getElementById(id).value;
    return val === "zh_cuv" || val === "zh_ncv";
  });
  togglePronunciationButton.style.display = show ? "inline" : "none";
}

function jumpToVerse() {
  const val = verseJump.value.trim();
  const matchFull = val.match(/^(\w+)\s+(\d+):(\d+)$/i); // book chapter:verse
  const matchPartial = val.match(/^(\d+):(\d+)$/);         // chapter:verse
  const matchChapterOnly = val.match(/^(\w+)\s+(\d+)$/i); // book chapter

  if (matchFull) {
    const bookName = matchFull[1].toLowerCase();
    const chapter = parseInt(matchFull[2]) - 1;
    const verse = parseInt(matchFull[3]);

    const langKey = lang1Select.value;
    if (!langKey || !bibleCache[langKey]) return;
    const bible = bibleCache[langKey];
    const book = bible.find(b => b.name.toLowerCase() === bookName || b.abbrev.toLowerCase() === bookName);

    if (!book) return;
    bookSelect.value = book.abbrev;
    localStorage.setItem("bookSelect", book.abbrev);
    populateChapterSelect(book);
    chapterSelect.value = chapter;
    localStorage.setItem("chapterSelect", chapter);
    onBookOrChapterChange();

    setTimeout(() => {
      const target = `${chapter + 1}:${verse}`;
      document.querySelectorAll(".highlighted").forEach(el => el.classList.remove("highlighted"));
      const row = document.querySelector(`tr[data-chapter-verse='${target}']`);
      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "start" });
        row.classList.add("highlighted");
      }
    }, 200);

  } else if (matchPartial) {
    const chapter = parseInt(matchPartial[1]) - 1;
    const verse = parseInt(matchPartial[2]);
    chapterSelect.value = chapter;
    localStorage.setItem("chapterSelect", chapter);
    onBookOrChapterChange();

    setTimeout(() => {
      const target = `${chapter + 1}:${verse}`;
      document.querySelectorAll(".highlighted").forEach(el => el.classList.remove("highlighted"));
      const row = document.querySelector(`tr[data-chapter-verse='${target}']`);
      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "start" });
        row.classList.add("highlighted");
      }
    }, 200);

  } else if (matchChapterOnly) {
    const bookName = matchChapterOnly[1].toLowerCase();
    const chapter = parseInt(matchChapterOnly[2]) - 1;

    const langKey = lang1Select.value;
    if (!langKey || !bibleCache[langKey]) return;
    const bible = bibleCache[langKey];
    const book = bible.find(b => b.name.toLowerCase() === bookName || b.abbrev.toLowerCase() === bookName);

    if (!book) return;
    bookSelect.value = book.abbrev;
    localStorage.setItem("bookSelect", book.abbrev);
    populateChapterSelect(book);
    chapterSelect.value = chapter;
    localStorage.setItem("chapterSelect", chapter);
    onBookOrChapterChange();
  }
}

function bookSelectOnChange() {
  const value = bookSelect.value;
  localStorage.setItem("bookSelect", value);

  const langKey = lang1Select.value;
  if (!langKey || !bibleCache[langKey]) return;
  const book = bibleCache[langKey].find(b => b.abbrev === value);
  if (book) {
    populateChapterSelect(book);
    chapterSelect.value = 0;
    localStorage.setItem("chapterSelect", 0);
    onBookOrChapterChange();
  }
}

function chapterOnChange() {
  const value = chapterSelect.value;
  localStorage.setItem("chapterSelect", value);
  onBookOrChapterChange();
}
function cantonesePronunciationChange() {
  const value = cantoneseModeSelect.value;
  cantonesePronunciationModeSelect = value;
  localStorage.setItem("cantonesePronunciationModeSelect", value);
  onBookOrChapterChange();
}
function togglePronunciationButtonOnClick() {
  if (pronunciationMode === "jyutping") {
    pronunciationMode = "pinyin";
  } else if (pronunciationMode === "pinyin") {
    pronunciationMode = "both";
  } else if (pronunciationMode === "both") {
    pronunciationMode = "none";
  } else {
    pronunciationMode = "jyutping";
  }
  localStorage.setItem("pronunciationMode", pronunciationMode);
  updateToggleText(togglePronunciationButton, pronunciationLabels, pronunciationMode);
  onBookOrChapterChange();
}
function loadVoices() {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) return resolve(voices);

    speechSynthesis.onvoiceschanged = () => {
      const updatedVoices = speechSynthesis.getVoices();
      if (updatedVoices.length > 0) resolve(updatedVoices);
    };
  });
}
async function speakText(text, langKey) {
  if (!window.speechSynthesis) {
    alert("Your browser does not support text-to-speech.");
    return;
  }

  // Stop any current speech
  if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
    window.speechSynthesis.cancel();
  }

  if (langKey == "zh_cuv") {
    text = text.replace(/\s+/g, '');
  }
  const voices = await loadVoices();
  const utterance = new SpeechSynthesisUtterance(text);

  // Map Bible language key to browser TTS language codes
  const langMap = {
    "zh-HK": "zh-HK",
    "zh_cuv": "zh-CN",
    "zh_ncv": "zh-CN",
    "en_kjv": "en-US",
    "en_bbe": "en-US",
    "es_rvr": "es-ES",
    "fr_apee": "fr-FR",
    "de_schlachter": "de-DE",
    "ru_synodal": "ru-RU",
    "ko_ko": "ko-KR",
    "vi_vietnamese": "vi-VN",
    "pt_aa": "pt-PT",
    "pt_acf": "pt-BR",
    "pt_nvi": "pt-BR",
    "el_greek": "el-GR",
    "ar_svd": "ar-SA",
    "eo_esperanto": "eo",
    "fi_finnish": "fi-FI",
    "fi_pr": "fi-FI",
    "ro_cornilescu": "ro-RO"
  };

  utterance.lang = langMap[langKey] || "en-US";

  const matchedVoice = voices.find(v => v.lang === utterance.lang);
  if (matchedVoice) utterance.voice = matchedVoice;

  // Speak the verse
  window.speechSynthesis.speak(utterance);
}

function copyPermalinkOnClick() {
  const lang1 = lang1Select.value;
  const lang2 = lang2Select.value;
  const lang3 = lang3Select.value;
  const book = bookSelect.value;
  const chapter = parseInt(chapterSelect.value) + 1;
  const verse = localStorage.getItem("selectedVerse")

  const url = new URL(window.location.href);
  url.searchParams.set("lang1", lang1);
  if (lang2) url.searchParams.set("lang2", lang2);
  if (lang3) url.searchParams.set("lang3", lang3);
  url.searchParams.set("book", book);
  url.searchParams.set("chapter", chapter);
  if (verse) url.searchParams.set("verse", verse);

  navigator.clipboard.writeText(url.toString())
    .then(() => alert("Link copied to clipboard!"))
    .catch(err => console.error("Copy failed", err));
}
function updateLayoutToggle() {
  let layoutClass = isHorizontal ? "horizontal" : "side";
  updateToggleText(layoutToggleBtn, layoutLabels, layoutClass);
  if (isHorizontal) {
    bibleTable.classList.add("horizontal-layout");
  } else {
    bibleTable.classList.remove("horizontal-layout");
  }
}

function layoutToggleBtnOnClick() {
  isHorizontal = !isHorizontal;
  let layoutClass = isHorizontal ? "horizontal" : "side";
  localStorage.setItem("layoutMode", layoutClass);
  updateLayoutToggle();
}

function filterToggleOnClick() {
  filterPopup?.classList.toggle("show");
}
function themeToggleOnClick() {
  {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", currentTheme);
    applyTheme(currentTheme);
  }
}
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  updateToggleText(themeToggle, themeLabels, theme);
}
function updateToggleText(toggle, labels, currentValue) {
  toggle.textContent = labels[currentValue];
}
// ---------- INIT ----------
applyTheme(currentTheme);
updateLayoutToggle();
updateToggleText(togglePronunciationButton, pronunciationLabels, pronunciationMode);
populateSelectors();
populateCantoneseMode();

selects.forEach(id => {
  const saved = localStorage.getItem(id);
  if (saved) {
    document.getElementById(id).value = saved;
  }
});
window.speechSynthesis.onvoiceschanged = () => {
  window.speechSynthesis.getVoices();
};

applyQueryParams();
loadBibleData();

selects.forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener("change", () => {
    localStorage.setItem(id, el.value);
    loadBibleData();
  });
});


// =======================
// Events
// =======================
themeToggle?.addEventListener("click", themeToggleOnClick);
bookSelect.addEventListener("change", bookSelectOnChange);
chapterSelect.addEventListener("change", chapterOnChange);
cantoneseModeSelect.addEventListener("change", cantonesePronunciationChange);
togglePronunciationButton.addEventListener("click", togglePronunciationButtonOnClick);
copyPermalink.addEventListener("click", copyPermalinkOnClick);
jumpBtn.addEventListener("click", jumpToVerse);
layoutToggleBtn.addEventListener("click", layoutToggleBtnOnClick);
filterToggle?.addEventListener("click", filterToggleOnClick);
closePopupBtn?.addEventListener("click", (e) => {
  filterPopup?.classList.remove("show");
});
document?.addEventListener("click", (e) => {
  if (!filterPopup?.contains(e.target) && !filterToggle?.contains(e.target)) {
    filterPopup?.classList.remove("show");
  }
});