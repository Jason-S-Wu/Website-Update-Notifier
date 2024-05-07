const config = await Bun.file('config.json').json();

const webhook = config.webhook;
const websites = config.websites;
const interval = config.interval;

const all_website_hashes: { [website: string]: string } = {};

async function websiteChanged(website: string): Promise<boolean> {
  try {
    const response = await fetch(website);
    const contents = await response.text();
    const hasher = new Bun.CryptoHasher('md5');
    const hash = hasher.update(contents).digest('hex');
    if (all_website_hashes[website] === hash) {
      return false;
    } else {
      all_website_hashes[website] = hash;
      return true;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
}

async function main() {
  for (const website of websites) {
    if (await websiteChanged(website)) {
      try {
        await fetch(webhook, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: `Website ${website} has changed!`,
          }),
        });
      } catch (error) {
        console.error(error);
      }
    }
  }
}

setInterval(main, interval);
