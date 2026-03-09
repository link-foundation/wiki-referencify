/**
 * Test Wikipedia API case handling
 */

const WIKIPEDIA_API_BASE = 'https://en.wikipedia.org/w/api.php';

async function fetchWikipediaApi(params) {
  const urlParams = new URLSearchParams({
    ...params,
    format: 'json',
    origin: '*',
  });
  const url = `${WIKIPEDIA_API_BASE}?${urlParams.toString()}`;
  const response = await fetch(url);
  return response.json();
}

// Test with both 'Atlas' and 'atlas'
const titles = ['Atlas', 'atlas'];
const titlesParam = titles.join('|');

const data = await fetchWikipediaApi({
  action: 'query',
  titles: titlesParam,
  prop: 'pageprops|info',
  redirects: '1',
});

console.log('Raw API response:');
console.log(JSON.stringify(data, null, 2));
