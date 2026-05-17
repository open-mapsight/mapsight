import loadJS from "../dom/network/load-js.ts";

/* NOTE: Piwik only works with globals … */
if (typeof window !== "undefined") {
	window._paq = window._paq || [];
}

/**
 * @param piwikURL piwik url
 * @param piwikSiteId piwik site id
 * @param piwikDomains domains to track
 * @param [piwikTrackerUrl] piwik tracker url. default: piwikURL + 'piwik.php'
 */
export function init(
	piwikURL: string,
	piwikSiteId: number,
	piwikDomains: Array<string>,
	piwikTrackerUrl = piwikURL + "piwik.php",
) {
	window._paq.push(["setDomains", piwikDomains]);
	window._paq.push(["enableLinkTracking"]);
	window._paq.push(["enableHeartBeatTimer"]);
	window._paq.push(["setTrackerUrl", piwikTrackerUrl]);
	window._paq.push(["setSiteId", piwikSiteId]);
	window._paq.push(["trackPageView"]);

	if (window.console) {
		console.log(
			`loading piwik ', ${window._paq[0]?.[0]}, ${window._paq[0]?.[1]}`,
		);
	}

	loadJS(piwikURL + "piwik.js", () => {});
}

export function pushPiwikCommand(command: Array<unknown>) {
	window._paq.push(command);
}

export function trackPageView(
	url = window.location.href,
	documentTitle = window.document.title,
) {
	pushPiwikCommand(["setDocumentTitle", documentTitle]);
	pushPiwikCommand(["setCustomUrl", url]);
	pushPiwikCommand(["trackPageView"]);
}

export function trackPiwikGoal(goalId: string) {
	pushPiwikCommand(["trackGoal", goalId]);
}

export function trackEvent(
	category: string,
	action: string,
	name: string | false = false,
	value: string | false = false,
) {
	pushPiwikCommand(["trackEvent", category, action, name, value]);
}

export function trackLink(url: string, linkType = "link") {
	pushPiwikCommand(["trackLink", url, linkType]);
}

export function trackSiteSearch(
	keyword: string,
	category: string | false = false,
	searchCount: string | false = false,
) {
	pushPiwikCommand(["trackSiteSearch", keyword, category, searchCount]);
}
