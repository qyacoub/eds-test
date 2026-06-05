/*
 * Rich editorial content for the "Visiting Montréal" site, keyed by slug.
 * `hero` is the EDS content-addressed media path (generated with Adobe Firefly Image 4 Ultra
 * and uploaded to DA). intro = lead paragraph; prose = body paragraphs; highlights = bullet list;
 * tip = callout. The canonical DEFECT for each page lives in scenarios.mjs and is unchanged.
 */

export const content = {
  'canonical-clean-control': {
    hero: '/media/media_149045962d5e94fcea74589906cfb23703ed89fe2.jpg',
    intro: 'Where Montréal began — cobblestone streets, river breezes and four centuries of history along the St. Lawrence.',
    prose: [
      'The Old Port stretches for more than two kilometres along the waterfront, a reborn industrial harbour that is now the city’s favourite place to stroll, cycle and watch the boats drift by. Start at the Clock Tower for skyline views, then wander west past street performers and terrace cafés.',
      'In summer the quays fill with festivals and pop-up beaches; in winter the basin freezes into a sparkling open-air skating rink. Whatever the season, this is the heart of Vieux-Montréal.',
    ],
    highlights: ['Climb the 1922 Clock Tower for panoramic river views', 'Rent a pedal-boat or take a sightseeing cruise', 'Skate the Bonsecours Basin rink in winter'],
    tip: 'Arrive at golden hour — the low light on the stone façades is pure magic for photos.',
  },
  'canonical-missing': {
    hero: '/media/media_175631ded1a4aca0f54f0cece60379c817a4d9f6a.jpg',
    intro: 'The green crown of the city, with the best skyline view in Montréal from its famous lookout.',
    prose: [
      'Designed by Frederick Law Olmsted (the landscape architect behind New York’s Central Park), Mount Royal rises right in the middle of the city. The Kondiaronk Belvedere delivers a sweeping panorama of downtown and the river beyond.',
      'Trails wind up through maple forest to Beaver Lake and the chalet, making it a year-round playground for hikers, picnickers and, on Sundays, the drummers of the legendary Tam-Tams.',
    ],
    highlights: ['Take in the city from the Kondiaronk Belvedere', 'Picnic by Beaver Lake', 'Join the Sunday Tam-Tams drum circle'],
    tip: 'The walk up from downtown takes about 30 minutes — wear comfortable shoes.',
  },
  'canonical-cross-domain': {
    hero: '/media/media_1b84dc583fd43369e98ee89b9c7538776123db6bb.jpg',
    intro: 'A Gothic Revival masterpiece whose deep-blue, star-spangled ceiling leaves every visitor speechless.',
    prose: [
      'Step inside Notre-Dame Basilica and the noise of Place d’Armes melts away. The vaulted ceiling glows cobalt blue, scattered with thousands of gold-leaf stars, while intricately carved wood and stained glass tell the story of Montréal.',
      'The basilica’s Casavant organ has more than 7,000 pipes; catch a recital, or experience the immersive Aura light show after dark.',
    ],
    highlights: ['Marvel at the cobalt-and-gold ceiling', 'Hear the 7,000-pipe Casavant organ', 'Book the evening Aura light experience'],
    tip: 'Buy tickets online in advance — queues at the door can be long in peak season.',
  },
  'canonical-different-subdomain': {
    hero: '/media/media_14bb4f2e2b611cc4093929645fb64432ecc4bf6df.jpg',
    intro: 'One of North America’s largest open-air markets — a feast of Québec produce, cheese and maple.',
    prose: [
      'Since 1933, Jean-Talon Market has been the beating culinary heart of Little Italy. Stalls overflow with strawberries, heirloom tomatoes, fresh flowers and just-picked corn from nearby farms.',
      'Ring the market hall for artisan cheese, charcuterie, maple everything and a coffee to fuel your browsing. Come hungry.',
    ],
    highlights: ['Sample Québec artisan cheeses', 'Stock up on maple syrup and treats', 'Grab lunch from a prepared-food vendor'],
    tip: 'Saturday mornings are liveliest — but weekdays are calmer for tasting and chatting with growers.',
  },
  'canonical-wrong-protocol': {
    hero: '/media/media_1168c0057a50398d877e5be84bf9bc621bbca3282.jpg',
    intro: 'Walk through five ecosystems of the Americas — all under one roof, in any weather.',
    prose: [
      'The Biodôme reinvents the old Olympic velodrome as a living museum. In a single loop you pass from a steamy tropical rainforest to the Laurentian maple forest, the Gulf of St. Lawrence and the sub-polar regions.',
      'It’s a hit with families: keep an eye out for sloths, penguins, lynx and a colony of golden lion tamarins.',
    ],
    highlights: ['Meet penguins in the sub-polar zone', 'Spot sloths in the rainforest', 'Great rainy-day option for families'],
    tip: 'Pair your visit with the neighbouring Botanical Garden on a combined Space for Life ticket.',
  },
  'canonical-uppercase-url': {
    hero: '/media/media_14488e1f619774e70a2d323903a6141d51998162b.jpg',
    intro: 'The world’s largest jazz festival turns downtown into one giant open-air stage each summer.',
    prose: [
      'For ten days the Quartier des Spectacles pulses with music. Hundreds of the Festival International de Jazz de Montréal concerts are free and outdoors, drawing crowds of every age beneath the city lights.',
      'Beyond jazz you’ll find blues, funk, world and electronic acts — plus food trucks and a buzzing festival village.',
    ],
    highlights: ['Catch free outdoor headline shows', 'Discover acts in intimate club venues', 'Soak up the festival-village atmosphere'],
    tip: 'Download the festival app to plan around the free outdoor stages.',
  },
  'canonical-relative-url': {
    hero: '/media/media_185d88f9900fd222d3a48cd88bfb3983024c244a1.jpg',
    intro: 'Seventy-five hectares of themed gardens — including a serene Japanese garden and tranquil ponds.',
    prose: [
      'The Montréal Botanical Garden is among the world’s most important, with some thirty themed gardens and ten greenhouses. The Japanese and Chinese gardens are masterclasses in calm, all raked gravel, koi ponds and blazing maples.',
      'Autumn brings the spectacular Gardens of Light lantern festival; spring and summer overflow with blooms.',
    ],
    highlights: ['Wander the Japanese and Chinese gardens', 'Visit the Gardens of Light in autumn', 'Explore ten climate-controlled greenhouses'],
    tip: 'It’s right next to the Biodôme and Olympic Park — easy to combine into one day.',
  },
  'canonical-malformed-url': {
    hero: '/media/media_1eef909691343c1f2e8fa9eb9b5ac40856c73d030.jpg',
    intro: 'Fries, cheese curds and gravy — the ultimate Québec comfort food, and where to find the best.',
    prose: [
      'Poutine is a point of pride in Montréal. The classic is simple — crisp fries, squeaky fresh cheese curds and hot gravy — but the city’s diners and late-night spots riff endlessly with smoked meat, foie gras and more.',
      'It’s the perfect 2 a.m. reward after a night out, or a hearty lunch any day of the week.',
    ],
    highlights: ['Order the classic before trying gourmet versions', 'Look for squeaky-fresh curds', 'Best enjoyed late at night'],
    tip: 'Curds should squeak when you bite them — that’s how you know they’re fresh.',
  },
  'canonical-not-self-referencing': {
    hero: '/media/media_1814baefdf7d4311cbc10cb2bf3f15eda26738a42.jpg',
    intro: 'Montréal embraces winter — skating, snowshoeing and festivals that turn the cold into a celebration.',
    prose: [
      'When the snow falls, the city leans in. Lace up at the outdoor rinks of the Old Port and Beaver Lake, snowshoe across Mount Royal, or join the Fête des Neiges winter carnival.',
      'Warm up afterwards with a hot chocolate or a bowl of poutine — winter here is meant to be enjoyed, not endured.',
    ],
    highlights: ['Skate the Old Port refrigerated rink', 'Snowshoe the trails of Mount Royal', 'Visit the Fête des Neiges festival'],
    tip: 'Dress in layers and pack hand-warmers — January temperatures can dip well below freezing.',
  },
  'canonical-target-4xx': {
    hero: '/media/media_10856fa9620f6fcafc9484f7bc7a90394a462c5c8.jpg',
    intro: '33 kilometres of climate-controlled tunnels connecting the city beneath the streets.',
    prose: [
      'Montréal’s Underground City (RÉSO) is a marvel of winter urban design: a vast network of pedestrian passages linking métro stations, shopping centres, offices and hotels.',
      'On a frigid January day you can shop, dine and explore for hours without ever putting on your coat.',
    ],
    highlights: ['Stay warm shopping in January', 'Connect seamlessly to the métro', 'Explore over 30 km of passages'],
    tip: 'It’s easy to get turned around — follow the RÉSO signage and métro colour codes.',
  },
  'canonical-target-redirect': {
    hero: '/media/media_18cc648a8a46e6119c744c37c3471303a65557bd3.jpg',
    intro: 'Escape the city: the Laurentians, Eastern Townships and Québec City are all an easy drive away.',
    prose: [
      'Within an hour or two of Montréal you can be hiking in the Laurentian mountains, wine-tasting in the Eastern Townships, or wandering the walled streets of Québec City.',
      'Autumn is the showstopper, when the maple forests blaze red and gold along every country road.',
    ],
    highlights: ['Hike or ski in the Laurentians', 'Tour wineries in the Eastern Townships', 'Day-trip to historic Québec City'],
    tip: 'Renting a car gives the most freedom, but coach services run to the main destinations too.',
  },
  'canonical-target-noindex': {
    hero: '/media/media_104b53c7d58a2ab7bb9d8b37a47d5a6ff3abb16dc.jpg',
    intro: 'From Crescent Street bars to Plateau microbreweries, Montréal stays up late and does it with style.',
    prose: [
      'The city’s nightlife is famously diverse: cocktail dens in the Old Port, dance floors downtown, craft-beer taprooms in the Plateau and Mile End, and terraces that spill onto the sidewalks all summer.',
      'Last call is late and the metro runs until past midnight — pace yourself.',
    ],
    highlights: ['Sip craft beer in the Plateau', 'Find hidden cocktail bars downtown', 'Enjoy summer terrasses late into the night'],
    tip: 'Many bars have no cover before 10 p.m. — arrive early to skip the line.',
  },
  'canonical-target-5xx': {
    hero: '/media/media_1376d361a79ef187e554b8fa2e9656fe697eb1866.jpg',
    intro: 'World-class art and history, from the Museum of Fine Arts to Pointe-à-Callière.',
    prose: [
      'The Montréal Museum of Fine Arts anchors a rich cultural scene, its collection spanning old masters to bold contemporary work across several pavilions.',
      'Nearby, Pointe-à-Callière digs into the city’s archaeology, while the McCord Stewart Museum tells Montréal’s social history.',
    ],
    highlights: ['Explore the Museum of Fine Arts pavilions', 'Dig into history at Pointe-à-Callière', 'See Montréal life at the McCord Stewart'],
    tip: 'The Museum of Fine Arts’ permanent collection is free to visit year-round.',
  },
  'canonical-multiple-tags': {
    hero: '/media/media_1e2e9c65a40a2e37e0723d35e4eba9b2c8c66f0d0.jpg',
    intro: 'Plateau-Mont-Royal, Mile End, Griffintown and Little Italy — each neighbourhood has its own soul.',
    prose: [
      'Montréal is a city of villages. The Plateau is all colourful triplexes and exterior spiral staircases; Mile End hums with indie cafés and studios; Griffintown is the sleek, fast-rising waterfront district.',
      'Wander on foot to feel the shift in mood, murals and menus from one block to the next.',
    ],
    highlights: ['Photograph the Plateau’s spiral staircases', 'Café-hop through Mile End', 'See street art across the city'],
    tip: 'The MURAL festival in June leaves world-class street art all over Boulevard Saint-Laurent.',
  },
  'canonical-conflicting-tags': {
    hero: '/media/media_16611b89c5b2b75c19b90c552e5addcf955641336.jpg',
    intro: 'Bagels, smoked meat and a fearless dining scene make Montréal one of the great food cities.',
    prose: [
      'The rivalries are legendary: wood-fired Montréal bagels versus the rest of the world, and towering smoked-meat sandwiches piled high on rye.',
      'Beyond the classics, a new generation of chefs has made the city a destination for adventurous, market-driven cooking.',
    ],
    highlights: ['Try a wood-fired Montréal bagel', 'Order smoked meat on rye', 'Book a tasting menu from a rising chef'],
    tip: 'Bagels are best straight from the oven — the famous shops bake around the clock.',
  },
  'canonical-outside-head': {
    hero: '/media/media_1ac23f4b27a4023510e07fefb473059a2b773ed6a.jpg',
    intro: 'Grab a BIXI share bike and roll along 900 km of bike paths, including the scenic Lachine Canal.',
    prose: [
      'Montréal is one of North America’s most bike-friendly cities. The BIXI bike-share network has thousands of bikes at hundreds of stations, so you can pick one up and drop it off almost anywhere.',
      'The flat, car-free Lachine Canal path is the perfect first ride, leading from downtown to the Atwater Market.',
    ],
    highlights: ['Ride the car-free Lachine Canal path', 'Pick up a BIXI at any station', 'Pedal to the Atwater Market for lunch'],
    tip: 'BIXI day passes are great value — and the first 30 minutes of each trip are included.',
  },
  'canonical-no-href': {
    hero: '/media/media_1ca5eeb39b437c955823e4a839d3acee08097a6b7.jpg',
    intro: 'Montréal is the festival capital of Canada — there’s something on almost every week.',
    prose: [
      'From Just for Laughs and Osheaga to the MURAL street-art festival and Igloofest in the dead of winter, the city’s calendar never really stops.',
      'Most summer festivals centre on the Quartier des Spectacles, with free outdoor programming alongside ticketed headliners.',
    ],
    highlights: ['Laugh at Just for Laughs in July', 'Dance at Osheaga', 'Brave the cold at Igloofest'],
    tip: 'Check the Quartier des Spectacles calendar — free events run all summer long.',
  },
  'canonical-empty-href': {
    hero: '/media/media_170cb72b7d021a9569dd77b53e4cde3af74ea8873.jpg',
    intro: 'From boutique hotels in Old Montréal to cosy Plateau guesthouses, find your perfect base.',
    prose: [
      'Where you stay shapes your trip. Old Montréal puts you among cobblestones and boutique hotels in converted heritage buildings; downtown is handy for shopping and nightlife; the Plateau offers charming, local-feeling apartments.',
      'Book ahead for summer festival season and the autumn foliage weeks, when rooms fill fast.',
    ],
    highlights: ['Splurge on a heritage boutique hotel', 'Stay central downtown for convenience', 'Choose the Plateau for local charm'],
    tip: 'Look for stays near a métro station — it makes exploring car-free a breeze.',
  },
  'canonical-modifier-attribute': {
    hero: '/media/media_179ce9b3cfe7b3848d6538a6a737d8797f00a6d73.jpg',
    intro: 'Getting around, the best seasons to visit and the practical tips that make a Montréal trip easy.',
    prose: [
      'Montréal is compact and walkable, with a clean, efficient métro and bike lanes everywhere. Summer is festival season; autumn dazzles with foliage; winter is cold but magical.',
      'French is the official language, but English is widely spoken and a friendly "bonjour-hi" goes a long way.',
    ],
    highlights: ['Buy a multi-day métro pass', 'Visit in summer for festivals or autumn for colour', 'Learn a few words of French'],
    tip: 'Tipping 15–20% is customary in restaurants, as in the rest of North America.',
  },

  // ---- non-test credibility pages (clean self-ref canonical handled in uploader) ----
  home: {
    hero: '/media/media_1166655c8f737b1d132d4afd4b8a7fec1143113b2.jpg',
    intro: 'Your friendly guide to Canada’s festival city — food, culture, neighbourhoods and joie de vivre.',
    prose: [
      'Montréal mixes European charm with North American energy: cobblestone old quarters, a buzzing café culture, world-class festivals and some of the best eating on the continent.',
      'Use these guides to plan the perfect trip, whatever the season.',
    ],
    highlights: [],
    tip: '',
  },
  about: {
    hero: '/media/media_1795ec0a75285bbf327130acbe669a902e3b13cff.jpg',
    intro: 'We’re a small team of Montréal lovers sharing the city we call home.',
    prose: [
      'Visiting Montréal is an independent travel guide written by locals. We don’t do sponsored fluff — just honest, up-to-date tips on where to go, what to eat and how to get around.',
      'This is a demonstration site, but the love for Montréal is real.',
    ],
    highlights: ['Written by locals', 'Independent and ad-free', 'Updated for every season'],
    tip: '',
  },
  contact: {
    hero: '/media/media_184210deb65907c3edd4fa9656712f55337903bbe.jpg',
    intro: 'Questions, tips or corrections? We’d love to hear from you.',
    prose: [
      'Drop us a line at bonjour@visiting-montreal.example and we’ll get back to you. For press and partnership enquiries, use the same address with the subject line "Press".',
      'You can also follow along on social media for the latest from the city.',
    ],
    highlights: ['Email: bonjour@visiting-montreal.example', 'Follow us on Instagram and Facebook', 'We reply within a few days'],
    tip: '',
  },
};
