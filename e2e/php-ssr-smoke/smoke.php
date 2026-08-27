<?php
/**
 * Generic CMS-shaped SSR smoke (host-agnostic).
 *
 * Modes:
 *   success  — POST to sidecar; require HTML fragment with data-dehydrated-state
 *   fallback — sidecar unreachable; emit client-only markup (graceful degradation)
 *
 * Env:
 *   MAPSIGHT_SSR_URL   base URL, e.g. http://127.0.0.1:4123
 *   MAPSIGHT_SMOKE_MODE success|fallback
 */

declare(strict_types=1);

$mode = getenv('MAPSIGHT_SMOKE_MODE') ?: 'success';
$baseUrl = rtrim((string) getenv('MAPSIGHT_SSR_URL'), '/');
$containerId = 'mapsight-embed-php-smoke';

if ($mode === 'success') {
	if ($baseUrl === '') {
		fwrite(STDERR, "MAPSIGHT_SSR_URL is required for success mode\n");
		exit(1);
	}
	$fragment = postSidecar($baseUrl . '/render', [
		'options' => [
			'containerId' => $containerId,
			'containerClassName' => 'mapsight-embed',
			'shellHtml' => '<div class="mapsight-ssr-shell">ssr</div>',
			'dehydratedState' => [
				'app' => ['title' => 'php-ssr-smoke'],
			],
		],
	], 2.0);
	assertContains($fragment, 'id="' . $containerId . '"', 'container id');
	assertContains($fragment, 'data-dehydrated-state=', 'dehydrated attribute');
	assertContains($fragment, 'php-ssr-smoke', 'dehydrated title');
	assertContains($fragment, 'mapsight-ssr-shell', 'shell html');
	fwrite(STDOUT, "OK success\n");
	exit(0);
}

if ($mode === 'fallback') {
	// Point at a closed port on loopback — must not hang the smoke.
	$deadUrl = $baseUrl !== '' ? $baseUrl : 'http://127.0.0.1:1';
	try {
		postSidecar($deadUrl . '/render', ['options' => ['containerId' => $containerId]], 0.4);
		fwrite(STDERR, "expected sidecar failure for fallback mode\n");
		exit(1);
	} catch (Throwable $e) {
		$html = clientOnlyFallback($containerId);
		assertContains($html, 'id="' . $containerId . '"', 'fallback id');
		assertNotContains($html, 'data-dehydrated-state', 'no dehydrated state on fallback');
		assertContains($html, 'mapsight-ssr-skipped', 'fallback marker');
		fwrite(STDOUT, "OK fallback\n");
		exit(0);
	}
}

fwrite(STDERR, "unknown MAPSIGHT_SMOKE_MODE: {$mode}\n");
exit(1);

/**
 * @param array<string, mixed> $payload
 */
function postSidecar(string $url, array $payload, float $timeoutSeconds): string
{
	$json = json_encode($payload, JSON_THROW_ON_ERROR);
	$context = stream_context_create([
		'http' => [
			'method' => 'POST',
			'header' => "Content-Type: application/json\r\nContent-Length: " . strlen($json) . "\r\n",
			'content' => $json,
			'timeout' => $timeoutSeconds,
			'ignore_errors' => true,
		],
	]);

	$body = @file_get_contents($url, false, $context);
	if ($body === false) {
		throw new RuntimeException('sidecar request failed');
	}

	$status = 0;
	if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) {
		$status = (int) $m[1];
	}
	if ($status < 200 || $status >= 300) {
		throw new RuntimeException('sidecar HTTP ' . $status);
	}

	return $body;
}

function clientOnlyFallback(string $containerId): string
{
	return '<!-- mapsight-ssr-skipped -->'
		. '<div id="' . htmlspecialchars($containerId, ENT_QUOTES) . '" class="mapsight-embed"></div>';
}

function assertContains(string $haystack, string $needle, string $label): void
{
	if (!str_contains($haystack, $needle)) {
		fwrite(STDERR, "assert failed ({$label}): missing {$needle}\n");
		fwrite(STDERR, $haystack . "\n");
		exit(1);
	}
}

function assertNotContains(string $haystack, string $needle, string $label): void
{
	if (str_contains($haystack, $needle)) {
		fwrite(STDERR, "assert failed ({$label}): unexpectedly found {$needle}\n");
		fwrite(STDERR, $haystack . "\n");
		exit(1);
	}
}
