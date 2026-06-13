// Side-effect: compile host SCSS into the embed asset bundle (mapsight.css).
import "../src/scss/mapsight-host.scss";

// Stable runtime entry for host snippets — wraps @mapsight/ui/embed/browser.
import browserEmbed from "@mapsight/ui/embed/browser";

export default browserEmbed;
