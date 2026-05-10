/**
 * Short learner notes keyed by exact Whisper token text (trimmed).
 * Where a safe suffix rule fits, we fall through to RULES below.
 */
const EXACT: Record<string, string> = {
  그치지:
    '그치다 “stop / be over” stem + -지: ties into the following negative (않-) so you hear “that it wouldn’t end”.',
  않기를:
    '않다 “not” + noun-form -기 + object marker 를: the thing hoped for is “(its) not ending”.',
  바랬죠:
    '바라다 “hope / wish”, past tense + -죠: gentle “…you know / …right?” coloring.',
  바래왔었죠:
    '바래 오다 style verb stacked with past (-았었-) + -죠 — “had kept hoping” nuance.',
  그려왔던:
    '그리다 “draw / picture” + auxiliary 오다 + retrospective -던: “that I used to keep picturing”.',
  적시는:
    '적시다 “get wet / soak” + modifier -는 describing the rain that follows.',
  아니길:
    '아니 “not be” + ending wish-pattern -길: “may it not be…”.',
  스며들죠:
    '스며들다 “seep / permeate” + ending -죠 with soft emphasis.',
  내게로:
    '나 “I/me” + 에게 “to (person)” + 로 “toward” → “toward me”.',
  그대:
    'Classic lyrical “you”; pairs with honorifics/context elsewhere in the song.',
  그댈:
    '그대 + object marker 을 (shown here as 를 after vowel).',
  것: 'Blank “thing/clause” pronoun — stands in for an idea just mentioned.',
  걸: 'Spoken shortcut for 것을 (“the thing” + object marker).',
  맘: 'Casual form of 마음 “heart / mind”.',
  선:
    'Here part of 홀로 선… “standing alone”, from 서다 “stand”.',
  하는: '하다 “do” + modifier -는 linking to the next noun (것 etc.).',
  떨어지는: '떨어지다 “fall” + -는: “that falls / falling”.',
  있다는: '있다 “exist” + quotation/linking -다는 pattern tying into 생각 etc.',
  라이브: 'Loanword “live” (performance), pronounced 가까운 영어 리와 비슷하게 들립니다.',
};

type Rule = { re: RegExp; hint: string };

/** Longer / more specific patterns first. */
const RULES: Rule[] = [
  { re: /인데요$/, hint: '이 … 다 copula piece + soft linker 는데 + polite 요 — sets up context (“…and …”).' },
  { re: /였었죠$/, hint: 'Stacked past (-었었-) + soft ending -죠 — stronger “had been …”.' },
  { re: /았었죠$/, hint: 'Stacked past (-았었-) + -죠.' },
  { re: /였죠$/, hint: 'Past marker -였- + -죠.' },
  { re: /았죠$/, hint: 'Past marker -았- + -죠.' },
  { re: /겠죠$/, hint: 'Intent/inference -(으)겠- + -죠.' },
  { re: /습니다$/, hint: 'Formal polite declarative ending (-습니다 / -ㅂ니다 family).' },
  { re: /입니다$/, hint: 'Formal polite copula 이다 “to be”.' },
  { re: /네요$/, hint: '-네요: mild surprise / noticing + polite speech.' },
  { re: /는데요$/, hint: '-는데 background clause + polite 요.' },
  { re: /ㄴ데요$/, hint: 'Variant of 는데요 after vowel-final stems.' },
  { re: /아요$/, hint: 'Informal-polite ending (-아요).' },
  { re: /어요$/, hint: 'Informal-polite ending (-어요).' },
  { re: /해요$/, hint: 'Often 하다 stem + -아요 contracted to 해요.' },
  { re: /할게요$/, hint: 'Intention “I’ll …” pattern + polite 요.' },
  { re: /줄게요$/, hint: '줄 “give” promise nuance + 게요 — “I’ll (do for you)”.' },
  { re: /세요$/, hint: 'Honorific-polite request/command mold (-세요).' },
  { re: /기를$/, hint: 'Verb stem + nounizer -기 + object particle 를.' },
  { re: /도록$/, hint: 'Degree/purpose pattern “so that / to the extent”.' },
  { re: /거나$/, hint: 'Choice pattern “whether … or …”.' },
  { re: /지만$/, hint: 'Contrast “but / although” linker.' },
  { re: /던$/, hint: 'Retrospective modifier -던 — “the … that used to / that I recall”.' },
  { re: /러$/, hint: 'Purpose/intention “in order to …”.' },
  { re: /며$/, hint: 'Listing/linking “while / and” between verbs.' },
  { re: /고$/, hint: 'Verb linker 고 — “and then / and” between clauses.' },
  { re: /게요$/, hint: 'Soft suggestion/inference ending.' },
  { re: /죠$/, hint: 'Ending -죠 — soft confirmation or shared assumption.' },
  { re: /대요$/, hint: 'Quoted speech colloquial ending (“they say …”).' },
  { re: /나요$/, hint: 'Question shape …나요 — asks gently.' },
  { re: /처럼$/, hint: '“Like / as” comparisons.' },
  { re: /까지$/, hint: 'Particle 까지 — “until / as far as”.' },
  { re: /부터$/, hint: 'Particle 부터 — “from / since”.' },
  { re: /에게로$/, hint: '에게 + 로 — motion toward someone.' },
  { re: /에게$/, hint: 'Particle — “to / for” a person.' },
  { re: /에게서$/, hint: 'From (a person) — reverse of 에게.' },
  { re: /에서$/, hint: 'Particle 에서 — site of action (“at/in”).' },
  { re: /으로$/, hint: 'Particle (으)로 — means/instrument/direction.' },
  { re: /와$/, hint: 'Particle 와 — “and / with” nouns.' },
  { re: /과$/, hint: 'Particle 과 — “and / with” nouns.' },
  { re: /의$/, hint: 'Possessive 의 — “of / ’s”.' },
  { re: /만$/, hint: 'Particle 만 — “only”.' },
  { re: /도$/, hint: 'Particle 도 — “also / even”.' },
  { re: /을$/, hint: 'Object particle 을.' },
  { re: /를$/, hint: 'Object particle 를.' },
  { re: /이$/, hint: 'Subject particle 이 (after consonant).' },
  { re: /가$/, hint: 'Subject particle 가 (after vowel).' },
  { re: /은$/, hint: 'Topic/contrast particle 은.' },
  { re: /는$/, hint: 'Topic/contrast particle 는 — marks the phrase it attaches to.' },
];

const FALLBACK =
  'Listen inside the full line: particles glue to the word before them; endings stack after the verb stem. The jamo row above spells each syllable piece-by-piece.';

export function getGrammarHint(word: string): string {
  const w = word.trim();
  const hit = EXACT[w];
  if (hit) return hit;
  for (const { re, hint } of RULES) {
    if (re.test(w)) return hint;
  }
  return FALLBACK;
}
