// ==UserScript==
// @name        ABC iview
// @namespace   tarinnik.github.io/media
// @version     3.6.10
// @include     https://iview.abc.net.au/*
// @icon        https://iview.abc.net.au/favicon.ico
// ==/UserScript==

const BACKGROUND_COLOUR = "background:#326060";
const VIDEO_TAG = "article";
const ROOT_URL = "https://iview.abc.net.au/";
const HOME_SECTION_CLASS = "flickity-enabled is-draggable";
const HOME_AD_BANNER = "iv-1pJQi";
const HOME_SLIDESHOW_SELECTED = "is-selected";
const MY_LIST_URL = "https://iview.abc.net.au/your/watchlist";
const RECENT_URL = "https://iview.abc.net.au/your/recent";
const MY_LIST_MENU_CLASS = "iv-3irN5";
const MY_LIST_COLUMNS = 4;
const SHOW_URL = "https://iview.abc.net.au/show/";
const SHOW_URL_LENGTH = 30;
const SHOW_TITLE_TAG = "h1";
const SHOW_MAIN_VIDEO_CLASS = "iv-3w3h-";
const SHOW_EPISODE_VIDEO_CLASS = "iv-3eQmh";
const SHOW_SEASON_SELECTOR = "seriesSelectorButton";
const SHOW_SEASON_BUTTONS = "seriesSelectorMenu";
const SHOW_MORE_EPISODES_CLASS = "iv-2Ytq4 iv-3HZGv iv-1rAsK iv-3Xfsg";
const VIDEO_FULLSCREEN_CLASS = "jw-icon-fullscreen";
const VIDEO_CLOSE_CLASS = "iv-2Ytq4 iv-2cROb iv-1Grls iconLarge iv-1TNOF iv-3Xfsg";
const SEARCH_TEXT = "Search: ";
const SEARCH_BAR_ID = "searchField";

let STATE = {
	selection: 0,
	menu: false,
	videoSelection: 0,
	search: false,
	numSameKeyPresses: 0,
	lastKeyPressed: '',
	searchQuery: "",
	changingChar: '',
	// Experimental search feature
	searching: false,
};

const searchLetters = [
	[' ', '0'],
	['q', 'r', 's', '1'],
	['t', 'u', 'v', '2'],
	['w', 'x', 'y', 'z', '3'],
	['g', 'h', 'i', '4'],
	['j', 'k', 'l', '5'],
	['m', 'n', 'o', 'p', '6'],
	['7'],
	['a', 'b', 'c', '8'],
	['d', 'e', 'f', '9']
];

const DIRECTION = {
	remove: 'r',
	none: 0,
	forwards: 1,
	backwards: -1,
	up: -2,
	down: 2,
};

/**
 * Triggered when the page loads
 */
window.addEventListener('load', function() {
	if (checkList()) {
		STATE.menu = true;
	} else if (checkShow()) {
		document.getElementsByTagName(SHOW_TITLE_TAG)[0].scrollIntoView();
	} else if (checkHome()) {
		if (document.getElementsByClassName(HOME_AD_BANNER).length !== 0) {
			document.getElementsByClassName(HOME_AD_BANNER)[0].remove();
		}
	}
	highlight(DIRECTION.none);
});

/**
 * Triggered when a key is pressed
 */
document.addEventListener('keydown', function(event) {
	key(event);
});

/**
 * Determines the key press
 * @param event that was triggered
 */
function key(event) {
	if (STATE.searching) return;

	if (STATE.search) {
		searchKey(event.key);
		return;
	}

	switch (event.key) {
		case '1':
			list();
			break;
		case '2':
			down();
			break;
		case '3':
			fullscreen();
			break;
		case '4':
			left();
			break;
		case '5':
			select();
			break;
		case '6':
			right();
			break;
		case '7':
			home();
			break;
		case '8':
			up();
			break;
		case '9':
			back();
			break;
		case '0':
			search();
			break;
		case '.':
			break;
		case '+':
			seasons();
			break;
		case '-':
			break;
		case '/':
			refresh();
			break;
	}
}

/**
 * Checks if the current page is the home page
 * @return {boolean} if the current page is the home page
 */
function checkHome() {
	return window.location.href === ROOT_URL;
}

/**
 * Checks if the current page is the watchlist
 * @returns {boolean} if the current page is my list
 */
function checkList() {
	return window.location.href === MY_LIST_URL || window.location.href === RECENT_URL;
}

/**
 * Checks if the current page is the show page
 * @returns {boolean} if the current page is the show page
 */
function checkShow() {
	return window.location.href.slice(0, SHOW_URL_LENGTH) === SHOW_URL;
}

/**
 * Gets the elements that are to be selected
 */
function getElements() {
	// My list or watch history
	if (checkList()) {
		if (STATE.menu) {
			return document.getElementsByClassName(MY_LIST_MENU_CLASS);
		} else {
			return document.getElementsByTagName(VIDEO_TAG);
		}

	// Episode page
	} else if (checkShow()) {
		if (STATE.menu) {
			return document.getElementById(SHOW_SEASON_BUTTONS).childNodes;
		} else {
			let e = [];
			e.push(document.getElementsByClassName(SHOW_MAIN_VIDEO_CLASS)[0]);
			let episodes = document.getElementsByClassName(SHOW_EPISODE_VIDEO_CLASS)[0].getElementsByTagName(VIDEO_TAG);
			for (let i = 0; i < episodes.length; i++) {
				e.push(episodes[i]);
			}
			return e;
		}

	// Home page
	} else if (checkHome()) {
		// Selecting a video, not a category
		if (STATE.menu) {
			let e = [];
			let elements = document.getElementsByClassName(HOME_SECTION_CLASS)[STATE.videoSelection].getElementsByTagName("a");
			for (let i = 0; i < elements.length; i++) {
				e.push(elements[i].getElementsByTagName("header")[0]);
			}
			console.log("Home videos: ", e);
			return e;
		} else {
			let e = [];
			let sections = document.getElementsByClassName(HOME_SECTION_CLASS);
			e.push(sections[0]);
			for (let i = 1; i < sections.length; i++) {
				e.push(sections[i].getElementsByTagName("a")[0].getElementsByTagName("header")[0]);
			}
			console.log("Home section: ", e);
			return e;
		}
	}
}

/**
 * Gets the number of columns the elements have
 * @returns {number} number of columns
 */
function getColumns() {
	if (checkList()) {
		return MY_LIST_COLUMNS;
	} else {
		return 1;
	}
}

/**
 * Toggles if the menu is selected or not
 */
function toggleMenu() {
	highlight(DIRECTION.remove);
	STATE.menu = !STATE.menu;
	STATE.selection = 0;
	highlight(DIRECTION.none);
}

/**
 * Swaps STATE.videoSelection and STATE.selection
 */
function swapState() {
	let temp = STATE.selection;
	STATE.selection = STATE.videoSelection;
	STATE.videoSelection = temp;
}

/**
 * Removes the highlighting of a video on the home page
 */
function removeHomeVideoHighlight() {
	if (STATE.menu) {
		swapState();
		highlight(DIRECTION.remove);
		swapState();
		STATE.videoSelection = 0;
		STATE.menu = false;
	}
}

function scrollVideos(d) {
	if (checkHome()) {
		if (d === DIRECTION.forwards && STATE.selection % MY_LIST_COLUMNS === 0 && STATE.selection > 0) {
			let next = document.getElementsByClassName(HOME_SECTION_CLASS)[STATE.videoSelection].getElementsByTagName("button")[1];
			console.log("Next Button: ", next);
			next.click();
		} else if (d === DIRECTION.backwards && STATE.selection % MY_LIST_COLUMNS === 3) {
			let previous = document.getElementsByClassName(HOME_SECTION_CLASS)[STATE.videoSelection].getElementsByTagName("button")[0];
			console.log("Previous Button: ", previous);
			previous.click();
		}
	}
}

/**
 * Highlights an element
 * @param d direction to highlight in
 */
function highlight(d) {
	let elements = getElements();
	let columns = getColumns();

	// Highlight the current element
	if (d === DIRECTION.none) {
		elements[STATE.selection].setAttribute("style", BACKGROUND_COLOUR);

	// Remove the highlight from the current element
	} else if (d === DIRECTION.remove) {
		elements[STATE.selection].removeAttribute("style");

	// Highlight forward but at the end of the elements
	} else if (STATE.selection === elements.length - 1 && d === DIRECTION.forwards) {
		return;

	// Highlight backwards but at the start of the elements
	} else if (STATE.selection === 0 && d === DIRECTION.backwards) {
		return;

	// Highlights the element in the row above or below
	} else if (d === DIRECTION.up || d === DIRECTION.down) {
		if (d === DIRECTION.up && STATE.selection < columns) {
			return;
		}
		highlight(DIRECTION.remove);
		let multiplier = d / 2;
		if (d === DIRECTION.down) {
			if (STATE.selection >= elements.length - columns) {
				STATE.selection = elements.length - 1;
				highlight(DIRECTION.none);
				return;
			}
		}
		STATE.selection += (columns * multiplier);
		highlight(DIRECTION.none);

	// Highlighting forwards or backwards with an element on the relevant side
	} else {
		highlight(DIRECTION.remove);
		STATE.selection += d;
		highlight(DIRECTION.none);
	}

	scroll();
}

/**
 * 5 (select) was pressed
 */
function select() {
	if (checkList()) {
		if (STATE.menu) {
			getElements()[STATE.selection].getElementsByTagName('a')[0].click();
		} else {
			getElements()[STATE.selection].getElementsByTagName("a")[0].click();
		}
	} else if (checkShow()) {
		if (STATE.menu) {
			getElements()[STATE.selection].click();
			toggleMenu();
		} else {
			getElements()[STATE.selection].getElementsByTagName("button")[2].click();
		}
	} else if (checkHome()) {
		if (STATE.selection === 0) {
			getElements()[0].getElementsByClassName(HOME_SLIDESHOW_SELECTED)[0].click();
		} else {
			if (STATE.menu) {
				swapState();
			}
			getElements()[STATE.selection].parentNode.parentNode.click();
		}
	}
}

/**
 * 6 (right arrow) was pressed
 */
function right() {
	if (checkList()) {
		highlight(DIRECTION.forwards);
	} else if (checkHome()) {
		if (STATE.selection === 0) {
			getElements()[0].children[2].click();
		} else {
			swapState();
			STATE.menu = true;
			highlight(DIRECTION.forwards);
			scrollVideos(DIRECTION.forwards);
			swapState();
		}
	}
}

/**
 * 4 (left arrow) was pressed
 */
function left() {
	if (checkList()) {
		highlight(DIRECTION.backwards);
	} else if (checkHome()) {
		if (STATE.selection === 0) {
			getElements()[0].children[1].click()
		} else {
			swapState();
			STATE.menu = true;
			highlight(DIRECTION.backwards);
			scrollVideos(DIRECTION.backwards);
			swapState();
		}
	}
}

/**
 * 8 (up arrow) was pressed
 */
function up() {
	if (checkList()) {
		if (!STATE.menu && STATE.selection < MY_LIST_COLUMNS) {
			toggleMenu();
		} else {
			highlight(DIRECTION.up);
		}
	} else if (checkShow()) {
		highlight(DIRECTION.up);
	} else if (checkHome()) {
		removeHomeVideoHighlight();
		highlight(DIRECTION.backwards);
	}

}

/**
 * 2 (down arrow) was pressed
 */
function down() {
	if (checkList()) {
		if (STATE.menu) {
			toggleMenu();
		} else {
			highlight(DIRECTION.down);
		}
	} else if (checkShow()) {
		let more = document.getElementsByClassName(SHOW_MORE_EPISODES_CLASS);
		if (more.length !== 0) {
			more[0].click();
		}
		highlight(DIRECTION.down);
	} else if (checkHome()) {
		removeHomeVideoHighlight();
		highlight(DIRECTION.forwards);
	}
}

/**
 * Scrolls the page so the selected element if visible
 */
function scroll() {
	let columns = getColumns();
	let defaultPosition;
	let elements = getElements();
	if (checkList()) {
		defaultPosition = null;
	} else if (checkShow()) {
		if (STATE.menu) {
			return;
		} else {
			defaultPosition = document.getElementsByTagName(SHOW_TITLE_TAG)[0];
		}
	} else if (checkHome()) {
		if (STATE.menu) {
			return;
		} else {
			defaultPosition = null;
		}
	}

	if (STATE.selection < columns) {
		try {
			defaultPosition.scrollIntoView();
		} catch (TypeError) {
			window.scrollTo(0, 0);
		}
	} else {
		elements[STATE.selection - columns].scrollIntoView();
	}
}

/**
 * Selects the season selector
 */
function seasons() {
	if (checkShow()) {
		document.getElementById(SHOW_SEASON_SELECTOR).click();
		toggleMenu();
		document.getElementsByTagName(SHOW_TITLE_TAG)[0].scrollIntoView();
	}
}

/**
 * Closes the video if one is open, otherwise goes to the home page
 */
function back() {
	if (document.getElementsByTagName("video").length !== 0) {
		document.getElementsByClassName(VIDEO_CLOSE_CLASS)[0].click();
	} else {
		window.location = "/";
	}
}

function search() {
	STATE.search = true;
	let d = document.createElement("div");
	d.id = "search";
	document.getElementsByTagName("body")[0].insertBefore(d,
		document.getElementById("main-app"));
	let t = document.createElement("h1");
	t.innerHTML = SEARCH_TEXT;
	t.id = "query";
	t.style.paddingLeft = "10px";
	t.style.color = "white";
	d.appendChild(t);
	window.scrollTo(0, 0);
}

function searchKey(key) {
	if (key === "Enter") {
		let q = STATE.searchQuery + STATE.changingChar;
		resetSearch();
		document.getElementById(SEARCH_BAR_ID).focus();
		setTimeout(function () {
			STATE.searching = true;
			for (let i = 0; i < q.length; i++) {
				let keyEvent = new KeyboardEvent("keydown", {"key":q[i]});
				document.dispatchEvent(keyEvent);
			}
			STATE.searching = false;
		}, 2000);

	} else if (key === '-') {
		if (STATE.changingChar !== '') {
			STATE.changingChar = '';
			STATE.lastKeyPressed = '';
			STATE.numSameKeyPresses = 0;
		} else if (STATE.searchQuery.length !== 0) {
			STATE.searchQuery = STATE.searchQuery.slice(0, length - 1);
		}
	} else if (key === '+') {
		resetSearch();
		document.getElementById("search").remove();
	} else if (key !== STATE.lastKeyPressed || key === '.') {
		STATE.searchQuery += STATE.changingChar;
		STATE.changingChar = '';
		STATE.lastKeyPressed = key;
		STATE.numSameKeyPresses = 0;
	}

	let num = parseInt(key);
	if (!isNaN(num)) {
		let len = searchLetters[num].length;
		STATE.changingChar = searchLetters[num][STATE.numSameKeyPresses % len];
		STATE.numSameKeyPresses++;
	}

	document.getElementById("query").innerHTML = SEARCH_TEXT + STATE.searchQuery + STATE.changingChar;
}

function resetSearch() {
	STATE.searchQuery = "";
	STATE.changingChar = '';
	STATE.lastKeyPressed = '';
	STATE.numSameKeyPresses = 0;
	STATE.search = false;
}

/**
 * Makes the video fullscreen
 */
function fullscreen() {
	document.getElementsByClassName(VIDEO_FULLSCREEN_CLASS)[0].click();
}

/**
 * Navigates to the list page
 */
function list() {
	window.location = "/your/watchlist";
}

/**
 * Goes back to the media home page
 */
function home() {
	window.location = "https://tarinnik.github.io/media/";
}

/**
 * Refreshes the page
 */
function refresh() {
	window.location = window.location.href;
}