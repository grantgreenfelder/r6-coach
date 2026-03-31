/**
 * Official operator portrait URLs sourced from Ubisoft's staticctf CDN.
 * Content-addressed URLs — stable until Ubisoft replaces the asset.
 * Keys are lowercase operator names matching the marcopixel icon key format.
 */
const BASE = 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/'

const PORTRAITS = {
  ace:         BASE + '5snW47tH4a5VuPhidr61sm/40b812d32eb85b5c3390865541578bea/r6s-operator-list-ace.png',
  alibi:       BASE + '11nzEgSwdAXLow3kPl0wom/3fdf2b0aa1c1af7ef785d28cf5d80114/r6-operators-list-alibi.png',
  amaru:       BASE + '5jumFHxGXFA7HehPNn0uGD/e00f3d67802944d0c7aba72455e1ba6a/r6-operators-list-amaru.png',
  aruni:       BASE + '4yfuWCW8O4ja2VqR9tXqaE/c8dd123a6405959cf4f091c3854c9d96/r6s-operators-list-aruni.png',
  ash:         BASE + 'QOEBDfqjtUxVBc31l8L9f/4d9b112565baf81d56d69279b95cd463/r6-operators-list-ash_317253.png',
  azami:       BASE + '5M7OGhXfAf5Q0Cdo1YJkRE/2e4c141357cf97d54c6840ee38f6bf76/r6s-operators-list-azami.png',
  bandit:      BASE + '2cFHG0Xk93uoGrm5nTjDPE/2211339df9b36c1b0d9873e480d03fad/r6-operators-list-bandit.png',
  blackbeard:  BASE + '5u6Ak7dkTb4yOjaP1hlGuT/cf52b8e0ac096bf55d764fc8b4fe7f9b/r6s-operators-list-blackbeard.png',
  blitz:       BASE + '4NZvCtXwtcCq1s65H7mK5y/8d70872df8319e1d162a31bbf404ed2c/r6-operators-list-blitz.png',
  brava:       BASE + '7piw6czbaAsv6NnYXtJZay/02683e035ab9481bbe8cbf669113c84d/r6s-operators-list-brava.png',
  buck:        BASE + '3k68pZu62GPbCAFOSCej9a/3c3d3da1f7109a396fb59dcf06c5c4c8/r6-operators-list-buck.png',
  capitao:     BASE + '3AZlhNFA21aKL2MdAIEwa8/abfce9018a7a08c120d707fbc28ae709/r6-operators-list-capitao.png',
  castle:      BASE + '1ETv9XcrmgbAdYWDJ2ZIh0/3f5ad7d030ee411c041c524880176603/r6-operators-list-castle.png',
  caveira:     BASE + '4RZ2Vwk7HozKMCtS5gFMp7/e1b930e3c80590a316939d9df0d88660/r6-operators-list-caveira.png',
  clash:       BASE + '3tTgRbA9GdeLTmI1mPObsp/449b741eaa4f6dd810b8914145de75bb/r6s-operators-list-clash.png',
  deimos:      BASE + '2TV52rbjzuWtMGezWio1ox/2ec949f545995fc79fb3dc393a650992/r6s-operators-list-deimos.png',
  denari:      BASE + '2wBnvKJ86B3QLgkDvGU9Xo/899f89a04b25fd6a7a88b99e53f606fa/r6s-operators-list-denari__2_.png',
  doc:         BASE + '2sCxLIpS9I19PKRz44Phj9/4f96411a556cc41597b8b3e83260cd21/r6-operators-list-doc.png',
  dokkaebi:    BASE + '7fjUupLXClpcdTyqdvPv24/e4492917c18682ef09f9b0445176b2f2/r6-operators-list-dokkaebi.png',
  echo:        BASE + '7MdVMpafww11MfSVMEzyTK/4d4c5d92585c7cf11a28cbf9456e3d9e/r6-operators-list-echo.png',
  ela:         BASE + '6110n4X8KghHzBtPrksrKD/28e78ce725b3d1cd35c6f0967c0524b8/r6-operators-list-ela.png',
  fenrir:      BASE + '336St2UBdDDhJnI1Nbcqo9/845b0822369af2bb64e2ff7f2e7292f9/r6s-operators-list-fenrir.png',
  finka:       BASE + '6VkZ60XV4HWhbQaoMpfjnw/1bd7667a572622371627e90e5e572455/r6-operators-list-finka.png',
  flores:      BASE + '3hXRjYHsrlFOocJjyxyYZY/29eb8f1ad9eab150518a053b775c336f/r6s-operators-list-flores.png',
  frost:       BASE + '33qvDwvWy7y9VGw9k1RYWi/73c4b6e46575b2b649058e2e626c223a/r6-operators-list-frost.png',
  fuze:        BASE + 'BsiNYFp7htro1mOEgiKf1/eef48a78d9a7c1cb2dcac07e1d06edb1/r6-operators-list-fuze.png',
  glaz:        BASE + '6R6uQlUmkh7KYoFYeeGpvj/fb92cfe1a0501d63a0ffa417c004e84e/r6-operators-list-glaz.png',
  goyo:        BASE + '1ylXIr2TxRcFMSKfRhXJXh/5202b0fdfbf43545e8c40a8232a438c3/r6-operators-list-goyo.png',
  gridlock:    BASE + '27gUsHtPmP86NRs4cPug1o/31ea0005ad1afc68a8ebcc477934ded6/r6-operators-list-gridlock.png',
  grim:        BASE + '7fwxcTrdNLQbXkfBJglLaN/38d901042d7debc709c266a46f856d7e/r6s-operators-list-grim.png',
  hibana:      BASE + '7mAs4mz2zA4wjPZsNg6tys/e4fbdbfe20406c2655b56ba420b839aa/r6-operators-list-hibana.png',
  iana:        BASE + '6vES8lEllMwW9OaBYRT7YX/39b5fe90684d7ce637a7d025cdd1ec96/r6s-operator-list-iana.png',
  iq:          BASE + '3lP88YKPk0boUyisZD0LT7/6b3ef86531c459ef9e573f056d6eddf5/r6-operators-list-iq.png',
  jackal:      BASE + 'kbyJly2JDRxFrjFSrptiy/ebbdae24cdfed025b0872742bb6c2a96/r6-operators-list-jackal.png',
  jager:       BASE + '4kMW2lcoewGifRWbvQVjKy/8f974b5d26db81dc823ea602e31d6273/r6-operators-list-jager.png',
  kaid:        BASE + '9ATWPlasUTzxyJMNlV9SM/16dd669d06990b12088660ffc77bd6b3/r6-operators-list-kaid.png',
  kali:        BASE + '41NACeIbkdnIWgnwq0HzD4/9713f8e58b9a8c253b7507b59169bb3c/r6-operators-list-kali_358317.png',
  kapkan:      BASE + '7MofnDHeL1uwsenBVjxplQ/1e5af8fe9cf6f36516c7f6e5d56fcac0/r6-operators-list-kapkan.png',
  lesion:      BASE + '3woPDn0yMuXfkr2RYoymFj/964dfe9277e5299b0125c33b39e165d1/r6-operators-list-lesion.png',
  lion:        BASE + '4wYSIOO4AKq0nw1GbulGns/fcd32bda72facd7062a25ad3764f21e9/r6-operators-list-lion.png',
  maestro:     BASE + '6QNXf9qRkqzOdsprj2SWgI/0c4cc3b9423cada4fed0ba5ae2c9c722/r6-operators-list-maestro.png',
  maverick:    BASE + '1MmaEupq7KOe6it1trqIWP/3f4246349a36e28f4d9299f9368612c1/r6-operators-list-maverick.png',
  melusi:      BASE + '1yoVAGw5rEQ8zPPHoQSDJb/b16a570fadb3342416c5c44847cc651a/r6s-operator-list-melusi.png',
  mira:        BASE + '2Q9Y4UXzkQfECOw5fX3QrI/bfd6532c840cb06a22e0196f2acfc462/r6-operators-list-mira.png',
  montagne:    BASE + '1hxlGxmToB93urkgbIzUvW/fa894cd6ab38358284a3a1858cabbeee/r6-operators-list-montagne.png',
  mozzie:      BASE + '5NwXzotdPIQuvWugaam4JA/eaf8febf1432c5f2f015318c83890d93/r6-operators-list-mozzie_343537.png',
  mute:        BASE + '4BWoDVmdDsgrI071YJwqyF/4bcf11da1e22bda96d130a0f0d4d5b48/r6-operators-list-mute.png',
  nokk:        BASE + 'VeXso9iKMqBDrSmuJ2kBx/b8020ed099ddbdcb31ec809b9d7da152/r6-operators-list-nokk.png',
  nomad:       BASE + '3VHhiyMOUkBOW1u1Zh5eGH/9e603d3e6926fc26ebee494b3040eba7/r6-operators-list-nomad.png',
  oryx:        BASE + '3JBOp3MXgGeuEwyoYrkuMi/b7aa3c4a3fa6f165135954aa30252838/r6s-operator-list-oryx.png',
  osa:         BASE + '3Dg95rvyhPtw588r60vIPM/75e609068a0b205cc4dbc7bf3e517f51/r6s-operators-list-osa.png',
  pulse:       BASE + '1YQb5phSD3uYbWrqhCBJRU/06e5f689777224bf8ca6c7c5cad9db9d/r6-operators-list-pulse.png',
  ram:         BASE + '7uO4bXss6I8nCRVOxYKxEf/5be8def62a24cc353d1342296b9a5f27/r6s-operators-list-ram.png',
  rauora:      BASE + 'hZZ9mtg5oIImOA141Kjbx/3c572164319e7ef0552446d21f191c27/r6s-operators-list-rauora.png',
  rook:        BASE + '1aFTx0BJYAKAnS1vyNA7w6/b4fc6421d382c677aa0197f84131eaa5/r6-operators-list-rook.png',
  sens:        BASE + '1ieRqIy6e47QH48sTp1W4a/59f8188d94ae610bf76da26b4fef0b92/r6s-operators-list-sens.png',
  sentry:      BASE + '1gOsEc5wt8VRtjEupN4TEL/9e8a27ecb654702bae1b07bf124126b1/r6s-operators-list-sentry.png',
  skopos:      BASE + '3lK6qZnfGtclnA6uhyGovV/63e2969f276794c8c240c207c34e41a6/r6s-operators-list-skopos.png',
  sledge:      BASE + '6eIdbZWLBIdtCygNAu9uue/8856e29f0e9ebc3b6ed996223586ebce/r6-operators-list-sledge.png',
  smoke:       BASE + '2Tm9rzdq6j9cpdW9qjnnrw/10d42d14755002e1056d1a940841482c/r6-operators-list-smoke.png',
  solid_snake: BASE + '7vApDDlVt8oDbshANnYbGC/2ba6d3cbd2649979ebbbf9c2ebdb4d7d/r6s-operators-list-solidsnake.png',
  solis:       BASE + '2OV2K9FVqJdSNAogr0Wpod/62f2016a6c660714eb9a3c4a1f8196d4/r6s-operators-list-solis.png',
  striker:     BASE + '17NnCKm86wr8XUEajrYiOz/c971adfefc7e0910a99b3da91a2573e8/r6s-operators-list-striker.png',
  tachanka:    BASE + '5P9kGyOrnsu7lRyr9xC71t/53981da03fa36adf99adf61bc098bd4a/r6s-operators-list-tachanka.png',
  thatcher:    BASE + '5QGPM6l25ybaINnaIaLgvm/338e2b5213ae32fc62f3befcd8526ccc/r6s-operators-list-thatcher.png',
  thermite:    BASE + '3NQW8lJVslVSaYSiBlAleU/09fd8e3e946f2e71f39182b9ff18dd77/r6-operators-list-thermite.png',
  thorn:       BASE + '7LbjnSD3wKQXWhoxSXv3vu/238defac906026c3763e93041e3d96f9/r6s-operators-list-thorn.png',
  thunderbird: BASE + '3gadEIZqtSfsHstfPMe3bz/424c7e4c21276e99f41a8c75478aa5e5/r6s-operators-list-thunderbird.png',
  tubarao:     BASE + '1ceva9aObGqSk9C9UNehdK/8541f4312f3b363c0692b7ce19e40725/r6s-operators-list-tubarao.png',
  twitch:      BASE + 'Z9R1Anc8MHwbG5iyPoOf2/69fe9aee30e03322a4e09d4b87de15aa/r6-operators-list-twitch.png',
  valkyrie:    BASE + '7xN3HJXPLVEmWA9PDnQzTV/613b19a897503161f2cf6fe7bbe3408e/r6-operators-list-valkyrie.png',
  vigil:       BASE + '48ebOPwZWlyktdhawglqlI/819d0565c7f545e97526e4dda0a2f129/r6-operators-list-vigil.png',
  wamai:       BASE + '2ZSUcKWczIo1w2WwzNan5B/98938e59a958117b46901c57fce98ae7/r6-operators-list-wamai_358318.png',
  warden:      BASE + '72pEJEYxwPGoW221XvdmAJ/ea79dbd58064cbc99a1514e1b1641586/r6-operators-list-warden.png',
  ying:        BASE + '36BxtuVTQFrNh2OPyJ2px3/6db32fa8151b9a925acdd65d289bcf0f/r6-operators-list-ying.png',
  zero:        BASE + '24jDQIfDdVMLX5K54pKNe5/58dec3b1e7d32a637bc76560e0cf0385/r6s-operator-list-zero.png',
  zofia:       BASE + 'z60t1OJxJoHqm2zp0t5dL/4acc0904444f43b12a17f6a578322cf9/r6-operators-list-zofia.png',
}

/**
 * Returns the Ubisoft portrait URL for an operator, keyed by lowercase name.
 * Falls back to the marcopixel badge icon if no portrait is found.
 */
export function getPortraitUrl(name) {
  const key = name.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '')
  // Handle Jäger → jager
  const normalized = key.replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u')
  return PORTRAITS[normalized] || PORTRAITS[key] || `https://r6operators.marcopixel.eu/icons/png/${normalized}.png`
}

export default PORTRAITS
