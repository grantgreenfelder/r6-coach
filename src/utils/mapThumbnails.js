const BASE = 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/'

const THUMBNAILS = {
  bank:             BASE + '6ilgtuzucX7hEu2MvjhRtp/c7c7e63cff53c8b2192fdec68a736619/R6S_Maps_Bank_EXT.jpg',
  border:           BASE + '4hqsrL3cokFqedkfjiEaGf/655acbe5ae4ffab54f742d17f929d2af/R6S_Maps_Border_EXT.jpg',
  chalet:           BASE + 'Km3ZJUM7ZMVbGsi6gad5Y/5656a6da468b39f5e8effe5307592f28/R6S_Maps_Chalet_EXT.jpg',
  clubhouse:        BASE + '1vCw5eD2XzxZlv6Au1gtui/06a84bacaacab62937dd6d4d8ae393c7/R6S_Maps_ClubHouse_EXT.jpg',
  coastline:        BASE + '5GfAQ3pXCJnDqiqaDH3Zic/a59f16615dbe5b65bd02669353067620/r6s-maps-coastline-thumb.jpg',
  consulate:        BASE + 'fK2eXk5ne1HUzXkki76qb/54571ed70705051825a70beb2018c5e8/ModernizedMap_Consulate_keyart.jpg',
  emerald_plains:   BASE + '1IGW5GG24TGEv3q8bRc9aJ/a73e0dc1fd385b4afd32cd3a2592a294/r6s_maps_emeraldplains__1_.jpg',
  favela:           BASE + '5x991vPOlYbFlynxn9tmn8/96fac98b7b7f7ae54076e0bbcb4dcc42/r6-maps-favela__1_.jpg',
  fortress:         BASE + '1MrLwvq61aSSvvUj3dDiZg/58bd501d0064d7b453396bb5a2bd56be/fortress-reworked-thumbnail.jpg',
  kafe_dostoyevsky: BASE + '2nIuPSHvbM57TK90VSwBEm/c9b6b012d961c03a930902fb14e36ea1/R6S_Maps_RussianCafe_EXT.jpg',
  kanal:            BASE + '4VHR8uZRGkHqvtZxtmibtc/da988c2cab37f1cb186535fc9ba40bea/r6-maps-kanal.jpg',
  lair:             BASE + '423IqxUqD6yfPEy6CissY0/8fadc01d9fe5ec8695b80be8be9850a7/ModernizedMap_Lair_keyart.jpg',
  nighthaven_labs:  BASE + '57i2PyuzpgVFzOvLUSAItO/97a571fdb6f568ae69951b75f572d361/ModernizedMap_Nighthaven_keyart.jpg',
  oregon:           BASE + 'Z9a0gU7iR0vfcbXtoJUOW/98c0c194937998b8c1310788bd874d57/r6s_maps_oregon_thumbnail.jpg',
  outback:          BASE + '1vqGVW6pqBZlLKp4h86NnB/08a7e337c0cfa604cde79e755fedb397/r6-maps-outback.jpg',
  skyscraper:       BASE + '7vblsbhmSPLsI3pQJ5Dqx9/addc0558833504849fe5ebeafe5fbd5a/skycraper_modernized_keyart.jpg',
  stadium_bravo:    BASE + '4QoneYZ2YonTyI3EcHlEmf/8fbc7c4cef551da319206536ff43ee83/stadiumB_keyart.jpg',
  theme_park:       BASE + '2immPCOZj6tTHMM9zeBg5B/ba237774ba7d2b1e069b6b6065a60207/themepark_modernized_keyart.jpg',
  villa:            BASE + 'Io6dxNeHbCbJoF9WLJf9s/0b9ed52de358585c47c327c46907d1cd/r6s-maps-villa-thumb.jpg',
}

/**
 * Returns the thumbnail URL for a given map name.
 * Normalizes spaces and underscores, lowercases.
 */
export function getMapThumbnailUrl(name) {
  const key = name.toLowerCase().replace(/\s+/g, '_')
  return THUMBNAILS[key] || null
}

export default THUMBNAILS
